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
