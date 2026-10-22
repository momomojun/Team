"""检索对照实验（计划书写的 Chroma 向量检索；GOALS P35 的“只加检索”对照，10-22）：
回答问题前在网站资料（knowledge.jsonl，约 2000 条）里找几条交给模型。现在用的是关键词（名字命中 + BM25，knowledge.py），
这里拿同样的问题比三种找法：

- bm25：现在的做法；
- vector：Chroma 向量库，资料和问题都用本机 Ollama 的 bge-m3（中英文都行的嵌入模型）变成向量，按相似度找；
- hybrid：两种的排名按 RRF（倒数排名融合）合起来。

都只在这次行程的公园（加上问题里点名的公园）和不分公园的资料（片区、州、机场）里找，和 qa.py 一样。
题目和标准答案在 cases/retrieval-v1.jsonl（先提交、再第一次跑）：点名的、不点名只描述的、英文的各 16 个。
指标：第 1 条就对的比例（recall@1）、前 5 条里有对的（recall@5，qa.py 实际给模型 4 条）、MRR@10。

    python eval/retrieval.py            # 第一次会把 2000 条资料变成向量存进 copilot/data/chroma/（几分钟，之后直接用）
    COPILOT_MLFLOW=1 python eval/retrieval.py   # 同时记到 MLflow

要 chromadb（pip install "copilot[experiments]"）和开着的 Ollama（ollama pull bge-m3）。只是对照实验，Copilot 照旧用 BM25。
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

from nps_copilot import catalog, knowledge  # noqa: E402
from nps_copilot.catalog import ROOT  # noqa: E402
import tracking  # noqa: E402

OLLAMA = os.environ.get("OLLAMA_HOST_URL", "http://127.0.0.1:11435").rstrip("/")
MODEL = os.environ.get("COPILOT_EMBED_MODEL", "bge-m3")
CHROMA = Path(os.environ.get("COPILOT_CHROMA", ROOT / "copilot" / "data" / "chroma"))
KNOWLEDGE = ROOT / "copilot" / "contracts" / "knowledge.jsonl"
CASES = HERE / "cases" / "retrieval-v1.jsonl"
DEPTH = 10
RRF_K = 60


def embed(texts: list[str]) -> list[list[float]]:
    body = json.dumps({"model": MODEL, "input": texts}).encode("utf-8")
    request = urllib.request.Request(f"{OLLAMA}/api/embed", data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=300) as response:
        return json.loads(response.read())["embeddings"]


def collection():
    """Chroma 的资料库：资料（knowledge.jsonl）变了就重建（按文件内容的 hash 认）"""
    import hashlib

    import chromadb

    raw = KNOWLEDGE.read_bytes()
    version = hashlib.sha256(raw + MODEL.encode()).hexdigest()[:12]
    client = chromadb.PersistentClient(path=str(CHROMA))
    name = f"knowledge-{MODEL.replace(':', '-')}-{version}"
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
        store.add(ids=[doc["id"] for doc in batch], embeddings=embed(texts), documents=texts,
                  metadatas=[{"park": doc.get("park") or "", "type": doc["type"]} for doc in batch])
        print(f"\r建向量库 {min(i + 32, len(docs))}/{len(docs)}", end="", flush=True)
    print(f"，用了 {time.perf_counter() - start:.0f} 秒")
    return store


def scope(query: str, parks: list[str]) -> list[str]:
    """和 knowledge.search 一样：这次行程的公园 + 问题里点名的公园"""
    named = [code for code, _ in catalog.find_all(query, catalog.parks())]
    return sorted({*parks, *named})


def bm25(query: str, parks: list[str]) -> list[str]:
    return [doc.id for doc in knowledge.search(query, parks, k=DEPTH)]


def vector(store, query: str, parks: list[str]) -> list[str]:
    allowed = [*scope(query, parks), ""]
    found = store.query(query_embeddings=embed([query]), n_results=DEPTH, where={"park": {"$in": allowed}})
    return found["ids"][0]


def hybrid(first: list[str], second: list[str]) -> list[str]:
    score: dict[str, float] = {}
    for ranked in (first, second):
        for rank, doc_id in enumerate(ranked):
            score[doc_id] = score.get(doc_id, 0) + 1 / (RRF_K + rank + 1)
    return sorted(score, key=score.get, reverse=True)[:DEPTH]


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
    args = parser.parse_args()
    cases = [json.loads(line) for line in args.cases.read_text(encoding="utf-8").splitlines() if line.strip()]
    store = collection()
    runs: dict[str, list[dict]] = {"bm25": [], "vector": [], "hybrid": []}
    for case in cases:
        t = time.perf_counter()
        keyword = bm25(case["query"], case["parks"])
        t_keyword = (time.perf_counter() - t) * 1000
        t = time.perf_counter()
        semantic = vector(store, case["query"], case["parks"])
        t_vector = (time.perf_counter() - t) * 1000
        for name, ranked, ms in (("bm25", keyword, t_keyword), ("vector", semantic, t_vector),
                                 ("hybrid", hybrid(keyword, semantic), t_keyword + t_vector)):
            runs[name].append({"id": case["id"], "kind": case["kind"], "query": case["query"], "relevant": case["relevant"],
                               "ranked": ranked, "ms": ms})
    kinds = sorted({case["kind"] for case in cases})
    table = {name: {"all": metrics(rows), **{kind: metrics([r for r in rows if r["kind"] == kind]) for kind in kinds}}
             for name, rows in runs.items()}
    label = {"named": "点名的", "vague": "不点名的", "english": "英文的", "all": "全部"}
    print(f"\n{'':8}" + "".join(f"{label[k]:>22}" for k in ["all", *kinds]))
    for name, by_kind in table.items():
        print(f"{name:8}" + "".join(f"  R@1 {m['recall_at_1']:.2f} R@5 {m['recall_at_5']:.2f}" for m in (by_kind[k] for k in ["all", *kinds])))
    print("（R@1：第 1 条就对；R@5：前 5 条里有对的。MRR@10 和耗时见报告）")
    for name in ("bm25", "vector"):
        misses = [r["id"] for r in runs[name] if not set(r["ranked"][:5]) & set(r["relevant"])]
        print(f"{name} 前 5 条没找到的：{', '.join(misses) or '无'}")
    reports = HERE / "reports"
    reports.mkdir(exist_ok=True)
    out = reports / f"{dt.datetime.now().strftime('%Y%m%dT%H%M%S')}-retrieval-{MODEL.replace(':', '_')}.json"
    out.write_text(json.dumps({"model": MODEL, "cases_file": args.cases.name, "table": table, "runs": runs}, ensure_ascii=False, indent=1),
                   encoding="utf-8")
    print(f"报告：{out}")
    for name, by_kind in table.items():
        flat = {f"{kind}_{key}": value for kind, m in by_kind.items() for key, value in m.items()}
        tracking.log("检索（retrieval）", f"{args.cases.stem} · {name}", {"method": name, "embed_model": MODEL if name != "bm25" else "-",
                                                                         "cases_file": args.cases.name}, flat, out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
