"""Copilot 流水线：Intake →（条件齐了）plan_trip → Critic（必要时改一次再排）→ Writer。

每轮对话写一条日志（JSONL，默认 copilot/runs/，已在 .gitignore 里）：提示词版本、模型、各步耗时、
模型输出、丢掉的片段、Critic 的发现、Writer 有没有被换成模板。评测和监控都读这份日志。
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path

from . import __version__, prompts
from . import writer as writer_module
from .critic import critique
from .intake import Intake
from .plan_client import PlanError, plan_trip
from .providers import Provider

VERSION = f"copilot/{__version__}"
RUNS = Path(os.environ.get("COPILOT_RUNS", Path(__file__).resolve().parents[1] / "runs"))


def prompt_hashes() -> dict[str, str]:
    """现在用的提示词版本和 hash，写进每条日志（见 prompts.py）"""
    return prompts.current()


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
        # 上一次排出来的行程：用户再说话时，条件变了就先说改了什么，没变就不把整个行程再印一遍
        self.last_request: dict | None = None
        self.last_result: dict | None = None

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
        zh = (self.intake.language or "zh") != "en"
        if self.last_request is not None and same_request(self.last_request, request):
            # 条件没变（提问、闲聊、“好的”）：现在还不会回答问题，老实说，不把同一个行程再印一遍
            trace["unchanged"] = True
            text = "\n".join([*turn.notices, unchanged_reply(message, zh)])
            return self._done(Reply("planned", text, None, request, self.last_result, trace), start)
        changes = writer_module.describe_changes(self.last_request, request, zh) if self.last_request else []
        user_request = request
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
        head = list(turn.notices)
        if changes:
            head.append(("好，改了：" + "、".join(changes) + "。") if zh else ("Done. Changed: " + "; ".join(changes) + "."))
            if self.last_result:
                head.extend(writer_module.lodging_changes(self.last_result, result, zh))
            trace["changes"] = changes
        self.last_request, self.last_result = user_request, result
        return self._done(Reply("planned", "\n".join([*head, text]), None, request, result, trace), start)

    def _done(self, reply: Reply, start: float) -> Reply:
        reply.trace["status"] = reply.status
        reply.trace["latency_ms"] = round((time.perf_counter() - start) * 1000)
        if self.log:
            RUNS.mkdir(parents=True, exist_ok=True)
            path = RUNS / f"{dt.date.today().isoformat()}.jsonl"
            with path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(reply.trace, ensure_ascii=False, default=str) + "\n")
        return reply


def same_request(before: dict, after: dict) -> bool:
    """两次的条件一样（不看 provenance：同样的条件，来源说法可以不同）"""
    strip = lambda request: {key: value for key, value in request.items() if key != "provenance"}  # noqa: E731
    return strip(before) == strip(after)


ACK = re.compile(r"\s*(好的?|好吧|行|可以|谢谢|多谢|感谢|收到|明白|ok|okay|thanks|thank you|great|cool|got it)[\s!！。.~啦呀啊了]*", re.I)


def unchanged_reply(message: str, zh: bool) -> str:
    if ACK.fullmatch(message):
        return "好的。想改什么直接说就行，比如“住民宿”“轻松一点”“玩 4 天”。" if zh else \
            "Sure. Tell me anything you'd like to change, e.g. “vacation rentals”, “a slower pace”, or “4 days”."
    if zh:
        return ("这句话我还答不上来：现在我能按你给的条件排行程、改行程，还不会回答景点、住宿、车程这类问题（正在做）。"
                "想改行程可以直接说，比如“住民宿”“改成从弗雷斯诺出发”“轻松一点”“玩 4 天”。")
    return ("I can't answer that yet. Right now I can plan and change the trip from your conditions, but not answer questions "
            "about places, lodging, or drive times (coming soon). To change the plan, say something like “vacation rentals”, "
            "“start from Fresno”, “a slower pace”, or “4 days”.")
