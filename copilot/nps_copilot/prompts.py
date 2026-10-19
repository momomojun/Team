"""提示词版本：prompts/<任务>_v<n>.txt，用哪一版写在 prompts/defaults.json。

- 改提示词不覆盖旧文件，新建下一版（intake_v2.txt），旧版留着才能回滚、才能和旧的评测记录对上；
- 默认用哪一版走 PR 改 defaults.json（CI 会用回放门禁检查）；
- 已经部署的服务可以不改代码临时切回旧版：环境变量 COPILOT_PROMPT_INTAKE=v1、COPILOT_PROMPT_WRITER=v1、COPILOT_PROMPT_QA=v1、COPILOT_PROMPT_DISPATCH=v1；
- 每次调用的日志里都记版本和 hash（pipeline.prompt_hashes）。
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

DIR = Path(__file__).resolve().parent / "prompts"
TASKS = ("intake", "writer", "qa", "dispatch")


@dataclass(frozen=True)
class Prompt:
    task: str
    version: str
    text: str

    @property
    def id(self) -> str:
        return f"{self.task}/{self.version}"

    @property
    def sha(self) -> str:
        return hashlib.sha256(self.text.encode("utf-8")).hexdigest()[:12]


@lru_cache(maxsize=1)
def defaults() -> dict[str, str]:
    return json.loads((DIR / "defaults.json").read_text(encoding="utf-8"))


def available(task: str) -> list[str]:
    return sorted((m.group(1) for path in DIR.glob(f"{task}_v*.txt") if (m := re.fullmatch(rf"{task}_(v\d+)\.txt", path.name))),
                  key=lambda version: int(version[1:]))


def version(task: str) -> str:
    chosen = os.environ.get(f"COPILOT_PROMPT_{task.upper()}") or defaults()[task]
    if chosen not in available(task):
        raise ValueError(f"没有 {task} 的提示词 {chosen}（有 {', '.join(available(task))}）")
    return chosen


def load(task: str) -> Prompt:
    chosen = version(task)
    # Windows 上 git 可能把换行转成 CRLF；统一成 LF，回放的 key 才和 CI 上一样
    text = (DIR / f"{task}_{chosen}.txt").read_text(encoding="utf-8").replace("\r\n", "\n")
    return Prompt(task, chosen, text)


def current() -> dict[str, str]:
    """现在每个任务用的版本和 hash：{"intake/v1": "ab12…", "writer/v1": "…"}"""
    return {(prompt := load(task)).id: prompt.sha for task in TASKS}
