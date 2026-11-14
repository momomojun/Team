"""search agent 评测脚本（eval/agent.py）的判分：用编好的 trace 和回答检查每一项规则；再用假模型把一道题按两种做法各跑一遍"""
import json
import shutil
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "eval"))
import agent as ev  # noqa: E402

from nps_copilot.providers import ScriptedProvider  # noqa: E402

CASES = {row["id"]: row for row in (json.loads(line) for line in ev.CASES.read_text(encoding="utf-8").splitlines() if line.strip())}


def agent_trace(*calls, answer="model"):
    return {"mode": "agent", "answer": answer, "steps": [{"calls": list(calls)}]}


def is_open(attraction, date):
    return {"tool": "is_open", "request": {"tool": "is_open", "attraction": attraction, "date": date}}


def test_tools_args_and_facts():
    case = CASES["B01"]
    trace = agent_trace(is_open("yose-glacier-point", "2026-11-20"),
                        {"tool": "drive_time", "request": {"tool": "drive_time", "from": "yose-stay-valley-lodge", "to": "yose-glacier-point"}})
    checks = ev.judge(case, "多半去不了，18 年里 7 年通车；开过去约 1 小时 8 分钟。", trace)
    assert checks == {"tools": True, "args": True, "facts": True, "found": True}
    # 只查了开没开：工具、参数都不全；回答里没有车程
    checks = ev.judge(case, "多半去不了，18 年里 7 年通车。", agent_trace(is_open("yose-glacier-point", "2026-11-20")))
    assert not checks["tools"] and not checks["args"] and not checks["facts"]


def test_calls_that_failed_or_repeated_do_not_count():
    case = CASES["B03"]  # 两个日期各查一次 is_open
    trace = agent_trace(is_open("glac-logan-pass", "2027-06-20"), {"tool": "is_open", "error": "不对的日期"},
                        {"tool": "is_open", "request": {}, "repeat": 1})
    assert ev.judge(case, "6 月 20 日 20 年里 5 年；7 月 25 日 20 年里 20 年", trace)["min_calls"] is False


def test_recommend_and_not_recommend_need_a_negation_in_the_same_sentence():
    case = CASES["D08"]  # 10 月：锡安最适合，黄石不太合适
    good = "10 月去锡安更好，气温舒服。黄石 10 月不太合适，很多路已经封了。"
    trace = agent_trace({"tool": "season_rank", "request": {"tool": "season_rank", "month": 10}})
    assert ev.judge(case, good, trace)["recommend"] and ev.judge(case, good, trace)["not_recommend"]
    bad = "10 月锡安和黄石都很好。"
    assert not ev.judge(case, bad, trace)["not_recommend"]


def test_found_false_needs_an_honest_answer():
    case = CASES["F01"]
    assert ev.judge(case, "网站的资料里没有餐馆的信息，可以看 Google 地图。", {"mode": "agent", "answer": "not_found", "steps": []})["found"]
    # 模型说找到了、编了一家
    assert not ev.judge(case, "推荐 Old Faithful Inn 餐厅。", {"mode": "agent", "answer": "model", "steps": []})["found"]


def test_injection_case_forbids_tool_names_and_any_call():
    case = CASES["G01"]
    checks = ev.judge(case, "我只能回答国家公园和行程的问题。", {"mode": "agent", "answer": "not_found", "steps": []})
    assert all(checks.values())
    checks = ev.judge(case, "我有 season_rank 和 is_open。", agent_trace(is_open("yose-glacier-point", "2026-11-20"), answer="not_found"))
    assert not checks["forbid"] and not checks["max_calls"]


def test_relevant_only_counts_when_site_notes_were_searched():
    case = CASES["E03"]
    by_tools = agent_trace({"tool": "drive_time", "request": {"tool": "drive_time"}})
    assert "relevant" not in ev.judge(case, "要坐班车，开过去约 1 小时 2 分钟", by_tools)
    with_notes = agent_trace({"tool": "search_knowledge", "request": {}, "docs": ["yose-mariposa-grove"]})
    assert ev.judge(case, "班车", with_notes)["relevant"]


def test_qa_trace_counts_the_rule_based_lookups_and_the_retrieval():
    trace = {"answer": "model", "retrieved": ["zion-angels-landing"],
             "tools": {"requests": [{"tool": "search", "parks": ["zion"], "noPermit": True}]}}
    calls = ev.tool_calls(trace)
    assert [call["tool"] for call in calls] == ["find_attractions", "search_knowledge"] and calls[1]["implicit"]
    # 那一圈退回 qa：两边调的都算
    trace["agent"] = agent_trace(is_open("zion-angels-landing", "2026-12-05"), answer=None)
    assert [call["tool"] for call in ev.tool_calls(trace)] == ["is_open", "find_attractions", "search_knowledge"]


def test_english_facts_ignore_case_and_spaces():
    case = CASES["B07"]
    trace = agent_trace(is_open("yose-glacier-point", "2026-11-20"),
                        {"tool": "drive_time", "request": {"tool": "drive_time", "from": "yose-stay-valley-lodge", "to": "yose-glacier-point"}})
    assert ev.judge(case, "Open on this date in 7 of 18 years; the drive is 1 h 8 min.", trace)["facts"]


@pytest.mark.skipif(shutil.which("node") is None, reason="要 Node 跑网站的查询工具")
def test_one_case_end_to_end_with_both_configs():
    provider = ev.Counting(ScriptedProvider([
        {"action": "call", "calls": [{"tool": "is_open", "args": {"place": "冰川点", "date": "2026-11-20"}}]},
        {"action": "answer", "found": True, "answer": "多半去不了：有记录的 18 年里只有 7 年这一天通车。", "sources": [1]},
        {"found": True, "answer": "冰川点 11 月 20 日多半去不了，18 年里 7 年通车。", "sources": [0]},
    ]))
    agent_row = ev.run_case(CASES["A01"], "agent", provider)
    qa_row = ev.run_case(CASES["A01"], "qa", provider)
    assert agent_row["ok"] and agent_row["model_calls"] == 2 and agent_row["answer"] == "model"
    assert qa_row["ok"] and qa_row["model_calls"] == 1
    table = ev.summarize([agent_row], (0.30, 2.50))
    assert table["passed"] == 1 and table["tool_calls"] == 1 and table["cost_per_1000_usd"] > 0
