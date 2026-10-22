"""回答问题（RAG）：行程排好以后，用户问“El Portal 离园区多远”“火瀑哪几天有”“19 号几点出发”这类问题。

1. knowledge.search 在网站资料里找最相关的几条（只在这次行程的公园里找）；
2. 模型只根据“行程 + 这几条资料”回答，输出 {found, answer, sources}；
3. 代码检查：回答里的时间、数字都要在行程或资料里出现过，引用的编号要是给过的；对不上就不用模型写的，
   改成直接摘资料原文（问题里点了名的那条），什么都没查到就老实说不知道。
是不是“提问”不靠模型判断：Intake 从这句话里摘不出任何新条件、行程没变，这句话才会走到这里。
"""
from __future__ import annotations

import re

from . import prompts
from .knowledge import Doc, get, search
from .providers import Provider, ProviderError
from .text import normalize
from .writer import NUMBER_RE, TIME_RE

QA_SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["found", "answer", "sources"],
    "properties": {
        "found": {"type": "boolean"},
        "answer": {"type": "string", "minLength": 1, "maxLength": 600},
        "sources": {"type": "array", "maxItems": 5, "items": {"type": "integer", "minimum": 0, "maximum": 9}},
    },
}
QUESTION = re.compile(r"[?？]|吗|呢|么|怎|什么|啥|多远|多久|多长|多少|几|哪|如何|是否|能不能|可不可以|有没有|要不要|是不是|"
                      r"介绍|讲讲|说说|聊聊|告诉我|推荐|"
                      r"\b(what|when|where|which|who|why|how|is|are|can|could|do|does|should|will|tell me|describe|recommend|explain)\b", re.I)
# 问的是行程里的景点整体（“这些景点好看吗”“哪个最值得去”）：把每一站的一句介绍也给模型
ABOUT_TRIP = re.compile(r"这些|这几个|行程|安排的|排的|哪个|哪些|哪一个|最值得|值不值|好看|好玩|有意思|怎么样|these|which|worth|best", re.I)
SNIPPET = 260
# 问的是没排进去的景点（“没排进去的都是哪个公园的”“为什么没去 XX”）：把完整的没排进去的清单（按公园分）给模型。
# 回复里只写了前 6 个“等 26 处”，10-21 仓库主人问“这些没排进去的地方都是哪个国家公园”，模型答不上来
SKIPPED_Q = re.compile(r"没排|没去|没安排|没有排|没放|排不进|去不了|不能去|为什么不去|为什么没|skipp|left out|not included|didn.?t (make|include)|can.?t (go|visit)", re.I)


def is_question(message: str) -> bool:
    return QUESTION.search(normalize(message)) is not None


def travel_months(plan_text: str) -> str:
    """行程里的日期范围和月份（“2026-10-31 到 2026-11-04（10 月、11 月）”）：让模型不用自己推算出行月份"""
    dates = sorted(set(re.findall(r"(\d{4}-\d{2}-\d{2})", plan_text)))
    if not dates:
        return ""
    months = "、".join(dict.fromkeys(f"{int(d[5:7])} 月" for d in dates))
    return f"{dates[0]} 到 {dates[-1]}（{months}）" if len(dates) > 1 else f"{dates[0]}（{months}）"


def trip_context(plan_text: str) -> str:
    """给模型看的行程：上一次回复里的行程，去掉 Airbnb 链接（很长、对回答没用）"""
    return "\n".join(line for line in plan_text.splitlines() if "http" not in line) or "（还没排出行程）"


def stop_briefs(stops: list[str]) -> list[str]:
    """行程里每一站的一句介绍（资料的第二句就是景点介绍的第一句）"""
    lines = []
    for doc in filter(None, map(get, dict.fromkeys(stops))):
        sentences = [s for s in doc.text.split("。") if s]
        brief = sentences[1] if len(sentences) > 1 else sentences[0]
        lines.append(f"- {doc.title}：{brief[:70]}")
    return lines


def skipped_lines(skipped: list[dict], zh: bool) -> list[str]:
    """没排进去的景点，按公园分组：“- 拉森火山：硫磺厂地热区（冬季……）；邦帕斯地狱（只在 7–10 月开放）”"""
    from .catalog import parks as park_table
    from .writer import skip_reason

    table = park_table()
    groups: dict[str, list[str]] = {}
    for item in skipped:
        groups.setdefault(item["park"], []).append(f"{item['nameZh'] if zh else item['nameEn']}（{skip_reason(item, zh)}）")
    lines = []
    for code, names in groups.items():
        park = table.get(code)
        label = (park.name_zh if zh else park.name_en) if park else code
        lines.append(f"- {label}：" + "；".join(names))
    return lines


