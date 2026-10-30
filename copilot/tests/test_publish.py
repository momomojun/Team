"""本机总账发到 GitHub（publish.py）：只换这台机器的那一份，推到 data/alerts-live，没变就不推"""
import json
import subprocess

from nps_copilot import ledger, publish


def git(cwd, *args):
    return subprocess.run(["git", "-C", str(cwd), *args], check=True, capture_output=True, text=True).stdout.strip()


def test_merge_only_replaces_this_machine():
    old = {"machines": {"other": {"updated": "x", "rows": [{"calls": 1}]}, "me": {"updated": "y", "rows": []}}}
    out = publish.merge(old, "me", [{"calls": 5}], "now")
    assert out["machines"]["other"] == old["machines"]["other"]
    assert out["machines"]["me"] == {"updated": "now", "rows": [{"calls": 5}]}
    assert publish.merge({}, "me", [], "now") == {"machines": {"me": {"updated": "now", "rows": []}}}


def test_publish_pushes_to_the_data_branch_and_skips_when_nothing_changed(monkeypatch, tmp_path):
    origin = tmp_path / "origin.git"
    subprocess.run(["git", "init", "-q", "--bare", str(origin)], check=True)
    seed = tmp_path / "seed"
    subprocess.run(["git", "init", "-q", str(seed)], check=True)
    (seed / "usage.json").write_text("{}", encoding="utf-8")
    git(seed, "add", ".")
    git(seed, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "seed")
    git(seed, "push", "-q", str(origin), "HEAD:refs/heads/data/alerts-live")
    repo = tmp_path / "repo"
    subprocess.run(["git", "clone", "-q", str(origin), str(repo)], check=True)

    monkeypatch.setenv("COPILOT_LEDGER", str(tmp_path / "usage"))
    monkeypatch.setenv("COPILOT_MACHINE", "pc1")
    monkeypatch.setenv("COPILOT_SOURCE", "eval")
    ledger.record("ollama", "qwen3.5:4b-q4_K_M", "intake", {"prompt_eval_count": 10, "eval_count": 2}, "p", "o", 900)

    assert "1 次调用" in publish.publish(repo=repo)
    data = json.loads(git(origin, "show", "data/alerts-live:usage-local.json"))
    [row] = data["machines"]["pc1"]["rows"]
    assert row["calls"] == 1 and row["source"] == "eval" and row["list_cost"] > 0  # 本机按电费估，不是 0
    assert git(origin, "show", "data/alerts-live:usage.json") == "{}"  # 每晚的那一份不动
    # 账没变（只是时间不一样）就不推
    before = git(origin, "rev-parse", "data/alerts-live")
    assert publish.publish(repo=repo) == "计费没变，不用发"
    assert git(origin, "rev-parse", "data/alerts-live") == before
    assert len(git(repo, "worktree", "list").splitlines()) == 1  # 临时的 worktree 删掉了
