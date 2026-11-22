"""多 agent 协作（team.py）：规划 agent 摘的软要求代码怎么核对、翻成引擎参数；接上真的引擎，审查 agent 怎么商量。
模型都是写好的假回答（ScriptedProvider），不调真模型；接引擎的要装 Node 24。"""
import shutil

import pytest
from conftest import extraction

from nps_copilot import team
from nps_copilot.pipeline import Session
from nps_copilot.plan_client import plan_trip
from nps_copilot.providers import ScriptedProvider

needs_node = pytest.mark.skipif(shutil.which("node") is None, reason="需要 Node 24")
YOSE = {"parks": ["yose"], "startDate": "2027-06-10", "days": 5}


def test_wishes_need_a_quote_from_the_user():
    raw = [
        {"kind": "rest_days", "evidence": "中间留一天什么都不干", "min": 1, "middle": True},
        {"kind": "max_drive_per_day", "evidence": "每天开车别超过2小时", "minutes": 120},  # 用户没这么说
    ]
    plan = team.compile_wishes(raw, ["2027年6月10日从弗雷斯诺去优胜美地玩5天，中间留一天什么都不干"], YOSE)
    assert [w.kind for w in plan.wishes] == ["rest_days"]
    assert plan.prefs == {"restDays": [3]}
    assert plan.trace["dropped"][0]["reason"] == "evidence_not_in_messages"


def test_areas_roads_and_places_must_exist():
    messages = ["红杉玩3天，Cedar Grove 不去，还想去大峡谷北缘看看，一定要去 Moro Rock"]
    raw = [
        {"kind": "exclude_area", "evidence": "Cedar Grove 不去", "area": "seki/cedar-grove"},
        {"kind": "exclude_area", "evidence": "Cedar Grove 不去", "area": "seki/made-up"},
        {"kind": "include", "evidence": "一定要去 Moro Rock", "places": ["Moro Rock"]},
        {"kind": "include", "evidence": "大峡谷北缘", "places": ["大峡谷北缘"]},
        {"kind": "road_day", "evidence": "一定要去 Moro Rock", "road": "glac-logan-pass"},
    ]
    plan = team.compile_wishes(raw, messages, {"parks": ["seki"], "startDate": "2027-06-14", "days": 3})
    assert plan.prefs == {"excludeAreas": ["seki/cedar-grove"]}
    assert plan.include == ["seki-moro-rock"]
    assert plan.unknown == ["大峡谷北缘"]
    reasons = sorted(item["reason"] for item in plan.trace["dropped"])
    assert reasons == ["places_not_found", "unknown_area", "unknown_road"]


def test_apply_replaces_prefs_and_merges_user_edits():
    plan = team.Plan(prefs={"maxStopsPerDay": 2}, include=["a"], exclude=["b"])
    request = {"parks": ["yose"], "prefs": {"restDays": [2]}, "include": ["c"], "exclude": ["a"]}
    out = team.apply(plan, request)
    assert out["prefs"] == {"maxStopsPerDay": 2}
    assert out["include"] == ["c"] and out["exclude"] == ["a", "b"]  # 用户自己说不去的，规划 agent 加不回来


@needs_node
def test_one_hotel_is_fixed_by_code_and_explained():
    """只住一家：引擎没有这个旋钮，排完由代码合并住处（挑整趟开车最少的那家），不用审查 agent"""
    request = {"contract": "trip-request/v1", "parks": ["zion", "brca"], "startDate": "2027-05-20", "days": 5,
               "origin": {"airport": "LAS"}, "destination": {"airport": "LAS"}, "pace": "normal", "lodgingPref": "any"}
    plan = team.compile_wishes([{"kind": "max_lodgings", "evidence": "只住一家酒店", "count": 1}], ["只住一家酒店，不想换来换去"], request)
    call = plan_trip(request, "2026-11-21")
    outcome = team.negotiate(ScriptedProvider([]), plan, request, call, lambda r: plan_trip(r, "2026-11-21"))
    assert outcome.status[0]["ok"]
    assert len({day["lodging"]["id"] for day in outcome.result["days"][:-1]}) == 1
    lines = team.tradeoffs(outcome, plan.wishes, [], True)
    assert lines[0].startswith("按你说的排了：只住一家")


@needs_node
def test_review_agent_gives_up_on_an_impossible_wish():
    """布莱斯 2 天、每天都看日落：第 2 天要开回拉斯维加斯（4 个多小时），看不了。审查 agent 放弃这条，说明里讲清楚"""
    request = {"contract": "trip-request/v1", "parks": ["brca"], "startDate": "2027-09-08", "days": 2,
               "origin": {"airport": "LAS"}, "destination": {"airport": "LAS"}, "pace": "normal", "lodgingPref": "any"}
    plan = team.compile_wishes([{"kind": "slot_each_day", "evidence": "catch the sunset both evenings", "slot": "sunset"}],
                               ["I want to catch the sunset both evenings."], request)
    request = team.apply(plan, request)
    call = plan_trip(request, "2026-11-21")
    provider = ScriptedProvider([{"actions": [{"type": "give_up", "wish": 1}], "reason": "最后一天要开回拉斯维加斯"}])
    outcome = team.negotiate(provider, plan, request, call, lambda r: plan_trip(r, "2026-11-21"))
    assert outcome.given_up == {0} and not outcome.status[0]["ok"]
    text = " ".join(team.tradeoffs(outcome, plan.wishes, [], False))
    assert "I couldn't fully manage sunset every day: not met on day 2" in text
    assert provider.calls[0][0] == "team_review" and "[没做到] slot_each_day" in provider.calls[0][1]


