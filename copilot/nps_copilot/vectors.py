"""按意思找资料（向量检索），向量存在 Neon 的 Postgres 里（pgvector 扩展），和关键词检索（knowledge.search）一起用。

为什么：10-22 的对照实验（RESULTS.md“检索：关键词 vs 向量”）里，英文问题、只描述不点名的问题，关键词常找不到，按意思找能找到。
那次用的是本机 Ollama 的 bge-m3，Modal 上放不下；这里换成 Gemini 的嵌入接口（embeddings.py），向量存进 Neon。

- 建库：python -m nps_copilot vectors sync。资料（contracts/knowledge.jsonl）每条按“送去算向量的那段文字”算 hash，
  只给新的、改过的算向量，删掉资料里已经没有的；--dry-run 只数要算几条、不调接口。
- 一张表 copilot_knowledge_vectors，按（型号, 资料 id）存，两个嵌入型号可以同时放着比。只有两千来条，按距离逐条比（精确），
  不建 HNSW 索引：索引是近似的，加上“只在这几座公园里找”的条件还可能少返回；到十几万条再说。
- 回答问题时：COPILOT_RETRIEVAL 选 bm25（默认，CI 的回放门禁也走这条）、vector 或 hybrid（两份名单按 RRF 合起来）。
  问题算一次向量、去 Neon 找最近的 DEPTH 条；嵌入接口、数据库任何一步出错或者太慢，都退回关键词，照样回答。
- 不在 /health 里查数据库：后台每 30 秒问一次 /health，会让 Neon 一直醒着。
"""
from __future__ import annotations

import hashlib
import os
import threading
import time
from functools import lru_cache

from . import knowledge
from .embeddings import DIMS, GeminiEmbedder, document_text, model_name
from .knowledge import Doc
from .providers import ProviderError, secret

TABLE = "copilot_knowledge_vectors"
DEPTH = 20
RRF_K = 60
MODES = ("bm25", "vector", "hybrid")

SCHEMA = f"""
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS {TABLE} (
  model text NOT NULL,
  id text NOT NULL,
  park text NOT NULL DEFAULT '',
  type text NOT NULL,
  hash text NOT NULL,
  embedding vector({DIMS}) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (model, id)
);
"""


def mode() -> str:
    value = os.environ.get("COPILOT_RETRIEVAL", "").strip().lower() or "bm25"
    return value if value in MODES else "bm25"


def database_url() -> str | None:
    try:
        return secret("DATABASE_URL")
    except ProviderError:
        return None


def content_hash(doc: Doc, model: str) -> str:
    return hashlib.sha256(f"{model}\n{document_text(doc.title, doc.text, model)}".encode("utf-8")).hexdigest()[:16]


def literal(vector: list[float]) -> str:
    return "[" + ",".join(f"{v:.7g}" for v in vector) + "]"


class NeonStore:
    """Neon 的 Postgres（psycopg）。只开一条连接，断了重连一次"""

    def __init__(self, url: str, connect_timeout: int = 10, statement_ms: int = 10000) -> None:
        self.url, self.connect_timeout, self.statement_ms = url, connect_timeout, statement_ms
        self._conn = None
        self._lock = threading.Lock()
        self._ready = False

    def _connect(self):
        import psycopg

        return psycopg.connect(self.url, autocommit=True, connect_timeout=self.connect_timeout,
                               options=f"-c statement_timeout={self.statement_ms}")

    def _run(self, work):
        import psycopg

        with self._lock:
            for attempt in (0, 1):
                try:
                    if self._conn is None or self._conn.closed:
                        self._conn = self._connect()
                    with self._conn.cursor() as cur:
                        return work(cur)
                except psycopg.OperationalError:
                    # Neon 闲置后休眠、连接被断开：重连一次再试
                    self._conn = None
                    if attempt:
                        raise
        return None

    def ensure(self) -> None:
        if not self._ready:
            self._run(lambda cur: cur.execute(SCHEMA))
            self._ready = True

    def hashes(self, model: str) -> dict[str, str]:
        def work(cur):
            cur.execute(f"SELECT id, hash FROM {TABLE} WHERE model = %s", (model,))
            return dict(cur.fetchall())
        return self._run(work)

    def upsert(self, model: str, rows: list[tuple[Doc, str, list[float]]]) -> None:
        def work(cur):
            cur.executemany(
                f"INSERT INTO {TABLE} (model, id, park, type, hash, embedding) VALUES (%s, %s, %s, %s, %s, %s::vector) "
                "ON CONFLICT (model, id) DO UPDATE SET park = EXCLUDED.park, type = EXCLUDED.type, hash = EXCLUDED.hash, "
                "embedding = EXCLUDED.embedding, updated_at = now()",
                [(model, doc.id, doc.park or "", doc.type, digest, literal(vector)) for doc, digest, vector in rows])
        self._run(work)

    def delete(self, model: str, ids: list[str]) -> None:
        if ids:
            self._run(lambda cur: cur.execute(f"DELETE FROM {TABLE} WHERE model = %s AND id = ANY(%s)", (model, ids)))

    def nearest(self, model: str, vector: list[float], parks: list[str], k: int = DEPTH) -> list[str]:
        """意思最近的 k 条资料 id（余弦距离）。parks 为空时不限公园；不分公园的资料（片区、州、机场）都查"""
        def work(cur):
            cur.execute(
                f"SELECT id FROM {TABLE} WHERE model = %s AND (park = '' OR cardinality(%s::text[]) = 0 OR park = ANY(%s::text[])) "
                "ORDER BY embedding <=> %s::vector LIMIT %s",
                (model, parks, parks, literal(vector), k))
            return [row[0] for row in cur.fetchall()]
        return self._run(work)


