"""规则那一层的逐条测试（10-28 仓库主人：“测试案例过少，不够扎实”）。

Intake 里模型只摘片段，读成日期、天数、同行的人、节奏、住宿、选了哪一项都是规则做的；这些规则错了，模型再准也排错。
每条一组输入和期望，不调模型、不联网，“今天”固定是 2026-10-16（周五）。期望按设计写（docstring、GUIDE、仓库主人定的规则），
不是照现在的输出抄的。
"""
import datetime as dt

import pytest

from nps_copilot import intake as intake_module
from nps_copilot.dates import DateParts, date_range_days, next_occurrence, parse_date_spans, parse_days, relative_date, relative_month
from nps_copilot.intake import PACE_OPTIONS, Intake, no, pick_option, yes

TODAY = dt.date(2026, 10, 16)  # 周五


@pytest.mark.parametrize("span, days", [
    ("5天", 5), ("6 天", 6), ("两天", 2), ("十天", 10), ("十二天", 12), ("玩五日", 5),
    ("一周", 7), ("两个星期", 14), ("2 weeks", 14), ("a week", 7),
    ("four days", 4), ("10 days", 10),
    ("3晚", 4), ("四晚", 5), ("2 nights", 3),  # 只说几晚：多算一天
    ("5天4晚", 5), ("四日三夜", 4),  # 天和晚都说了：按天
    ("第二天", None), ("五月", None), ("3天或者5天", None), ("", None), (None, None),
])
def test_parse_days(span, days):
    assert parse_days(span) == days


@pytest.mark.parametrize("text, date", [
    ("今天", "2026-10-16"), ("明天", "2026-10-17"), ("后天", "2026-10-18"), ("大后天", "2026-10-19"),
    ("tomorrow", "2026-10-17"), ("day after tomorrow", "2026-10-18"),
    ("这周六", "2026-10-17"), ("这周三", "2026-10-21"),  # 这周三已经过了：算下一个
    ("下周六", "2026-10-24"), ("下下周一", "2026-10-26"), ("周末", "2026-10-17"),
    ("this Saturday", "2026-10-17"),
    ("下个月5号", "2026-11-05"), ("下下个月1号", "2026-12-01"),
    ("19号出发", "2026-10-19"), ("10号出发", "2026-11-10"),  # 这个月的 10 号已经过了：下个月
])
def test_relative_date(text, date):
    hit = relative_date(text, TODAY)
    assert hit is not None and hit[0].isoformat() == date


@pytest.mark.parametrize("text", ["玩五日", "2027年6月1日", "四天", "想去黄石"])
def test_relative_date_ignores_things_that_are_not_relative_dates(text):
    assert relative_date(text, TODAY) is None


@pytest.mark.parametrize("text, month", [
    ("下个月", 11), ("next month", 11), ("下下个月", 12), ("这个月", 10), ("this month", 10), ("明年五月", None),
])
def test_relative_month(text, month):
    assert relative_month(text, TODAY) == month


@pytest.mark.parametrize("span, parts", [
    ("2027年6月1日", DateParts(2027, 6, 1)),
    ("2027/6/10", DateParts(2027, 6, 10)),
    ("2027-06-01", DateParts(2027, 6, 1)),
    ("二〇二七年三月十二日", DateParts(2027, 3, 12)),
    ("12月19日", DateParts(None, 12, 19)),
    ("June 14 2027", DateParts(2027, 6, 14)),
    ("July 10, 2027", DateParts(2027, 7, 10)),
    ("2027年8月", DateParts(2027, 8, None)),
])
def test_parse_date_spans(span, parts):
    found, unread = parse_date_spans([span])
    assert unread == [] and found[0].year == parts.year and found[0].month == parts.month and found[0].day == parts.day


def test_parse_date_spans_reads_next_year_and_leaves_nonsense_unread():
    found, _ = parse_date_spans(["明年五月"])
    assert found[0].month == 5 and found[0].resolved_year(TODAY) == 2027
    found, unread = parse_date_spans(["过几天"])
    assert found == [] and unread == ["过几天"]


