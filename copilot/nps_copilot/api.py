"""HTTP 服务（FastAPI）。对话状态存在内存里，重启就没了（单机、自用阶段够用）。

POST /sessions                   → {"session": "...", "greeting": "..."}
POST /sessions/{id}/messages     {"text": "..."} → 这一轮的回复（status、text、question、request、result）
GET  /health                     → 版本、构建的 commit、提示词版本和 hash、模型、行程引擎能不能用
"""
from __future__ import annotations

import datetime as dt
import os
import shutil

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from . import __version__
from .pipeline import VERSION, Session, prompt_hashes
from .providers import ProviderError, chat_provider

app = FastAPI(title="NPS Guide Copilot", version=__version__)
sessions: dict[str, Session] = {}


class NewSession(BaseModel):
    reference_date: str | None = None
    writer_model: bool = False


class Message(BaseModel):
    text: str


@app.get("/health")
def health() -> dict:
    provider = chat_provider()
    return {
        "version": VERSION,
        "build": os.environ.get("COPILOT_BUILD_SHA"),
        "provider": provider.name,
        "model": getattr(provider, "model", None),
        "prompts": prompt_hashes(),
        "plan_tool": "http" if os.environ.get("COPILOT_PLAN_URL") else ("cli" if shutil.which("node") else "missing"),
    }


@app.post("/sessions")
def create(body: NewSession) -> dict:
    session = Session(chat_provider(), body.reference_date or dt.date.today().isoformat(), writer_model=body.writer_model)
    sessions[session.id] = session
    return {"session": session.id, "greeting": "说说你的行程：想去哪、什么时候、玩几天、从哪飞。"}


@app.post("/sessions/{session_id}/messages")
def send(session_id: str, body: Message) -> dict:
    session = sessions.get(session_id)
    if session is None:
        raise HTTPException(404, "没有这个会话")
    try:
        reply = session.send(body.text)
    except ProviderError as error:
        raise HTTPException(503, str(error)) from error
    return {"status": reply.status, "text": reply.text, "question": reply.question, "request": reply.request, "result": reply.result}
