"""按意思找资料（vectors.py）和 Gemini 嵌入接口（embeddings.py）：假的网络回复、假的数据库，不连 Neon、不调 Gemini"""
import json
import math

import pytest

from nps_copilot import embeddings, knowledge, providers, qa, vectors
from nps_copilot.embeddings import DIMS, GeminiEmbedder
from nps_copilot.providers import ProviderError, ScriptedProvider


def vec(seed: int) -> list[float]:
    return [math.sin(seed * (i + 1)) for i in range(DIMS)]


@pytest.fixture
def fake_post(monkeypatch, tmp_path):
    monkeypatch.setattr(providers, "ROOT", tmp_path)
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.setattr(providers.time, "sleep", lambda seconds: None)
    sent = []

    def install(reply_for=None):
        def post(url, body, headers, timeout):
            sent.append({"url": url, "body": json.loads(json.dumps(body)), "headers": headers})
            if reply_for:
                return reply_for(body)
            return {"embeddings": [{"values": vec(i + 1)} for i in range(len(body["requests"]))]}
        monkeypatch.setattr(providers, "_post", post)
        return sent
    return install


def test_embedding_001_uses_task_types_and_768_dims(fake_post):
    sent = fake_post()
    embedder = GeminiEmbedder(model="gemini-embedding-001")
    docs = embedder.documents([("冰川点", "优胜美地的观景点"), ("雾径", "到弗纳尔瀑布的步道")])
    query = embedder.query("where is glacier point")
    first, second = sent
    assert first["url"].endswith("/models/gemini-embedding-001:batchEmbedContents")
    assert first["headers"] == {"x-goog-api-key": "test-gemini-key"}
    item = first["body"]["requests"][0]
    assert item["model"] == "models/gemini-embedding-001" and item["outputDimensionality"] == 768
    assert item["taskType"] == "RETRIEVAL_DOCUMENT" and item["content"]["parts"][0]["text"] == "冰川点。优胜美地的观景点"
    assert second["body"]["requests"][0]["taskType"] == "RETRIEVAL_QUERY"
    # 截短的向量要归一化（官方说 001 不会自己做）
    assert all(abs(math.sqrt(sum(v * v for v in row)) - 1) < 1e-9 for row in [*docs, query])


def test_embedding_2_uses_prefixes_not_task_type(fake_post):
    sent = fake_post()
    embedder = GeminiEmbedder(model="gemini-embedding-2")
    embedder.documents([("", "没有标题的资料")])
    embedder.query("biggest tree on earth")
    doc_item, query_item = sent[0]["body"]["requests"][0], sent[1]["body"]["requests"][0]
    assert "taskType" not in doc_item and "taskType" not in query_item
    assert doc_item["content"]["parts"][0]["text"] == "title: none | text: 没有标题的资料"
    assert query_item["content"]["parts"][0]["text"] == "task: search result | query: biggest tree on earth"


def test_batches_of_100(fake_post):
    sent = fake_post()
    GeminiEmbedder().documents([("标题", f"资料 {i}") for i in range(250)])
    assert [len(call["body"]["requests"]) for call in sent] == [100, 100, 50]


def test_wrong_reply_is_an_error(fake_post):
    fake_post(lambda body: {"embeddings": [{"values": [1.0, 0.0]}]})
    with pytest.raises(ProviderError):
        GeminiEmbedder().query("问题")


def test_unknown_model_name(monkeypatch):
    monkeypatch.setenv("COPILOT_EMBED_MODEL", "text-embedding-004")
    with pytest.raises(ProviderError):
        embeddings.model_name()


class FakeStore:
    """内存里的“数据库”：按余弦相似度找"""

    def __init__(self):
        self.rows: dict[tuple[str, str], tuple] = {}
        self.ensured = 0

    def ensure(self):
        self.ensured += 1

    def hashes(self, model):
        return {doc_id: row[1] for (m, doc_id), row in self.rows.items() if m == model}

    def upsert(self, model, rows):
        for doc, digest, vector in rows:
            self.rows[(model, doc.id)] = (doc, digest, vector)

    def delete(self, model, ids):
        for doc_id in ids:
            self.rows.pop((model, doc_id), None)

    def nearest(self, model, vector, parks, k=vectors.DEPTH):
        scored = [(sum(a * b for a, b in zip(vector, row[2])), doc_id) for (m, doc_id), row in self.rows.items()
                  if m == model and (not row[0].park or not parks or row[0].park in parks)]
        return [doc_id for _, doc_id in sorted(scored, reverse=True)[:k]]


