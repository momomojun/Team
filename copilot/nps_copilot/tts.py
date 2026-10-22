"""讲解版的配音：本机跑 Kokoro（开源 TTS，82M 参数，ONNX 版，CPU 上一句话一秒左右），不联网、不花钱。

10-21 仓库主人嫌浏览器自带的声音中英文都不好听，选了本机模型。中文用 Kokoro v1.1-zh（中文优化版，读音按 misaki 的
v1.1 规则转成注音），英文用 Kokoro v1.0（英文声音最多的那套，读音交给 espeak）。模型文件不提交，放在
copilot/models/kokoro/（COPILOT_TTS_MODELS 可以换地方），下载方法见 docs/COPILOT.md。

生成过的句子按“文字 + 声音 + 模型”存成 MP3（copilot/data/tts/，COPILOT_TTS_CACHE），同一句只生成一次。
没装 kokoro-onnx、没有模型文件时 available() 是 False，网站就退回浏览器自带的声音。
"""
from __future__ import annotations

import hashlib
import io
import os
import re
import threading
from functools import lru_cache
from pathlib import Path

from .catalog import ROOT

MODELS = Path(os.environ.get("COPILOT_TTS_MODELS", ROOT / "copilot" / "models" / "kokoro"))
CACHE = Path(os.environ.get("COPILOT_TTS_CACHE", ROOT / "copilot" / "data" / "tts"))
FILES = {
    "zh": ("kokoro-v1.1-zh.fp16.onnx", "voices-v1.1-zh.bin"),
    "en": ("kokoro-v1.0.fp16.onnx", "voices-v1.0.bin"),
}
# 默认的声音（10-21 仓库主人试听后挑的：中文 zf_003、英文 af_heart；可以用 COPILOT_TTS_VOICE_ZH / _EN 换）
VOICES = {
    "zh": os.environ.get("COPILOT_TTS_VOICE_ZH", "zf_003"),
    "en": os.environ.get("COPILOT_TTS_VOICE_EN", "af_heart"),
}
MAX_CHARS = 400
# 两个模型同时只跑一句：onnxruntime 本身会用满几个核，并发反而更慢
_lock = threading.Lock()


def lang_of(lang: str) -> str:
    """zh-CN / zh-TW / zh → zh，其余按英文"""
    return "zh" if lang.lower().startswith("zh") else "en"


def available() -> bool:
    try:
        import kokoro_onnx  # noqa: F401
    except ImportError:
        return False
    return all((MODELS / name).exists() for pair in FILES.values() for name in pair)


@lru_cache(maxsize=2)
def _model(lang: str):
    import onnxruntime
    from kokoro_onnx import Kokoro

    # 模型里有几个算子 CPU 上不能提前折叠，onnxruntime 每次加载都打一大串无害的警告
    onnxruntime.set_default_logger_severity(3)
    model, voices = FILES[lang]
    return Kokoro(str(MODELS / model), str(MODELS / voices))


@lru_cache(maxsize=1)
def _zh_g2p():
    from misaki import zh

    return zh.ZHG2P(version="1.1")


TIME = re.compile(r"(\d{1,2}):(\d{2})")


def clean_zh(text: str) -> str:
    """读音转换不认的写法先改掉：“11:04”读成“11点04分”，“雾径 · 弗纳尔瀑布”的间隔号去掉，“3–5 月”读成“3到5 月”"""
    text = TIME.sub(lambda m: f"{int(m[1])}点" + (f"{m[2]}分" if m[2] != "00" else ""), text)
    text = re.sub(r"\s*[·・]\s*", "", text)
    text = re.sub(r"(\d)\s*[–—~～-]\s*(\d)", r"\1到\2", text)
    return text


def clean_en(text: str) -> str:
    return re.sub(r"\s*·\s*", ", ", text).replace("–", " to ")


def key(text: str, lang: str, voice: str) -> str:
    model = FILES[lang][0]
    return hashlib.sha256(f"{model}|{voice}|{text}".encode("utf-8")).hexdigest()[:32]


def synthesize(text: str, lang: str = "zh", voice: str | None = None) -> bytes:
    """一句话 → MP3 的字节；生成过的直接读缓存（读缓存不用装 soundfile、模型）"""
    lang = lang_of(lang)
    text = text.strip()[:MAX_CHARS]
    voice = voice or VOICES[lang]
    path = CACHE / f"{key(text, lang, voice)}.mp3"
    if path.exists():
        return path.read_bytes()
    import soundfile as sf

    with _lock:
        model = _model(lang)
        if lang == "zh":
            phonemes, _ = _zh_g2p()(clean_zh(text))
            audio, rate = model.create(phonemes, voice=voice, speed=1.0, is_phonemes=True)
        else:
            audio, rate = model.create(clean_en(text), voice=voice, speed=1.0, lang="en-us")
    buffer = io.BytesIO()
    sf.write(buffer, audio, rate, format="MP3")
    data = buffer.getvalue()
    CACHE.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data
