"""读 NPS 公告提取临时关闭：模型说了什么、代码怎么核对。用写好的模型输出跑，不要模型、不联网。"""
import datetime as dt

from nps_copilot import alerts
from nps_copilot.providers import ScriptedProvider

TODAY = dt.date(2026, 10, 19)
ALERT = {
    "id": "a1", "park": "yose", "category": "Park Closure",
    "title": "Glacier Point Road Closed October 20–24",
    "description": "Glacier Point Road will be closed to all vehicles from Tuesday, October 20 through October 24, 2026 for paving. "
                   "Visitors may instead visit Tunnel View.",
}


def index_of(park: str, attraction: str) -> int:
    return [row["id"] for row in alerts.attractions()[park]].index(attraction) + 1


def test_dates_mentioned_in_the_text():
    found = alerts.mentioned_dates("closed from Tuesday, October 20 through Oct. 24, 2026; also 11/3/2026", 2026)
    assert {"2026-10-20", "2026-10-24", "2026-11-03"} <= found


def test_model_extraction_is_checked_against_the_alert():
    provider = ScriptedProvider([{"type": "full", "closed": [index_of("yose", "yose-glacier-point")], "from": "2026-10-20",
                                  "reopen": "2026-10-25", "evidence": "Glacier Point Road will be closed to all vehicles"}])
    result = alerts.extract(ALERT, provider, TODAY)
    assert result.type == "full" and result.closed == ["yose-glacier-point"]
    # “through October 24” → 25 日重开，是公告里写到的日期的第二天，算对
    assert (result.start, result.reopen) == ("2026-10-20", "2026-10-25")


def test_made_up_evidence_or_dates_are_not_trusted():
    provider = ScriptedProvider([
        {"type": "full", "closed": [1], "from": "", "reopen": "", "evidence": "The whole park is closed"},
        {"type": "full", "closed": [index_of("yose", "yose-glacier-point")], "from": "2026-10-01", "reopen": "2026-12-01",
         "evidence": "Glacier Point Road will be closed"},
    ])
    invented = alerts.extract(ALERT, provider, TODAY)
    assert invented.type == "none" and invented.closed == [] and invented.trace["dropped"] == "evidence_not_in_alert"
    wrong_dates = alerts.extract(ALERT, provider, TODAY)
    assert wrong_dates.closed == ["yose-glacier-point"] and wrong_dates.start is None and wrong_dates.reopen is None
    assert wrong_dates.trace["dropped_dates"] == [{"from": "2026-10-01"}, {"reopen": "2026-12-01"}]


def test_rules_baseline_reads_the_title_only():
    result = alerts.rules_extract(ALERT)
    assert result.type == "full" and "yose-glacier-point" in result.closed
    partial = alerts.rules_extract({**ALERT, "title": "Overnight closures on Glacier Point Road"})
    assert partial.type == "partial" and partial.closed == []
    info = alerts.rules_extract({**ALERT, "category": "Information", "title": "Fire restrictions in effect"})
    assert info.type == "none"


def test_picked_attraction_must_be_mentioned_and_rules_add_what_the_model_missed():
    old_faithful = index_of("yell", "yell-old-faithful")
    biscuit = {"id": "b1", "park": "yell", "category": "Park Closure", "title": "Biscuit Basin Closed Due to Hydrothermal Explosion",
               "description": "Biscuit Basin and its boardwalks are closed until further notice."}
    provider = ScriptedProvider([{"type": "full", "closed": [old_faithful], "from": "", "reopen": "", "evidence": "Biscuit Basin and its boardwalks are closed"}])
    result = alerts.extract(biscuit, provider, TODAY)
    # 关的是名单里没有的 Biscuit Basin，公告没提老忠实泉：不能算老忠实泉关了
    assert result.type == "full" and result.closed == [] and result.trace["not_mentioned"] == ["yell-old-faithful"]
    model_says_partial = alerts.Extraction("a1", "yose", "partial")
    both = alerts.combined(model_says_partial, alerts.rules_extract(ALERT))
    assert both.type == "full" and "yose-glacier-point" in both.closed and both.trace["found_by"] == ["rules"]
