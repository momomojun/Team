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


def test_drift_a_new_closure_alert_changes_the_plan(tmp_path, monkeypatch):
    """漂移测试：一条新的关闭公告 → 模型提取（写好的输出）+ 规则 → 关闭清单 → 近期出发的行程不再排这个景点，说明里说是公告说的。
    要装 Node 24（和 test_pipeline 一样调真的行程引擎）"""
    from nps_copilot import writer
    from nps_copilot.critic import critique
    from nps_copilot.plan_client import plan_trip

    alert = {"id": "drift-1", "park": "yose", "category": "Park Closure", "title": "Tunnel View Closed for Repaving",
             "description": "Tunnel View and its parking area are closed through November 1, 2026 while crews repave the overlook.",
             "url": "https://www.nps.gov/yose/planyourvisit/conditions.htm"}
    provider = ScriptedProvider([{"type": "full", "closed": [index_of("yose", "yose-tunnel-view")], "from": "", "reopen": "2026-11-02",
                                  "evidence": "Tunnel View and its parking area are closed"}])
    out = alerts.closures_from({"fetched": "2026-10-16", "alerts": [alert]}, provider)
    assert [c["attractions"] for c in out["closures"]] == [["yose-tunnel-view"]]
    assert out["closures"][0]["reopen"] == "2026-11-02" and set(out["closures"][0]["found_by"]) == {"model", "rules"}
    # 标题里写着隧道观景点：规则也找到了，算 strict，行程引擎不排它（只有模型找到的照排、提醒）
    assert out["closures"][0]["strict"] == ["yose-tunnel-view"]
    path = tmp_path / "closures.json"
    path.write_text(__import__("json").dumps(out), encoding="utf-8")
    request = {"contract": "trip-request/v1", "parks": ["yose"], "startDate": "2026-10-20", "days": 3, "origin": {"airport": "FAT"}}
    planned = lambda result: {stop["id"] for day in result["days"] for stop in day["stops"]}  # noqa: E731

    monkeypatch.setenv("COPILOT_LIVE", "0")
    assert "yose-tunnel-view" in planned(plan_trip(request, "2026-10-16").result)
    monkeypatch.delenv("COPILOT_LIVE")
    monkeypatch.setenv("COPILOT_LIVE_CLOSURES", str(path))
    result = plan_trip(request, "2026-10-16").result
    assert "yose-tunnel-view" not in planned(result)
    skipped = next(item for item in result["skipped"] if item["id"] == "yose-tunnel-view")
    assert skipped["alert"]["title"] == alert["title"]
    text = writer.template(request, result, critique(request, result), "zh")
    assert "隧道观景点（NPS 最新公告说暂时关闭，11 月 2 日重开）" in text


def test_nightly_report_lists_only_new_closure_alerts():
    import importlib.util
    from pathlib import Path

    spec = importlib.util.spec_from_file_location("alerts_report", Path(__file__).resolve().parents[1] / "scripts" / "alerts_report.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    info = {**ALERT, "id": "i1", "category": "Information", "title": "Fire restrictions in effect"}
    caution = {**ALERT, "id": "c1", "category": "Caution", "title": "Hetch Hetchy Road Closed at Night"}
    snapshot = {"fetched": "2026-10-20", "alerts": [ALERT, info, caution]}
    new, text = module.report(snapshot, {"c1"})
    assert [a["id"] for a in new] == ["a1"]
    assert "冰川点" in text and "<!-- alert:a1 -->" in text
    # 下一晚：报过的不再报
    assert module.report(snapshot, set(module.MARK.findall(text)) | {"c1"})[0] == []
    assert module.labelled(), "评测集的快照里的公告算报过"
