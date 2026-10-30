"""计费总账：真的调用模型才记、没回报 token 的按字数估、按来源和模型汇总、实际付的钱和估算花费（DeepSeek 按北京时间分时段，免费档、本机也估，不写 0）、每晚的那一份并进 usage.json"""
import datetime as dt
import importlib.util
import json
from pathlib import Path

from nps_copilot import ledger, monitor, providers
from nps_copilot.providers import Completion, ReplayProvider, ScriptedProvider


def use_ledger(monkeypatch, tmp_path, source="chat"):
    monkeypatch.setenv("COPILOT_LEDGER", str(tmp_path / "usage"))
    monkeypatch.setenv("COPILOT_SOURCE", source)


def test_a_real_provider_call_is_recorded_with_its_tokens_and_source(monkeypatch, tmp_path):
    use_ledger(monkeypatch, tmp_path, source="alerts")
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    monkeypatch.setattr(providers, "_post", lambda url, body, headers, timeout: {
        "choices": [{"message": {"content": '{"park": "Zion"}'}}], "usage": {"prompt_tokens": 120, "completion_tokens": 9}})
    providers.GroqProvider(model="qwen/qwen3.8-27b", rpm=0).complete_json("alerts", "s", "u", {"type": "object"})
    [row] = ledger.load(1)
    assert row["source"] == "alerts" and row["provider"] == "groq" and row["model"] == "qwen/qwen3.8-27b"
    assert row["prompt_tokens"] == 120 and row["output_tokens"] == 9 and "estimated" not in row
    assert row["day"] == dt.date.today().isoformat()


def test_replayed_and_scripted_answers_are_not_billed(monkeypatch, tmp_path):
    use_ledger(monkeypatch, tmp_path)
    ScriptedProvider([{"park": "Zion"}]).complete_json("intake", "s", "u", {})
    recording = tmp_path / "rec.jsonl"
    key = providers.request_key("intake", "s", "u", {})
    recording.write_text(json.dumps({"key": key, "output": {"park": "Zion"}, "model": "qwen3.5:4b-q4_K_M"}) + "\n", encoding="utf-8")
    ReplayProvider(recording).complete_json("intake", "s", "u", {})
    assert ledger.load(1) == []


def test_missing_token_counts_are_estimated_from_length(monkeypatch, tmp_path):
    use_ledger(monkeypatch, tmp_path)
    ledger.record("ollama", "qwen3.5:4b-q4_K_M", "intake", {}, "去优胜美地玩四天", "abcdefgh", 10)
    [row] = ledger.load(1)
    assert row["estimated"] is True and row["prompt_tokens"] == 8 and row["output_tokens"] == 2
    assert ledger.estimate_tokens("Yosemite 4 天") == 1 + 3  # 一个汉字，另外 11 个字符约 3 个


def test_billing_sums_by_day_source_and_model_with_actual_and_list_prices(monkeypatch, tmp_path):
    rows = [
        {"day": "2026-10-28", "source": "chat", "provider": "gemini", "model": "gemini-3.5-flash-lite", "prompt_tokens": 1_000_000, "output_tokens": 0},
        {"day": "2026-10-28", "source": "chat", "provider": "gemini", "model": "gemini-3.5-flash-lite", "prompt_tokens": 0, "output_tokens": 1_000_000, "estimated": True},
        {"day": "2026-10-28", "source": "eval", "provider": "deepseek", "model": "deepseek-flash", "prompt_tokens": 1_000_000, "output_tokens": 0},
        {"day": "2026-10-28", "source": "eval", "provider": "openrouter", "model": "someone/new-model:free", "prompt_tokens": 10, "output_tokens": 10},
    ]
    out = {(row["source"], row["model"]): row for row in monitor.billing(rows)["rows"]}
    gemini = out[("chat", "gemini-3.5-flash-lite")]
    # 免费档实际花 0，按付费标价是 0.30 + 2.50 美元
    assert gemini["calls"] == 2 and gemini["estimated"] == 1 and gemini["cost"] == 0
    assert abs(gemini["list_cost"] - 2.80) < 1e-9
    deepseek = out[("eval", "deepseek-flash")]
    assert deepseek["cost"] == deepseek["list_cost"] > 0
    # 没有付费版的免费模型：实际 0，估算按同类模型的价，不写 0
    new = out[("eval", "someone/new-model:free")]
    assert new["cost"] == 0 and new["unlisted"] == 0 and new["list_cost"] > 0
    assert any(limit["id"] == "openrouter-free" and limit["requests"] for limit in monitor.billing(rows)["limits"])


