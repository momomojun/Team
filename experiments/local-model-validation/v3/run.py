"""Evaluate complete dialogue traces using local extraction plus deterministic state."""
import datetime as dt
import hashlib
import json
from pathlib import Path
import shutil
import statistics
import time
import urllib.request

from dialogue import Conversation, SCHEMA, WELCOME, empty_raw, valid_raw
from test_dialogue import differences, scenarios

ROOT = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:11435"
MODEL = "qwen3:4b"
OPTIONS = {"temperature": 0, "seed": 42, "num_ctx": 4096, "num_predict": 512}
REFERENCE_DATE = "2026-10-16"
TIMEZONE = "America/Los_Angeles"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def request(path, payload=None):
    req = urllib.request.Request(BASE + path, data=None if payload is None else json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=240) as response:
        return json.load(response)


def annotation_diff(raw, gold):
    if not valid_raw(raw):
        return {"shape": "invalid"}
    diff = {}
    for field, anchors in {**empty_raw(), **gold}.items():
        wanted = anchors if isinstance(anchors, list) else ([] if anchors is None else [anchors])
        value = raw[field]
        got = value if isinstance(value, list) else ([] if value is None else [value])
        if not (all(any(a in q for q in got) for a in wanted) and all(any(a in q for a in wanted) for q in got)):
            diff[field] = dict(expected_anchors=wanted, actual=got)
    return diff


def assistant_message(response):
    question = response["question"]
    if question:
        text = question["text"]
        if question.get("options"):
            text += "\n" + "\n".join(f"{x['id']}. {x['label']}：{x['description']}" for x in question["options"])
        return text
    if response["status"] == "unsupported":
        return "部分公园暂不支持，请确认目的地。"
    if response["status"] == "review_ready":
        return "过去行程的条件已收集完成；本实验不调用回顾服务。"
    return (response["notice"] + "\n" if response["notice"] else "") + "条件已收集，可以进入草案规划阶段；本实验不生成行程。"


