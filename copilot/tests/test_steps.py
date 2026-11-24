"""11-23：仓库主人线上试了说“很基础的都不行”、看不出 search agent 和多 agent 在哪里。这里测修的几处和给用户看的“这一步做了什么”"""
import datetime as dt

from nps_copilot import steps
from nps_copilot.dates import relative_date
from nps_copilot.knowledge import group_mention, group_parks


def test_state_names_list_the_parks_to_choose_from():
    # 加州 8 座：原来只认 4 座以内的片区，也不认英文、打错的 Califonia
    for said in ["我想去加州的", "我想去加州的国家公园", "I want to go to the Califonia's NP", "national parks in California"]:
        mention = group_mention(said, limit=9)
        assert mention and len(mention[1]) == 8, said
    assert group_mention("national parks in Utah", limit=9)[1] == ["zion", "brca", "cany", "arch", "care"]
    assert group_mention("我从加州出发去黄石", limit=9) is None  # 出发地不算
    assert group_mention("我想去加州的") is None  # “都去”的那种只认 4 座以内
    assert group_parks("西雅图附近的三个国家公园都去")[1] == ["mora", "olym", "noca"]
    assert group_mention("西弗吉尼亚的国家公园", limit=9)[1] == ["neri"]  # 不是“弗吉尼亚”


def test_tomorrow_typos():
    ref = dt.date(2026, 11, 23)
    for word in ["tomoroow", "tomorow", "tommorow", "tmr", "tomorrow", "明天"]:
        assert relative_date(word, ref)[0] == dt.date(2026, 11, 24), word
    assert relative_date("tomorrowland", ref) is None


def test_steps_say_which_agent_did_what():
    trace = {
        "dispatch": {"actions": [{"type": "conditions"}]},
        "team_plan": {"wishes": [{"kind": "rest_days", "params": {"min": 1, "middle": True}, "evidence": "中间留一天休息"}], "dropped": []},
        "request": {"days": 5}, "plan": {"latency_ms": 900},
        "team": {"first": [False], "final": [True], "rounds": [{"review": {}}, {"by": "x", "ok": [True]}]},
        "writer": {"writer": "template"},
    }
    said = [step["text"] for step in steps.steps(trace, True)]
    assert said[0] == "调度员：判断这句话要改条件"
    assert "规划 agent：从你的话里摘出 1 条要求：中间留一天休息" in said
    assert any(text.startswith("行程引擎：排了 5 天") for text in said)
    assert any("审查 agent" in text and "1/1" in text for text in said)
    who = {step["who"]: step["model"] for step in steps.steps(trace, True)}
    assert who["engine"] is False and who["planner"] is True
    asked = steps.steps({"qa": {"mode": "agent", "steps": [{"calls": [{"tool": "season_rank"}]}, {}]}}, False)
    assert asked[0]["who"] == "search_agent" and "seasonal scores" in asked[0]["text"] and "2 steps" in asked[0]["text"]
    quiet = steps.steps({"team_plan": {"wishes": [], "dropped": [{"wish": {}, "reason": "evidence_not_about_kind"}]}}, True)
    assert "没有特别的要求" in quiet[0]["text"] and "核对后都不算" in quiet[0]["text"]
    assert steps.steps({}, True) == []
