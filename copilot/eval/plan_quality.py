"""行程质量：读一份评测报告，把条件齐了的 TripRequest 再交给 plan_trip，用 Critic 统计行程本身有没有问题。

  python eval/plan_quality.py eval/reports/<报告>.json

看的是：每天的硬问题（太满、回住处太晚、过了开放时间、赶不上班次、临时关闭……）、空着的日子、
同行的人（老人、小孩、轮椅、婴儿车）有没有让不合适的景点被排除、跨时区的站有没有当地时间。
"""
from __future__ import annotations

import collections
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from nps_copilot.critic import critique  # noqa: E402
from nps_copilot.plan_client import PlanError, plan_trip  # noqa: E402


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    report = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    hard = collections.Counter()
    rows = []
    for case in report["results"]:
        request = case.get("request")
        if not request:
            continue
        try:
            result = plan_trip(request, "2026-10-16").result
        except PlanError as error:
            rows.append((case["id"], "plan_error", str(error.issues or error)))
            continue
        review = critique(request, result)
        codes = [f.code for f in review.findings if f.severity == "hard"]
        hard.update(codes)
        stops = sum(len(day["stops"]) for day in result["days"])
        empty = [day["day"] for day in result["days"] if not day["stops"]]
        unsuitable = [item["nameZh"] for item in result["skipped"] if item["reason"] == "unsuitable"]
        zones = [stop["nameZh"] for day in result["days"] for stop in day["stops"] if stop.get("localStart")]
        party = request.get("party") or {}
        rows.append((case["id"], f"{len(result['days'])} 天 {stops} 站", {
            "hard": codes, "empty_days": empty, "party": party,
            "unsuitable_skipped": len(unsuitable), "other_zone_stops": len(zones),
            "skipped": dict(collections.Counter(item["reason"] for item in result["skipped"])),
        }))
    for row in rows:
        print(*row)
    print("\n硬问题合计：", dict(hard) or "没有")


if __name__ == "__main__":
    main()
