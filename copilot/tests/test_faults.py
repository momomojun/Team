"""故障测试（GOALS P37）：模型超时、额度用完、服务忙、返回乱码，NPS 公告接口挂了、行程引擎拒绝请求，
Copilot 都要接得住：换下一个模型，或者退回规则，给用户一句清楚的话，不让整轮对话报错。都不联网、不调真模型；
用到行程引擎的要装 Node 24（和 test_pipeline 一样）。混沌测试（一部分调用随机失败，看整套还剩几成）见 eval/conversation.py --chaos"""
import datetime as dt
import json
import shutil

import pytest
from conftest import extraction

from nps_copilot import alerts_live
from nps_copilot.pipeline import Session
from nps_copilot.plan_client import PlanError
from nps_copilot.providers import (FaultyProvider, Metered, ProviderChain, ProviderError, QuotaError, ScriptedProvider,
                                   _json_text)

needs_node = pytest.mark.skipif(shutil.which("node") is None, reason="需要 Node 24")


class Down:
    """所有模型都挂了（额度用完、没网、本机模型也没开）"""
    name = "down"
    model = "down"
    calls = 0

    def complete_json(self, task, system, user, schema):
        self.calls += 1
        raise ProviderError("连不上 API：timed out")


def test_a_model_that_times_out_is_skipped_and_logged():
    backup = ScriptedProvider([extraction(parks=["优胜美地"])])
    chain = Metered(ProviderChain([FaultyProvider(ScriptedProvider([]), rate=1.0), backup]))
    completion = chain.complete_json("intake", "s", "u", {})
    assert completion.data["parks"] == ["优胜美地"]
    [call] = chain.take()
    assert call["model"] == "scripted" and call["fallback_from"] == ["scripted"]


def test_every_kind_of_injected_failure_is_a_provider_error():
    faulty = FaultyProvider(ScriptedProvider([]), rate=1.0)
    errors = []
    for _ in FaultyProvider.KINDS:
        with pytest.raises(ProviderError) as error:
            faulty.complete_json("dispatch", "s", "u", {})
        errors.append(error.value)
    # 额度用完的是 QuotaError（不再重试），其余的是普通的 ProviderError（换下一个、或者重试）
    assert [type(e) is QuotaError for e in errors] == [False, True, False, False]
    assert faulty.failures == ["dispatch"] * 4


def test_a_reply_that_is_not_json_counts_as_a_failure():
    with pytest.raises(ProviderError, match="没有返回 JSON"):
        _json_text("<html><body>502 Bad Gateway</body></html>")
    with pytest.raises(ProviderError, match="不是 JSON 对象"):
        _json_text('["park"]')
    assert _json_text('```json\n{"park": "Zion"}\n```') == {"park": "Zion"}


def test_rate_zero_never_fails_and_the_seed_makes_it_repeatable():
    ok = FaultyProvider(ScriptedProvider([{"a": 1}] * 3), rate=0.0)
    assert [ok.complete_json("intake", "s", "u", {}).data for _ in range(3)] == [{"a": 1}] * 3

    def pattern(seed):
        faulty = FaultyProvider(ScriptedProvider([{"a": 1}] * 50), rate=0.3, seed=seed)
        out = []
        for _ in range(20):
            try:
                faulty.complete_json("intake", "s", "u", {})
                out.append(True)
            except ProviderError:
                out.append(False)
        return out

    assert pattern(7) == pattern(7) and pattern(7) != pattern(8)


@needs_node
def test_every_model_down_the_copilot_still_answers_with_rules():
    """所有模型都出错：调度员退回按规则的流程，摘条件只靠规则读（公园名、天数），缺的照样追问，不报错"""
    down = Down()
    session = Session(down, "2026-10-16", log=False)
    reply = session.send("我想去优胜美地玩3天")
    assert reply.status == "needs_input" and reply.text
    assert reply.trace["route"] == "legacy" and reply.trace["dispatch"]["error"]
    assert "timed out" in reply.trace["intake"]["model_error"]
    assert session.intake.parks.value == ["yose"] and session.intake.days.value == 3
    # 这一轮的每次模型调用都记了出错，监控（stats、后台）看得到
    assert reply.trace["calls"] and all(call.get("error") for call in reply.trace["calls"])
    assert down.calls >= 2


