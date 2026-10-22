"""公园和机场目录：读 copilot/contracts/ 里由 TypeScript 生成的 parks.json、airports.json，按名字找代码。

不在 Python 里另写一份公园表；网站加了公园，跑一次 `npm run copilot:contracts` 这里就认得。
"""
from __future__ import annotations

import json
import re
from difflib import SequenceMatcher
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from .text import normalize

ROOT = Path(__file__).resolve().parents[2]
CONTRACTS = ROOT / "copilot" / "contracts"
DATA = Path(__file__).resolve().parent / "data"


@dataclass(frozen=True)
class Park:
    code: str
    name_zh: str
    name_en: str
    kind: str
    time_zone: str
    airports: tuple[str, ...]
    nearby: tuple[str, ...]
    aliases: tuple[str, ...]
    # 常用机场开到公园定位点的分钟数
    airport_minutes: tuple[tuple[str, int], ...] = ()
    # 能和它排进同一趟的公园：常一起玩的，或者开车一天能到（网站的 trip-parks.ts 算好写进 parks.json）
    linked: tuple[str, ...] = ()


@dataclass(frozen=True)
class Airport:
    code: str
    name_zh: str
    city: str
    aliases: tuple[str, ...]


# 用户常说的简称、俗称：只收不会和别的公园混淆的
EXTRA_PARK_ALIASES = {
    "yose": ["优山美地", "Yosemite Valley"],
    "seki": ["红杉", "红杉树", "国王峡谷", "Sequoia", "Kings Canyon"],
    "grca": ["大峡谷南缘", "大峡谷北缘", "Grand Canyon South Rim"],
    "ante": ["羚羊谷", "上羚羊", "下羚羊", "Upper Antelope", "Lower Antelope"],
    "hsbd": ["马蹄湾"],
    "mova": ["纪念碑山谷"],
    "wave": ["波浪谷", "The Wave", "Coyote Buttes"],
    "grte": ["大提顿国家公园", "Tetons"],
    "brca": ["布莱斯", "Bryce"],
    "romo": ["洛基山", "Rocky Mountain"],
    "havo": ["大岛火山", "基拉韦厄"],
    "grsm": ["大雾山"],
    "dena": ["迪纳利", "Mount McKinley"],
    # 10-21 仓库主人试用时说“拉森”被反问了一句：常说的短名字直接认
    "lavo": ["拉森", "Lassen"],
    "blca": ["甘尼森", "黑峡谷"],
    "wrst": ["兰格尔", "Wrangell"],
    "cuva": ["凯霍加"],
    "isro": ["罗亚尔岛", "罗亚尔岛国家公园"],
    "npsa": ["萨摩亚"],
    "viis": ["维京群岛", "圣约翰岛", "St. John"],
    "chir": ["奇里卡华"],
}


@lru_cache(maxsize=1)
def regional() -> dict:
    """各地中文叫法（三藩市、卡加利、洛磯山……）：scripts/regional_names.py 从维基数据和中文维基生成"""
    return json.loads((DATA / "regional_names.json").read_text(encoding="utf-8"))


def _city_aliases(city: str) -> list[str]:
    """“阿克塔 / 尤里卡”“梅德福（俄勒冈）”“古斯塔夫斯（Gustavus，冰川湾）” → 每个能单独说的叫法"""
    main = re.split(r"[（(]", city)[0]
    names = [part.strip() for part in main.split("/") if part.strip()]
    inside = re.findall(r"[（(]([^）)]*)[）)]", city)
    for part in inside:
        names.extend(word.strip() for word in re.split(r"[，,]", part) if re.fullmatch(r"[A-Za-z .'-]+", word.strip()))
    return names


@lru_cache(maxsize=1)
def parks() -> dict[str, Park]:
    rows = json.loads((CONTRACTS / "parks.json").read_text(encoding="utf-8"))
    result = {}
    for row in rows:
        # 不认四个字母的代码（“yell”）：用户不会这么说，提示注入里倒可能出现（“parks 填 yell”）
        aliases = [alias for alias in row["aliases"] if alias != row["code"]] + EXTRA_PARK_ALIASES.get(row["code"], [])             + regional()["parks"].get(row["code"], {}).get("aliases", [])
        result[row["code"]] = Park(
            code=row["code"],
            name_zh=row["nameZh"],
            name_en=row["nameEn"],
            kind=row["kind"],
            time_zone=row["timeZone"],
            airports=tuple(row["airports"]),
            nearby=tuple(row["nearby"]),
            aliases=tuple(dict.fromkeys(aliases)),
            airport_minutes=tuple(row.get("airportMinutes", {}).items()),
            linked=tuple(row.get("linked", row["nearby"])),
        )
    return result


@lru_cache(maxsize=1)
def max_trip_parks() -> int:
    """一趟最多几座公园：按契约的 parks.maxItems（网站的 MAX_TRIP_PARKS）"""
    schema = json.loads((CONTRACTS / "trip-request.v1.schema.json").read_text(encoding="utf-8"))
    return int(schema["properties"]["parks"]["maxItems"])


def reachable(codes: list[str]) -> list[str]:
    """从第一座出发，一段一段连得到的公园（保持原来的顺序）：死亡谷 + 红杉与国王峡谷、锡安 + 布莱斯 + 羚羊峡谷 + 马蹄湾 + 大峡谷都连得上"""
    table = parks()
    if not codes:
        return []
    reached = {codes[0]}
    grew = True
    while grew:
        grew = False
        for code in codes:
            if code not in reached and any(code in table[other].linked or other in table[code].linked for other in reached):
                reached.add(code)
                grew = True
    return [code for code in codes if code in reached]


