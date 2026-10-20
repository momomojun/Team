"""读 NPS 公告、提取临时关闭（计划书的 fast-changing data）。

公告是一段英文，不写是网站上的哪个景点、哪天重开。模型读一条公告，从这座公园的景点里选出关了的、读出起止日期，
代码再核对：
- evidence（证明关闭的原话）要真的在公告里，不在的不算关闭（模型不能凭空说关了）；
- 日期要是公告里写到的（“through Nov 19”可以算成 11 月 20 日重开），对不上的当没写；
- 景点只能从给它的名单里选。
没有模型时用规则（rules_extract，和网站 alert-match.ts 的 closedByAlerts 一样：关闭类公告的标题里写了景点全名或片区），
评测里拿它当对照。
"""
from __future__ import annotations

import datetime as dt
import json
import re
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from . import prompts
from .providers import Provider, ProviderError

CONTRACTS = Path(__file__).resolve().parents[1] / "contracts"
TYPES = ("full", "partial", "none")
SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["type", "closed", "from", "reopen", "evidence"],
    "properties": {
        "type": {"enum": list(TYPES)},
        "closed": {"type": "array", "maxItems": 20, "items": {"type": "integer", "minimum": 1, "maximum": 99}},
        "from": {"type": "string", "maxLength": 10},
        "reopen": {"type": "string", "maxLength": 10},
        "evidence": {"type": "string", "maxLength": 300},
    },
}
TEXT_LIMIT = 1800
MONTHS = {name: i for i, names in enumerate(
    [("jan", "january"), ("feb", "february"), ("mar", "march"), ("apr", "april"), ("may",), ("jun", "june"), ("jul", "july"),
     ("aug", "august"), ("sep", "sept", "september"), ("oct", "october"), ("nov", "november"), ("dec", "december")], 1)
    for name in names}


@dataclass
class Extraction:
    alert: str
    park: str
    type: str
    closed: list[str] = field(default_factory=list)
    start: str | None = None
    reopen: str | None = None
    evidence: str = ""
    trace: dict = field(default_factory=dict)


@lru_cache(maxsize=1)
def attractions() -> dict[str, list[dict]]:
    """公园代码 → 景点（contracts/attractions.json，npm run copilot:contracts 生成）"""
    by_park: dict[str, list[dict]] = {}
    for row in json.loads((CONTRACTS / "attractions.json").read_text(encoding="utf-8")):
        by_park.setdefault(row["park"], []).append(row)
    return by_park


def _squash(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def alert_text(alert: dict) -> str:
    return f"{alert['title']}\n{alert.get('description') or ''}"


def mentioned_dates(text: str, year: int) -> set[str]:
    """公告里写到的日期（October 20, 2026 / Oct. 20 / 10/20/2026 / 2026-10-20）；没写年份的按 year 和 year+1 都算"""
    found: set[str] = set()

    def add(y: int | None, m: int, d: int) -> None:
        for candidate in ([y] if y else [year, year + 1]):
            try:
                found.add(dt.date(candidate, m, d).isoformat())
            except ValueError:
                pass

    lower = text.lower()
    names = "|".join(sorted(MONTHS, key=len, reverse=True))
    for match in re.finditer(rf"\b({names})\.?\s+(\d{{1,2}})(?:st|nd|rd|th)?(?:\s*[-–]\s*(\d{{1,2}}))?(?:,?\s+(\d{{4}}))?", lower):
        y = int(match.group(4)) if match.group(4) else None
        add(y, MONTHS[match.group(1)], int(match.group(2)))
        if match.group(3):
            add(y, MONTHS[match.group(1)], int(match.group(3)))
    for match in re.finditer(r"\b(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?\b", lower):
        y = match.group(3)
        add(int(y) + (2000 if y and len(y) == 2 else 0) if y else None, int(match.group(1)), int(match.group(2)))
    for match in re.finditer(r"\b(\d{4})-(\d{2})-(\d{2})\b", lower):
        add(int(match.group(1)), int(match.group(2)), int(match.group(3)))
    return found


def _checked_date(value: str, dates: set[str], reopen: bool) -> str | None:
    """模型给的日期要是公告里写到的；重开日可以是写到的那天的第二天（closed through Nov 19 → 20 日重开）"""
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value or ""):
        return None
    if value in dates:
        return value
    if reopen:
        previous = (dt.date.fromisoformat(value) - dt.timedelta(days=1)).isoformat()
        if previous in dates:
            return value
    return None


