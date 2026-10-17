"""调 plan_trip 工具（网站的行程引擎）。默认直接跑仓库里的 Node 命令行（不用开网站）；
设了 COPILOT_PLAN_URL（比如 http://localhost:3000/api/copilot/plan）就走 HTTP。"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import time
import urllib.error
import urllib.request
from dataclasses import dataclass

from .catalog import ROOT


class PlanError(RuntimeError):
    def __init__(self, message: str, issues: list[dict] | None = None):
        super().__init__(message)
        self.issues = issues or []


@dataclass
class PlanCall:
    result: dict
    latency_ms: int
    via: str


def plan_trip(request: dict, reference_date: str) -> PlanCall:
    url = os.environ.get("COPILOT_PLAN_URL")
    start = time.perf_counter()
    if url:
        body = json.dumps(request, ensure_ascii=False).encode("utf-8")
        http = urllib.request.Request(f"{url}?reference={reference_date}", data=body, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(http, timeout=60) as response:
                result = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            payload = json.loads(error.read().decode("utf-8") or "{}")
            raise PlanError("plan_trip 拒绝了请求", payload.get("issues")) from error
        via = "http"
    else:
        node = shutil.which("node")
        if not node:
            raise PlanError("找不到 node（要 Node 24 以上），或者设 COPILOT_PLAN_URL 走网站接口")
        completed = subprocess.run(
            [node, "--disable-warning=ExperimentalWarning", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
             "--import", "./tests/register.mjs", "scripts/plan-trip.mjs", "-"],
            input=json.dumps(request, ensure_ascii=False).encode("utf-8"), cwd=ROOT, capture_output=True,
            env={**os.environ, "REFERENCE_DATE": reference_date}, timeout=120,
        )
        output = completed.stdout.decode("utf-8")
        if completed.returncode == 2:
            raise PlanError("plan_trip 拒绝了请求", json.loads(output).get("issues"))
        if completed.returncode != 0:
            raise PlanError(f"plan_trip 出错：{completed.stderr.decode('utf-8', 'replace')[-500:]}")
        result = json.loads(output)
        via = "cli"
    return PlanCall(result=result, latency_ms=round((time.perf_counter() - start) * 1000), via=via)