def sync(store, embedder, model: str, docs: list[Doc] | None = None, dry_run: bool = False, on_batch=None) -> dict:
    """让 Neon 里的向量和资料一致：新的、改过的算向量写进去，资料里没有了的删掉。返回各有几条"""
    docs = docs if docs is not None else knowledge.index()[0]
    store.ensure()
    have = store.hashes(model)
    want = {doc.id: (doc, content_hash(doc, model)) for doc in docs}
    todo = [(doc, digest) for doc, digest in want.values() if have.get(doc.id) != digest]
    gone = sorted(set(have) - set(want))
    stats = {"model": model, "docs": len(docs), "stored": len(have), "new": sum(doc.id not in have for doc, _ in todo),
             "changed": sum(doc.id in have for doc, _ in todo), "removed": len(gone),
             "requests": -(-len(todo) // 100)}
    if dry_run:
        return stats
    for i in range(0, len(todo), 100):
        batch = todo[i:i + 100]
        vectors = embedder.documents([(doc.title, doc.text) for doc, _ in batch])
        store.upsert(model, [(doc, digest, vector) for (doc, digest), vector in zip(batch, vectors)])
        if on_batch:
            on_batch(min(i + 100, len(todo)), len(todo))
    store.delete(model, gone)
    return stats


def fuse(*ranked: list[str], depth: int = DEPTH) -> list[str]:
    """几份排好的名单按 RRF（倒数排名融合）合成一份：排得越前分越高，两份都有的加起来"""
    score: dict[str, float] = {}
    for names in ranked:
        for rank, doc_id in enumerate(names):
            score[doc_id] = score.get(doc_id, 0.0) + 1 / (RRF_K + rank + 1)
    return sorted(score, key=lambda doc_id: (-score[doc_id], doc_id))[:depth]


_state: dict = {}
_state_lock = threading.Lock()


def _live() -> tuple[GeminiEmbedder, NeonStore, str]:
    """聊天时用的嵌入接口和数据库（第一次用时建好，之后一直用这一个）"""
    with _state_lock:
        if "store" not in _state:
            url = database_url()
            if not url:
                raise ProviderError("没有 DATABASE_URL")
            model = model_name()
            _state.update(model=model, embedder=GeminiEmbedder(model=model, timeout=6.0, quick=True),
                          store=NeonStore(url, connect_timeout=5, statement_ms=3000))
        return _state["embedder"], _state["store"], _state["model"]


@lru_cache(maxsize=256)
def _query_vector(model: str, text: str) -> tuple[float, ...]:
    embedder, _, _ = _live()
    return tuple(embedder.query(text))


def retrieve(question: str, parks: list[str], k: int = 4, how: str | None = None) -> tuple[list[Doc], dict]:
    """回答问题用的 k 条资料 + 这次是怎么找的（写进日志）。how 不给就按 COPILOT_RETRIEVAL"""
    how = how or mode()
    keyword = knowledge.search(question, parks, k=DEPTH if how != "bm25" else k)
    if how == "bm25":
        return keyword[:k], {"retrieval": "bm25"}
    start = time.monotonic()
    try:
        _, store, model = _live()
        vector = list(_query_vector(model, question))
        semantic = store.nearest(model, vector, knowledge.scope(question, parks))
    except Exception as error:  # 任何一步出错都退回关键词：找资料不能让回答失败
        return keyword[:k], {"retrieval": "bm25", "retrieval_fallback": f"{type(error).__name__}: {str(error)[:120]}",
                             "retrieval_ms": round((time.monotonic() - start) * 1000)}
    ids = semantic if how == "vector" else fuse([doc.id for doc in keyword], semantic)
    docs = [doc for doc in (knowledge.get(doc_id) for doc_id in ids) if doc is not None][:k]
    return docs, {"retrieval": how, "embed_model": model, "retrieval_ms": round((time.monotonic() - start) * 1000)}