class FakeEmbedder:
    def __init__(self, mapping=None):
        self.calls = 0
        self.mapping = mapping or {}

    def documents(self, rows):
        self.calls += 1
        return [self.mapping.get(title, vec(len(title) + len(text))) for title, text in rows]

    def query(self, text):
        return self.mapping[text]


def test_sync_only_embeds_new_and_changed_and_removes_gone():
    docs = knowledge.index()[0][:5]
    store, embedder = FakeStore(), FakeEmbedder()
    first = vectors.sync(store, embedder, "gemini-embedding-001", docs)
    assert (first["new"], first["changed"], first["removed"], first["requests"]) == (5, 0, 0, 1)
    again = vectors.sync(store, embedder, "gemini-embedding-001", docs)
    assert (again["new"], again["changed"], again["requests"]) == (0, 0, 0) and embedder.calls == 1
    edited = [knowledge.Doc(**{**docs[0].__dict__, "text": docs[0].text + "（改过）"}), *docs[1:4]]
    third = vectors.sync(store, embedder, "gemini-embedding-001", edited)
    assert (third["new"], third["changed"], third["removed"]) == (0, 1, 1)
    assert len(store.hashes("gemini-embedding-001")) == 4
    # 另一个型号单独存
    assert vectors.sync(store, embedder, "gemini-embedding-2", docs, dry_run=True)["new"] == 5