def build_user(question: str, trip: str, docs: list[Doc], briefs: list[str] | None = None, meaning: str = "",
               when: str = "", zh: bool = True, skipped: list[str] | None = None, looked: list[str] | None = None) -> str:
    parts = [f"问题：{question}"]
    if not zh:
        parts.append("（用户用英文问的：answer 用英文写，Answer in English.）")
    if when:
        parts.append(f"出行日期：{when}")
    if meaning and normalize(meaning) != normalize(question):
        parts.append(f"（按前面的对话，大概是问：{meaning}。以用户原话为准）")
    parts += ["", "[0] 行程：", trip]
    if briefs:
        parts += ["行程里的景点：", *briefs]
    if skipped:
        parts += ["没排进去的景点（全部，按公园分，括号里是原因）：", *skipped]
    if looked:
        # 查询工具（tools.py）按网站数据算出来的：开没开、车程、按条件找到的景点。比下面的资料原文更直接，优先照这个答
        parts += ["[0] 查询结果（网站的查询工具按数据算的，照这个回答）：", *looked]
    parts += ["", "资料："]
    parts += [f"[{i}] {doc.title}：{doc.text}" for i, doc in enumerate(docs, 1)]
    return "\n".join(parts)


def unsupported(answer: str, context: str) -> list[str]:
    """回答里的时间、数字在行程和资料里都找不到的（空 = 没发现编造）"""
    problems = [clock for clock in TIME_RE.findall(answer) if clock not in context and clock.zfill(5) not in context]
    # 按整个数比（“5”不能因为资料里有“25”就算对上）
    numbers = set(NUMBER_RE.findall(TIME_RE.sub(" ", context)))
    problems += [number for number in NUMBER_RE.findall(TIME_RE.sub(" ", answer)) if number not in numbers]
    return sorted(set(problems))


def named(question: str, docs: list[Doc]) -> Doc | None:
    """问题里直接点了名的那条资料（摘原文时只摘它，免得摘到不相干的）"""
    query = normalize(question).lower()
    for doc in docs:
        if any(len(name) >= 2 and normalize(name).lower() in query for name in doc.names):
            return doc
    return None


def fallback(question: str, docs: list[Doc], zh: bool, looked: list[str] | None = None) -> str:
    if looked:
        # 模型没用上、或者说得对不上：直接把查询工具算出来的结果给用户
        return ("按网站的数据查到的：\n" if zh else "From the site's data:\n") + "\n".join(looked)
    doc = named(question, docs)
    if doc and zh:
        text = doc.text if len(doc.text) <= SNIPPET else doc.text[:SNIPPET].rsplit("。", 1)[0] + "。……"
        return f"网站资料里关于“{doc.title}”是这样写的：{text}"
    if doc:
        return f"I couldn't answer that reliably. The site has an entry on {doc.names[-1]}; open it on the park page for details."
    return ("这个网站的资料里没写，我不想瞎猜。可以看公园页的景点和住宿介绍，或者 NPS 官网。" if zh else
            "That isn't in the site's data, and I'd rather not guess. Check the park page or the NPS website.")


def answer(question: str, parks: list[str], plan_text: str, provider: Provider | None, zh: bool,
           stops: list[str] | None = None, meaning: str = "", skipped: list[dict] | None = None,
           looked: list[str] | None = None) -> tuple[str, dict]:
    """question 是用户原话；meaning 是调度员按上下文补全的问法（“那条步道”→“雾径”），只用来帮着找资料、给模型参考，
    回答和“问题里点了名的那条”都以原话为准（补全有时会补错）"""
    docs = search(f"{question} {meaning}" if meaning else question, parks)
    trace: dict = {"retrieved": [doc.id for doc in docs]}
    briefs = stop_briefs(stops) if stops and ABOUT_TRIP.search(normalize(question)) else []
    left_out = skipped_lines(skipped, zh) if skipped and SKIPPED_Q.search(normalize(f"{question} {meaning}")) else []
    trace["skipped_lines"] = len(left_out)
    trace["tool_lines"] = len(looked or [])
    trip = trip_context(plan_text)
    if provider is None:
        trace["answer"] = "fallback"
        return fallback(question, docs, zh, looked), trace
    prompt = prompts.load("qa")
    trace["prompt"] = prompt.id
    user = build_user(question, trip, docs, briefs, meaning, travel_months(plan_text), zh, left_out, looked)
    trace["stop_briefs"] = len(briefs)
    try:
        completion = provider.complete_json("qa", prompt.text, user, QA_SCHEMA)
    except ProviderError as error:
        trace.update(answer="fallback", fallback="provider_error", error=str(error))
        return fallback(question, docs, zh, looked), trace
    data = completion.data
    text = (data.get("answer") or "").strip()
    sources = [i for i in data.get("sources", []) if isinstance(i, int)]
    problems = unsupported(text, user)
    bad_sources = [i for i in sources if i > len(docs)]
    trace.update(model=completion.model, latency_ms=completion.latency_ms, found=data.get("found"), sources=sources,
                 draft=text, unsupported=problems)
    if problems or bad_sources or not text:
        trace.update(answer="fallback", fallback="unfaithful" if problems or bad_sources else "empty")
        return fallback(question, docs, zh, looked), trace
    if not data.get("found"):
        trace["answer"] = "not_found"
        return fallback(question, docs, zh, looked), trace
    cited = [docs[i - 1] for i in sources if i >= 1]
    if cited:
        titles = "、".join(dict.fromkeys(doc.title for doc in cited)) if zh else \
            ", ".join(dict.fromkeys(doc.names[-1] for doc in cited))
        text += f"\n（资料：{titles}）" if zh else f"\n(Source: {titles})"
    trace["answer"] = "model"
    return text, trace
