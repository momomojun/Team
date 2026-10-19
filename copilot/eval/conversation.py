"""多轮对话评测：按 cases/conversation-*.jsonl 用完整的 Copilot（pipeline.Session）一轮轮跑，每一轮都检查。

  python eval/conversation.py                                   # 本机 Ollama
  python eval/conversation.py --record                          # 同上，并录到 recordings/<模型>-conversation-v1.jsonl
  python eval/conversation.py --replay recordings/x.jsonl       # 回放（CI 用）
  python eval/conversation.py --replay ... --gate baseline-conversation.json

每一轮可以写的期望（都写在 expect 里，没写的不查）：
- status：planned / needs_input / error
- say：回复里都要有的片段；say_any：至少有一个；not_say：都不能有（比如提问时不该重印行程的“第 1 天（”）
- request：当前条件（TripRequest 的子集）；parks_set：公园（不管顺序）
- plan_has / plan_lacks：行程里有 / 没有的景点 id；night：{"1": 住处 id}
- fresh：前面的条件和行程都清掉了（“帮我安排一个新的行程”）
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

from nps_copilot.pipeline import Session, prompt_hashes  # noqa: E402
from nps_copilot.providers import ProviderError, RecordingProvider, ReplayProvider, from_env  # noqa: E402
from run import subset  # noqa: E402

REFERENCE = "2026-10-18"
CASES = HERE / "cases" / "conversation-v1.jsonl"


def current_request(session: Session, reply) -> dict:
    """这一轮之后的条件：排出来了就是交给引擎的请求，还在追问就是 Intake 现在记下的"""
    if reply.request:
        return reply.request
    request = session.intake.request()
    return {key: value for key, value in request.items() if value is not None and key != "provenance"}


def plan_ids(result: dict | None) -> list[str]:
    return [stop["id"] for day in (result or {}).get("days", []) for stop in day["stops"]]


def check(expect: dict, session: Session, reply) -> list[str]:
    problems = []
    text = reply.text
    if "status" in expect and reply.status != expect["status"]:
        problems.append(f"status={reply.status}")
    problems += [f"没说“{s}”" for s in expect.get("say", []) if s not in text]
    if expect.get("say_any") and not any(s in text for s in expect["say_any"]):
        problems.append(f"“{'/'.join(expect['say_any'])}”一个都没说")
    problems += [f"不该说“{s}”" for s in expect.get("not_say", []) if s in text]
    request = current_request(session, reply)
    if "request" in expect:
        problems += [f"request.{p}" for p in subset(expect["request"], request)]
    if "parks_set" in expect and sorted(request.get("parks") or []) != sorted(expect["parks_set"]):
        problems.append(f"parks={request.get('parks')}")
    result = reply.result if reply.result is not None else session.last_result
    ids = plan_ids(result)
    problems += [f"行程里没有 {i}" for i in expect.get("plan_has", []) if i not in ids]
    problems += [f"行程里还有 {i}" for i in expect.get("plan_lacks", []) if i in ids]
    for night, lodging in expect.get("night", {}).items():
        days = (result or {}).get("days", [])
        actual = (days[int(night) - 1].get("lodging") or {}).get("id") if len(days) >= int(night) else None
        if actual != lodging:
            problems.append(f"第 {night} 晚住 {actual}")
    if expect.get("fresh") and (session.last_result is not None or session.intake.parks.value):
        problems.append("没有清掉前面的条件")
    return problems


def run_case(case: dict, provider) -> dict:
    session = Session(provider, case.get("reference", REFERENCE), log=False)
    turns, ok = [], True
    for step in case["turns"]:
        start = time.perf_counter()
        try:
            reply = session.send(step["user"])
        except ProviderError as error:
            turns.append({"user": step["user"], "ok": False, "problems": [f"模型调用失败：{error}"]})
            ok = False
            break
        problems = check(step.get("expect", {}), session, reply)
        ok = ok and not problems
        turns.append({"user": step["user"], "ok": not problems, "problems": problems, "status": reply.status,
                      "latency_ms": round((time.perf_counter() - start) * 1000), "reply": reply.text[:600],
                      "dispatch": reply.trace.get("dispatch")})
    return {"id": case["id"], "ok": ok, "turns": turns}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cases", type=Path, default=CASES)
    parser.add_argument("--replay", type=Path)
    parser.add_argument("--record", action="store_true")
    parser.add_argument("--gate", type=Path)
    parser.add_argument("--only", help="只跑这几个（逗号分隔的 id 前缀）")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    cases = [json.loads(line) for line in args.cases.read_text(encoding="utf-8").splitlines() if line.strip()]
    if args.only:
        cases = [case for case in cases if any(case["id"].startswith(prefix) for prefix in args.only.split(","))]
    if args.replay:
        provider, label = ReplayProvider(args.replay), f"replay:{args.replay.stem}"
    else:
        provider = from_env()  # 默认本机 Ollama；COPILOT_PROVIDER=gemini / openai 换商业 API（对照实验）
        label = provider.model
        if args.record:
            suffix = args.cases.stem.replace("conversation", "conversation")
            path = HERE / "recordings" / f"{provider.model.replace(':', '_')}-{suffix}.jsonl"
            path.unlink(missing_ok=True)
            provider = RecordingProvider(provider, path)
    results = [run_case(case, provider) for case in cases]
    passed = sum(r["ok"] for r in results)
    turns = [t for r in results for t in r["turns"]]
    turn_ok = sum(t["ok"] for t in turns)
    latencies = [t["latency_ms"] for t in turns]
    for r in results:
        if not r["ok"]:
            for i, t in enumerate(r["turns"], 1):
                if not t["ok"]:
                    print(f"  ✗ {r['id']} 第 {i} 轮「{t['user'][:30]}」：{'；'.join(t['problems'])}")
    print(f"{label}  {passed}/{len(results)} 组对话全对，{turn_ok}/{len(turns)} 轮符合预期，每轮中位 {statistics.median(latencies) if latencies else 0} ms")
    reports = HERE / "reports"
    reports.mkdir(exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y%m%dT%H%M%S")
    report = reports / f"{stamp}-conversation-{label.replace(':', '_').replace('/', '_')}.json"
    report.write_text(json.dumps({"label": label, "prompts": prompt_hashes(), "cases": passed, "turns": turn_ok,
                                  "total_cases": len(results), "total_turns": len(turns), "results": results},
                                 ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"报告：{report}")
    if args.gate:
        baseline = json.loads(args.gate.read_text(encoding="utf-8"))
        if turn_ok < baseline["turns"] or passed < baseline["cases"]:
            print(f"门禁没过：{passed} 组 / {turn_ok} 轮，基线 {baseline['cases']} 组 / {baseline['turns']} 轮")
            return 1
        print(f"门禁通过：{passed} 组 / {turn_ok} 轮 ≥ 基线 {baseline['cases']} 组 / {baseline['turns']} 轮")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
