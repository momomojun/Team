"""发版和回滚要靠的部分：提示词版本切换、运行日志统计、/health 报出来的版本。"""
import datetime as dt
import json

import pytest

from nps_copilot import __version__, monitor, prompts
from nps_copilot.pipeline import VERSION


def test_default_prompts_exist_and_are_lf():
    for task in prompts.TASKS:
        prompt = prompts.load(task)
        assert prompt.version == prompts.defaults()[task]
        assert prompt.version in prompts.available(task)
        assert "\r" not in prompt.text


def test_env_switches_prompt_version(monkeypatch):
    default = prompts.load("intake")
    monkeypatch.setenv("COPILOT_PROMPT_INTAKE", "v2")
    switched = prompts.load("intake")
    assert switched.id == "intake/v2" and switched.sha != default.sha
    assert "intake/v2" in prompts.current()
    # 回滚：去掉环境变量就回到 defaults.json 里的版本
    monkeypatch.delenv("COPILOT_PROMPT_INTAKE")
    assert prompts.load("intake").sha == default.sha


def test_unknown_prompt_version_fails_loudly(monkeypatch):
    monkeypatch.setenv("COPILOT_PROMPT_WRITER", "v99")
    with pytest.raises(ValueError, match="v99"):
        prompts.load("writer")


def test_versions_sort_numerically():
    assert prompts.available("intake")[:2] == ["v1", "v2"]


def test_version_string_matches_package():
    assert VERSION == f"copilot/{__version__}"


def row(session, status, prompt="intake/v1", **extra):
    return {"session": session, "version": VERSION, "prompts": {prompt: "x", "writer/v1": "y"}, "status": status,
            "latency_ms": extra.pop("latency_ms", 1000), "intake": extra.pop("intake", {}), **extra}


def test_monitor_groups_by_prompt_version(tmp_path):
    today = dt.date.today().isoformat()
    old = (dt.date.today() - dt.timedelta(days=30)).isoformat()
    rows = [
        row("a", "needs_input"), row("a", "planned", writer={"prompt": "writer/v1", "fallback": "unfaithful"}),
        row("b", "error", intake={"dropped_spans": ["x", "y"], "rule_filled": ["days"]}),
        row("c", "planned", prompt="intake/v2", latency_ms=3000),
    ]
    (tmp_path / f"{today}.jsonl").write_text("\n".join(json.dumps(r) for r in rows) + "\n", encoding="utf-8")
    (tmp_path / f"{old}.jsonl").write_text(json.dumps(row("z", "planned")) + "\n", encoding="utf-8")
    (tmp_path / "notes.jsonl").write_text("not json\n", encoding="utf-8")

    loaded = monitor.load(7, tmp_path)
    assert len(loaded) == 4  # 30 天前的和名字不是日期的文件都不读
    summary = monitor.summarize(loaded)
    v1 = summary[f"{VERSION} · intake/v1 writer/v1"]
    assert (v1["turns"], v1["sessions"], v1["planned"], v1["needs_input"], v1["error"]) == (3, 2, 1, 1, 1)
    assert (v1["dropped_spans"], v1["rule_fills"], v1["writer_model"], v1["writer_fallback"]) == (2, 1, 1, 1)
    assert summary[f"{VERSION} · intake/v2 writer/v1"]["median_latency_ms"] == 3000
    assert "intake/v2" in monitor.report(7, tmp_path)


def test_monitor_adds_up_tokens_and_cost_by_the_model_that_answered(tmp_path):
    today = dt.date.today().isoformat()
    calls = [
        {"task": "dispatch", "model": "gemini-3.5-flash-lite", "error": "API 出错（429）"},
        {"task": "dispatch", "model": "gpt-4.1-mini", "prompt_tokens": 1_000_000, "output_tokens": 500_000, "fallback_from": ["gemini-3.5-flash-lite"]},
        {"task": "intake", "model": "gemini-3.5-flash-lite", "prompt_tokens": 800, "output_tokens": 40, "thinking_tokens": 12},
        {"task": "intake", "model": "mystery-model", "prompt_tokens": 10, "output_tokens": 5},
    ]
    rows = [row("a", "planned", calls=calls, plan={"alerts": {"read": 3}}), row("b", "planned")]  # 旧日志没有 calls
    (tmp_path / f"{today}.jsonl").write_text("\n".join(json.dumps(r) for r in rows) + "\n", encoding="utf-8")
    used = monitor.usage(monitor.load(7, tmp_path))
    assert used["turns"] == 1 and used["alerts_read"] == 3
    gpt, gemini = used["models"]["gpt-4.1-mini"], used["models"]["gemini-3.5-flash-lite"]
    assert gpt["calls"] == 1 and gpt["fallback_to"] == 1 and abs(gpt["cost"] - 1.2) < 1e-9  # 0.40 + 0.5 × 1.60
    assert gemini["calls"] == 1 and gemini["errors"] == 1 and gemini["thinking_tokens"] == 12
    # 免费档的花费按付费档的价估，不写 0：800 × 0.30 + (40 + 12) × 2.50，每百万 token
    assert abs(gemini["cost"] - 0.00037) < 1e-12
    assert used["models"]["mystery-model"]["unpriced"] == 1  # 估不了的不当成 0
    assert abs(used["days"][today] - 1.20037) < 1e-9
    text = monitor.report(7, tmp_path)
    assert "gpt-4.1-mini：1 次（其中前面的模型出错、轮到它的 1 次）" in text and "不知道（没有价格）" in text


def test_monitor_daily_and_recent_for_the_admin_page(tmp_path):
    today = dt.date.today().isoformat()
    calls = [{"task": "dispatch", "model": "gpt-4.1-mini", "prompt_tokens": 100, "output_tokens": 10, "fallback_from": ["gemini-3.5-flash-lite"]},
             {"task": "intake", "model": "gemini-3.5-flash-lite", "error": "429"}]
    rows = [row("a", "planned", calls=calls, message="去优胜美地" * 40), row("a", "needs_input", latency_ms=3000)]
    (tmp_path / f"{today}.jsonl").write_text("\n".join(json.dumps(r) for r in rows) + "\n", encoding="utf-8")
    loaded = monitor.load(7, tmp_path)
    [day] = monitor.daily(loaded)
    assert (day["day"], day["turns"], day["planned"], day["needs_input"]) == (today, 2, 1, 1)
    assert (day["calls"], day["call_errors"], day["fallbacks"], day["tokens"]) == (1, 1, 1, 110)
    newest, oldest = monitor.recent(loaded)
    assert newest["status"] == "needs_input" and oldest["fallback"] and oldest["models"] == ["gpt-4.1-mini"]
    assert len(oldest["message"]) == 120


def test_monitor_without_logs(tmp_path):
    assert "没有运行日志" in monitor.report(7, tmp_path)
