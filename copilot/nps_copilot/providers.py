"""模型提供方。Copilot 只用一种调用：给系统提示词、用户消息和 JSON Schema，拿回符合 schema 的 JSON。

- OllamaProvider：本机 Ollama（默认，和 experiments/local-model-validation 用同一套服务和参数）
- ReplayProvider：读录好的模型输出（CI 上没有 GPU，用它跑评测门禁；没录到的请求直接报错，不瞎猜）
- RecordingProvider：包一个真模型，把每次调用录下来，给 ReplayProvider 用
- ScriptedProvider：单元测试用，按顺序返回写好的输出
- CloudProvider：留着接口，默认关闭，不会自动退到云端
"""
from __future__ import annotations

import hashlib
import json
import os
import time
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol


@dataclass
class Completion:
    data: dict[str, Any]
    model: str
    latency_ms: int
    raw: str = ""
    meta: dict[str, Any] = field(default_factory=dict)


class Provider(Protocol):
    name: str

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion: ...


class ProviderError(RuntimeError):
    pass


def request_key(task: str, system: str, user: str, schema: dict) -> str:
    """同一个任务、同一版提示词、同一条消息、同一个 schema → 同一个 key（回放用）"""
    payload = json.dumps([task, system, user, schema], ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]


@dataclass
class OllamaProvider:
    model: str = os.environ.get("COPILOT_MODEL", "qwen3.5:4b-q4_K_M")
    host: str = os.environ.get("OLLAMA_HOST_URL", "http://127.0.0.1:11435")
    timeout: float = 120.0
    name: str = "ollama"
    # 和实验里固定的一样：温度 0、固定种子、小上下文、关思考
    options: dict[str, Any] = field(default_factory=lambda: {
        "temperature": 0, "seed": 42, "num_ctx": 4096, "num_predict": 512,
        "top_k": 20, "top_p": 0.95, "min_p": 0, "repeat_penalty": 1.0, "presence_penalty": 0, "frequency_penalty": 0,
    })

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        # 写说明比摘片段长得多：7 天的行程 512 个 token 不够，JSON 会被截断
        options = {**self.options, "num_predict": 1536} if task == "writer" else self.options
        body = json.dumps({
            "model": self.model, "stream": False, "think": False, "format": schema, "options": options,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        }).encode("utf-8")
        request = urllib.request.Request(f"{self.host}/api/chat", data=body, headers={"Content-Type": "application/json"})
        start = time.perf_counter()
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                reply = json.loads(response.read().decode("utf-8"))
        except OSError as error:
            raise ProviderError(f"连不上本机 Ollama（{self.host}）：{error}") from error
        latency = round((time.perf_counter() - start) * 1000)
        content = reply.get("message", {}).get("content", "")
        try:
            data = json.loads(content)
        except json.JSONDecodeError as error:
            raise ProviderError(f"模型没有返回 JSON：{content[:200]}") from error
        meta = {key: reply.get(key) for key in ("total_duration", "load_duration", "eval_count", "prompt_eval_count")}
        return Completion(data=data, model=self.model, latency_ms=latency, raw=content, meta=meta)


@dataclass
class ReplayProvider:
    path: Path
    name: str = "replay"

    def __post_init__(self) -> None:
        self.records: dict[str, dict] = {}
        if self.path.exists():
            for line in self.path.read_text(encoding="utf-8").splitlines():
                if line.strip():
                    record = json.loads(line)
                    self.records[record["key"]] = record

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        key = request_key(task, system, user, schema)
        record = self.records.get(key)
        if record is None:
            raise ProviderError(f"回放记录里没有这次调用（{task}：{user[:40]}），提示词或样例改了要重新录")
        return Completion(data=record["output"], model=record["model"], latency_ms=record.get("latency_ms", 0), raw=record.get("raw", ""))


@dataclass
class RecordingProvider:
    inner: Provider
    path: Path
    name: str = "recording"

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        completion = self.inner.complete_json(task, system, user, schema)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        record = {
            "key": request_key(task, system, user, schema), "task": task, "user": user, "model": completion.model,
            "output": completion.data, "raw": completion.raw, "latency_ms": completion.latency_ms,
        }
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
        return completion


@dataclass
class ScriptedProvider:
    outputs: list[dict]
    name: str = "scripted"
    calls: list[tuple[str, str]] = field(default_factory=list)

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        self.calls.append((task, user))
        if not self.outputs:
            raise ProviderError(f"测试脚本里没有更多输出了（{task}：{user}）")
        return Completion(data=self.outputs.pop(0), model="scripted", latency_ms=0)


@dataclass
class CloudProvider:
    """留给以后接云端模型（比如学校或自己的 GPU 服务器、商业 API）。默认关闭：要设 COPILOT_ALLOW_CLOUD=1 才会用"""
    name: str = "cloud"

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        if os.environ.get("COPILOT_ALLOW_CLOUD") != "1":
            raise ProviderError("云端模型默认关闭（设 COPILOT_ALLOW_CLOUD=1 才启用），本项目默认只用本机模型")
        raise ProviderError("CloudProvider 还没实现")


def from_env() -> Provider:
    kind = os.environ.get("COPILOT_PROVIDER", "ollama")
    if kind == "ollama":
        return OllamaProvider()
    if kind == "replay":
        return ReplayProvider(Path(os.environ["COPILOT_REPLAY"]))
    if kind == "cloud":
        return CloudProvider()
    raise ProviderError(f"不认识的 COPILOT_PROVIDER：{kind}")
