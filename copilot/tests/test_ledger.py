"""计费总账：真的调用模型才记、没回报 token 的按字数估、按来源和模型汇总、实际花费和按标价折算、每晚的那一份并进 usage.json"""
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
    # 新冒出来的免费模型：实际 0，没有付费版的标价，不当成 0
    new = out[("eval", "someone/new-model:free")]
    assert new["cost"] == 0 and new["unlisted"] == 1
    assert any(limit["id"] == "openrouter-free" and limit["requests"] for limit in monitor.billing(rows)["limits"])
    # 本机模型不收钱
    assert monitor.list_price("qwen3.5:4b-q4_K_M") == (0.0, 0.0)


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
