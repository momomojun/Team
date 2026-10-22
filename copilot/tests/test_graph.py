"""LangGraph 编排（graph.py）：一轮对话按流程图跑、结果和直接调 Session.send 一样；Copilot 重启以后从检查点接着聊。
CI 只装 copilot[dev]，没有 langgraph 就跳过；接真的行程引擎，要 Node 24"""
import shutil

import pytest
from conftest import extraction

from nps_copilot.providers import ScriptedProvider

pytest.importorskip("langgraph.checkpoint.sqlite")
pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="需要 Node 24")

from nps_copilot.graph import CopilotGraph  # noqa: E402

PLAN = "2027年6月1日从弗雷斯诺去优胜美地玩4天，节奏适中"


def scripted():
    return ScriptedProvider([
        {"actions": [{"type": "conditions"}]},
        extraction(parks=["优胜美地"], dates=["2027年6月1日"], duration="4天", origin="弗雷斯诺", preferences=["节奏适中"]),
        {"actions": [{"type": "conditions"}]},
        extraction(duration="3天"),
    ])


def test_a_turn_runs_through_the_graph_and_survives_a_restart(tmp_path, monkeypatch):
    monkeypatch.setenv("COPILOT_RUNS", str(tmp_path / "runs"))
    provider = scripted()
    db = tmp_path / "sessions.sqlite"
    graph = CopilotGraph(lambda: provider, db=db)
    session = graph.create("2026-10-18")
    session.log = False
    first = graph.send(session.id, PLAN)
    assert first.status == "planned" and len(first.result["days"]) == 4
    assert first.trace["dispatch"] and first.trace["status"] == "planned"
    # 流程图：understand 之后按调度员的决定走 dispatch 或 legacy，都到 finish
    assert set(graph.app.get_graph().nodes) >= {"understand", "dispatch", "legacy", "finish"}

    # 重启：新的流程图对象、同一个检查点文件，内存里什么都没有
    again = CopilotGraph(lambda: provider, db=db)
    restored = again.get(session.id)
    assert restored is not None and restored.last_request["days"] == 4 and restored.turn == 1
    second = again.send(session.id, "改成玩3天")
    assert second.status == "planned" and len(second.result["days"]) == 3
    assert "改了" in second.text
    # 不认识的会话
    assert again.get("nope") is None and again.send("nope", "你好") is None


def test_graph_reports_progress_like_send(tmp_path, monkeypatch):
    monkeypatch.setenv("COPILOT_RUNS", str(tmp_path / "runs"))
    provider = scripted()
    graph = CopilotGraph(lambda: provider, db=tmp_path / "s.sqlite")
    session = graph.create("2026-10-18")
    session.log = False
    events = []
    session.progress = events.append
    graph.send(session.id, PLAN)
    assert [event["step"] for event in events] == ["understand", "read", "plan", "write"]
