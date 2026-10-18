"""从用户原话片段里读日期、天数。只认写得清楚的说法；读不出来的交给对话去问，不猜。

所有和“今天”有关的判断都用调用方给的 reference（评测时固定），不读运行机器的时钟。
"""
from __future__ import annotations

import calendar
import datetime as dt
import re
from dataclasses import dataclass

from .text import normalize

MONTHS_EN = {name.lower(): i for i, name in enumerate(calendar.month_name) if name}
MONTHS_EN.update({name.lower(): i for i, name in enumerate(calendar.month_abbr) if name})
MONTH_EN = "|".join(sorted(MONTHS_EN, key=len, reverse=True))
ZH_DIGITS = {"零": 0, "一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}
EN_NUMBERS = dict(zip("one two three four five six seven eight nine ten eleven twelve thirteen fourteen".split(), range(1, 15)))
ZH_NUMBER = r"[零一二两三四五六七八九十]+"


def zh_number(token: str) -> int | None:
    if token.isdecimal():
        return int(token)
    if token.lower() in EN_NUMBERS:
        return EN_NUMBERS[token.lower()]
    if "十" in token:
        left, _, right = token.partition("十")
        return (ZH_DIGITS.get(left, 1) if left else 1) * 10 + (ZH_DIGITS.get(right, 0) if right else 0)
    if len(token) == 1 and token in ZH_DIGITS:
        return ZH_DIGITS[token]
    return None


@dataclass
class DateParts:
    """一个日期片段读出来的东西；没写的部分是 None"""
    year: int | None = None
    month: int | None = None
    day: int | None = None
    relative_year: int | None = None  # 今年 0、明年 1、后年 2

    def resolved_year(self, reference: dt.date) -> int | None:
        if self.year is not None:
            return self.year
        if self.relative_year is not None:
            return reference.year + self.relative_year
        return None


NUM = r"(\d{1,2}|" + ZH_NUMBER + r")"
PATTERNS = [
    # 2027-06-01、2027/6/1
    (re.compile(r"(?P<y>\d{4})[-/.](?P<m>\d{1,2})[-/.](?P<d>\d{1,2})"), "ymd"),
    # 2027年6月1日、2027年6月
    (re.compile(r"(?P<y>\d{4})\s*年\s*" + NUM.replace("(", "(?P<m>", 1) + r"\s*月(?:\s*" + NUM.replace("(", "(?P<d>", 1) + r"\s*[日号])?"), "zh"),
    # 明年6月1日、今年十二月、6月1号、五月
    (re.compile(r"(?P<rel>今年|明年|后年)?\s*" + NUM.replace("(", "(?P<m>", 1) + r"\s*月(?:份)?(?:\s*" + NUM.replace("(", "(?P<d>", 1) + r"\s*[日号])?"), "zh"),
    # 2027 June 8 / 2027 Jun 8：年份写在前面（新加坡、香港用户夹英文时常这么写）
    (re.compile(r"\b(?P<y>\d{4})\s+(?P<mn>" + MONTH_EN + r")\b\.?(?:\s+(?P<d>\d{1,2})(?!\d)(?:st|nd|rd|th)?)?", re.I), "en"),
    # 1 June 2027 / 8th June：要在“June 1, 2027”前面，不然“8 June 2027”会被读成“June 2027”、丢了日子
    (re.compile(r"\b(?P<d>\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(?P<mn>" + MONTH_EN + r")\b(?:,?\s+(?P<y>\d{4}))?", re.I), "en"),
    # June 1, 2027 / June 1 / June 2027 / next June
    (re.compile(r"(?P<rel>next|this)?\s*\b(?P<mn>" + MONTH_EN + r")\b\.?\s*(?:(?P<d>\d{1,2})(?!\d)(?:st|nd|rd|th)?)?(?:,?\s*(?P<y>\d{4}))?", re.I), "en"),
    # 只有年份：2027年、明年（和前面的月日合起来用）
    (re.compile(r"(?P<y>\d{4})\s*年(?!\s*\d)|(?P<rel>今年|明年|后年)(?!\s*[\d零一二两三四五六七八九十]+\s*月)"), "year"),
]
RELATIVE = {"今年": 0, "明年": 1, "后年": 2, "this": 0, "next": None}


CN_YEAR = re.compile(r"([〇零一二三四五六七八九]{4})\s*年")
CN_DIGIT = {"〇": "0", "零": "0", "一": "1", "二": "2", "三": "3", "四": "4", "五": "5", "六": "6", "七": "7", "八": "8", "九": "9"}


def parse_date_spans(spans: list[str]) -> tuple[list[DateParts], list[str]]:
    """读出每个日期片段；返回 (读到的日期, 读不懂的片段)"""
    found: list[DateParts] = []
    unread: list[str] = []
    for span in spans:
        # “二〇二七年” → “2027年”
        text = CN_YEAR.sub(lambda m: "".join(CN_DIGIT[ch] for ch in m.group(1)) + "年", normalize(span))
        hits: list[tuple[int, int, DateParts]] = []
        for pattern, kind in PATTERNS:
            for match in pattern.finditer(text):
                if any(match.start() < end and match.end() > start for start, end, _ in hits):
                    continue
                groups = match.groupdict()
                parts = DateParts()
                if groups.get("y"):
                    parts.year = int(groups["y"])
                if groups.get("m"):
                    parts.month = zh_number(groups["m"])
                if groups.get("mn"):
                    parts.month = MONTHS_EN[groups["mn"].lower()]
                if groups.get("d"):
                    parts.day = zh_number(groups["d"])
                rel = groups.get("rel")
                if rel:
                    parts.relative_year = RELATIVE.get(rel.lower(), RELATIVE.get(rel))
                    if rel.lower() == "next" and parts.month is not None:
                        parts.relative_year = None  # “next June” 交给“下一个 6 月”去算
                if parts.month is None and parts.year is None and parts.relative_year is None:
                    continue
                if parts.month is not None and not 1 <= parts.month <= 12:
                    continue
                hits.append((match.start(), match.end(), parts))
        if hits:
            found.extend(parts for _, _, parts in sorted(hits, key=lambda hit: hit[0]))
        else:
            unread.append(span)
    return found, unread


def merge(previous: DateParts | None, new: DateParts) -> DateParts:
    """后来补充的日期和前面说的合起来：先说“2027年12月”再说“12月19日”，年份留着（V3 实验里会丢）"""
    if previous is None:
        return new
    if new.month is None:  # 只补了年份
        return DateParts(new.year if new.year is not None else previous.year, previous.month, previous.day,
                         new.relative_year if new.year is None else None)
    if new.year is None and new.relative_year is None and previous.month == new.month:
        return DateParts(previous.year, new.month, new.day if new.day is not None else previous.day, previous.relative_year)
    return new


def next_occurrence(month: int, day: int, reference: dt.date) -> dt.date | None:
    """今天以后最近的这个月日（2 月 29 日找最近的闰年）"""
    for year in range(reference.year, reference.year + 9):
        try:
            date = dt.date(year, month, day)
        except ValueError:
            continue
        if date >= reference:
            return date
    return None


DAYS_RE = re.compile(r"(?<!第)(\d+|" + ZH_NUMBER + r"|" + "|".join(EN_NUMBERS) + r")\s*(?:个)?\s*(天|days?\b|晚|夜|nights?\b)", re.I)
# 台湾、香港常说“玩五日”“三日游”：“日”也是天数，但不能把日期（6月5日、1日到5日）当成天数
DAYS_RI = re.compile(r"(?<![第月号\d零一二两三四五六七八九十到至~\-–—])(\d+|" + ZH_NUMBER + r")\s*(?:个)?\s*日(?![本程期子])")
WEEK_RE = re.compile(r"(?<!第)(\d+|[一二两三]|a|one|two|three)\s*(?:个)?\s*(周|星期|礼拜|weeks?\b)", re.I)


def parse_days(span: str | None) -> int | None:
    """“5天”“两天”“一周”“两个星期”“four days” → 天数；“3晚”按 4 天算；“第二天”不是天数；
    读不出来、说了好几个数的是 None"""
    if not span:
        return None
    text = normalize(span)
    weeks = WEEK_RE.findall(text)
    if weeks and not DAYS_RE.search(text) and not DAYS_RI.search(text):
        token = weeks[0][0].lower()
        count = 1 if token in ("a", "one") else zh_number(token)
        return count * 7 if count and len(weeks) == 1 else None
    matches = DAYS_RE.findall(text) + [(number, "天") for number in DAYS_RI.findall(text)]
    if not matches:
        return None
    # “5天4晚”：按天算
    day_values = [zh_number(n) for n, unit in matches if unit.lower().startswith(("天", "day"))]
    night_values = [zh_number(n) for n, unit in matches if not unit.lower().startswith(("天", "day"))]
    if day_values:
        return day_values[0] if len(set(day_values)) == 1 and day_values[0] is not None else None
    if len(set(night_values)) == 1 and night_values[0] is not None:
        return night_values[0] + 1
    return None


def relative_month(span: str, reference: dt.date) -> int | None:
    """“下个月”“下下个月”“这个月”“next month”“this month” → 几月（按 reference 算）"""
    text = normalize(span).lower()
    offset = None
    if re.search(r"下下个?月|month after next", text):
        offset = 2
    elif re.search(r"下个?月|next month", text):
        offset = 1
    elif re.search(r"这个月|本月|this month", text):
        offset = 0
    if offset is None:
        return None
    return (reference.month - 1 + offset) % 12 + 1


def date_range_days(text: str, first: DateParts, second: DateParts, reference: dt.date) -> int | None:
    """“6月1日到6月5日”：两个日期之间用“到”“至”“-”“to”连起来才算范围，返回一共几天"""
    if not re.search(r"至|到|[—–~～-]|\bto\b|\bthrough\b|\buntil\b", text, re.I):
        return None
    if first.month is None or first.day is None or second.month is None or second.day is None:
        return None
    year = first.resolved_year(reference) or (next_occurrence(first.month, first.day, reference) or reference).year
    try:
        start = dt.date(year, first.month, first.day)
        end = dt.date(second.resolved_year(reference) or year, second.month, second.day)
    except ValueError:
        return None
    if end < start:
        end = end.replace(year=end.year + 1)
    return (end - start).days + 1