def test_dry_run_does_not_embed():
    store = FakeStore()
    stats = vectors.sync(store, None, "gemini-embedding-001", knowledge.index()[0], dry_run=True)
    assert stats["new"] == len(knowledge.index()[0]) and stats["requests"] == -(-stats["new"] // 100)
    assert store.rows == {}


def test_fuse_rewards_docs_in_both_lists():
    assert vectors.fuse(["a", "b", "c"], ["c", "d"])[0] == "c"
    assert vectors.fuse(["a"], [])[0] == "a"


@pytest.fixture
def live(monkeypatch):
    """聊天时用的嵌入接口和数据库换成假的"""
    store = FakeStore()
    embedder = FakeEmbedder()
    vectors._query_vector.cache_clear()
    monkeypatch.setattr(vectors, "_live", lambda: (embedder, store, "gemini-embedding-2"))
    return store, embedder


def test_hybrid_finds_english_question_keywords_miss(live, monkeypatch):
    store, embedder = live
    narrows = knowledge.get("zion-narrows") or next(d for d in knowledge.index()[0] if d.park == "zion" and d.type == "attraction")
    others = [d for d in knowledge.index()[0] if d.park == "zion" and d.id != narrows.id][:10]
    question = "the canyon where you wade through the river"
    embedder.mapping[question] = vec(99)
    store.upsert("gemini-embedding-2", [(narrows, "h", vec(99))] + [(d, "h", vec(i + 1)) for i, d in enumerate(others)])
    keyword_only, how = vectors.retrieve(question, ["zion"], how="bm25")
    assert how == {"retrieval": "bm25"}
    docs, how = vectors.retrieve(question, ["zion"], how="hybrid")
    assert narrows in docs and how["retrieval"] == "hybrid" and how["embed_model"] == "gemini-embedding-2"
    assert narrows in vectors.retrieve(question, ["zion"], how="vector")[0][:1]


def test_falls_back_to_keywords_when_anything_fails(monkeypatch):
    def broken():
        raise ProviderError("没有 DATABASE_URL")
    vectors._query_vector.cache_clear()
    monkeypatch.setattr(vectors, "_live", broken)
    docs, how = vectors.retrieve("冰川点几点看日落", ["yose"], how="hybrid")
    assert docs == knowledge.search("冰川点几点看日落", ["yose"])
    assert how["retrieval"] == "bm25" and "DATABASE_URL" in how["retrieval_fallback"]


def test_default_mode_is_keywords(monkeypatch):
    monkeypatch.delenv("COPILOT_RETRIEVAL", raising=False)
    assert vectors.mode() == "bm25"
    monkeypatch.setenv("COPILOT_RETRIEVAL", "HYBRID")
    assert vectors.mode() == "hybrid"
    monkeypatch.setenv("COPILOT_RETRIEVAL", "magic")
    assert vectors.mode() == "bm25"


def test_qa_trace_says_how_docs_were_found(monkeypatch):
    monkeypatch.setenv("COPILOT_RETRIEVAL", "hybrid")
    vectors._query_vector.cache_clear()
    monkeypatch.setattr(vectors, "_live", lambda: (_ for _ in ()).throw(ProviderError("没有 DATABASE_URL")))
    provider = ScriptedProvider([{"found": True, "answer": "冰川点在优胜美地。", "sources": [1]}])
    _, trace = qa.answer("冰川点在哪", ["yose"], "", provider, True)
    assert trace["retrieval"] == "bm25" and "retrieval_fallback" in trace


def test_sync_puts_first_parks_first_and_stops_on_daily_quota(monkeypatch):
    from nps_copilot.providers import QuotaError

    monkeypatch.setattr(vectors, "BATCH", 2)
    docs = [d for d in knowledge.index()[0] if d.park in ("yose", "zion")][:3] + [d for d in knowledge.index()[0] if d.park == "arch"][:3]

    class Limited(FakeEmbedder):
        def documents(self, rows):
            if self.calls == 1:
                raise QuotaError("今天的免费额度用完了（429）")
            return super().documents(rows)

    store = FakeStore()
    stats = vectors.sync(store, Limited(), "gemini-embedding-2", docs, first={"arch"})
    assert stats["stopped"] == "quota" and stats["embedded"] == 2
    # 先算的是 arch 的
    assert {doc_id for (_, doc_id) in store.rows} <= {d.id for d in docs if d.park == "arch"}


def test_vector_mode_falls_back_to_keywords_when_store_is_empty(live):
    _, embedder = live
    question = "冰川点几点看日落"
    embedder.mapping[question] = vec(5)
    docs, how = vectors.retrieve(question, ["yose"], how="vector")
    assert docs == knowledge.search(question, ["yose"]) and how["retrieval_fallback"] == "empty_vector_result"


def test_named_doc_without_vector_is_still_found(live):
    store, embedder = live
    glacier = next(d for d in knowledge.index()[0] if d.park == "yose" and d.type == "attraction" and "冰川点" in d.names)
    others = [d for d in knowledge.index()[0] if d.park == "yose" and d.type == "attraction" and d.id != glacier.id][:6]
    question = "冰川点几点看日落"
    embedder.mapping[question] = vec(7)
    # 冰川点还没算向量（新加的、改过还没 sync 的）：库里只有别的景点
    store.upsert("gemini-embedding-2", [(d, "h", vec(i + 1)) for i, d in enumerate(others)])
    docs, how = vectors.retrieve(question, ["yose"], how="vector")
    assert docs[0] == glacier and how["retrieval_pinned"] == [glacier.id] and len(docs) == 4


def test_named_doc_already_found_keeps_semantic_order(live):
    store, embedder = live
    glacier = next(d for d in knowledge.index()[0] if d.park == "yose" and d.type == "attraction" and "冰川点" in d.names)
    others = [d for d in knowledge.index()[0] if d.park == "yose" and d.type == "attraction" and d.id != glacier.id][:6]
    question = "冰川点几点看日落"
    embedder.mapping[question] = vec(1)
    store.upsert("gemini-embedding-2", [(d, "h", vec(i + 1)) for i, d in enumerate(others)] + [(glacier, "h", vec(3))])
    docs, how = vectors.retrieve(question, ["yose"], how="vector")
    assert "retrieval_pinned" not in how and docs[0] == others[0]


def test_only_the_users_own_words_can_pin_a_named_doc(live):
    """调度员补全的问法里写错了名字：补错的那条不能放到最前面、把用户点名的挤掉"""
    store, embedder = live
    yose = [d for d in knowledge.index()[0] if d.park == "yose" and d.type == "attraction"]
    glacier = next(d for d in yose if "冰川点" in d.names)
    tunnel = next(d for d in yose if "隧道观景点" in d.names)
    others = [d for d in yose if d.id not in (glacier.id, tunnel.id)][:5]
    said, meaning = "冰川点几点看日落", "隧道观景点"
    query = f"{said} {meaning}"
    embedder.mapping[query] = vec(1)
    # 冰川点按意思排第 4，隧道观景点没算向量（补错的那个名字）
    store.upsert("gemini-embedding-2", [(d, "h", vec(i + 1)) for i, d in enumerate(others[:3])] + [(glacier, "h", vec(4))]
                 + [(d, "h", vec(i + 10)) for i, d in enumerate(others[3:])])
    docs, how = vectors.retrieve(query, ["yose"], how="vector", said=said)
    assert tunnel not in docs and glacier in docs and "retrieval_pinned" not in how
    # 不给原话时照旧按问法认（单独调 retrieve 的地方）
    docs, how = vectors.retrieve(query, ["yose"], how="vector")
    assert docs[0] == tunnel and how["retrieval_pinned"] == [tunnel.id]
