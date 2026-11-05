"""部署到 Modal 以后核对 /health（copilot-staging.yml、modal-deploy.yml 用）：

  python deploy/modal/check_health.py health.json <镜像 tag>

- copilot-v0.4.0：/health 的版本要是 0.4.0（报的是 copilot/0.4.0 这种）；main-<提交>：build 要是那个提交
- 都要有 build、模型配置没出错（配置写错时 /health 照样 200，但 provider 是空的、error 写着原因）、开着口令
有一条不对就打 ::error:: 并退出 1
"""
from __future__ import annotations

import json
import sys


def problems(health: dict, tag: str) -> list[str]:
    version = str(health.get("version") or "").removeprefix("copilot/")
    build = health.get("build")
    found = []
    if tag.startswith("copilot-v") and f"copilot-v{version}" != tag:
        found.append(f"起来的是 {version or '（没报版本）'}，不是 {tag}")
    if tag.startswith("main-") and build != tag.removeprefix("main-"):
        found.append(f"build 是 {build}，不是 {tag.removeprefix('main-')}")
    if not build:
        found.append("/health 没有 build")
    if health.get("error"):
        found.append(f"模型配置出错：{health['error']}")
    if not health.get("provider"):
        found.append("没有可用的模型（provider 是空的）")
    if not health.get("auth"):
        found.append("没设 COPILOT_TOKEN，服务对外不要口令")
    return found


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    path, tag = sys.argv[1], sys.argv[2]
    found = problems(json.loads(open(path, encoding="utf-8").read()), tag)
    for problem in found:
        print(f"::error::{problem}")
    print("核对通过" if not found else f"{len(found)} 处不对")
    sys.exit(1 if found else 0)
