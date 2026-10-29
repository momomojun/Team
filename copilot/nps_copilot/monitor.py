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

模型用量（usage）：按真正回答的那个模型汇总调用次数、出错、退到它的次数（前面的模型出错才轮到它）、token 和花费，
另外按天算花费。价格在 PRICES（每百万 token 的美元），没写价格的模型花费记“不知道”，不当成 0。
"""
from __future__ import annotations

import datetime as dt
import json
import statistics
from collections import defaultdict
from pathlib import Path

from . import ledger
from .pipeline import RUNS

# 每百万 token 的价格（输入, 输出），美元。10-19 按第三方汇总的价格（没有官网核实）；免费档、本机按 0 算，
# Gemini 换成付费档、或者 OpenAI 调价了要改这里。eval/compare_alerts.py 也用这张表
PRICES = {
    "gpt-4.1-mini": (0.40, 1.60),
    "gpt-5-nano": (0.05, 0.40),
    "gpt-6-luna": (0.10, 0.50),
    "gemini-3.5-flash-lite": (0.0, 0.0),
    "gemma-4-31b-it": (0.0, 0.0),
    "openai/gpt-oss-120b": (0.0, 0.0),
    "qwen/qwen3.8-27b": (0.0, 0.0),
    "qwen3.5:4b-q4_K_M": (0.0, 0.0),
    # DeepSeek 官网（10-28）按人民币标价、白天贵一倍：按高峰价、缓存未命中、1 美元约 7.1 元换算，算的是上限
    "deepseek-flash": (0.28, 1.13),
    "deepseek-v4-pro": (1.27, 3.80),
}


# 免费档的模型换成付费档要多少钱（每百万 token 的美元，各家官网 10-28 的标价）：后台的“按标价折算”用它，
# 看免费额度到底省了多少、以后转付费大概要花多少。付费的模型标价就是 PRICES；本机模型不收钱，按 0 算
LIST_PRICES = {
    "gemini-3.5-flash-lite": (0.30, 2.50),  # ai.google.dev/gemini-api/docs/pricing，Standard 付费档
    "minimax/minimax-m3.1-flash:free": (0.15, 0.60),  # openrouter.ai/minimax/minimax-m3.1-flash/pricing（免费推广期已结束）
    "nvidia/nemotron-3.5-super-vl:free": (0.15, 0.50),  # OpenRouter 模型列表里付费版 nvidia/nemotron-3.5-super-vl 的价
    "qwen/qwen3.8-27b": (0.80, 4.00),  # console.groq.com/docs/models（Preview，按量付费价）
    "openai/gpt-oss-120b": (0.15, 0.60),
    "openai/gpt-oss-20b": (0.075, 0.30),
}

# 免费档每天的上限：后台看今天用了几成。provider 是哪一家；models 写了的只算这几个型号，free 是只算型号名以 :free 结尾的；
# requests / tokens 是每天的上限（不知道的是 None，只说在哪看）。数字是 10-19 在各家控制台看的，会变
FREE_LIMITS = [
    {"id": "openrouter-free", "provider": "openrouter", "free": True, "requests": 50, "tokens": None,
     "note": "OpenRouter 没充值过的账户，所有免费模型加起来每天约 50 次（充值 10 美元以上是 1000 次）"},
    {"id": "groq-qwen", "provider": "groq", "models": ["qwen/qwen3.8-27b"], "requests": 1000, "tokens": 200000,
     "note": "Groq 免费档每个模型每天 1000 次、20 万 token，每分钟 8000 token（console.groq.com → Settings → Limits）"},
    {"id": "groq-gpt-oss", "provider": "groq", "models": ["openai/gpt-oss-120b"], "requests": 1000, "tokens": 200000,
     "note": "同上"},
    {"id": "gemini", "provider": "gemini", "models": ["gemini-3.5-flash-lite"], "requests": 500, "tokens": None,
     "note": "Gemini 3.5 Flash-Lite 免费档每天 500 次、每分钟约 15 次（10-20 在 Google AI Studio 的“速率限制”页看的，官网文档不写）"},
    {"id": "deepseek", "provider": "deepseek", "requests": None, "tokens": None,
     "note": "DeepSeek 没有免费档，按量扣余额：余额在 platform.deepseek.com 看"},
]


def list_price(model: str) -> tuple[float, float] | None:
    """按付费档的标价：免费档的看 LIST_PRICES，付费的就是 PRICES 里的价，本机模型（型号里带冒号、没有斜杠的 Ollama 型号）按 0"""
    if model in LIST_PRICES:
        return LIST_PRICES[model]
    rate = price(model)
    if rate and rate != (0.0, 0.0):
        return rate
    if ":" in model and "/" not in model:
        return (0.0, 0.0)
    return None


def price(model: str) -> tuple[float, float] | None:
    if model in PRICES:
        return PRICES[model]
    if model.endswith(":free"):  # OpenRouter 的免费模型
        return (0.0, 0.0)
    return None


def call_cost(call: dict, rates=None) -> float | None:
    """一次调用花了多少美元。OpenAI 的输出 token 已经含推理；Gemini 的思考 token 另算、按输出价收。
    rates 是按哪张价格表（默认实际花的 price，后台的“按标价折算”传 list_price）"""
    rate = (rates or price)(call.get("model", ""))
    if rate is None:
        return None
    output = (call.get("output_tokens") or 0) + (call.get("thinking_tokens") or 0 if call.get("model", "").startswith("gemini") else 0)
    return ((call.get("prompt_tokens") or 0) * rate[0] + output * rate[1]) / 1e6


def usage(rows: list[dict]) -> dict:
    """按模型、按天汇总模型调用。没有 calls 的旧日志不算"""
    models: dict[str, dict] = defaultdict(lambda: {"calls": 0, "errors": 0, "fallback_to": 0, "prompt_tokens": 0,
                                                   "output_tokens": 0, "thinking_tokens": 0, "cost": 0.0, "unpriced": 0})
    days: dict[str, float] = defaultdict(float)
    turns = alerts_read = 0
    for row in rows:
        calls = row.get("calls")
        if calls is None:
            continue
        turns += 1
        alerts_read += ((row.get("plan") or {}).get("alerts") or {}).get("read") or 0
        day = row.get("day") or "?"
        for call in calls:
            item = models[call.get("model", "?")]
            if call.get("error"):
                item["errors"] += 1
                continue
            item["calls"] += 1
            item["fallback_to"] += 1 if call.get("fallback_from") else 0
            for key in ("prompt_tokens", "output_tokens", "thinking_tokens"):
                item[key] += call.get(key) or 0
            cost = call_cost(call)
            if cost is None:
                item["unpriced"] += 1
            else:
                item["cost"] += cost
                days[day] += cost
    return {"turns": turns, "alerts_read": alerts_read, "models": dict(models), "days": dict(sorted(days.items()))}


def billing(rows: list[dict]) -> dict:
    """计费总账（ledger.load 的行）按天、谁调用的、哪个模型汇总：调用次数、token（估算的有几次）、实际花费、按标价折算。
    没有价格的模型花费记“不知道”（unpriced / unlisted），不当成 0。后台把本机服务的这一份和每晚 GitHub 上读公告的那一份加起来"""
    cells: dict[tuple, dict] = {}
    for row in rows:
        key = (row.get("day") or "?", row.get("source") or "other", row.get("model") or "?", row.get("provider") or "?")
        cell = cells.setdefault(key, {"calls": 0, "prompt_tokens": 0, "output_tokens": 0, "thinking_tokens": 0, "estimated": 0,
                                      "cost": 0.0, "unpriced": 0, "list_cost": 0.0, "unlisted": 0})
        cell["calls"] += 1
        for name in ("prompt_tokens", "output_tokens", "thinking_tokens"):
            cell[name] += row.get(name) or 0
        cell["estimated"] += 1 if row.get("estimated") else 0
        cost = call_cost(row)
        if cost is None:
            cell["unpriced"] += 1
        else:
            cell["cost"] += cost
        listed = call_cost(row, list_price)
        if listed is None:
            cell["unlisted"] += 1
        else:
            cell["list_cost"] += listed
    out = [{"day": day, "source": source, "model": model, "provider": provider, **cell}
           for (day, source, model, provider), cell in sorted(cells.items())]
    return {"rows": out, "limits": FREE_LIMITS}


def billing_report(days: int = 7) -> str:
    """命令行看计费总账（python -m nps_copilot billing）：这台机器上记的（每晚 GitHub 上读公告的那一份在后台看）"""
    rows = billing(ledger.load(days))["rows"]
    if not rows:
        return f"最近 {days} 天计费总账里没有调用（{ledger.folder()}）"
    by_model: dict[str, dict] = defaultdict(lambda: defaultdict(float))
    for row in rows:
        item = by_model[row["model"]]
        for key in ("calls", "prompt_tokens", "output_tokens", "thinking_tokens", "estimated", "cost", "list_cost", "unpriced", "unlisted"):
            item[key] += row[key]
        item[f"source:{row['source']}"] += row["calls"]
    lines = [f"最近 {days} 天的计费总账（{ledger.folder()}）"]
    for model, item in sorted(by_model.items(), key=lambda pair: -pair[1]["calls"]):
        sources = "、".join(f"{key[7:]} {int(value)}" for key, value in item.items() if key.startswith("source:"))
        cost = "不知道（没有价格）" if item["unpriced"] else f"${item['cost']:.4f}"
        listed = "不知道" if item["unlisted"] else f"${item['list_cost']:.4f}"
        lines.append(f"  {model}：{int(item['calls'])} 次（{sources}），token 输入 {int(item['prompt_tokens'])}、输出 {int(item['output_tokens'])}"
                     + (f"（{int(item['estimated'])} 次是按字数估的）" if item["estimated"] else "")
                     + f"；实际花费 {cost}，按付费标价算 {listed}")
    return "\n".join(lines)


def load(days: int, runs: Path = RUNS) -> list[dict]:
    since = dt.date.today() - dt.timedelta(days=days - 1)
    rows = []
    for path in sorted(runs.glob("*.jsonl")):
        try:
            if dt.date.fromisoformat(path.stem) < since:
                continue
        except ValueError:
            continue
        rows.extend({**json.loads(line), "day": path.stem} for line in path.read_text(encoding="utf-8").splitlines() if line.strip())
    # 测试用的假模型（scripted）跑的不算：10-21 以前写进日志的几轮在这里滤掉，文件不动
    return [row for row in rows if not any(call.get("model") == "scripted" for call in row.get("calls") or [])]


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


def daily(rows: list[dict]) -> list[dict]:
    """按天：多少轮、排出行程 / 追问 / 出错各多少、耗时中位数、模型调用和出错、退到备用模型的次数、花费（后台画图用）"""
    by_day: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        by_day[row.get("day") or "?"].append(row)
    out = []
    for day, items in sorted(by_day.items()):
        statuses = [item.get("status") for item in items]
        latencies = [item["latency_ms"] for item in items if isinstance(item.get("latency_ms"), (int, float))]
        calls = [call for item in items for call in item.get("calls") or []]
        costs = [call_cost(call) for call in calls if not call.get("error")]
        out.append({
            "day": day, "turns": len(items), "sessions": len({item.get("session") for item in items}),
            "planned": statuses.count("planned"), "needs_input": statuses.count("needs_input"), "error": statuses.count("error"),
            "median_latency_ms": statistics.median(latencies) if latencies else None,
            "calls": sum(1 for call in calls if not call.get("error")), "call_errors": sum(1 for call in calls if call.get("error")),
            "fallbacks": sum(1 for call in calls if call.get("fallback_from")),
            "tokens": sum((call.get("prompt_tokens") or 0) + (call.get("output_tokens") or 0) + (call.get("thinking_tokens") or 0) for call in calls),
            "cost": sum(cost for cost in costs if cost is not None), "unpriced": sum(1 for cost in costs if cost is None),
        })
    return out


def recent(rows: list[dict], limit: int = 30) -> list[dict]:
    """最近几轮：说了什么（截短）、结果、耗时、用了哪些模型、有没有退到备用的、调度员和 Writer 出没出问题"""
    out = []
    for row in rows[-limit:][::-1]:
        calls = row.get("calls") or []
        out.append({
            "day": row.get("day"), "at": row.get("at"), "session": row.get("session"), "turn": row.get("turn"),
            "logged": "calls" in row,  # 10-19 以前的日志没记模型调用
            "message": (row.get("message") or "")[:120], "status": row.get("status"), "latency_ms": row.get("latency_ms"),
            "route": row.get("route") or ("dispatch" if row.get("dispatch") else None),
            "models": sorted({call.get("model") for call in calls if not call.get("error") and call.get("model")}),
            "calls": sum(1 for call in calls if not call.get("error")), "call_errors": sum(1 for call in calls if call.get("error")),
            "fallback": any(call.get("fallback_from") for call in calls),
            "tokens": sum((call.get("prompt_tokens") or 0) + (call.get("output_tokens") or 0) + (call.get("thinking_tokens") or 0) for call in calls),
            "dropped": len((row.get("intake") or {}).get("dropped_spans", [])) + len((row.get("dispatch") or {}).get("dropped", [])),
            "writer_fallback": bool((row.get("writer") or {}).get("fallback")),
        })
    return out


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
    used = usage(rows)
    if used["turns"]:
        lines.append(f"\n模型用量（记了调用的 {used['turns']} 轮；聊天时现读公告 {used['alerts_read']} 条，那部分的 token 不在下面）")
        for model, item in sorted(used["models"].items(), key=lambda pair: -pair[1]["calls"]):
            cost = "不知道（没有价格）" if item["unpriced"] else f"${item['cost']:.4f}"
            lines.append(f"  {model}：{item['calls']} 次（其中前面的模型出错、轮到它的 {item['fallback_to']} 次），出错 {item['errors']} 次；"
                         f"token 输入 {item['prompt_tokens']}、输出 {item['output_tokens']}、思考 {item['thinking_tokens']}；花费 {cost}")
        if used["days"]:
            lines.append("  每天花费：" + "，".join(f"{day} ${cost:.4f}" for day, cost in used["days"].items()))
    return "\n".join(lines)
