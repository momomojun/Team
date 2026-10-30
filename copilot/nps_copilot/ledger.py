"""计费总账（10-28 仓库主人：很多 API 用的是免费档，后台看不到用了多少，自己记）。

每次真的调用模型（商业 API、本机 Ollama）都记一行：谁调用的（聊天、读公告、评测、裁判）、哪家哪个型号、做什么、
多少 token、多久。模型没回报 token 数的按字数估（汉字一个算一个 token，别的四个字符算一个），标上 estimated。
回放录音、测试用的假模型不是真的调用，不记。钱不在这里算（价格会变）：monitor.billing 读这本账、按 PRICES 算。

文件：COPILOT_LEDGER（默认 copilot/runs/usage，在 git worktree 里是主目录的那一份，Docker 里是 /data/runs/usage）下按天、按进程各一个 JSONL
（<日期>.<进程号>.jsonl：同时跑两个评测时两个进程往同一个文件追加，Windows 上两行会搅在一起，10-28 碰上过），不进仓库。谁调用的看 COPILOT_SOURCE（各个入口启动时设：chat / alerts / eval / judge），没设是 other。
COPILOT_LEDGER=off 不记（测试里换成临时目录）
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import platform
import re
import threading
from pathlib import Path

_CJK = re.compile(r"[　-〿㐀-鿿＀-￯]")
_lock = threading.Lock()


def folder() -> Path | None:
    value = os.environ.get("COPILOT_LEDGER", "")
    if value == "off":
        return None
    if value:
        return Path(value)
    runs = os.environ.get("COPILOT_RUNS")
    return (Path(runs) if runs else _main_checkout(Path(__file__).resolve().parents[1]) / "runs") / "usage"


def _main_checkout(copilot: Path) -> Path:
    """在 git worktree（<仓库>/.claude/worktrees/<名字>/copilot）里跑评测时，账记到主目录的 copilot/runs：
    后台、stats 读的是主目录那一份，记在 worktree 里看不到（10-29 仓库主人问“之前测过的数据呢”）"""
    parts = copilot.parts
    for i in range(len(parts) - 2):
        if parts[i] == ".claude" and parts[i + 1] == "worktrees":
            main = Path(*parts[:i]) / "copilot"
            if main.is_dir():
                return main
    return copilot


def machine() -> str:
    """这台机器叫什么（后台分清本机服务的账和发到 GitHub 上的是不是同一台的）：COPILOT_MACHINE，没设按电脑名的 hash"""
    return os.environ.get("COPILOT_MACHINE") or hashlib.sha1(platform.node().encode("utf-8")).hexdigest()[:8]


def estimate_tokens(text: str) -> int:
    """没回报 token 数时按字数估：汉字（和全角标点）一个算一个 token，别的大约四个字符一个"""
    cjk = len(_CJK.findall(text))
    return cjk + (len(text) - cjk + 3) // 4


def record(provider: str, model: str, task: str, meta: dict | None, prompt: str, output: str, ms: int) -> None:
    """记一次调用。写不进去（磁盘满、目录没权限）不影响回答"""
    where = folder()
    if where is None:
        return
    meta = meta or {}
    prompt_tokens = meta.get("prompt_tokens", meta.get("prompt_eval_count"))
    output_tokens = meta.get("output_tokens", meta.get("eval_count"))
    estimated = prompt_tokens is None or output_tokens is None
    now = dt.datetime.now().astimezone()
    row = {
        "at": now.isoformat(timespec="seconds"),
        "source": os.environ.get("COPILOT_SOURCE") or "other",
        "provider": provider,
        "model": model,
        "task": task,
        "ms": ms,
        "prompt_tokens": prompt_tokens if prompt_tokens is not None else estimate_tokens(prompt),
        "output_tokens": output_tokens if output_tokens is not None else estimate_tokens(output),
    }
    for key in ("thinking_tokens", "cache_hit_tokens"):
        if meta.get(key):
            row[key] = meta[key]
    if estimated:
        row["estimated"] = True
    try:
        where.mkdir(parents=True, exist_ok=True)
        with _lock, (where / f"{now.date().isoformat()}.{os.getpid()}.jsonl").open("a", encoding="utf-8") as file:
            file.write(json.dumps(row, ensure_ascii=False) + "\n")
    except OSError:
        pass


def load(days: int, where: Path | None = None) -> list[dict]:
    """最近 days 天的账（含今天）；每行加上 day。读不懂的行（写到一半断了的）跳过"""
    where = where or folder()
    if where is None or not where.exists():
        return []
    since = dt.date.today() - dt.timedelta(days=days - 1)
    rows = []
    for path in sorted(where.glob("*.jsonl")):
        day = path.name.split(".")[0]
        try:
            if dt.date.fromisoformat(day) < since:
                continue
        except ValueError:
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            try:
                rows.append({**json.loads(line), "day": day})
            except (json.JSONDecodeError, TypeError):
                continue
    return rows
