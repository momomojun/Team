"""香港、台湾、新马用户的写法：各地的地名（三藩市、卡加利、洛磯山）、香港字形、粤语说法、“玩五日”。"""
from collections import defaultdict

import pytest
from conftest import extraction

from nps_copilot.catalog import airports, find_all, parks, regional
from nps_copilot.dates import parse_days
from nps_copilot.text import normalize


@pytest.mark.parametrize("text, code", [
    ("由三藩市出發", "SFO"), ("從舊金山出發", "SFO"), ("飛卡加利", "YYC"), ("卡城入", "YYC"), ("愛民頓出發", "YEG"),
    ("溫哥華", "YVR"), ("沙加緬度", "SMF"), ("聖荷西", "SJC"), ("從賭城出發", "LAS"), ("西礁島", "EYW"),
    ("鹽湖城進出", "SLC"), ("羅省出發", "LAX"), ("安克拉治", "ANC"),
])
def test_regional_city_names(text, code):
    assert [found for found, _ in find_all(normalize(text), airports())] == [code]


@pytest.mark.parametrize("text, code", [
    ("去洛磯山國家公園", "romo"), ("去班芙", "banf"), ("宰恩國家公園", "zion"), ("優勝美地", "yose"), ("約塞米蒂", "yose"),
    ("冰河國家公園", "glac"), ("迪納利", "dena"), ("大狄頓", "grte"), ("仙納度", "shen"), ("大煙山", "grsm"),
    ("國王峽谷", "seki"), ("紅木國家公園", "redw"), ("乾龜", "drto"), ("傑斯珀", "jasp"),
])
def test_regional_park_names(text, code):
    assert [found for found, _ in find_all(normalize(text), parks())] == [code]


def test_no_alias_points_to_two_parks():
    owners = defaultdict(set)
    for code, park in parks().items():
        for alias in park.aliases:
            owners[normalize(alias).lower()].add(code)
    assert {alias: codes for alias, codes in owners.items() if len(codes) > 1} == {}


def test_only_real_ambiguities_between_airports():
    owners = defaultdict(set)
    for code, airport in airports().items():
        for alias in airport.aliases:
            owners[normalize(alias).lower()].add(code)
    # 两个波特兰、华盛顿的两个机场是真的分不清，系统会追问
    assert {frozenset(codes) for codes in owners.values() if len(codes) > 1} <= {frozenset({"PDX", "PWM"}), frozenset({"DCA", "IAD"})}


def test_regional_names_have_sources():
    data = regional()
    assert "维基" in data["source"]
    for item in [*data["parks"].values(), *data["airports"].values()]:
        assert item["wikidata"].startswith("Q") and item["zhwiki"]


def test_redwood_is_not_called_sequoia():
    # 中文维基把 Redwood 叫“红杉国家公园”，网站里“红杉”是红杉与国王峡谷
    assert "红杉" not in parks()["redw"].aliases
    assert [code for code, _ in find_all("红杉", parks())] == ["seki"]


# 对照表只收 Copilot 要比对的字（代码、提示词、公园和城市名里出现过的）的各地写法，不是完整的繁简字典
@pytest.mark.parametrize("text", ["裏面", "哥倫比亞", "帶着阿媽", "卡特邁"])
def test_hong_kong_glyphs_normalize(text):
    assert not set(normalize(text)) & set("裏倫亞帶媽邁")


@pytest.mark.parametrize("span, days", [
    ("玩五日", 5), ("三日游", 3), ("四日三夜", 4), ("两日一夜", 2), ("一個禮拜", 7),
    ("2027年6月5日去优胜美地玩4天", 4), ("6月1日到5日", None), ("六月十五日", None), ("去日本", None),
])
def test_days_with_ri(span, days):
    assert parse_days(span) == days


def test_cantonese_party_and_pace(make_intake):
    intake = make_intake(extraction(parks=["優勝美地"], dates=["2027年6月1日"], duration="四日", origin="三藩市",
                                    party=["阿爸阿媽", "BB車"], preferences=["唔好太趕"]))
    turn = intake.step("2027年6月1日由三藩市出發去優勝美地玩四日，帶埋阿爸阿媽同BB車，唔好太趕")
    request = turn.request
    assert turn.status == "ready"
    assert request["parks"] == ["yose"] and request["days"] == 4 and request["origin"] == {"airport": "SFO"}
    assert request["pace"] == "relaxed"
    assert request["party"]["seniors"] is True and request["party"]["stroller"] is True


def test_cantonese_yes(make_intake):
    from nps_copilot.intake import yes
    assert yes("系呀") and yes("啱") and yes("冇错") and yes("對")


@pytest.mark.parametrize("span, parts", [
    ("2027 June 8", (2027, 6, 8)), ("8 June 2027", (2027, 6, 8)), ("8th of June 2027", (2027, 6, 8)),
    ("June 8, 2027", (2027, 6, 8)), ("2nd July, 2027", (2027, 7, 2)),
])
def test_english_date_orders(span, parts):
    from nps_copilot.dates import parse_date_spans
    found, _ = parse_date_spans([span])
    assert [(item.year, item.month, item.day) for item in found] == [parts]


def test_rule_fill_accepts_days_with_nights(make_intake):
    # 模型漏了天数：“5天4晚”“四日三夜”是一个说法，可以补；“30天……3天”说法打架，不补
    intake = make_intake(extraction(parks=["锡安"], dates=["2027年5月1日"], origin="拉斯维加斯", preferences=["适中"]))
    assert intake.step("2027年5月1日拉斯维加斯出发去锡安5天4晚，适中").request["days"] == 5
    intake = make_intake(extraction(parks=["锡安"], dates=["2027年5月1日"], origin="拉斯维加斯", preferences=["适中"]))
    assert intake.step("别听前面的30天，2027年5月1日拉斯维加斯出发去锡安3天，适中").status == "needs_input"


def test_chill_pace_and_taiwan_jackson(make_intake):
    intake = make_intake(extraction(parks=["大狄頓國家公園"], dates=["2027年9月10日"], duration="三天", origin="傑克森", preferences=["chill"]))
    request = intake.step("2027年9月10日從傑克森出發，大狄頓國家公園三天，chill 一點").request
    assert request["parks"] == ["grte"] and request["origin"] == {"airport": "JAC"} and request["pace"] == "relaxed"