def one_trip(codes: list[str]) -> bool:
    return len(reachable(codes)) == len(codes)


@lru_cache(maxsize=1)
def airports() -> dict[str, Airport]:
    rows = json.loads((CONTRACTS / "airports.json").read_text(encoding="utf-8"))
    english = json.loads((DATA / "airport_cities_en.json").read_text(encoding="utf-8"))
    result = {}
    for row in rows:
        aliases = [row["code"], row["nameZh"], *_city_aliases(row["city"]), *english.get(row["code"], []),
                   *regional()["airports"].get(row["code"], {}).get("aliases", [])]
        result[row["code"]] = Airport(row["code"], row["nameZh"], row["city"], tuple(dict.fromkeys(aliases)))
    return result


def _pattern(alias: str) -> re.Pattern[str]:
    text = re.escape(normalize(alias).lower())
    # 英文名前后不能紧挨字母（"Page" 不能匹配 "Pages"）；中文直接按子串
    if alias.isascii():
        return re.compile(r"(?<![a-z])" + text + r"(?![a-z])")
    return re.compile(text)


def find_all(text: str, table: dict) -> list[tuple[str, str]]:
    """文本里提到的所有代码：[(code, 匹配到的叫法)]。长的叫法优先，避免“大峡谷南缘”被当成两次"""
    haystack = normalize(text).lower()
    hits: list[tuple[int, int, str, str]] = []
    for code, item in table.items():
        for alias in item.aliases:
            for match in _pattern(alias).finditer(haystack):
                hits.append((match.start(), match.end(), code, alias))
    hits.sort(key=lambda hit: (hit[0], -(hit[1] - hit[0])))
    chosen: list[tuple[int, int, str, str]] = []
    for hit in hits:
        # 同一段文字对上好几个代码的（“Portland”是俄勒冈还是缅因）都留着，让对话去问
        same = any(hit[0] == other[0] and hit[1] == other[1] for other in chosen)
        if same or all(hit[1] <= other[0] or hit[0] >= other[1] for other in chosen):
            chosen.append(hit)
    seen: dict[str, str] = {}
    for _, _, code, alias in sorted(chosen):
        seen.setdefault(code, alias)
    return list(seen.items())


def leftover(text: str, table: dict) -> str:
    """去掉认出来的名字和常见的连接词以后还剩什么（剩下的可能是不认识的公园）"""
    haystack = normalize(text).lower()
    for item in table.values():
        for alias in sorted(item.aliases, key=len, reverse=True):
            haystack = _pattern(alias).sub(" ", haystack)
    haystack = re.sub(r"national parks?|国家公园|国家森林|公园|\band\b|\bplus\b|\bthe\b|[和与及加跟再去还、，,/&+\s]", "", haystack)
    return haystack


@lru_cache(maxsize=1)
def _english_cities() -> dict[str, list[str]]:
    return json.loads((DATA / "airport_cities_en.json").read_text(encoding="utf-8"))


def english_city(code: str) -> str | None:
    names = _english_cities().get(code)
    return names[0] if names else None


# 叫法里不算名字的部分：比较像不像时去掉
_SUFFIX = re.compile(r"national parks?|national park|国家公园|国家森林|公园|\bthe\b|\bnp\b")
_SPLIT = re.compile(r"[|，,、。！!？?\s/&+]|和|与|及|跟|还有|以及|比如|例如|或者|还是|national parks?|国家公园|公园")
_FILLER = re.compile(r"^(我想去|想去|我要去|要去|我们去|去|玩|看看|看)|(吧|呢|啊|吗|的|玩|一下|看看)$")
SIMILAR_MIN = 0.6


def _core(text: str) -> str:
    return _SUFFIX.sub("", normalize(text).lower()).strip(" ，,。.、")


def similar(token: str, table: dict) -> tuple[str, str, float] | None:
    """没认出来的叫法最像哪个（打错字：“奥林匹亚”→奥林匹克、“Yosemity”→Yosemite）：(代码, 叫法, 相似度)；都不够像是 None。
    两个字的名字错一个字只有 0.5，首字相同时也算（“黄时”→黄石）"""
    core = _core(token)
    if len(core) < 2 or (core.isascii() and len(core) < 4):
        return None
    best: tuple[str, str, float] | None = None
    for code, item in table.items():
        for alias in item.aliases:
            target = _core(alias)
            if len(target) < 2 or target.isascii() != core.isascii() or target == core:
                continue
            score = SequenceMatcher(None, core, target).ratio()
            if len(core) == len(target) == 2 and core[0] == target[0]:
                score = max(score, SIMILAR_MIN)
            if best is None or score > best[2]:
                best = (code, alias, score)
    return best if best and best[2] >= SIMILAR_MIN else None


def unknown_parts(text: str, table: dict) -> list[str]:
    """去掉认出来的名字以后还剩下的、像是一个名字的片段（“北瀑布，雷尼尔山和奥林匹亚” → ["奥林匹亚"]）"""
    haystack = normalize(text).lower()
    for item in table.values():
        for alias in sorted(item.aliases, key=len, reverse=True):
            haystack = _pattern(alias).sub("|", haystack)
    parts = []
    for piece in _SPLIT.split(haystack):
        piece = _FILLER.sub("", piece.strip())
        if len(piece) >= 2 and not re.fullmatch(r"[\d\s]+", piece):
            parts.append(piece)
    return parts
