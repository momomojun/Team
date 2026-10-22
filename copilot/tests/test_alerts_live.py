"""公告“只读新的”和“聊天时现读”：用写好的模型输出和假的公告接口，不联网"""
import datetime as dt
import json

from nps_copilot import alerts, alerts_live
from nps_copilot.providers import ProviderError, ScriptedProvider

TODAY = dt.date(2026, 10, 20)
TUNNEL = {"id": "t1", "park": "yose", "category": "Park Closure", "title": "Tunnel View Closed for Repaving", "updated": "2026-10-20 08:00:00.0",
          "description": "Tunnel View and its parking area are closed through November 1, 2026.", "url": "https://www.nps.gov/yose/"}
INFO = {"id": "i1", "park": "yose", "category": "Information", "title": "Bears are active", "updated": "2026-10-01 08:00:00.0",
        "description": "Store food properly."}


def tunnel_reply():
    index = [row["id"] for row in alerts.attractions()["yose"]].index("yose-tunnel-view") + 1
    return {"type": "full", "closed": [index], "from": "", "reopen": "2026-11-02", "evidence": "Tunnel View and its parking area are closed"}


def none_reply():
    return {"type": "none", "closed": [], "from": "", "reopen": "", "evidence": "Bears are active"}


def test_only_new_or_changed_alerts_go_to_the_model():
    cache = {}
    provider = ScriptedProvider([tunnel_reply(), none_reply()])
    closures, stats = alerts_live.read_alerts([TUNNEL, INFO], provider, TODAY, cache)
    assert stats == {"read": 2, "cached": 0, "rules_only": 0}
    assert [c["attractions"] for c in closures] == [["yose-tunnel-view"]] and closures[0]["reopen"] == "2026-11-02"
    # 第二晚：都没改过，一次模型都不调
    closures, stats = alerts_live.read_alerts([TUNNEL, INFO], ScriptedProvider([]), TODAY, cache)
    assert stats == {"read": 0, "cached": 2, "rules_only": 0} and len(closures) == 1
    # 公告改过（更新时间变了）：只读这一条
    changed = {**TUNNEL, "updated": "2026-10-21 09:00:00.0"}
    _, stats = alerts_live.read_alerts([changed, INFO], ScriptedProvider([tunnel_reply()]), TODAY, cache)
    assert stats == {"read": 1, "cached": 1, "rules_only": 0}


def test_model_errors_fall_back_to_rules_and_are_retried_next_time():
    class Broken:
        name = "broken"

        def complete_json(self, *args):
            raise ProviderError("今天的免费额度用完了")

    cache = {}
    closures, stats = alerts_live.read_alerts([TUNNEL], Broken(), TODAY, cache)
    assert stats["rules_only"] == 1 and cache == {}
    # 规则也认得标题里写着的隧道观景点
    assert closures[0]["found_by"] == ["rules"] and "yose-tunnel-view" in closures[0]["attractions"]
    _, stats = alerts_live.read_alerts([TUNNEL], ScriptedProvider([tunnel_reply()]), TODAY, cache)
    assert stats["read"] == 1


