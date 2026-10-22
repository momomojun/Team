"""Copilot 流水线。每一轮：

1. 调度员（dispatcher.py，模型）看最近的对话、现在的条件和行程，决定这句话要做哪几件事：改条件、提问、
   加减景点、指定某晚住处、重新开始、闲聊（可以几件一起）；
2. 代码一件件做：条件交给 Intake（模型摘原话片段、代码读）；景点、住处的名字在资料里对成 id；
   条件或改动变了就 plan_trip → Critic（必要时改一次再排）→ Writer；问题交给 qa（只按查到的资料回答）。
3. 调度员出错、输出用不了，或者用户只是在回答上一句追问（“5”“是的”），走原来按规则的流程（_legacy）。
   设 COPILOT_DISPATCH=0 可以整个关掉调度员（对照实验、回滚用）。

每轮对话写一条日志（JSONL，默认 copilot/runs/，已在 .gitignore 里）：提示词版本、模型、各步耗时、
模型输出、调度员做了什么、丢掉的片段、Critic 的发现、Writer 有没有被换成模板，每次模型调用用了哪个模型、
多少 token（calls）。评测和监控都读这份日志。
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

from . import __version__, catalog, knowledge, prompts, qa
from . import dispatcher as dispatcher_module
from . import writer as writer_module
from .critic import critique
from .intake import Field, Intake
from .plan_client import PlanError, plan_trip
from .providers import Metered, Provider
from .text import contains

VERSION = f"copilot/{__version__}"
RUNS = Path(os.environ.get("COPILOT_RUNS", Path(__file__).resolve().parents[1] / "runs"))
# 刚问了用户一句（玩几天、选哪个），回答这么短的就直接按追问读，不用调度员
QUICK_ANSWER_CHARS = 6
CONTEXTUAL = re.compile(r"那|这|它|他们|她们|呢|上面|刚才|前面|(it|that|there|those|they|this)", re.I)
QUICK_ANSWER = re.compile(r"\s*(\d{1,2}|[一二两三四五六七八九十]+|是的?|对|对的|好|好的|不是|不对|不用|都去|都要|第.{1,2}个?|yes|no|yep|nope)\s*(天|日|个|号|岁|晚)?[。.!！]?\s*", re.I)


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
    dispatcher: bool = field(default_factory=lambda: os.environ.get("COPILOT_DISPATCH", "1") != "0")
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])

    def __post_init__(self) -> None:
        # 记下每次模型调用（哪个模型、多少 token），写进每轮日志，monitor 按模型算花费
        if not isinstance(self.provider, Metered):
            self.provider = Metered(self.provider)
        self.turn = 0
        self.history: list[tuple[str, str]] = []
        self._reset()

    def _reset(self) -> None:
        self.intake = Intake(self.provider, dt.date.fromisoformat(self.reference_date))
        # 上一次排出来的行程（请求里带着用户加减的景点、指定的住处）：再说话时条件变了先说改了什么，没变不重印
        self.last_request: dict | None = None
        self.last_result: dict | None = None
        self.last_text = ""
        self.last_question: dict | None = None
        # 用户点名要去、不去的景点和指定的住处（第几晚 → 住处 id）
        self.include: list[str] = []
        self.exclude: list[str] = []
        self.nights: dict[int, str] = {}
        self._solo = True

    @property
    def zh(self) -> bool:
        return (self.intake.language or "zh") != "en"

    def send(self, message: str) -> Reply:
        self.turn += 1
        start = time.perf_counter()
        self.provider.take()  # 上一轮半路出错没写进日志的调用不算到这一轮
        trace = {"session": self.id, "turn": self.turn, "version": VERSION, "prompts": prompt_hashes(),
                 "reference_date": self.reference_date, "message": message}
        if self.intake.language is None:
            from .intake import is_english
            self.intake.language = "en" if is_english(message) else "zh"
        reply = None
        if self.dispatcher and not self._quick_answer(message):
            plan = dispatcher_module.dispatch(self.provider, self.history, self._conditions(), self.last_result, message, self.zh)
            trace["dispatch"] = plan.trace
            if plan.actions:
                reply = self._run(plan, message, trace)
        if reply is None:
            trace["route"] = "legacy"
            reply = self._legacy(message, trace)
        self.history.append((message, reply.text))
        if reply.status == "needs_input" and reply.question:
            self.last_question = reply.question
        return self._done(reply, start)

    # ---------- 调度员给的几件事 ----------
    def _run(self, plan: dispatcher_module.Dispatch, message: str, trace: dict) -> Reply:
        zh = self.zh
        head: list[str] = []
        if plan.has("new_trip"):
            history, language = self.history, self.intake.language
            self._reset()
            self.intake.language = language
            self.history = history
            head.append("好，重新排一个新的行程，前面说的条件都不算了。" if zh else "Sure, starting a new trip from scratch.")
        asks = [action for action in plan.actions if action.type == "ask"]
        self._solo = all(action.type in ("ask", "chat") for action in plan.actions)
        edits = [action for action in plan.actions if action.type in ("add_stop", "remove_stop", "set_lodging")]
        if not asks and qa.is_question(message) and not is_ack(message):
            # 调度员漏了提问（“附近有什么国家公园”被只当成给条件）：问号、“什么”这类一看就是在问的，也去查着回答
            asks.append(dispatcher_module.Action("ask", message))
            trace["added_ask"] = True
        if plan.has("conditions") or plan.has("new_trip") or self.last_request is None:
            # “那就 7 月 10 日出发”：这句没写公园、指的是前面说过的那座（调度员给的名字要是对话里出现过的）
            said = next((action.place for action in plan.actions if action.type == "conditions" and action.place), "")
            if said and not self.intake.parks.value:
                codes = [code for code, _ in catalog.find_all(said, catalog.parks())]
                if codes:
                    self.intake.parks = Field(codes[:4], "user", said)
                    trace["context_parks"] = {"said": said, "parks": codes[:4]}
            turn = self.intake.step(message)
            trace["intake"] = turn.trace
            head.extend(turn.notices)
            if turn.status != "ready":
                answers = self._answers(asks, None, zh, trace, message)
                text = "\n".join([*head, *answers, turn.question["text"]] if turn.question else [*head, *answers])
                return Reply("needs_input", text, turn.question, None, None, trace)
            request = turn.request
        elif self.last_request is None:
            # 还没排出行程、这句也没给条件：先回答、闲聊，再接着上一次的追问
            answers = self._answers(asks, None, zh, trace, message)
            if edits:
                answers.append("先把行程排出来，再加减景点、指定住处。" if zh else "Let's get a plan first, then add or drop stops.")
            if not answers:
                answers.append(unchanged_reply(message, zh))
            question = self.last_question
            text = "\n".join([*head, *answers, *([question["text"]] if question else [])])
            return Reply("needs_input", text, question, None, None, trace)
        else:
            request = {key: value for key, value in self.last_request.items() if key not in ("include", "exclude", "lodging")}
        self._trace_note = None
        notes = self._apply_edits(edits, request, zh, message)
        if self._trace_note:
            trace["pronoun"] = self._trace_note
        trace["edits"] = {"include": self.include, "exclude": self.exclude, "nights": self.nights}
        effective = self._with_edits(request)
        if self.last_request is not None and same_request(self.last_request, effective):
            trace["unchanged"] = True
            answers = self._answers(asks, self.last_result, zh, trace, message)
            body = [*notes, *answers] or [unchanged_reply(message, zh)]
            return Reply("planned", "\n".join([*head, *body]), None, effective, self.last_result, trace)
        reply = self._plan(effective, head, zh, trace)
        if reply.status != "planned":
            return reply
        answers = self._answers(asks, reply.result, zh, trace, message)
        reply.text = "\n".join([*notes, reply.text, *answers]) if notes else "\n".join([reply.text, *answers])
        return reply

    def _apply_edits(self, edits: list, request: dict, zh: bool, message: str = "") -> list[str]:
        """加减景点、指定住处：名字在这几座公园的资料里对成 id；对不上的说一声，不瞎做"""
        notes = []
        parks = request.get("parks") or []
        for action in edits:
            kind = "lodging" if action.type == "set_lodging" else "attraction"
            doc = knowledge.resolve(action.place, parks, kind)
            # “那就加上它吧”：这句只用了代词、名字是调度员从上下文补的。用户上一句正好点了一个地方，就以它为准
            # （调度员有时会补成行程里别的地方，比如上一句问塔夫特点，它补成了冰川点）
            if self.history and action.place and not contains(message, action.place) and CONTEXTUAL.search(message):
                previous = knowledge.mentioned(self.history[-1][0], parks, kind)
                if len(previous) == 1 and (doc is None or previous[0].id != doc.id):
                    self._trace_note = {"pronoun": action.place, "used": previous[0].id}
                    doc = previous[0]
            if doc is None:
                notes.append(f"没找到叫“{action.place}”的{'住处' if kind == 'lodging' else '景点'}，没有改。" if zh else
                             f"I couldn't find “{action.place}” in this trip's parks, so nothing changed.")
                continue
            if action.type == "add_stop":
                self.include = [*dict.fromkeys([*self.include, doc.id])]
                self.exclude = [i for i in self.exclude if i != doc.id]
            elif action.type == "remove_stop":
                self.exclude = [*dict.fromkeys([*self.exclude, doc.id])]
                self.include = [i for i in self.include if i != doc.id]
            else:
                nights = [action.night] if action.night else list(range(1, (request.get("days") or 1)))
                for night in nights:
                    if 1 <= night < (request.get("days") or 1):
                        self.nights[night] = doc.id
        return notes

    def _with_edits(self, request: dict) -> dict:
        """条件 + 用户的改动；换了公园、改短了天数以后对不上的改动不带"""
        parks = set(request.get("parks") or [])
        effective = dict(request)
        include = [i for i in self.include if i.split("-")[0] in parks]
        exclude = [i for i in self.exclude if i.split("-")[0] in parks]
        nights = [{"night": n, "id": i} for n, i in sorted(self.nights.items())
                  if i.split("-")[0] in parks and n < (request.get("days") or 1)]
        if include:
            effective["include"] = include
        if exclude:
            effective["exclude"] = exclude
        if nights:
            effective["lodging"] = nights
        return effective

    def _answers(self, asks: list, result: dict | None, zh: bool, trace: dict, message: str = "") -> list[str]:
        out = []
        solo = len(asks) == 1 and self._solo
        parks = (result or {}).get("request", {}).get("parks") or self.intake.parks.value or []
        for action in asks:
            # 一句话只问了一件事：模型按用户原话回答，调度员补全的问法帮着找资料；问了几件的，按调度员拆开的问法
            # 这句话只是在问（没有别的事要做）：按原话回答；一句话里还有别的事（“第一晚住 El Portal，冰川点几月开？”），按调度员拆出来的问法
            question = message if solo and message and qa.is_question(message) else action.query
            # 补全的问法只在原话要靠上下文才看得懂时用（“那条步道多长”“雷尼尔山呢”）；原话自己说清楚了的不用，
            # 补全有时会补错（把“雾径”补成编出来的英文名），小模型会跟着错的走
            needs_context = CONTEXTUAL.search(question) is not None
            meaning = action.query if question != action.query and needs_context else ""
            looked, tool_trace = self._lookup(f"{question} {meaning}".strip(), parks, (result or {}).get("request"), result, zh)
            said, qa_trace = qa.answer(question, parks, self.last_text, self.provider, zh, stop_ids(result), meaning=meaning,
                                       skipped=(result or {}).get("skipped"), looked=looked)
            if tool_trace:
                qa_trace["tools"] = tool_trace
            trace.setdefault("qa", []).append({"query": action.query, **qa_trace})
            out.append(said)
        return out

    def _conditions(self) -> dict:
        if self.last_request:
            return self.last_request
        request = self.intake.request()
        return {key: value for key, value in request.items() if value is not None and key != "provenance"}

    def _lookup(self, question: str, parks: list[str], request: dict | None, result: dict | None, zh: bool) -> tuple[list[str], dict]:
        """问题要算的（开没开、车程、按条件找景点）：先调查询工具（tools.py），结果交给回答问题的模型。COPILOT_TOOLS=0 关掉"""
        if os.environ.get("COPILOT_TOOLS") == "0":
            return [], {}
        from . import tools

        found = tools.lookup(question, parks, request, result, self.reference_date, zh)
        return found.lines, (found.trace if found.requests else {})

    def _quick_answer(self, message: str) -> bool:
        """刚问了用户一句、回答像是在答这一问（“5”“5天”“2”“是的”“第二个”）：直接按追问读，不用调度员。
        “雷尼尔山呢？”这种带问号、像在提问的不算"""
        text = message.strip()
        return (bool(self.intake.pending or self.intake.asked) and len(text) <= QUICK_ANSWER_CHARS
                and not qa.is_question(text) and QUICK_ANSWER.fullmatch(text) is not None)

    # ---------- 排行程（两条路共用） ----------
    def _plan(self, request: dict, head: list[str], zh: bool, trace: dict) -> Reply:
        trace["request"] = request
        changes = writer_module.describe_changes(self.last_request, request, zh) if self.last_request else []
        user_request = request
        try:
            call = plan_trip(request, self.reference_date)
        except PlanError as error:
            trace["plan_error"] = {"message": str(error), "issues": error.issues}
            text = "这些条件排不出行程：" + "；".join(issue["message"] for issue in error.issues) if error.issues else str(error)
            return Reply("error", "\n".join([*head, text]), None, request, None, trace)
        result = call.result
        review = critique(request, result)
        trace["plan"] = {"latency_ms": call.latency_ms, "via": call.via, **({"alerts": call.refresh} if call.refresh else {})}
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
        lines = list(head)
        if changes:
            lines.append(("好，改了：" + "、".join(changes) + "。") if zh else ("Done. Changed: " + "; ".join(changes) + "."))
            if self.last_result:
                lines.extend(writer_module.lodging_changes(self.last_result, result, zh))
                # 只是换了住宿偏好、节奏这类条件，每天去哪也变了的说一句（换了公园、天数的本来就是整趟重排）
                same_trip = lambda r: (r.get("parks"), r.get("days"), r.get("startDate"), r.get("month"))  # noqa: E731
                if self.last_request and same_trip(self.last_request) == same_trip(request):
                    lines.extend(writer_module.day_changes(self.last_result, result, zh))
            trace["changes"] = changes
        # 点名要去、但这几天去不了的：说清楚为什么没排
        skipped = {item["id"]: item for item in result.get("skipped", [])}
        for stop_id in request.get("include", []):
            if stop_id in skipped:
                item = skipped[stop_id]
                lines.append(f"{item['nameZh']}没排进去：{writer_module.skip_reason(item, zh)}。" if zh else
                             f"{item['nameEn']} couldn't be added: {writer_module.skip_reason(item, zh)}.")
        self.last_request, self.last_result, self.last_text = user_request, result, text
        return Reply("planned", "\n".join([*lines, text]), None, request, result, trace)

    # ---------- 原来按规则的流程（调度员关掉、出错，或者只是回答追问时） ----------
    def _legacy(self, message: str, trace: dict) -> Reply:
        restarted = bool(RESTART.search(message)) and self.turn > 1
        if restarted:
            # “帮我安排一个新的行程”：前面说过的条件全部清掉，从头问（这句话里有新条件的照样读）
            history, language = self.history, self.intake.language
            self._reset()
            self.intake.language, self.history = language, history
        turn = self.intake.step(message)
        if restarted:
            turn.notices.insert(0, "好，重新排一个新的行程，前面说的条件都不算了。" if self.zh else "Sure, starting a new trip from scratch.")
        trace["intake"] = turn.trace
        zh = self.zh
        if turn.status != "ready":
            head = list(turn.notices)
            if qa.is_question(message) and not is_ack(message):
                # 还没排出行程时也能问：先回答，再接着追问。这句话里读到了条件的，只在查到了才回答；什么条件都没有的，查不到也说一声
                looked, tool_trace = self._lookup(message, self.intake.parks.value or [], None, None, zh)
                said, trace["qa"] = qa.answer(message, self.intake.parks.value or [], self.last_text, self.provider, zh, looked=looked)
                if tool_trace:
                    trace["qa"]["tools"] = tool_trace
                if trace["qa"].get("answer") == "model" or not turn.trace.get("absorbed"):
                    head.append(said)
            text = "\n".join([*head, turn.question["text"]]) if turn.question else "\n".join(head)
            return Reply("needs_input", text, turn.question, None, None, trace)
        request = self._with_edits(turn.request)
        if self.last_request is not None and same_request(self.last_request, request):
            # 条件没变：是提问就在网站资料里查着回答，“好的”、闲聊就简短回一句；都不把同一个行程再印一遍
            trace["unchanged"] = True
            if is_ack(message) or not qa.is_question(message):
                said = unchanged_reply(message, zh)
            else:
                looked, tool_trace = self._lookup(message, request["parks"], request, self.last_result, zh)
                said, trace["qa"] = qa.answer(message, request["parks"], self.last_text, self.provider, zh, stop_ids(self.last_result),
                                              skipped=(self.last_result or {}).get("skipped"), looked=looked)
                if tool_trace:
                    trace["qa"]["tools"] = tool_trace
            text = "\n".join([*turn.notices, said])
            return Reply("planned", text, None, request, self.last_result, trace)
        had_plan = self.last_request is not None
        reply = self._plan(request, list(turn.notices), zh, trace)
        if reply.status == "planned" and had_plan and trace.get("changes") and qa.is_question(message):
            # 一句话里既改了条件又在问：先给新行程，再回答查得到的那部分；查不到就不多说
            looked, tool_trace = self._lookup(message, request["parks"], request, reply.result, zh)
            said, trace["qa"] = qa.answer(message, request["parks"], self.last_text, self.provider, zh, stop_ids(reply.result),
                                          skipped=(reply.result or {}).get("skipped"), looked=looked)
            if tool_trace:
                trace["qa"]["tools"] = tool_trace
            if trace["qa"].get("answer") == "model":
                reply.text += "\n" + said
        return reply

    def _done(self, reply: Reply, start: float) -> Reply:
        reply.trace["status"] = reply.status
        reply.trace["latency_ms"] = round((time.perf_counter() - start) * 1000)
        reply.trace["calls"] = self.provider.take()
        reply.trace["at"] = dt.datetime.now().astimezone().isoformat(timespec="seconds")
        if self.log:
            RUNS.mkdir(parents=True, exist_ok=True)
            path = RUNS / f"{dt.date.today().isoformat()}.jsonl"
            with path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(reply.trace, ensure_ascii=False, default=str) + "\n")
        return reply


RESTART = re.compile(r"新的?(行程|旅行|计划|攻略)|另(一|外一?)个(行程|旅行|计划|攻略)|重新开始|从头(开始|来)|换个(行程|旅行|计划)|"
                     r"start over|from scratch|new (trip|plan|itinerary)|another trip", re.I)


def stop_ids(result: dict | None) -> list[str]:
    return [stop["id"] for day in (result or {}).get("days", []) for stop in day["stops"] if stop.get("id")]


def same_request(before: dict, after: dict) -> bool:
    """两次的条件一样（不看 provenance：同样的条件，来源说法可以不同）"""
    strip = lambda request: {key: value for key, value in request.items() if key != "provenance"}  # noqa: E731
    return strip(before) == strip(after)


# “好的谢谢”“ok thanks”这种几个连在一起的也算
ACK = re.compile(r"(\s*(好的?|好吧|行|可以|谢谢你?|多谢|感谢|收到|明白了?|ok|okay|thanks|thank you|great|cool|got it)[\s,，!！。.~啦呀啊了]*)+", re.I)


def is_ack(message: str) -> bool:
    return ACK.fullmatch(message) is not None


def unchanged_reply(message: str, zh: bool) -> str:
    if is_ack(message):
        return "好的。想改什么直接说就行，比如“住民宿”“轻松一点”“玩 4 天”。" if zh else \
            "Sure. Tell me anything you'd like to change, e.g. “vacation rentals”, “a slower pace”, or “4 days”."
    if zh:
        return ("想改行程可以直接说，比如“住民宿”“改成从弗雷斯诺出发”“轻松一点”“玩 4 天”；"
                "也可以问景点、住宿、车程，比如“El Portal 离园区多远”。")
    return ("To change the plan, say something like “vacation rentals”, “start from Fresno”, “a slower pace”, or “4 days”. "
            "You can also ask about places, lodging, or drive times.")
