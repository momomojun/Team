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
from nps_copilot.alerts_live import _cache_key  # noqa: E402

CLOSURE_TITLE = re.compile(r"\bclos(ed|ure|ures|ing)\b", re.I)
MARK = re.compile(r"<!-- alert:([^ ]+) -->")
EVAL = Path(__file__).resolve().parents[1] / "eval" / "alerts"


def labelled() -> set[str]:
    """评测集里已经标过答案的公告（copilot/eval/alerts/snapshot-*.json）也算报过"""
    return {a["id"] for path in EVAL.glob("snapshot-*.json") for a in json.loads(path.read_text(encoding="utf-8"))["alerts"]}


def closure_alerts(snapshot: dict) -> list[dict]:
    """关闭类的公告：分类是 Park Closure，或者标题写着 closed / closure（有的公园把封路放在 Caution 里）"""
    return [a for a in snapshot["alerts"] if a.get("category") == "Park Closure" or CLOSURE_TITLE.search(a["title"])]


def readers(new: list[dict], cache: dict | None) -> list[str]:
    """这几条公告是哪几个模型读的（读过的记在 extracted.json 里，每条记着模型）。缓存里的可能是前几晚别的模型读的，所以按条查"""
    return sorted({m for a in new if (m := ((cache or {}).get(_cache_key(a)) or {}).get("model"))})


def report(snapshot: dict, known: set[str], closures: dict | None = None, cache: dict | None = None) -> tuple[list[dict], str]:
    """closures：模型读出来的关闭清单（closures-latest.json）；有就多一列“模型和规则找到的景点”。cache：extracted.json，用来写是哪个模型读的"""
    new = [a for a in closure_alerts(snapshot) if a["id"] not in known]
    who = "、".join(readers(new, cache))
    names = {row["id"]: row["nameZh"] for rows in alerts.attractions().values() for row in rows}
    found = {c["alert"]: c for c in (closures or {}).get("closures", [])}
    lines = [
        f"NPS 公告快照 {snapshot['fetched']}（{len(snapshot['alerts'])} 条）里有 {len(new)} 条以前没报过的关闭公告。",
        "",
        (f"模型{f'（{who}）' if who else ''}读了全文，“模型和规则找到的”一列是排行程时会用的结果：标题里写着的（规则也找到）不排，只有模型找到的照排、提醒确认。"
         if closures else "这次只用规则看了一眼（规则只读标题，召回只有一半左右）。"),
        "要不要写进人工核对的 `src/data/closures.ts`，看完公告再定。这些公告模型没见过，也可以标好答案，做下一版提示词（alerts_v2）的评测。",
        "",
        "| 公园 | 分类 | 标题 | 规则对到的景点 |" + (" 模型和规则找到的 | 重开 |" if closures else ""),
        "|---|---|---|---|" + ("---|---|" if closures else ""),
    ]
    for alert in sorted(new, key=lambda a: (a["park"], a["title"])):
        rules = alerts.rules_extract(alert)
        hit = "、".join(names.get(i, i) for i in rules.closed) or ("部分关闭" if rules.type == "partial" else "—")
        title = alert["title"].replace("|", "/")
        link = f"[{title}]({alert['url']})" if alert.get("url") else title
        row = f"| {alert['park']} | {alert.get('category', '')} | {link} | {hit} |"
        if closures:
            c = found.get(alert["id"])
            row += f" {'、'.join(names.get(i, i) for i in c['attractions'])}（{'+'.join(c.get('found_by') or [])}） | {c.get('reopen') or '—'} |" if c else " — | — |"
        lines.append(row)
    lines += ["", *(f"<!-- alert:{a['id']} -->" for a in new)]
    return new, "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot", type=Path)
    parser.add_argument("--known", type=Path, help="以前报过的 issue 正文（gh issue list 的输出），从里面读 alert id")
    parser.add_argument("--closures", type=Path, help="模型读出来的关闭清单（closures-latest.json），有就一起列出来")
    parser.add_argument("--cache", type=Path, help="读过的公告（extracted.json），用来写是哪个模型读的")
    parser.add_argument("--out", type=Path, default=Path("alerts-report.md"))
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    snapshot = json.loads(args.snapshot.read_text(encoding="utf-8"))
    known = labelled() | (set(MARK.findall(args.known.read_text(encoding="utf-8"))) if args.known and args.known.exists() else set())
    closures = json.loads(args.closures.read_text(encoding="utf-8")) if args.closures and args.closures.exists() else None
    cache = json.loads(args.cache.read_text(encoding="utf-8")) if args.cache and args.cache.exists() else None
    new, text = report(snapshot, known, closures, cache)
    if new:
        args.out.write_text(text, encoding="utf-8")
    print(f"NEW={len(new)}")
    if snapshot.get("failed"):
        print(f"::warning::这几座公园的公告没抓到：{', '.join(snapshot['failed'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
