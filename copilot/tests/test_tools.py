"""查询工具（tools.py）：认问题要查什么、哪个地方哪一天；结果写成给模型看的几行。调 Node 的那一步按需真跑（不联网）"""
import datetime as dt
import shutil

import pytest

from nps_copilot import tools

REF = dt.date(2026, 10, 21)
TRIP = {"days": [
    {"day": 1, "date": "2026-11-05", "lodging": {"id": "yose-stay-el-portal", "nameZh": "El Portal"},
     "stops": [{"id": "yose-tunnel-view"}]},
    {"day": 2, "date": "2026-11-06", "lodging": {"id": "yose-stay-el-portal", "nameZh": "El Portal"},
     "stops": [{"id": "yose-glacier-point"}]},
]}


def plan(question, parks=("yose",), request=None, result=None):
    return tools.plan_requests(question, list(parks), request, result, REF)[0]


def test_open_question_with_a_date_asks_is_open_for_that_day():
    [request] = plan("1月15号 Tioga Road 开着吗")
    assert request["tool"] == "is_open" and request["date"] == "2027-01-15"
    # 只说了月份：按那个月 15 号
    [request] = plan("冰川点 12 月能去吗")
    assert request == {**request, "attraction": "yose-glacier-point", "date": "2026-12-15"}


def test_open_question_without_a_date_uses_the_day_it_is_scheduled():
    [request] = plan("冰川点开着吗", result=TRIP)
    assert request["date"] == "2026-11-06" and "第 2 天" in request["_how"]
    [request] = plan("第1天冰川点开着吗", result=TRIP)
    assert request["date"] == "2026-11-05"


def test_relative_dates_count_from_today():
    [request] = plan("下周六冰川点开吗")
    assert request["date"] == "2026-10-31"


def test_drive_question_between_two_places():
    [request] = plan("从 El Portal 开到隧道观景点要多久")
    assert request == {"tool": "drive_time", "from": "yose-stay-el-portal", "to": "yose-tunnel-view"}


def test_drive_question_about_one_stop_starts_from_that_nights_lodging():
    [request] = plan("冰川点开车要多久", result=TRIP)
    assert request["from"] == "yose-stay-el-portal" and request["to"] == "yose-glacier-point"


def test_drive_question_from_the_airport_uses_the_trip_origin():
    [request] = plan("从机场到隧道观景点多远", request={"origin": {"airport": "FAT"}})
    assert request["from"] == "FAT" and request["to"] == "yose-tunnel-view"


def test_one_lodging_alone_is_left_to_the_lodging_notes():
    # 住处的资料里写着到山谷多远；工具按公园定位点算的数对不上，不查
    assert plan("El Portal是什么地方，离园区多远啊") == []


def test_search_question_collects_conditions():
    [request] = plan("锡安有哪些适合6岁孩子、不用抽签的简单步道", parks=("zion",))
    assert request["tool"] == "search" and request["parks"] == ["zion"]
    assert request["kinds"] == ["hike"] and request["noPermit"] and request["difficulty"] == ["easy"]
    assert request["party"]["youngestKid"] == 6
    [request] = plan("5公里以内的步道推荐几条")
    assert request["maxMiles"] == pytest.approx(3.1)


def test_plain_questions_do_not_call_tools():
    assert plan("火瀑是什么") == []
    assert plan("El Portal 是什么地方") == []


def test_format_lines_reads_like_the_answer():
    requests = [{"tool": "is_open", "date": "2027-01-15", "_how": "原话里的日期"},
                {"tool": "drive_time"}, {"tool": "drive_time"}, {"tool": "search"}, {"tool": "is_open"}]
    results = [
        {"tool": "is_open", "road": {"nameZh": "Tioga Road", "nameEn": "Tioga Road"}, "date": "2027-01-15", "verdict": "unlikely",
         "facts": [{"zh": "有记录的 20 年里，有 0 年这一天是通车的", "en": "open on this date in 0 of 20 years"}]},
        {"tool": "drive_time", "from": {"nameZh": "El Portal"}, "to": {"nameZh": "隧道观景点"}, "minutes": 95},
        {"tool": "drive_time", "from": {"nameZh": "乌伊卡胡纳"}, "to": {"nameZh": "隧道观景点"}, "minutes": None},
        {"tool": "search", "total": 12, "results": [
            {"nameZh": "河滨步道", "hike": {"miles": 2.2, "difficulty": "easy"}},
            {"nameZh": "天使降临", "hike": {"miles": 5.4, "difficulty": "hard"}, "permit": "lottery", "caution": True}]},
        {"tool": "is_open", "error": "unknown_attraction"},
    ]
    lines = tools.format_lines(requests, results, True)
    assert lines[0].startswith("- Tioga Road 2027-01-15（原话里的日期）：多半去不了") and "0 年" in lines[0]
    assert "1 小时 35 分钟" in lines[1]
    assert "不通公路" in lines[2]
    assert "找到 12 个" in lines[3] and "来回约 3.5 公里" in lines[3] and "要抽签" in lines[3]
    assert len(lines) == 4  # 出错的不写


def test_lookup_survives_a_broken_tool(monkeypatch):
    def broken(requests):
        raise OSError("node 不在")

    monkeypatch.setattr(tools, "call", broken)
    found = tools.lookup("1月15号 Tioga Road 开着吗", ["yose"], None, None, "2026-10-21", True)
    assert found.requests and found.lines == [] and "node" in found.trace["error"]


@pytest.mark.skipif(shutil.which("node") is None, reason="要 Node 跑网站的查询工具")
def test_lookup_end_to_end_with_the_site_tool():
    found = tools.lookup("1月15号 Tioga Road 开着吗", ["yose"], None, None, "2026-10-21", True)
    assert found.lines and "多半去不了" in found.lines[0] and "0 年" in found.lines[0]
    found = tools.lookup("从 El Portal 开到隧道观景点要多久", ["yose"], None, None, "2026-10-21", True)
    assert found.lines and "开车约" in found.lines[0]
