"""每晚抽查读公告的模型（eval/alerts.py --chain --sample 26 --gate eval/baseline-alerts-canary.json）"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "eval"))

import alerts as alerts_eval  # noqa: E402

from nps_copilot import alerts_live  # noqa: E402
from nps_copilot.providers import ReplayProvider  # noqa: E402

EVAL = Path(__file__).resolve().parents[1] / "eval"
RECORDING = EVAL / "recordings" / "minimax_minimax-m3.1-flash_free-alerts-2026-10-19-sample26-high.jsonl"


def run(monkeypatch, *argv):
    monkeypatch.setattr(sys, "argv", ["alerts.py", *argv])
    return alerts_eval.main()


def test_canary_uses_the_live_chain_and_passes_the_gate(monkeypatch, tmp_path):
    # 线上那串模型换成 10-20 录好的 MiniMax（推理开 high）：同一批 26 条，门槛应该过
    monkeypatch.setattr(alerts_live, "alerts_provider", lambda: ReplayProvider(RECORDING))
    monkeypatch.setattr(alerts_eval, "HERE", tmp_path)
    assert run(monkeypatch, "--chain", "--sample", "26", "--gate", str(EVAL / "baseline-alerts-canary.json")) == 0
    summary = json.loads((tmp_path / "reports" / "canary-latest.json").read_text(encoding="utf-8"))
    assert summary["alerts"] == 26
    assert summary["type_accuracy"] >= 0.8


def test_canary_gate_fails_when_the_model_gets_worse(monkeypatch, tmp_path):
    # 门槛抬到满分：同样的录音就过不了，工作流据此开 alerts-quality issue
    gate = tmp_path / "gate.json"
    gate.write_text(json.dumps({"type_accuracy": 1.0, "attraction_f1": 1.0}), encoding="utf-8")
    monkeypatch.setattr(alerts_live, "alerts_provider", lambda: ReplayProvider(RECORDING))
    monkeypatch.setattr(alerts_eval, "HERE", tmp_path)
    assert run(monkeypatch, "--chain", "--sample", "26", "--gate", str(gate)) == 1


def test_canary_without_models_says_so(monkeypatch, tmp_path):
    monkeypatch.setattr(alerts_live, "alerts_provider", lambda: None)
    monkeypatch.setattr(alerts_eval, "HERE", tmp_path)
    assert run(monkeypatch, "--chain", "--sample", "26") == 2