def test_chat_time_refresh_reads_only_the_trip_parks_and_merges(tmp_path, monkeypatch):
    path, cache = tmp_path / "closures.json", tmp_path / "cache.json"
    old = {"fetched": "2026-10-18", "parks": {"yose": "2026-10-18", "zion": "2026-10-18"},
           "closures": [{"alert": "z1", "park": "zion", "attractions": ["zion-watchman-trail"], "title": "Watchman closed"},
                        {"alert": "y0", "park": "yose", "attractions": ["yose-glacier-point"], "title": "old yose alert"}]}
    path.write_text(json.dumps(old), encoding="utf-8")
    fetched = []
    monkeypatch.setattr(alerts_live, "fetch_alerts", lambda parks: fetched.append(parks) or [TUNNEL])
    monkeypatch.setattr(alerts_live, "alerts_provider", lambda chat=False: ScriptedProvider([tunnel_reply()]))
    request = {"parks": ["yose"], "startDate": "2026-10-25", "days": 3}
    info = alerts_live.refresh_for(request, "2026-10-20", path, cache)
    assert info["refreshed"] and info["parks"] == ["yose"] and fetched == [["yose"]]
    out = json.loads(path.read_text(encoding="utf-8"))
    assert out["parks"]["yose"] == "2026-10-20" and out["parks"]["zion"] == "2026-10-18"
    # 优胜美地换成今天读的，锡安的原样留着
    assert sorted(c["alert"] for c in out["closures"]) == ["t1", "z1"]
    # 今天已经读过：不再抓
    assert alerts_live.refresh_for(request, "2026-10-20", path, cache) == {"refreshed": False, "why": "fresh"}
    # 两周以后出发、只定了月份：不抓
    assert alerts_live.refresh_for({**request, "startDate": "2026-12-01"}, "2026-10-20", path, cache)["why"] == "too-far"
    assert alerts_live.refresh_for({"parks": ["yose"], "month": 11, "days": 3}, "2026-10-20", path, cache)["why"] == "month-only"


def test_chat_time_refresh_failure_keeps_the_old_list(tmp_path, monkeypatch):
    path = tmp_path / "closures.json"
    path.write_text(json.dumps({"fetched": "2026-10-18", "closures": []}), encoding="utf-8")

    def offline(parks):
        raise ProviderError("NPS 公告接口连不上或一直限流")

    monkeypatch.setattr(alerts_live, "fetch_alerts", offline)
    info = alerts_live.refresh_for({"parks": ["yose"], "startDate": "2026-10-22", "days": 2}, "2026-10-20", path, tmp_path / "c.json")
    assert info["why"] == "error" and json.loads(path.read_text(encoding="utf-8"))["fetched"] == "2026-10-18"


def test_status_for_the_admin_page(tmp_path, monkeypatch):
    monkeypatch.setattr(alerts_live, "CLOSURES", tmp_path / "closures-latest.json")
    monkeypatch.setattr(alerts_live, "CACHE", tmp_path / "extracted.json")
    assert alerts_live.status() == {"closures_file": False, "cache_entries": 0}
    (tmp_path / "closures-latest.json").write_text(json.dumps({
        "fetched": "2026-10-19", "prompts": {"alerts": "alerts/v1"}, "parks": {"yose": "2026-10-19", "zion": "2026-10-17"},
        "closures": [{"found_by": ["model", "rules"], "strict": ["x"]}, {"found_by": ["model"], "strict": []}]}), encoding="utf-8")
    (tmp_path / "extracted.json").write_text(json.dumps({"a": {}, "b": {}, "c": {}}), encoding="utf-8")
    got = alerts_live.status()
    assert (got["fetched"], got["closures"], got["strict"], got["model_only"]) == ("2026-10-19", 2, 1, 1)
    assert (got["parks"], got["oldest_park"], got["cache_entries"], got["prompts"]) == (2, "2026-10-17", 3, "alerts/v1")


def test_chat_time_reading_waits_only_so_long():
    # 聊天时现读：几条同时读，到点还没读完的按规则算、不进缓存（下次再读）；读完的照常进缓存
    import threading
    import time

    from nps_copilot.providers import Completion

    release = threading.Event()

    class SlowOnInfo:
        name = "slow"

        def complete_json(self, task, system, user, schema):
            if "Bears" in user:
                release.wait(2)  # 这一条要等很久
                return Completion(data=none_reply(), model="slow", latency_ms=2000)
            return Completion(data=tunnel_reply(), model="slow", latency_ms=10)

    cache = {}
    start = time.monotonic()
    closures, stats = alerts_live.read_alerts([TUNNEL, INFO], SlowOnInfo(), TODAY, cache, budget=0.5)
    release.set()
    assert time.monotonic() - start < 1.5
    assert stats["read"] == 1 and stats["rules_only"] == 1 and stats["late"] == 1
    assert [c["attractions"] for c in closures] == [["yose-tunnel-view"]]
    assert len(cache) == 1  # 没读完的那条下次再读
