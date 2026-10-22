"""护栏（GOALS P26）：Copilot 服务放到公网（Hugging Face Spaces）以后，不让别人随便用、把免费额度刷光。

1. 共享口令：设了 COPILOT_TOKEN，除 /health 以外的接口都要请求头 X-Copilot-Token 等于它（网站的中转会带上）；
   没设就不检查（本机、Docker 里照旧）。
2. 限流：只算真正花模型额度的两个接口——发一句话（POST /sessions/{id}/messages）和配音（GET /tts）。按来源（网站中转透传的
   X-Forwarded-For 第一个，没有就是直接连进来的地址）每分钟、每天各有上限，再加一个所有人加起来每天的总上限；
   超了返回 429 和 Retry-After（还要等几秒）。计数放在内存里：单进程够用，重启清零。

这里不依赖 FastAPI（CI 只装 copilot[dev]），api.py 的中间件调用它。
"""
from __future__ import annotations

import hmac
import os
import re
import threading
import time
from collections import deque
from dataclasses import dataclass, field

HEADER = "x-copilot-token"
OPEN_PATHS = {"/health"}
MESSAGE = re.compile(r"^/sessions/[^/]+/messages$")
DAY = 86400.0


def token() -> str:
    return os.environ.get("COPILOT_TOKEN", "")


def authorized(path: str, headers: dict[str, str]) -> bool:
    """口令对不对；没设 COPILOT_TOKEN 时都算对，/health 不要口令（冒烟测试、网站看服务开没开）"""
    secret = token()
    if not secret or path in OPEN_PATHS:
        return True
    given = headers.get(HEADER, "")
    return hmac.compare_digest(given.encode("utf-8"), secret.encode("utf-8"))


def kind_of(method: str, path: str) -> str | None:
    """这个请求算哪一类限流：message / tts；不花额度的（/health、/stats、开新会话）不算"""
    if method == "POST" and MESSAGE.match(path):
        return "message"
    if method == "GET" and path == "/tts":
        return "tts"
    return None


def client_of(headers: dict[str, str], host: str | None) -> str:
    forwarded = headers.get("x-forwarded-for", "")
    first = forwarded.split(",")[0].strip()
    return first or host or "unknown"


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


@dataclass
class Limits:
    minute: int
    day: int


def limits() -> dict[str, Limits]:
    return {
        "message": Limits(_env_int("COPILOT_RATE_MINUTE", 20), _env_int("COPILOT_RATE_DAY", 300)),
        # 配音一句一次、讲解版一趟几十句，宽一些
        "tts": Limits(_env_int("COPILOT_RATE_TTS_MINUTE", 120), _env_int("COPILOT_RATE_TTS_DAY", 3000)),
    }


@dataclass
class Limiter:
    """滑动窗口计数：每个（类别, 来源）记下最近一天里每次请求的时间"""

    hits: dict[tuple[str, str], deque] = field(default_factory=dict)
    total: deque = field(default_factory=deque)
    lock: threading.Lock = field(default_factory=threading.Lock)

    def check(self, kind: str, client: str, now: float | None = None) -> int | None:
        """放行返回 None（并记一次）；超了返回还要等几秒"""
        now = time.time() if now is None else now
        rule = limits()[kind]
        global_day = _env_int("COPILOT_RATE_GLOBAL_DAY", 2000)
        with self.lock:
            queue = self.hits.setdefault((kind, client), deque())
            while queue and now - queue[0] >= DAY:
                queue.popleft()
            while self.total and now - self.total[0] >= DAY:
                self.total.popleft()
            recent = [t for t in queue if now - t < 60]
            if rule.minute and len(recent) >= rule.minute:
                return max(1, int(60 - (now - recent[0])) + 1)
            if rule.day and len(queue) >= rule.day:
                return max(1, int(DAY - (now - queue[0])) + 1)
            # 所有人加起来的总上限只算发一句话（配音不花模型额度）
            if kind == "message" and global_day and len(self.total) >= global_day:
                return max(1, int(DAY - (now - self.total[0])) + 1)
            queue.append(now)
            if kind == "message":
                self.total.append(now)
        return None


limiter = Limiter()
