"""讲解版的配音（tts.py）：文字整理、缓存的键、没装模型时接口返回 503。不真跑模型"""
import pytest

from nps_copilot import tts


def test_chinese_text_is_cleaned_for_the_reading_rules():
    assert tts.clean_zh("11:04 到") == "11点04分 到"
    assert tts.clean_zh("19:00 出发") == "19点 出发"
    assert tts.clean_zh("雾径 · 弗纳尔瀑布") == "雾径弗纳尔瀑布"
    assert tts.clean_zh("3–5 月") == "3到5 月"


def test_english_text_is_cleaned():
    assert tts.clean_en("Mist Trail · Vernal Fall") == "Mist Trail, Vernal Fall"


def test_cache_key_depends_on_text_voice_and_model():
    a = tts.key("你好", "zh", "zf_001")
    assert a == tts.key("你好", "zh", "zf_001")
    assert a != tts.key("你好", "zh", "zf_003")
    assert a != tts.key("你好", "en", "zf_001")


def test_lang_of():
    assert tts.lang_of("zh-TW") == "zh" and tts.lang_of("en-US") == "en"


def test_cached_sentence_is_read_without_the_model(tmp_path, monkeypatch):
    monkeypatch.setattr(tts, "CACHE", tmp_path)
    (tmp_path / f"{tts.key('你好', 'zh', 'zf_001')}.mp3").write_bytes(b"mp3")
    monkeypatch.setattr(tts, "_model", lambda lang: (_ for _ in ()).throw(AssertionError("不该加载模型")))
    assert tts.synthesize("你好", "zh-CN", "zf_001") == b"mp3"


def test_endpoint_says_unavailable_without_models(monkeypatch):
    # CI 只装 copilot[dev]，没有 FastAPI：那边跳过
    fastapi = pytest.importorskip("fastapi")
    from nps_copilot import api

    HTTPException = fastapi.HTTPException
    monkeypatch.setattr(tts, "available", lambda: False)
    with pytest.raises(HTTPException) as missing:
        api.speak("你好")
    assert missing.value.status_code == 503
    with pytest.raises(HTTPException) as empty:
        api.speak(" ")
    assert empty.value.status_code == 400
    assert api.health()["tts"] is None
