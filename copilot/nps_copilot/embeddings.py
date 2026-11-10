"""把文字变成向量（嵌入，embedding）：Gemini 的嵌入接口（AI Studio 免费档，GEMINI_API_KEY）。回答问题前按意思找资料用（vectors.py）。

- 两个型号：gemini-embedding-001（用 taskType 区分“资料”和“问题”）、gemini-embedding-2（不认 taskType，按官方的前缀写法：
  问题前加 “task: search result | query: ”，资料写成 “title: … | text: …”）。用哪个按 eval/retrieval.py 的成绩定（COPILOT_EMBED_MODEL）。
- 都要 768 维（outputDimensionality）：默认的 3072 维超过 pgvector 索引的上限（2000），768 也是官方推荐的几档之一。
  001 截短的向量要自己归一化（官方说的），2 会自己归一化；这里两个都归一化一遍，不影响结果。
- 一次最多送 BATCH 条（batchEmbedContents）。每次真调用都记进计费总账（ledger.py，task 是 embed）。
  测试里换掉 providers._post，不真的联网。
"""
from __future__ import annotations

import math
import os
import time
from dataclasses import dataclass

from . import ledger
from . import providers
from .providers import ProviderError, _Paced, secret

DEFAULT_MODEL = "gemini-embedding-001"
MODELS = ("gemini-embedding-001", "gemini-embedding-2")
DIMS = 768
BATCH = 100
QUERY_PREFIX = "task: search result | query: "


def model_name() -> str:
    model = os.environ.get("COPILOT_EMBED_MODEL", "").strip() or DEFAULT_MODEL
    if model not in MODELS:
        raise ProviderError(f"COPILOT_EMBED_MODEL 写的 {model} 不认识，只能是 {' / '.join(MODELS)}")
    return model


def document_text(title: str, text: str, model: str) -> str:
    """一条资料送去算向量时的样子（和 10-22 的对照实验一样截到 1200 字）"""
    if model == "gemini-embedding-2":
        return f"title: {title or 'none'} | text: {text}"[:1200]
    return f"{title}。{text}"[:1200]


def normalized(values: list[float]) -> list[float]:
    norm = math.sqrt(sum(v * v for v in values))
    return [v / norm for v in values] if norm else values


@dataclass
class GeminiEmbedder:
    model: str = DEFAULT_MODEL
    timeout: float = 20.0
    name: str = "gemini"
    # 聊天时用：出错只再试一次、超时不再等，马上退回关键词检索（不然 429 时要等上一分多钟）
    quick: bool = False

    def __post_init__(self) -> None:
        self.key = secret("GEMINI_API_KEY")
        # 免费档每分钟能调几次官方没写（AI Studio 里看），按每分钟 60 次放慢；429、503 等一会儿再试
        rpm = float(os.environ.get("COPILOT_EMBED_RPM", "60"))
        self.pace = _Paced(rpm, waits=(1,), retry_timeouts=False) if self.quick else _Paced(rpm)

    def _item(self, text: str, kind: str, title: str = "") -> dict:
        item: dict = {"model": f"models/{self.model}", "outputDimensionality": DIMS}
        if self.model == "gemini-embedding-2":
            body = QUERY_PREFIX + text if kind == "query" else document_text(title, text, self.model)
        else:
            body = text if kind == "query" else document_text(title, text, self.model)
            item["taskType"] = "RETRIEVAL_QUERY" if kind == "query" else "RETRIEVAL_DOCUMENT"
        item["content"] = {"parts": [{"text": body}]}
        return item

    def _send(self, items: list[dict], task: str) -> list[list[float]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:batchEmbedContents"
        start = time.monotonic()
        reply = self.pace.run(lambda: providers._post(url, {"requests": items}, {"x-goog-api-key": self.key}, self.timeout))
        rows = reply.get("embeddings")
        if not isinstance(rows, list) or len(rows) != len(items) or not all(isinstance(row.get("values"), list) for row in rows):
            raise ProviderError(f"Gemini 嵌入接口返回的条数不对：送了 {len(items)} 条")
        vectors = [normalized(row["values"]) for row in rows]
        if any(len(v) != DIMS for v in vectors):
            raise ProviderError(f"Gemini 嵌入接口返回的不是 {DIMS} 维")
        usage = reply.get("usageMetadata") or {}
        prompt = "\n".join(part["text"] for item in items for part in item["content"]["parts"])
        ledger.record(self.name, self.model, task, {"prompt_tokens": usage.get("promptTokenCount"), "output_tokens": 0}, prompt, "",
                      round((time.monotonic() - start) * 1000))
        return vectors

    def documents(self, rows: list[tuple[str, str]], on_batch=None) -> list[list[float]]:
        """rows 是 (标题, 正文)；按 BATCH 条一批送"""
        out: list[list[float]] = []
        for i in range(0, len(rows), BATCH):
            out += self._send([self._item(text, "document", title) for title, text in rows[i:i + BATCH]], "embed")
            if on_batch:
                on_batch(min(i + BATCH, len(rows)), len(rows))
        return out

    def query(self, text: str) -> list[float]:
        return self._send([self._item(text, "query")], "embed")[0]