def mentions(text: str, row: dict) -> bool:
    """公告里提到了这个景点：全名、名字里够特别的词（5 个字母以上、不是 trail、point 这类通用词），或者片区名"""
    words = _words(text)
    name = _words(row["nameEn"]).strip()
    name = name[4:] if name.startswith("the ") else name
    if f" {name} " in words:
        return True
    if any(f" {w} " in words for w in name.split() if len(w) >= 5 and w not in GENERIC):
        return True
    area = row["area"].replace("-", " ")
    return len(area) >= 4 and area not in GENERIC and f" {area} " in words


def build_user(alert: dict, candidates: list[dict], year: int) -> str:
    description = (alert.get("description") or "")[:TEXT_LIMIT]
    lines = [f"Park: {alert['park']} · Category: {alert.get('category', '')} · Year: {year}", f"Title: {alert['title']}",
             f"Text: {description}", "", "Attractions:"]
    lines += [f"{i}. {row['nameEn']} — area: {row['areaZh'] or row['area']}" for i, row in enumerate(candidates, 1)]
    return "\n".join(lines)


def extract(alert: dict, provider: Provider, reference: dt.date) -> Extraction:
    candidates = attractions().get(alert["park"], [])
    prompt = prompts.load("alerts")
    user = build_user(alert, candidates, reference.year)
    trace: dict = {"prompt": prompt.id}
    try:
        completion = provider.complete_json("alerts", prompt.text, user, SCHEMA)
    except ProviderError as error:
        trace["error"] = str(error)
        return Extraction(alert["id"], alert["park"], "none", trace=trace)
    data = completion.data
    trace.update(model=completion.model, latency_ms=completion.latency_ms, output=data, usage=completion.meta)
    kind = data.get("type") if data.get("type") in TYPES else "none"
    evidence = (data.get("evidence") or "").strip()
    text = alert_text(alert)
    # 证明关闭的原话要真的在公告里（大小写、空白不计），不然不算关闭
    grounded = bool(evidence) and _squash(evidence) in _squash(text)
    if kind != "none" and not grounded:
        trace["dropped"] = "evidence_not_in_alert"
        kind = "none"
    closed = []
    if kind == "full":
        for index in data.get("closed") or []:
            if not (isinstance(index, int) and 1 <= index <= len(candidates)):
                trace.setdefault("bad_index", []).append(index)
            elif mentions(text, candidates[index - 1]):
                closed.append(candidates[index - 1]["id"])
            else:
                # 公告里根本没提到这个景点（关的是名单里没有的 Biscuit Basin，模型选了旁边的老忠实泉）：不算
                trace.setdefault("not_mentioned", []).append(candidates[index - 1]["id"])
    dates = mentioned_dates(text, reference.year)
    start = _checked_date(data.get("from", ""), dates, reopen=False)
    reopen = _checked_date(data.get("reopen", ""), dates, reopen=True)
    for key, value, kept in (("from", data.get("from"), start), ("reopen", data.get("reopen"), reopen)):
        if value and not kept:
            trace.setdefault("dropped_dates", []).append({key: value})
    return Extraction(alert["id"], alert["park"], kind, list(dict.fromkeys(closed)), start, reopen, evidence if grounded else "", trace)


