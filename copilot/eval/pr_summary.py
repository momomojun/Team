"""CI 跑完八组回放门禁以后，把成绩整理成一张 Markdown 表：贴到 PR 评论和这次 CI 的摘要页。

  python copilot/eval/pr_summary.py copilot/eval/reports > summary.md

每组取 reports 里最新的那份报告，和 baseline*.json 比；没跑到的组（前面一步没过、后面没跑）写“没跑”
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MODEL = "qwen3.5_4b-q4_K_M"

# (报告文件名里的录音名, 基线文件, 中文名, 英文名)；顺序和 ci.yml 里的门禁一样
SUITES = [
    (MODEL, "baseline.json", "单句（开发集）", "Single sentence (dev set)"),
    (f"{MODEL}-holdout-v1", "baseline-holdout.json", "单句 held-out v1", "Single sentence, held-out v1"),
    (f"{MODEL}-holdout-v2", "baseline-holdout-v2.json", "单句 held-out v2（约四成刁难）", "Single sentence, held-out v2 (~40% adversarial)"),
    (f"{MODEL}-regional-v1", "baseline-regional.json", "各地叫法（港台新马）", "Regional wording (HK, TW, SG, MY)"),
    (f"{MODEL}-conversation-v1", "baseline-conversation.json", "多轮对话 v1", "Multi-turn v1"),
    (f"{MODEL}-conversation-v2", "baseline-conversation-v2.json", "多轮对话 v2", "Multi-turn v2"),
    (f"{MODEL}-conversation-v3", "baseline-conversation-v3.json", "多轮对话 v3（仓库主人试用）", "Multi-turn v3 (owner's trial)"),
    (f"{MODEL}-alerts-2026-10-19", "baseline-alerts.json", "NPS 公告提取", "NPS alert extraction"),
]


def latest(reports: Path, recording: str) -> dict | None:
    """这一组最新的报告；文件名是 <时间>-[conversation-|alerts-]replay_<录音名>.json"""
    found = sorted(path for path in reports.glob("*.json") if path.stem.split("replay_", 1)[-1] == recording)
    return json.loads(found[-1].read_text(encoding="utf-8")) if found else None


def score(report: dict, baseline: dict) -> tuple[str, str, bool]:
    """(这次的成绩, 基线, 有没有过)：三种报告的格式不一样"""
    if "summary" in report:  # 单句（run.py）
        got, want = report["summary"]["passed"], baseline["min_passed"]
        return f"{got}/{report['summary']['cases']}", f"≥ {want}", got >= want
    if "turns" in report:  # 多轮（conversation.py）
        ok = report["cases"] >= baseline["cases"] and report["turns"] >= baseline["turns"]
        return (f"{report['cases']}/{report['total_cases']} 组 · {report['turns']}/{report['total_turns']} 轮",
                f"≥ {baseline['cases']} 组 · {baseline['turns']} 轮", ok)
    model = report["model"]  # 公告（alerts.py）：门禁看模型自己读的（和 alerts.py --gate 一样）
    ok = model["type_accuracy"] >= baseline["type_accuracy"] and model["attraction_f1"] >= baseline["attraction_f1"]
    return (f"类型 {model['type_accuracy']:.3f} · 景点 F1 {model['attraction_f1']:.3f}",
            f"≥ {baseline['type_accuracy']} · ≥ {baseline['attraction_f1']}", ok)


def table(reports: Path) -> str:
    rows, failed, missing = [], 0, 0
    for recording, baseline_file, zh, en in SUITES:
        baseline = json.loads((HERE / baseline_file).read_text(encoding="utf-8"))
        report = latest(reports, recording)
        if report is None:
            missing += 1
            rows.append(f"| {zh} / {en} | 没跑 / not run | — | ⏭️ |")
            continue
        got, want, ok = score(report, baseline)
        failed += not ok
        rows.append(f"| {zh} / {en} | {got} | {want} | {'✅' if ok else '❌'} |")
    verdict = ("全部通过 / all passed" if not failed and not missing else
               f"{failed} 组没过、{missing} 组没跑 / {failed} failed, {missing} not run")
    return "\n".join([
        "<!-- copilot-eval-summary -->",
        f"### Copilot 回放评测 / Replay eval gates：{verdict}",
        "",
        "本机 Qwen3.5 4B 录好的回答回放，不调云端模型；低于基线不能合并。/ Replays of answers recorded with the local Qwen3.5 4B, no cloud calls; anything below baseline blocks the merge.",
        "",
        "| 评测组 / Suite | 这次 / This run | 基线 / Baseline | |",
        "|---|---|---|---|",
        *rows,
    ]) + "\n"


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print(table(Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "reports"), end="")
