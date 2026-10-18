"""Intake：把用户的话整理成 TripRequest（copilot/contracts/trip-request.v1.schema.json）。

分工（沿用 experiments/local-model-validation/v3 的做法）：
- 模型只从**当前这条消息**里逐字摘出片段（公园、日期、天数、出发地、同行的人、偏好），不计算、不判断；
- 代码检查片段确实在原话里，再把片段读成代码、日期、天数，保存对话状态，决定下一句问什么。

和 V3 比修好的问题：
1. 否定了候选日期以后再说“是的”，不会确认被否定的那个；
2. 先说“2027年12月”再说“12月19日”，年份留着；
3. “我选第二种”“第2个”“选适中”都能对上选项；
4. 摘出的片段和原话比较前先规范化，“6天”和“6 天”算同一个；
5. 追问不露出 preferences 这类内部字段名，模型摘错的片段直接丢掉、记在 trace 里，不让用户替模型改错。
"""
from __future__ import annotations

import copy
import datetime as dt
import re
from dataclasses import dataclass, field
from typing import Any

from . import catalog, prompts
from .dates import DateParts, date_range_days, merge, next_occurrence, parse_date_spans, parse_days, relative_month
from .providers import Provider
from .text import contains, normalize

LIST_FIELDS = ("parks", "dates", "party", "preferences")
TEXT_FIELDS = ("duration", "origin", "destination")
FIELDS = LIST_FIELDS + TEXT_FIELDS
EXTRACTION_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": list(FIELDS),
    "properties": {
        **{key: {"type": "array", "maxItems": 12, "items": {"type": "string", "minLength": 1, "maxLength": 96}} for key in LIST_FIELDS},
        **{key: {"type": ["string", "null"], "maxLength": 96} for key in TEXT_FIELDS},
    },
}
MAX_DAYS = 14
REGION_ZH = {"PDX": "俄勒冈州", "PWM": "缅因州", "IAD": "杜勒斯", "DCA": "里根"}

