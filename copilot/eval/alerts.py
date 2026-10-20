"""NPS 公告提取临时关闭的评测：公告快照 + 先标好的标准答案（labels），比较模型和规则。

  python eval/alerts.py                                     # 本机 Ollama，同时报规则的成绩
  python eval/alerts.py --record                            # 同上，并录到 recordings/<模型>-alerts-<快照日期>.jsonl
  python eval/alerts.py --replay recordings/x.jsonl --gate eval/baseline-alerts.json   # CI

指标：
- 类型（full / partial / none）准确率；“是不是整段关闭”的精确率、召回率
- 景点：按（公告, 景点）算精确率、召回率、F1——关错了景点会让行程少去一个地方，漏了会排进去不了的地方
- 日期：标准答案写了起止日期的，模型读对了几个
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

from nps_copilot import alerts as alerts_module  # noqa: E402
from nps_copilot.pipeline import prompt_hashes  # noqa: E402
from guard import safe_name  # noqa: E402
from nps_copilot.providers import RecordingProvider, ReplayProvider, from_env  # noqa: E402

SNAPSHOT = HERE / "alerts" / "snapshot-2026-10-19.json"
LABELS = HERE / "alerts" / "labels-2026-10-19.jsonl"


def score(predictions: dict[str, alerts_module.Extraction], labels: list[dict]) -> dict:
    type_ok = tp_full = fp_full = fn_full = 0
    pair_tp = pair_fp = pair_fn = 0
    date_total = date_ok = 0
    misses = []
    for gold in labels:
        pred = predictions[gold["id"]]
        type_ok += pred.type == gold["type"]
        if pred.type == "full" and gold["type"] == "full":
            tp_full += 1
        elif pred.type == "full":
            fp_full += 1
        elif gold["type"] == "full":
            fn_full += 1
        got, want = set(pred.closed), set(gold["closed"])
        pair_tp += len(got & want)
        pair_fp += len(got - want)
        pair_fn += len(want - got)
        for key, value in (("from", pred.start), ("reopen", pred.reopen)):
            if gold.get(key):
                date_total += 1
                date_ok += value == gold[key]
        if pred.type != gold["type"] or got != want:
            misses.append({"id": gold["id"], "park": gold["park"], "want": [gold["type"], sorted(want)], "got": [pred.type, sorted(got)]})
    precision = pair_tp / (pair_tp + pair_fp) if pair_tp + pair_fp else 1.0
    recall = pair_tp / (pair_tp + pair_fn) if pair_tp + pair_fn else 1.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "alerts": len(labels), "type_accuracy": round(type_ok / len(labels), 3),
        "full_precision": round(tp_full / (tp_full + fp_full), 3) if tp_full + fp_full else 1.0,
        "full_recall": round(tp_full / (tp_full + fn_full), 3) if tp_full + fn_full else 1.0,
        "attraction_precision": round(precision, 3), "attraction_recall": round(recall, 3), "attraction_f1": round(f1, 3),
        "dates": f"{date_ok}/{date_total}", "misses": misses,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot", type=Path, default=SNAPSHOT)
    parser.add_argument("--labels", type=Path, default=LABELS)
    parser.add_argument("--replay", type=Path)
    parser.add_argument("--record", action="store_true")
    parser.add_argument("--gate", type=Path)
    parser.add_argument("--rules-only", action="store_true")
    parser.add_argument("--sample", type=int, help="只抽这么多条（固定种子；给每天只有几十次的免费额度用），录音另存一份")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    snapshot = json.loads(args.snapshot.read_text(encoding="utf-8"))
    by_id = {alert["id"]: alert for alert in snapshot["alerts"]}
    labels = [json.loads(line) for line in args.labels.read_text(encoding="utf-8").splitlines() if line.strip()]
    if args.sample:
        # 固定种子抽样，几个模型抽到的是同一批；整段关闭的多抽一些（总共只有 30 条），分数才有意义
        import random

        rng = random.Random(42)
        full = [g for g in labels if g["type"] == "full"]
        rest = [g for g in labels if g["type"] != "full"]
        take = min(len(full), args.sample // 2)
        labels = sorted(rng.sample(full, take) + rng.sample(rest, args.sample - take), key=lambda g: g["id"])
    reference = dt.date.fromisoformat(snapshot["fetched"])
    # 标准答案里拿不准的（ambiguous：比如标题写 Partial Closure、但我们的景点整段在关的那段上）另算一份“只看没争议的”
    clear = [g for g in labels if not g.get("ambiguous")]

    def both(predictions):
        result = score(predictions, labels)
        result["clear"] = {k: v for k, v in score(predictions, clear).items() if k != "misses"}
        return result

    results = {"rules": both({g["id"]: alerts_module.rules_extract(by_id[g["id"]]) for g in labels})}
    label = None
    if not args.rules_only:
        if args.replay:
            provider, label = ReplayProvider(args.replay), f"replay:{args.replay.stem}"
        else:
            provider = from_env()  # 默认本机 Ollama；COPILOT_PROVIDER=gemini / openai 换商业 API（对照实验）
            label = provider.model
            if args.record:
                sample = f"-sample{args.sample}" if args.sample else ""
                path = HERE / "recordings" / f"{safe_name(provider.model)}-alerts-{snapshot['fetched']}{sample}.jsonl"
                path.unlink(missing_ok=True)
                provider = RecordingProvider(provider, path)
        predictions = {}
        for k, g in enumerate(labels):
            predictions[g["id"]] = alerts_module.extract(by_id[g["id"]], provider, reference)
            # 前 3 条都出错（key 不对、模型不认设置、额度用完）：停下，不把 151 次额度白白用掉
            if k == 2 and all("error" in p.trace for p in predictions.values()):
                print(f"前 3 条都出错，停下：{next(iter(predictions.values())).trace['error'][:200]}")
                return 2
        results["model"] = both(predictions)
        results["both"] = both({g["id"]: alerts_module.combined(predictions[g["id"]], alerts_module.rules_extract(by_id[g["id"]])) for g in labels})
        results["model"]["dropped"] = sum(1 for p in predictions.values() if p.trace.get("dropped"))
        results["model"]["dropped_dates"] = sum(len(p.trace.get("dropped_dates", [])) for p in predictions.values())
        # 速度和用量（对照实验比成本用）：延迟中位数、出错的条数，每条平均输入、输出、思考 token
        latencies = sorted(p.trace["latency_ms"] for p in predictions.values() if "latency_ms" in p.trace)
        usage = [p.trace.get("usage") or {} for p in predictions.values()]
        mean = lambda key: round(sum(u.get(key) or 0 for u in usage) / max(1, sum(1 for u in usage if u.get(key) is not None)), 1)  # noqa: E731
        results["model"]["speed"] = {
            "median_ms": latencies[len(latencies) // 2] if latencies else None,
            "errors": sum(1 for p in predictions.values() if "error" in p.trace),
            # 出错的原因（超时、服务忙、额度用完……）各几条
            "error_kinds": dict(Counter(p.trace["error"].split("：")[0][:40] for p in predictions.values() if "error" in p.trace)),
            "prompt_tokens": mean("prompt_tokens") or mean("prompt_eval_count"),
            "output_tokens": mean("output_tokens") or mean("eval_count"),
            "thinking_tokens": mean("thinking_tokens"),
        }
    for name, result in results.items():
        print(f"{name:6} 类型 {result['type_accuracy']:.0%}  整段关闭 精确 {result['full_precision']:.0%} 召回 {result['full_recall']:.0%}  "
              f"景点 精确 {result['attraction_precision']:.0%} 召回 {result['attraction_recall']:.0%} F1 {result['attraction_f1']:.2f}  日期 {result['dates']}"
              + (f"  证据对不上被丢掉 {result['dropped']}、日期对不上 {result['dropped_dates']}" if "dropped" in result else ""))
        if "speed" in result:
            s = result["speed"]
            print(f"       延迟中位数 {s['median_ms']} ms，出错 {s['errors']} 条；每条平均 输入 {s['prompt_tokens']} / 输出 {s['output_tokens']} / 思考 {s['thinking_tokens']} token")
        c = result["clear"]
        print(f"       只看没争议的 {c['alerts']} 条：类型 {c['type_accuracy']:.0%}  景点 F1 {c['attraction_f1']:.2f}  日期 {c['dates']}")
    reports = HERE / "reports"
    reports.mkdir(exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y%m%dT%H%M%S")
    out = reports / f"{stamp}-alerts-{(label or 'rules').replace(':', '_').replace('/', '_')}.json"
    out.write_text(json.dumps({"label": label, "prompts": prompt_hashes(), **results}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"报告：{out}")
    if args.gate and "model" in results:
        baseline = json.loads(args.gate.read_text(encoding="utf-8"))
        model = results["model"]
        worse = [key for key in ("type_accuracy", "attraction_f1") if model[key] < baseline[key]]
        if worse:
            print(f"门禁没过：{', '.join(f'{k} {model[k]} < {baseline[k]}' for k in worse)}")
            return 1
        print(f"门禁通过：类型 {model['type_accuracy']} ≥ {baseline['type_accuracy']}，景点 F1 {model['attraction_f1']} ≥ {baseline['attraction_f1']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