@needs_node
def test_drive_cap_met_by_leaving_out_stops_says_which():
    """黄石 2 天、每天开车不超过 1 小时：引擎照做了（开到公园那段不算），但少去了几个有名的，要照实说"""
    request = {"contract": "trip-request/v1", "parks": ["yell"], "startDate": "2027-07-08", "days": 2,
               "origin": {"airport": "BZN"}, "destination": {"airport": "BZN"}, "pace": "normal", "lodgingPref": "any"}
    plan = team.compile_wishes([{"kind": "max_drive_per_day", "evidence": "每天开车别超过1小时", "minutes": 60}],
                               ["有名的都要看，而且每天开车别超过1小时"], request)
    request = team.apply(plan, request)
    call = plan_trip(request, "2026-11-21")
    outcome = team.negotiate(ScriptedProvider([]), plan, request, call, lambda r: plan_trip(r, "2026-11-21"))
    assert outcome.status[0]["ok"] and outcome.lost
    text = " ".join(team.tradeoffs(outcome, plan.wishes, [], True))
    assert "这几个平常会排的没排" in text and "取舍" in text


@needs_node
def test_review_agent_actions_are_checked(monkeypatch):
    """审查 agent 只能动行程里有的景点；编出来的 id 不做，检查结果没变好的版本不留"""
    request = {"contract": "trip-request/v1", "parks": ["romo"], "startDate": "2027-06-20", "days": 3,
               "origin": {"airport": "DEN"}, "destination": {"airport": "DEN"}, "pace": "normal", "lodgingPref": "any"}
    plan = team.compile_wishes([{"kind": "no_consecutive_early", "evidence": "别连着两天早起", "time": "08:00"}], ["别连着两天早起"], request)
    call = plan_trip(request, "2026-11-21")
    provider = ScriptedProvider([{"actions": [{"type": "drop_stop", "id": "romo-made-up"}]}] * 3)
    outcome = team.negotiate(provider, plan, request, call, lambda r: plan_trip(r, "2026-11-21"))
    assert outcome.request == request  # 什么都没改


@needs_node
def test_session_with_team_plans_a_rest_day(tmp_path, monkeypatch):
    monkeypatch.setenv("COPILOT_RUNS", str(tmp_path))
    monkeypatch.setenv("COPILOT_TEAM", "1")
    message = "2027年6月10日从弗雷斯诺去优胜美地玩5天，中间留一天什么都不干，在酒店休息，适中"
    provider = ScriptedProvider([
        extraction(parks=["优胜美地"], dates=["2027年6月10日"], duration="5天", origin="弗雷斯诺", preferences=["适中"]),
        {"wishes": [{"kind": "rest_days", "evidence": "中间留一天什么都不干", "min": 1, "middle": True}]},
    ])
    reply = Session(provider, "2026-11-21", log=False, dispatcher=False).send(message)
    assert reply.status == "planned"
    assert reply.request["prefs"] == {"restDays": [3]}
    assert reply.result["days"][2]["stops"] == []
    assert reply.result["days"][2]["lodging"]["id"] == reply.result["days"][1]["lodging"]["id"]
    assert "按你说的排了：中间留一天休息" in reply.text
    assert reply.trace["team"]["final"] == [True]
    assert [task for task, _ in provider.calls] == ["intake", "team_plan"]  # 做到了，不用审查 agent


@needs_node
def test_team_off_by_default(tmp_path, monkeypatch):
    monkeypatch.setenv("COPILOT_RUNS", str(tmp_path))
    monkeypatch.delenv("COPILOT_TEAM", raising=False)
    provider = ScriptedProvider([extraction(parks=["优胜美地"], dates=["2027年6月10日"], duration="5天", origin="弗雷斯诺", preferences=["适中"])])
    reply = Session(provider, "2026-11-21", log=False, dispatcher=False).send("2027年6月10日从弗雷斯诺去优胜美地玩5天，中间留一天休息，适中")
    assert "prefs" not in reply.request and "team" not in reply.trace


def test_model_output_types_are_cleaned_and_clamped():
    """输出格式只限定了 kind（Gemini 嫌复杂的 schema），类型、范围由代码把关：字符串当数字、超出契约范围的不能交给引擎"""
    messages = ["每天开车别超过10小时，每天最多去30个地方，徒步别超过 one hour"]
    raw = [
        {"kind": "max_drive_per_day", "evidence": "每天开车别超过10小时", "minutes": 900},
        {"kind": "max_stops_per_day", "evidence": "每天最多去30个地方", "count": 30},
        {"kind": "max_hike_min", "evidence": "徒步别超过 one hour", "minutes": "60"},
        {"kind": "rest_days", "evidence": "每天最多去30个地方", "min": True},
    ]
    plan = team.compile_wishes(raw, messages, YOSE)
    assert plan.prefs == {"maxDrivePerDay": 720, "restDays": [3]}
    assert sorted(item["reason"] for item in plan.trace["dropped"]) == ["no_count", "no_minutes"]


def test_tradeoff_for_a_missing_slot_is_written_in_words():
    wish = team.Wish("has_slot", {"slot": "sunrise", "min": 1}, "至少要看一次日出")
    item = {"ok": False, "detail": "sunrise 0 站", "facts": {"count": 0}}
    outcome = team.Outcome({}, {"days": [], "skipped": []}, None, [item])
    zh, en = team.tradeoffs(outcome, [wish], [], True), team.tradeoffs(outcome, [wish], [], False)
    assert zh == ["没能完全做到“看日出”：一次都没排上（这几天合适的时段已经排了别的、或者赶不过去）。这是取舍，想换个办法可以直接说。"]
    assert "sunrise 0" not in en[0] and "none fit into the plan" in en[0]
