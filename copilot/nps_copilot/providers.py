"""模型提供方。Copilot 只用一种调用：给系统提示词、用户消息和 JSON Schema，拿回符合 schema 的 JSON。

- OllamaProvider：本机 Ollama（默认，和 experiments/local-model-validation 用同一套服务和参数）
- ReplayProvider：读录好的模型输出（CI 上没有 GPU，用它跑评测门禁；没录到的请求直接报错，不瞎猜）
- RecordingProvider：包一个真模型，把每次调用录下来，给 ReplayProvider 用
- ScriptedProvider：单元测试用，按顺序返回写好的输出
- GeminiProvider、OpenAIProvider、OpenRouterProvider、GroqProvider：商业 API（10-19 加的）。key 从环境变量或仓库根目录的
  .env.local 读（GEMINI_API_KEY、OPENAI_API_KEY、OPENROUTER_API_KEY、GROQ_API_KEY），只放在请求头里，不写日志；
  聊天按 chat_provider() 的顺序用，评测要明确设 COPILOT_PROVIDER
- FallbackProvider：主模型出错（额度用完、服务忙）时退回本机模型，给 Copilot 服务用；评测不用它（要量的是主模型本身）
- Metered：包一个模型，记下每次调用是哪个模型回答的、用了多少 token、多久、有没有退到备用的（每轮日志里的 calls，监控算花费用）
"""
from __future__ import annotations

import hashlib
import json
import os
import time
import urllib.error
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
        # 文件不存在就直接报错：悄悄当成“没有录音”会让每次调用都失败，还看不出是路径写错了
        if not self.path.exists():
            raise ProviderError(f"回放文件不存在：{self.path}")
        for line in self.path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                record = json.loads(line)
                self.records[record["key"]] = record

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        key = request_key(task, system, user, schema)
        record = self.records.get(key)
        if record is None:
            raise ProviderError(f"回放记录里没有这次调用（{task}：{user[:40]}），提示词或样例改了要重新录")
        return Completion(data=record["output"], model=record["model"], latency_ms=record.get("latency_ms", 0), raw=record.get("raw", ""),
                          meta=record.get("meta") or {})


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
            # 用了多少 token（商业 API 算成本用；Ollama 的是 eval_count 这些）
            **({"meta": completion.meta} if completion.meta else {}),
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


ROOT = Path(__file__).resolve().parents[2]


def secret(name: str) -> str:
    """API key：先看环境变量，再看仓库根目录的 .env.local（网站也用这个文件）。只返回值，不打印"""
    value = os.environ.get(name, "").strip()
    # 在 git worktree（.claude/worktrees/<名字>）里跑时，key 在主仓库的 .env.local
    files = [ROOT / ".env.local"] + ([ROOT.parents[2] / ".env.local"] if ROOT.parent.name == "worktrees" else [])
    for env_file in files:
        if value or not env_file.exists():
            continue
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith(f"{name}="):
                value = line.split("=", 1)[1].strip().strip('"').strip("'")
    if not value:
        raise ProviderError(f"没有 {name}：写进 .env.local（{name}=...）或设成环境变量")
    return value


def _post(url: str, body: dict, headers: dict, timeout: float) -> dict:
    """发一个 JSON 请求；HTTP 出错时抛 HTTPError（调用方看状态码决定重试还是放弃）。测试里会被换掉，不真的联网。
    写明是哪个程序：Groq 前面的 Cloudflare 会拦 Python 默认的 Python-urllib（403，error code 1010）"""
    request = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers={
        "Content-Type": "application/json", "User-Agent": "nps-guide-copilot (+https://github.com/momomojun/Team)", **headers})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _json_text(text: str) -> dict:
    """模型回的 JSON；有的会包一层 ```json ... ```"""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        cleaned = cleaned.rsplit("```", 1)[0]
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as error:
        raise ProviderError(f"模型没有返回 JSON：{text[:200]}") from error
    if not isinstance(data, dict):
        raise ProviderError(f"模型返回的不是 JSON 对象：{text[:200]}")
    return data


class QuotaError(ProviderError):
    """今天的免费额度用完了：再试也没用"""


