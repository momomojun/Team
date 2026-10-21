"""查询工具（计划书的 is_open、drive_time、search_attractions；10-21 仓库主人要的“单独的查询工具”）。

问答（qa.py）以前只能翻资料里的文字：“1 月 15 日 Tioga Road 开着吗”“从 Springdale 开到布莱斯多久”“锡安有哪些适合 6 岁孩子、
不用抽签的步道”这种要算的问题，资料里没有现成的一句话，答不上来。现在先按问题认出要查什么、问的是哪个地方哪一天，
调网站的查询工具（scripts/lookup.mjs → src/lib/copilot/lookup-tool.ts，和 plan_trip 一样不联网、结果确定），
把查到的结果和资料一起交给模型，让模型用大白话说出来；回答里的数字、时间还是要在给它的东西里出现过（qa.unsupported）。

认问题、认地方、认日期都是代码（正则 + 资料里的名字），不让模型决定，调用方（调度员已经判断这是一个问题）不用改提示词。
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import shutil
import subprocess
import time
from dataclasses import dataclass, field

from . import catalog
from .catalog import ROOT
from .dates import next_occurrence, parse_date_spans, relative_date
from .knowledge import _name_hit, index
from .text import normalize

OPEN_Q = re.compile(r"开没开|开着|开吗|开不开|开放吗|开门|开了吗|还开|能去吗|能不能去|可以去吗|去得了|通车|通了|封路|封了|关了|关门|关闭|"
                    r"\b(open|closed|accessible|plowed)\b", re.I)
DRIVE_Q = re.compile(r"多远|多久能到|要多久|多长时间|开车要?多|要开多|开多久|车程|几个小时|多少分钟|how far|how long.*(drive|take|get)|drive time|driving time", re.I)
SEARCH_Q = re.compile(r"有哪些|有什么|有没有.*(步道|景点|瀑布)|推荐|适合|哪几个|哪几条|找几个|which (trails?|hikes?|sights?)|recommend|suggest|suitable|good for", re.I)
KINDS = [
    (re.compile(r"步道|徒步|走路|爬山|hik|trail", re.I), "hike"),
    (re.compile(r"瀑布|waterfall", re.I), "waterfall"),
    (re.compile(r"观景|看景|viewpoint|overlook|lookout", re.I), "viewpoint"),
    (re.compile(r"游客中心|visitor center", re.I), "visitor"),
    (re.compile(r"景观道|自驾|drive", re.I), "drive"),
]
NO_PERMIT = re.compile(r"不用抽签|不抽签|不用预约|不要预约|不需要许可|不用许可|免预约|no permit|without (a )?permit|no reservation", re.I)
EASY = re.compile(r"简单|轻松|好走|不累|easy", re.I)
MILES = re.compile(r"(\d+(?:\.\d+)?)\s*(英里|mi(?:les?)?)\s*(以内|以下|之内)?", re.I)
KM = re.compile(r"(\d+(?:\.\d+)?)\s*(公里|千米|km)\s*(以内|以下|之内)?", re.I)
KID = re.compile(r"(\d{1,2})\s*岁|(\d{1,2})[- ]?(?:year|yr)s?[- ]?old", re.I)
DAY_N = re.compile(r"第\s*(\d{1,2})\s*天|day\s*(\d{1,2})", re.I)
AIRPORT_WORD = re.compile(r"机场|airport", re.I)


@dataclass
class Place:
    kind: str  # attraction / lodging / park / airport
    id: str
    name: str
    start: int


@dataclass
class Lookup:
    """一次查询：交给工具的请求、拿回的结果、给模型看的几行"""
    requests: list[dict] = field(default_factory=list)
    results: list[dict] = field(default_factory=list)
    lines: list[str] = field(default_factory=list)
    trace: dict = field(default_factory=dict)


def places_in(question: str, parks: list[str]) -> list[Place]:
    """问题里点了名的地方（景点、住处、公园、机场），按在原话里出现的先后；重叠的只留最长的名字。
    这次行程的公园里的优先，别的公园的也认（“从锡安开到布莱斯”）"""
    docs = index()[0]
    query = normalize(question).lower()
    found: list[tuple[int, int, int, Place]] = []
    for doc in docs:
        if doc.type not in ("attraction", "lodging", "park", "airport"):
            continue
        for name in doc.names:
            if not _name_hit(name, query):
                continue
            needle = normalize(name).lower()
            start = query.find(needle)
            if start < 0:
                continue
            kind = doc.type
            ident = doc.id.split(":", 1)[1] if ":" in doc.id and kind in ("park", "airport") else doc.id
            # 同样长的名字，这次行程里的公园的优先
            rank = 0 if doc.park in parks or ident in parks else 1
            found.append((start, -len(needle), rank, Place(kind, ident, name, start)))
    found.sort(key=lambda item: (item[0], item[1], item[2]))
    out: list[Place] = []
    taken: list[tuple[int, int]] = []
    for start, negative, _, place in sorted(found, key=lambda item: (item[1], item[2], item[0])):
        end = start - negative
        if any(start < b and end > a for a, b in taken):
            continue
        taken.append((start, end))
        out.append(place)
    return sorted(out, key=lambda place: place.start)


def trip_dates(result: dict | None) -> list[str]:
    return [day["date"] for day in (result or {}).get("days", []) if day.get("date")]


def date_in(question: str, reference: dt.date, result: dict | None, stop_id: str | None = None) -> tuple[str | None, str]:
    """问的是哪一天：原话里的日期（“1月15号”“下周六”）→ 原话说“第 3 天” → 这个景点排在行程的哪天 → 行程的第一天。
    返回（日期, 怎么来的）；只说了月份的按那个月 15 号"""
    text = normalize(question)
    rel = relative_date(text, reference)
    if rel:
        return rel[0].isoformat(), f"原话“{rel[1]}”"
    parts, _ = parse_date_spans([text])
    for part in parts:
        if part.month:
            year = part.resolved_year(reference)
            if part.day:
                date = dt.date(year, part.month, part.day) if year else next_occurrence(part.month, part.day, reference)
                if date:
                    return date.isoformat(), "原话里的日期"
            else:
                year = year or (reference.year if part.month >= reference.month else reference.year + 1)
                return dt.date(year, part.month, 15).isoformat(), f"只说了 {part.month} 月，按 15 号算"
    days = (result or {}).get("days", [])
    match = DAY_N.search(text)
    if match and days:
        n = int(match.group(1) or match.group(2))
        if 1 <= n <= len(days) and days[n - 1].get("date"):
            return days[n - 1]["date"], f"行程第 {n} 天"
    if stop_id:
        for day in days:
            if any(stop.get("id") == stop_id for stop in day.get("stops", [])) and day.get("date"):
                return day["date"], f"行程里排在第 {day['day']} 天"
    dates = trip_dates(result)
    if dates:
        return dates[0], "行程的第一天"
    return None, ""


def party_in(question: str, request: dict | None) -> dict:
    party = dict((request or {}).get("party") or {})
    text = normalize(question)
    if (match := KID.search(text)) and re.search(r"孩|娃|儿子|女儿|宝宝|小朋友|kid|child|son|daughter", text, re.I):
        party["youngestKid"] = int(match.group(1) or match.group(2))
    if re.search(r"老人|爸妈|父母|长辈|senior|elderly|parents", text, re.I):
        party["seniors"] = True
    if re.search(r"轮椅|wheelchair", text, re.I):
        party["wheelchair"] = True
    if re.search(r"婴儿车|推车|stroller", text, re.I):
        party["stroller"] = True
    return party


def plan_requests(question: str, parks: list[str], request: dict | None, result: dict | None, reference: dt.date) -> tuple[list[dict], dict]:
    """原话 → 要交给工具的请求（可能好几个：一句话问了两个景点开没开）；trace 写为什么这么查"""
    text = normalize(question)
    places = places_in(question, parks)
    trace: dict = {"places": [f"{p.kind}:{p.id}" for p in places]}
    out: list[dict] = []
    if DRIVE_Q.search(text):
        ends = [p for p in places if p.kind in ("attraction", "lodging", "park", "airport")]
        if len(ends) == 1 and AIRPORT_WORD.search(text) and (request or {}).get("origin", {}).get("airport"):
            # “从机场到 XX 多远”：机场按这次行程的出发机场
            ends = [Place("airport", request["origin"]["airport"], "", -1), *ends]
        if len(ends) == 1:
            only = ends[0]
            park = only.id.split("-")[0] if only.kind in ("attraction", "lodging") else None
            # 只点了一个住处（“El Portal 离园区多远”）不查：住处的资料里写着到山谷多远、到几个景点开多久，
            # 工具按公园定位点算出来的数（31 分钟）和资料写的（约 20 分钟）对不上，两个都给反而让人糊涂
            if only.kind == "attraction" and result:
                # 景点：从这次行程里住在这座公园附近的那一晚出发
                nights = [day.get("lodging") for day in result.get("days", []) if (day.get("lodging") or {}).get("id", "").startswith(f"{park}-")]
                if nights:
                    ends = [Place("lodging", nights[0]["id"], nights[0].get("nameZh", ""), -1), only]
        if len(ends) >= 2:
            out.append({"tool": "drive_time", "from": ends[0].id, "to": ends[1].id})
            trace["why"] = "drive_time"
            return out, trace
    if OPEN_Q.search(text):
        stops = [p for p in places if p.kind == "attraction"]
        if stops:
            for place in stops[:3]:
                date, how = date_in(question, reference, result, place.id)
                if date:
                    out.append({"tool": "is_open", "attraction": place.id, "date": date, "text": question, "_how": how})
        else:
            date, how = date_in(question, reference, result)
            if date:
                # 没点景点名：可能问的是山路本身（“Tioga Road 1 月开吗”），交给工具按路名认
                out.append({"tool": "is_open", "text": question, "date": date, "_how": how})
        if out:
            trace["why"] = "is_open"
            return out, trace
    if SEARCH_Q.search(text):
        scope = [p.id for p in places if p.kind == "park"] or [code for code, _ in catalog.find_all(question, catalog.parks())] or parks
        if not scope:
            return out, trace
        kinds = [kind for pattern, kind in KINDS if pattern.search(text)]
        search: dict = {"tool": "search", "parks": scope[:3], "limit": 8}
        if kinds:
            search["kinds"] = kinds
        if NO_PERMIT.search(text):
            search["noPermit"] = True
        if EASY.search(text):
            search["difficulty"] = ["easy"]
        if match := MILES.search(text):
            search["maxMiles"] = float(match.group(1))
        elif match := KM.search(text):
            search["maxMiles"] = round(float(match.group(1)) / 1.609, 1)
        party = party_in(question, request)
        if party:
            search["party"] = party
        dates = trip_dates(result)
        if dates:
            search["date"] = dates[0]
        out.append(search)
        trace["why"] = "search"
    return out, trace


def call(requests: list[dict]) -> list[dict]:
    """调网站的查询工具（命令行，不联网）；出错返回空"""
    node = shutil.which("node")
    if not node or not requests:
        return []
    clean = [{k: v for k, v in r.items() if not k.startswith("_")} for r in requests]
    completed = subprocess.run(
        [node, "--disable-warning=ExperimentalWarning", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
         "--import", "./tests/register.mjs", "scripts/lookup.mjs", "-"],
        input=json.dumps(clean, ensure_ascii=False).encode("utf-8"), cwd=ROOT, capture_output=True, env={**os.environ}, timeout=60,
    )
    if completed.returncode != 0:
        return []
    return json.loads(completed.stdout.decode("utf-8"))


def minutes_text(minutes: int, zh: bool) -> str:
    hours, rest = divmod(int(minutes), 60)
    if zh:
        return (f"{hours} 小时" if hours else "") + (f" {rest} 分钟" if rest and hours else f"{rest} 分钟" if rest else "")
    return (f"{hours} h" if hours else "") + (f" {rest} min" if rest else "")


VERDICT_ZH = {"open": "能去", "closed": "去不了", "unlikely": "多半去不了（按往年估）", "maybe": "说不准"}
VERDICT_EN = {"open": "open", "closed": "closed or not reachable", "unlikely": "probably not open yet (based on past years)", "maybe": "uncertain"}


def format_lines(requests: list[dict], results: list[dict], zh: bool) -> list[str]:
    lines: list[str] = []
    for request, result in zip(requests, results):
        if result.get("error"):
            continue
        if result["tool"] == "is_open":
            target = result.get("attraction") or result.get("road")
            name = target["nameZh"] if zh else target["nameEn"]
            how = request.get("_how", "")
            head = (f"- {name} {result['date']}（{how}）：{VERDICT_ZH[result['verdict']]}" if zh else
                    f"- {name} on {result['date']}: {VERDICT_EN[result['verdict']]}")
            facts = [fact["zh"] if zh else fact["en"] for fact in result.get("facts", [])]
            lines.append(head + ("。依据：" + "；".join(facts) if zh and facts else (". " + " ".join(facts) if facts else "")))
        elif result["tool"] == "drive_time":
            a = result["from"]["nameZh" if zh else "nameEn"]
            b = result["to"]["nameZh" if zh else "nameEn"]
            if result.get("minutes") is None:
                lines.append(f"- {a} 到 {b}：两地之间不通公路（要坐飞机或船）" if zh else f"- {a} to {b}: no road connection")
            else:
                text = minutes_text(result["minutes"], zh)
                lines.append(f"- {a} 到 {b}：开车约 {text}（车程表按 OSRM 路网算的，不含堵车、找车位）" if zh else
                             f"- {a} to {b}: about {text} by car (from the precomputed OSRM table; no traffic or parking)")
        elif result["tool"] == "search":
            items = []
            for hit in result.get("results", []):
                bits = []
                if hit.get("hike") and hit["hike"].get("miles") is not None:
                    miles = hit["hike"]["miles"]
                    bits.append(f"来回约 {round(miles * 1.609, 1)} 公里" if zh else f"{miles} mi round trip")
                if hit.get("hike"):
                    bits.append({"easy": "简单", "moderate": "中等", "hard": "难"}[hit["hike"]["difficulty"]] if zh else hit["hike"]["difficulty"])
                if hit.get("permit"):
                    bits.append(("要抽签" if hit["permit"] == "lottery" else "要预约") if zh else ("lottery permit" if hit["permit"] == "lottery" else "reservation"))
                if hit.get("caution"):
                    bits.append("同行的人要注意" if zh else "use caution for your group")
                name = hit["nameZh"] if zh else hit["nameEn"]
                items.append(f"{name}（{'，'.join(bits)}）" if bits and zh else f"{name} ({', '.join(bits)})" if bits else name)
            total = result.get("total", 0)
            lines.append((f"- 按条件找到 {total} 个，按必去和热度排的前 {len(items)} 个：" + "；".join(items)) if zh else
                         (f"- {total} matches; top {len(items)}: " + "; ".join(items)))
    return lines


def lookup(question: str, parks: list[str], request: dict | None, result: dict | None, reference: str, zh: bool) -> Lookup:
    """问题要不要、要怎么查工具；查到了返回给模型看的几行（不用查就是空的）"""
    start = time.perf_counter()
    requests, trace = plan_requests(question, parks, request, result, dt.date.fromisoformat(reference))
    out = Lookup(requests=requests, trace=trace)
    if not requests:
        return out
    try:
        out.results = call(requests)
    except (OSError, subprocess.SubprocessError, json.JSONDecodeError) as error:
        trace["error"] = str(error)[:200]
        return out
    out.lines = format_lines(requests, out.results, zh)
    trace.update(requests=[{k: v for k, v in r.items() if k != "text"} for r in requests], results=len(out.results),
                 lines=len(out.lines), latency_ms=round((time.perf_counter() - start) * 1000))
    return out