@pytest.mark.parametrize("text, first, second, days", [
    ("6月1日到6月5日", DateParts(2027, 6, 1), DateParts(None, 6, 5), 5),
    ("6月28日到7月2日", DateParts(2027, 6, 28), DateParts(None, 7, 2), 5),  # 跨月
    ("12月30日到1月2日", DateParts(2026, 12, 30), DateParts(None, 1, 2), 4),  # 跨年
    ("June 3-7", DateParts(2027, 6, 3), DateParts(None, 6, 7), 5),
    ("6月1日和6月5日", DateParts(2027, 6, 1), DateParts(None, 6, 5), None),  # 没有“到”：不是范围
])
def test_date_range_days(text, first, second, days):
    assert date_range_days(text, first, second, TODAY) == days


@pytest.mark.parametrize("month, day, date", [
    (10, 20, "2026-10-20"), (10, 16, "2026-10-16"), (12, 1, "2026-12-01"), (1, 15, "2027-01-15"),
    (10, 15, "2027-10-15"), (2, 29, "2028-02-29"),  # 2 月 29 日：最近的闰年
])
def test_next_occurrence(month, day, date):
    assert next_occurrence(month, day, TODAY).isoformat() == date


@pytest.mark.parametrize("month, day, year", [
    (12, 1, 2026),  # 今年还没到：今年
    (1, 15, 2027), (8, 1, 2027),  # 今年已经过了两个月以上：明年
    (10, 10, None), (8, 20, None),  # 刚过去不久（60 天以内）：可能说错了，要问
])
def test_assumed_year(month, day, year):
    assert Intake(None, TODAY)._assumed_year(month, day) == year


@pytest.mark.parametrize("text", ["是的", "是", "对的没错", "嗯嗯", "好的", "可以", "yes", "yes, correct", "Yep!", "ok", "系呀", "冇错", "就这天"])
def test_yes(text):
    assert yes(text) and not no(text)


@pytest.mark.parametrize("text", ["不是", "不对", "不，是8月", "不是，是 8 月 3 日", "错了", "no", "No, August 3", "nope", "not really"])
def test_no(text):
    assert no(text) and not yes(text)


@pytest.mark.parametrize("text", [
    "不错",  # 是夸，不是否定
    "nice",  # 以前开头的 n 就当成 no
    "now is fine",
    "November 3",  # 又说了一个日期，不是“no”
    "是不是",
    "好像是吧，再想想",
])
def test_neither_plain_yes_nor_no(text):
    assert not yes(text) and not no(text)


@pytest.mark.parametrize("text, value", [
    ("2", "normal"), ("第二种", "normal"), ("我选第2个", "normal"), ("选适中", "normal"), ("the second one", "normal"),
    ("1", "relaxed"), ("轻松玩", "relaxed"), ("Take it easy", "relaxed"), ("第三", "packed"), ("3", "packed"),
    ("4", "leisurely"), ("更悠闲", "leisurely"),
    ("最后一个", "default"), ("last", "default"), ("还没想好", "default"),
])
def test_pick_pace_option(text, value):
    assert pick_option(text, PACE_OPTIONS)["value"] == value


@pytest.mark.parametrize("text", ["9", "第十个", "随便", "都行", ""])
def test_pick_option_none_when_it_does_not_match(text):
    assert pick_option(text, PACE_OPTIONS) is None


@pytest.mark.parametrize("codes, text, value", [
    (["CHS", "CRW"], "西弗吉尼亚那个", "CRW"),
    (["CHS", "CRW"], "南卡的", "CHS"),
    (["PDX", "PWM"], "缅因那个", "PWM"),
    (["PDX", "PWM"], "俄勒冈的", "PDX"),
    (["IAD", "DCA"], "杜勒斯", "IAD"),
    (["IAD", "DCA"], "里根", "DCA"),
    (["MDW", "ORD"], "ORD", "ORD"),
    (["MDW", "ORD"], "第一个", "MDW"),
])
def test_pick_airport_option(codes, text, value):
    options = [Intake._airport_option(code) for code in codes]
    assert pick_option(text, options)["value"] == value


