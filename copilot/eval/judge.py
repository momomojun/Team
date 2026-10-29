"""用模型给 Copilot 回答问题的那一步打分（LLM-as-judge，GOALS P20）：每一句话在资料里有没有依据。

  python eval/judge.py --copilot qwen3.5_4b-q4_K_M --judge openai:gpt-4.1-mini --record   # 真调裁判模型，录音
  python eval/judge.py --copilot qwen3.5_4b-q4_K_M --judge openai:gpt-4.1-mini --replay   # 用录好的裁判回答（不花额度）

1. 用录好的 Copilot 回答回放三组多轮对话（conversation-v1/v2/v3，不调 Copilot 的模型），
   截下每一次“回答问题”交给模型的全部资料（行程、查到的网站资料）和模型写的回答；
2. 代码检查（回答里的时间、数字要在资料里出现过）通过、真用了模型回答的，交给裁判；没通过的也交给裁判，看两边说法一不一致；
3. 校准：另外拿几条真回答，在后面加一句资料里肯定没有的话（“门票免费、全年 24 小时开放”这种），裁判要能挑出来，
   挑不出来的裁判就不可信；
4. 汇总：每条有依据的比例、平均分、裁判挑出的没依据的原话、校准抓到几条。

裁判模型：--judge 写成“提供方:型号”（和 COPILOT_STEP_MODELS 一样），最好别用和被打分的 Copilot 同一个模型（会偏向自己）。
录音在 recordings/judge-<裁判>-<Copilot 模型>.jsonl，报告在 reports/
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import statistics
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import os  # noqa: E402
# 计费总账（nps_copilot/ledger.py）里记成“裁判”调用的
os.environ.setdefault("COPILOT_SOURCE", "judge")
sys.path.insert(0, str(HERE))

from conversation import REFERENCE  # noqa: E402
from guard import StopEarly, safe_name  # noqa: E402

from nps_copilot import prompts  # noqa: E402
from nps_copilot.pipeline import Session  # noqa: E402
from nps_copilot.providers import Completion, ProviderError, RecordingProvider, ReplayProvider, make_provider  # noqa: E402

SETS = ("conversation-v1", "conversation-v2", "conversation-v3")
JUDGE_SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["claims", "unsupported", "answers_question", "score"],
    "properties": {
        "claims": {"type": "integer", "minimum": 0, "maximum": 30},
        "unsupported": {"type": "array", "maxItems": 5, "items": {"type": "string", "maxLength": 200}},
        "answers_question": {"type": "boolean"},
        "score": {"type": "integer", "minimum": 1, "maximum": 5},
    },
}
# 校准用：资料里肯定没有的说法（加在真回答后面），裁判要挑得出来
PLANTED = ["另外，这里门票免费，全年 24 小时开放，不用任何预约。", "这里有缆车可以直达山顶，单程只要 5 分钟。",
           "停车场有 2000 个车位，从来不会停满。", "This spot is free to enter and open 24 hours a day all year round."]


class Capture:
    """包住回放的 Copilot 模型：记下每次“回答问题”交给模型的资料和模型写的回答"""

    def __init__(self, inner):
        self.inner = inner
        self.name = inner.name
        self.model = getattr(inner, "model", inner.name)
        self.qa: list[dict] = []

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        completion = self.inner.complete_json(task, system, user, schema)
        if task == "qa":
            self.qa.append({"evidence": user, "draft": (completion.data.get("answer") or "").strip(), "found": completion.data.get("found")})
        return completion


def collect(copilot: str) -> list[dict]:
    """回放三组多轮对话，收集每一次回答问题（有录音的才算）"""
    items: list[dict] = []
    for name in SETS:
        recording = HERE / "recordings" / f"{copilot}-{name}.jsonl"
        if not recording.exists():
            continue
        capture = Capture(ReplayProvider(recording))
        for line in (HERE / "cases" / f"{name}.jsonl").read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            case = json.loads(line)
            session = Session(capture, case.get("reference", REFERENCE), log=False)
            for step in case["turns"]:
                before = len(capture.qa)
                try:
                    reply = session.send(step["user"])
                except ProviderError:
                    break
                qa_rows = reply.trace.get("qa")
                qa_rows = qa_rows if isinstance(qa_rows, list) else ([qa_rows] if qa_rows else [])
                for captured, row in zip(capture.qa[before:], [r for r in qa_rows if "draft" in r]):
                    if not captured["draft"] or not captured["found"]:
                        continue
                    items.append({"set": name, "case": case["id"], "question": step["user"], **captured,
                                  "code_check": row.get("answer"), "code_problems": row.get("unsupported") or []})
    return items


def judge_one(provider, item: dict) -> dict:
    user = f"【资料】\n{item['evidence']}\n\n【问题】\n{item['question']}\n\n【回答】\n{item['answer']}"
    completion = provider.complete_json("judge", prompts.load("judge").text, user, JUDGE_SCHEMA)
    data = completion.data
    return {"claims": data.get("claims"), "unsupported": data.get("unsupported") or [], "answers_question": data.get("answers_question"),
            "score": data.get("score"), "model": completion.model}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--copilot", default="qwen3.5_4b-q4_K_M", help="被打分的 Copilot 模型（录音文件名的前缀）")
    parser.add_argument("--judge", default="openai:gpt-4.1-mini", help="裁判模型：提供方:型号")
    parser.add_argument("--record", action="store_true")
    parser.add_argument("--replay", action="store_true", help="用录好的裁判回答")
    parser.add_argument("--calibrate", type=int, default=8, help="校准用的加料回答条数（加的话轮着用 PLANTED 里的几句）")
    parser.add_argument("--dry-run", action="store_true", help="只数要打分的条数，不调裁判")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    items = collect(args.copilot)
    for item in items:
        item["answer"] = item["draft"]
    passed = [item for item in items if item["code_check"] == "model"]
    planted = [{**item, "answer": item["draft"].rstrip() + " " + PLANTED[k % len(PLANTED)], "planted": PLANTED[k % len(PLANTED)]}
               for k, item in enumerate(passed[: args.calibrate])]
    print(f"{args.copilot}：回答问题 {len(items)} 次（代码检查通过 {len(passed)}、没通过 {len(items) - len(passed)}），校准 {len(planted)} 条；"
          f"一共要调裁判 {len(items) + len(planted)} 次")
    if args.dry_run or not items:
        return 0

    path = HERE / "recordings" / f"judge-{safe_name(args.judge.split(':', 1)[-1])}-{args.copilot}.jsonl"
    if args.replay:
        provider = ReplayProvider(path)
    else:
        provider = StopEarly(make_provider(args.judge, chat=False))
        if args.record:
            path.unlink(missing_ok=True)
            provider = RecordingProvider(provider, path)
    for item in items + planted:
        try:
            item["judge"] = judge_one(provider, item)
        except ProviderError as error:
            item["judge"] = {"error": str(error)[:200]}

    judged = [item for item in passed if "score" in item["judge"]]
    clean = [item for item in judged if not item["judge"]["unsupported"]]
    caught = [item for item in planted if item["judge"].get("unsupported")]
    flagged_by_code = [item for item in items if item["code_check"] != "model" and "score" in item["judge"]]
    summary = {
        "copilot": args.copilot, "judge": args.judge, "prompt": prompts.load("judge").id,
        "answers": len(judged), "fully_supported": len(clean),
        "mean_score": round(statistics.mean(item["judge"]["score"] for item in judged), 2) if judged else None,
        "answers_question": sum(1 for item in judged if item["judge"]["answers_question"]),
        "calibration": f"{len(caught)}/{len(planted)}",
        "code_flagged": len(flagged_by_code),
        "code_flagged_judge_agrees": sum(1 for item in flagged_by_code if item["judge"]["unsupported"]),
        "errors": sum(1 for item in items + planted if "error" in item["judge"]),
    }
    print(f"裁判 {args.judge}：代码检查通过的 {summary['answers']} 条里，每句都有依据的 {summary['fully_supported']} 条，平均 {summary['mean_score']} 分，"
          f"答到了问题的 {summary['answers_question']} 条；校准抓到 {summary['calibration']}；"
          f"代码检查挑出来的 {summary['code_flagged']} 条里裁判也说有问题的 {summary['code_flagged_judge_agrees']} 条；出错 {summary['errors']}")
    for item in judged:
        for claim in item["judge"]["unsupported"]:
            print(f"  ✗ {item['case']}「{item['question'][:24]}」：{claim[:80]}")
    reports = HERE / "reports"
    reports.mkdir(exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y%m%dT%H%M%S")
    (reports / f"{stamp}-judge-{safe_name(args.judge)}-{args.copilot}.json").write_text(
        json.dumps({"summary": summary, "items": items, "planted": planted}, ensure_ascii=False, indent=1), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
