"""接上真的行程引擎（Node 命令行）跑一遍：Intake → plan_trip → Critic → Writer。要装 Node 24。"""
import json
import shutil

import jsonschema
import pytest
from conftest import ROOT, extraction

from nps_copilot.critic import critique
from nps_copilot.pipeline import Session
from nps_copilot.plan_client import PlanError, plan_trip
from nps_copilot.providers import ScriptedProvider
from nps_copilot.writer import faithful, template, write

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="需要 Node 24")
EXAMPLE = json.loads((ROOT / "copilot" / "contracts" / "examples" / "yose-4d-fat.json").read_text(encoding="utf-8"))
RESULT_SCHEMA = json.loads((ROOT / "copilot" / "contracts" / "trip-result.v1.schema.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def yosemite():
    return plan_trip(EXAMPLE, "2026-10-16").result


def test_plan_tool_returns_a_valid_result(yosemite):
    # result 里的 request 引用另一个 schema 文件，这里只校验其余部分
    schema = {**RESULT_SCHEMA, "properties": {**RESULT_SCHEMA["properties"], "request": {"type": "object"}}}
    jsonschema.validate(yosemite, schema)
    assert len(yosemite["days"]) == 4


def test_plan_tool_rejects_bad_requests():
    with pytest.raises(PlanError) as error:
        plan_trip({**EXAMPLE, "days": 30}, "2026-10-16")
    assert error.value.issues[0]["path"] == "/days"


def test_template_mentions_every_stop_and_invents_nothing(yosemite):
    review = critique(EXAMPLE, yosemite)
    text = template(EXAMPLE, yosemite, review, "zh")
    for day in yosemite["days"]:
        for stop in day["stops"]:
            assert stop["nameZh"] in text and stop["start"] in text
    assert faithful(text, yosemite, text) == []


def test_faithfulness_check_catches_made_up_times_and_numbers(yosemite):
    review = critique(EXAMPLE, yosemite)
    base = template(EXAMPLE, yosemite, review, "zh")
    assert "04:44" in faithful("第 1 天 04:44 出发，门票 $35", yosemite, base)
    assert "35" in faithful("第 1 天 04:44 出发，门票 $35", yosemite, base)


def test_model_writer_falls_back_to_template_when_unfaithful(yosemite):
    review = critique(EXAMPLE, yosemite)
    provider = ScriptedProvider([{"summary": "第 1 天 05:55 出发，一共 9 个景点"}])
    text, trace = write(EXAMPLE, yosemite, review, "zh", provider, use_model=True)
    assert trace["writer"] == "template" and trace["fallback"] == "unfaithful"
    assert text == template(EXAMPLE, yosemite, review, "zh")


def test_critic_relaxes_a_default_pace_only(yosemite):
    busy = {**yosemite, "days": [{**yosemite["days"][0], "warnings": ["overloaded"]}, *yosemite["days"][1:]]}
    default_pace = {**EXAMPLE, "provenance": {**EXAMPLE["provenance"], "pace": {"source": "default"}}}
    assert critique(default_pace, busy).revision["pace"] == "relaxed"
    chosen = {**EXAMPLE, "provenance": {**EXAMPLE["provenance"], "pace": {"source": "user_confirmation"}}}
    assert critique(chosen, busy).revision is None


def test_session_end_to_end(tmp_path, monkeypatch):
    monkeypatch.setenv("COPILOT_RUNS", str(tmp_path))
    provider = ScriptedProvider([extraction(parks=["优胜美地"], dates=["2027年6月1日"], duration="4天", origin="弗雷斯诺", preferences=["适中"])])
    session = Session(provider, "2026-10-16", log=False)
    reply = session.send("2027年6月1日从弗雷斯诺去优胜美地玩4天，适中")
    assert reply.status == "planned"
    assert reply.request["parks"] == ["yose"] and len(reply.result["days"]) == 4
    assert "第 1 天" in reply.text
    assert reply.trace["writer"]["writer"] == "template"
