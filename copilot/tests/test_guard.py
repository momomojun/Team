"""护栏（guard.py）：口令、限流；api.py 的中间件。不联网、不调模型"""
import asyncio

import pytest

from nps_copilot import guard


def test_no_token_means_no_check(monkeypatch):
    monkeypatch.delenv("COPILOT_TOKEN", raising=False)
    assert guard.authorized("/sessions", {})


def test_token_must_match_except_health(monkeypatch):
    monkeypatch.setenv("COPILOT_TOKEN", "s3cret")
    assert guard.authorized("/sessions", {"x-copilot-token": "s3cret"})
    assert not guard.authorized("/sessions", {"x-copilot-token": "wrong"})
    assert not guard.authorized("/tts", {})
    assert guard.authorized("/health", {})


def test_only_model_spending_requests_are_counted():
    assert guard.kind_of("POST", "/sessions/abc123/messages") == "message"
    assert guard.kind_of("GET", "/tts") == "tts"
    assert guard.kind_of("POST", "/sessions") is None
    assert guard.kind_of("GET", "/health") is None
    assert guard.kind_of("GET", "/stats") is None


def test_client_comes_from_forwarded_header_first():
    assert guard.client_of({"x-forwarded-for": "1.2.3.4, 10.0.0.1"}, "10.0.0.1") == "1.2.3.4"
    assert guard.client_of({}, "5.6.7.8") == "5.6.7.8"


def test_per_minute_and_per_day_limits(monkeypatch):
    monkeypatch.setenv("COPILOT_RATE_MINUTE", "3")
    monkeypatch.setenv("COPILOT_RATE_DAY", "5")
    limiter = guard.Limiter()
    now = 1_000_000.0
    assert [limiter.check("message", "a", now + i) for i in range(3)] == [None, None, None]
    wait = limiter.check("message", "a", now + 3)
    assert wait is not None and 1 <= wait <= 60
    # 别的来源不受影响
    assert limiter.check("message", "b", now + 3) is None
    # 过了一分钟又能发，但一天最多 5 次
    assert limiter.check("message", "a", now + 61) is None
    assert limiter.check("message", "a", now + 62) is None
    day_wait = limiter.check("message", "a", now + 125)
    assert day_wait is not None and day_wait > 60
    # 一天以后清零
    assert limiter.check("message", "a", now + guard.DAY + 10) is None


def test_global_daily_cap_counts_everyone(monkeypatch):
    monkeypatch.setenv("COPILOT_RATE_GLOBAL_DAY", "2")
    limiter = guard.Limiter()
    assert limiter.check("message", "a", 0.0) is None
    assert limiter.check("message", "b", 100.0) is None
    assert limiter.check("message", "c", 200.0) is not None
    # 配音不算进总上限
    assert limiter.check("tts", "c", 200.0) is None


class _Request:
    def __init__(self, method, path, headers=None, host="9.9.9.9"):
        self.method = method
        self.url = type("U", (), {"path": path})()
        self.headers = headers or {}
        self.client = type("C", (), {"host": host})()


def test_middleware_rejects_and_limits(monkeypatch):
    # CI 只装 copilot[dev]，没有 FastAPI：那边跳过
    pytest.importorskip("fastapi")
    from nps_copilot import api

    monkeypatch.setenv("COPILOT_TOKEN", "s3cret")
    monkeypatch.setenv("COPILOT_RATE_MINUTE", "1")
    monkeypatch.setattr(guard, "limiter", guard.Limiter())

    async def ok(_request):
        return "passed"

    run = lambda request: asyncio.run(api.guard_request(request, ok))  # noqa: E731
    assert run(_Request("GET", "/health")) == "passed"
    assert run(_Request("POST", "/sessions")).status_code == 401
    good = {"X-Copilot-Token": "s3cret"}
    assert run(_Request("POST", "/sessions", good)) == "passed"
    assert run(_Request("POST", "/sessions/x/messages", good)) == "passed"
    limited = run(_Request("POST", "/sessions/x/messages", good))
    assert limited.status_code == 429 and int(limited.headers["retry-after"]) >= 1
    assert api.health()["auth"] is True


def test_stream_passes_through_the_guard(monkeypatch):
    """边做边报（?stream=1）经过口令、限流的中间件：进度和最后的回复一行不少"""
    pytest.importorskip("fastapi")
    pytest.importorskip("httpx")
    import json

    from fastapi.testclient import TestClient

    from nps_copilot import api
    from nps_copilot.pipeline import Reply
    from nps_copilot.providers import ScriptedProvider

    monkeypatch.setenv("COPILOT_TOKEN", "s3cret")
    monkeypatch.setattr(guard, "limiter", guard.Limiter())
    monkeypatch.setattr(api, "copilot_graph", lambda: None)
    monkeypatch.setattr(api, "chat_provider", lambda: ScriptedProvider([]))

    def fake_turn(session, text):
        session.progress({"step": "understand"})
        session.progress({"step": "plan", "conditions": {"parks": ["优胜美地"], "days": 3}})
        return Reply("planned", "排好了", None, None, None, {})

    monkeypatch.setattr(api, "run_turn", fake_turn)
    client = TestClient(api.app)
    good = {"X-Copilot-Token": "s3cret"}
    assert client.post("/sessions", json={}).status_code == 401
    session = client.post("/sessions", json={"reference_date": "2026-10-16"}, headers=good).json()["session"]
    response = client.post(f"/sessions/{session}/messages?stream=1", json={"text": "优胜美地 3 天"}, headers=good)
    assert response.status_code == 200 and "ndjson" in response.headers["content-type"]
    events = [json.loads(line) for line in response.text.splitlines() if line.strip()]
    assert [event.get("step") for event in events[:2]] == ["understand", "plan"]
    assert events[1]["conditions"]["days"] == 3
    assert events[-1] == {"type": "reply", "status": "planned", "text": "排好了", "question": None, "request": None, "result": None}