def main():
    frozen = json.loads((ROOT / "frozen-manifest.json").read_text(encoding="utf-8"))
    for name, digest in frozen["sha256"].items():
        assert sha(ROOT / name) == digest, "Frozen file changed: " + name
    previous = [ROOT.parent / "results/report.json", ROOT.parent / "v2/runs/20261017T020042Z/report.json"]
    previous_hashes = {str(p.relative_to(ROOT.parent)): sha(p) for p in previous}
    baseline = json.loads(previous[0].read_text(encoding="utf-8"))
    model_digest = next(m["digest"] for m in request("/api/tags")["models"] if m["name"] == MODEL)
    assert model_digest == baseline["metadata"]["running_models"]["models"][0]["digest"]
    run_id = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = ROOT / "runs" / run_id
    out.mkdir(parents=True, exist_ok=False)
    metadata = dict(run_id_utc=run_id, reference_date=REFERENCE_DATE, timezone=TIMEZONE, welcome=WELCOME,
                    model=MODEL, model_digest=model_digest, model_details=request("/api/show", {"model": MODEL})["details"],
                    server_version=request("/api/version"), options=OPTIONS, think=False,
                    prompt=(ROOT / "prompt.txt").read_text(encoding="utf-8"), schema=SCHEMA,
                    frozen=frozen, previous_report_hashes=previous_hashes,
                    limitations=["Scripted user replies and labels written by same author as implementation, not independent blinded evaluation.",
                                 "Dates, selection binding, follow-up wording and state are deterministic code, not LLM-generated dialogue reasoning.",
                                 "Model sees each current user message only; persisted context is managed by code.",
                                 "New task and scoring differ from V2; pass rates must not be compared as model accuracy improvements.",
                                 "No actual itinerary, website, live data, RAG or real human usability study.",
                                 "Fixed client reference date injected for reproducibility; no system date inference."])
    (out / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    results = []
    with (out / "turns.jsonl").open("w", encoding="utf-8") as stream:
        for case in scenarios():
            session = Conversation(REFERENCE_DATE, TIMEZONE)
            turns = []
            for index, turn in enumerate(case["turns"]):
                calls = []

                def extract(user):
                    begin_call = time.perf_counter()
                    reply = request("/api/chat", dict(model=MODEL, messages=[{"role": "system", "content": metadata["prompt"]}, {"role": "user", "content": user}], format=SCHEMA, options=OPTIONS, think=False, stream=False, keep_alive="10m"))
                    calls.append({"raw_response": reply, "wall_seconds": round(time.perf_counter() - begin_call, 3)})
                    if reply.get("done_reason") == "length":
                        raise ValueError("Output truncated")
                    return json.loads(reply["message"]["content"])

                begin = time.perf_counter()
                row = dict(scenario=case["id"], turn=index + 1, user=turn["user"], expected=turn["expected"])
                try:
                    response, trace = session.step(turn["user"], extract)
                    row.update(response=response, trace=trace, assistant=assistant_message(response), differences=differences(response, turn["expected"]))
                    row["passed"] = not row["differences"]
                    if calls and "gold" in turn:
                        row["annotation_differences"] = annotation_diff(trace["model_output"], turn["gold"])
                except Exception as exc:
                    row.update(passed=False, error=f"{type(exc).__name__}: {exc}")
                row.update(calls=calls, wall_seconds=round(time.perf_counter() - begin, 3))
                turns.append(row)
                stream.write(json.dumps(row, ensure_ascii=False) + "\n")
                stream.flush()
                print(f"{case['id']} turn {index+1}: {'PASS' if row['passed'] else 'FAIL'} calls={len(calls)} {json.dumps(row.get('differences', row.get('error')), ensure_ascii=False)}", flush=True)
            results.append(dict(id=case["id"], passed=all(t["passed"] for t in turns), turns=turns))
    flat = [t for c in results for t in c["turns"]]
    calls = [call for t in flat for call in t["calls"]]
    annotation_rows = [t for t in flat if "annotation_differences" in t]
    summary = dict(scenarios=len(results), scenarios_passed=sum(c["passed"] for c in results),
                   turns=len(flat), turns_passed=sum(t["passed"] for t in flat), model_calls=len(calls),
                   annotated_extraction_turns=len(annotation_rows), annotated_extraction_passed=sum(not t["annotation_differences"] for t in annotation_rows),
                   model_call_median_seconds=statistics.median(c["wall_seconds"] for c in calls) if calls else None,
                   first_model_call_seconds=calls[0]["wall_seconds"] if calls else None)
    for path in previous:
        assert sha(path) == previous_hashes[str(path.relative_to(ROOT.parent))], "Historical report changed"
    report = dict(metadata=metadata, summary=summary, scenarios=results, runtime_models=request("/api/ps"))
    (out / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    shutil.copyfile(ROOT / "unit-test-results.txt", out / "unit-test-results.txt")
    lines = ["# V3 多轮对话实际输入输出", "", f"运行 ID（UTC）：{run_id}", f"固定参考日期：{REFERENCE_DATE}；时区：{TIMEZONE}", "",
             f"完整场景通过：{summary['scenarios_passed']}/{summary['scenarios']}；逐轮通过：{summary['turns_passed']}/{summary['turns']}；实际模型调用：{summary['model_calls']} 次。", "",
             f"原文标注覆盖：{summary['annotated_extraction_passed']}/{summary['annotated_extraction_turns']}（保守片段覆盖指标，不是完整语义准确率）。", "",
             "欢迎语（代码模板）：", "> " + WELCOME, ""]
    for scenario in sorted(results, key=lambda x: x["passed"]):
        lines += [f"## {scenario['id']}：{'通过' if scenario['passed'] else '失败'}", ""]
        for turn in scenario["turns"]:
            lines += [f"### 第 {turn['turn']} 轮", "", "用户：" + turn["user"], "", "程序实际回复：", "", turn.get("assistant", turn.get("error", "")), "",
                      "模型原始提取（若无需模型则标注）：", "```json", json.dumps(turn.get("trace", {}).get("model_output", {"model_called": False}), ensure_ascii=False, indent=2), "```", "",
                      "状态与差异：", "```json", json.dumps({"state": turn.get("response", {}).get("state"), "expected": turn["expected"], "differences": turn.get("differences"), "annotation_differences": turn.get("annotation_differences")}, ensure_ascii=False, indent=2), "```", ""]
    lines += ["## 实验限制", ""] + ["- " + x for x in metadata["limitations"]]
    (out / "TRANSCRIPTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (ROOT / "LATEST_RUN.txt").write_text(run_id + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)
    print("Saved:", out, flush=True)


if __name__ == "__main__":
    main()
