"""用 LangGraph 跑一轮对话（计划书写的“LangGraph 编排”，10-22 做的）。

流程图（`python -m nps_copilot graph` 画成 Mermaid）：

    START → understand ─┬─ dispatch → finish → END
                        └─ legacy   ┘

- understand：这一轮开始 + 调度员看整段对话决定做哪几件事（pipeline.Session.begin、understand）；
- dispatch：按调度员给的几件事做（改条件、排行程、加减景点、换住处、回答问题……，Session.respond）；
- legacy：调度员关掉、出错，或者用户只是在回答上一句追问（“5”），走原来按规则的流程（也是 Session.respond）；
- finish：记下对话、写日志，把对话状态存进 LangGraph 的检查点（Session.snapshot）。

每个节点调的都是 pipeline.py 里同一套代码，评测（直接调 Session.send）测到的就是这里跑的。
检查点存在 SQLite（copilot/data/sessions.sqlite，COPILOT_SESSIONS_DB 可以换；不提交），按会话 id 分：
Copilot 重启以后，用原来的会话 id 接着说话，条件、行程、改动都还在。

没装 langgraph（pip install "copilot[graph]"）或者设了 COPILOT_GRAPH=0，api.py 照旧直接调 Session.send，会话只在内存里。
"""
from __future__ import annotations

import os
import sqlite3
import threading
from pathlib import Path
from typing import TypedDict

from .catalog import ROOT
from .pipeline import Reply, Session
from .providers import Provider

DB = Path(os.environ.get("COPILOT_SESSIONS_DB", ROOT / "copilot" / "data" / "sessions.sqlite"))


def enabled() -> bool:
    if os.environ.get("COPILOT_GRAPH") == "0":
        return False
    try:
        import langgraph  # noqa: F401
        import langgraph.checkpoint.sqlite  # noqa: F401
    except ImportError:
        return False
    return True


class TurnState(TypedDict, total=False):
    message: str
    # 走哪条路：dispatch（调度员给了能做的事）/ legacy
    route: str
    # 这一轮的回复（status、text、question、request、result），给 api.py
    reply: dict
    # 对话状态的存档：每轮 finish 写一次
    snapshot: str


class CopilotGraph:
    """一个 Copilot 服务一个：编好的流程图 + 检查点 + 内存里正在用的会话（重启以后从检查点恢复）"""

    def __init__(self, provider_factory, db: Path = DB):
        from langgraph.checkpoint.sqlite import SqliteSaver
        from langgraph.graph import END, START, StateGraph

        self.provider_factory = provider_factory
        self.live: dict[str, Session] = {}
        # 这一轮的中间结果（调度员的决定、日志的开头）：有 Python 对象，不放进检查点
        self.turns: dict[str, dict] = {}
        self.lock = threading.Lock()
        db.parent.mkdir(parents=True, exist_ok=True)
        self.saver = SqliteSaver(sqlite3.connect(str(db), check_same_thread=False))

        graph = StateGraph(TurnState)
        graph.add_node("understand", self._understand)
        graph.add_node("dispatch", self._respond)
        graph.add_node("legacy", self._respond)
        graph.add_node("finish", self._finish)
        graph.add_edge(START, "understand")
        graph.add_conditional_edges("understand", lambda state: state["route"], {"dispatch": "dispatch", "legacy": "legacy"})
        graph.add_edge("dispatch", "finish")
        graph.add_edge("legacy", "finish")
        graph.add_edge("finish", END)
        self.app = graph.compile(checkpointer=self.saver)

    # ---------- 会话 ----------
    def create(self, reference_date: str, writer_model: bool = False) -> Session:
        session = Session(self.provider_factory(), reference_date, writer_model=writer_model)
        self.live[session.id] = session
        return session

    def get(self, session_id: str) -> Session | None:
        """内存里的；不在（Copilot 重启过）就从检查点里最后一次存的状态恢复；都没有是 None"""
        session = self.live.get(session_id)
        if session is not None:
            return session
        state = self.app.get_state(self._config(session_id))
        snapshot = (state.values or {}).get("snapshot") if state else None
        if not snapshot:
            return None
        session = Session.restore(snapshot, self.provider_factory())
        self.live[session_id] = session
        return session

    def send(self, session_id: str, message: str) -> Reply | None:
        session = self.get(session_id)
        if session is None:
            return None
        # 同一个会话一次只跑一轮（同一个人连点两下）
        with self.lock:
            out = self.app.invoke({"message": message}, self._config(session_id))
        reply = out["reply"]
        return Reply(reply["status"], reply["text"], reply.get("question"), reply.get("request"), reply.get("result"), reply.get("trace", {}))

    def mermaid(self) -> str:
        return self.app.get_graph().draw_mermaid()

    # ---------- 节点 ----------
    @staticmethod
    def _config(session_id: str) -> dict:
        return {"configurable": {"thread_id": session_id}}

    @staticmethod
    def _id(config) -> str:
        return config["configurable"]["thread_id"]

    def _understand(self, state: TurnState, config) -> TurnState:
        session_id = self._id(config)
        session = self.live[session_id]
        turn = session.begin(state["message"])
        plan = session.understand(state["message"], turn)
        self.turns[session_id] = {"turn": turn, "plan": plan}
        return {"route": "dispatch" if plan is not None else "legacy"}

    def _respond(self, state: TurnState, config) -> TurnState:
        session_id = self._id(config)
        current = self.turns[session_id]
        current["reply"] = self.live[session_id].respond(current["plan"], state["message"], current["turn"])
        return {}

    def _finish(self, state: TurnState, config) -> TurnState:
        session_id = self._id(config)
        session = self.live[session_id]
        current = self.turns.pop(session_id)
        reply = session.finish(current["reply"], current["turn"])
        return {
            "reply": {"status": reply.status, "text": reply.text, "question": reply.question,
                      "request": reply.request, "result": reply.result, "trace": reply.trace},
            "snapshot": session.snapshot(),
        }


def build(provider_factory) -> CopilotGraph | None:
    return CopilotGraph(provider_factory) if enabled() else None


def default_graph(provider: Provider | None = None) -> CopilotGraph:
    """命令行画图用：不连模型"""
    from .providers import ScriptedProvider

    return CopilotGraph(lambda: provider or ScriptedProvider([]), db=Path(os.environ.get("COPILOT_SESSIONS_DB", ":memory:")))
