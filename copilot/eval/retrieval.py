"""检索对照实验（GOALS P7、P35 的“只加检索”对照）：回答问题前在网站资料（knowledge.jsonl，约 2000 条）里找几条交给模型，
拿同样的问题比几种找法：

- bm25：关键词（名字命中 + BM25，knowledge.search），CI 和默认都用它；
- vector：按意思找；
- hybrid：两份名单按 RRF（倒数排名融合）合起来（vectors.fuse）。

按意思找有两种后端：
- --backend gemini（11-10）：线上用的那套。Gemini 嵌入接口 + Neon 的 pgvector（vectors.py），先跑 python -m nps_copilot vectors sync
  把资料的向量写进 Neon。每个问题按意思找到的名单录进 recordings/retrieval-<型号>.jsonl，--replay 读它，不联网（CI 门禁）；
- --backend ollama（10-22 的实验）：本机 Ollama 的 bge-m3 + Chroma（要 pip install "copilot[experiments]"、ollama pull bge-m3）。

都只在这次行程的公园（加上问题里点名的公园）和不分公园的资料里找，和回答问题时一样。
题目和标准答案在 cases/retrieval-v1.jsonl（先提交、再第一次跑）：点名的、不点名只描述的、英文的各 16 个。
指标：第 1 条就对的比例（recall@1）、前 5 条里有对的（recall@5，回答问题实际给模型 4 条）、MRR@10、耗时中位数。

    python eval/retrieval.py --backend gemini --model gemini-embedding-001        # 真调：48 次嵌入接口 + 48 次查 Neon，录下来
    python eval/retrieval.py --replay eval/recordings/retrieval-gemini-embedding-001.jsonl --gate eval/baseline-retrieval.json
    python eval/retrieval.py --backend ollama                                       # 10-22 的 bge-m3 + Chroma
    COPILOT_MLFLOW=1 python eval/retrieval.py ...                                   # 同时记到 MLflow
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import statistics
import sys
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
# 计费总账（nps_copilot/ledger.py）里记成“评测”调用的
os.environ.setdefault("COPILOT_SOURCE", "eval")

from nps_copilot import knowledge, vectors  # noqa: E402
from nps_copilot.catalog import ROOT  # noqa: E402
import tracking  # noqa: E402

OLLAMA = os.environ.get("OLLAMA_HOST_URL", "http://127.0.0.1:11435").rstrip("/")
OLLAMA_MODEL = os.environ.get("COPILOT_OLLAMA_EMBED_MODEL", "bge-m3")
CHROMA = Path(os.environ.get("COPILOT_CHROMA", ROOT / "copilot" / "data" / "chroma"))
KNOWLEDGE = ROOT / "copilot" / "contracts" / "knowledge.jsonl"
CASES = HERE / "cases" / "retrieval-v1.jsonl"
RECORDINGS = HERE / "recordings"
DEPTH = 10


# ---- 10-22：本机 Ollama bge-m3 + Chroma ----

def ollama_embed(texts: list[str]) -> list[list[float]]:
    body = json.dumps({"model": OLLAMA_MODEL, "input": texts}).encode("utf-8")
    request = urllib.request.Request(f"{OLLAMA}/api/embed", data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=300) as response:
        return json.loads(response.read())["embeddings"]


def chroma_collection():
    """Chroma 的资料库：资料（knowledge.jsonl）变了就重建（按文件内容的 hash 认）"""
    import hashlib

    import chromadb

    raw = KNOWLEDGE.read_bytes()
    version = hashlib.sha256(raw + OLLAMA_MODEL.encode()).hexdigest()[:12]
    client = chromadb.PersistentClient(path=str(CHROMA))
    name = f"knowledge-{OLLAMA_MODEL.replace(':', '-')}-{version}"
    existing = [c.name for c in client.list_collections()]
    if name in existing:
        return client.get_collection(name)
    for old in existing:
        if old.startswith("knowledge-"):
            client.delete_collection(old)
    docs = [json.loads(line) for line in raw.decode("utf-8").splitlines() if line.strip()]
    store = client.create_collection(name, metadata={"hnsw:space": "cosine"})
    start = time.perf_counter()
    for i in range(0, len(docs), 32):
        batch = docs[i : i + 32]
        texts = [f"{doc['title']}。{doc['text']}"[:1200] for doc in batch]
        store.add(ids=[doc["id"] for doc in batch], embeddings=ollama_embed(texts), documents=texts,
                  metadatas=[{"park": doc.get("park") or "", "type": doc["type"]} for doc in batch])
        print(f"\r建向量库 {min(i + 32, len(docs))}/{len(docs)}", end="", flush=True)
    print(f"，用了 {time.perf_counter() - start:.0f} 秒")
    return store


def ollama_search():
    store = chroma_collection()

    def search(query: str, parks: list[str]) -> list[str]:
        # 范围是空的就不限公园（和 knowledge.search、NeonStore.nearest 一样）；有范围时再加上不分公园的资料
        scope = knowledge.scope(query, parks)
        where = {"where": {"park": {"$in": [*scope, ""]}}} if scope else {}
        found = store.query(query_embeddings=ollama_embed([query]), n_results=DEPTH, **where)
        return found["ids"][0]
    return search


# ---- 11-10：Gemini 嵌入接口 + Neon pgvector（线上用的） ----

def gemini_search(model: str, recording: Path):
    from nps_copilot.embeddings import GeminiEmbedder

    url = vectors.database_url()
    if not url:
        raise SystemExit("没有 DATABASE_URL（.env.local），先在 Neon 建好库：python -m nps_copilot vectors sync")
    store = vectors.NeonStore(url)
    embedder = GeminiEmbedder(model=model)
    recording.parent.mkdir(parents=True, exist_ok=True)
    recording.write_text("", encoding="utf-8")

    def search(query: str, parks: list[str]) -> list[str]:
        ranked = store.nearest(model, embedder.query(query), knowledge.scope(query, parks), k=vectors.DEPTH)
        with recording.open("a", encoding="utf-8", newline="\n") as handle:
            handle.write(json.dumps({"query": query, "parks": parks, "ranked": ranked}, ensure_ascii=False) + "\n")
        return ranked
    return search


def replay_search(path: Path):
    if not path.exists():
        raise SystemExit(f"回放文件不存在：{path}")
    rows = {(row["query"], tuple(row["parks"])): row["ranked"]
            for row in (json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip())}
    # 录音里的资料现在还在不在：资料删了、改了 id，线上（vectors.retrieve）就找不回来，回放还算命中就不对了
    gone = sorted({doc_id for ranked in rows.values() for doc_id in ranked if knowledge.get(doc_id) is None})
    if gone:
        raise SystemExit(f"回放记录里有 {len(gone)} 条资料现在已经没有了（{', '.join(gone[:5])}…），资料改过要重新录：--backend gemini")

    def search(query: str, parks: list[str]) -> list[str]:
        key = (query, tuple(parks))
        if key not in rows:
            raise SystemExit(f"回放记录里没有这个问题（{query[:30]}），题目改了要重新录：--backend gemini")
        return rows[key]
    return search


def metrics(rows: list[dict]) -> dict:
    def first_hit(row):
        return next((rank for rank, doc_id in enumerate(row["ranked"]) if doc_id in row["relevant"]), None)

    hits = [first_hit(row) for row in rows]
    return {
        "recall_at_1": round(sum(h == 0 for h in hits) / len(rows), 3),
        "recall_at_5": round(sum(h is not None and h < 5 for h in hits) / len(rows), 3),
        "mrr_at_10": round(sum(1 / (h + 1) for h in hits if h is not None) / len(rows), 3),
        "median_ms": round(statistics.median(row["ms"] for row in rows), 1),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cases", type=Path, default=CASES)
    parser.add_argument("--backend", choices=["gemini", "ollama"], default="gemini")
    parser.add_argument("--model", default="gemini-embedding-001", help="--backend gemini 用哪个嵌入型号")
    parser.add_argument("--replay", type=Path, help="按意思找的名单从录音读（不联网）；关键词照样现算")
    parser.add_argument("--gate", type=Path, help="成绩低于基线（recall@5、MRR@10）就以非 0 退出")
    args = parser.parse_args()
    cases = [json.loads(line) for line in args.cases.read_text(encoding="utf-8").splitlines() if line.strip()]
    if args.replay:
        semantic_search, label = replay_search(args.replay), args.replay.stem.removeprefix("retrieval-")
    elif args.backend == "gemini":
        recording = RECORDINGS / f"retrieval-{args.model}.jsonl"
        semantic_search, label = gemini_search(args.model, recording), args.model
    else:
        semantic_search, label = ollama_search(), OLLAMA_MODEL
    runs: dict[str, list[dict]] = {"bm25": [], "vector": [], "hybrid": []}
    for case in cases:
        t = time.perf_counter()
        keyword = [doc.id for doc in knowledge.search(case["query"], case["parks"], k=vectors.DEPTH)]
        t_keyword = (time.perf_counter() - t) * 1000
        t = time.perf_counter()
        semantic = semantic_search(case["query"], case["parks"])
        t_vector = (time.perf_counter() - t) * 1000 if not args.replay else 0.0
        for name, ranked, ms in (("bm25", keyword[:DEPTH], t_keyword), ("vector", semantic[:DEPTH], t_vector),
                                 ("hybrid", vectors.fuse(keyword, semantic)[:DEPTH], t_keyword + t_vector)):
            runs[name].append({"id": case["id"], "kind": case["kind"], "query": case["query"], "relevant": case["relevant"],
                               "ranked": ranked, "ms": ms})
    kinds = sorted({case["kind"] for case in cases})
    table = {name: {"all": metrics(rows), **{kind: metrics([r for r in rows if r["kind"] == kind]) for kind in kinds}}
             for name, rows in runs.items()}
    names = {"named": "点名的", "vague": "不点名的", "english": "英文的", "all": "全部"}
    print(f"按意思找：{label}{'（回放）' if args.replay else ''}")
    print(f"{'':8}" + "".join(f"{names.get(k, k):>22}" for k in ["all", *kinds]))
    for name, by_kind in table.items():
        print(f"{name:8}" + "".join(f"  R@1 {m['recall_at_1']:.2f} R@5 {m['recall_at_5']:.2f}" for m in (by_kind[k] for k in ["all", *kinds])))
    print("（R@1：第 1 条就对；R@5：前 5 条里有对的。MRR@10 和耗时见报告）")
    for name in ("bm25", "vector", "hybrid"):
        misses = [r["id"] for r in runs[name] if not set(r["ranked"][:5]) & set(r["relevant"])]
        print(f"{name} 前 5 条没找到的：{', '.join(misses) or '无'}")
    reports = HERE / "reports"
    reports.mkdir(exist_ok=True)
    # 回放的报告名里带 replay_<录音名>，PR 评论的成绩表（pr_summary.py）按它找
    tail = f"replay_{args.replay.stem}" if args.replay else label.replace(":", "_")
    out = reports / f"{dt.datetime.now().strftime('%Y%m%dT%H%M%S')}-retrieval-{tail}.json"
    out.write_text(json.dumps({"embed_model": label, "replay": bool(args.replay), "cases_file": args.cases.name, "table": table, "runs": runs},
                              ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"报告：{out}")
    for name, by_kind in table.items():
        flat = {f"{kind}_{key}": value for kind, m in by_kind.items() for key, value in m.items()}
        tracking.log("检索（retrieval）", f"{args.cases.stem} · {name} · {label}",
                     {"method": name, "embed_model": label if name != "bm25" else "-", "cases_file": args.cases.name,
                      "replay": bool(args.replay)}, flat, out)
    if args.gate:
        floor = json.loads(args.gate.read_text(encoding="utf-8"))
        failed = [f"{method} {key} {table[method]['all'][key]} < {minimum}"
                  for method, limits in floor["min"].items() for key, minimum in limits.items() if table[method]["all"][key] < minimum]
        if failed:
            print("检索门禁没过：" + "；".join(failed))
            return 1
        print("检索门禁通过")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
