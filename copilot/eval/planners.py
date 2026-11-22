"""排行程这条路的三组对照（计划书 §8 目标 4，GOALS P35）：同样 30 条行程请求，

- A 只靠模型：把条件写成一句话交给模型，让它直接排每天去哪（不给资料）；
- B 模型 + 检索：同一句话，再给它这几座公园的景点资料（和网站同一份：开放月份、停留多久、要不要抽签、开放时间、适不适合同行的人）；
- C 完整系统：同样的条件交给行程引擎（plan_trip，确定的代码，不调模型）。

三组用同一套规则打分（scripts/compare-planners-lib.mjs）：对不上景点库或者不在要去的公园、重复、那个月去不了、
要抽签、时间排不开、一天太满、不适合同行的人、没照用户说的做（天数、点名要去 / 不去、节奏）。看：
全对的行程比例、平均每条几处违规、每 100 站几处、耗时中位数和 p95、按付费档标价折算每千次的花费。

    python eval/planners.py --record        # 真调：30 × 2 = 60 次聊天模型（默认 gemini-3.5-flash-lite，免费档）
    python eval/planners.py --replay eval/recordings/planners-gemini-3.5-flash-lite.jsonl   # 回放，不联网
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import statistics
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE.parent))
os.environ.setdefault("COPILOT_SOURCE", "eval")

from nps_copilot import data_version, monitor  # noqa: E402
from nps_copilot.providers import GeminiProvider, ProviderError, RecordingProvider, ReplayProvider  # noqa: E402
from rag_answers import Counting  # noqa: E402
import tracking  # noqa: E402

RECORDINGS = HERE / "recordings"
CASES = 30
SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["days"],
    "properties": {"days": {"type": "array", "minItems": 1, "maxItems": 14, "items": {
        "type": "object", "additionalProperties": False, "required": ["stops"],
        "properties": {"stops": {"type": "array", "maxItems": 12, "items": {"type": "string", "minLength": 1, "maxLength": 80}}},
    }}},
}
SYSTEM = (
    "你是美国国家公园的行程规划师。按用户的条件，排出每天按顺序去的景点。"
    "只排景点，不写住宿、吃饭、开车；景点写中文名，后面括号写英文名。天数要和用户说的一样。"
    "用 JSON 回答：{\"days\": [{\"stops\": [\"景点\", …]}, …]}"
)
SYSTEM_WITH_DATA = SYSTEM + "下面会给这几座公园的景点资料，只能从资料里挑，注意开放月份、开放时间、要不要抽签、适不适合同行的人。"
LABEL = {"A": "A 只靠模型", "B": "B 模型 + 景点资料", "C": "C 完整系统（行程引擎）"}


def node(*args: str, stdin: str | None = None) -> object:
    completed = subprocess.run(
        ["node", "--disable-warning=ExperimentalWarning", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
         "--import", "./tests/register.mjs", "scripts/compare-planners.mjs", *args],
        cwd=ROOT, input=stdin.encode("utf-8") if stdin is not None else None, capture_output=True, timeout=600,
    )
    if completed.returncode != 0:
        raise SystemExit(completed.stderr.decode("utf-8", "replace")[-800:])
    return json.loads(completed.stdout.decode("utf-8"))


def percentile(values: list[float], q: float) -> float:
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, max(0, round(q * (len(ordered) - 1))))]


def summarize(rows: list[dict]) -> dict:
    n = len(rows)
    stops = sum(r["score"]["stops"] for r in rows) or 1
    kinds: dict[str, int] = {}
    for r in rows:
        for kind, items in r["score"]["problems"].items():
            kinds[kind] = kinds.get(kind, 0) + len(items)
    ms = [r["ms"] for r in rows]
    return {
        "trips": n,
        "clean_rate": round(sum(r["score"]["clean"] for r in rows) / n, 3),
        "violations_per_trip": round(sum(r["score"]["violations"] for r in rows) / n, 2),
        "violations_per_100_stops": round(sum(r["score"]["violations"] for r in rows) / stops * 100, 1),
        "stops_per_trip": round(stops / n, 1),
        # 对不上景点库的（可能是真的地方、我们没收录，也可能是编的），不算违规
        "unmatched_per_100_stops": round(sum(r["score"].get("unmatched", 0) for r in rows) / stops * 100, 1),
        "p50_ms": round(statistics.median(ms), 1),
        "p95_ms": round(percentile(ms, 0.95), 1),
        "cost_per_1000_usd": round(sum(r.get("cost", 0) for r in rows) / n * 1000, 4),
        "kinds": kinds,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cases", type=int, default=CASES)
    parser.add_argument("--model", default="gemini-3.5-flash-lite")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--record", action="store_true")
    mode.add_argument("--replay", type=Path)
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    cases = node("cases", str(args.cases))
    if args.record:
        recording = RECORDINGS / f"planners-{args.model}.jsonl"
        recording.write_text("", encoding="utf-8")
        provider = Counting(RecordingProvider(GeminiProvider(model=args.model, max_tokens=2048), recording))
    else:
        provider = Counting(ReplayProvider(args.replay))
    price = monitor.list_price(args.model) or (0.0, 0.0)

    runs: dict[str, list[dict]] = {"A": [], "B": []}
    to_score = []
    for case in cases:
        for config in ("A", "B"):
            system = SYSTEM if config == "A" else SYSTEM_WITH_DATA
            user = case["prompt"] if config == "A" else f"{case['prompt']}\n\n景点资料：\n{case['catalog']}"
            before = len(provider.calls)
            try:
                completion = provider.complete_json(f"planner_{config.lower()}", system, user, SCHEMA)
                days = [day.get("stops", []) for day in completion.data.get("days", [])]
                ms, error = completion.latency_ms, None
            except ProviderError as failure:  # 模型出错、输出不是 JSON：算这条没排出来（每天都空）
                days, ms, error = [[] for _ in range(case["request"]["days"])], 0, str(failure)[:200]
            call = provider.calls[before] if len(provider.calls) > before else {"prompt_tokens": 0, "output_tokens": 0}
            runs[config].append({"id": case["id"], "days": days, "ms": ms, "error": error,
                                 "cost": (call["prompt_tokens"] * price[0] + call["output_tokens"] * price[1]) / 1e6})
            to_score.append({"key": f"{config}:{case['id']}", "id": case["id"], "request": case["request"], "days": days})
        print(f"\r{case['id']:<14}", end="", flush=True)
    print()
    scored = node("score", stdin=json.dumps(to_score, ensure_ascii=False))
    for item, result in zip(to_score, scored):
        config = item["key"].split(":")[0]
        next(r for r in runs[config] if r["id"] == item["id"])["score"] = result["score"]
    runs["C"] = [{"id": r["id"], "days": r["days"], "ms": r["ms"], "cost": 0.0, "score": r["score"]} for r in node("engine", str(args.cases))]

    table = {config: summarize(rows) for config, rows in runs.items()}
    for config, m in table.items():
        print(f"{LABEL[config]:20} 全对 {m['clean_rate']:.0%}  每条 {m['violations_per_trip']:.2f} 处违规  每 100 站 {m['violations_per_100_stops']:.1f}  "
              f"每条 {m['stops_per_trip']:.1f} 站（每 100 站 {m['unmatched_per_100_stops']:.0f} 站对不上景点库）  耗时中位 {m['p50_ms']:.0f} ms / p95 {m['p95_ms']:.0f} ms  每千次 ${m['cost_per_1000_usd']:.3f}")
        print("    " + "  ".join(f"{kind} {count}" for kind, count in m["kinds"].items() if count))
    reports = HERE / "reports"
    reports.mkdir(exist_ok=True)
    out = reports / f"{dt.datetime.now().strftime('%Y%m%dT%H%M%S')}-planners-{args.model}.json"
    out.write_text(json.dumps({"model": args.model, "replay": bool(args.replay), "data": data_version.current(), "table": table, "runs": runs},
                              ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"报告：{out}")
    for config, m in table.items():
        tracking.log("排行程（三组对照）", f"planners · {config}", {"config": config, "model": args.model, "replay": bool(args.replay)},
                     {key: value for key, value in m.items() if key != "kinds"}, out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
