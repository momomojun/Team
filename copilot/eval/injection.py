"""回归注入测试（计划书 §8 目标 3，GOALS P34）：故意把更差的东西放进来，证明门禁真的拦得住。

门禁平时只看到“通过了”，不知道它是不是什么都放行。这里每一种都故意放进一个更差的版本，期望门禁说“不行”：

  1. 对照组：现在的默认组合（本机 Qwen3.5 4B 的录音 + 默认提示词），门禁应该放行；
  2. 更差的提示词：intake v2（10-17 写的没采用的版本）的录音；
  3. 更弱的模型：Qwen3 4B、Qwen3.5 9B 的录音（同一套提示词和代码，只换模型）；
  4. 坏数据：把网站导出的资料复制一份、改坏（字段改名、时区写错、机场不存在、景点 id 重复），服务启动时的校验（snapshot.py）应该拒绝。

全部按预期（对照组放行、其余都拦下）才以 0 退出，CI 里每个 PR 都跑。都是回放和本地文件，不调模型、不联网。

  python eval/injection.py
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

from nps_copilot import snapshot  # noqa: E402

REC = HERE / "recordings"
GATE = HERE / "baseline.json"

# (名字, 期望, 录音, 额外环境变量)
REPLAYS = [
    ("对照：现在的默认组合", "pass", REC / "qwen3.5_4b-q4_K_M.jsonl", {}),
    ("更差的提示词：intake v2", "block", REC / "qwen3.5_4b-q4_K_M-intake_v2.jsonl", {"COPILOT_PROMPT_INTAKE": "v2"}),
    ("更弱的模型：Qwen3 4B", "block", REC / "qwen3_4b.jsonl", {}),
    ("更弱的模型：Qwen3.5 9B（对这套提示词反而差一题）", "block", REC / "qwen3.5_9b-q4_K_M.jsonl", {}),
]


def replay(recording: Path, env: dict) -> tuple[bool, str]:
    """跑一遍单句评测的门禁；返回 (门禁放行没有, 最后一行输出)"""
    completed = subprocess.run(
        [sys.executable, str(HERE / "run.py"), "--replay", str(recording), "--gate", str(GATE), "--out", tempfile.gettempdir()],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        env={**os.environ, "PYTHONIOENCODING": "utf-8", **env}, timeout=600,
    )
    lines = [line for line in completed.stdout.splitlines() if line.strip()]
    return completed.returncode == 0, (lines[-1] if lines else completed.stderr[-300:])


def bad_data_cases() -> list[tuple[str, callable]]:
    def rename_field(rows):
        rows[0]["nameZhHans"] = rows[0].pop("nameZh")

    def bad_time_zone(rows):
        rows[0]["timeZone"] = "America/Yosemite"

    def unknown_airport(rows):
        rows[1]["airports"].append("XXX")

    def duplicate_attraction(rows):
        rows.append(dict(rows[0]))

    return [
        ("坏数据：公园的字段改了名（nameZh → nameZhHans）", "parks.json", rename_field),
        ("坏数据：时区写错", "parks.json", bad_time_zone),
        ("坏数据：常用机场不在机场表里", "parks.json", unknown_airport),
        ("坏数据：景点 id 重复", "attractions.json", duplicate_attraction),
    ]


def bad_data(file: str, change) -> tuple[bool, str]:
    """复制一份资料、改坏，跑启动时的校验；返回 (放行没有, 说明)"""
    with tempfile.TemporaryDirectory() as tmp:
        contracts, data = Path(tmp) / "contracts", Path(tmp) / "data"
        shutil.copytree(snapshot.CONTRACTS, contracts)
        shutil.copytree(snapshot.DATA, data)
        path = contracts / file
        rows = json.loads(path.read_text(encoding="utf-8"))
        change(rows)
        path.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
        try:
            snapshot.check(contracts, data)
        except snapshot.SnapshotError as error:
            return False, error.problems[0]
        return True, "校验没发现问题"


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    rows = []
    start = time.perf_counter()
    for name, expect, recording, env in REPLAYS:
        passed, detail = replay(recording, env)
        rows.append((name, expect, "pass" if passed else "block", detail))
    passed, detail = bad_data("parks.json", lambda rows: None)
    rows.insert(1, ("对照：现在的数据", "pass", "pass" if passed else "block", detail))
    for name, file, change in bad_data_cases():
        passed, detail = bad_data(file, change)
        rows.append((name, "block", "pass" if passed else "block", detail))

    label = {"pass": "放行", "block": "拦下"}
    print("| 放进来的 | 期望 | 实际 | 说明 |\n|---|---|---|---|")
    for name, expect, actual, detail in rows:
        mark = "" if expect == actual else " ✗"
        print(f"| {name} | {label[expect]} | {label[actual]}{mark} | {detail} |")
    wrong = [row for row in rows if row[1] != row[2]]
    print(f"\n{len(rows) - len(wrong)}/{len(rows)} 符合预期，用时 {time.perf_counter() - start:.0f} 秒")
    if wrong:
        print("门禁有漏洞：" + "；".join(row[0] for row in wrong))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
