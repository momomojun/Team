"""后台统计（monitor.py）：测试用的假模型（scripted）跑出来的对话不算进统计，也不再写进日志"""
import json

from nps_copilot import monitor
from nps_copilot.pipeline import is_scripted


def test_scripted_turns_are_left_out(tmp_path):
    import datetime as dt

    today = dt.date.today().isoformat()
    real = {"session": "a", "turn": 1, "status": "planned", "calls": [{"task": "intake", "model": "gemini-3.5-flash-lite", "ms": 900}]}
    fake = {"session": "b", "turn": 1, "status": "planned", "calls": [{"task": "intake", "model": "scripted", "ms": 0}]}
    (tmp_path / f"{today}.jsonl").write_text("\n".join(json.dumps(row) for row in (real, fake)) + "\n", encoding="utf-8")
    rows = monitor.load(1, tmp_path)
    assert [row["session"] for row in rows] == ["a"]
    assert is_scripted(fake) and not is_scripted(real)


def test_recent_shows_how_each_turn_found_its_docs():
    from nps_copilot import monitor

    rows = [
        {"day": "2026-11-13", "session": "abc", "turn": 1, "message": "6 月去锡安", "status": "planned"},
        {"day": "2026-11-13", "session": "abc", "turn": 2, "message": "那条蹚水的峡谷要许可吗", "status": "needs_input",
         "qa": [{"query": "Narrows 许可", "retrieval": "vector", "retrieval_ms": 412}]},
        {"day": "2026-11-13", "session": "abc", "turn": 3, "message": "冰川点几点日落", "status": "needs_input",
         "qa": {"retrieval": "bm25", "retrieval_fallback": "QuotaError: 今天的免费额度用完了（429）", "retrieval_ms": 980}},
    ]
    newest, middle, oldest = monitor.recent(rows)
    assert oldest["retrieval"] is None
    assert middle["retrieval"] == {"how": "vector", "fallback": None, "ms": 412}
    assert newest["retrieval"]["how"] == "bm25" and newest["retrieval"]["fallback"].startswith("QuotaError")


def test_recent_shows_which_way_each_question_was_answered():
    """11-19：后台看得出这一轮是模型自己查（agent）、自己查退回了找一次就答，还是找一次就答"""
    from nps_copilot import monitor

    rows = [
        {"session": "a", "turn": 1, "message": "6 月去锡安", "status": "planned"},
        {"session": "a", "turn": 2, "message": "这个季节去哪", "qa": {"retrieval": "vector"}},
        {"session": "a", "turn": 3, "message": "冰川点开吗", "qa": [{"mode": "agent", "steps": []}]},
        {"session": "a", "turn": 4, "message": "冰川点开吗", "qa": {"retrieval": "bm25", "agent": {"mode": "agent", "fallback": "timeout"}}},
    ]
    assert [row["qa_mode"] for row in monitor.recent(rows)] == ["agent→qa", "agent", "qa", None]


def test_recent_shows_the_agent_steps():
    """11-20：staging 上“自己查”答不出来，后台要看得到走了几步、查了什么、没查成的原因、为什么停下"""
    from nps_copilot import monitor

    trace = {"mode": "agent", "answer": "not_found", "fallback": None, "steps": [
        {"action": "call", "calls": [{"tool": "season_rank"}], "tool_ms": 9500, "tool_error": "TimeoutExpired: node"},
        {"action": "call", "calls": [{"tool": "find_attractions", "error": "没说是哪座公园"}]},
        {"action": "answer"},
    ]}
    row = monitor.recent([{"session": "a", "turn": 1, "message": "推荐公园", "qa": [trace]}])[0]
    assert row["agent"] == {"steps": 3, "tools": ["season_rank", "find_attractions"], "tool_ms": 9500, "answer": "not_found",
                            "fallback": None, "errors": ["没说是哪座公园", "TimeoutExpired: node"]}
    assert monitor.recent([{"session": "a", "turn": 1, "message": "6 月去锡安"}])[0]["agent"] is None
