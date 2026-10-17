"""文本规范化：繁体转简体、全角转半角、合并空白。比较模型摘出的原文片段和用户原话时两边都先过一遍，
“6天”和“6 天”、全角数字和半角数字、“鹽湖城”和“盐湖城”算同一个片段。

繁简对照表 copilot/contracts/hant-to-hans.json 由 `npm run copilot:contracts` 用网站同一套 OpenCC 生成，
只收公园、机场名字和 Intake 代码里用得到的字。"""
from __future__ import annotations

import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

CONTRACTS = Path(__file__).resolve().parents[1] / "contracts"
# 单字转不准、但这里要用的：輕鬆（松 → 鬆 是一对多，OpenCC 单字转不出来）
EXTRA_HANT = {"鬆": "松", "週": "周", "臺": "台"}


@lru_cache(maxsize=1)
def _hant() -> dict[int, str]:
    path = CONTRACTS / "hant-to-hans.json"
    table = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    table.update(EXTRA_HANT)
    return str.maketrans(table)


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).translate(_hant())
    text = re.sub(r"\s+", " ", text).strip()
    # 汉字和数字、字母之间的空格可有可无
    text = re.sub(r"(?<=[一-鿿]) (?=[0-9A-Za-z])|(?<=[0-9A-Za-z]) (?=[一-鿿])", "", text)
    return text


def contains(haystack: str, needle: str) -> bool:
    """模型摘出的片段是不是用户原话里的（规范化以后逐字比较；不证明语义对）"""
    return bool(needle) and normalize(needle).lower() in normalize(haystack).lower()
