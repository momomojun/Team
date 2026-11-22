"""软要求评测（多 agent 协作，11-21）：同一批题（cases/soft-v1.jsonl，30 题，10 道英文、2 道多轮）用两种方式跑完整的 Copilot，
比一比做到了多少：

- dispatcher：现在的样子（调度员 + Intake + 引擎 + Critic + Writer），COPILOT_TEAM=0；
- team：多加规划 agent 和审查 agent（team.py），COPILOT_TEAM=1。

每题按最后一轮打分：状态（排出来没有）、checks（排出来的行程用和审查 agent 同一个判分脚本 scripts/soft-check-lib.mjs 逐条判）、
must_say_any（回复里至少要有其中一个说法，冲突题、陷阱题要讲清楚取舍）。三样都对算这题过。

  python eval/soft.py                                    # 本机 Ollama，两种方式都跑
  python eval/soft.py --record                           # 同上，并录到 recordings/<模型>-soft-v1.jsonl
  python eval/soft.py --replay recordings/x.jsonl        # 回放
  python eval/soft.py --modes team --only S01,S02        # 只跑一部分
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import statistics
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
os.environ.setdefault("COPILOT_SOURCE", "eval")
os.environ.setdefault("COPILOT_LIVE", "0")

from nps_copilot import data_version  # noqa: E402
from nps_copilot.catalog import ROOT  # noqa: E402
from nps_copilot.pipeline import Session, prompt_hashes  # noqa: E402
from nps_copilot.providers import ProviderError, RecordingProvider, ReplayProvider, from_env  # noqa: E402
from guard import StopEarly, safe_name  # noqa: E402
import tracking  # noqa: E402

REFERENCE = "2026-11-21"
CASES = HERE / "cases" / "soft-v1.jsonl"
MODES = {"dispatcher": "0", "team": "1"}


def grade(rows: list[dict]) -> dict[str, list[dict]]:
    """一次把所有题交给判分脚本（Node）"""
    node = shutil.which("node")
    if not node:
        raise SystemExit("要 Node 24 才能判分")
    completed = subprocess.run(
        [node, "--disable-warning=ExperimentalWarning", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
         "--import", "./tests/register.mjs", "scripts/soft-check.mjs"],
        input=json.dumps(rows, ensure_ascii=False).encode("utf-8"), cwd=ROOT, capture_output=True, timeout=600,
    )
    if completed.returncode != 0:
        raise SystemExit(completed.stderr.decode("utf-8", "replace")[-800:])
    return {row["id"]: row["checks"] for row in json.loads(completed.stdout.decode("utf-8"))}


def run_case(case: dict, provider) -> dict:
    session = Session(provider, case.get("reference", REFERENCE), log=False)
    reply, calls, start = None, [], time.perf_counter()
    for step in case["turns"]:
        try:
            reply = session.send(step["user"])
        except ProviderError as error:
            return {"id": case["id"], "error": str(error), "status": "error", "text": "", "result": None, "calls": calls,
                    "latency_ms": round((time.perf_counter() - start) * 1000)}
        calls += [call.get("task") for call in reply.trace.get("calls") or []]
    trace = reply.trace
    return {
        "id": case["id"], "status": reply.status, "text": reply.text, "result": reply.result or session.last_result,
        "calls": calls, "latency_ms": round((time.perf_counter() - start) * 1000),
        "team_plan": (trace.get("team_plan") or {}).get("wishes"), "team": {k: v for k, v in (trace.get("team") or {}).items() if k != "rounds"},
        "rounds": len([r for r in (trace.get("team") or {}).get("rounds", []) if "review" in r]),
        "prefs": (reply.request or {}).get("prefs"),
    }


def score(case: dict, run: dict, checks: list[dict]) -> dict:
    expect = case["expect"]
    status_ok = run["status"] == expect.get("status", "planned")
    say = expect.get("must_say_any") or []
    say_ok = not say or any(phrase in run["text"] for phrase in say)
    checks_ok = all(item["ok"] for item in checks)
    return {**run, "checks": checks, "status_ok": status_ok, "say_ok": say_ok, "checks_ok": checks_ok,
            "ok": status_ok and say_ok and checks_ok}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cases", type=Path, default=CASES)
    parser.add_argument("--replay", type=Path)
    parser.add_argument("--record", action="store_true")
    parser.add_argument("--fill", action="store_true", help="和 --replay 一起用：录音里没有的调用用真模型补录")
    parser.add_argument("--modes", default="dispatcher,team")
    parser.add_argument("--only", help="只跑这几题（逗号分隔的 id 前缀）")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    cases = [json.loads(line) for line in args.cases.read_text(encoding="utf-8").splitlines() if line.strip()]
    if args.only:
        cases = [case for case in cases if any(case["id"].startswith(prefix) for prefix in args.only.split(","))]
    if args.replay:
        fallback = RecordingProvider(StopEarly(from_env()), args.replay) if args.fill else None
        provider, label = ReplayProvider(args.replay, fallback=fallback), f"replay:{args.replay.stem}" + ("+fill" if args.fill else "")
    else:
        provider = StopEarly(from_env())
        label = provider.model
        if args.record:
            path = HERE / "recordings" / f"{safe_name(provider.model)}-{args.cases.stem}.jsonl"
            path.unlink(missing_ok=True)
            provider = RecordingProvider(provider, path)

    report: dict = {"label": label, "prompts": prompt_hashes(), "data": data_version.current(), "modes": {}}
    for mode in [m for m in args.modes.split(",") if m in MODES]:
        os.environ["COPILOT_TEAM"] = MODES[mode]
        runs = [run_case(case, provider) for case in cases]
        graded = grade([{"id": run["id"], "result": run["result"], "checks": case["expect"].get("checks", [])} for case, run in zip(cases, runs)])
        scored = [score(case, run, graded[case["id"]]) for case, run in zip(cases, runs)]
        checks = [item for row in scored for item in row["checks"]]
        summary = {
            "cases": sum(row["ok"] for row in scored), "total": len(scored),
            "checks": sum(item["ok"] for item in checks), "total_checks": len(checks),
            "status": sum(row["status_ok"] for row in scored), "say": sum(row["say_ok"] for row in scored),
            "calls": sum(len(row["calls"]) for row in scored),
            "median_ms": statistics.median([row["latency_ms"] for row in scored]) if scored else 0,
        }
        report["modes"][mode] = {"summary": summary, "rows": [{k: v for k, v in row.items() if k != "result"} for row in scored]}
        print(f"{mode:<10} {summary['cases']}/{summary['total']} 题全对；检查 {summary['checks']}/{summary['total_checks']}；"
              f"状态 {summary['status']}；该说的 {summary['say']}；模型调用 {summary['calls']} 次；每题中位 {summary['median_ms']} ms")
        for row in scored:
            if not row["ok"]:
                why = [f"[{item['kind']}] {item['detail']}" for item in row["checks"] if not item["ok"]]
                if not row["status_ok"]:
                    why.append(f"status={row['status']}")
                if not row["say_ok"]:
                    why.append("没说到要讲的取舍")
                print(f"  ✗ {row['id']}：{'；'.join(why)}")
        tracking.log("软要求（soft）", f"{args.cases.stem} · {mode} · {label}",
                     {"cases_file": args.cases.name, "mode": mode, "model": label, **tracking.prompt_params(prompt_hashes())},
                     {"cases_passed": summary["cases"], "cases": summary["total"], "checks_passed": summary["checks"],
                      "checks": summary["total_checks"], "calls": summary["calls"]}, None)
    if len(report["modes"]) == 2:
        a, b = (report["modes"][m]["rows"] for m in ("dispatcher", "team"))
        print("\n逐题对照（dispatcher → team）：")
        for left, right in zip(a, b):
            if left["ok"] != right["ok"]:
                print(f"  {left['id']}: {'✓' if left['ok'] else '✗'} → {'✓' if right['ok'] else '✗'}")
    reports = HERE / "reports"
    reports.mkdir(exist_ok=True)
    out = reports / f"{dt.datetime.now().strftime('%Y%m%dT%H%M%S')}-soft-{label.replace(':', '_').replace('/', '_')}.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"报告：{out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
