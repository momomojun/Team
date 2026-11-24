"""这一轮 Copilot 做了什么，写成给用户看的几步（11-23 仓库主人：线上试了看不出 search agent 和多 agent 协作在哪里）。

每一轮的 trace（pipeline 记的）里本来就有：调度员定了哪些动作、回答问题走的是 search agent 还是找一次就答、规划 agent 摘了
几条要求、行程引擎排了几天、审查 agent 商量了几轮、Critic 有没有改、Writer 用的模型还是模板。这里只把这些翻成一句一句的话，
网站对话框在回复下面列出来；不调模型、不改回复本身。who 是角色（网站按它配颜色），model 表示这一步调没调模型。
"""
from __future__ import annotations

from . import team
from .agent import TOOL_LABEL
from .monitor import agent_of, qa_mode_of

ACTION = {
    "conditions": ("改条件", "update the trip details"), "ask": ("回答问题", "answer a question"),
    "add_stop": ("加景点", "add a stop"), "remove_stop": ("去掉景点", "drop a stop"),
    "set_lodging": ("换住处", "change a hotel"), "new_trip": ("重新开始一趟", "start a new trip"), "chat": ("闲聊", "chat"),
}


def _step(who: str, zh: str, en: str, model: bool, lang_zh: bool) -> dict:
    return {"who": who, "text": zh if lang_zh else en, "model": model}


def steps(trace: dict, zh: bool) -> list[dict]:
    out: list[dict] = []
    dispatch = trace.get("dispatch") or {}
    actions = [a.get("type") for a in dispatch.get("actions") or [] if isinstance(a, dict)]
    if actions:
        names = list(dict.fromkeys(ACTION[a][0 if zh else 1] for a in actions if a in ACTION))
        if names:
            out.append(_step("dispatcher", "调度员：判断这句话要" + "、".join(names), "Dispatcher: this message means " + ", ".join(names), True, zh))

    mode = qa_mode_of(trace)
    if mode == "agent":
        agent = agent_of(trace) or {}
        tools = list(dict.fromkeys(TOOL_LABEL.get(t, (t, t))[0 if zh else 1] for t in agent.get("tools") or []))
        looked = ("查了" + "、".join(tools)) if zh and tools else ("looked up " + ", ".join(tools)) if tools else ("直接回答" if zh else "answered directly")
        out.append(_step("search_agent", f"search agent：自己决定查什么，{looked}（{agent.get('steps', 0)} 步）",
                         f"Search agent: chose its own lookups and {looked} ({agent.get('steps', 0)} steps)", True, zh))
    elif mode in ("qa", "agent→qa"):
        out.append(_step("qa", "回答问题：在网站资料里找了一次再回答" + ("（search agent 出了问题，退回这一种）" if mode == "agent→qa" else ""),
                         "Q&A: searched the site's notes once, then answered" + (" (the search agent failed and fell back)" if mode == "agent→qa" else ""),
                         True, zh))

    plan = trace.get("team_plan")
    if isinstance(plan, dict):
        wishes = [team.Wish(w["kind"], w.get("params") or {}, w.get("evidence", "")) for w in plan.get("wishes") or [] if isinstance(w, dict)]
        dropped = len(plan.get("dropped") or [])
        if wishes:
            said = "；".join(team.label(w, True) for w in wishes) if zh else "; ".join(team.label(w, False) for w in wishes)
            out.append(_step("planner", f"规划 agent：从你的话里摘出 {len(wishes)} 条要求：{said}", f"Planning agent: found {len(wishes)} wishes in what you said: {said}", True, zh))
        else:
            extra_zh = f"（摘了 {dropped} 条，代码核对后都不算）" if dropped else ""
            extra_en = f" ({dropped} found, none survived the code check)" if dropped else ""
            out.append(_step("planner", "规划 agent：这次没有特别的要求（比如中间休息、每天开车上限），按常规排" + extra_zh,
                             "Planning agent: no special wishes this time (like a rest day or a daily drive cap), planning as usual" + extra_en, True, zh))

    request, plan_trace = trace.get("request") or {}, trace.get("plan")
    if isinstance(plan_trace, dict) and request.get("days"):
        out.append(_step("engine", f"行程引擎：排了 {request['days']} 天（确定的代码，不用模型）",
                         f"Trip planner: planned {request['days']} days (deterministic code, no model)", False, zh))

    negotiation = trace.get("team")
    if isinstance(negotiation, dict) and negotiation.get("first") is not None:
        final = negotiation.get("final") or []
        rounds = len([r for r in negotiation.get("rounds") or [] if "review" in r])
        met, total = sum(1 for ok in final if ok), len(final)
        if rounds:
            out.append(_step("reviewer", f"审查 agent：逐条检查，没做到的商量了 {rounds} 轮，最后做到 {met}/{total} 条",
                             f"Review agent: checked each wish, negotiated {rounds} round(s), met {met}/{total}", True, zh))
        else:
            out.append(_step("reviewer", f"审查：代码逐条检查，{met}/{total} 条第一次就做到了，不用商量",
                             f"Review: code checked each wish, {met}/{total} met on the first try, no negotiation needed", False, zh))

    if trace.get("revision"):
        out.append(_step("critic", "Critic：检查出太满，自动改了一次", "Critic: found the plan too packed and revised it once", False, zh))
    writer = trace.get("writer")
    if isinstance(writer, dict) and isinstance(plan_trace, dict):
        if writer.get("writer") == "model":
            out.append(_step("writer", "Writer：用模型把行程写成说明，核对过没有编造", "Writer: a model wrote the summary, checked for anything made up", True, zh))
    return out
