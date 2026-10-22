"""HTTP 服务（FastAPI）。装了 langgraph 时一轮对话按 graph.py 的流程图跑，对话状态存在 LangGraph 的检查点里
（copilot/data/sessions.sqlite），Copilot 重启以后用原来的会话 id 接着说；没装就只在内存里，重启就没了。

POST /sessions                   → {"session": "...", "greeting": "..."}
POST /sessions/{id}/messages     {"text": "..."} → 这一轮的回复（status、text、question、request、result）
GET  /health                     → 版本、构建的 commit、提示词版本和 hash、模型、行程引擎能不能用
GET  /tts?text=…&lang=zh-CN       → 这一句的配音（MP3，本机 Kokoro，见 tts.py）；没装模型时 503
GET  /stats?days=7               → 运行日志的统计（和 python -m nps_copilot stats 一样）：按版本的成功率、耗时，按模型的调用、token、花费，
                                   按天的数字、最近 30 轮、读公告的关闭清单状态（网站的后台 /admin 读这个）

放到公网（Hugging Face Spaces）时的护栏在 guard.py：设了 COPILOT_TOKEN 就要请求头 X-Copilot-Token；发一句话、配音按来源限流。
"""
from __future__ import annotations

import datetime as dt
import os
import shutil

import json
import queue
import threading

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from . import __version__, alerts_live, guard, monitor, tts
from . import graph as graph_module
from .pipeline import VERSION, Session, prompt_hashes
from .providers import ProviderError, chat_provider

app = FastAPI(title="NPS Guide Copilot", version=__version__)
sessions: dict[str, Session] = {}
# LangGraph 的流程图和检查点（第一次用到时才建：chat_provider() 配错了也不影响 /health）
_graph: graph_module.CopilotGraph | None = None
_graph_ready = False


def copilot_graph() -> graph_module.CopilotGraph | None:
    global _graph, _graph_ready
    if not _graph_ready:
        _graph = graph_module.build(chat_provider)
        _graph_ready = True
    return _graph


def find_session(session_id: str) -> Session | None:
    graph = copilot_graph()
    return graph.get(session_id) if graph else sessions.get(session_id)


def run_turn(session: Session, text: str):
    graph = copilot_graph()
    return graph.send(session.id, text) if graph else session.send(text)


async def guard_request(request: Request, call_next):
    """口令和限流（guard.py）：口令不对 401；发一句话、配音超了次数 429 + Retry-After"""
    headers = {key.lower(): value for key, value in request.headers.items()}
    path = request.url.path
    if not guard.authorized(path, headers):
        return JSONResponse({"error": "unauthorized"}, status_code=401)
    kind = guard.kind_of(request.method, path)
    if kind:
        wait = guard.limiter.check(kind, guard.client_of(headers, request.client.host if request.client else None))
        if wait is not None:
            return JSONResponse({"error": "rate_limited", "retry_after": wait}, status_code=429, headers={"Retry-After": str(wait)})
    return await call_next(request)


app.middleware("http")(guard_request)


class NewSession(BaseModel):
    reference_date: str | None = None
    writer_model: bool = False


class Message(BaseModel):
    text: str


@app.get("/health")
def health() -> dict:
    try:
        provider = chat_provider()
    except ProviderError as error:  # COPILOT_STEP_MODELS 写错、没配 key：照样回 /health，写明是什么错
        return {"version": VERSION, "build": os.environ.get("COPILOT_BUILD_SHA"), "provider": None, "model": None,
                "error": str(error), "prompts": prompt_hashes(), "plan_tool": "missing"}
    names = lambda item: [getattr(p, "model", p.name) for p in getattr(item, "providers", [item])]  # noqa: E731
    return {
        "version": VERSION,
        "build": os.environ.get("COPILOT_BUILD_SHA"),
        "provider": provider.name,
        "model": getattr(provider, "model", None),
        # 按顺序试的几个模型（前一个出错换下一个）
        "chain": names(getattr(provider, "default", provider)),
        # 单独换了模型的步骤：{步骤: [先试的, 出错再按平常的顺序]}
        "steps": {step: names(item) for step, item in getattr(provider, "steps", {}).items()},
        "prompts": prompt_hashes(),
        "plan_tool": "http" if os.environ.get("COPILOT_PLAN_URL") else ("cli" if shutil.which("node") else "missing"),
        # 讲解版的配音：本机 Kokoro 能不能用
        "tts": "kokoro" if tts.available() else None,
        # 放到公网时有没有设口令（不显示口令本身）
        "auth": bool(guard.token()),
        # 一轮对话怎么跑：LangGraph（对话存档，重启不丢）还是直接调
        "graph": "langgraph" if graph_module.enabled() else None,
    }


@app.get("/tts")
def speak(text: str, lang: str = "zh-CN", voice: str | None = None) -> Response:
    text = text.strip()
    if not text:
        raise HTTPException(400, "empty")
    if not tts.available():
        raise HTTPException(503, "tts_unavailable")
    try:
        audio = tts.synthesize(text, lang, voice)
    except Exception as error:  # 模型出错（声音名字写错之类）：网站退回浏览器的声音
        raise HTTPException(500, f"tts_failed: {error}") from error
    # 同一句话的配音不会变：浏览器可以一直缓存
    return Response(audio, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=31536000, immutable"})


@app.get("/stats")
def stats(days: int = 7) -> dict:
    days = max(1, min(days, 90))
    rows = monitor.load(days)
    return {"days": days, "versions": monitor.summarize(rows), "usage": monitor.usage(rows), "daily": monitor.daily(rows),
            "recent": monitor.recent(rows), "alerts": alerts_live.status()}


@app.post("/sessions")
def create(body: NewSession) -> dict:
    graph = copilot_graph()
    reference = body.reference_date or dt.date.today().isoformat()
    if graph:
        session = graph.create(reference, writer_model=body.writer_model)
    else:
        session = Session(chat_provider(), reference, writer_model=body.writer_model)
        sessions[session.id] = session
    return {"session": session.id, "greeting": "说说你的行程：想去哪、什么时候、玩几天、从哪飞。"}


def reply_body(reply) -> dict:
    return {"status": reply.status, "text": reply.text, "question": reply.question, "request": reply.request, "result": reply.result}


@app.post("/sessions/{session_id}/messages")
def send(session_id: str, body: Message, stream: bool = False):
    """stream=1：边做边报，一行一个 JSON（NDJSON）：{"type": "progress", "step": …} 若干行，最后一行 {"type": "reply", …}
    （出错是 {"type": "error", "status": 503, "detail": …}）。网站的对话框按这些步骤显示进度"""
    session = find_session(session_id)
    if session is None:
        raise HTTPException(404, "没有这个会话")
    if not stream:
        try:
            reply = run_turn(session, body.text)
        except ProviderError as error:
            raise HTTPException(503, str(error)) from error
        return reply_body(reply)

    events: queue.Queue = queue.Queue()

    def run() -> None:
        session.progress = lambda event: events.put({"type": "progress", **event})
        try:
            events.put({"type": "reply", **reply_body(run_turn(session, body.text))})
        except ProviderError as error:
            events.put({"type": "error", "status": 503, "detail": str(error)})
        except Exception as error:  # 别的错误也要告诉网站，不然对话框一直转
            events.put({"type": "error", "status": 500, "detail": str(error)})
        finally:
            session.progress = None
            events.put(None)

    threading.Thread(target=run, daemon=True).start()

    def lines():
        while (event := events.get()) is not None:
            yield json.dumps(event, ensure_ascii=False, default=str) + "\n"

    return StreamingResponse(lines(), media_type="application/x-ndjson", headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})
