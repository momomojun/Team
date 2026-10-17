"""HTTP 服务（FastAPI）。对话状态存在内存里，重启就没了（单机、自用阶段够用）。

POST /sessions                   → {"session": "...", "greeting": "..."}
POST /sessions/{id}/messages     {"text": "..."} → 这一轮的回复（status、text、question、request、result）
GET  /health                     → 模型、提示词版本
"""
from __future__ import annotations

import datetime as dt

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .pipeline import VERSION, Session, prompt_hashes
from .providers import ProviderError, from_env

app = FastAPI(title="NPS Guide Copilot", version=VERSION)
sessions: dict[str, Session] = {}


class NewSession(BaseModel):
    reference_date: str | None = None
    writer_model: bool = False


class Message(BaseModel):
    text: str


@app.get("/health")
def health() -> dict:
    provider = from_env()
    return {"version": VERSION, "provider": provider.name, "model": getattr(provider, "model", None), "prompts": prompt_hashes()}


@app.post("/sessions")
def create(body: NewSession) -> dict:
    session = Session(from_env(), body.reference_date or dt.date.today().isoformat(), writer_model=body.writer_model)
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
