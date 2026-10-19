"""调度员：每一轮先让模型看最近的对话、现在的条件和行程，决定这句话要做哪几件事（改条件、提问、加减景点、
指定住处、重新开始、闲聊），再由代码一件件去做。

模型只出“做什么”，不出事实：条件还是 Intake 从原话里摘、代码读；景点和住处的名字代码去资料里对成 id，
对不上的不做、告诉用户；问题交给 qa（只按查到的资料回答）；行程由引擎排。模型的输出不合格、调用失败时，
退回原来按规则走的流程（pipeline 里的 _legacy），不会因为调度员出错就答不了。
"""
from __future__ import annotations

from dataclasses import dataclass, field

from . import catalog, prompts
from .providers import Provider, ProviderError
from .text import contains, normalize

TYPES = ("conditions", "ask", "add_stop", "remove_stop", "set_lodging", "new_trip", "chat")
DISPATCH_SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["actions"],
    "properties": {"actions": {"type": "array", "minItems": 1, "maxItems": 4, "items": {
        "type": "object", "additionalProperties": False, "required": ["type"],
        "properties": {
            "type": {"enum": list(TYPES)},
            "query": {"type": "string", "maxLength": 200},
            "place": {"type": "string", "maxLength": 80},
            "night": {"type": "integer", "minimum": 1, "maximum": 13},
        },
    }}},
}
HISTORY_TURNS = 4


@dataclass
class Action:
    type: str
    query: str = ""
    place: str = ""
    night: int | None = None


@dataclass
class Dispatch:
    actions: list[Action]
    trace: dict = field(default_factory=dict)

    def has(self, kind: str) -> bool:
        return any(action.type == kind for action in self.actions)


def context_text(history: list[tuple[str, str]], conditions: dict, result: dict | None, message: str, zh: bool) -> str:
    """给调度员看的：最近几轮对话（助手只留第一行）、现在的条件、现在的行程（每天去哪、住哪）、最新一句"""
    lines = ["最近的对话："]
    for user, assistant in history[-HISTORY_TURNS:]:
        lines.append(f"用户：{user}")
        lines.append(f"助手：{assistant.splitlines()[0][:120] if assistant else ''}")
    if not history:
        lines.append("（这是第一句）")
    table = catalog.parks()
    parks = "、".join(table[code].name_zh for code in conditions.get("parks") or [] if code in table) or "还没定"
    when = conditions.get("startDate") or (f"{conditions['month']} 月" if conditions.get("month") else "还没定")
    lines += ["", f"现在的条件：公园 {parks}；出发 {when}；天数 {conditions.get('days') or '还没定'}；"
                  f"节奏 {conditions.get('pace') or '还没定'}；住宿 {conditions.get('lodgingPref') or '不限'}"]
    if result:
        lines.append("现在的行程：")
        for day in result["days"]:
            stops = "、".join(stop["nameZh"] for stop in day["stops"]) or "路上"
            lodging = (day.get("lodging") or {}).get("nameZh", "")
            lines.append(f"第 {day['day']} 天：{stops}" + (f"；晚上住 {lodging}" if lodging else ""))
    else:
        lines.append("现在的行程：还没排出来")
    lines += ["", f"用户最新一句：{message}"]
    return "\n".join(lines)


def dispatch(provider: Provider, history: list[tuple[str, str]], conditions: dict, result: dict | None,
             message: str, zh: bool) -> Dispatch:
    """调模型决定做哪几件事；模型出错或输出用不了时 actions 是空的（调用方走原来的流程），trace 里记下原因"""
    prompt = prompts.load("dispatch")
    user = context_text(history, conditions, result, message, zh)
    trace: dict = {"prompt": prompt.id}
    try:
        completion = provider.complete_json("dispatch", prompt.text, user, DISPATCH_SCHEMA)
    except ProviderError as error:
        trace.update(error=str(error))
        return Dispatch([], trace)
    trace.update(model=completion.model, latency_ms=completion.latency_ms, output=completion.data)
    recent = message + "\n" + "\n".join(f"{u}\n{a}" for u, a in history[-HISTORY_TURNS:])
    actions, dropped = [], []
    for raw in completion.data.get("actions", []) if isinstance(completion.data, dict) else []:
        if not isinstance(raw, dict) or raw.get("type") not in TYPES:
            dropped.append({"action": raw, "reason": "invalid"})
            continue
        action = Action(raw["type"], (raw.get("query") or "").strip(), (raw.get("place") or "").strip(), raw.get("night"))
        # 加减景点、指定住处：名字要是用户这句或最近对话里说过的（模型不能自己编一个地方）
        if action.type in ("add_stop", "remove_stop", "set_lodging", "conditions") and action.place and not contains(recent, action.place):
            if action.type == "conditions":
                action.place = ""  # 指代的公园不是对话里说过的：只当普通的改条件
            else:
                dropped.append({"action": raw, "reason": "place_not_in_conversation"})
                continue
        if action.type in ("add_stop", "remove_stop", "set_lodging") and not action.place:
            dropped.append({"action": raw, "reason": "place_not_in_conversation"})
            continue
        if action.type == "ask" and not action.query:
            action.query = message
        actions.append(action)
    trace["dropped"] = dropped
    if not actions:
        return Dispatch([], trace)
    # 同一件事只做一次（模型偶尔重复）
    seen, unique = set(), []
    for action in actions:
        key = (action.type, normalize(action.query or action.place).lower(), action.night)
        if key not in seen:
            seen.add(key)
            unique.append(action)
    trace["actions"] = [vars(action) for action in unique]
    return Dispatch(unique, trace)
