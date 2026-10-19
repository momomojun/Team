"""监控：读 pipeline 写的 JSONL 运行日志（copilot/runs/，Docker 里是 /data/runs），按 Copilot 版本和提示词版本统计。

这是决定要不要回滚的依据：新版本上线以后，看排出行程的比例、出错的比例、模型编造（被丢掉的片段）、
Writer 退回模板的比例、耗时有没有变差。指标的意思：
- planned：这一轮排出了行程；needs_input：还在追问；error：plan_trip 拒绝了请求
- dropped_spans：模型摘了用户原话里没有的东西，被代码丢掉（越少越好）
- rule_fills：模型漏了、靠规则补上的条件
- writer_fallback：模型改写的说明没通过忠实度检查、退回模板
- dispatched / legacy：调度员定了做什么的轮数 / 走原来按规则流程的轮数（调度员出错、输出用不了、只是回答追问）；
  dispatch_dropped：调度员编了对话里没有的地方、被代码丢掉的动作数；dispatch_errors：调度员调用失败
- questions：排出行程以后的提问；qa_model 用了模型的回答，qa_not_found 资料里没有、说了不知道，
  qa_fallback 模型的回答里有资料里没有的数字（或者出错），改成摘资料原文
"""
from __future__ import annotations

import datetime as dt
import json
import statistics
from collections import defaultdict
from pathlib import Path

from .pipeline import RUNS


def load(days: int, runs: Path = RUNS) -> list[dict]:
    since = dt.date.today() - dt.timedelta(days=days - 1)
    rows = []
    for path in sorted(runs.glob("*.jsonl")):
        try:
            if dt.date.fromisoformat(path.stem) < since:
                continue
        except ValueError:
            continue
        rows.extend(json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip())
    return rows


def summarize(rows: list[dict]) -> dict[str, dict]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        key = f"{row.get('version', '?')} · " + " ".join(sorted(row.get("prompts", {})))
        groups[key].append(row)
    summary = {}
    for key, items in groups.items():
        statuses = [item.get("status") for item in items]
        latencies = [item["latency_ms"] for item in items if isinstance(item.get("latency_ms"), (int, float))]
        intake = [item.get("intake", {}) for item in items]
        writers = [item["writer"] for item in items if item.get("writer")]
        qa_rows = [row for item in items for row in (item["qa"] if isinstance(item.get("qa"), list) else [item["qa"]] if item.get("qa") else [])]
        answers = [row.get("answer") for row in qa_rows]
        dispatches = [item["dispatch"] for item in items if item.get("dispatch")]
        summary[key] = {
            "turns": len(items),
            "sessions": len({item.get("session") for item in items}),
            "planned": statuses.count("planned"),
            "needs_input": statuses.count("needs_input"),
            "error": statuses.count("error"),
            "median_latency_ms": statistics.median(latencies) if latencies else None,
            "p90_latency_ms": sorted(latencies)[int(len(latencies) * 0.9) - 1] if len(latencies) >= 10 else None,
            "dropped_spans": sum(len(trace.get("dropped_spans", [])) for trace in intake),
            "rule_fills": sum(len(trace.get("rule_filled", [])) for trace in intake),
            "writer_model": sum(1 for writer in writers if writer.get("prompt")),
            "writer_fallback": sum(1 for writer in writers if writer.get("fallback")),
            "dispatched": sum(1 for item in items if item.get("dispatch") and item.get("route") != "legacy"),
            "legacy": sum(1 for item in items if item.get("route") == "legacy"),
            "dispatch_dropped": sum(len(d.get("dropped", [])) for d in dispatches),
            "dispatch_errors": sum(1 for d in dispatches if d.get("error")),
            "questions": len(answers),
            "qa_model": answers.count("model"),
            "qa_not_found": answers.count("not_found"),
            "qa_fallback": answers.count("fallback"),
        }
    return summary


def report(days: int = 7, runs: Path = RUNS) -> str:
    rows = load(days, runs)
    if not rows:
        return f"最近 {days} 天没有运行日志（{runs}）"
    lines = [f"最近 {days} 天，{len(rows)} 轮对话（日志：{runs}）"]
    for key, item in summarize(rows).items():
        lines.append(f"\n{key}")
        lines.append(f"  对话 {item['sessions']} 个、{item['turns']} 轮：排出行程 {item['planned']}，追问 {item['needs_input']}，出错 {item['error']}")
        lines.append(f"  耗时中位 {item['median_latency_ms']} ms" + (f"，P90 {item['p90_latency_ms']} ms" if item["p90_latency_ms"] else ""))
        lines.append(f"  模型编造被丢掉的片段 {item['dropped_spans']}，规则补的 {item['rule_fills']}，"
                     f"Writer 用模型 {item['writer_model']} 次、退回模板 {item['writer_fallback']} 次")
        lines.append(f"  调度员定的 {item['dispatched']} 轮，走原来流程 {item['legacy']} 轮；编造被丢掉的动作 {item['dispatch_dropped']}，调用失败 {item['dispatch_errors']}")
        if item["questions"]:
            lines.append(f"  提问 {item['questions']} 次：模型回答 {item['qa_model']}，资料里没有 {item['qa_not_found']}，"
                         f"回答对不上资料、改成摘原文 {item['qa_fallback']}")
    return "\n".join(lines)
