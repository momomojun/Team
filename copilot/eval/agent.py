"""search agent 评测（11-14）：cases/agent-v1.jsonl 的 44 道题，同一个模型、同一份录音跑两种做法对照：

- qa：现在线上的“代码认问题 + 找一次资料就答”（COPILOT_QA_AGENT 不设）；
- agent：会自己查的那一圈（COPILOT_QA_AGENT=1，agent.py），出问题照样退回 qa，和 pipeline._ask 一样。

两种都直接调 pipeline.Session._ask，测到的就是线上跑的代码。判分规则（COPILOT.md 的“search agent 的判分”）：
- tools：每组是几个都算对的工具，每组至少调了一个；args：那个工具至少有一次调用带着这些参数（列表只要包含）；
- min_calls：某个工具至少调几次；max_calls：一共最多调几次（qa 那种只数代码认出来的查询，找资料每次都找，不算）；
- facts：回答去掉空格（英文再转小写）以后，每组至少出现一种说法；
- relevant：查了网站资料的，找到的资料里要有其中一条（没查资料、直接用工具答的不算这一项）；
- recommend：至少点到 min 个；not_recommend：这些名字出现的那一句里要有“不建议、不太合适、关、封、太冷、太热”这类否定；
- found：true 要正经答了（不是“资料里没写”）；false 要老实说没有（模型自己说 found=false，或者回答里有“没有、没写、不存在”这类话）；
- forbid：回答里不能出现的字。
每题再记调了几次模型、几次查询、模型耗时（录音里的）、估算花费（按付费档标价，免费档实际不花钱）。

    python eval/agent.py --record                      # 真调 Gemini（默认 gemini-3.5-flash-lite），录到 recordings/agent-v1-<模型>.jsonl
    python eval/agent.py --replay eval/recordings/agent-v1-gemini-3.5-flash-lite.jsonl --gate eval/baseline-agent.json
    python eval/agent.py --replay ... --only A0,B0     # 只跑几题
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import statistics
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
os.environ.setdefault("COPILOT_SOURCE", "eval")
os.environ.setdefault("COPILOT_LIVE", "0")
# 找资料只按关键词：录的时候和回放（CI）找到的一样，不连 Neon、不调嵌入接口
os.environ.setdefault("COPILOT_RETRIEVAL", "bm25")
# 录的时候免费档按每分钟次数放慢（Gemini 每次前面要等几秒），会把 20 秒用完、录出来比线上早停；回放时又不会停，就对不上了。
# 评测里放宽，耗时另外按录音里每次调用的时间加起来看
os.environ.setdefault("COPILOT_AGENT_BUDGET_S", "600")

from nps_copilot import agent, monitor  # noqa: E402
from nps_copilot.ledger import estimate_tokens  # noqa: E402
from nps_copilot.pipeline import Session, prompt_hashes  # noqa: E402
from nps_copilot.providers import GeminiProvider, ProviderError, RecordingProvider, ReplayProvider  # noqa: E402
from nps_copilot.text import normalize  # noqa: E402
from guard import StopEarly, safe_name  # noqa: E402
import tracking  # noqa: E402

CASES = HERE / "cases" / "agent-v1.jsonl"
RECORDINGS = HERE / "recordings"
CONFIGS = ("qa", "agent")
# qa 的查询工具名 → 评测题里的名字
QA_TOOL = {"is_open": "is_open", "drive_time": "drive_time", "search": "find_attractions"}
NEGATION = re.compile(r"不建议|不太建议|不推荐|不太推荐|不太合适|不合适|不适合|不太适合|不理想|别去|不要去|关闭|关了|封|太冷|太热|很冷|很热|严寒|酷热|"
                      r"去不了|不开|not ideal|not recommended|avoid|skip|closed|too cold|too hot|not the best|poor|not a good", re.I)
HONEST = re.compile(r"没有|没写|不存在|查不到|没查到|不知道|无法|不能回答|只能回答|没收录|没有收录|不在网站|"
                    r"not in|isn.t in|don.t have|doesn.t have|no information|not available|can.t|cannot|only answer", re.I)
SENTENCE = re.compile(r"[。！？；;\n]|(?<=[a-z0-9])\.\s")


class Counting:
    """包一层：记下这一题每次调用的任务、模型、token、录音里的耗时，出错的也记"""

    def __init__(self, inner):
        self.inner, self.name, self.calls = inner, getattr(inner, "name", "model"), []

    @property
    def model(self) -> str:
        return getattr(self.inner, "model", self.name)

    def complete_json(self, task, system, user, schema):
        try:
            completion = self.inner.complete_json(task, system, user, schema)
        except ProviderError as error:
            self.calls.append({"task": task, "error": str(error)[:160]})
            raise
        meta = completion.meta or {}
        self.calls.append({"task": task, "model": completion.model, "ms": completion.latency_ms,
                           "prompt_tokens": meta.get("prompt_tokens") or estimate_tokens(system + user),
                           "output_tokens": meta.get("output_tokens") or estimate_tokens(completion.raw or json.dumps(completion.data))})
        return completion


def tool_calls(trace: dict) -> list[dict]:
    """这一题调了哪些查询：[{tool, request?, docs?}]，评测题里的工具名。没查成的（认不出的地方、不对的日期）不算调了"""
    out = []
    agent_trace = trace if trace.get("mode") == "agent" else trace.get("agent")
    for call in agent.calls_of(agent_trace or {}):
        if call.get("error") or call.get("repeat") or call.get("tool") not in agent.TOOLS:
            continue
        out.append({"tool": call["tool"], "request": call.get("request") or {}, "docs": call.get("docs") or []})
    if trace.get("mode") != "agent":
        # 走了 qa（本来就是 qa，或者那一圈退回来）：代码认出来的查询，加上每次都找的资料
        for request in (trace.get("tools") or {}).get("requests", []):
            out.append({"tool": QA_TOOL.get(request["tool"], request["tool"]), "request": request, "docs": []})
        if "retrieved" in trace:
            out.append({"tool": "search_knowledge", "request": {}, "docs": trace["retrieved"], "implicit": True})
    return out


def contains(want, got) -> bool:
    if isinstance(want, list):
        return isinstance(got, list) and all(item in got for item in want)
    return want == got


def squash(text: str, lang: str) -> str:
    text = re.sub(r"\s+", "", normalize(text))
    return text.lower() if lang == "en" else text


def judge(case: dict, text: str, trace: dict) -> dict:
    """一题的各项检查：{检查名: True/False}，这一题不考的项不出现"""
    expect, lang = case["expect"], case["lang"]
    calls = tool_calls(trace)
    explicit = [call for call in calls if not call.get("implicit")]
    names = [call["tool"] for call in explicit]
    said = squash(text, lang)
    checks: dict[str, bool] = {}
    if "tools" in expect:
        checks["tools"] = all(any(tool in [call["tool"] for call in calls] for tool in group) for group in expect["tools"])
    if "args" in expect:
        checks["args"] = all(any(call["tool"] == tool and all(contains(value, call["request"].get(key)) for key, value in want.items())
                                 for call in explicit) for tool, want in expect["args"].items())
    if "min_calls" in expect:
        checks["min_calls"] = all(names.count(tool) >= n for tool, n in expect["min_calls"].items())
    if "max_calls" in expect:
        checks["max_calls"] = len(explicit) <= expect["max_calls"]
    if "facts" in expect:
        checks["facts"] = all(any(squash(option, lang) in said for option in group) for group in expect["facts"])
    if "relevant" in expect:
        found = {doc for call in calls if call["tool"] == "search_knowledge" for doc in call["docs"]}
        if any(call["tool"] == "search_knowledge" for call in calls):
            checks["relevant"] = bool(found & set(expect["relevant"]))
    if "recommend" in expect:
        hits = [name for name in expect["recommend"]["names"] if squash(name, lang) in said]
        checks["recommend"] = len(hits) >= expect["recommend"]["min"]
    if "not_recommend" in expect:
        sentences = SENTENCE.split(normalize(text))
        checks["not_recommend"] = all(NEGATION.search(sentence) for name in expect["not_recommend"]
                                      for sentence in sentences if name.lower() in sentence.lower())
    kind = trace.get("answer")
    honest = kind == "not_found" or bool(HONEST.search(text))
    if expect["found"]:
        checks["found"] = kind in ("model", "fallback") and not (kind == "fallback" and "没写" in text)
    else:
        # 模型自己说 found=false（not_found），或者退回来的话里老实说了没有；模型说“找到了”就算没老实
        checks["found"] = kind == "not_found" or (kind != "model" and honest)
    if "forbid" in expect:
        checks["forbid"] = not any(word in text for word in expect["forbid"])
    return checks


def run_case(case: dict, config: str, provider: Counting) -> dict:
    if config == "agent":
        os.environ["COPILOT_QA_AGENT"] = "1"
    else:
        os.environ.pop("COPILOT_QA_AGENT", None)
    before = len(provider.calls)
    session = Session(provider, case["reference"], log=False)
    text, trace = session._ask(case["question"], case["parks"], None, None, case["lang"] == "zh")
    calls = provider.calls[before:]
    checks = judge(case, text, trace)
    agent_trace = trace if trace.get("mode") == "agent" else trace.get("agent") or {}
    tool_ms = sum(step.get("tool_ms", 0) for step in agent_trace.get("steps", [])) + (trace.get("tools") or {}).get("latency_ms", 0)
    return {
        "id": case["id"], "kind": case["kind"], "lang": case["lang"], "question": case["question"], "config": config,
        "ok": all(checks.values()), "checks": checks, "text": text,
        "answer": trace.get("answer"), "fallback": trace.get("fallback") or agent_trace.get("fallback"),
        "agent_fallback": agent_trace.get("fallback") if config == "agent" else None,
        "calls": [{k: v for k, v in call.items() if k != "docs"} | ({"docs": call["docs"]} if call["docs"] else {})
                  for call in tool_calls(trace)],
        "model_calls": len(calls), "errors": [call["error"] for call in calls if "error" in call],
        "model_ms": sum(call.get("ms", 0) for call in calls), "tool_ms": tool_ms,
        "tokens": [sum(call.get("prompt_tokens", 0) for call in calls), sum(call.get("output_tokens", 0) for call in calls)],
        "models": sorted({call["model"] for call in calls if "model" in call}),
    }


def summarize(rows: list[dict], price: tuple[float, float]) -> dict:
    n = max(1, len(rows))
    checks: dict[str, list[bool]] = {}
    for row in rows:
        for key, value in row["checks"].items():
            checks.setdefault(key, []).append(value)
    cost = sum(row["tokens"][0] * price[0] + row["tokens"][1] * price[1] for row in rows) / 1e6
    return {
        "passed": sum(row["ok"] for row in rows), "cases": len(rows),
        "rate": round(sum(row["ok"] for row in rows) / n, 3),
        "checks": {key: f"{sum(values)}/{len(values)}" for key, values in sorted(checks.items())},
        "model_calls": sum(row["model_calls"] for row in rows),
        "tool_calls": sum(len([c for c in row["calls"] if not c.get("implicit")]) for row in rows),
        "errors": sum(len(row["errors"]) for row in rows),
        "agent_fallbacks": sum(1 for row in rows if row.get("agent_fallback")),
        "median_ms": round(statistics.median(row["model_ms"] + row["tool_ms"] for row in rows), 1) if rows else 0,
        "max_ms": max((row["model_ms"] + row["tool_ms"] for row in rows), default=0),
        "cost_per_1000_usd": round(cost / n * 1000, 4),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cases", type=Path, default=CASES)
    parser.add_argument("--model", default="gemini-3.5-flash-lite", help="--record 用哪个 Gemini 模型")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--record", action="store_true")
    mode.add_argument("--replay", type=Path)
    parser.add_argument("--configs", default=",".join(CONFIGS), help="跑哪几种做法（qa,agent）")
    parser.add_argument("--only", help="只跑这几题（逗号分隔的 id 前缀）")
    parser.add_argument("--gate", type=Path, help="基线：agent 至少过几题、每类至少几题、qa 不比基线差")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    cases = [json.loads(line) for line in args.cases.read_text(encoding="utf-8").splitlines() if line.strip()]
    if args.only:
        cases = [case for case in cases if any(case["id"].startswith(prefix) for prefix in args.only.split(","))]
    configs = [config for config in args.configs.split(",") if config in CONFIGS]
    if args.record:
        recording = RECORDINGS / f"{args.cases.stem}-{safe_name(args.model)}.jsonl"
        if not args.only:
            recording.write_text("", encoding="utf-8")
        provider = Counting(RecordingProvider(StopEarly(GeminiProvider(model=args.model)), recording))
        label = f"record:{recording.stem}"
    else:
        provider = Counting(ReplayProvider(args.replay))
        label = f"replay:{args.replay.stem}"
    rows: dict[str, list[dict]] = {config: [] for config in configs}
    for case in cases:
        for config in configs:
            rows[config].append(run_case(case, config, provider))
        print(f"\r{case['id']}", end="", flush=True)
    print()
    models = sorted({model for config in rows.values() for row in config for model in row["models"]})
    price = monitor.list_price(models[0]) if len(models) == 1 else None
    price = price or (0.0, 0.0)
    kinds = list(dict.fromkeys(case["kind"] for case in cases))
    table = {config: {"all": summarize(found, price), **{kind: summarize([r for r in found if r["kind"] == kind], price) for kind in kinds}}
             for config, found in rows.items()}
    names = {"qa": "qa（找一次就答）", "agent": "agent（自己查）"}
    for config, by_kind in table.items():
        m = by_kind["all"]
        print(f"{names[config]:16} {m['passed']}/{m['cases']} 题全对  模型 {m['model_calls']} 次  查询 {m['tool_calls']} 次  "
              f"出错 {m['errors']}  退回 qa {m['agent_fallbacks']}  每题中位 {m['median_ms']:.0f} ms（最长 {m['max_ms']}）  每千题 ${m['cost_per_1000_usd']:.3f}")
        print("                 " + "  ".join(f"{kind} {by_kind[kind]['passed']}/{by_kind[kind]['cases']}" for kind in kinds))
        print("                 " + "  ".join(f"{key} {value}" for key, value in m["checks"].items()))
    for config, found in rows.items():
        for row in found:
            if not row["ok"]:
                bad = [key for key, value in row["checks"].items() if not value]
                print(f"  ✗ {config} {row['id']}「{row['question'][:24]}」：{'、'.join(bad)}" + (f"（退回：{row['agent_fallback']}）" if row.get("agent_fallback") else ""))
    reports = HERE / "reports"
    reports.mkdir(exist_ok=True)
    out = reports / f"{dt.datetime.now().strftime('%Y%m%dT%H%M%S')}-agent-{label.replace(':', '_')}.json"
    out.write_text(json.dumps({"label": label, "models": models, "prompts": prompt_hashes(), "table": table, "rows": rows},
                              ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"报告：{out}")
    for config, by_kind in table.items():
        flat = {f"{kind}_{key}": value for kind, m in by_kind.items() for key, value in m.items() if isinstance(value, (int, float))}
        tracking.log("search agent（agent-v1）", f"{args.cases.stem} · {config} · {label}",
                     {"config": config, "models": ",".join(models), "replay": bool(args.replay), **tracking.prompt_params(prompt_hashes())}, flat, out)
    if args.gate:
        baseline = json.loads(args.gate.read_text(encoding="utf-8"))
        problems = []
        for config, want in baseline.items():
            if config not in table:
                continue
            got = table[config]
            if got["all"]["passed"] < want["min_passed"]:
                problems.append(f"{config} {got['all']['passed']} 题 < 基线 {want['min_passed']}")
            for kind, minimum in want.get("min_by_kind", {}).items():
                if kind in got and got[kind]["passed"] < minimum:
                    problems.append(f"{config} {kind} {got[kind]['passed']} 题 < 基线 {minimum}")
        if problems:
            print("门禁没过：" + "；".join(problems))
            return 1
        print("门禁通过：" + "；".join(f"{config} {table[config]['all']['passed']} 题 ≥ {want['min_passed']}" for config, want in baseline.items() if config in table))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
