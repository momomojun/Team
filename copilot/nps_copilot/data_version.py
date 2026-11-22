"""数据版本：这一轮回答、这个镜像用的是哪一份数据（计划书 §3、§4、§8 目标 1、2：每个回答能追溯到模型、提示词、数据）。

两种数据，分开记：

- 静态数据（`current()`）：按文件内容算的 hash，换一个字、加一个景点就变；同样的内容在 Windows、Linux 上算出来一样（换行统一成 LF）。
  - `site`：src/data/ 下的全部数据（景点、住宿、临时关闭、班车、预约规则……），行程引擎排行程、查询工具都读它；
  - `contracts`：copilot/contracts/（公园和机场目录、回答问题用的资料 knowledge.jsonl、契约 schema），`npm run copilot:contracts` 生成；
  - `names`：copilot/nps_copilot/data/（各地中文叫法、机场城市英文名）。
  三份合成一个 12 位的 `id`，写进每轮日志、`/health`、`version` 命令、评测报告和镜像标签。
- 实时公告（`alerts_snapshot()`）：排行程那一刻交给引擎的 NPS 公告关闭清单（copilot/data/alerts/closures-latest.json），
  记下它是哪天读的、内容 hash、几条关闭。它一天可能变好几次，所以每次排行程单独记，不算进上面的 `id`。

命令行：`python -m nps_copilot.data_version`（JSON）、`--tag`（镜像标签的后缀）。只用标准库，CI 里不装依赖也能跑。
"""
from __future__ import annotations

import hashlib
import json
import sys
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PARTS = {
    "site": ROOT / "src" / "data",
    "contracts": ROOT / "copilot" / "contracts",
    "names": Path(__file__).resolve().parent / "data",
}
SHORT = 12


def _files(path: Path) -> list[Path]:
    if path.is_file():
        return [path]
    return sorted(
        (item for item in path.rglob("*") if item.is_file() and not any(part.startswith((".", "__pycache__")) for part in item.relative_to(path).parts)),
        key=lambda item: item.relative_to(path).as_posix(),
    )


def digest(path: Path) -> str | None:
    """一个目录（或文件）按内容算的 sha256：文件的相对路径和内容都算进去，换行统一成 LF。不存在就是 None"""
    if not path.exists():
        return None
    sha = hashlib.sha256()
    for item in _files(path):
        sha.update(item.relative_to(path).as_posix().encode("utf-8") if item != path else item.name.encode("utf-8"))
        sha.update(b"\0")
        sha.update(item.read_bytes().replace(b"\r\n", b"\n"))
        sha.update(b"\0")
    return sha.hexdigest()


def combine(parts: dict[str, str | None]) -> str:
    sha = hashlib.sha256()
    for name in sorted(parts):
        sha.update(f"{name}={parts[name] or '-'}\n".encode("utf-8"))
    return sha.hexdigest()[:SHORT]


@lru_cache(maxsize=1)
def current() -> dict:
    """{"id": "3f9a…"（12 位）, "parts": {"site": …, "contracts": …, "names": …}}。服务开着时数据不变，算一次（14 MB 约 0.1 秒）"""
    full = {name: digest(path) for name, path in PARTS.items()}
    return {"id": combine(full), "parts": {name: value[:SHORT] if value else None for name, value in full.items()}}


def alerts_snapshot(path: str | Path | None) -> dict | None:
    """交给行程引擎的公告关闭清单：{"fetched": 读公告的日期, "hash": 内容 hash, "closures": 几条}；没用清单就是 None"""
    if not path:
        return None
    file = Path(path)
    try:
        raw = file.read_bytes()
        data = json.loads(raw.decode("utf-8"))
    except (OSError, ValueError):
        return None
    return {
        "fetched": data.get("fetched"),
        "hash": hashlib.sha256(raw.replace(b"\r\n", b"\n")).hexdigest()[:SHORT],
        "closures": len(data.get("closures") or []),
    }


def prompts_id(hashes: dict[str, str]) -> str:
    """几个提示词的版本和 hash 合成 8 位，放进镜像标签"""
    return hashlib.sha256(json.dumps(hashes, sort_keys=True).encode("utf-8")).hexdigest()[:8]


def image_tag(sha: str) -> str:
    """镜像的第二个标签：提交、提示词、数据（计划书 §6：tag = git SHA + 提示词版本 + 数据 hash），比如 sha-1a2b3c4-p5d6e7f80-d3f9a0b1c2d3e"""
    from . import prompts

    return f"sha-{sha[:7]}-p{prompts_id(prompts.current())}-d{current()['id']}"


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "--tag":
        print(image_tag(sys.argv[2]))
    else:
        print(json.dumps(current(), indent=1))
