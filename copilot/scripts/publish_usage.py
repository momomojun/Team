"""每晚读完公告以后：把这台 GitHub 机器当晚的计费总账（读公告、抽查评测调用的模型）汇总，并进 data/alerts-live 分支的
usage.json，只留最近 90 天。后台（网站的 /admin）把它和本机 Copilot 服务的总账加起来，免费档的 API 也看得到用了多少。

  python copilot/scripts/publish_usage.py usage.json      # 在 data/alerts-live 分支的工作目录里跑
"""
from __future__ import annotations

import datetime as dt
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from nps_copilot import ledger  # noqa: E402
from nps_copilot.monitor import billing  # noqa: E402

KEEP_DAYS = 90


def merge(old: list[dict], tonight: list[dict], today: dt.date) -> list[dict]:
    """当晚有的日子换成当晚的（同一天跑了两次也不重复算），再去掉 90 天以前的"""
    days = {row["day"] for row in tonight}
    since = (today - dt.timedelta(days=KEEP_DAYS - 1)).isoformat()
    kept = [row for row in old if row.get("day") not in days and row.get("day", "") >= since]
    return sorted(kept + tonight, key=lambda row: (row["day"], row["source"], row["model"]))


def main() -> None:
    target = Path(sys.argv[1])
    old = json.loads(target.read_text(encoding="utf-8")).get("rows", []) if target.exists() else []
    tonight = billing(ledger.load(1))
    rows = merge(old, tonight["rows"], dt.date.today())
    target.write_text(json.dumps({"rows": rows, "limits": tonight["limits"]}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"usage.json：当晚 {sum(row['calls'] for row in tonight['rows'])} 次调用，一共 {len(rows)} 行")


if __name__ == "__main__":
    main()
