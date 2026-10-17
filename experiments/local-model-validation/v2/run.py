"""Compare raw-extraction+rules against the preserved v1 configuration. Local-only."""
import datetime as dt
import hashlib
import importlib.util
import json
from pathlib import Path
import statistics
import time
import urllib.request

from intake import SCHEMA, evidence_differences, normalize, shape_valid
from test_intake import compare, fixtures

ROOT = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:11435"
MODEL = "qwen3:4b"
OPTIONS = {"temperature": 0, "seed": 42, "num_ctx": 4096, "num_predict": 512}


def request(path, payload=None):
    req = urllib.request.Request(BASE + path, data=None if payload is None else json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=240) as response:
        return json.load(response)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    frozen = json.loads((ROOT / "frozen-manifest.json").read_text(encoding="utf-8"))
    for name, digest in frozen["sha256"].items():
        if sha((ROOT / name).read_bytes()) != digest:
            raise RuntimeError("Frozen input changed: " + name)
    baseline_path = ROOT.parent / "results/report.json"
    original_hash = sha(baseline_path.read_bytes())
    baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
    spec = importlib.util.spec_from_file_location("baseline_module", ROOT.parent / "validate.py")
    v1 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(v1)
    model = request("/api/show", {"model": MODEL})
    tags = request("/api/tags")
    digest = next(x["digest"] for x in tags["models"] if x["name"] == MODEL)
    assert digest == baseline["metadata"]["running_models"]["models"][0]["digest"], "Model changed"
    run_id = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = ROOT / "runs" / run_id
    out.mkdir(parents=True, exist_ok=False)
    metadata = dict(started_at_utc=run_id, model=MODEL, model_digest=digest, model_details=model["details"],
                    server_version=request("/api/version"), options=OPTIONS, think=False,
                    frozen=frozen, original_report_sha256=original_hash,
                    v1_prompt=baseline["metadata"]["prompt"], v1_schema=baseline["metadata"]["schema"],
                    v2_prompt=(ROOT / "prompt.txt").read_text(encoding="utf-8"), v2_schema=SCHEMA,
                    source_sha256={p.name: sha(p.read_bytes()) for p in [ROOT / "intake.py", ROOT / "run.py", ROOT / "test_intake.py"]},
                    limitations=["Same author wrote implementation and labels; not a blinded independent held-out benchmark.",
                                 "New cases frozen before inference; no post-result prompt or label tuning in this run.",
                                 "Both prompt and pipeline changed: improvements cannot be attributed to model ability alone.",
                                 "Evidence metric is annotation coverage, not general semantic entailment.",
                                 "No factual travel tools, multi-turn dialogue, concurrency or agent evaluation."])
    (out / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    cases = fixtures()
    jobs = [("v2", "regression", c) for c in cases[:16]] + [(version, "new", c) for c in cases[16:] for version in ("v1", "v2")]
    rows = []
    with (out / "cases.jsonl").open("w", encoding="utf-8") as stream:
        for version, split, case in jobs:
            row = dict(version=version, split=split, id=case["id"], input=case["input"], expected=case["expected"], gold_raw=case["raw"])
            begin = time.perf_counter()
            try:
                raw = request("/api/chat", dict(model=MODEL, messages=[{"role": "system", "content": metadata[version + "_prompt"]}, {"role": "user", "content": case["input"]}], format=metadata[version + "_schema"], options=OPTIONS, think=False, stream=False, keep_alive="10m"))
                row["raw_response"] = raw
                actual = json.loads(raw["message"]["content"])
                row["model_output"] = actual
                if version == "v2":
                    row["raw_shape_valid"] = shape_valid(actual)
                    normalized = normalize(actual, case["input"])
                    row["normalization"] = normalized
                    row["extraction_differences"] = evidence_differences(actual, case["raw"]) if row["raw_shape_valid"] else {"shape": "invalid"}
                    row["extraction_passed"] = row["raw_shape_valid"] and not row["extraction_differences"] and not normalized["evidence_errors"]
                    result = normalized["result"]
                    valid = row["raw_shape_valid"] and not normalized["evidence_errors"]
                else:
                    result = actual
                    valid = v1.validate_shape(actual)
                row["result"] = result
                row["differences"] = compare(result, case["expected"]) if result is not None else {"output": "invalid"}
                row["passed"] = valid and not row["differences"] and raw.get("done_reason") != "length"
            except Exception as exc:
                row.update(passed=False, error=f"{type(exc).__name__}: {exc}")
            row["wall_seconds"] = round(time.perf_counter() - begin, 3)
            rows.append(row)
            stream.write(json.dumps(row, ensure_ascii=False) + "\n")
            stream.flush()
            detail = row.get("differences", row.get("error", ""))
            print(f"{version}/{split}/{case['id']}: {'PASS' if row['passed'] else 'FAIL'} {row['wall_seconds']}s {json.dumps(detail, ensure_ascii=False)}", flush=True)
    assert sha(baseline_path.read_bytes()) == original_hash, "Original report must not change"
    summary = {}
    for version, split in (("v2", "regression"), ("v1", "new"), ("v2", "new")):
        group = [r for r in rows if r["version"] == version and r["split"] == split]
        summary[version + "_" + split] = dict(total=len(group), passed=sum(r["passed"] for r in group),
                                              extraction_passed=sum(r.get("extraction_passed", False) for r in group) if version == "v2" else None,
                                              median_seconds=statistics.median(r["wall_seconds"] for r in group))
    report = dict(metadata=metadata, summary=summary, cases=rows, runtime_models=request("/api/ps"))
    (out / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = ["# V2 条件提取与代码校验实验", "", "运行 ID（UTC）：" + run_id, "",
             "| 配置 | 数据集 | 完整流程通过 | 原文提取标注覆盖通过 | 中位耗时（秒） |", "|---|---|---:|---:|---:|"]
    lines.append("| V1 历史基线 | 旧 16 条 | 5/16 | 不适用 | 1.259（去首请求） |")
    for key, group in summary.items():
        extraction = "不适用" if group["extraction_passed"] is None else f"{group['extraction_passed']}/{group['total']}"
        lines.append(f"| {key.split('_')[0]} | {'旧回归集' if key.endswith('regression') else '新预冻结集'} | {group['passed']}/{group['total']} | {extraction} | {group['median_seconds']:.3f} |")
    lines += ["", "规则正确性请另看 `unit-test-results.txt`：给定人工标注的提取结果时，代码是否生成正确状态与字段。它不代表模型分数。",
              "", "## 失败案例", ""]
    for row in rows:
        if not row["passed"] or (row["version"] == "v2" and not row.get("extraction_passed")):
            lines += [f"### {row['version']}/{row['split']}/{row['id']}", "", row["input"], "",
                      "```json", json.dumps({k: row.get(k) for k in ("model_output", "result", "differences", "extraction_differences", "error")}, ensure_ascii=False, indent=2), "```", ""]
    lines += ["## 限制", ""] + ["- " + note for note in metadata["limitations"]]
    lines += ["", "原始报告与逐条记录保存在本运行文件夹。原 V1 报告未修改。延迟受首次加载及提示词缓存影响；本实验交替调用 V1/V2，不等同于旧基线连续同提示词的延迟。"]
    (out / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (ROOT / "LATEST_RUN.txt").write_text(run_id + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)
    print("Saved:", out, flush=True)


if __name__ == "__main__":
    main()
