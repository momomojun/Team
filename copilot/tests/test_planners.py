"""排行程三组对照（eval/planners.py）：用假模型跑通一遍，打分规则认得出编的景点、去不了的月份、没照用户说的做。要 Node 24"""
import json
import shutil
import sys
from pathlib import Path

import pytest

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="需要 Node 24")
EVAL = Path(__file__).resolve().parents[1] / "eval"
sys.path.insert(0, str(EVAL))

import planners  # noqa: E402
from nps_copilot.providers import Completion  # noqa: E402


class FakeGemini:
    """A 组编一个不存在的景点；B 组照资料挑两个真的"""

    def __init__(self, model, max_tokens=None):
        self.model, self.name = model, "gemini"

    def complete_json(self, task, system, user, schema):
        if task == "planner_a":
            days = [{"stops": ["隧道观景点（Tunnel View）", "水晶瀑布秘境（Crystal Falls Secret）"]}]
        else:
            days = [{"stops": ["隧道观景点（Tunnel View）"]}, {"stops": ["优胜美地瀑布（Yosemite Falls）"]}]
        return Completion(data={"days": days}, model=self.model, latency_ms=1000, raw=json.dumps({"days": days}))


def test_three_groups_run_and_score(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(planners, "GeminiProvider", FakeGemini)
    monkeypatch.setattr(planners, "RECORDINGS", tmp_path)
    monkeypatch.setattr(planners.tracking, "log", lambda *args, **kwargs: None)
    monkeypatch.setattr(sys, "argv", ["planners.py", "--record", "--cases", "1"])
    assert planners.main() == 0
    out = capsys.readouterr().out
    report = json.loads(Path(out.strip().splitlines()[-1].split("报告：")[1]).read_text(encoding="utf-8"))
    a, b, c = (report["runs"][k][0]["score"] for k in "ABC")
    # 第 1 条是优胜美地 2 天、7 月、点名要去优胜美地瀑布
    assert a["problems"]["unknown"] == ["水晶瀑布秘境（Crystal Falls Secret）"]
    assert a["problems"]["days"] == ["排了 1 天"] and a["problems"]["include"] == ["yose-yosemite-falls"]
    assert b["clean"] and b["matched"] == 2
    assert c["matched"] >= 4
    assert report["table"]["B"]["clean_rate"] == 1.0
    Path(out.strip().splitlines()[-1].split("报告：")[1]).unlink()
