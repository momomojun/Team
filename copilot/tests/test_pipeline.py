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


def test_owner_trial_conversation():
    """2026-10-18 仓库主人试用的那段对话：明天出发、从安大略机场、改住民宿、再问问题"""
    provider = ScriptedProvider([
        extraction(parks=["优胜美地"], dates=["明天"], duration="3天"),  # 第 1 句
        extraction(preferences=["我想住airbnb"]),                          # 第 4 句（第 2、3 句是回答追问，不调模型）
        extraction(),                                                      # 第 5 句是提问，什么条件都没有
        {"found": True, "answer": "El Portal 是优胜美地西侧园外最近的住处，到山谷约 20 分钟。", "sources": [1]},
        extraction(),                                                      # 第 6 句：“好的”
    ])
    session = Session(provider, "2026-10-18", log=False)
    first = session.send("我想在明天出发去优胜美地玩，你给我规划一下，大概3天左右吧")
    assert "2026 年 10 月 19 日" in first.text and first.question["kind"] == "choose"
    session.send("我从ont出发")
    planned = session.send("2")
    assert planned.status == "planned"
    assert "08:00 从安大略国际机场（ONT）出发" in planned.text
    assert "最后开回安大略国际机场（ONT）" in planned.text and "晚上住 安大略" not in planned.text
    assert "弗雷斯诺机场（FAT）" in planned.text  # 太远了，提一下近一些的机场
    assert "火瀑只在 2 月中下旬" in planned.text
    changed = session.send("我想住airbnb")
    assert changed.text.startswith("好，改了：住宿改成民宿。")
    assert "airbnb.com" in changed.text
    asked = session.send("El Portal是什么地方，离园区多远啊")
    assert asked.text.startswith("El Portal 是优胜美地西侧园外最近的住处") and "（资料：El Portal）" in asked.text
    assert "第 1 天" not in asked.text and asked.result == changed.result
    assert asked.trace["qa"]["retrieved"][0] == "yose-stay-el-portal"
    assert session.send("好的").text.startswith("好的。想改什么直接说")


def test_restart_and_change_with_a_question():
    """10-18 第二次试用：“帮我安排一个新的行程”要从头来；“三座都玩，要几天”先给新行程，查得到的再回答"""
    provider = ScriptedProvider([
        extraction(parks=["雷尼尔山"], dates=["2027年7月10日"], duration="3天", origin="SEA", preferences=["适中"]),
        extraction(parks=["西雅图附近的三个国家公园"]),
        {"found": True, "answer": "西雅图周边一共 3 处：雷尼尔山、奥林匹克、北瀑布。", "sources": [1]},
        extraction(),
    ])
    session = Session(provider, "2026-10-18", log=False)
    assert session.send("2027年7月10日从SEA去雷尼尔山3天，节奏适中").status == "planned"
    changed = session.send("西雅图附近的三个国家公园都玩，要几天？")
    assert changed.status == "planned" and sorted(changed.request["parks"]) == ["mora", "noca", "olym"]
    assert changed.text.startswith("“西雅图附近”按网站的片区算是雷尼尔山、奥林匹克、北瀑布这 3 座。\n好，改了：公园改成")
    assert changed.text.endswith("西雅图周边一共 3 处：雷尼尔山、奥林匹克、北瀑布。\n（资料：西雅图周边）")
    fresh = session.send("帮我安排一个新的行程")
    assert fresh.status == "needs_input" and fresh.text.startswith("好，重新排一个新的行程")
    assert session.last_result is None and fresh.question["kind"] == "parks"