@needs_node
def test_the_trip_engine_refusing_a_request_gives_a_clear_reply(monkeypatch):
    from nps_copilot import pipeline

    def refuse(request, reference_date):
        raise PlanError("行程引擎拒绝了请求", [{"path": "/days", "message": "天数要在 1 到 14 天之间"}])

    monkeypatch.setattr(pipeline, "plan_trip", refuse)
    provider = ScriptedProvider([extraction(parks=["优胜美地"], dates=["2027年6月1日"], duration="4天", origin="弗雷斯诺", preferences=["适中"])])
    session = Session(provider, "2026-10-16", log=False, dispatcher=False)
    reply = session.send("2027年6月1日从弗雷斯诺去优胜美地玩4天，适中")
    assert reply.status == "error" and "天数要在 1 到 14 天之间" in reply.text
    assert reply.trace["plan_error"]["issues"][0]["path"] == "/days"


def test_nps_alerts_api_down_keeps_the_old_closure_list(tmp_path, monkeypatch):
    """聊天时现读公告，NPS 接口挂了：用原来的清单，trace 里写明为什么没读到，排行程不受影响"""
    path = tmp_path / "closures.json"
    path.write_text(json.dumps({"fetched": "2026-10-18", "parks": {"yose": "2026-10-18"}, "closures": []}), encoding="utf-8")

    def offline(parks):
        raise ProviderError("NPS 公告接口连不上或一直限流")

    monkeypatch.setattr(alerts_live, "fetch_alerts", offline)
    info = alerts_live.refresh_for({"parks": ["yose"], "startDate": "2026-10-22", "days": 2}, "2026-10-20", path, tmp_path / "c.json")
    assert info == {"refreshed": False, "why": "error", "error": "NPS 公告接口连不上或一直限流"}
    assert json.loads(path.read_text(encoding="utf-8"))["parks"] == {"yose": "2026-10-18"}


def test_alerts_read_this_morning_are_read_again_in_the_afternoon(tmp_path, monkeypatch):
    """漂移：每晚读过以后，白天新发的关闭公告也要能进清单。以前按“今天读过没有”，要等到第二天夜里；
    现在距上次读超过 REFRESH_HOURS 小时就现读"""
    path, cache = tmp_path / "closures.json", tmp_path / "cache.json"
    night = dt.datetime(2026, 10, 20, 0, 5, tzinfo=dt.timezone.utc)
    path.write_text(json.dumps({"fetched": "2026-10-20", "parks": {"yose": "2026-10-20"}, "readAt": {"yose": night.isoformat()},
                                "closures": []}), encoding="utf-8")
    fetched = []
    monkeypatch.setattr(alerts_live, "fetch_alerts", lambda parks: fetched.append(parks) or [])
    monkeypatch.setattr(alerts_live, "alerts_provider", lambda: ScriptedProvider([]))
    request = {"parks": ["yose"], "startDate": "2026-10-22", "days": 2}
    soon = night + dt.timedelta(hours=alerts_live.REFRESH_HOURS - 1)
    assert alerts_live.refresh_for(request, "2026-10-20", path, cache, now=soon)["why"] == "fresh" and fetched == []
    later = night + dt.timedelta(hours=alerts_live.REFRESH_HOURS + 1)
    assert alerts_live.refresh_for(request, "2026-10-20", path, cache, now=later)["refreshed"] and fetched == [["yose"]]
    assert json.loads(path.read_text(encoding="utf-8"))["readAt"]["yose"] == later.isoformat(timespec="seconds")