@dataclass
class _Paced:
    """按每分钟能调几次（免费档的 RPM）放慢；429（超了次数）、500、503（服务忙）等一会儿再试，最多 4 次。
    一天的额度用完了（429 里写着 PerDay）不再试，直接报错"""
    rpm: float
    waits: tuple = (5, 15, 30, 60)
    sleep: Any = None  # 测试里换成假的；None 是 time.sleep（调用时再取，换掉 time.sleep 也管用）
    last: float = -1e9
    # 最后一次成功的请求本身花了多久（不算为了免费档限速等的时间、重试前等的时间）
    last_ms: int = 0

    def run(self, send):
        gap = 60.0 / self.rpm if self.rpm > 0 else 0.0
        wait = self.sleep or time.sleep
        for attempt in range(len(self.waits) + 1):
            pause = self.last + gap - time.monotonic()
            if pause > 0:
                wait(pause)
            self.last = time.monotonic()
            try:
                result = send()
                self.last_ms = round((time.monotonic() - self.last) * 1000)
                return result
            except urllib.error.HTTPError as error:
                detail = error.read().decode("utf-8", "replace")[:600]
                if error.code == 429 and ("PerDay" in detail or "per-day" in detail.lower() or "per day" in detail.lower()):
                    raise QuotaError(f"今天的免费额度用完了（{error.code}）") from error
                if error.code not in (429, 500, 502, 503, 504) or attempt == len(self.waits):
                    raise ProviderError(f"API 出错（{error.code}）：{detail[:200]}") from error
                wait(self.waits[attempt])
            except OSError as error:
                if attempt == len(self.waits):
                    raise ProviderError(f"连不上 API：{error}") from error
                wait(self.waits[attempt])
        raise ProviderError("API 重试次数用完")


# 免费档每分钟能调几次（AI Studio 的“速率限制”页，10-19），留一点余量；Gemma 另有每分钟 1.6 万 token 的限制，按 10 次算
GEMINI_RPM = {"gemini-3.5-flash-lite": 14, "gemini-3.1-flash-lite": 14, "gemma-4-31b-it": 10, "gemma-4-26b-a4b-it": 10}


@dataclass
class GeminiProvider:
    """Google 的 Gemini API（AI Studio 的免费档）。温度 0、按 JSON Schema 输出；思考开到模型允许的最低一档
    （10-19 试过：Flash Lite 能关成 minimal，3.8 Flash 最低是 low，Gemma 不认这个设置），不认就换下一档再发"""
    model: str = "gemini-3.5-flash-lite"
    timeout: float = 120.0
    name: str = "gemini"
    rpm: float | None = None
    max_tokens: int = 1024
    thinking: list = field(default_factory=lambda: [{"thinkingLevel": "minimal"}, {"thinkingLevel": "low"}, None])

    def __post_init__(self) -> None:
        self.key = secret("GEMINI_API_KEY")
        if self.model.startswith("gemma"):
            self.thinking = [None]
        self.pace = _Paced(self.rpm or GEMINI_RPM.get(self.model, 4))

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        while True:
            config: dict = {"temperature": 0, "maxOutputTokens": 3072 if task == "writer" else self.max_tokens,
                            "responseMimeType": "application/json", "responseJsonSchema": schema}
            if self.thinking[0] is not None:
                config["thinkingConfig"] = self.thinking[0]
            body = {"systemInstruction": {"parts": [{"text": system}]}, "contents": [{"role": "user", "parts": [{"text": user}]}],
                    "generationConfig": config}
            try:
                reply = self.pace.run(lambda: _post(url, body, {"x-goog-api-key": self.key}, self.timeout))
                break
            except ProviderError as error:
                # 这个模型不认这档思考设置（400，“not supported”）：记住，换下一档再发
                if "（400）" in str(error) and "hinking" in str(error) and len(self.thinking) > 1:
                    self.thinking.pop(0)
                    continue
                raise
        latency = self.pace.last_ms
        try:
            parts = reply["candidates"][0]["content"]["parts"]
        except (KeyError, IndexError) as error:
            raise ProviderError(f"Gemini 没有返回内容：{json.dumps(reply, ensure_ascii=False)[:200]}") from error
        text = "".join(part.get("text", "") for part in parts if not part.get("thought"))
        usage = reply.get("usageMetadata", {})
        meta = {"prompt_tokens": usage.get("promptTokenCount"), "output_tokens": usage.get("candidatesTokenCount"),
                "thinking_tokens": usage.get("thoughtsTokenCount")}
        return Completion(data=_json_text(text), model=self.model, latency_ms=latency, raw=text, meta=meta)


