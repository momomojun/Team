"""把几个模型的 NPS 公告提取评测报告（eval/alerts.py 写的 reports/*-alerts-*.json）整理成一张对照表：
准确率、速度、每 1000 次调用多少钱。每个模型取最新的一份报告。

  python eval/compare_alerts.py

价格是 2026-10-19 查的第三方汇总（每百万 token，美元），没有官网核实，只用来比数量级；Gemini 免费档按 0 算，
括号里是付费档的参考价。OpenAI 的推理（思考）token 按输出计费
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

from nps_copilot.monitor import PRICES  # noqa: E402  价格表只放一处


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    latest: dict[str, dict] = {}
    for path in sorted((HERE / "reports").glob("*-alerts-*.json")):
        report = json.loads(path.read_text(encoding="utf-8"))
        label = report.get("label") or ""
        if "model" not in report or label.startswith("replay:") and "qwen" not in label:
            continue
        model = "qwen3.5:4b-q4_K_M" if label.startswith("replay:") else label
        latest[model] = report
    print("| 模型 | 类型 | 整段关闭 精确 / 召回 | 景点 F1 | 日期 | 没争议的：类型 / F1 | 延迟中位数 | 每条 token（入 / 出 / 思考） | 每 1000 次 |")
    print("|---|---|---|---|---|---|---|---|---|")
    for model, report in sorted(latest.items(), key=lambda item: -item[1]["model"]["attraction_f1"]):
        m, c, s = report["model"], report["model"]["clear"], report["model"].get("speed") or {}
        price_in, price_out = PRICES.get(model, (None, None))
        tokens_in, tokens_out, thinking = s.get("prompt_tokens") or 0, s.get("output_tokens") or 0, s.get("thinking_tokens") or 0
        # OpenAI 的 completion_tokens 已经含推理 token；Gemini 的思考 token 另算
        billed_out = tokens_out + (thinking if model.startswith("gemini") else 0)
        cost = "—" if price_in is None else f"${(tokens_in * price_in + billed_out * price_out) * 1000 / 1e6:.3f}"
        latency = f"{s['median_ms'] / 1000:.1f} 秒" if s.get("median_ms") else "—"
        print(f"| {model} | {m['type_accuracy']:.0%} | {m['full_precision']:.0%} / {m['full_recall']:.0%} | {m['attraction_f1']:.2f} | "
              f"{m['dates']} | {c['type_accuracy']:.0%} / {c['attraction_f1']:.2f} | {latency} | "
              f"{tokens_in:.0f} / {tokens_out:.0f} / {thinking:.0f} | {cost} |")


if __name__ == "__main__":
    main()