def test_deepseek_is_priced_in_yuan_by_beijing_time_and_cache_hits():
    # 10-28 评测的 268 次合起来：DeepSeek 后台扣了 ¥0.13
    call = {"model": "deepseek-flash", "prompt_tokens": 239_312, "cache_hit_tokens": 158_720, "output_tokens": 12_185,
            "at": "2026-10-28T21:23:11-07:00"}  # 北京时间周四 12:23，午休是空闲时段
    assert not monitor.deepseek_peak(call["at"])
    assert abs(monitor.deepseek_cost(call) * monitor.CNY_PER_USD - 0.1325) < 1e-3
    # 北京时间周四 10:00 是高峰，贵一倍；周六全天空闲；不知道时间按高峰
    assert monitor.deepseek_peak("2026-10-29T10:00:00+08:00")
    assert not monitor.deepseek_peak("2026-10-31T10:00:00+08:00")
    assert monitor.deepseek_peak(None)
    peak = {**call, "at": "2026-10-29T10:00:00+08:00"}
    assert abs(monitor.deepseek_cost(peak) - 2 * monitor.deepseek_cost(call)) < 1e-12


def test_free_and_local_models_get_an_estimate_instead_of_zero():
    # 本机：250 瓦跑一小时约 0.25 度电，每度 0.17 美元
    assert abs(monitor.estimate_cost({"model": "qwen3.5:4b-q4_K_M", "ms": 3_600_000}) - 0.0425) < 1e-9
    # 免费档按付费档的标价
    gemini = {"model": "gemini-3.5-flash-lite", "prompt_tokens": 1_000_000, "output_tokens": 0}
    assert monitor.call_cost(gemini) == 0 and abs(monitor.estimate_cost(gemini) - 0.30) < 1e-9
    assert monitor.estimate_cost({"model": "dots-studio/dots-3-note-preview:free", "prompt_tokens": 1_000_000}) > 0
    assert monitor.estimate_cost({"model": "who-knows", "prompt_tokens": 10}) is None


def test_publishing_replaces_tonights_days_and_keeps_ninety_days():
    spec = importlib.util.spec_from_file_location("publish_usage", Path(__file__).resolve().parents[1] / "scripts" / "publish_usage.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    today = dt.date(2026, 10, 28)
    old = [
        {"day": "2026-07-01", "source": "alerts", "model": "m", "calls": 1},
        {"day": "2026-10-27", "source": "alerts", "model": "m", "calls": 3},
        {"day": "2026-10-28", "source": "alerts", "model": "m", "calls": 5},
    ]
    tonight = [{"day": "2026-10-28", "source": "alerts", "model": "m", "calls": 7}]
    merged = module.merge(old, tonight, today)
    assert [(row["day"], row["calls"]) for row in merged] == [("2026-10-27", 3), ("2026-10-28", 7)]
    assert isinstance(Completion(data={}, model="x", latency_ms=0), Completion)


def test_a_worktree_records_into_the_main_checkout(tmp_path):
    main = tmp_path / "Team" / "copilot"
    tree = tmp_path / "Team" / ".claude" / "worktrees" / "referee" / "copilot"
    main.mkdir(parents=True)
    tree.mkdir(parents=True)
    assert ledger._main_checkout(tree) == main
    assert ledger._main_checkout(main) == main
    # 主目录不在（单独拷出来的 worktree）就还记在自己这里
    lone = tmp_path / "x" / ".claude" / "worktrees" / "a" / "copilot"
    lone.mkdir(parents=True)
    assert ledger._main_checkout(lone) == lone
