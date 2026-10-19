"""每晚的 NPS 公告检查（.github/workflows/alerts-nightly.yml）：新抓的公告快照里，有哪些是以前没报过的关闭公告。

  python copilot/scripts/alerts_report.py <快照.json> --known <以前的 issue 正文.txt> --out report.md

CI 上没有模型，只用规则（rules_extract）先看一眼对到了网站上的哪些景点；要用模型提取，在本机下载这份快照（workflow 的
artifact），跑 python -m nps_copilot alerts --snapshot <快照>。以前报过的公告 id 写在 issue 正文的 <!-- alert:ID --> 里，
同一条公告只报一次。新的关闭公告是模型没见过的数据，可以标好答案、做下一版提示词的评测。
有新的就把报告写到 --out、退出码 0 并打印 NEW=<条数>；没有新的打印 NEW=0。
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from nps_copilot import alerts  # noqa: E402

CLOSURE_TITLE = re.compile(r"\bclos(ed|ure|ures|ing)\b", re.I)
MARK = re.compile(r"<!-- alert:([^ ]+) -->")
EVAL = Path(__file__).resolve().parents[1] / "eval" / "alerts"


def labelled() -> set[str]:
    """评测集里已经标过答案的公告（copilot/eval/alerts/snapshot-*.json）也算报过"""
    return {a["id"] for path in EVAL.glob("snapshot-*.json") for a in json.loads(path.read_text(encoding="utf-8"))["alerts"]}


def closure_alerts(snapshot: dict) -> list[dict]:
    """关闭类的公告：分类是 Park Closure，或者标题写着 closed / closure（有的公园把封路放在 Caution 里）"""
    return [a for a in snapshot["alerts"] if a.get("category") == "Park Closure" or CLOSURE_TITLE.search(a["title"])]


def report(snapshot: dict, known: set[str]) -> tuple[list[dict], str]:
    new = [a for a in closure_alerts(snapshot) if a["id"] not in known]
    names = {row["id"]: row["nameZh"] for rows in alerts.attractions().values() for row in rows}
    lines = [
        f"NPS 公告快照 {snapshot['fetched']}（{len(snapshot['alerts'])} 条）里有 {len(new)} 条以前没报过的关闭公告。",
        "",
        "CI 上只用规则看了一眼（规则只读标题，召回只有一半左右）。用模型提取：下载这次运行的 artifact `nps-alerts-snapshot`，在本机跑",
        "`python -m nps_copilot alerts --snapshot <快照>`，再看要不要写进 `src/data/closures.ts`。",
        "这些公告模型没见过，也可以标好答案，做下一版提示词（alerts_v2）的评测。",
        "",
        "| 公园 | 分类 | 标题 | 规则对到的景点 |",
        "|---|---|---|---|",
    ]
    for alert in sorted(new, key=lambda a: (a["park"], a["title"])):
        rules = alerts.rules_extract(alert)
        hit = "、".join(names.get(i, i) for i in rules.closed) or ("部分关闭" if rules.type == "partial" else "—")
        title = alert["title"].replace("|", "/")
        link = f"[{title}]({alert['url']})" if alert.get("url") else title
        lines.append(f"| {alert['park']} | {alert.get('category', '')} | {link} | {hit} |")
    lines += ["", *(f"<!-- alert:{a['id']} -->" for a in new)]
    return new, "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot", type=Path)
    parser.add_argument("--known", type=Path, help="以前报过的 issue 正文（gh issue list 的输出），从里面读 alert id")
    parser.add_argument("--out", type=Path, default=Path("alerts-report.md"))
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    snapshot = json.loads(args.snapshot.read_text(encoding="utf-8"))
    known = labelled() | (set(MARK.findall(args.known.read_text(encoding="utf-8"))) if args.known and args.known.exists() else set())
    new, text = report(snapshot, known)
    if new:
        args.out.write_text(text, encoding="utf-8")
    print(f"NEW={len(new)}")
    if snapshot.get("failed"):
        print(f"::warning::这几座公园的公告没抓到：{', '.join(snapshot['failed'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
