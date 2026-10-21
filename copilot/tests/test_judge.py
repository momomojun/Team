"""模型打分（eval/judge.py）：不调真模型，用写好的裁判输出"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "eval"))

import judge  # noqa: E402

from nps_copilot import prompts  # noqa: E402
from nps_copilot.providers import Completion, ScriptedProvider  # noqa: E402


def test_the_judge_sees_the_same_evidence_the_answer_was_written_from():
    provider = ScriptedProvider([{"claims": 3, "unsupported": ["门票免费"], "answers_question": True, "score": 3}])
    item = {"evidence": "【行程】第 1 天 冰川点\n[1] 冰川点：海拔 2199 米，路 5–11 月通车", "question": "冰川点什么时候能去？",
            "answer": "冰川点的路一般 5–11 月通车。门票免费。"}
    result = judge.judge_one(provider, item)
    assert result == {"claims": 3, "unsupported": ["门票免费"], "answers_question": True, "score": 3, "model": "scripted"}
    [(task, user)] = provider.calls
    assert task == "judge" and user.startswith("【资料】\n【行程】第 1 天 冰川点") and user.endswith("【回答】\n冰川点的路一般 5–11 月通车。门票免费。")
    assert prompts.load("judge").id == "judge/v1"


def test_capture_keeps_only_question_answering_calls():
    class Inner:
        name = "replay"
        model = "replay"

        def complete_json(self, task, system, user, schema):
            return Completion(data={"answer": " 在 Wawona 附近。 ", "found": True, "sources": [1]}, model="m", latency_ms=0)

    capture = judge.Capture(Inner())
    capture.complete_json("intake", "s", "u1", {})
    capture.complete_json("qa", "s", "资料……", {})
    assert capture.qa == [{"evidence": "资料……", "draft": "在 Wawona 附近。", "found": True}]


def test_planted_claims_are_not_in_the_evidence():
    # 校准用的话不能碰巧是资料里有的：都写得很离谱、和公园的实际情况对不上
    assert all("免费" in claim or "缆车" in claim or "2000" in claim or "free" in claim for claim in judge.PLANTED)
