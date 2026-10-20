"""Intake 评测：按 cases/*.jsonl 里写好的对话逐轮跑，比较最后的状态和 TripRequest 是否符合预期。

  python eval/run.py                                   # 本机 Ollama（默认 COPILOT_MODEL）
  python eval/run.py --record                          # 同上，并把模型输出录到 recordings/<模型>.jsonl
  python eval/run.py --replay recordings/x.jsonl       # 回放录好的输出（CI 用，不要 GPU）
  python eval/run.py --replay ... --gate baseline.json # 分数低于基线就以非 0 退出（PR 门禁）
  python eval/run.py --plan                            # 条件齐了以后再真的调 plan_trip，统计能不能排出来

指标分开报：对话是否达到预期（最终状态 + 期望的字段）、逐轮追问类型是否对、模型调用次数和耗时、
被丢掉的片段数（模型摘了原话里没有的东西）。这些是这一版提示词 + 代码 + 模型组合的结果，不是模型的通用能力。
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import statistics
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
# 评测、测试不用本机的 NPS 公告关闭清单（每天会变），结果才能复现
os.environ.setdefault("COPILOT_LIVE", "0")

from nps_copilot.critic import critique  # noqa: E402
from nps_copilot import prompts  # noqa: E402
from nps_copilot.intake import Intake  # noqa: E402
from nps_copilot.writer import template, write  # noqa: E402
from nps_copilot.pipeline import prompt_hashes  # noqa: E402
from nps_copilot.plan_client import PlanError, plan_trip  # noqa: E402
from guard import StopEarly, safe_name  # noqa: E402
from nps_copilot.providers import ProviderError, RecordingProvider, ReplayProvider, from_env  # noqa: E402

REFERENCE = "2026-10-16"


def subset(expected, actual) -> list[str]:
    """expected 里写了的字段，actual 都要一样；返回对不上的字段路径"""
    problems = []
    if isinstance(expected, dict):
        if not isinstance(actual, dict):
            return ["(不是对象)"]
        for key, value in expected.items():
            problems += [f"{key}.{p}" if p else key for p in subset(value, actual.get(key))] if isinstance(value, dict) else \
                ([] if actual.get(key) == value else [key])
        return problems
    return [] if expected == actual else [""]


def writer_check(request: dict, result: dict, language: str, provider) -> dict:
    """让模型改写说明：有没有编造（时间、数字不在结果里）、退回模板没有、保留了几成景点名和“没排进去”的景点"""
    review = critique(request, result)
    base = template(request, result, review, language)
    text, trace = write(request, result, review, language, provider, use_model=True)
    attempt = trace.get("draft", text)
    stops = [stop["nameZh" if language != "en" else "nameEn"] for day in result["days"] for stop in day["stops"]]
    skipped = [item["nameZh" if language != "en" else "nameEn"] for item in result.get("skipped", [])[:6]]
    return {
        "used": trace["writer"], "fallback": trace.get("fallback"), "unsupported": trace.get("unsupported", []),
        "latency_ms": trace.get("latency_ms"), "chars": len(attempt), "template_chars": len(base),
        "stop_coverage": round(sum(name in attempt for name in stops) / max(1, len(stops)), 2),
        "skipped_kept": round(sum(name in attempt for name in skipped) / max(1, len(skipped)), 2) if skipped else None,
        "text": attempt,
    }


def run_case(case: dict, provider, with_plan: bool, with_writer: bool = False) -> dict:
    intake = Intake(provider, dt.date.fromisoformat(case.get("reference", REFERENCE)))
    turns, latencies, dropped, model_calls, rule_fills = [], [], 0, 0, 0
    turn = None
    for step in case["turns"]:
        try:
            turn = intake.step(step["user"])
        except ProviderError as error:
            return {"id": case["id"], "ok": False, "error": str(error), "turns": turns}
        trace = turn.trace
        if trace.get("model_called"):
            model_calls += 1
            latencies.append(trace.get("latency_ms", 0))
            dropped += len(trace.get("dropped_spans", []))
            rule_fills += len(trace.get("rule_filled", []))
        kind = turn.question["kind"] if turn.question else None
        turns.append({"user": step["user"], "status": turn.status, "kind": kind, "expected_kind": step.get("kind"),
                      "kind_ok": step.get("kind") is None or step["kind"] == kind,
                      "question": turn.question["text"] if turn.question else None,
                      "model_output": trace.get("model_output"), "dropped": trace.get("dropped_spans", [])})
    expect = case["expect"]
    problems = [] if turn.status == expect["status"] else [f"status={turn.status}"]
    if expect.get("request"):
        problems += subset(expect["request"], turn.request or {})
    result = {"id": case["id"], "ok": not problems and all(t["kind_ok"] for t in turns), "problems": problems,
              "request": turn.request, "turns": turns, "model_calls": model_calls, "latencies": latencies, "dropped": dropped,
              "rule_fills": rule_fills}
    if with_plan and turn.status == "ready":
        try:
            call = plan_trip(turn.request, case.get("reference", REFERENCE))
            result["plan"] = {"ok": True, "days": len(call.result["days"]), "stops": sum(len(d["stops"]) for d in call.result["days"]), "latency_ms": call.latency_ms}
            if with_writer:
                result["writer"] = writer_check(turn.request, call.result, intake.language or "zh", provider)
        except PlanError as error:
            result["plan"] = {"ok": False, "error": str(error), "issues": error.issues}
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cases", default=str(HERE / "cases" / "intake-v1.jsonl"))
    parser.add_argument("--replay")
    parser.add_argument("--record", action="store_true")
    parser.add_argument("--plan", action="store_true")
    parser.add_argument("--writer", action="store_true", help="排出行程以后让模型改写说明，统计忠实度（要 --plan）")
    parser.add_argument("--gate")
    parser.add_argument("--out", default=str(HERE / "reports"))
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    cases = [json.loads(line) for line in Path(args.cases).read_text(encoding="utf-8").splitlines() if line.strip()]
    if args.replay:
        provider = ReplayProvider(Path(args.replay))
        model = "replay:" + Path(args.replay).stem
    else:
        provider = StopEarly(from_env())  # 默认本机 Ollama；COPILOT_PROVIDER=gemini / openai / openrouter 换商业 API（对照实验）
        model = provider.model
        if args.record:
            # 默认样例录到 recordings/<模型>.jsonl，别的样例文件录到 recordings/<模型>-<样例文件名>.jsonl
            stem = Path(args.cases).stem
            suffix = "" if stem == "intake-v1" else f"-{stem}"
            # 不是默认版本的提示词另外录一份，不覆盖默认版的录音（回放门禁用的是默认版）
            if prompts.version("intake") != prompts.defaults()["intake"]:
                suffix += f"-intake_{prompts.version('intake')}"
            path = HERE / "recordings" / (safe_name(provider.model) + suffix + ".jsonl")
            path.unlink(missing_ok=True)
            provider = RecordingProvider(provider, path)
    start = time.perf_counter()
    results = [run_case(case, provider, args.plan or args.writer, args.writer) for case in cases]
    latencies = [ms for result in results for ms in result.get("latencies", [])]
    summary = {
        "cases": len(results),
        "passed": sum(result["ok"] for result in results),
        "turn_kind_accuracy": round(sum(t["kind_ok"] for r in results for t in r["turns"]) / max(1, sum(len(r["turns"]) for r in results)), 3),
        "model_calls": sum(result.get("model_calls", 0) for result in results),
        "median_latency_ms": statistics.median(latencies) if latencies else None,
        "dropped_spans": sum(result.get("dropped", 0) for result in results),
        # 规则补上的条件（模型漏了、原话写得很清楚）：整体流程的分数里算，但不是模型的功劳
        "rule_fills": sum(result.get("rule_fills", 0) for result in results),
        "errors": sum(1 for result in results if result.get("error")),
    }
    if args.plan or args.writer:
        planned = [r["plan"] for r in results if "plan" in r]
        summary["planned_ok"] = f"{sum(p['ok'] for p in planned)}/{len(planned)}"
    if args.writer:
        drafts = [r["writer"] for r in results if "writer" in r]
        summary["writer"] = {
            "drafts": len(drafts),
            "faithful": sum(not d["unsupported"] and d["fallback"] is None for d in drafts),
            "fallbacks": sum(d["fallback"] is not None for d in drafts),
            "median_latency_ms": statistics.median([d["latency_ms"] for d in drafts if d["latency_ms"]]) if drafts else None,
            "stop_coverage": round(statistics.mean(d["stop_coverage"] for d in drafts), 2) if drafts else None,
            "skipped_kept": round(statistics.mean(d["skipped_kept"] for d in drafts if d["skipped_kept"] is not None), 2) if drafts else None,
        }
    report = {"run_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "model": model, "prompt": prompts.load("intake").id,
              "prompt_hashes": prompt_hashes(), "cases_file": Path(args.cases).name, "seconds": round(time.perf_counter() - start, 1),
              "summary": summary, "results": results}
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    name = f"{dt.datetime.now().strftime('%Y%m%dT%H%M%S')}-{model.replace(':', '_').replace('/', '_')}.json"
    (out / name).write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"{model}  {summary['passed']}/{summary['cases']} 个对话符合预期，追问类型 {summary['turn_kind_accuracy']:.0%}，"
          f"模型调用 {summary['model_calls']} 次，中位 {summary['median_latency_ms']} ms，丢掉的片段 {summary['dropped_spans']}，规则补的 {summary['rule_fills']}"
          + (f"，排出行程 {summary['planned_ok']}" if args.plan else ""))
    if args.writer:
        w = summary["writer"]
        print(f"  Writer：{w['faithful']}/{w['drafts']} 篇没有编造，退回模板 {w['fallbacks']} 篇，中位 {w['median_latency_ms']} ms，"
              f"景点名保留 {w['stop_coverage']:.0%}，“没排进去”保留 {w['skipped_kept']:.0%}")
    for result in results:
        if not result["ok"]:
            print(f"  ✗ {result['id']}: {result.get('error') or ', '.join(result['problems']) or '追问类型不对'}")
    print(f"报告：{out / name}")

    if args.gate:
        baseline = json.loads(Path(args.gate).read_text(encoding="utf-8"))
        floor = baseline["min_passed"]
        if summary["passed"] < floor or summary["errors"] > 0:
            print(f"门禁没过：{summary['passed']} < 基线 {floor}，或者有回放缺失（errors={summary['errors']}）")
            return 1
        print(f"门禁通过：{summary['passed']} ≥ 基线 {floor}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
