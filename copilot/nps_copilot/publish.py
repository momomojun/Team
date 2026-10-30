"""把这台机器的计费总账发到 GitHub，线上的后台（Vercel，读不到本机）也看得到（10-29 仓库主人：线上线下要一致）。

data/alerts-live 分支的 usage-local.json：{"machines": {<机器>: {"updated", "rows"}}}，每台机器一份，只换自己那一份。
rows 是 monitor.billing 的汇总（每天、谁调用的、哪个模型的次数、token、花费），没有原话、没有 key。
每晚 GitHub 上读公告的那一份在同一个分支的 usage.json，不在这里。

  python -m nps_copilot billing --publish      # 手动发一次
  COPILOT_PUBLISH_USAGE=1 python -m nps_copilot serve   # 开着服务时每小时发一次（start.cmd 设了）

要能推 git（用这台电脑上 git 的登录）；推不上去只打一行提示，不影响别的
"""
from __future__ import annotations

import datetime as dt
import json
import subprocess
import tempfile
import threading
import time
from pathlib import Path

from . import ledger, monitor

BRANCH = "data/alerts-live"
FILE = "usage-local.json"
KEEP_DAYS = 90


def merge(old: dict, machine: str, rows: list[dict], now: str) -> dict:
    """只换这台机器的那一份，别的机器的照旧"""
    machines = dict((old or {}).get("machines") or {})
    machines[machine] = {"updated": now, "rows": rows}
    return {"machines": machines}


def _git(repo: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True, encoding="utf-8", check=check)


def repo_root() -> Path:
    """仓库主目录（在 worktree 里也是主目录，和总账同一处）"""
    folder = ledger.folder()
    return (folder.parents[2] if folder else Path(__file__).resolve().parents[2])


def publish(days: int = KEEP_DAYS, repo: Path | None = None, attempts: int = 3) -> str:
    """汇总最近 days 天的账、推到 data/alerts-live 的 usage-local.json；返回一行说明。和每晚的 workflow 同时推撞上了就重试"""
    repo = repo or repo_root()
    rows = monitor.billing(ledger.load(days))["rows"]
    machine = ledger.machine()
    now = dt.datetime.now().astimezone().isoformat(timespec="seconds")
    for attempt in range(attempts):
        if _git(repo, "fetch", "-q", "origin", BRANCH, check=False).returncode:
            return f"计费没发出去：git fetch {BRANCH} 失败"
        with tempfile.TemporaryDirectory() as temp:
            tree = Path(temp) / "data"
            _git(repo, "worktree", "add", "-q", "--detach", str(tree), f"origin/{BRANCH}")
            try:
                target = tree / FILE
                old = json.loads(target.read_text(encoding="utf-8")) if target.exists() else {}
                if ((old.get("machines") or {}).get(machine) or {}).get("rows") == rows:
                    return "计费没变，不用发"
                target.write_text(json.dumps(merge(old, machine, rows, now), ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
                _git(tree, "add", FILE)
                _git(tree, "-c", "user.name=nps-copilot", "-c", "user.email=nps-copilot@users.noreply.github.com",
                     "commit", "-q", "-m", f"本机计费总账 {machine} / Local billing ledger {machine}")
                if not _git(tree, "push", "-q", "origin", f"HEAD:{BRANCH}", check=False).returncode:
                    return f"计费发到了 {BRANCH}/{FILE}：{sum(row['calls'] for row in rows)} 次调用（这台机器 {machine}）"
            finally:
                _git(repo, "worktree", "remove", "--force", str(tree), check=False)
        time.sleep(2 * (attempt + 1))
    return f"计费没发出去：推 {BRANCH} 失败了 {attempts} 次"


def start_hourly() -> None:
    """服务开着时每小时发一次（账没变就不推）"""
    def loop() -> None:
        while True:
            try:
                print(publish(), flush=True)
            except Exception as error:  # 发不出去不影响服务
                print(f"计费没发出去：{error}", flush=True)
            time.sleep(3600)

    threading.Thread(target=loop, daemon=True, name="publish-usage").start()
