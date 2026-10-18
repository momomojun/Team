"""Critic：用代码检查 plan_trip 的结果（不调模型）。

- 把每天、每站的提醒代码（契约里的 STOP_WARNINGS）整理成给 Writer 用的 findings，分 hard（去不了、赶不上）和 soft（要注意）；
- 只在不违背用户原话的前提下自动改一次：太满、回住处太晚，而节奏不是用户自己说的 → 改成轻松再排一次；
  用户自己选了节奏、天数、公园的，不擅自改，只在说明里讲清楚、建议怎么调。最多改一次（有界修订）。
"""
from __future__ import annotations

from dataclasses import dataclass, field

# familySerious：能去，但同行的婴儿或老人去这里风险高、很累，要请用户务必慎重考虑，一定要说出来
HARD = {"tempClosed", "afterHours", "missDeparture", "noService", "lastShuttle", "farTransfer", "familySerious"}
SOFT = {"maybeClosed", "missSunset", "offTime", "dark", "parkingFull"}
DAY_HARD = {"overloaded", "lateReturn"}


@dataclass
class Finding:
    severity: str  # hard | soft | info
    code: str
    day: int | None
    stop: str | None
    name_zh: str | None = None
    name_en: str | None = None


@dataclass
class Critique:
    findings: list[Finding] = field(default_factory=list)
    revision: dict | None = None
    reason: str | None = None

    @property
    def hard(self) -> list[Finding]:
        return [finding for finding in self.findings if finding.severity == "hard"]


def critique(request: dict, result: dict) -> Critique:
    findings: list[Finding] = []
    for day in result["days"]:
        if not day["stops"] and day["day"] not in (1, len(result["days"])):
            findings.append(Finding("soft", "emptyDay", day["day"], None))
        for code in day.get("warnings", []):
            findings.append(Finding("hard" if code in DAY_HARD else "soft", code, day["day"], None))
        for stop in day["stops"]:
            for code in stop["warnings"]:
                severity = "hard" if code in HARD else "soft" if code in SOFT else "info"
                findings.append(Finding(severity, code, day["day"], stop["id"], stop["nameZh"], stop["nameEn"]))
            if stop.get("localStart"):
                findings.append(Finding("info", "otherTimeZone", day["day"], stop["id"], stop["nameZh"], stop["nameEn"]))
    for item in result.get("skipped", []):
        findings.append(Finding("info", f"skipped:{item['reason']}", None, item["id"], item["nameZh"], item["nameEn"]))

    revision = None
    reason = None
    busy = any(f.code in DAY_HARD for f in findings)
    pace_source = request.get("provenance", {}).get("pace", {}).get("source", "default")
    if busy and request.get("pace") != "relaxed" and pace_source == "default":
        revision = {**request, "pace": "relaxed", "provenance": {**request.get("provenance", {}), "pace": {"source": "inferred", "evidence": "Critic：默认节奏下有几天太满，改成轻松再排"}}}
        reason = "relaxed_pace"
    return Critique(findings, revision, reason)
