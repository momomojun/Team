"""部署到 Modal 以后核对 /health（deploy/modal/check_health.py）"""
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("check_health", Path(__file__).resolve().parents[2] / "deploy" / "modal" / "check_health.py")
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)

GOOD = {"version": "copilot/0.4.0", "build": "94690ae", "provider": "chain", "auth": True}


def test_a_healthy_release_passes():
    assert check.problems(GOOD, "copilot-v0.4.0") == []
    assert check.problems(GOOD, "main-94690ae") == []


def test_wrong_version_or_commit_fails():
    assert check.problems(GOOD, "copilot-v0.3.0")
    assert check.problems(GOOD, "main-abc1234")


def test_broken_model_config_or_missing_token_fails():
    assert check.problems({**GOOD, "provider": None, "error": "COPILOT_STEP_MODELS 看不懂"}, "copilot-v0.4.0")
    assert check.problems({**GOOD, "auth": False}, "copilot-v0.4.0")
    assert check.problems({**GOOD, "build": None}, "staging")
