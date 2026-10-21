"""漂移测试量时间（GOALS P36）：NPS 新发一条关闭公告，多久以后 Copilot 排出的行程里不再有这个景点。

  python copilot/scripts/drift_timing.py            # 要装 Node 24（调真的行程引擎）；不联网、不调真模型

模拟的是 10-20 的真实节奏：每晚加州 0 点读一遍所有公园的公告（GitHub 上的定时常常晚点，10-20 晚了 5 个半小时），
白天 13:00 NPS 新发“隧道观景点关闭”，14:00 有人问后天出发的优胜美地行程。
- 抓公告用假的接口（马上返回这条公告），模型读公告用写好的输出，量的是代码和行程引擎本身花的时间；
  真模型读一条公告要多久，按录音里的耗时中位数加上去（MiniMax 推理开 high、Gemini）。
- 量三种情况：以前的做法（按“今天读过没有”，当天不再读）、现在的做法（距上次读超过 REFRESH_HOURS 小时就现读）、
  出发日期在两周以外（公告管不了，设计如此）
"""
from __future__ import annotations

import datetime as dt
import json
import os
import statistics
import sys
import tempfile
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

from nps_copilot import alerts, alerts_live  # noqa: E402
from nps_copilot.plan_client import plan_trip  # noqa: E402
from nps_copilot.providers import ScriptedProvider  # noqa: E402

TZ = dt.timezone(dt.timedelta(hours=-7))  # 加州夏令时
NIGHT = dt.datetime(2026, 10, 20, 0, 0, tzinfo=TZ)
POSTED = dt.datetime(2026, 10, 20, 13, 0, tzinfo=TZ)
ASKED = dt.datetime(2026, 10, 20, 14, 0, tzinfo=TZ)
GITHUB_DELAY_H = 5.5  # 10-20 实际看到的定时晚点
ALERT = {"id": "drift-tunnel", "park": "yose", "category": "Park Closure", "title": "Tunnel View Closed for Repaving",
         "updated": "2026-10-20 13:00:00.0",
         "description": "Tunnel View and its parking area are closed through November 1, 2026 while crews repave the overlook.",
         "url": "https://www.nps.gov/yose/planyourvisit/conditions.htm"}
REQUEST = {"contract": "trip-request/v1", "parks": ["yose"], "startDate": "2026-10-22", "days": 2, "origin": {"airport": "FAT"}}


def model_reply() -> dict:
    index = [row["id"] for row in alerts.attractions()["yose"]].index("yose-tunnel-view") + 1
    return {"type": "full", "closed": [index], "from": "", "reopen": "2026-11-02", "evidence": "Tunnel View and its parking area are closed"}


def recorded_ms(name: str) -> float | None:
    path = HERE.parent / "eval" / "recordings" / name
    if not path.exists():
        return None
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    return statistics.median(row.get("latency_ms") or 0 for row in rows)


def plan_has_tunnel(closures: Path) -> tuple[bool, float]:
    os.environ["COPILOT_LIVE_CLOSURES"] = str(closures)
    start = time.perf_counter()
    result = plan_trip(REQUEST, "2026-10-20").result
    ms = (time.perf_counter() - start) * 1000
    return any(stop["id"] == "yose-tunnel-view" for day in result["days"] for stop in day["stops"]), ms


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    work = Path(tempfile.mkdtemp(prefix="drift-"))
    closures, cache = work / "closures.json", work / "cache.json"
    # 夜里 0 点读过：那时还没有这条公告
    closures.write_text(json.dumps({"fetched": "2026-10-20", "parks": {"yose": "2026-10-20"}, "readAt": {"yose": NIGHT.isoformat()},
                                    "closures": []}), encoding="utf-8")
    before, plan_ms = plan_has_tunnel(closures)
    alerts_live.fetch_alerts = lambda parks: [ALERT]
    alerts_live.alerts_provider = lambda: ScriptedProvider([model_reply()])

    # 以前的做法：今天读过就不读（readAt 去掉，parks 是今天，就当作 fresh）
    old = closures.read_text(encoding="utf-8")
    legacy = json.loads(old)
    legacy.pop("readAt")
    closures.write_text(json.dumps(legacy), encoding="utf-8")
    old_fresh = (legacy["parks"]["yose"] == "2026-10-20")
    next_night = dt.datetime(2026, 10, 21, 0, 0, tzinfo=TZ)
    old_hours = ((next_night - POSTED).total_seconds() / 3600, (next_night - POSTED).total_seconds() / 3600 + GITHUB_DELAY_H)

    # 现在的做法：14:00 问的时候距上次读 14 小时 > REFRESH_HOURS，当场读
    closures.write_text(old, encoding="utf-8")
    start = time.perf_counter()
    info = alerts_live.refresh_for(REQUEST, "2026-10-20", closures, cache, now=ASKED)
    refresh_ms = (time.perf_counter() - start) * 1000
    after, plan_after_ms = plan_has_tunnel(closures)
    model_ms = {"MiniMax（推理开 high）": recorded_ms("minimax_minimax-m3.1-flash_free-alerts-2026-10-19-sample26-high.jsonl"),
                "Gemini 3.5 Flash Lite": recorded_ms("gemini-3.5-flash-lite-alerts-2026-10-19.jsonl")}

    # 两周以外出发：公告管不了
    far = alerts_live.refresh_for({**REQUEST, "startDate": "2026-11-20"}, "2026-10-20", closures, cache, now=ASKED)

    print(f"行程引擎排一次 {plan_ms:.0f} ms（公告出来以前：行程里{'有' if before else '没有'}隧道观景点）")
    print(f"以前的做法：14:00 问的时候 {'当作今天已经读过、不再读' if old_fresh else '会读'}；"
          f"要等到第二天 0 点那次每晚读公告，公告发出后 {old_hours[0]:.0f}–{old_hours[1]:.1f} 小时才进行程（GitHub 晚点 0–{GITHUB_DELAY_H} 小时）")
    print(f"现在的做法：14:00 问的时候现读（{info.get('why') or ('读了 ' + str(info.get('alerts')) + ' 条')}），"
          f"代码 {refresh_ms:.0f} ms + 行程引擎 {plan_after_ms:.0f} ms；行程里{'还有' if after else '已经没有'}隧道观景点")
    for name, ms in model_ms.items():
        if ms is not None:
            print(f"  加上真模型读这一条（{name}，录音里的中位数 {ms:.0f} ms）：一共约 {(refresh_ms + plan_after_ms + ms) / 1000:.1f} 秒")
    print(f"  最晚的情况：公告刚好在一次读完之后发出，到下一次有人问、距上次读超过 {alerts_live.REFRESH_HOURS} 小时才现读，"
          f"最多 {alerts_live.REFRESH_HOURS} 小时（期间每晚 0 点那次也会读到）")
    print(f"两周以后出发：{far['why']}（公告只说现在开没开，管不了那么远，设计如此）")
    out = {"plan_ms": round(plan_ms), "before_has_tunnel": before, "old_hours": old_hours, "refresh_ms": round(refresh_ms),
           "plan_after_ms": round(plan_after_ms), "after_has_tunnel": after, "model_ms": model_ms,
           "refresh_hours": alerts_live.REFRESH_HOURS, "far": far}
    print("JSON=" + json.dumps(out, ensure_ascii=False))
    return 0 if before and not after else 1


if __name__ == "__main__":
    raise SystemExit(main())
