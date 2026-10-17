"""文本规范化：全角转半角、合并空白。比较模型摘出的原文片段和用户原话时两边都先过一遍，
“6天”和“6 天”、全角数字和半角数字算同一个片段（V2 实验里这类差异被当成了提取错误）。"""
from __future__ import annotations

import re
import unicodedata


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"\s+", " ", text).strip()
    # 汉字和数字、字母之间的空格可有可无
    text = re.sub(r"(?<=[一-鿿]) (?=[0-9A-Za-z])|(?<=[0-9A-Za-z]) (?=[一-鿿])", "", text)
    return text


def contains(haystack: str, needle: str) -> bool:
    """模型摘出的片段是不是用户原话里的（规范化以后逐字比较；不证明语义对）"""
    return bool(needle) and normalize(needle).lower() in normalize(haystack).lower()
