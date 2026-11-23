"""多 agent 协作（11-21，COPILOT_TEAM=1 打开）：规划 agent + 行程引擎 + 审查 agent 来回商量，把用户的“软要求”做到。

原来的调度员只会“改条件、加减景点、指定住处”，用户说“中间留一天休息”“每天开车别超过 3 小时”“只住一家”，
表单上没有这些，引擎不知道，只能排满、在说明里一笔带过。现在：

1. 规划 agent（模型，prompts/team_plan_v*.txt）读这一趟用户说过的话，摘出软要求（wish），每条必须带原话片段
   （evidence），代码核对片段真在原话里、参数在允许的范围里（片区、山路只认目录里有的），不合格的丢掉；
2. 代码把 wish 翻成引擎的旋钮（TripRequest.prefs、include、exclude），同时翻成检查（和评测同一个判分脚本
   scripts/soft-check-lib.mjs）；
3. 引擎排一版，代码逐条检查；“只住一家”这种代码自己会修的先修（合并住处，挑整趟开车最少的那家）；
4. 还有没做到的，审查 agent（模型，prompts/team_review_v*.txt）看没做到的是哪几条、为什么（天数、分钟数是代码算的），
   从固定的几种动作里选（换轻松节奏、去掉或加回一个景点、合并住处、放弃这条），代码照做、重排、再查，最多 3 轮，
   只留检查结果更好的那一版；
5. 最后做没做到、为什么，由代码按检查的事实写成中英文的取舍说明（tradeoffs），不让模型自己编数字。

模型出错、Node 跑不了判分脚本，就退回只用第 1、2 步（照样把软要求交给引擎），不影响排行程。
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from dataclasses import dataclass, field
from functools import lru_cache

from . import catalog, knowledge, prompts
from .catalog import CONTRACTS, ROOT
from .providers import Provider, ProviderError
from .text import contains, normalize

MAX_ROUNDS = 3
HAZARDS = ("dropoff", "scramble", "thermal", "flashFlood", "water", "heat", "altitude", "wildlife", "remote", "motion")
SLOTS = ("sunrise", "sunset", "night")
KINDS = (
    "rest_days", "rest_day_on", "max_drive_per_day", "max_lodgings", "depart_not_before", "no_consecutive_early", "return_by",
    "day_return_by", "park_days", "max_stops_per_day", "day_max_stops", "has_slot", "slot_each_day", "include", "exclude",
    "exclude_area", "max_areas_per_day", "day_single_area", "hikes_per_day", "max_hike_min", "max_stop_minutes", "no_hazards",
    "no_shuttle_stops", "road_day",
)
CLOCK = re.compile(r"([01]\d|2[0-3]):[0-5]\d")

# 每种软要求的原话里要有说到这件事的词（规范化成简体、小写以后比）。片段在原话里只证明用户说过这句，不证明说的是这件事：
# 11-22 默认打开以后，4B 把“节奏适中”“balanced pace”读成中间休息一天、每天开车不超过 1 小时，“我想住 airbnb”读成只住一家，
# 问句“塔夫特点值得去吗？”读成一定要去；没有软要求的普通对话（conversation-v1、v2）因此变差 4 组
_REST = r"休息|歇|什么都不|不安排|空出|空着|自由活动|放空|\brest|days? off|\bfree\b|\brelax\b|nothing|\bbreak\b|lazy|chill"
_STOPS = r"地方|站|景点|个点|stops?|places|sights|spots|attractions|things"
_WHEN = r"\d|点|钟|早|晚|中午|下午|上午|天黑|am\b|pm\b|a\.m|p\.m|noon|morning|afternoon|evening|night|dark"
_SLOT = r"日出|日落|夕阳|晚霞|星|夜|银河|sunrise|sunset|star|night|milky|dark sk"
_NOT = r"不去|不要|不想|别去|别安排|去掉|跳过|删|算了不|不用|不必|不需要|no need|skip|don'?t|do not|not |avoid|drop|remove|without|\bno\b|cut"
CUES = {
    "rest_days": _REST, "rest_day_on": _REST,
    "max_drive_per_day": r"开车|车程|驾车|开.{0,4}(小时|钟头|分钟)|在车上|路上|drive|driving|behind the wheel|in the car|on the road",
    "max_lodgings": r"[一两二三四\d]家|换来换去|不想?换|别换|少换|同一(家|个)|一个(酒店|住处|地方)|only one|one (hotel|place|lodg)|same (hotel|place|lodg)|"
                    r"change hotels|hotel change|switch hotels|move hotels|moving hotels|unpack|one base",
    "depart_not_before": r"出门|出发|起床|睡懒觉|起不来|别.{0,3}早|leave|leaving|start|head out|get going|sleep in|morning person",
    "no_consecutive_early": r"早起|早出|起早|early",
    "return_by": r"回|到酒店|到住|收工|back|return|done|finish|wrap up",
    "day_return_by": r"回|到|赶|飞机|航班|机场|back|airport|flight|return",
    "park_days": r"[前后头第]\s*[一两二三四五六七八九十\d]+\s*[天日晚]|最后.{0,3}[天日]|\bdays?\b|first|last|then",
    "max_stops_per_day": _STOPS, "day_max_stops": _STOPS,
    "has_slot": _SLOT, "slot_each_day": _SLOT,
    "include": r"一定|必须|要去|想去|也去|还去|还是去|加上|加个|加一|换成|别漏|不能错过|must|definitely|want to|wanna|add|include|have to|need to|can'?t miss|don'?t miss|really",
    "exclude": _NOT, "exclude_area": _NOT,
    "max_areas_per_day": r"片|区|一带|一处|一个地方|待在|area|region|section|part|separate|one place|cover|spread|zone",
    "day_single_area": r"片|区|一带|一处|一个地方|待在|area|region|section|part|separate|one place|cover|spread|zone",
    "hikes_per_day": r"徒步|步道|爬山|走.{0,2}路|hike|hiking|trail|walk",
    "max_hike_min": r"(徒步|步道|爬山|走|hike|hiking|trail|walk).*(小时|分钟|钟头|短|长|累|hour|min|short|long|easy)|"
                    r"(小时|分钟|钟头|短|长|hour|min|short|long|easy).*(徒步|步道|爬山|hike|hiking|trail|walk)",
    "max_stop_minutes": r"小时|分钟|钟头|多久|太久|hour|min|long",
    "no_hazards": r"危险|悬崖|陡|安全|吓人|恐高|地热|边上|dangerous|danger|cliff|drop-?off|safe|scary|risky|exposure|heights|hazard|steep|thermal|edge",
    "no_shuttle_stops": r"班车|摆渡|巴士|大巴|接驳|shuttle|bus",
    "road_day": r"路|大道|公路|山口|road|drive|highway|pass|parkway",
}
# 问句不是要求（“塔夫特点值得去吗？”）
QUESTION = re.compile(r"[？?]\s*$|吗\s*$|值得去|怎么样|worth (it|going|a visit)")


def _says(kind: str, evidence: str) -> bool:
    text = normalize(evidence).lower()
    if kind in ("include", "exclude", "exclude_area") and QUESTION.search(text):
        return False
    if kind == "include" and re.search(_NOT, text):
        return False
    if kind == "exclude" and re.search(r"还是去|还去|也去|加上", text):
        return False
    return bool(re.search(CUES[kind], text))


# 输出格式尽量简单：Gemini 嫌可选字段多、又带长度和范围限制的 schema 太复杂（400，too many states），
# 参数的范围、片区和山路在不在目录里，都由 compile_wishes 逐条核对
PLAN_SCHEMA = {
    "type": "object", "required": ["wishes"],
    "properties": {"wishes": {"type": "array", "items": {
        "type": "object", "required": ["kind", "evidence"],
        "properties": {
            "kind": {"type": "string", "enum": list(KINDS)},
            "evidence": {"type": "string"},
            "min": {"type": "integer"},
            "middle": {"type": "boolean"},
            "day": {"type": "integer"},
            "last": {"type": "boolean"},
            "days": {"type": "array", "items": {"type": "integer"}},
            "minutes": {"type": "integer"},
            "count": {"type": "integer"},
            "time": {"type": "string"},
            "park": {"type": "string"},
            "area": {"type": "string"},
            "road": {"type": "string"},
            "slot": {"type": "string"},
            "places": {"type": "array", "items": {"type": "string"}},
            "hazards": {"type": "array", "items": {"type": "string"}},
        },
    }}},
}
ACTIONS = ("relax_pace", "drop_stop", "add_stop", "one_lodging", "give_up")
REVIEW_SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["actions"],
    "properties": {
        "actions": {"type": "array", "maxItems": 3, "items": {
            "type": "object", "additionalProperties": False, "required": ["type"],
            "properties": {
                "type": {"enum": list(ACTIONS)},
                "id": {"type": "string", "maxLength": 80},
                "count": {"type": "integer", "minimum": 1, "maximum": 6},
                "wish": {"type": "integer", "minimum": 1, "maximum": 8},
            },
        }},
        "reason": {"type": "string", "maxLength": 300},
    },
}
SLOWER = {"packed": "normal", "normal": "relaxed", "relaxed": "leisurely"}


def enabled() -> bool:
    return os.environ.get("COPILOT_TEAM", "1") != "0"


class TeamError(RuntimeError):
    pass


@dataclass
class Wish:
    kind: str
    params: dict
    evidence: str

    def check(self) -> dict:
        """这条 wish 对应的检查（判分脚本的参数）"""
        return {"kind": self.kind, **self.params}


@dataclass
class Plan:
    """规划 agent 读出来、代码核对过的软要求，和翻成的引擎参数"""
    wishes: list[Wish] = field(default_factory=list)
    prefs: dict = field(default_factory=dict)
    include: list[str] = field(default_factory=list)
    exclude: list[str] = field(default_factory=list)
    # 用户点了名、资料里找不到的地方（“大峡谷北缘”）：照实说没收录
    unknown: list[str] = field(default_factory=list)
    trace: dict = field(default_factory=dict)


# ---------- 目录：每座公园的片区、季节性山路、景点名字 ----------
@lru_cache(maxsize=1)
def _attractions() -> dict[str, dict]:
    return {row["id"]: row for row in json.loads((CONTRACTS / "attractions.json").read_text(encoding="utf-8"))}


@lru_cache(maxsize=1)
def _park_rows() -> dict[str, dict]:
    return {row["code"]: row for row in json.loads((CONTRACTS / "parks.json").read_text(encoding="utf-8"))}


def areas(parks: list[str]) -> dict[str, str]:
    """"公园/片区" → 中文名"""
    found: dict[str, str] = {}
    for row in _attractions().values():
        if row["park"] in parks and row.get("area"):
            found.setdefault(f"{row['park']}/{row['area']}", row.get("areaZh") or row["area"])
    return found


def roads(parks: list[str]) -> dict[str, dict]:
    return {road["id"]: road for code in parks for road in _park_rows().get(code, {}).get("roads", [])}


def stop_name(stop_id: str, zh: bool) -> str:
    row = _attractions().get(stop_id)
    return (row["nameZh"] if zh else row["nameEn"]) if row else stop_id


# ---------- 第 1 步：规划 agent ----------
def context_text(messages: list[str], request: dict) -> str:
    table = catalog.parks()
    parks = request.get("parks") or []
    lines = ["这一趟用户说过的话："] + [f"- {message}" for message in messages]
    lines.append("")
    lines.append("已经读好的条件：公园 " + "、".join(f"{table[c].name_zh}（{c}）" if c in table else c for c in parks)
                 + f"；出发 {request.get('startDate') or str(request.get('month')) + ' 月'}；玩 {request.get('days')} 天")
    lines.append("可选的片区：" + ("；".join(f"{key}（{name}）" for key, name in areas(parks).items()) or "没有"))
    lines.append("可选的山路：" + ("；".join(f"{road['id']}（{road['nameZh']} / {road['nameEn']}）" for road in roads(parks).values()) or "没有"))
    return "\n".join(lines)


def understand(provider: Provider, messages: list[str], request: dict) -> Plan:
    """规划 agent 摘软要求，代码核对、翻成引擎参数；模型出错时返回空的 Plan（照常排）"""
    prompt = prompts.load("team_plan")
    trace: dict = {"prompt": prompt.id}
    try:
        completion = provider.complete_json("team_plan", prompt.text, context_text(messages, request), PLAN_SCHEMA)
    except ProviderError as error:
        trace["error"] = str(error)
        return Plan(trace=trace)
    trace.update(model=completion.model, latency_ms=completion.latency_ms, output=completion.data)
    raw = completion.data.get("wishes", []) if isinstance(completion.data, dict) else []
    plan = compile_wishes(raw if isinstance(raw, list) else [], messages, request)
    plan.trace = {**trace, **plan.trace}
    return plan


INT_KEYS = ("min", "day", "minutes", "count")
STR_KEYS = ("evidence", "time", "park", "area", "road", "slot", "kind")


def _clean(item: dict) -> dict:
    """模型给的参数先按类型过一遍：数字要是整数（不是 true/false），文字要是字符串，列表里只留对的类型"""
    out = {key: item[key] for key in INT_KEYS if isinstance(item.get(key), int) and not isinstance(item.get(key), bool)}
    out.update({key: item[key] for key in STR_KEYS if isinstance(item.get(key), str)})
    out.update({key: item[key] for key in ("middle", "last") if isinstance(item.get(key), bool)})
    if isinstance(item.get("days"), list):
        out["days"] = [d for d in item["days"] if isinstance(d, int) and not isinstance(d, bool)]
    for key in ("places", "hazards"):
        if isinstance(item.get(key), list):
            out[key] = [v for v in item[key] if isinstance(v, str)]
    return out


_NUM = r"\d+|[一两二三四五六七八九十]+"
_CN = {"一": 1, "两": 2, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}
_EN_NUM = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}


def _number(text: str) -> int:
    if text.isdigit():
        return int(text)
    if text in _EN_NUM:
        return _EN_NUM[text]
    if "十" in text:  # 十、十二、二十
        head, _, tail = text.partition("十")
        return (_CN.get(head, 1) if head else 1) * 10 + (_CN.get(tail, 0) if tail else 0)
    return _CN.get(text, 0)


def days_said(evidence: str, park: str, total: int) -> list[int]:
    """park_days 的天数按原话算：模型常常只给公园、不给 days（11-22 四个模型全都漏了“前两天大提顿、后四天黄石”的 days）。
    原话按逗号、分号、and/then 切成几段，找写着这座公园的那一段，认“前 N 天 / 后 N 天 / 第 N 天 / 第 N 到 M 天 / 最后一天”
    和 first/last N days、day N、days N-M；认不出来就是空的（照旧丢掉这条）"""
    info = catalog.parks().get(park)
    if not info or total < 1:
        return []
    names = [n for n in (info.name_zh, info.name_en, *info.aliases) if n]
    names = sorted({normalize(n).lower() for n in names} | {normalize(info.name_en).lower().replace(" national park", "")}, key=len, reverse=True)
    clauses = re.split(r"[，,；;。.、]|\band\b|\bthen\b|然后|再", normalize(evidence).lower())
    clause = next((c for c in clauses if any(n and n in c for n in names)), "")
    if not clause:
        return []
    num = _NUM + r"|one|two|three|four|five|six|seven|eight|nine|ten"
    span = re.search(rf"第\s*({_NUM})\s*(?:到|至|-|–|~)\s*第?\s*({_NUM})\s*[天日]|days?\s*(\d+)\s*(?:-|–|to|through|and)\s*(\d+)", clause)
    if span:
        a, b = (_number(x) for x in (span.group(1) or span.group(3), span.group(2) or span.group(4)))
        days = list(range(a, b + 1))
    elif m := re.search(rf"(?:前|头)\s*({_NUM})\s*[天日]|first\s+({num})\s+days?", clause):
        days = list(range(1, _number(m.group(1) or m.group(2)) + 1))
    elif m := re.search(rf"(?:后|最后)\s*({_NUM})\s*[天日]|last\s+({num})\s+days?", clause):
        n = _number(m.group(1) or m.group(2))
        days = list(range(total - n + 1, total + 1))
    elif re.search(r"最后\s*[一1]?\s*[天日]|last day", clause):
        days = [total]
    elif m := re.search(rf"第\s*({_NUM})\s*[天日]|day\s*(\d+)", clause):
        days = [_number(m.group(1) or m.group(2))]
    else:
        return []
    return [d for d in days if 1 <= d <= total]


def compile_wishes(raw: list, messages: list[str], request: dict) -> Plan:
    """核对每条 wish（原话片段真在用户说过的话里、参数合法），翻成引擎的旋钮和检查"""
    said = "\n".join(messages)
    days = request.get("days") or 1
    parks = request.get("parks") or []
    area_ids, road_ids = areas(parks), roads(parks)
    plan = Plan()
    dropped = []
    prefs: dict = {}

    def drop(item, reason: str) -> None:
        dropped.append({"wish": item, "reason": reason})

    day_ok = lambda d: isinstance(d, int) and 1 <= d <= days  # noqa: E731
    for item in raw:
        item = _clean(item) if isinstance(item, dict) else item
        if not isinstance(item, dict) or item.get("kind") not in KINDS:
            drop(item, "invalid")
            continue
        kind, evidence = item["kind"], (item.get("evidence") or "").strip()
        if not contains(said, evidence):
            drop(item, "evidence_not_in_messages")
            continue
        if not _says(kind, evidence):
            drop(item, "evidence_not_about_kind")
            continue
        params: dict = {}
        time_ok = isinstance(item.get("time"), str) and CLOCK.fullmatch(item["time"])
        if kind == "rest_days":
            count = min(item.get("min") or 1, max(days - 2, 0))
            if count < 1:
                drop(item, "too_short")
                continue
            params = {"min": count, "middle": True}
            # 中间的几天：从正中间往两边挑
            middle = sorted(range(2, days), key=lambda d: (abs(d - (days + 1) / 2), d))[:count]
            prefs["restDays"] = sorted({*prefs.get("restDays", []), *middle})
        elif kind == "rest_day_on":
            if not day_ok(item.get("day")) or item["day"] in (1, days):
                drop(item, "bad_day")
                continue
            params = {"day": item["day"]}
            prefs["restDays"] = sorted({*prefs.get("restDays", []), item["day"]})
        elif kind in ("max_drive_per_day", "max_hike_min", "max_stop_minutes"):
            if not item.get("minutes") or item["minutes"] < 15:
                drop(item, "no_minutes")
                continue
            params = {"minutes": min(item["minutes"], 900)}
            key = {"max_drive_per_day": "maxDrivePerDay", "max_hike_min": "maxHikeMin", "max_stop_minutes": "maxStopMin"}[kind]
            prefs[key] = min(max(30, params["minutes"]), 720) if kind == "max_drive_per_day" else params["minutes"]
        elif kind == "max_lodgings":
            if not item.get("count") or item["count"] > 6:
                drop(item, "no_count")
                continue
            params = {"count": item["count"]}  # 引擎没有这个旋钮：排完由代码合并住处
        elif kind in ("depart_not_before", "return_by"):
            if not time_ok:
                drop(item, "bad_time")
                continue
            params = {"time": item["time"]}
            prefs["departNotBefore" if kind == "depart_not_before" else "returnBy"] = item["time"]
        elif kind == "no_consecutive_early":
            params = {"before": item["time"] if time_ok else "07:00"}  # 引擎没有旋钮：审查 agent 去掉一个早起的景点
        elif kind == "day_return_by":
            # “最后一天”按原话认：模型常把天数写错（11-22 gpt-oss 给 3 天的行程写 day 5），原话说的是最后一天就是最后一天
            said_last = re.search(r"最后\s*[一1]?\s*[天日]|走的那天|回去那天|离开那天|last day|final day|day we (fly|leave)|fly(ing)? (home|out)", normalize(evidence).lower())
            if not time_ok or not (item.get("last") or item.get("day") == days or said_last):
                drop(item, "only_last_day")
                continue
            params = {"day": "last", "time": item["time"]}
            prefs["lastDayBy"] = item["time"]
        elif kind == "park_days":
            chosen = [d for d in item.get("days") or [] if day_ok(d)] or days_said(evidence, item.get("park") or "", days)
            if item.get("park") not in parks or not chosen or len(parks) < 2:
                drop(item, "bad_park_days")
                continue
            params = {"park": item["park"], "days": sorted(set(chosen))}
            prefs.setdefault("parkDays", []).append({"park": item["park"], "days": params["days"]})
        elif kind == "max_stops_per_day":
            if not item.get("count") or item["count"] > 12:
                drop(item, "no_count")
                continue
            params = {"count": item["count"]}
            prefs["maxStopsPerDay"] = item["count"]
        elif kind == "day_max_stops":
            if not day_ok(item.get("day")) or item.get("count") is None or not 0 <= item["count"] <= 12:
                drop(item, "bad_day")
                continue
            params = {"day": item["day"], "count": item["count"]}
            prefs.setdefault("dayMaxStops", []).append(params)
        elif kind in ("has_slot", "slot_each_day"):
            if item.get("slot") not in SLOTS:
                drop(item, "no_slot")
                continue
            count = days if kind == "slot_each_day" else min(max(item.get("min") or 1, 1), days)
            params = {"slot": item["slot"]} if kind == "slot_each_day" else {"slot": item["slot"], "min": count}
            prefs.setdefault("minSlots", {})[item["slot"]] = max(count, prefs.get("minSlots", {}).get(item["slot"], 0))
        elif kind in ("include", "exclude"):
            ids = []
            for place in item.get("places") or []:
                if not contains(said, place):
                    continue
                doc = knowledge.resolve(place, parks, "attraction")
                if doc is None:
                    plan.unknown.append(place)
                else:
                    ids.append(doc.id)
            if not ids:
                drop(item, "places_not_found")
                continue
            params = {"ids": ids}
            (plan.include if kind == "include" else plan.exclude).extend(i for i in ids if i not in plan.include + plan.exclude)
        elif kind == "exclude_area":
            if item.get("area") not in area_ids:
                drop(item, "unknown_area")
                continue
            params = {"area": item["area"]}
            prefs.setdefault("excludeAreas", []).append(item["area"])
        elif kind == "max_areas_per_day":
            # 模型常把个数写进 min（11-22 4B）或者干脆不写：这条要求几乎都是“一天一个片区”，没写就按 1
            count = item.get("count") or item.get("min") or 1
            if count > 6:
                drop(item, "no_count")
                continue
            params = {"count": count}
            prefs["maxAreasPerDay"] = count
        elif kind == "day_single_area":
            if not day_ok(item.get("day")) or item.get("area") not in area_ids:
                drop(item, "bad_area")
                continue
            params = {"day": item["day"]}
            prefs.setdefault("dayAreas", []).append({"day": item["day"], "area": item["area"]})
        elif kind == "hikes_per_day":
            count = min(max(item.get("min") or 1, 1), 3)
            params = {"min": count}
            prefs["minHikes"] = count * days
        elif kind == "no_hazards":
            chosen = [h for h in item.get("hazards") or [] if h in HAZARDS]
            if not chosen:
                drop(item, "no_hazards")
                continue
            params = {"hazards": chosen}
            prefs["avoidHazards"] = sorted({*prefs.get("avoidHazards", []), *chosen})
        elif kind == "no_shuttle_stops":
            prefs["avoidShuttle"] = True
        elif kind == "road_day":
            if item.get("road") not in road_ids:
                drop(item, "unknown_road")
                continue
            params = {"road": item["road"]}
            prefs.setdefault("roads", []).append(item["road"])
        wish = Wish(kind, params, evidence)
        if any(existing.check() == wish.check() for existing in plan.wishes):
            continue
        plan.wishes.append(wish)
    plan.prefs = prefs
    plan.trace = {"wishes": [vars(w) for w in plan.wishes], "dropped": dropped, "prefs": prefs,
                  **({"unknown": plan.unknown} if plan.unknown else {})}
    return plan


def apply(plan: Plan, request: dict) -> dict:
    """把软要求放进请求：prefs 整个换掉（每轮按这一趟说过的话重新读），include、exclude 和用户自己加减的合在一起"""
    out = {key: value for key, value in request.items() if key != "prefs"}
    if plan.prefs:
        out["prefs"] = plan.prefs
    exclude = [*dict.fromkeys([*(out.get("exclude") or []), *(i for i in plan.exclude if i not in (out.get("include") or []))])]
    include = [*dict.fromkeys([*(out.get("include") or []), *(i for i in plan.include if i not in exclude)])]
    if include:
        out["include"] = include
    if exclude:
        out["exclude"] = exclude
    return out


# ---------- 判分（和评测同一个脚本） ----------
def grade(result: dict, checks: list[dict]) -> list[dict]:
    if not checks:
        return []
    node = shutil.which("node")
    if not node:
        raise TeamError("找不到 node，没法检查软要求")
    payload = json.dumps([{"id": "trip", "result": result, "checks": checks}], ensure_ascii=False)
    completed = subprocess.run(
        [node, "--disable-warning=ExperimentalWarning", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
         "--import", "./tests/register.mjs", "scripts/soft-check.mjs"],
        input=payload.encode("utf-8"), cwd=ROOT, capture_output=True, timeout=120,
    )
    if completed.returncode != 0:
        raise TeamError(completed.stderr.decode("utf-8", "replace")[-400:])
    return json.loads(completed.stdout.decode("utf-8"))[0]["checks"]


# ---------- 第 3、4 步：检查、修、审查 agent ----------
@dataclass
class Outcome:
    request: dict
    result: dict
    call: object
    status: list[dict]
    given_up: set[int] = field(default_factory=set)
    trace: dict = field(default_factory=dict)
    # 不按软要求排（平常的排法）会去、现在没去的景点：取舍说明里照实告诉用户
    lost: list[str] = field(default_factory=list)

    @property
    def missed(self) -> list[int]:
        return [i for i, item in enumerate(self.status) if not item["ok"]]


def _score(status: list[dict], result: dict, given_up: set[int]) -> tuple[int, int, int]:
    """越小越好：没做到、又没放弃的条数；没做到的总条数；有硬问题（太满、回去太晚）的天数"""
    missed = [i for i, item in enumerate(status) if not item["ok"]]
    busy = sum(1 for day in result.get("days", []) if day.get("warnings"))
    return (len([i for i in missed if i not in given_up]), len(missed), busy)


def one_lodging(request: dict, result: dict, count: int, plan_fn) -> tuple[dict, dict, object] | None:
    """住处合并成最多 count 家：只住一家时，排出来用过的住处挨个试“每晚都住这家”，挑整趟开车最少的；
    两家以上时，留住得最多的几家，其余的晚上换成前一晚（第一晚换成后一晚）留下的那家"""
    days = request.get("days") or 1
    nights = [(day.get("lodging") or {}).get("id") for day in result["days"][:-1]]
    if any(not night or night.startswith("custom") for night in nights) or len(set(nights)) <= count:
        return None
    if count == 1:
        best = None
        for candidate in dict.fromkeys(nights):
            trial = {**request, "lodging": [{"night": n, "id": candidate} for n in range(1, days)]}
            try:
                call = plan_fn(trial)
            except Exception:  # 这家住不了（不营业）就试下一家
                continue
            drive = sum(day["driveMin"] for day in call.result["days"])
            if best is None or drive < best[0]:
                best = (drive, trial, call)
        return (best[1], best[2].result, best[2]) if best else None
    keep = [lodging for lodging, _ in sorted(((n, nights.count(n)) for n in dict.fromkeys(nights)), key=lambda x: -x[1])[:count]]
    chosen = list(nights)
    for i, night in enumerate(chosen):
        if night not in keep:
            chosen[i] = next((chosen[j] for j in range(i - 1, -1, -1) if chosen[j] in keep), None) or next(n for n in nights[i:] if n in keep)
    trial = {**request, "lodging": [{"night": n + 1, "id": lodging} for n, lodging in enumerate(chosen)]}
    try:
        call = plan_fn(trial)
    except Exception:
        return None
    return trial, call.result, call


def review_text(wishes: list[Wish], status: list[dict], result: dict, given_up: set[int]) -> str:
    lines = ["用户的要求（编号、做到没有、原话）："]
    for i, (wish, item) in enumerate(zip(wishes, status), start=1):
        mark = "放弃了" if i - 1 in given_up else ("做到了" if item["ok"] else "没做到")
        lines.append(f"{i}. [{mark}] {wish.kind} {json.dumps(wish.params, ensure_ascii=False)}（原话：{wish.evidence}）"
                     + ("" if item["ok"] else f"；详情：{item['detail']}"))
    lines += ["", "现在的行程："]
    for day in result["days"]:
        stops = "、".join(f"{stop['nameZh']}（{stop['id']}）" for stop in day["stops"]) or "没有景点"
        problems = "，".join({"overloaded": "太满", "lateReturn": "回去太晚"}.get(w, w) for w in day.get("warnings", []))
        lines.append(f"第 {day['day']} 天（{day.get('departAt') or '-'} 出门，{day.get('returnAt') or '-'} 回，开车 {day['driveMin']} 分钟"
                     + (f"，{problems}" if problems else "") + f"）：{stops}；住 {(day.get('lodging') or {}).get('nameZh', '-')}")
    skipped = result.get("skipped") or []
    if skipped:
        lines += ["", "没排进去的（id、名字、原因）："]
        lines += [f"- {item['id']} {item['nameZh']}（{item['reason']}）" for item in skipped[:25]]
    return "\n".join(lines)


def review(provider: Provider, wishes: list[Wish], status: list[dict], result: dict, given_up: set[int]) -> tuple[list[dict], dict]:
    prompt = prompts.load("team_review")
    trace: dict = {"prompt": prompt.id}
    try:
        completion = provider.complete_json("team_review", prompt.text, review_text(wishes, status, result, given_up), REVIEW_SCHEMA)
    except ProviderError as error:
        trace["error"] = str(error)
        return [], trace
    trace.update(model=completion.model, latency_ms=completion.latency_ms, output=completion.data)
    actions = completion.data.get("actions", []) if isinstance(completion.data, dict) else []
    return [action for action in actions if isinstance(action, dict) and action.get("type") in ACTIONS], trace


def negotiate(provider: Provider, plan: Plan, request: dict, call, plan_fn) -> Outcome:
    """引擎排出的第一版 → 检查 → 代码先修能修的 → 审查 agent 最多 3 轮。只留检查结果更好的版本"""
    checks = [wish.check() for wish in plan.wishes]
    trace: dict = {"rounds": []}
    status = grade(call.result, checks)
    best = Outcome(request, call.result, call, status, set(), trace)
    trace["first"] = [item["ok"] for item in status]

    def consider(new_request: dict, new_call, label: str, given_up: set[int]) -> bool:
        nonlocal best
        new_status = grade(new_call.result, checks)
        better = _score(new_status, new_call.result, given_up) < _score(best.status, best.result, given_up)
        trace["rounds"].append({"by": label, "ok": [item["ok"] for item in new_status], "kept": better})
        if better:
            best = Outcome(new_request, new_call.result, new_call, new_status, set(given_up), trace)
        return better

    # 代码自己会修的：只住一家、最多两家
    for i, wish in enumerate(plan.wishes):
        if wish.kind == "max_lodgings" and not best.status[i]["ok"]:
            merged = one_lodging(best.request, best.result, wish.params["count"], plan_fn)
            if merged:
                consider(merged[0], merged[2], "one_lodging", best.given_up)

    given_up = set(best.given_up)
    for _ in range(MAX_ROUNDS):
        open_items = [i for i in best.missed if i not in given_up]
        if not open_items:
            break
        actions, review_trace = review(provider, plan.wishes, best.status, best.result, given_up)
        trace["rounds"].append({"review": review_trace})
        if not actions:
            break
        trial = dict(best.request)
        changed = False
        planned = {stop["id"] for day in best.result["days"] for stop in day["stops"]}
        skipped = {item["id"] for item in best.result.get("skipped") or []}
        merge_to = None
        for action in actions:
            kind = action["type"]
            if kind == "give_up" and isinstance(action.get("wish"), int) and 1 <= action["wish"] <= len(plan.wishes):
                given_up.add(action["wish"] - 1)
            elif kind == "relax_pace" and trial.get("pace") in SLOWER:
                trial["pace"] = SLOWER[trial["pace"]]
                changed = True
            elif kind == "drop_stop" and action.get("id") in planned and action["id"] not in (trial.get("include") or []):
                trial["exclude"] = [*dict.fromkeys([*(trial.get("exclude") or []), action["id"]])]
                changed = True
            elif kind == "add_stop" and action.get("id") in skipped:
                trial["include"] = [*dict.fromkeys([*(trial.get("include") or []), action["id"]])]
                trial["exclude"] = [i for i in trial.get("exclude") or [] if i != action["id"]]
                changed = True
            elif kind == "one_lodging" and action.get("count"):
                merge_to = action["count"]
        if merge_to:
            merged = one_lodging(trial, best.result, merge_to, plan_fn)
            if merged:
                trial, changed = merged[0], True
        if not changed:
            best.given_up = set(given_up)
            continue
        try:
            new_call = plan_fn(trial)
        except Exception as error:  # 审查 agent 改出来的请求引擎不收：这一轮不算
            trace["rounds"].append({"error": str(error)})
            continue
        if not consider(trial, new_call, "review", given_up):
            best.given_up = set(given_up)
    best.given_up = given_up
    best.trace = trace
    # 和平常的排法比：为了这些要求少去了哪些（只看景点，不看顺序）
    try:
        usual = plan_fn({key: value for key, value in request.items() if key != "prefs"}).result
        now = {stop["id"] for day in best.result["days"] for stop in day["stops"]}
        best.lost = [stop["id"] for day in usual["days"] for stop in day["stops"] if stop["id"] not in now]
        trace["lost"] = best.lost
    except Exception as error:  # 平常的排法排不出来：不比了
        trace["lost_error"] = str(error)
    return best


# ---------- 第 5 步：取舍说明（代码按检查的事实写，中英文） ----------
def _days_zh(days: list) -> str:
    return "、".join(str(item["day"] if isinstance(item, dict) else item) for item in days)


def _days_en(days: list) -> str:
    numbers = [str(item["day"] if isinstance(item, dict) else item) for item in days]
    return ("day " if len(numbers) == 1 else "days ") + ", ".join(numbers)


def _hm(minutes: int, zh: bool) -> str:
    h, m = divmod(int(minutes), 60)
    if zh:
        return f"{h} 小时 {m} 分钟" if h and m else (f"{h} 小时" if h else f"{m} 分钟")
    return f"{h} h {m} min" if h and m else (f"{h} h" if h else f"{m} min")


def label(wish: Wish, zh: bool) -> str:
    p = wish.params
    if zh:
        return {
            "rest_days": "中间留一天休息", "rest_day_on": f"第 {p.get('day')} 天休息", "max_drive_per_day": f"每天开车不超过 {_hm(p.get('minutes', 0), True)}",
            "max_lodgings": "只住一家" if p.get("count") == 1 else f"最多住 {p.get('count')} 家", "depart_not_before": f"{p.get('time')} 以后再出门",
            "no_consecutive_early": "别连着两天早起", "return_by": f"每天 {p.get('time')} 前回住处", "day_return_by": f"最后一天 {p.get('time')} 前到",
            "park_days": f"第 {_days_zh(p.get('days', []))} 天去{catalog.parks()[p['park']].name_zh if p.get('park') in catalog.parks() else p.get('park')}",
            "max_stops_per_day": f"每天最多 {p.get('count')} 个地方", "day_max_stops": f"第 {p.get('day')} 天最多 {p.get('count')} 个地方",
            "has_slot": {"sunrise": "看日出", "sunset": "看日落", "night": "看星空"}.get(p.get("slot"), ""),
            "slot_each_day": "每天" + {"sunrise": "看日出", "sunset": "看日落", "night": "看星空"}.get(p.get("slot"), ""),
            "include": "一定要去" + "、".join(stop_name(i, True) for i in p.get("ids", [])), "exclude": "不去" + "、".join(stop_name(i, True) for i in p.get("ids", [])),
            "exclude_area": "不去这个片区", "max_areas_per_day": "一天只去一个片区", "day_single_area": f"第 {p.get('day')} 天只待一个地方",
            "hikes_per_day": "每天至少走一条步道", "max_hike_min": f"徒步不超过 {_hm(p.get('minutes', 0), True)}", "max_stop_minutes": f"单个活动不超过 {_hm(p.get('minutes', 0), True)}",
            "no_hazards": "不去危险的地方", "no_shuttle_stops": "不坐园区班车", "road_day": "开一次" + roads([p.get("road", "")[:4]]).get(p.get("road"), {}).get("nameZh", "这条山路"),
        }.get(wish.kind, wish.kind)
    return {
        "rest_days": "a free day in the middle", "rest_day_on": f"day {p.get('day')} off", "max_drive_per_day": f"at most {_hm(p.get('minutes', 0), False)} of driving a day",
        "max_lodgings": "one hotel for the whole trip" if p.get("count") == 1 else f"at most {p.get('count')} hotels", "depart_not_before": f"not leaving before {p.get('time')}",
        "no_consecutive_early": "no early starts two days in a row", "return_by": f"back by {p.get('time')} every day", "day_return_by": f"arriving by {p.get('time')} on the last day",
        "park_days": f"{catalog.parks()[p['park']].name_en if p.get('park') in catalog.parks() else p.get('park')} on {_days_en(p.get('days', []))}",
        "max_stops_per_day": f"at most {p.get('count')} stops a day", "day_max_stops": f"at most {p.get('count')} stops on day {p.get('day')}",
        "has_slot": {"sunrise": "a sunrise", "sunset": "a sunset", "night": "stargazing"}.get(p.get("slot"), ""),
        "slot_each_day": {"sunrise": "sunrise", "sunset": "sunset", "night": "stargazing"}.get(p.get("slot"), "") + " every day",
        "include": "visiting " + ", ".join(stop_name(i, False) for i in p.get("ids", [])), "exclude": "skipping " + ", ".join(stop_name(i, False) for i in p.get("ids", [])),
        "exclude_area": "skipping that area", "max_areas_per_day": "one area per day", "day_single_area": f"one area on day {p.get('day')}",
        "hikes_per_day": "a hike every day", "max_hike_min": f"hikes under {_hm(p.get('minutes', 0), False)}", "max_stop_minutes": f"nothing longer than {_hm(p.get('minutes', 0), False)}",
        "no_hazards": "no hazardous spots", "no_shuttle_stops": "no park shuttles", "road_day": "driving " + roads([p.get("road", "")[:4]]).get(p.get("road"), {}).get("nameEn", "the road"),
    }.get(wish.kind, wish.kind)


def _why(wish: Wish, item: dict, zh: bool) -> str:
    facts = item.get("facts") or {}
    days = facts.get("days") or []
    ids = facts.get("ids") or []
    if wish.kind == "max_drive_per_day" and days:
        parts = []
        for d in days:
            base = d.get("base") or 0
            if zh:
                parts.append(f"第 {d['day']} 天要开 {_hm(d['minutes'], True)}" + (f"，光是换住处、开到机场就要 {_hm(base, True)}" if base >= 30 else ""))
            else:
                parts.append(f"day {d['day']} has {_hm(d['minutes'], False)} of driving" + (f" ({_hm(base, False)} is just getting between lodgings or the airport)" if base >= 30 else ""))
        return "；".join(parts) if zh else "; ".join(parts)
    if wish.kind == "has_slot":
        count = facts.get("count") or 0
        if zh:
            return "一次都没排上（这几天合适的时段已经排了别的、或者赶不过去）" if count == 0 else f"只排上 {count} 次"
        return "none fit into the plan" if count == 0 else f"only {count} fit into the plan"
    if wish.kind == "max_lodgings":
        names = facts.get("lodgings") or []
        return f"现在住 {len(names)} 家" if zh else f"the plan uses {len(names)} places"
    if ids:
        names = [stop_name(i, zh) for i in ids]
        return ("涉及：" + "、".join(names)) if zh else ("affects: " + ", ".join(names))
    if days:
        return (f"第 {_days_zh(days)} 天没做到") if zh else (f"not met on {_days_en(days)}")
    return "排出来的行程还是没做到" if zh else "the plan still doesn't meet it"


def tradeoffs(outcome: Outcome, wishes: list[Wish], unknown: list[str], zh: bool) -> list[str]:
    """给用户看的几句：哪些要求按你说的排了、哪些没完全做到和原因、哪些地方资料里没有"""
    lines = []
    done = [label(w, zh) for w, item in zip(wishes, outcome.status) if item["ok"]]
    if done:
        lines.append(("按你说的排了：" + "、".join(done) + "。") if zh else ("Planned as you asked: " + "; ".join(done) + "."))
    for wish, item in zip(wishes, outcome.status):
        if not item["ok"]:
            why = _why(wish, item, zh)
            lines.append((f"没能完全做到“{label(wish, True)}”：{why}。这是取舍，想换个办法可以直接说。" if zh else
                          f"I couldn't fully manage {label(wish, False)}: {why}. That's the trade-off; tell me if you'd rather change something else."))
    pref_skips = [item for item in outcome.result.get("skipped") or [] if item.get("reason") == "prefs"]
    if pref_skips:
        names = [item["nameZh" if zh else "nameEn"] for item in pref_skips[:6]]
        more = len(pref_skips) - len(names)
        shuttle = any(w.kind == "no_shuttle_stops" for w in wishes)
        lines.append(((("不坐班车，" if shuttle else "") + "这些按你的要求没排：" + "、".join(names) + (f" 等 {len(pref_skips)} 个" if more > 0 else "") + "。") if zh else
                      ("Left out per your request" + (" (they need the park shuttle)" if shuttle else "") + ": " + ", ".join(names) + (f" and {more} more" if more > 0 else "") + ".")))
    for wish in wishes:
        if wish.kind == "road_day":
            hits = [(day["day"], road) for day in outcome.result["days"] for road in day.get("roads") or [] if road["id"] == wish.params["road"]]
            if hits:
                day, road = hits[0]
                chance = road.get("chance")
                if zh:
                    lines.append(f"{road['nameZh']}排在第 {day} 天" + (f"，往年这一天通车的把握约 {round(chance * 10)} 成" if chance is not None else "，往年这天通没通车的记录不够") + "，出发前看 NPS 路况。")
                else:
                    lines.append(f"{road['nameEn']} is on day {day}" + (f"; in past years it was open on that date about {round(chance * 100)}% of the time" if chance is not None else "") + ". Check NPS road status before you go.")
        if wish.kind == "include":
            lottery = [stop for day in outcome.result["days"] for stop in day["stops"] if stop["id"] in wish.params["ids"] and "lottery" in stop["warnings"]]
            for stop in lottery:
                lines.append(f"{stop['nameZh']}排进去了，但要先抽签拿到许可证，没抽到就去不了。" if zh else
                             f"{stop['nameEn']} is in the plan, but you need to win the permit lottery first.")
    excluded = {i for w in wishes if w.kind == "exclude" for i in w.params.get("ids", [])} | {item["id"] for item in pref_skips}
    lost = [i for i in outcome.lost if i not in excluded]
    if lost:
        names = [stop_name(i, zh) for i in lost[:6]]
        more = len(lost) - len(names)
        lines.append(("为了照你说的排，这几个平常会排的没排：" + "、".join(names) + (f" 等 {len(lost)} 个" if more > 0 else "")
                      + "。这是取舍，哪个一定要去可以直接说。") if zh else
                     ("To fit your requests, I left out a few stops I'd normally include: " + ", ".join(names)
                      + (f" and {more} more" if more > 0 else "") + ". Tell me if any of them is a must."))
    for place in unknown:
        lines.append(f"网站没有收录“{place}”，没法排进去。" if zh else f"I don't have “{place}” in my data, so I couldn't plan it.")
    return lines
