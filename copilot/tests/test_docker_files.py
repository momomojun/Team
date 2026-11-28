"""镜像里要有 Copilot 运行时调用的 Node 脚本（连同它们引用的脚本）。

11-27 发现：copilot/Dockerfile 只拷了 plan-trip.mjs、lookup.mjs，没拷审查软要求用的 soft-check.mjs，
线上（Modal）每次都报“找不到脚本”、被 TeamError 吞掉，v0.7.0 起审查 agent 在线上一次都没跑过；本机、CI 用的是整个仓库，看不出来。
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CODE = ROOT / "copilot" / "nps_copilot"


def copied_scripts() -> set[str]:
    files: set[str] = set()
    for line in (ROOT / "copilot" / "Dockerfile").read_text(encoding="utf-8").splitlines():
        if line.startswith("COPY "):
            files.update(part for part in line.split()[1:-1] if part.startswith("scripts/"))
    return files


def needed_scripts() -> set[str]:
    # 代码里写在引号里的“scripts/xxx.mjs”才是真的拿去跑的（注释里提到的不算）
    found = {match for path in CODE.glob("*.py") for match in re.findall(r"[\"'](scripts/[\w-]+\.mjs)[\"']", path.read_text(encoding="utf-8"))}
    todo = list(found)
    while todo:
        script = todo.pop()
        for name in re.findall(r"from \"\./([\w-]+\.mjs)\"", (ROOT / script).read_text(encoding="utf-8")):
            child = f"scripts/{name}"
            if child not in found:
                found.add(child)
                todo.append(child)
    return found


def test_scripts_the_copilot_runs_are_in_the_image():
    needed = needed_scripts()
    assert {"scripts/plan-trip.mjs", "scripts/soft-check.mjs", "scripts/soft-check-lib.mjs"} <= needed
    assert needed <= copied_scripts(), f"Dockerfile 没拷：{sorted(needed - copied_scripts())}"
