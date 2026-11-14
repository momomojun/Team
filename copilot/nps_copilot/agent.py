"""会自己查的问答（search agent，11-13）：模型看问题，自己决定调哪几个查询工具、填什么参数，看了结果再决定还要不要查，
查够了带着出处回答。

和 qa.py（找一次就答）的区别：qa 先由代码按正则认出要查什么（tools.plan_requests），一句话问两件事、后一步要用前一步的
结果（“先找适合孩子的步道，再看从住处开过去多久”）都查不全；这里由模型来拆。

模型只出“查什么”和最后的回答，不出事实：
- 参数里的地方写名字，代码对成网站的 id（对不上就告诉模型“不认识”，不让它编 id）；日期代码检查格式、是不是存在、是不是已经过了；
- 查询都是网站自己的计算（tools.call → scripts/lookup.mjs，不联网、结果确定）和网站资料（vectors.retrieve）；
- 回答里的时间、数字还是要在给它看过的东西里出现过（qa.unsupported），引用的编号要是给过的，不能说出工具名；
- 最多 MAX_STEPS 次模型调用（最后一次只能回答）、每步最多 MAX_CALLS 个查询、整圈 BUDGET_S 秒。

出了问题（模型调用失败、输出用不了、超时、还没查到东西就停了）返回 None，调用方退回原来的 qa.answer，不会因为这一圈出错就答不了。
COPILOT_QA_AGENT=1 打开（pipeline._ask），默认关着，评测（eval/agent.py）比过再决定要不要默认打开。
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import time
from dataclasses import dataclass, field

from . import catalog, prompts, qa, tools
from .knowledge import Doc, get, index
from .providers import Provider, ProviderError
from .text import normalize
from .vectors import retrieve

MAX_STEPS = 4
MAX_CALLS = 3
BUDGET_S = 20.0

# 模型看到的工具名 → 网站查询工具（lookup-tool.ts）的 tool；search_knowledge 不走 node，查网站资料
TOOLS = {
    "search_knowledge": None,
    "is_open": "is_open",
    "drive_time": "drive_time",
    "find_attractions": "search",
    "season_rank": "season_rank",
    "fees": "fees",
    "sun_times": "sun_times",
    "booking": "booking",
    "crowd": "crowd",
}
KINDS = ["viewpoint", "hike", "waterfall", "grove", "landmark", "drive", "experience", "visitor"]
TOOL_LABEL = {
    "search_knowledge": ("网站资料", "site notes"),
    "is_open": ("开放情况", "opening status"),
    "drive_time": ("车程表", "drive-time table"),
    "find_attractions": ("景点筛选", "attraction search"),
    "season_rank": ("“什么时候去”的打分", "seasonal scores"),
    "fees": ("门票", "fees"),
    "sun_times": ("日出日落", "sunrise and sunset"),
    "booking": ("要提前订的", "booking windows"),
    "crowd": ("游客人次", "visitor counts"),
}

_TEXT = {"type": "string", "maxLength": 120}
ARGS_SCHEMA = {
    "type": "object", "additionalProperties": False,
    "properties": {
        "query": {"type": "string", "maxLength": 200},
        "place": _TEXT, "from": _TEXT, "to": _TEXT, "park": _TEXT,
        "parks": {"type": "array", "maxItems": 6, "items": _TEXT},
        "date": {"type": "string", "maxLength": 20},
        "start": {"type": "string", "maxLength": 20},
        "month": {"type": "integer", "minimum": 1, "maximum": 12},
        "kinds": {"type": "array", "maxItems": 8, "items": {"enum": KINDS}},
        "difficulty": {"type": "array", "maxItems": 3, "items": {"enum": ["easy", "moderate", "hard"]}},
        "maxMiles": {"type": "number", "minimum": 0, "maximum": 60},
        "noPermit": {"type": "boolean"},
        "kidAge": {"type": "integer", "minimum": 0, "maximum": 17},
        "seniors": {"type": "boolean"},
        "wheelchair": {"type": "boolean"},
        "stroller": {"type": "boolean"},
        "limit": {"type": "integer", "minimum": 1, "maximum": 20},
    },
}
_ANSWER_PROPS = {
    "found": {"type": "boolean"},
    "answer": {"type": "string", "maxLength": 900},
    "sources": {"type": "array", "maxItems": 10, "items": {"type": "integer", "minimum": 0, "maximum": 40}},
}
STEP_SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["action"],
    "properties": {
        "action": {"enum": ["call", "answer"]},
        "calls": {"type": "array", "maxItems": MAX_CALLS, "items": {
            "type": "object", "additionalProperties": False, "required": ["tool", "args"],
            "properties": {"tool": {"enum": list(TOOLS)}, "args": ARGS_SCHEMA},
        }},
        **_ANSWER_PROPS,
    },
}
# 最后一步只能回答
FINAL_SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["action", "found", "answer", "sources"],
    "properties": {"action": {"enum": ["answer"]}, **_ANSWER_PROPS},
}
# 回答里不能说出工具名（G01 这类“把工具和参数列出来”）；fees、booking 这种普通英文词不算
TOOL_WORD = re.compile(r"(?<![A-Za-z_])(" + "|".join(name for name in TOOLS if "_" in name) + r")(?![A-Za-z_])")


@dataclass
class Observation:
    n: int
    tool: str
    args: dict
    lines: list[str]
    request: dict | None = None
    docs: list[Doc] = field(default_factory=list)
    error: str = ""

    def text(self, zh: bool) -> str:
        args = json.dumps(self.args, ensure_ascii=False)
        head = f"[{self.n}] {self.tool} {args}"
        if self.error:
            return f"{head}\n  {'没查成' if zh else 'failed'}：{self.error}"
        return head + "\n" + "\n".join(f"  {line}" for line in self.lines)


def budget() -> float:
    try:
        return float(os.environ.get("COPILOT_AGENT_BUDGET_S", BUDGET_S))
    except ValueError:
        return BUDGET_S


def enabled() -> bool:
    return os.environ.get("COPILOT_QA_AGENT") == "1"


# ---------- 名字 → id ----------

def _bigrams(text: str) -> set[str]:
    text = re.sub(r"\s+", "", normalize(text).lower())
    return {text[i:i + 2] for i in range(len(text) - 1)} or {text}


def resolve_place(name: str, parks: list[str], kinds: tuple[str, ...]) -> tuple[str, str, str] | None:
    """名字（中英文、id、机场代码）→ (类型, id, 网站上的名字)。先认 id，再认原话里的名字（tools.places_in），
    再认“名字里包含这几个字”（“山谷酒店”→“优胜美地山谷酒店”）和字面很像的（“沙漠观景点”→“沙漠观景塔”）；都认不出返回 None"""
    raw = (name or "").strip()
    if not raw:
        return None
    docs = index()[0]
    key = raw.upper() if raw.isascii() and len(raw) == 3 else raw
    if "airport" in kinds and key in catalog.airports():
        return "airport", key, key
    if "park" in kinds and raw.lower() in catalog.parks():
        park = catalog.parks()[raw.lower()]
        return "park", park.code, park.name_zh
    doc = get(raw)
    if doc is not None and doc.type in kinds:
        return doc.type, doc.id, doc.title
    hits = [place for place in tools.places_in(raw, parks) if place.kind in kinds or place.kind == "park"]
    for place in hits:
        if place.kind in kinds and place.kind != "park":
            return place.kind, place.id, place.name
    wanted = normalize(raw).lower()
    park_hit = next((place for place in hits if place.kind == "park"), None)
    if park_hit is None and (found := catalog.find_all(raw, catalog.parks())):
        park_hit = tools.Place("park", found[0][0], catalog.parks()[found[0][0]].name_zh, 0)
    # 只认出了公园（“Zion Visitor Center”“布莱斯峡谷日出点”里的公园名）：去掉公园名还剩字的，先在这座公园里按字面找景点
    leftover = wanted.replace(normalize(park_hit.name).lower(), "").strip() if park_hit else wanted
    if kinds != ("park",) and len(leftover) >= 2:
        fuzzy = _fuzzy(raw, [park_hit.id] if park_hit else parks, kinds, only=park_hit.id if park_hit else None, docs=docs)
        if fuzzy:
            return fuzzy.type, fuzzy.id, fuzzy.title
    if park_hit and "park" in kinds:
        return "park", park_hit.id, catalog.parks()[park_hit.id].name_zh
    return None


def _fuzzy(raw: str, parks: list[str], kinds: tuple[str, ...], only: str | None, docs: list[Doc]) -> Doc | None:
    """字面最像的景点、住处：名字里包含这几个字（“山谷酒店”→“优胜美地山谷酒店”）、这几个字里包含名字（“布莱斯峡谷日出点”→“日出点”），
    或者两个字一组重合一半以上（“沙漠观景点”→“沙漠观景塔”）。only 给了就只在这座公园里找"""
    wanted = normalize(raw).lower()
    grams = _bigrams(raw)
    best: tuple[float, int, Doc] | None = None
    for doc in docs:
        if doc.type not in kinds or doc.type in ("park", "airport") or (only and doc.park != only):
            continue
        for alias in doc.names:
            text = normalize(alias).lower()
            other = _bigrams(alias)
            score = len(grams & other) / len(grams | other)
            if len(wanted) >= 2 and wanted in text:
                score = max(score, 0.9 + len(wanted) / max(len(text), 1) / 10)
            elif len(text) >= 2 and text in wanted:
                score = max(score, 0.6 + len(text) / len(wanted) * 0.3)
            rank = 0 if doc.park in parks else 1
            if score >= 0.5 and (best is None or (score, -rank) > (best[0], -best[1])):
                best = (score, rank, doc)
    return best[2] if best else None


def resolve_park(name: str | None, parks: list[str]) -> str | None:
    if not name:
        return parks[0] if len(parks) == 1 else None
    place = resolve_place(name, parks, ("park",))
    return place[1] if place else None


def check_date(value: str | None, reference: dt.date, zh: bool) -> tuple[str | None, str]:
    """(YYYY-MM-DD, 提醒) 或 (None, 为什么不行)"""
    if not value:
        return None, "没给日期" if zh else "no date given"
    match = re.fullmatch(r"(\d{4})-(\d{1,2})-(\d{1,2})", value.strip())
    if not match:
        return None, f"日期“{value}”要写成 YYYY-MM-DD" if zh else f"date {value!r} must be YYYY-MM-DD"
    year, month, day = map(int, match.groups())
    try:
        date = dt.date(year, month, day)
    except ValueError:
        return None, (f"{year} 年没有 {month} 月 {day} 日这一天" if zh else f"{value} is not a real date")
    note = ""
    if date < reference:
        note = (f"注意：{date.isoformat()} 已经过去了（今天是 {reference.isoformat()}）" if zh else
                f"note: {date.isoformat()} is in the past (today is {reference.isoformat()})")
    return date.isoformat(), note


# ---------- 一次查询 → 给网站查询工具的请求 ----------

@dataclass
class Ctx:
    parks: list[str]
    reference: dt.date
    zh: bool
    request: dict | None
    result: dict | None
    question: str


def build_request(tool: str, args: dict, ctx: Ctx) -> tuple[dict | None, list[str], str]:
    """(给 lookup-tool 的请求, 提醒, 出错原因)。认不出的地方、不对的日期不查，把原因告诉模型"""
    zh, parks = ctx.zh, ctx.parks
    notes: list[str] = []

    def unknown(name: str) -> str:
        return f"网站上没有叫“{name}”的地方" if zh else f"no place called {name!r} on the site"

    def need_date(key: str = "date") -> str | None:
        value, note = check_date(args.get(key), ctx.reference, zh)
        if value is None:
            raise ValueError(note)
        if note:
            notes.append(note)
        return value

    try:
        if tool == "is_open":
            date = need_date()
            name = args.get("place") or ""
            place = resolve_place(name, parks, ("attraction",))
            if place:
                return {"tool": "is_open", "attraction": place[1], "date": date}, notes, ""
            if not name:
                return None, notes, "没说是哪个景点或哪条路" if zh else "no place given"
            # 不是景点：可能是季节性山路（“Tioga Road”），交给工具按路名认
            return {"tool": "is_open", "text": name, "date": date}, notes, ""
        if tool == "drive_time":
            kinds = ("attraction", "lodging", "park", "airport")
            ends = []
            for key in ("from", "to"):
                place = resolve_place(args.get(key) or "", parks, kinds)
                if not place:
                    return None, notes, unknown(args.get(key) or "")
                ends.append(place[1])
            return {"tool": "drive_time", "from": ends[0], "to": ends[1]}, notes, ""
        if tool == "find_attractions":
            scope = [code for code in (resolve_park(name, parks) for name in args.get("parks") or []) if code] or parks
            if not scope:
                return None, notes, "没说是哪座公园" if zh else "no park given"
            search: dict = {"tool": "search", "parks": scope[:3], "limit": args.get("limit") or 8}
            for key in ("kinds", "difficulty", "maxMiles", "noPermit", "month"):
                if args.get(key) not in (None, [], ""):
                    search[key] = args[key]
            party = dict((ctx.request or {}).get("party") or {})
            if args.get("kidAge") is not None:
                party["youngestKid"] = args["kidAge"]
            for key in ("seniors", "wheelchair", "stroller"):
                if args.get(key):
                    party[key] = True
            if party:
                search["party"] = party
            if args.get("date"):
                search["date"] = need_date()
            elif "month" not in search and (dates := tools.trip_dates(ctx.result)):
                search["date"] = dates[0]
            return search, notes, ""
        if tool == "season_rank":
            rank: dict = {"tool": "season_rank", "today": ctx.reference.isoformat()}
            if args.get("start"):
                rank["start"] = need_date("start")
            elif args.get("month"):
                rank["month"] = args["month"]
            else:
                return None, notes, "要给月份（month）或出发日期（start）" if zh else "need month or start"
            names = args.get("parks") or []
            codes = [code for code in (resolve_park(name, parks) for name in names) if code]
            if names and not codes:
                return None, notes, unknown("、".join(names))
            if codes:
                rank["parks"] = list(dict.fromkeys(codes))
            if args.get("limit"):
                rank["limit"] = args["limit"]
            return rank, notes, ""
        if tool in ("fees", "crowd"):
            code = resolve_park(args.get("park"), parks)
            if not code:
                return None, notes, unknown(args.get("park") or "")
            out: dict = {"tool": tool, "park": code}
            if tool == "crowd" and args.get("month"):
                out["month"] = args["month"]
            return out, notes, ""
        if tool == "sun_times":
            date = need_date()
            place = resolve_place(args.get("place") or args.get("park") or "", parks, ("attraction", "park"))
            if not place:
                if len(parks) == 1 and not (args.get("place") or args.get("park")):
                    return {"tool": "sun_times", "park": parks[0], "date": date}, notes, ""
                return None, notes, unknown(args.get("place") or args.get("park") or "")
            key = "attraction" if place[0] == "attraction" else "park"
            return {"tool": "sun_times", key: place[1], "date": date}, notes, ""
        if tool == "booking":
            date = need_date()
            place = resolve_place(args["place"], parks, ("attraction", "lodging")) if args.get("place") else None
            code = resolve_park(args.get("park"), parks) or (place[1].split("-")[0] if place else None)
            if not code:
                return None, notes, unknown(args.get("park") or "")
            out = {"tool": "booking", "park": code, "date": date, "today": ctx.reference.isoformat()}
            if place:
                out["attraction" if place[0] == "attraction" else "lodging"] = place[1]
            elif args.get("place"):
                notes.append(unknown(args["place"]) + ("，按整座公园查" if zh else "; checked the whole park"))
            return out, notes, ""
    except ValueError as error:
        return None, notes, str(error)
    return None, notes, "不认识的工具" if zh else "unknown tool"


# ---------- 查询结果 → 给模型看的几行 ----------

VERDICT = {"great": ("最适合", "best"), "ok": ("可以去", "fine"), "poor": ("不太合适", "not ideal")}
CROWD = {"peak": ("最挤", "peak"), "busy": ("人多", "busy"), "moderate": ("人不算多", "moderate"), "quiet": ("人少", "quiet")}


def _season_row(row: dict, zh: bool) -> str:
    name = row["nameZh"] if zh else row["nameEn"]
    bits = [VERDICT[row["verdict"]][0 if zh else 1]]
    if zh:
        bits.append("正是最适合的月份" if row.get("inBestMonths") else f"最适合的月份是 {'、'.join(f'{m} 月' for m in row.get('bestMonths') or [])}")
        bits.append(f"能去的景点约 {round(row['openShare'] * 100)}%")
        if row.get("closedMustSee"):
            bits.append("去不了的必去景点：" + "、".join(row["closedMustSee"]))
        if climate := row.get("climate"):
            bits.append(f"往年同期平均最高 {climate['highC']}°C、最低 {climate['lowC']}°C、最热的日子约 {climate['hottestC']}°C，"
                        f"一个月里下雨约 {climate['wetDays']} 天、下雪约 {climate['snowDays']} 天")
        if row.get("events"):
            bits.append("特别活动：" + "、".join(row["events"]))
        for road in row.get("roads") or []:
            bits.append(f"{road['road']} 往年这几天通车的把握约 {round(road['chance'] * 100)}%")
        if crowd := row.get("crowd"):
            bits.append(f"{CROWD[crowd['level']][0]}（平均每天约 {crowd['perDay']} 人次）")
        return f"- {name}：" + "；".join(bits)
    bits.append("in its best months" if row.get("inBestMonths") else "best months " + ", ".join(map(str, row.get("bestMonths") or [])))
    bits.append(f"about {round(row['openShare'] * 100)}% of sights open")
    if row.get("closedMustSee"):
        bits.append("must-sees closed: " + ", ".join(row["closedMustSee"]))
    if climate := row.get("climate"):
        bits.append(f"typical high {climate['highC']}°C, low {climate['lowC']}°C")
    if crowd := row.get("crowd"):
        bits.append(CROWD[crowd["level"]][1])
    return f"- {name}: " + "; ".join(bits)


def _opening(opening: dict, zh: bool) -> str:
    when = opening.get("opens") or ("先到先得" if zh else "first come")
    if opening.get("time"):
        when += f" {opening['time']}（{opening.get('tz', '')}）" if zh else f" {opening['time']} ({opening.get('tz', '')})"
    parts = [("开订 " if zh else "opens ") + when]
    if opening.get("closes"):
        parts.append(("截止 " if zh else "closes ") + opening["closes"])
    if opening.get("results"):
        parts.append(("出结果 " if zh else "results ") + opening["results"])
    state = opening.get("state") or {}
    if state.get("state") == "upcoming":
        parts.append(f"还有 {state['inDays']} 天开始" if zh else f"starts in {state['inDays']} days")
    elif state.get("state") == "open":
        parts.append("现在能订" if zh else "open now")
    elif state.get("state") == "closed":
        parts.append("已经截止" if zh else "closed")
    elif state.get("state") == "waiting":
        parts.append("等结果" if zh else "awaiting results")
    return "，".join(parts) if zh else ", ".join(parts)


def format_result(tool: str, request: dict, result: dict, zh: bool) -> list[str]:
    if result.get("error"):
        return [f"查不到（{result['error']}）" if zh else f"no result ({result['error']})"]
    if tool == "is_open":
        target = result.get("attraction") or result.get("road") or {}
        name = target.get("nameZh" if zh else "nameEn", "")
        head = f"{name} {result['date']}：{tools.VERDICT_ZH[result['verdict']]}" if zh else \
            f"{name} on {result['date']}: {tools.VERDICT_EN[result['verdict']]}"
        return [head, *(f"依据：{fact['zh']}" if zh else f"because: {fact['en']}" for fact in result.get("facts", []))]
    if tool in ("drive_time", "find_attractions"):
        return [line.removeprefix("- ") for line in tools.format_lines([request], [result], zh)]
    if tool == "season_rank":
        window = result["window"]
        span = (f"从 {window['from']} 起 {window['days']} 天" if "from" in window else f"{window['month']} 月") if zh else \
            (f"{window['days']} days from {window['from']}" if "from" in window else f"month {window['month']}")
        if "compared" in result:
            return [f"按{span}比：" if zh else f"compared for {span}:", *(_season_row(row, zh) for row in result["compared"])]
        counts = result["counts"]
        lines = [f"按{span}，所有国家公园里最适合 {counts['great']} 座、可以去 {counts['ok']} 座、不太合适 {counts['poor']} 座。最适合的（按分数排）：" if zh else
                 f"For {span}: {counts['great']} best, {counts['ok']} fine, {counts['poor']} not ideal. Best (by score):"]
        lines += [_season_row(row, zh) for row in result["great"]]
        key = "nameZh" if zh else "nameEn"
        if result.get("moreGreat"):
            lines.append(("也最适合：" if zh else "also best: ") + ("、" if zh else ", ").join(row[key] for row in result["moreGreat"]))
        lines.append(("可以去：" if zh else "fine: ") + ("、" if zh else ", ").join(row[key] for row in result["ok"]))
        lines.append(("不太合适：" if zh else "not ideal: ") + ("、" if zh else ", ").join(row[key] for row in result["poor"]))
        return lines
    if tool == "fees":
        name = result["park"]["nameZh" if zh else "nameEn"]
        money = "CA$" if result.get("currency") == "CAD" else "$"
        bits = []
        for key, zh_label, en_label in (("vehicle", "一车", "per vehicle"), ("perPerson", "每人", "per person"), ("motorcycle", "摩托车", "motorcycle")):
            if result.get(key) is not None:
                bits.append(f"{zh_label} {money}{result[key]}" if zh else f"{money}{result[key]} {en_label}")
        lines = [f"{name}门票：" + ("、".join(bits) if bits else "不收门票") + ("（按天收）" if result.get("perDay") else "") if zh else
                 f"{name} entry: " + (", ".join(bits) if bits else "no entrance fee") + (" (per day)" if result.get("perDay") else "")]
        if tag := result.get("parkingTag"):
            lines.append(f"停车证：一天 ${tag['day']}、一周 ${tag['week']}、一年 ${tag['year']}（国家公园年卡不能代替）" if zh else
                         f"parking tag: ${tag['day']} day, ${tag['week']} week, ${tag['year']} year")
        if passes := result.get("passes"):
            lines.append(f"国家公园年卡：美国居民 ${passes['residentUsd']}、非居民 ${passes['nonresidentUsd']}" if zh else
                         f"annual pass: ${passes['residentUsd']} US residents, ${passes['nonresidentUsd']} nonresidents")
        else:
            lines.append("美国的国家公园年卡在这里不能用" if zh else "the US national parks pass is not valid here")
        if result.get("nonresidentSurchargeUsd"):
            lines.append(f"16 岁以上的非美国居民每人另收 ${result['nonresidentSurchargeUsd']}，同车有人持有效年卡整车免收" if zh else
                         f"nonresidents 16+ pay an extra ${result['nonresidentSurchargeUsd']} each unless someone in the car has a valid pass")
        if result.get("noteZh") and zh:
            lines.append(f"说明：{result['noteZh']}")
        lines.append(f"核对日期 {result.get('checked')}，官网 {result.get('source')}" if zh else f"checked {result.get('checked')}")
        return lines
    if tool == "sun_times":
        place = result["place"]
        name = place.get("nameZh" if zh else "nameEn", "")
        if result.get("polar"):
            return [f"{name} {result['date']}：{'极昼，太阳不落' if result['polar'] == 'day' else '极夜，太阳不升'}" if zh else
                    f"{name} on {result['date']}: polar {result['polar']}"]
        return [f"{name} {result['date']}：日出 {result['sunrise']}，日落 {result['sunset']}（{result['timeZone']} 当地时间，误差一两分钟）" if zh else
                f"{name} on {result['date']}: sunrise {result['sunrise']}, sunset {result['sunset']} ({result['timeZone']} local time)"]
    if tool == "booking":
        name = result["park"]["nameZh" if zh else "nameEn"]
        items = result.get("items") or []
        if not items:
            return [f"{result['date']} 去{name}，网站收录的里面没有要提前订的" if zh else f"nothing to book ahead for {name} on {result['date']}"]
        lines = [f"{result['date']} 去{name}要提前订的：" if zh else f"to book ahead for {name} on {result['date']}:"]
        for item in items:
            target = f"（{'、'.join(item['for'])}）" if item.get("for") and zh else ""
            openings = "；".join(_opening(opening, zh) for opening in item["openings"])
            lines.append(f"- {item['titleZh']}{target}：{openings}" + (f"。{item['noteZh']}" if zh and item.get("noteZh") else ""))
        return lines
    if tool == "crowd":
        name = result["park"]["nameZh" if zh else "nameEn"]
        lines = []
        if result.get("latestVisits"):
            lines.append(f"{name} {result['latestYear']} 年游客 {result['latestVisits']} 人次，美国国家公园第 {result['rank']}" if zh else
                         f"{name}: {result['latestVisits']} visits in {result['latestYear']}, rank {result['rank']}")
        if result.get("months"):
            if zh:
                lines.append(f"最挤 {result['busiestMonth']} 月、最冷清 {result['quietestMonth']} 月（按 {result['years']} 年平均）")
                lines += [f"{row['month']} 月平均每天约 {row['perDay']} 人次（{CROWD[row['level']][0]}）" for row in result["months"]]
            else:
                lines.append(f"busiest month {result['busiestMonth']}, quietest {result['quietestMonth']}")
                lines += [f"month {row['month']}: about {row['perDay']} visits a day ({CROWD[row['level']][1]})" for row in result["months"]]
        else:
            lines.append("没有按月的人次数据" if zh else "no monthly numbers")
        return lines
    return [json.dumps(result, ensure_ascii=False)[:600]]


# ---------- 这一圈 ----------

def build_user(question: str, ctx: Ctx, trip: str, observations: list[Observation], steps_left: int,
               briefs: list[str], skipped: list[str], when: str) -> str:
    zh = ctx.zh
    parks = "、".join(catalog.parks()[code].name_zh for code in ctx.parks if code in catalog.parks()) or "还没定"
    parts = [f"今天：{ctx.reference.isoformat()}", f"问题：{question}"]
    if not zh:
        parts.append("（用户用英文问的：answer 用英文写，Answer in English.）")
    parts.append(f"这次行程的公园：{parks}")
    if when:
        parts.append(f"出行日期：{when}")
    parts += ["", "[0] 行程：", trip]
    if briefs:
        parts += ["行程里的景点：", *briefs]
    if skipped:
        parts += ["没排进去的景点（全部，按公园分，括号里是原因）：", *skipped]
    parts += ["", "已经查过的：" if observations else "还没查过。"]
    parts += [obs.text(zh) for obs in observations]
    parts.append("")
    parts.append("这是最后一步：不能再查了，按上面的回答。" if steps_left <= 1 else f"还能再查 {steps_left - 1} 步。")
    return "\n".join(parts)


def _sig(request: dict) -> str:
    return json.dumps(request, ensure_ascii=False, sort_keys=True)


def answer(question: str, parks: list[str], plan_text: str, provider: Provider | None, zh: bool, reference: str,
           request: dict | None = None, result: dict | None = None, stops: list[str] | None = None,
           meaning: str = "", skipped: list[dict] | None = None) -> tuple[str | None, dict]:
    """(回答, trace)；回答是 None 时调用方退回 qa.answer（trace 里写了为什么）"""
    started = time.monotonic()
    trace: dict = {"mode": "agent", "steps": []}
    if provider is None:
        trace["fallback"] = "no_provider"
        return None, trace
    prompt = prompts.load("agent")
    trace["prompt"] = prompt.id
    ctx = Ctx(parks, dt.date.fromisoformat(reference), zh, request, result, question)
    trip = qa.trip_context(plan_text)
    asked = normalize(f"{question} {meaning}")
    briefs = qa.stop_briefs(stops) if stops and qa.ABOUT_TRIP.search(asked) else []
    left_out = qa.skipped_lines(skipped, zh) if skipped and qa.SKIPPED_Q.search(asked) else []
    when = qa.travel_months(plan_text)
    shown = question if not meaning or normalize(meaning) == normalize(question) else f"{question}（按前面的对话，大概是问：{meaning}）"
    observations: list[Observation] = []
    seen: dict[str, int] = {}
    limit = budget()

    def stop(reason: str) -> tuple[str | None, dict]:
        trace.update(fallback=reason, elapsed_ms=round((time.monotonic() - started) * 1000))
        lines = [line for obs in observations if obs.tool != "search_knowledge" and not obs.error for line in obs.lines]
        docs = [doc for obs in observations for doc in obs.docs]
        if lines or docs:
            # 已经查到了东西：直接把查到的给用户（和 qa.fallback 一样），不再调一次模型
            trace["answer"] = "fallback"
            return qa.fallback(question, docs, zh, [f"- {line}" for line in lines] or None), trace
        return None, trace

    for step in range(MAX_STEPS):
        if time.monotonic() - started >= limit:
            return stop("timeout")
        steps_left = MAX_STEPS - step
        user = build_user(shown, ctx, trip, observations, steps_left, briefs, left_out, when)
        schema = FINAL_SCHEMA if steps_left <= 1 else STEP_SCHEMA
        try:
            completion = provider.complete_json("agent", prompt.text, user, schema)
        except ProviderError as error:
            trace["error"] = str(error)[:300]
            return stop("provider_error")
        data = completion.data if isinstance(completion.data, dict) else {}
        record: dict = {"model": completion.model, "latency_ms": completion.latency_ms, "action": data.get("action")}
        trace["steps"].append(record)
        calls = data.get("calls") or []
        if data.get("action") == "call" and calls and steps_left > 1:
            record["calls"] = []
            pending: list[tuple[Observation, str]] = []
            for raw in calls[:MAX_CALLS]:
                tool = raw.get("tool") if isinstance(raw, dict) else None
                args = raw.get("args") if isinstance(raw, dict) and isinstance(raw.get("args"), dict) else {}
                if tool not in TOOLS:
                    record["calls"].append({"tool": tool, "error": "unknown_tool"})
                    continue
                obs = Observation(len(observations) + 1, tool, args, [])
                entry: dict = {"tool": tool, "args": args, "n": obs.n}
                if tool == "search_knowledge":
                    query = (args.get("query") or question).strip()
                    scope = [code for code in (resolve_park(name, parks) for name in args.get("parks") or []) if code] or parks
                    key = _sig({"knowledge": query, "parks": scope})
                    if key in seen:
                        entry["repeat"] = seen[key]
                        record["calls"].append(entry)
                        continue
                    docs, how = retrieve(query, scope, said=question)
                    obs.docs = docs
                    obs.lines = [f"《{doc.title}》{doc.text}" for doc in docs] or ["没找到相关的资料" if zh else "nothing relevant"]
                    entry.update(docs=[doc.id for doc in docs], **how)
                    seen[key] = obs.n
                else:
                    built, notes, error = build_request(tool, args, ctx)
                    if built is None:
                        obs.error = error
                        entry["error"] = error
                    else:
                        key = _sig(built)
                        if key in seen:
                            entry.update(request=built, repeat=seen[key])
                            record["calls"].append(entry)
                            continue
                        seen[key] = obs.n
                        obs.request = built
                        obs.lines = notes
                        entry["request"] = built
                        pending.append((obs, tool))
                observations.append(obs)
                record["calls"].append(entry)
            if pending:
                tool_start = time.monotonic()
                try:
                    results = tools.call([obs.request for obs, _ in pending])
                except Exception as error:  # node 出错、超时：这几条算没查成，模型看得到
                    results = []
                    record["tool_error"] = f"{type(error).__name__}: {str(error)[:120]}"
                record["tool_ms"] = round((time.monotonic() - tool_start) * 1000)
                for i, (obs, tool) in enumerate(pending):
                    if i >= len(results):
                        obs.error = "查询工具出错了" if zh else "lookup failed"
                        continue
                    obs.lines = [*obs.lines, *format_result(tool, obs.request, results[i], zh)]
                    if results[i].get("error"):
                        obs.error = "；".join(obs.lines)
            if not record["calls"] or all("repeat" in entry for entry in record["calls"]):
                # 什么都没查（全是重复的）：下一步只能回答，免得来回绕
                observations.append(Observation(len(observations) + 1, "note", {},
                                                 ["这几个都查过了，直接按上面的回答" if zh else "already looked up; answer from above"]))
            continue
        # 回答
        text = (data.get("answer") or "").strip()
        sources = [i for i in data.get("sources") or [] if isinstance(i, int)]
        problems = qa.unsupported(text, user)
        bad = [i for i in sources if i < 0 or i > len(observations)]
        leaked = TOOL_WORD.findall(text)
        record.update(found=data.get("found"), sources=sources, draft=text, unsupported=problems, leaked=leaked)
        trace.update(found=data.get("found"), sources=sources, unsupported=problems,
                     elapsed_ms=round((time.monotonic() - started) * 1000))
        if data.get("action") != "answer" or not text:
            return stop("no_answer")
        if problems or bad or leaked:
            return stop("unfaithful")
        if not data.get("found"):
            # 网站答不了（餐馆、签证、不存在的日期）：用模型这句老实话，不附出处
            trace["answer"] = "not_found"
            return text, trace
        labels = []
        for i in sources:
            if i == 0:
                labels.append("行程" if zh else "your itinerary")
                continue
            obs = observations[i - 1]
            if obs.tool == "search_knowledge":
                labels += [doc.title if zh else doc.names[-1] for doc in obs.docs]
            elif obs.tool in TOOL_LABEL:
                labels.append(("网站的" if zh else "the site's ") + TOOL_LABEL[obs.tool][0 if zh else 1])
        labels = list(dict.fromkeys(labels))
        if labels:
            text += f"\n（资料：{'、'.join(labels)}）" if zh else f"\n(Source: {', '.join(labels)})"
        trace["answer"] = "model"
        return text, trace
    return stop("max_steps")


def calls_of(trace: dict) -> list[dict]:
    """trace 里所有的查询（评测用）：[{tool, args, request?, docs?, error?}]"""
    return [call for step in trace.get("steps", []) for call in step.get("calls", [])]
