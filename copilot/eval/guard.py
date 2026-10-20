"""评测用：包一层模型，前 3 次调用全出错（key 不对、模型不认设置、额度用完）就停下，不把整套样例的额度白白用掉"""
from __future__ import annotations

import sys
from dataclasses import dataclass, field

sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.dirname(__file__)))

from nps_copilot.providers import Provider, ProviderError  # noqa: E402


@dataclass
class StopEarly:
    inner: Provider
    limit: int = 3
    ok: int = 0
    errors: list[str] = field(default_factory=list)

    @property
    def name(self) -> str:
        return self.inner.name

    @property
    def model(self) -> str:
        return getattr(self.inner, "model", self.inner.name)

    def complete_json(self, task: str, system: str, user: str, schema: dict):
        try:
            completion = self.inner.complete_json(task, system, user, schema)
        except ProviderError as error:
            self.errors.append(str(error)[:200])
            if self.ok == 0 and len(self.errors) >= self.limit:
                print(f"前 {self.limit} 次调用都出错，停下：{self.errors[0]}")
                raise SystemExit(2) from error
            raise
        self.ok += 1
        return completion


def safe_name(model: str) -> str:
    """模型名放进文件名：OpenRouter 的名字带 / 和 :"""
    return model.replace(":", "_").replace("/", "_")