PACE_OPTIONS = [
    {"value": "relaxed", "zh": "轻松玩", "en": "Take it easy", "zhNote": "每天少安排一些，多留休息时间", "enNote": "fewer stops, more downtime"},
    {"value": "normal", "zh": "适中", "en": "Balanced", "zhNote": "主要景点都看，也留一些空", "enNote": "the main sights with some breathing room"},
    {"value": "packed", "zh": "多看一些", "en": "See as much as possible", "zhNote": "多排景点，起得早一点", "enNote": "more stops and earlier starts"},
    {"value": "default", "zh": "还没想好", "en": "Not sure yet", "zhNote": "先按适中排一版，之后可以改", "enNote": "start balanced and adjust later"},
]
ORDINALS = {"一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9,
            "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "last": -1, "最后": -1}


def prompt() -> str:
    """当前用的 Intake 提示词（用哪一版见 prompts.py：defaults.json，或者环境变量 COPILOT_PROMPT_INTAKE）"""
    return prompts.load("intake").text


def is_english(text: str) -> bool:
    letters = sum(ch.isascii() and ch.isalpha() for ch in text)
    han = sum("一" <= ch <= "鿿" for ch in text)
    return letters > 0 and han == 0


YES_WORDS = r"是的|是啊|是滴|是|对的|对呀|对啊|对|没错|没问题|确认|嗯嗯|嗯|好的|好|可以|行|就这天|就是|yes|yeah|yep|yup|correct|right|ok|okay|sure|exactly"


def yes(text: str) -> bool:
    """“是的”“嗯对”“对的没错”“yes, correct”：整句只由表示肯定的词组成"""
    words = r"(?:" + YES_WORDS + r")"
    return bool(re.fullmatch(r"\s*" + words + r"(?:[\s,，、]*" + words + r")*[\s。.!！~呀啊吧呢]*", normalize(text), re.I))


def no(text: str) -> bool:
    return bool(re.fullmatch(r"\s*(不是|不对|不|否|错了|no|nope|n|not really|wrong)[，,。.!！\s]*.*", text, re.I)) and not yes(text)


def pick_option(text: str, options: list[dict]) -> dict | None:
    """“2”“第二种”“我选第2个”“选适中”“the second one” → 对应的选项；对不上是 None"""
    stripped = normalize(text).lower()
    match = re.search(r"(?:第|选|^|\s)(\d)(?:个|种|项|号)?(?:\b|$)", stripped) or re.search(r"第\s*(\d)", stripped)
    index = None
    if match:
        index = int(match.group(1))
    else:
        for word, number in ORDINALS.items():
            if re.search(r"第" + word + r"(个|种|项|号)?", stripped) or re.search(r"\b" + word + r"\b", stripped) and word.isascii():
                index = number
                break
    if index is not None:
        if index == -1:
            return options[-1]
        if 1 <= index <= len(options):
            return options[index - 1]
    for option in options:
        for label in (option.get("zh"), option.get("en"), option.get("value")):
            if isinstance(label, str) and normalize(label).lower() in stripped:
                return option
    # 反过来：“缅因那个”“俄勒冈的”——去掉“那个”“的”“选”这类虚词，剩下的只出现在一个选项里就选它
    core = re.sub(r"那个|这个|那一个|的|吧|我|选|要|是|就|呢|啊|one|the|please", "", stripped).strip(" ，,。.")
    if len(core) >= 2:
        matches = [option for option in options if core in normalize(str(option.get("zh", "")) + " " + str(option.get("en", ""))).lower()]
        if len(matches) == 1:
            return matches[0]
    return None


@dataclass
class Field:
    value: Any = None
    source: str | None = None
    evidence: str | None = None


@dataclass
class Turn:
    status: str  # "needs_input" | "ready" | "unsupported"
    question: dict | None
    request: dict | None
    notices: list[str]
    trace: dict


@dataclass
class Intake:
    """一次对话的状态。reference 是“今天”（用户那边的日期），评测时固定"""
    provider: Provider
    reference: dt.date
    language: str | None = None
    parks: Field = field(default_factory=Field)
    date: DateParts | None = None
    date_evidence: str | None = None
    start_date: Field = field(default_factory=Field)
    month: Field = field(default_factory=Field)
    days: Field = field(default_factory=Field)
    origin: Field = field(default_factory=Field)
    destination: Field = field(default_factory=Field)
    pace: Field = field(default_factory=Field)
    lodging: Field = field(default_factory=Field)
    party: dict = field(default_factory=dict)
    party_evidence: list[str] = field(default_factory=list)
    preferences: dict = field(default_factory=dict)
    pending: dict | None = None
    rejected_dates: set[str] = field(default_factory=set)
    asked_pace: bool = False
    unsupported: list[str] = field(default_factory=list)
    history: list[str] = field(default_factory=list)

    # ---------- 对外 ----------
    def step(self, message: str) -> Turn:
        self.history.append(message)
        if self.language is None:
            self.language = "en" if is_english(message) else "zh"
        trace: dict[str, Any] = {"prompt": prompts.load("intake").id, "model_called": False}
        notices: list[str] = []
        handled = self._answer_pending(message, notices)
        trace["route"] = handled or "extraction"
        if handled in (None, "partial"):
            completion = self.provider.complete_json("intake", prompt(), message, EXTRACTION_SCHEMA)
            trace.update(model_called=True, model=completion.model, latency_ms=completion.latency_ms, model_output=completion.data)
            kept, dropped = self._grounded(completion.data, message)
            trace["dropped_spans"] = dropped
            had_days = self.days.value
            self._absorb(kept, message)
            trace["rule_filled"] = self._rule_fill(message, had_days)
        return self._render(notices, trace)

    def request(self) -> dict:
        """当前状态对应的 TripRequest（ready 时才完整）"""
        request: dict[str, Any] = {"contract": "trip-request/v1", "parks": self.parks.value, "days": self.days.value}
        provenance: dict[str, dict] = {}
        if self.start_date.value:
            request["startDate"] = self.start_date.value
            provenance["startDate"] = self._source(self.start_date)
        elif self.month.value:
            request["month"] = self.month.value
            provenance["month"] = self._source(self.month)
        request["origin"] = self.origin.value
        if self.destination.value and self.destination.value != self.origin.value:
            request["destination"] = self.destination.value
            provenance["destination"] = self._source(self.destination)
        request["pace"] = self.pace.value or "normal"
        provenance["pace"] = self._source(self.pace) if self.pace.value else {"source": "default"}
        if self.lodging.value:
            request["lodgingPref"] = self.lodging.value
            provenance["lodgingPref"] = self._source(self.lodging)
        if self.party:
            request["party"] = dict(self.party)
            provenance["party"] = {"source": "user", "evidence": "；".join(self.party_evidence)[:200]}
        for name in ("parks", "days", "origin"):
            provenance[name] = self._source(getattr(self, name))
        request["provenance"] = provenance
        return request

    # ---------- 回答上一句的追问（不调模型） ----------
    def _answer_pending(self, message: str, notices: list[str]) -> str | None:
        pending = self.pending
        if not pending:
            return None
        kind = pending["kind"]
        if kind == "confirm_date":
            proposed = pending["date"]
            year = self._year_in(message)
            if year is not None:
                return self._set_year(year, message)
            if yes(message):
                self.start_date = Field(proposed, "user_confirmation", self.date_evidence)
                self.pending = None
                return "confirm_date"
            if no(message):
                self.rejected_dates.add(proposed)
                self.pending = {"kind": "ask_year", "month": pending["month"], "day": pending["day"]}
                # 只说“不是”就问哪一年；同一句里还说了别的（“不是，是 8 月 3 日”）就接着读
                return "reject_date" if re.fullmatch(r"\s*(不是|不对|no|nope)[。.!！\s]*", message, re.I) else "partial"
            return None
        if kind == "ask_year":
            year = self._year_in(message)
            if year is not None:
                return self._set_year(year, message)
            # 没有候选日期时，单说“是的”不确认任何东西（V3 会确认已经被否定的那个）
            return "ignored_yes" if yes(message) else None
        if kind == "choose":
            option = pick_option(message, pending["options"])
            if option is None and pending["target"] in ("origin", "destination"):
                # 问的是机场：直接按机场目录认（“卡利斯佩尔”“SLC”），不用模型
                hits = catalog.find_all(message, catalog.airports())
                if len(hits) == 1:
                    option = {"value": hits[0][0]}
            if option is None:
                return None
            self.pending = None
            target = pending["target"]
            if target == "pace":
                if option["value"] == "default":
                    self.pace = Field("normal", "default")
                    notices.append("先按适中的节奏排一版，之后可以改。" if self.language == "zh" else "I'll start with a balanced pace; you can change it later.")
                else:
                    self.pace = Field(option["value"], "user_confirmation", message.strip())
            elif target in ("origin", "destination"):
                setattr(self, target, Field({"airport": option["value"]}, "user_confirmation", message.strip()))
            elif target == "days":
                self.days = Field(option["value"], "user_confirmation", message.strip())
            elif target == "parks":
                self.parks = Field(option["value"], "user_confirmation", message.strip())
            return "choice"
        return None

    def _year_in(self, message: str) -> int | None:
        text = normalize(message)
        if re.search(r"\d{1,2}\s*月|\d{1,2}\s*[日号]", text):
            return None
        years = re.findall(r"(?<!\d)(20\d{2})(?!\d)", text)
        if len(years) == 1:
            return int(years[0])
        for word, offset in (("今年", 0), ("明年", 1), ("后年", 2), ("this year", 0), ("next year", 1)):
            if word in text.lower():
                return self.reference.year + offset
        return None

    def _set_year(self, year: int, message: str) -> str:
        month, day = self.pending["month"], self.pending["day"]
        try:
            date = dt.date(year, month, day)
        except ValueError:
            self.pending = {"kind": "ask_year", "month": month, "day": day, "error": f"{year} 年没有 {month} 月 {day} 日"}
            return "bad_year"
        self.start_date = Field(date.isoformat(), "user_confirmation", f"{self.date_evidence}；{message.strip()}")
        self.date = DateParts(year, month, day)
        self.pending = None
        return "year"

    # ---------- 读模型摘出的片段 ----------
    def _grounded(self, raw: Any, message: str) -> tuple[dict, list[dict]]:
        """只留确实在这条消息里的片段（规范化后逐字比较）；不在的丢掉，记下来"""
        kept: dict[str, Any] = {key: [] for key in LIST_FIELDS} | {key: None for key in TEXT_FIELDS}
        dropped: list[dict] = []
        if not isinstance(raw, dict):
            return kept, [{"field": "*", "reason": "invalid_shape"}]
        for key in FIELDS:
            value = raw.get(key)
            values = value if isinstance(value, list) else ([] if value in (None, "") else [value])
            good = []
            for span in values:
                if isinstance(span, str) and contains(message, span):
                    good.append(span)
                else:
                    dropped.append({"field": key, "span": span, "reason": "not_in_message"})
            kept[key] = good if key in LIST_FIELDS else (good[0] if good else None)
        return kept, dropped

    def _absorb(self, kept: dict, message: str) -> None:
        if kept["parks"]:
            self._read_parks(kept["parks"])
        range_days = self._read_dates(kept["dates"], message) if kept["dates"] else None
        # 模型常把“三天”“一周”“five days”放进 dates 而不是 duration：天数从哪个片段读到都算
        stated = None
        for span in ([kept["duration"]] if kept["duration"] else []) + kept["dates"]:
            days = parse_days(span)
            if days is not None:
                stated = Field(days, "user", span)
                break
        if stated and range_days and stated.value != range_days:
            # “6月1日到6月5日”是 5 天，又说“玩三天”：不替用户选，问按哪个
            self.days = Field()
            self.pending = {"kind": "choose", "target": "days", "options": [
                {"value": range_days, "zh": f"{range_days} 天（按日期算）", "en": f"{range_days} days (from the dates)"},
                {"value": stated.value, "zh": f"{stated.value} 天", "en": f"{stated.value} days"},
            ]}
        elif stated:
            self.days = stated
        elif range_days:
            self.days = Field(range_days, "user", normalize(" ".join(kept["dates"])))
        for role in ("origin", "destination"):
            if kept[role]:
                self._read_place(role, kept[role])
        for span in kept["party"]:
            self._read_party(span)
        for span in kept["preferences"]:
            self._read_preference(span)

    def _rule_fill(self, message: str, had_days) -> list[str]:
        """模型漏掉、但原话里写得毫不含糊的条件，用规则补上（小模型常漏“玩4天”）。
        只补天数：整句话里只有一处“N天 / N晚 / 一周”才补。补了的写进 trace，评测时和模型的成绩分开算"""
        filled = []
        if self.days.value is None and had_days is None:
            days = parse_days(message)
            matches = re.findall(r"\d+\s*(?:天|days?|晚|nights?)|[一二两三四五六七八九十]+\s*(?:天|晚)|一周|一个星期|a week", normalize(message), re.I)
            if days is not None and len(matches) == 1:
                self.days = Field(days, "user", matches[0])
                filled.append("days")
        # 公园名：模型一个都没摘、而整句话里能按目录认出公园的（9B 常漏“黄石”“大峡谷”），按目录补
        if not self.parks.value and not self.unsupported:
            hits = catalog.find_all(message, catalog.parks())
            if hits:
                self.parks = Field(self._order_parks([code for code, _ in hits][:4]), "user", "、".join(alias for _, alias in hits))
                filled.append("parks")
        return filled

    def _read_parks(self, spans: list[str]) -> None:
        table = catalog.parks()
        codes: list[str] = []
        for span in spans:
            codes.extend(code for code, _ in catalog.find_all(span, table) if code not in codes)
            rest = catalog.leftover(span, table)
            if rest and not codes:
                self.unsupported.append(span)
        if not codes:
            return
        if len(codes) > 4:
            codes = codes[:4]
        self.parks = Field(self._order_parks(codes), "user", "、".join(spans))

    @staticmethod
    def _order_parks(codes: list[str]) -> list[str]:
        """第一座要能和其余的顺路一起玩（在它的 nearby 里）；用户说的顺序优先"""
        table = catalog.parks()
        for main in codes:
            if all(other == main or other in table[main].nearby for other in codes):
                return [main] + [code for code in codes if code != main]
        return codes  # 凑不到一起：留给 _render 问

    def _read_dates(self, spans: list[str], message: str) -> int | None:
        """读日期；返回日期范围算出来的天数（“6月1日到6月5日”是 5），没有范围是 None"""
        found, _ = parse_date_spans(spans)
        joined = normalize(" ".join(spans))
        if not found:
            # “下个月”“next month”：按 reference 算出是几月（只给月份）
            month = relative_month(joined, self.reference)
            if month is not None:
                self.date, self.date_evidence, self.start_date = DateParts(month=month), joined, Field()
                self.month = Field(month, "user", joined)
            return None
        range_days = None
        if len(found) >= 2 and found[0].month is not None:
            range_days = date_range_days(joined, found[0], found[1], self.reference)
        parts = merge(self.date, found[0])
        self.date = parts
        self.date_evidence = joined
        self.start_date = Field()
        self.month = Field()
        year = parts.resolved_year(self.reference)
        if parts.month is not None and parts.day is not None:
            if year is not None:
                try:
                    start = dt.date(year, parts.month, parts.day)
                    # “6月15日到盐湖城，第二天开始玩”：从第二天算
                    if re.search(r"第二天开始|次日开始|第二天才开始|next day|the day after", normalize(message), re.I):
                        start += dt.timedelta(days=1)
                    self.start_date = Field(start.isoformat(), "user", joined)
                except ValueError:
                    self.pending = {"kind": "bad_date", "text": f"{year} 年没有 {parts.month} 月 {parts.day} 日"}
        elif parts.month is not None:
            # 只有月份：契约只收“最近的那个月”。说了年份、又不是最近的那个月，就要问具体日期
            nearest = self.reference.year + (1 if parts.month < self.reference.month else 0)
            if year is None or year == nearest:
                self.month = Field(parts.month, "user", joined)
        return range_days

    def _read_place(self, role: str, span: str) -> None:
        hits = catalog.find_all(span, catalog.airports())
        if len(hits) == 1:
            setattr(self, role, Field({"airport": hits[0][0]}, "user", span))
        elif len(hits) > 1:
            # 记在字段上：这一轮没答清楚，下一轮接着问，不会悄悄变成“没有回程地”（之前会）
            setattr(self, role, Field([code for code, _ in hits], "ambiguous", span))
        else:
            setattr(self, role, Field(None, "unknown", span))

    def _read_party(self, span: str) -> None:
        text = normalize(span)
        negated = re.search(r"不带|没有|不跟|without|\bno\b", text, re.I)
        if re.search(r"老人|爸妈|父母|长辈|爷爷|奶奶|外公|外婆|老爸|老妈|senior|elderly|parents|grand(?:parents?|ma|pa|mother|father)|granny", text, re.I):
            self.party["seniors"] = not negated
        from .dates import EN_NUMBERS, zh_number
        words = "|".join(sorted(EN_NUMBERS, key=len, reverse=True))
        ages = re.findall(r"(\d{1,2}|[一二两三四五六七八九十]+|" + words + r")\s*(?:岁|周岁|-? ?years?-? ?olds?|yo\b)", text, re.I)
        values = [value for value in (zh_number(token) for token in ages) if value is not None and 0 <= value <= 17]
        if values:
            self.party["youngestKid"] = min(min(values), self.party.get("youngestKid", 99))
            self.party.pop("_kidAgeUnknown", None)
        # “婴儿车”只说明带推车，不说明孩子多大
        elif re.search(r"婴儿(?!车)|宝宝|baby(?! ?(?:stroller|carrier))|infant", text, re.I) and not negated:
            self.party["youngestKid"] = 0
        elif re.search(r"toddler|幼儿", text, re.I) and not negated:
            self.party["youngestKid"] = min(2, self.party.get("youngestKid", 99))
        age = bool(values)
        if re.search(r"婴儿车|推车|stroller", text, re.I):
            self.party["stroller"] = not negated
        if re.search(r"轮椅|wheelchair", text, re.I):
            self.party["wheelchair"] = not negated
        if re.search(r"孩子|小孩|儿子|女儿|kids?|child|children|\bson\b|daughter", text, re.I) and "youngestKid" not in self.party and not negated and not age:
            self.party.setdefault("_kidAgeUnknown", True)
        self.party_evidence.append(span)

    def _read_preference(self, span: str) -> None:
        text = normalize(span)
        pace = None
        if re.search(r"轻松|不要太累|不想太累|别安排太满|别排太满|少安排|慢慢|悠闲|relax|easy|leisurely|not too (busy|packed)", text, re.I):
            pace = "relaxed"
        elif re.search(r"适中|普通|一般就行|balanced|moderate|normal", text, re.I):
            pace = "normal"
        elif re.search(r"多看|紧凑|多去几个|尽量多|see as much|packed|as many", text, re.I):
            pace = "packed"
        if pace and not re.search(r"不想多看|别太紧凑", text):
            self.pace = Field(pace, "user", span)
        if re.search(r"不住民宿|不要民宿|只住酒店|住酒店|hotels? only|only hotels?|stay in hotels?|no airbnb", text, re.I):
            self.lodging = Field("hotel", "user", span)
        elif re.search(r"民宿|airbnb|vrbo|整套房子", text, re.I):
            self.lodging = Field("rental", "user", span)
        # 合同里还没有的偏好：记下来，Writer 照实说“这一版还不能单独按这个排”
        for key, pattern in (("lessWalking", r"少走路|不想走太多|走不动|less walking|not much walking"),
                             ("noEarlyStart", r"不想早起|不要早起|别太早|no early|sleep in"),
                             ("earlyStart", r"愿意早起|可以早起|不介意早起|early start"),
                             ("fewerHotelChanges", r"不想.*换酒店|少换酒店|fewer hotel changes|same hotel")):
            if re.search(pattern, text, re.I):
                self.preferences[key] = span

    # ---------- 下一句问什么 ----------
    def _render(self, notices: list[str], trace: dict) -> Turn:
        zh = self.language != "en"
        table = catalog.parks()
        question = self._special_pending(zh)
        if question is None and self.unsupported and not self.parks.value:
            names = "、".join(self.unsupported) if zh else ", ".join(self.unsupported)
            text = (f"我这里还没有收录“{names}”。目前支持的是美国 52 座国家公园、加拿大落基山 3 座和羚羊峡谷、马蹄湾、纪念碑谷、波浪谷，想去其中哪里？"
                    if zh else f"I don't cover “{names}” yet. I can plan 52 U.S. national parks, three in the Canadian Rockies, plus Antelope Canyon, Horseshoe Bend, Monument Valley, and The Wave. Which would you like?")
            question = {"kind": "parks", "text": text}
        if question is None and not self.parks.value:
            question = {"kind": "parks", "text": "想去哪座国家公园？可以说几座顺路的。" if zh else "Which national park would you like to visit? A few nearby ones together is fine."}
        if question is None and self.parks.value and len(self.parks.value) > 1 and self._order_parks(self.parks.value)[0] not in self._compatible_mains():
            names = [table[code].name_zh if zh else table[code].name_en for code in self.parks.value]
            question = {"kind": "choose", "target": "parks",
                        "text": ("这几座离得太远，排不进同一趟（" + "、".join(names) + "）。先排哪一座？") if zh else
                        ("These are too far apart for one trip (" + ", ".join(names) + "). Which one should I plan first?"),
                        "options": [{"value": [code], "zh": table[code].name_zh, "en": table[code].name_en} for code in self.parks.value]}
        if question is None and not self.start_date.value and not self.month.value:
            question = self._date_question(zh)
        if question is None and not self.days.value:
            question = {"kind": "days", "text": "这次一共玩几天？" if zh else "How many days do you have for the trip?"}
        if question is None and self.days.value and not 1 <= self.days.value <= MAX_DAYS:
            question = {"kind": "days", "text": f"一次最多排 {MAX_DAYS} 天，要不要缩短一点，或者分成两段？" if zh else f"I can plan up to {MAX_DAYS} days at a time. Could you shorten it, or split it into two trips?"}
            self.days = Field()
        for role in ("origin", "destination"):
            place = getattr(self, role)
            if question is None and place.source == "ambiguous":
                where = "" if role == "origin" else ("回程" if zh else "the return ")
                question = {"kind": "choose", "target": role,
                            "text": f"{where}“{place.evidence}”有好几个机场，是哪一个？" if zh else f"There are several airports for {where}“{place.evidence}”. Which one?",
                            "options": [self._airport_option(code) for code in place.value]}
        if question is None and not (isinstance(self.origin.value, dict) and "airport" in self.origin.value):
            question = self._origin_question(zh)
        if question is None and self.destination.source == "unknown":
            said = self.destination.evidence
            self.destination = Field()
            question = {"kind": "destination",
                        "text": f"回程的“{said}”不在我常用的机场里，从哪个机场飞走？" if zh else f"I don't know an airport for “{said}”. Which airport are you flying home from?"}
        if question is None and self.party.get("_kidAgeUnknown"):
            self.party.pop("_kidAgeUnknown")
            question = {"kind": "party", "text": "最小的孩子几岁？有的步道和导览有年龄限制。" if zh else "How old is the youngest child? Some trails and tours have age limits."}
        if question is None and not self.pace.value and not self.asked_pace:
            self.asked_pace = True
            question = {"kind": "choose", "target": "pace",
                        "text": "这次想怎么玩？选一个就行，也可以直接说。" if zh else "What pace do you prefer? Pick one or just tell me.",
                        "options": copy.deepcopy(PACE_OPTIONS)}
        if question is not None:
            self.pending = question if question.get("kind") in ("choose", "confirm_date", "ask_year") else None
            return Turn("needs_input", self._public(question, zh), None, notices, trace)
        self.pending = None
        return Turn("ready", None, self.request(), notices, trace)

    def _special_pending(self, zh: bool) -> dict | None:
        pending = self.pending
        if not pending:
            return None
        if pending["kind"] == "ask_year":
            month, day = pending["month"], pending["day"]
            error = pending.get("error")
            text = (f"{error}。" if error else "") + (f"{month} 月 {day} 日是哪一年？" if zh else f"Which year for {calendar_name(month)} {day}?")
            return {"kind": "ask_year", "text": text, "month": month, "day": day}
        if pending["kind"] == "choose" and pending.get("target") == "days" and "text" not in pending:
            dates_days, said_days = (option["value"] for option in pending["options"])
            pending["text"] = (f"按你说的日期算是 {dates_days} 天，你又说玩 {said_days} 天，按哪个排？" if zh else
                               f"Those dates make {dates_days} days, but you also said {said_days}. Which should I use?")
            return pending
        if pending["kind"] == "bad_date":
            self.pending = None
            return {"kind": "dates", "text": pending["text"] + "，请再说一下出发日期。" if zh else "That date doesn't exist. What's your start date?"}
        return None

    def _compatible_mains(self) -> list[str]:
        table = catalog.parks()
        codes = self.parks.value or []
        return [main for main in codes if all(other == main or other in table[main].nearby for other in codes)]

    def _date_question(self, zh: bool) -> dict:
        parts = self.date
        if parts and parts.month is not None and parts.day is not None and parts.resolved_year(self.reference) is None:
            candidate = next_occurrence(parts.month, parts.day, self.reference)
            if candidate and candidate.isoformat() not in self.rejected_dates:
                this_year = candidate.year == self.reference.year
                if zh:
                    reason = "" if this_year else f"今年的 {parts.month} 月 {parts.day} 日已经过了，"
                    text = f"{reason}是 {candidate.year} 年 {parts.month} 月 {parts.day} 日出发吗？"
                else:
                    reason = "" if this_year else f"{calendar_name(parts.month)} {parts.day} has already passed this year. "
                    text = f"{reason}Do you mean {calendar_name(parts.month)} {parts.day}, {candidate.year}?"
                return {"kind": "confirm_date", "text": text, "date": candidate.isoformat(), "month": parts.month, "day": parts.day}
            return {"kind": "ask_year", "text": f"{parts.month} 月 {parts.day} 日是哪一年？" if zh else f"Which year for {calendar_name(parts.month)} {parts.day}?",
                    "month": parts.month, "day": parts.day}
        if parts and parts.month is not None:
            return {"kind": "dates", "text": "那个月具体哪天出发？只知道月份也可以，我按月中排。" if zh else "Which day that month? If you only know the month, I'll plan around mid-month."}
        return {"kind": "dates", "text": "打算什么时候去？说个日期或者月份就行。" if zh else "When are you going? A date or just a month is fine."}

    def _origin_question(self, zh: bool) -> dict:
        table = catalog.parks()
        main = table[self.parks.value[0]]
        options = [self._airport_option(code) for code in main.airports[:4] if code in catalog.airports()]
        said = self.origin.evidence if self.origin.source == "unknown" else None
        if zh:
            text = (f"“{said}”不在我常用的机场里。" if said else "") + f"从哪个机场进出？去{main.name_zh}常用的是下面几个，也可以说别的城市。"
        else:
            text = (f"“{said}” isn't one of the airports I know. " if said else "") + f"Which airport are you flying into? These are common for {main.name_en}."
        return {"kind": "choose", "target": "origin", "text": text, "options": options}

    @staticmethod
    def _airport_option(code: str) -> dict:
        airport = catalog.airports()[code]
        english = catalog.english_city(code)
        # 同名城市要能说“俄勒冈那个”“缅因那个”“杜勒斯”：选项里写上地区
        region = REGION_ZH.get(code)
        city = f"{airport.city}（{region}）" if region and region not in airport.city else airport.city
        return {"value": code, "zh": f"{city} · {airport.name_zh}（{code}）", "en": f"{english} ({code})" if english else code}

    @staticmethod
    def _public(question: dict, zh: bool) -> dict:
        """给用户看的问题：只留文字和选项，不带内部字段"""
        public = {"kind": question["kind"], "text": question["text"]}
        if question.get("options"):
            public["options"] = [
                {"label": option["zh"] if zh else option["en"], **({"note": option["zhNote"] if zh else option["enNote"]} if "zhNote" in option else {})}
                for option in question["options"]
            ]
        return public

    @staticmethod
    def _source(item: Field) -> dict:
        source = {"source": item.source or "default"}
        if item.evidence:
            source["evidence"] = item.evidence[:200]
        return source


def calendar_name(month: int) -> str:
    import calendar as _calendar
    return _calendar.month_name[month]