# ---------- 规则（网站 alert-match.ts 的 closedByAlerts，评测里的对照） ----------
GENERIC = set((
    "trail trails falls point points overlook overlooks valley canyon canyons lake lakes road roads river creek peak peaks "
    "mountain mountains mount national park parks area areas loop visitor center grove meadow meadows basin geyser geysers "
    "spring springs beach beaches view views vista drive scenic upper lower north south east west rim dome rock rocks arch "
    "arches island islands glacier glaciers ridge pass campground lodge village junction bridge highway route trailhead "
    "parking museum garden forest trees great grand little black white yellow golden crystal natural tunnel cove harbor "
    "sand dunes flats hills butte mesa gorge crater cave caves pools terrace terraces observation station church ranch "
    "historic district visitors entrance summit plateau shore wilderness"
).split())
PARTIAL = re.compile(r"\b(overnight|parts?|partial|partially|delays?|restrictions?|limited|nightly|lane)\b", re.I)


def _words(text: str) -> str:
    return " " + re.sub(r"[^a-z]+", " ", text.lower()).strip() + " "


def rules_extract(alert: dict) -> Extraction:
    """规则：关闭类公告、标题写着 closed、不是部分关闭的，标题里有景点全名或片区就算关了"""
    title = alert["title"]
    closure = alert.get("category") == "Park Closure"
    if not closure or not re.search(r"\bclos(ed|ure|ures|ing)\b", title, re.I):
        return Extraction(alert["id"], alert["park"], "none")
    if PARTIAL.search(title):
        return Extraction(alert["id"], alert["park"], "partial")
    words = _words(title)
    closed = []
    for row in attractions().get(alert["park"], []):
        name = _words(row["nameEn"]).strip()
        name = name[4:] if name.startswith("the ") else name
        area = row["area"].replace("-", " ")
        if f" {name} " in words or (len(area) >= 4 and area not in GENERIC and f" {area} " in words):
            closed.append(row["id"])
    return Extraction(alert["id"], alert["park"], "full", closed)


def combined(model: Extraction, rules: Extraction) -> Extraction:
    """模型和规则一起：任何一边说整段关了就算关，景点取两边的并集；日期、证据用模型的（规则读不出日期）。
    排行程时漏掉一个关了的地方（排进去了却去不了）比多删一个景点更糟，所以宁可多算"""
    kind = "full" if "full" in (model.type, rules.type) else model.type
    closed = list(dict.fromkeys(model.closed + rules.closed)) if kind == "full" else []
    found_by = [name for name, part in (("model", model), ("rules", rules)) if part.type == "full" and part.closed]
    # strict：规则也找到的（公告标题里写着）。行程引擎只把这些当关了不排，只有模型找到的照排、提醒（模型的景点精确率还不高）
    strict = list(rules.closed) if rules.type == "full" else []
    return Extraction(model.alert, model.park, kind, closed, model.start, model.reopen, model.evidence,
                      {**model.trace, "found_by": found_by, "strict": strict})


def closures_from(snapshot: dict, provider: Provider) -> dict:
    """一份公告快照 → 关闭清单（closures-latest.json，行程引擎的 LIVE_CLOSURES 读它，格式见 src/lib/copilot/live.ts）。
    用模型和规则一起（评测里漏得最少），每条记下是谁找到的"""
    reference = dt.date.fromisoformat(snapshot["fetched"])
    closures = []
    for alert in snapshot["alerts"]:
        result = combined(extract(alert, provider, reference), rules_extract(alert))
        if result.type == "full" and result.closed:
            closures.append({"alert": result.alert, "park": result.park, "attractions": result.closed, "from": result.start,
                             "reopen": result.reopen, "evidence": result.evidence, "found_by": result.trace.get("found_by", []),
                             "strict": result.trace.get("strict", []),
                             "title": alert["title"], "url": alert.get("url")})
    return {"fetched": snapshot["fetched"], "prompts": prompts.current(), "closures": closures}
