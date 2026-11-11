"""回答问题的三组对照（GOALS P35，11-10）：同样 48 个问题（cases/retrieval-v1.jsonl），让模型照 qa.py 的规矩回答，只换“给它哪几条资料”：

- A none：一条资料都不给，只靠模型自己（看它会不会老实说不知道、会不会编）；
- B bm25：关键词找的 4 条（现在 CI、本机默认）；
- C vector：按意思找的 4 条（线上 Modal 用的；11-10 检索跑分里单用它比两样合起来好，见 RESULTS.md）。名单从 eval/retrieval.py
  录好的 recordings/retrieval-<嵌入型号>.jsonl 读，不再调嵌入接口。

每个回答看：
- 答到点子上：用了模型写的回答（不是退回原文摘录、不是“没写”），而且回答里提到了标准答案那条资料的名字；
- 引用对了：模型引用的资料里有标准答案那条；
- 编造被拦下：模型写了资料里没有的时间、数字，被 qa.unsupported 拦下、退回摘录的；
- 模型耗时、估算花费（按付费档标价，免费档实际不花钱）。

    python eval/rag_answers.py --record          # 真调：48 × 3 = 144 次聊天模型（默认 gemini-3.5-flash-lite，免费档）
    python eval/rag_answers.py --replay eval/recordings/rag-answers-gemini-3.5-flash-lite.jsonl   # 回放，不联网
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import statistics
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
os.environ.setdefault("COPILOT_SOURCE", "eval")

from nps_copilot import knowledge, monitor, qa, vectors  # noqa: E402
from nps_copilot.ledger import estimate_tokens  # noqa: E402
from nps_copilot.providers import GeminiProvider, RecordingProvider, ReplayProvider  # noqa: E402
from nps_copilot.text import normalize  # noqa: E402
import tracking  # noqa: E402

CASES = HERE / "cases" / "retrieval-v1.jsonl"
RECORDINGS = HERE / "recordings"
CONFIGS = ("none", "bm25", "vector")


class Counting:
    """包一层，记下每次调用的 token（估算花费用）；B、C 两组找到的资料一样时，提示词也一样，不再调第二次"""

    def __init__(self, inner):
        self.inner, self.name, self.calls, self.seen = inner, getattr(inner, "name", "model"), [], {}

    def complete_json(self, task, system, user, schema):
        key = (task, system, user)
        if key not in self.seen:
            self.seen[key] = self.inner.complete_json(task, system, user, schema)
        completion = self.seen[key]
        meta = completion.meta or {}
        self.calls.append({"model": completion.model, "prompt_tokens": meta.get("prompt_tokens") or estimate_tokens(system + user),
                           "output_tokens": meta.get("output_tokens") or estimate_tokens(completion.raw or json.dumps(completion.data))})
        return completion


def vector_rankings(model: str) -> dict:
    path = RECORDINGS / f"retrieval-{model}.jsonl"
    if not path.exists():
        raise SystemExit(f"没有 {path}：先跑 python eval/retrieval.py --backend gemini --model {model}")
    return {(row["query"], tuple(row["parks"])): row["ranked"]
            for row in (json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip())}


def docs_for(config: str, case: dict, semantic: dict) -> list:
    if config == "none":
        return []
    keyword = knowledge.search(case["query"], case["parks"], k=vectors.DEPTH)
    if config == "bm25":
        return keyword[:4]
    ids = semantic[(case["query"], tuple(case["parks"]))]
    return [doc for doc in (knowledge.get(doc_id) for doc_id in ids) if doc][:4]


def mentions(text: str, relevant: list[str]) -> bool:
    said = normalize(text).lower()
    for doc_id in relevant:
        doc = knowledge.get(doc_id)
        if doc and any(len(name) >= 2 and normalize(name).lower() in said for name in doc.names):
            return True
    return False


def score(rows: list[dict]) -> dict:
    n = len(rows)
    return {
        "on_point": round(sum(r["on_point"] for r in rows) / n, 3),
        "cited_right": round(sum(r["cited_right"] for r in rows) / n, 3),
        "model_answered": round(sum(r["answer"] == "model" for r in rows) / n, 3),
        "blocked_unfaithful": sum(r["answer"] == "fallback" and r.get("fallback") == "unfaithful" for r in rows),
        "median_model_ms": round(statistics.median(r["ms"] for r in rows), 1),
        "cost_per_1000_usd": round(sum(r["cost"] for r in rows) / n * 1000, 4),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cases", type=Path, default=CASES)
    parser.add_argument("--model", default="gemini-3.5-flash-lite", help="回答问题的聊天模型（Gemini）")
    parser.add_argument("--embed-model", default="gemini-embedding-2", help="C 组按意思找的名单用哪个嵌入型号录的")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--record", action="store_true")
    mode.add_argument("--replay", type=Path)
    args = parser.parse_args()
    cases = [json.loads(line) for line in args.cases.read_text(encoding="utf-8").splitlines() if line.strip()]
    semantic = vector_rankings(args.embed_model)
    recording = RECORDINGS / f"rag-answers-{args.model}.jsonl"
    if args.record:
        recording.write_text("", encoding="utf-8")
        provider = Counting(RecordingProvider(GeminiProvider(model=args.model), recording))
    else:
        provider = Counting(ReplayProvider(args.replay))
    price = monitor.list_price(args.model) or (0.0, 0.0)
    runs: dict[str, list[dict]] = {config: [] for config in CONFIGS}
    for case in cases:
        zh = case["kind"] != "english"
        for config in CONFIGS:
            docs = docs_for(config, case, semantic)
            before = len(provider.calls)
            text, trace = qa.answer(case["query"], case["parks"], "", provider, zh, docs=docs)
            call = provider.calls[before] if len(provider.calls) > before else {"prompt_tokens": 0, "output_tokens": 0}
            cited = [trace["retrieved"][i - 1] for i in trace.get("sources", []) if 1 <= i <= len(trace["retrieved"])]
            runs[config].append({
                "id": case["id"], "kind": case["kind"], "query": case["query"], "relevant": case["relevant"],
                "retrieved": trace["retrieved"], "answer": trace.get("answer"), "fallback": trace.get("fallback"),
                "unsupported": trace.get("unsupported", []), "text": text,
                "on_point": trace.get("answer") == "model" and mentions(text, case["relevant"]),
                "cited_right": bool(set(cited) & set(case["relevant"])),
                "ms": trace.get("latency_ms", 0),
                "cost": (call["prompt_tokens"] * price[0] + call["output_tokens"] * price[1]) / 1e6,
            })
        print(f"\r{case['id']}", end="", flush=True)
    print()
    kinds = sorted({case["kind"] for case in cases})
    table = {config: {"all": score(rows), **{kind: score([r for r in rows if r["kind"] == kind]) for kind in kinds}}
             for config, rows in runs.items()}
    label = {"none": "A 不给资料", "bm25": "B 关键词", "vector": "C 按意思找"}
    for config, by_kind in table.items():
        m = by_kind["all"]
        print(f"{label[config]:12} 答到点子上 {m['on_point']:.2f}  引用对了 {m['cited_right']:.2f}  用了模型的回答 {m['model_answered']:.2f}  "
              f"编造被拦 {m['blocked_unfaithful']}  模型耗时中位 {m['median_model_ms']:.0f} ms  每千次 ${m['cost_per_1000_usd']:.3f}")
        print("             " + "  ".join(f"{kind} {by_kind[kind]['on_point']:.2f}" for kind in kinds))
    reports = HERE / "reports"
    reports.mkdir(exist_ok=True)
    out = reports / f"{dt.datetime.now().strftime('%Y%m%dT%H%M%S')}-rag-answers-{args.model}.json"
    out.write_text(json.dumps({"model": args.model, "embed_model": args.embed_model, "replay": bool(args.replay), "table": table, "runs": runs},
                              ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"报告：{out}")
    for config, by_kind in table.items():
        flat = {f"{kind}_{key}": value for kind, m in by_kind.items() for key, value in m.items()}
        tracking.log("回答问题（RAG 对照）", f"{args.cases.stem} · {config}", {"config": config, "model": args.model,
                                                                         "embed_model": args.embed_model, "replay": bool(args.replay)}, flat, out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
