"""调度员：模型决定做哪几件事，代码去做、去核对。用写好的模型输出跑（不要模型），接真的行程引擎（要 Node 24）。"""
import shutil

import pytest
from conftest import extraction

from nps_copilot.knowledge import resolve
from nps_copilot.pipeline import Session
from nps_copilot.providers import Completion, ProviderError, ScriptedProvider

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="需要 Node 24")
PLAN = "2027年6月1日从弗雷斯诺去优胜美地玩4天，节奏适中"


def act(*actions):
    return {"actions": list(actions)}


def plan_ids(reply):
    return [stop["id"] for day in reply.result["days"] for stop in day["stops"]]


def planned_session(*more):
    provider = ScriptedProvider([
        act({"type": "conditions"}),
        extraction(parks=["优胜美地"], dates=["2027年6月1日"], duration="4天", origin="弗雷斯诺", preferences=["节奏适中"]),
        *more,
    ])
    session = Session(provider, "2026-10-18", log=False)
    first = session.send(PLAN)
    assert first.status == "planned" and "yose-mariposa-grove" in plan_ids(first)
    return session, provider


def test_names_resolve_to_this_trips_parks():
    assert resolve("塔夫特点", ["yose"], "attraction").id == "yose-taft-point"
    assert resolve("the Narrows", ["zion"], "attraction").id == "zion-narrows"
    assert resolve("El Portal", ["yose"], "lodging").id == "yose-stay-el-portal"
    assert resolve("老忠实泉", ["zion"], "attraction") is None  # 不在这次的公园里


def test_remove_then_lodging_and_question_in_one_message():
    session, provider = planned_session(
        act({"type": "remove_stop", "place": "马里波萨巨杉林"}),
        act({"type": "set_lodging", "place": "El Portal", "night": 1}, {"type": "ask", "query": "冰川点几月开放"}),
        {"found": True, "answer": "冰川点一般 5 月下旬或 6 月到 11 月通车。", "sources": [1]},
    )
    removed = session.send("马里波萨巨杉林就不去了")
    assert "yose-mariposa-grove" not in plan_ids(removed)
    assert removed.text.startswith("好，改了：不去马里波萨巨杉林。")
    both = session.send("第一晚住El Portal，冰川点几月开？")
    assert both.result["days"][0]["lodging"]["id"] == "yose-stay-el-portal"
    assert "yose-mariposa-grove" not in plan_ids(both)  # 前面去掉的还记着
    assert "第 1 晚住 El Portal" in both.text and both.text.rstrip().endswith("（资料：冰川点）")
    assert [task for task, _ in provider.calls].count("intake") == 1  # 改景点、住处不再调 Intake


def test_made_up_place_is_dropped_and_unknown_place_is_reported():
    session, _ = planned_session(
        act({"type": "remove_stop", "place": "大峡谷村"}),  # 对话里没人说过：不做
        extraction(),                                      # 退回原来的流程，摘不到条件
        act({"type": "add_stop", "place": "老忠实泉"}),    # 说过，但不是优胜美地的
    )
    reply = session.send("随便看看")
    assert reply.trace["route"] == "legacy" and reply.trace["dispatch"]["dropped"][0]["reason"] == "place_not_in_conversation"
    assert "第 1 天（" not in reply.text
    unknown = session.send("加上老忠实泉")
    assert "没找到叫“老忠实泉”的景点" in unknown.text and unknown.request["parks"] == ["yose"]


def test_new_trip_clears_conditions_and_edits():
    session, _ = planned_session(
        act({"type": "remove_stop", "place": "马里波萨巨杉林"}),
        act({"type": "new_trip"}),
        extraction(),
    )
    session.send("马里波萨巨杉林就不去了")
    fresh = session.send("帮我安排一个新的行程")
    assert fresh.status == "needs_input" and fresh.text.startswith("好，重新排一个新的行程")
    assert session.last_result is None and session.exclude == [] and fresh.question["kind"] == "parks"


def test_conditions_can_point_back_to_a_park_from_the_conversation():
    provider = ScriptedProvider([
        act({"type": "ask", "query": "黄石几月份去最好"}),
        extraction(),  # 还没排出行程：每一句也先交给 Intake
        {"found": True, "answer": "黄石最适合 6–9 月去。", "sources": [1]},
        act({"type": "conditions", "place": "黄石"}),
        extraction(dates=["2027年7月10日"], origin="博兹曼", duration="5天", preferences=["节奏适中"]),
    ])
    session = Session(provider, "2026-10-18", log=False)
    asked = session.send("黄石几月份去最好？")
    assert asked.status == "needs_input" and "6–9 月" in asked.text
    planned = session.send("那就2027年7月10日从博兹曼出发，玩5天，节奏适中")
    assert planned.status == "planned" and planned.request["parks"] == ["yell"]


class DispatchDown(ScriptedProvider):
    """调度员调用失败，其余照常"""

    def complete_json(self, task, system, user, schema) -> Completion:
        if task == "dispatch":
            raise ProviderError("timeout")
        return super().complete_json(task, system, user, schema)


def test_dispatcher_failure_falls_back_to_rules():
    provider = DispatchDown([extraction(parks=["优胜美地"], dates=["2027年6月1日"], duration="4天", origin="弗雷斯诺",
                                        preferences=["节奏适中"])])
    reply = Session(provider, "2026-10-18", log=False).send(PLAN)
    assert reply.status == "planned" and reply.trace["route"] == "legacy" and "timeout" in reply.trace["dispatch"]["error"]


def test_short_answer_to_a_follow_up_skips_the_dispatcher():
    provider = ScriptedProvider([act({"type": "conditions"}), extraction(parks=["优胜美地"], dates=["2027年6月1日"], origin="弗雷斯诺",
                                                                        preferences=["节奏适中"]), extraction()])
    session = Session(provider, "2026-10-18", log=False)
    assert session.send("2027年6月1日从弗雷斯诺去优胜美地，节奏适中").question["kind"] == "days"
    reply = session.send("4")
    assert reply.status == "planned" and "dispatch" not in reply.trace and reply.request["days"] == 4


def test_progress_is_reported_by_real_steps():
    """网站的对话框按真实的步骤显示进度：先“理解”，条件齐了报认出的条件再排，排完写说明；问问题的报“回答”"""
    provider = ScriptedProvider([
        act({"type": "conditions"}),
        extraction(parks=["优胜美地"], dates=["2027年6月1日"], duration="4天", origin="弗雷斯诺", preferences=["节奏适中"]),
    ])
    events = []
    session = Session(provider, "2026-10-18", log=False, progress=events.append)
    assert session.send(PLAN).status == "planned"
    steps = [event["step"] for event in events]
    assert steps == ["understand", "read", "plan", "write"]
    conditions = events[2]["conditions"]
    assert conditions["parks"] == ["优胜美地"] and conditions["startDate"] == "2027-06-01" and conditions["days"] == 4
    assert conditions["origin"] == "FAT"
    assert events[3]["stops"] > 0
    # 报进度出错（连接断了）不影响这一轮
    session.progress = lambda event: (_ for _ in ()).throw(RuntimeError("断了"))
    assert session.send("好的").status == "planned"