@dataclass
class OpenAIProvider:
    """OpenAI 的 Chat Completions。按 JSON Schema 输出（不开 strict：我们的 schema 有可选字段）；
    GPT-5、GPT-6 和 o 系列是推理模型，不认 temperature，推理开到最低一档。模型不认某个设置（400 里点名了
    reasoning_effort / temperature）就换下一档或去掉再发，记住以后不再白发"""
    model: str = "gpt-5-nano"
    timeout: float = 120.0
    name: str = "openai"
    rpm: float = 60
    max_tokens: int = 1024

    def __post_init__(self) -> None:
        self.key = secret("OPENAI_API_KEY")
        self.pace = _Paced(self.rpm)
        self.reasoning = self.model.startswith(("gpt-5", "gpt-6", "o"))
        self.efforts: list = ["minimal", "low", None] if self.reasoning else [None]
        self.temperature = not self.reasoning

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        while True:
            body: dict = {
                "model": self.model, "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                "response_format": {"type": "json_schema", "json_schema": {"name": task, "schema": schema, "strict": False}},
                "max_completion_tokens": (3072 if task == "writer" else self.max_tokens) * (4 if self.reasoning else 1),
                "seed": 42,
            }
            if self.efforts[0]:
                body["reasoning_effort"] = self.efforts[0]
            if self.temperature:
                body["temperature"] = 0
            try:
                reply = self.pace.run(lambda: _post("https://api.openai.com/v1/chat/completions", body,
                                                    {"Authorization": f"Bearer {self.key}"}, self.timeout))
                break
            except ProviderError as error:
                message = str(error)
                if "（400）" in message and "reasoning_effort" in message and len(self.efforts) > 1:
                    self.efforts.pop(0)
                elif "（400）" in message and "temperature" in message and self.temperature:
                    self.temperature = False
                else:
                    raise
        latency = self.pace.last_ms
        try:
            text = reply["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError) as error:
            raise ProviderError(f"OpenAI 没有返回内容：{json.dumps(reply, ensure_ascii=False)[:200]}") from error
        usage = reply.get("usage", {})
        meta = {"prompt_tokens": usage.get("prompt_tokens"), "output_tokens": usage.get("completion_tokens"),
                "thinking_tokens": (usage.get("completion_tokens_details") or {}).get("reasoning_tokens")}
        return Completion(data=_json_text(text), model=self.model, latency_ms=latency, raw=text, meta=meta)


@dataclass
class OpenRouterProvider:
    """OpenRouter（一个接口用很多家的模型，有免费模型，名字以 :free 结尾）。接口和 OpenAI 的 Chat Completions 一样；
    按 JSON Schema 输出，推理开到 low（推理模型关得太狠会乱答，10-19 的 GPT-5 nano 就是这样）。
    免费模型有每天的次数上限（没充值过的账户约 50 次 / 天），用完了 429 里写着 per-day，直接报错不再试"""
    model: str = "minimax/minimax-m3.1-flash:free"
    timeout: float = 120.0
    name: str = "openrouter"
    rpm: float = 18
    max_tokens: int = 1024
    # COPILOT_REASONING=minimal / low / medium / high / none 换推理档位（none 是不传这个设置）
    reasoning: dict | None = field(default_factory=lambda: (
        None if os.environ.get("COPILOT_REASONING") == "none" else {"effort": os.environ.get("COPILOT_REASONING") or "low"}))

    def __post_init__(self) -> None:
        self.key = secret("OPENROUTER_API_KEY")
        self.pace = _Paced(self.rpm)

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        while True:
            body: dict = {
                "model": self.model, "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                "response_format": {"type": "json_schema", "json_schema": {"name": task, "schema": schema, "strict": False}},
                "max_tokens": (3072 if task == "writer" else self.max_tokens) * 4, "temperature": 0, "seed": 42,
            }
            if self.reasoning is not None:
                body["reasoning"] = self.reasoning
            try:
                reply = self.pace.run(lambda: _post("https://openrouter.ai/api/v1/chat/completions", body,
                                                    {"Authorization": f"Bearer {self.key}", "X-Title": "NPS Guide Copilot"}, self.timeout))
                break
            except ProviderError as error:
                # 这个模型不认推理设置：去掉再发
                if "（400）" in str(error) and "reasoning" in str(error) and self.reasoning is not None:
                    self.reasoning = None
                    continue
                raise
        if "error" in reply:
            raise ProviderError(f"OpenRouter 出错：{json.dumps(reply['error'], ensure_ascii=False)[:200]}")
        try:
            text = reply["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError) as error:
            raise ProviderError(f"OpenRouter 没有返回内容：{json.dumps(reply, ensure_ascii=False)[:200]}") from error
        usage = reply.get("usage", {})
        meta = {"prompt_tokens": usage.get("prompt_tokens"), "output_tokens": usage.get("completion_tokens"),
                "thinking_tokens": (usage.get("completion_tokens_details") or {}).get("reasoning_tokens"),
                "provider": reply.get("provider")}
        return Completion(data=_json_text(text), model=self.model, latency_ms=self.pace.last_ms, raw=text, meta=meta)


# Groq 免费档（Settings → Limits，10-19）：每个模型每分钟 30 次、8000 token，每天 1000 次、20 万 token。
# 卡住的是每分钟的 token：一次约 1500（问题 + 想的过程 + 回答），按每分钟 4 次放慢
GROQ_RPM = {"openai/gpt-oss-120b": 4, "openai/gpt-oss-20b": 4, "qwen/qwen3.8-27b": 4}


@dataclass
class GroqProvider:
    """Groq（自己的芯片跑开源模型，很快，有免费档）。接口和 OpenAI 的 Chat Completions 一样。
    gpt-oss 认 JSON Schema 输出和 reasoning_effort（开到 low）；别的模型不认就退成普通 JSON 模式、把 schema 写进提示词，
    推理设置不认就去掉。一天的 token 用完了 429 里写着 per day，直接报错不再试"""
    model: str = "openai/gpt-oss-120b"
    timeout: float = 120.0
    name: str = "groq"
    rpm: float | None = None
    max_tokens: int = 1536
    json_mode: str = "schema"  # schema → object（模型不认 JSON Schema 时）
    reasoning: str | None = field(default_factory=lambda: (
        None if os.environ.get("COPILOT_REASONING") == "none" else os.environ.get("COPILOT_REASONING") or "low"))

    def __post_init__(self) -> None:
        self.key = secret("GROQ_API_KEY")
        self.pace = _Paced(self.rpm if self.rpm is not None else GROQ_RPM.get(self.model, 4))

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        while True:
            prompt = system
            if self.json_mode == "schema":
                response_format = {"type": "json_schema", "json_schema": {"name": task, "schema": schema, "strict": False}}
            else:
                response_format = {"type": "json_object"}
                prompt = f"{system}\n\n只输出一个 JSON 对象，符合这个 JSON Schema：\n{json.dumps(schema, ensure_ascii=False)}"
            body: dict = {
                "model": self.model, "messages": [{"role": "system", "content": prompt}, {"role": "user", "content": user}],
                "response_format": response_format, "temperature": 0, "seed": 42,
                "max_completion_tokens": self.max_tokens * (3 if task == "writer" else 1),
            }
            if self.reasoning is not None:
                body["reasoning_effort"] = self.reasoning
            try:
                reply = self.pace.run(lambda: _post("https://api.groq.com/openai/v1/chat/completions", body,
                                                    {"Authorization": f"Bearer {self.key}"}, self.timeout))
                break
            except ProviderError as error:
                message = str(error)
                if "（400）" in message and "reasoning" in message and self.reasoning is not None:
                    self.reasoning = None
                    continue
                if "（400）" in message and ("json_schema" in message or "response_format" in message) and self.json_mode == "schema":
                    self.json_mode = "object"
                    continue
                raise
        try:
            text = reply["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError) as error:
            raise ProviderError(f"Groq 没有返回内容：{json.dumps(reply, ensure_ascii=False)[:200]}") from error
        usage = reply.get("usage", {})
        meta = {"prompt_tokens": usage.get("prompt_tokens"), "output_tokens": usage.get("completion_tokens"),
                "thinking_tokens": (usage.get("completion_tokens_details") or {}).get("reasoning_tokens"),
                "json_mode": self.json_mode}
        return Completion(data=_json_text(text), model=self.model, latency_ms=self.pace.last_ms, raw=text, meta=meta)


@dataclass
class FallbackProvider:
    """主模型出错（额度用完、服务一直忙、没网）时这一次改用本机模型，meta 里记下来"""
    primary: Provider
    backup: Provider
    name: str = "fallback"

    @property
    def model(self) -> str:
        return getattr(self.primary, "model", self.primary.name)

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        try:
            return self.primary.complete_json(task, system, user, schema)
        except ProviderError as error:
            completion = self.backup.complete_json(task, system, user, schema)
            completion.meta = {**completion.meta, "fallback_from": getattr(self.primary, "model", self.primary.name),
                               "fallback_reason": str(error)[:120]}
            return completion


@dataclass
class Metered:
    """记下每次调用（不改调用本身）：哪个模型回答的、多少 token、多久、前面哪几个出了错；出错的也记一条。
    Session 每轮开始清空、结束时 take() 写进日志"""
    inner: Provider
    log: list = field(default_factory=list)

    @property
    def name(self) -> str:
        return self.inner.name

    @property
    def model(self) -> str:
        return getattr(self.inner, "model", self.inner.name)

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        start = time.perf_counter()
        try:
            completion = self.inner.complete_json(task, system, user, schema)
        except ProviderError as error:
            self.log.append({"task": task, "model": self.model, "ms": round((time.perf_counter() - start) * 1000),
                             "error": str(error)[:120]})
            raise
        meta = completion.meta or {}
        row = {"task": task, "model": completion.model, "ms": completion.latency_ms or round((time.perf_counter() - start) * 1000),
               # 商业 API 的 usage；本机 Ollama 的是 prompt_eval_count、eval_count
               "prompt_tokens": meta.get("prompt_tokens", meta.get("prompt_eval_count")),
               "output_tokens": meta.get("output_tokens", meta.get("eval_count")),
               "thinking_tokens": meta.get("thinking_tokens")}
        row = {key: value for key, value in row.items() if value is not None}
        failed = meta.get("fallback_from")
        if failed:  # ProviderChain 记的是 [{model, reason}]，FallbackProvider 记的是一个模型名
            row["fallback_from"] = [item["model"] for item in failed] if isinstance(failed, list) else [failed]
        self.log.append(row)
        return completion

    def take(self) -> list:
        calls, self.log = self.log, []
        return calls


@dataclass
class ProviderChain:
    """几个模型按顺序试：前一个出错（额度用完、服务忙、没网、key 不对）这一次就换下一个，最后一个也出错才报错。
    meta 里记下前面哪几个出了错、为什么"""
    providers: list
    name: str = "chain"

    @property
    def model(self) -> str:
        return getattr(self.providers[0], "model", self.providers[0].name)

    def complete_json(self, task: str, system: str, user: str, schema: dict) -> Completion:
        failed = []
        for provider in self.providers:
            try:
                completion = provider.complete_json(task, system, user, schema)
            except ProviderError as error:
                failed.append({"model": getattr(provider, "model", provider.name), "reason": str(error)[:120]})
                if len(failed) == len(self.providers):
                    raise
                continue
            if failed:
                completion.meta = {**completion.meta, "fallback_from": failed}
            return completion
        raise ProviderError("没有可用的模型")


def cloud_chain(batch: bool = False) -> list:
    """有 key 的商业 API，按仓库主人 10-19 定的顺序：Gemini 3.5 Flash Lite → OpenAI GPT-4.1 mini（第二轮对照里最准）。
    聊天（batch=False）不按免费档的每分钟次数排队、服务忙只重试一次，免得一句话等很久，超了就换下一个；
    一次读一批公告（batch=True）照常按免费档放慢、多重试几次"""
    chain: list = []
    for cls, model in ((GeminiProvider, "gemini-3.5-flash-lite"), (OpenAIProvider, "gpt-4.1-mini")):
        try:
            provider = cls(model=model)
        except ProviderError:
            continue
        if not batch:
            provider.pace.rpm = 0
            provider.pace.waits = (2,)
        chain.append(provider)
    return chain


def chat_provider() -> Provider:
    """Copilot 聊天（serve、chat）用的模型。10-19 仓库主人定的顺序：Gemini → OpenAI → 本机模型，没配 key 的那一家跳过
    （组员什么 key 都没配就跟以前一样只用本机）。设了 COPILOT_PROVIDER 就按设的、不再按顺序退。
    评测脚本不走这里（用 from_env，默认本机，录音才对得上）"""
    if os.environ.get("COPILOT_PROVIDER"):
        return from_env()
    chain = cloud_chain()
    return ProviderChain([*chain, OllamaProvider()]) if chain else OllamaProvider()


def from_env() -> Provider:
    """COPILOT_PROVIDER=ollama（默认）/ gemini / openai / openrouter / groq / replay；COPILOT_MODEL 选型号；
    COPILOT_FALLBACK=ollama 时商业 API 出错退回本机（Copilot 服务用，评测别开：要量的是主模型本身）"""
    kind = os.environ.get("COPILOT_PROVIDER", "ollama")
    model = os.environ.get("COPILOT_MODEL")
    if kind == "ollama":
        return OllamaProvider(**({"model": model} if model else {}))
    if kind == "replay":
        return ReplayProvider(Path(os.environ["COPILOT_REPLAY"]))
    if kind in ("gemini", "openai", "openrouter", "groq"):
        cls = {"gemini": GeminiProvider, "openai": OpenAIProvider, "openrouter": OpenRouterProvider, "groq": GroqProvider}[kind]
        provider: Provider = cls(**({"model": model} if model else {}))
        if os.environ.get("COPILOT_FALLBACK") == "ollama":
            provider = FallbackProvider(provider, OllamaProvider())
        return provider
    raise ProviderError(f"不认识的 COPILOT_PROVIDER：{kind}（ollama / gemini / openai / openrouter / groq / replay）")
