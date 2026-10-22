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
