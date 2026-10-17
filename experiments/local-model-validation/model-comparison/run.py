"""Controlled paired model comparison, reusing frozen V2/V3 workflows unchanged."""
import argparse
import datetime as dt
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import statistics
import sys
import time
import urllib.request

ROOT = Path(__file__).resolve().parent
EXPERIMENT = ROOT.parent
BASE = "http://127.0.0.1:11435"
OPTIONS = dict(temperature=0, seed=42, num_ctx=4096, num_predict=512,
               top_k=20, top_p=0.95, min_p=0, repeat_penalty=1,
               presence_penalty=0, frequency_penalty=0)


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


sys.path.insert(0, str(EXPERIMENT / "v2"))
v2 = load("comparison_v2", EXPERIMENT / "v2/intake.py")
v2test = load("comparison_v2test", EXPERIMENT / "v2/test_intake.py")
sys.path.insert(0, str(EXPERIMENT / "v3"))
v3 = load("comparison_v3", EXPERIMENT / "v3/dialogue.py")
v3test = load("comparison_v3test", EXPERIMENT / "v3/test_dialogue.py")
v3runner = load("comparison_v3runner", EXPERIMENT / "v3/run.py")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def request(path, payload=None, timeout=240):
    req = urllib.request.Request(BASE + path, data=None if payload is None else json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.load(response)


def call(model, prompt, schema, user):
    begin = time.perf_counter()
    reply = request("/api/chat", dict(model=model, messages=[{"role": "system", "content": prompt}, {"role": "user", "content": user}], format=schema, options=OPTIONS, think=False, stream=False, keep_alive="10m"))
    wall = round(time.perf_counter() - begin, 3)
    return reply, wall


def content(reply):
    if reply.get("done_reason") == "length":
        raise ValueError("Model output truncated at token limit")
    if reply.get("message", {}).get("thinking"):
        raise ValueError("Non-thinking comparison received thinking content")
    return json.loads(reply["message"]["content"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--models", nargs="+", default=["qwen3:4b", "qwen3.5:4b-q4_K_M"])
    args = parser.parse_args()
    frozen = json.loads((ROOT / "frozen-manifest.json").read_text(encoding="utf-8"))
    for name, digest in frozen["sha256"].items():
        assert sha(ROOT / name) == digest, "Comparison frozen file changed: " + name
    for version in ("v2", "v3"):
        old_manifest = json.loads((EXPERIMENT / version / "frozen-manifest.json").read_text(encoding="utf-8"))
        for name, digest in old_manifest["sha256"].items():
            assert sha(EXPERIMENT / version / name) == digest, version + " source changed: " + name
    report_paths = [EXPERIMENT / "results/report.json", EXPERIMENT / "v2/runs/20261017T020042Z/report.json", EXPERIMENT / "v3/runs/20261017T025427Z/report.json"]
    hashes = {str(p.relative_to(EXPERIMENT)): sha(p) for p in report_paths}
    prompts = {version: (EXPERIMENT / version / "prompt.txt").read_text(encoding="utf-8") for version in ("v2", "v3")}
    tags = request("/api/tags")["models"]
    run_id = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = ROOT / "runs" / run_id
    out.mkdir(parents=True, exist_ok=False)
    metadata = dict(run_id_utc=run_id, models=args.models, options=OPTIONS, think=False, frozen=frozen,
                    prompts=prompts, schemas={"v2": v2.SCHEMA, "v3": v3.SCHEMA}, server_version=request("/api/version"),
                    previous_report_hashes=hashes, reference_date="2026-10-16", timezone="America/Los_Angeles",
                    limitations=["Exposed, author-written fixtures, not new blind validation. Single pass.",
                                 "Same explicit sampling values, prompt, schema and workflow per task; model templates/architecture differ.",
                                 "This controlled decoding profile is not a per-family optimized configuration.",
                                 "V3 questions and date/selection binding are code; not free-form model dialogue.",
                                 "Historical V2/V3 runs did not pin every sampler; primary comparison here reruns both models.",
                                 "No itinerary tools, live data or production/concurrency test."], model_metadata={})
    rows, dialogue_results, preflights = [], [], []
    with (out / "records.jsonl").open("w", encoding="utf-8") as stream:
        def record(value):
            stream.write(json.dumps(value, ensure_ascii=False) + "\n")
            stream.flush()

        for model in args.models:
            model_tag = next(m for m in tags if m["name"] == model or m.get("model") == model)
            metadata["model_metadata"][model] = {"tag": model_tag, "show": request("/api/show", {"model": model})}
            (out / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
            # Separate preflight warms the model and checks non-thinking/schema compatibility.
            first = v2test.fixtures()[0]
            reply, wall = call(model, prompts["v2"], v2.SCHEMA, first["input"])
            parsed = content(reply)
            assert v2.shape_valid(parsed), "Preflight output does not match schema"
            preflight = dict(kind="preflight", model=model, wall_seconds=wall, raw_response=reply)
            preflights.append(preflight)
            record(preflight)
            print(f"{model}: preflight OK ({wall}s)", flush=True)
            for index, case in enumerate(v2test.fixtures()):
                row = dict(kind="v2", model=model, split="regression" if index < 16 else "new", id=case["id"], input=case["input"], expected=case["expected"], gold_raw=case["raw"])
                begin = time.perf_counter()
                try:
                    reply, wall = call(model, prompts["v2"], v2.SCHEMA, case["input"])
                    row["raw_response"] = reply
                    raw = content(reply)
                    normalized = v2.normalize(raw, case["input"])
                    diff = v2test.compare(normalized["result"], case["expected"]) if normalized["result"] is not None else {"shape": "invalid"}
                    annotation = v2.evidence_differences(raw, case["raw"]) if v2.shape_valid(raw) else {"shape": "invalid"}
                    row.update(model_output=raw, normalization=normalized, differences=diff, annotation_differences=annotation,
                               extraction_passed=not annotation and not normalized["evidence_errors"],
                               passed=not diff and not normalized["evidence_errors"])
                except Exception as exc:
                    row.update(passed=False, extraction_passed=False, error=f"{type(exc).__name__}: {exc}")
                row["wall_seconds"] = round(time.perf_counter() - begin, 3)
                rows.append(row)
                record(row)
                print(f"{model} V2/{row['split']}/{case['id']}: {'PASS' if row['passed'] else 'FAIL'} {row['wall_seconds']}s {json.dumps(row.get('differences', row.get('error')), ensure_ascii=False)}", flush=True)
            for case in v3test.scenarios():
                session = v3.Conversation("2026-10-16", "America/Los_Angeles")
                turns = []
                for index, turn in enumerate(case["turns"]):
                    calls = []

                    def extract(user):
                        response, seconds = call(model, prompts["v3"], v3.SCHEMA, user)
                        calls.append({"raw_response": response, "wall_seconds": seconds})
                        return content(response)

                    row = dict(kind="v3", model=model, scenario=case["id"], turn=index + 1, user=turn["user"], expected=turn["expected"])
                    begin = time.perf_counter()
                    try:
                        response, trace = session.step(turn["user"], extract)
                        diff = v3test.differences(response, turn["expected"])
                        row.update(response=response, trace=trace, assistant=v3runner.assistant_message(response), differences=diff, passed=not diff)
                        if calls and "gold" in turn:
                            row["annotation_differences"] = v3runner.annotation_diff(trace["model_output"], turn["gold"])
                    except Exception as exc:
                        row.update(passed=False, error=f"{type(exc).__name__}: {exc}")
                    row.update(calls=calls, wall_seconds=round(time.perf_counter() - begin, 3))
                    turns.append(row)
                    record(row)
                    print(f"{model} V3/{case['id']}/{index+1}: {'PASS' if row['passed'] else 'FAIL'}", flush=True)
                dialogue_results.append(dict(model=model, id=case["id"], passed=all(t["passed"] for t in turns), turns=turns))
            metadata["model_metadata"][model]["runtime_models"] = request("/api/ps")
            request("/api/generate", {"model": model, "stream": False, "keep_alive": 0})
    summaries = {}
    for model in args.models:
        item = {}
        for split in ("regression", "new"):
            group = [r for r in rows if r["model"] == model and r["split"] == split]
            item["v2_" + split] = dict(total=len(group), passed=sum(r["passed"] for r in group), extraction_passed=sum(r["extraction_passed"] for r in group), median_seconds=statistics.median(r["wall_seconds"] for r in group))
        group = [d for d in dialogue_results if d["model"] == model]
        turns = [t for d in group for t in d["turns"]]
        calls = [c for t in turns for c in t["calls"]]
        annotated = [t for t in turns if "annotation_differences" in t]
        item["v3"] = dict(total=len(group), passed=sum(d["passed"] for d in group), turns=len(turns), turns_passed=sum(t["passed"] for t in turns),
                          model_calls=len(calls), annotated_turns=len(annotated), extraction_passed=sum(not t["annotation_differences"] for t in annotated),
                          model_call_median_seconds=statistics.median(c["wall_seconds"] for c in calls) if calls else None)
        summaries[model] = item
    for path in report_paths:
        assert sha(path) == hashes[str(path.relative_to(EXPERIMENT))], "Historical report changed"
    (out / "report.json").write_text(json.dumps(dict(metadata=metadata, summary=summaries, preflights=preflights, v2_cases=rows, v3_dialogues=dialogue_results), ensure_ascii=False, indent=2), encoding="utf-8")
    (out / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = ["# 同任务模型对照：实际输入输出", "", f"运行 ID（UTC）：{run_id}", "", "```json", json.dumps(summaries, ensure_ascii=False, indent=2), "```", ""]
    for row in rows:
        lines += [f"## {row['model']} / V2 / {row['id']} / {'PASS' if row['passed'] else 'FAIL'}", "", row["input"], "", "```json",
                  json.dumps({k: row.get(k) for k in ("model_output", "normalization", "expected", "differences", "annotation_differences", "error")}, ensure_ascii=False, indent=2), "```", ""]
    for dialogue in dialogue_results:
        lines += [f"## {dialogue['model']} / V3 / {dialogue['id']} / {'PASS' if dialogue['passed'] else 'FAIL'}", ""]
        for turn in dialogue["turns"]:
            lines += [f"### 第 {turn['turn']} 轮", "", "用户：" + turn["user"], "", "实际程序回复：" + turn.get("assistant", turn.get("error", "")), "", "```json",
                      json.dumps({"model_output": turn.get("trace", {}).get("model_output"), "state": turn.get("response", {}).get("state"), "expected": turn["expected"], "differences": turn.get("differences")}, ensure_ascii=False, indent=2), "```", ""]
    lines += ["## 限制", ""] + ["- " + note for note in metadata["limitations"]]
    (out / "INPUT_OUTPUTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    if (ROOT / "unit-test-results.txt").exists():
        shutil.copyfile(ROOT / "unit-test-results.txt", out / "unit-test-results.txt")
    (ROOT / "LATEST_RUN.txt").write_text(run_id + "\n", encoding="utf-8")
    print(json.dumps(summaries, ensure_ascii=False, indent=2), flush=True)
    print("Saved:", out, flush=True)


if __name__ == "__main__":
    main()
