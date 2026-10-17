"""Copilot 流水线：Intake →（条件齐了）plan_trip → Critic（必要时改一次再排）→ Writer。

每轮对话写一条日志（JSONL，默认 copilot/runs/，已在 .gitignore 里）：提示词版本、模型、各步耗时、
模型输出、丢掉的片段、Critic 的发现、Writer 有没有被换成模板。评测和监控都读这份日志。
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path

from . import intake as intake_module
from . import writer as writer_module
from .critic import critique
from .intake import Intake
from .plan_client import PlanError, plan_trip
from .providers import Provider

VERSION = "copilot/0.1"
RUNS = Path(os.environ.get("COPILOT_RUNS", Path(__file__).resolve().parents[1] / "runs"))


def prompt_hashes() -> dict[str, str]:
    return {
        intake_module.PROMPT_VERSION: hashlib.sha256(intake_module.PROMPT_PATH.read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:12],
        writer_module.PROMPT_VERSION: hashlib.sha256(writer_module.PROMPT_PATH.read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:12],
    }


@dataclass
class Reply:
    status: str  # needs_input | planned | error
    text: str
    question: dict | None = None
    request: dict | None = None
    result: dict | None = None
    trace: dict = field(default_factory=dict)


@dataclass
class Session:
    provider: Provider
    reference_date: str
    writer_model: bool = False
    log: bool = True
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])

    def __post_init__(self) -> None:
        self.intake = Intake(self.provider, dt.date.fromisoformat(self.reference_date))
        self.turn = 0

    def send(self, message: str) -> Reply:
        self.turn += 1
        start = time.perf_counter()
        turn = self.intake.step(message)
        trace = {"session": self.id, "turn": self.turn, "version": VERSION, "prompts": prompt_hashes(),
                 "reference_date": self.reference_date, "message": message, "intake": turn.trace}
        if turn.status != "ready":
            text = "\n".join([*turn.notices, turn.question["text"]]) if turn.question else "\n".join(turn.notices)
            reply = Reply("needs_input", text, turn.question, None, None, trace)
            return self._done(reply, start)
        request = turn.request
        trace["request"] = request
        try:
            call = plan_trip(request, self.reference_date)
        except PlanError as error:
            trace["plan_error"] = {"message": str(error), "issues": error.issues}
            text = "这些条件排不出行程：" + "；".join(issue["message"] for issue in error.issues) if error.issues else str(error)
            return self._done(Reply("error", text, None, request, None, trace), start)
        result = call.result
        review = critique(request, result)
        trace["plan"] = {"latency_ms": call.latency_ms, "via": call.via}
        if review.revision is not None:
            trace["revision"] = review.reason
            revised = plan_trip(review.revision, self.reference_date)
            second = critique(review.revision, revised.result)
            # 改了以后更好（硬问题更少）才用；Critic 最多改一次
            if len(second.hard) < len(review.hard):
                request, result, review = review.revision, revised.result, second
                review.reason = "relaxed_pace"
            else:
                review.reason = None
        trace["critic"] = [vars(finding) for finding in review.findings if finding.severity != "info"]
        language = self.intake.language or "zh"
        text, writer_trace = writer_module.write(request, result, review, language, self.provider,
                                                 self.intake.preferences, use_model=self.writer_model)
        trace["writer"] = writer_trace
        notices = "\n".join(turn.notices)
        return self._done(Reply("planned", (notices + "\n" if notices else "") + text, None, request, result, trace), start)

    def _done(self, reply: Reply, start: float) -> Reply:
        reply.trace["status"] = reply.status
        reply.trace["latency_ms"] = round((time.perf_counter() - start) * 1000)
        if self.log:
            RUNS.mkdir(parents=True, exist_ok=True)
            path = RUNS / f"{dt.date.today().isoformat()}.jsonl"
            with path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(reply.trace, ensure_ascii=False, default=str) + "\n")
        return reply
