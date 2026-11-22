"""数据快照校验（计划书 §4：快照用 Pydantic 做 schema 校验，GOALS P6）。

Copilot 读的几份资料是网站导出的（`npm run copilot:contracts` 写 copilot/contracts/，`regional_names.py` 写各地叫法）。
原来直接 json.loads 进来就用：网站那边改了字段名、漏了一项，要到聊天时用到那个字段才 KeyError，用户看到的是一句“出错了”。
现在按下面的模型逐条“验货”：

- 字段和类型：每座公园要有代码、中英文名、时区、常用机场……；机场的经纬度在合理范围；资料每条都有正文；
- 前后对得上：公园的常用机场都在机场表里、开车分钟数只写给常用机场、顺路的公园都存在、景点 id 以所在公园开头、
  资料里的公园都存在、id 不重复、各地叫法和机场英文城市名只写给存在的公园和机场、时区是真的时区。

在哪验：`serve` 启动时（坏了就起不来，比上线以后半路出错好；Docker 冒烟测试会拦住）、`python -m nps_copilot check-data`、
CI 的 pytest（tests/test_snapshot.py）。只要求 Copilot 用到的字段，网站那边多加字段不用跟着改这里（extra="ignore"）。
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

ROOT = Path(__file__).resolve().parents[2]
CONTRACTS = ROOT / "copilot" / "contracts"
DATA = Path(__file__).resolve().parent / "data"

PARK_CODE = r"^[a-z]{4}$"
AIRPORT_CODE = r"^[A-Z]{3}$"
NonEmpty = Field(min_length=1)


class _Row(BaseModel):
    model_config = ConfigDict(extra="ignore", frozen=True)


class Park(_Row):
    code: str = Field(pattern=PARK_CODE)
    nameZh: str = NonEmpty
    nameEn: str = NonEmpty
    kind: Literal["park", "site"]
    country: Literal["US", "CA"]
    nps: str | None = Field(default=None, pattern=PARK_CODE)
    timeZone: str
    airports: list[str] = Field(min_length=1)
    airportMinutes: dict[str, int]
    nearby: list[str]
    linked: list[str]
    aliases: list[str] = Field(min_length=1)

    @field_validator("timeZone")
    @classmethod
    def real_time_zone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as error:
            raise ValueError(f"不是有效的时区：{value}") from error
        return value

    @field_validator("airportMinutes")
    @classmethod
    def no_negative_minutes(cls, value: dict[str, int]) -> dict[str, int]:
        # 0 是合理的：科伯克谷的出发城镇 Kotzebue 本身就是机场所在地
        if any(minutes < 0 for minutes in value.values()):
            raise ValueError("开车分钟数不能是负数")
        return value


class Airport(_Row):
    code: str = Field(pattern=AIRPORT_CODE)
    nameZh: str = NonEmpty
    city: str = NonEmpty
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class Attraction(_Row):
    id: str = NonEmpty
    park: str = Field(pattern=PARK_CODE)
    nameEn: str = NonEmpty
    nameZh: str = NonEmpty
    area: str
    areaZh: str


class Knowledge(_Row):
    id: str = NonEmpty
    type: Literal["park", "attraction", "lodging", "activity", "airport", "state", "region", "closure"]
    # 机场、州、片区这几类不属于某一座公园，是空字符串
    park: str = Field(pattern=r"^([a-z]{4})?$")
    title: str = NonEmpty
    names: list[str]
    text: str = NonEmpty
    members: list[str] | None = None


class Regional(_Row):
    variants: dict[str, str] = {}
    aliases: list[str] = []


class RegionalNames(_Row):
    generated: str
    parks: dict[str, Regional]
    airports: dict[str, Regional]


class SnapshotError(ValueError):
    """快照没通过校验：problems 是每一处问题（“parks.json 第 3 条 timeZone：……”）"""

    def __init__(self, problems: list[str]):
        super().__init__(f"数据快照有 {len(problems)} 处问题：\n" + "\n".join(problems[:20]))
        self.problems = problems


def _rows(model: type[_Row], rows: list, name: str, problems: list[str]) -> list:
    out = []
    for index, row in enumerate(rows):
        try:
            out.append(model.model_validate(row))
        except ValidationError as error:
            for item in error.errors():
                where = ".".join(str(part) for part in item["loc"]) or "整条"
                label = row.get("code") or row.get("id") if isinstance(row, dict) else None
                problems.append(f"{name} 第 {index + 1} 条（{label or '?'}）{where}：{item['msg']}")
    return out


def _unique(values: list[str], name: str, problems: list[str]) -> None:
    seen: set[str] = set()
    for value in values:
        if value in seen:
            problems.append(f"{name}：{value} 重复")
        seen.add(value)


def check(contracts: Path = CONTRACTS, data: Path = DATA) -> dict[str, int]:
    """逐条校验；全对返回每份几条，有问题抛 SnapshotError（列出每一处）"""
    problems: list[str] = []
    load = lambda path: json.loads(path.read_text(encoding="utf-8"))  # noqa: E731
    parks = _rows(Park, load(contracts / "parks.json"), "parks.json", problems)
    airports = _rows(Airport, load(contracts / "airports.json"), "airports.json", problems)
    attractions = _rows(Attraction, load(contracts / "attractions.json"), "attractions.json", problems)
    knowledge_rows = [json.loads(line) for line in (contracts / "knowledge.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    knowledge = _rows(Knowledge, knowledge_rows, "knowledge.jsonl", problems)

    # 存不存在按原始数据算：一座公园自己哪个字段不对，只报那一处，不连带报它的景点、资料都“公园不存在”
    raw = lambda path: {row.get("code") for row in load(path) if isinstance(row, dict)}  # noqa: E731
    park_codes = raw(contracts / "parks.json")
    airport_codes = raw(contracts / "airports.json")
    _unique([park.code for park in parks], "parks.json", problems)
    _unique([airport.code for airport in airports], "airports.json", problems)
    _unique([attraction.id for attraction in attractions], "attractions.json", problems)
    _unique([row.id for row in knowledge], "knowledge.jsonl", problems)
    for park in parks:
        problems += [f"parks.json {park.code}：常用机场 {code} 不在机场表里" for code in park.airports if code not in airport_codes]
        problems += [f"parks.json {park.code}：airportMinutes 的 {code} 不是常用机场" for code in park.airportMinutes if code not in park.airports]
        problems += [f"parks.json {park.code}：顺路的公园 {code} 不存在" for code in {*park.nearby, *park.linked} if code not in park_codes]
    for attraction in attractions:
        if attraction.park not in park_codes:
            problems.append(f"attractions.json {attraction.id}：公园 {attraction.park} 不存在")
        elif not attraction.id.startswith(f"{attraction.park}-"):
            problems.append(f"attractions.json {attraction.id}：id 要以所在公园 {attraction.park}- 开头")
    problems += [f"knowledge.jsonl {row.id}：公园 {row.park} 不存在" for row in knowledge if row.park and row.park not in park_codes]

    try:
        regional = RegionalNames.model_validate(load(data / "regional_names.json"))
        problems += [f"regional_names.json：公园 {code} 不存在" for code in regional.parks if code not in park_codes]
        problems += [f"regional_names.json：机场 {code} 不存在" for code in regional.airports if code not in airport_codes]
    except ValidationError as error:
        problems += [f"regional_names.json {'.'.join(map(str, item['loc']))}：{item['msg']}" for item in error.errors()]
    english = load(data / "airport_cities_en.json")
    if not isinstance(english, dict) or not all(isinstance(v, list) and all(isinstance(c, str) for c in v) for v in english.values()):
        problems.append("airport_cities_en.json：要是 {机场代码: [英文城市名]}")
    else:
        problems += [f"airport_cities_en.json：机场 {code} 不存在" for code in english if code not in airport_codes]
    hant = load(contracts / "hant-to-hans.json")
    if not isinstance(hant, dict) or any(not re.fullmatch(".", k) or not re.fullmatch(".", v) for k, v in hant.items()):
        problems.append("hant-to-hans.json：要是 {繁体字: 简体字}，一个字对一个字")

    if problems:
        raise SnapshotError(problems)
    return {"parks": len(parks), "airports": len(airports), "attractions": len(attractions), "knowledge": len(knowledge), "hant_to_hans": len(hant)}
