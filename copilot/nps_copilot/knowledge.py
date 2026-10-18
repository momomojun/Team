"""回答问题用的资料检索（RAG 的 R）：在 contracts/knowledge.jsonl（网站数据整理成的 1600 多条短文）里找和问题最相关的几条。

做法很朴素、不要额外的模型：
- 问题里直接出现了某条资料的名字（“El Portal”“冰川点”）的，这几条排最前面；名字里用“·”隔开的半个名字（“雾径 · 弗纳尔瀑布”的“雾径”）也算，排在后面一点；
- 其余按 BM25 打分：中文按相邻两个字切（“离园”“园区”），英文按单词；
- 只在这次行程的公园里找；问题里点名了别的公园，就加上那座。
以后可以换成向量检索（嵌入模型）做对照实验，接口不变。
"""
from __future__ import annotations

import json
import math
import re
from collections import Counter
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from . import catalog
from .text import normalize

PATH = Path(__file__).resolve().parents[1] / "contracts" / "knowledge.jsonl"
STOP = set("的了吗呢啊吧是在有和我你他她它这那就也都还要会能可去到从")
SPLIT = re.compile(r"\s*[·–/]\s*|\s+-\s+")


@dataclass(frozen=True)
class Doc:
    id: str
    type: str
    park: str
    title: str
    names: tuple[str, ...]
    text: str
    parts: tuple[str, ...] = ()


def tokens(text: str) -> list[str]:
    text = normalize(text).lower()
    words = re.findall(r"[a-z0-9]+", text)
    han = [ch for ch in text if "一" <= ch <= "鿿"]
    bigrams = [a + b for a, b in zip(han, han[1:]) if not (a in STOP and b in STOP)]
    return [w for w in words if len(w) > 1] + bigrams


def _parts(names: list[str]) -> list[str]:
    return [part for name in names if len(pieces := SPLIT.split(name)) > 1 for part in pieces if part]


@lru_cache(maxsize=1)
def index() -> tuple[list[Doc], list[Counter], dict[str, int], float]:
    rows = [json.loads(line) for line in PATH.read_text(encoding="utf-8").splitlines() if line.strip()]
    # 半个名字只在三条资料以内出现的才算（“营地”“观景台”这种太常见的不算）
    common = Counter(part for row in rows for part in set(_parts(row["names"])))
    docs = [Doc(row["id"], row["type"], row["park"], row["title"], tuple(row["names"]), row["text"],
                tuple(part for part in _parts(row["names"]) if common[part] <= 3)) for row in rows]
    counts = [Counter(tokens(" ".join(doc.names) * 2 + " " + doc.text)) for doc in docs]
    df: Counter = Counter()
    for count in counts:
        df.update(count.keys())
    average = sum(sum(c.values()) for c in counts) / max(1, len(counts))
    return docs, counts, dict(df), average


def _name_hit(name: str, query: str) -> bool:
    name = normalize(name).lower()
    if len(name) < 2 or (name.isascii() and len(name) < 4):
        return False
    if name.isascii():
        return re.search(rf"(?<![a-z]){re.escape(name)}(?![a-z])", query) is not None
    return name in query


def search(question: str, parks: list[str], k: int = 4) -> list[Doc]:
    """和问题最相关的 k 条资料。parks 是这次行程的公园；问题里点名的公园也算进去"""
    docs, counts, df, average = index()
    query = normalize(question).lower()
    scope = set(parks)
    scope.update(code for code, alias in catalog.find_all(question, catalog.parks()) if not inside_place_name(alias, code, question))
    wanted = Counter(tokens(question))
    n = len(docs)
    scored: list[tuple[float, int]] = []
    for i, doc in enumerate(docs):
        if scope and doc.park not in scope:
            continue
        score = 0.0
        length = sum(counts[i].values())
        for term, q in wanted.items():
            f = counts[i].get(term, 0)
            if not f:
                continue
            idf = math.log(1 + (n - df[term] + 0.5) / (df[term] + 0.5))
            score += q * idf * f * 2.2 / (f + 1.2 * (0.25 + 0.75 * length / average))
        # 问题里直接说了名字的：排最前面（名字越长越可信）
        hits = [name for name in doc.names if _name_hit(name, query)]
        if hits:
            score += 50 + max(len(name) for name in hits)
        elif parts := [part for part in doc.parts if _name_hit(part, query)]:
            score += 25 + max(len(part) for part in parts)
        if score > 0:
            scored.append((score, i))
    scored.sort(reverse=True)
    return [docs[i] for _, i in scored[:k]]


@lru_cache(maxsize=1)
def place_names() -> tuple[tuple[str, str], ...]:
    """景点、住处、活动的名字和所在公园（不含公园本身）：[("冰川点", "yose"), ...]"""
    rows = [json.loads(line) for line in PATH.read_text(encoding="utf-8").splitlines() if line.strip()]
    return tuple(dict.fromkeys((normalize(name).lower(), row["park"]) for row in rows if row["type"] != "park"
                               for name in row["names"] if len(name) >= 2))


def inside_place_name(alias: str, code: str, message: str) -> str | None:
    """公园的叫法是不是别的公园里某个地方名字的一部分（“冰川点”是优胜美地的，不是冰川国家公园）：是就返回那个名字"""
    alias, haystack = normalize(alias).lower(), normalize(message).lower()
    for name, park in place_names():
        if park != code and alias in name and alias != name and name in haystack:
            return name
    return None