def party(*spans: str) -> dict:
    intake = Intake(None, TODAY)
    for span in spans:
        intake._read_party(span)
    return intake.party


@pytest.mark.parametrize("spans, expected", [
    (["带爸妈"], {"seniors": True}),
    (["带公公婆婆"], {"seniors": True}),
    (["带埋阿爸阿妈"], {"seniors": True}),
    (["这次不带老人"], {"seniors": False}),
    (["my grandma"], {"seniors": True}),
    (["without my parents"], {"seniors": False}),
    (["两个孩子3岁和8岁"], {"youngestKid": 3}),
    (["带个一岁的宝宝"], {"youngestKid": 1}),
    (["带宝宝"], {"youngestKid": 0}),
    (["my 3-year-old"], {"youngestKid": 3}),
    (["a 5 year old and a 10 year old"], {"youngestKid": 5}),
    (["our toddler"], {"youngestKid": 2}),
    (["婴儿车"], {"stroller": True}),
    (["BB车"], {"stroller": True}),
    (["坐轮椅"], {"wheelchair": True}),
    (["带孩子"], {"_kidAgeUnknown": True}),
    (["带孩子", "孩子5岁"], {"youngestKid": 5}),
    (["一个8岁", "一个4岁"], {"youngestKid": 4}),  # 分两次说：取最小的
    (["18岁的儿子"], {}),  # 成年了：不算孩子，也不再问几岁
    (["no kids"], {}),
])
def test_read_party(spans, expected):
    assert party(*spans) == expected


def preference(span: str) -> Intake:
    intake = Intake(None, TODAY)
    intake._read_preference(span)
    return intake


@pytest.mark.parametrize("span, pace", [
    ("轻松", "relaxed"), ("不想太累", "relaxed"), ("不要太赶", "relaxed"), ("唔好太赶", "relaxed"), ("慢慢玩", "relaxed"),
    ("chill", "relaxed"), ("take it easy", "relaxed"),
    ("越轻松越好", "leisurely"), ("一天就去两三个地方", "leisurely"), ("very relaxed", "leisurely"),
    ("适中", "normal"), ("正常节奏就得", "normal"), ("balanced", "normal"),
    ("多看一些", "packed"), ("紧凑", "packed"), ("想睇多啲", "packed"), ("see as much as possible", "packed"),
    ("别太紧凑", None), ("想看瀑布", None),
])
def test_read_pace(span, pace):
    assert preference(span).pace.value == pace


@pytest.mark.parametrize("span, lodging", [
    ("只住酒店", "hotel"), ("不住民宿", "hotel"), ("hotels only", "hotel"),
    ("不住酒店", "rental"), ("我想全程都住airbnb，不住酒店", "rental"), ("Airbnb only", "rental"), ("no hotels", "rental"),
    ("想露营", "camp"), ("camping", "camp"),
    ("不露营", None), ("轻松", None),
])
def test_read_lodging(span, lodging):
    assert preference(span).lodging.value == lodging


@pytest.mark.parametrize("span, key", [
    ("少走路", "lessWalking"), ("不想走太多路", "lessWalking"), ("不想早起", "noEarlyStart"), ("sleep in", "noEarlyStart"),
    ("可以早起", "earlyStart"), ("不想天天换酒店", "fewerHotelChanges"),
])
def test_read_preferences_the_contract_does_not_have_yet(span, key):
    assert key in preference(span).preferences


@pytest.mark.parametrize("text, english", [("Zion for 3 days", True), ("锡安 3 days", False), ("2027", False), ("你好", False)])
def test_is_english(text, english):
    assert intake_module.is_english(text) == english
