"""调 plan_trip 工具（网站的行程引擎）。默认直接跑仓库里的 Node 命令行（不用开网站）；
设了 COPILOT_PLAN_URL（比如 http://localhost:3000/api/copilot/plan）就走 HTTP。

NPS 公告提取出的关闭（python -m nps_copilot alerts 写的 copilot/data/alerts/closures-latest.json，或者 COPILOT_LIVE_CLOSURES
指的文件）有就交给命令行，近期出发的行程不排公告说关了的景点；COPILOT_LIVE=0 不用（评测、测试里关掉，结果才能复现）。
走 HTTP 时由网站服务器自己的 LIVE_CLOSURES 决定。"""
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

DEFAULT_CLOSURES = ROOT / "copilot" / "data" / "alerts" / "closures-latest.json"


class PlanError(RuntimeError):
    def __init__(self, message: str, issues: list[dict] | None = None):
        super().__init__(message)
        self.issues = issues or []


@dataclass
class PlanCall:
    result: dict
    latency_ms: int
    via: str
    # 聊天时现读公告的情况（refreshed、读了哪几座公园、新读了几条……），记进日志
    refresh: dict | None = None


def live_closures() -> str | None:
    """要交给行程引擎的公告关闭清单的路径；没有或者关掉了就是 None"""
    if os.environ.get("COPILOT_LIVE") == "0":
        return None
    path = os.environ.get("COPILOT_LIVE_CLOSURES") or str(DEFAULT_CLOSURES)
    return path if os.path.exists(path) else None


def plan_trip(request: dict, reference_date: str, on_step=None) -> PlanCall:
    """on_step(step, **detail)：真要现读 NPS 公告时报一声（对话框显示进度用）"""
    url = os.environ.get("COPILOT_PLAN_URL")
    start = time.perf_counter()
    refresh = None
    if os.environ.get("COPILOT_LIVE") != "0" and not os.environ.get("COPILOT_LIVE_CLOSURES"):
        # 两周内出发、要去的公园今天还没读过公告：当场只抓这几座公园的读一遍（出错就用原来的清单）
        from .alerts_live import refresh_for
        refresh = refresh_for(request, reference_date,
                              on_fetch=(lambda parks: on_step("alerts", parks=parks)) if on_step else None)
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
            env={**os.environ, "REFERENCE_DATE": reference_date, **({"LIVE_CLOSURES": live} if (live := live_closures()) else {})},
            timeout=120,
        )
        output = completed.stdout.decode("utf-8")
        if completed.returncode == 2:
            raise PlanError("plan_trip 拒绝了请求", json.loads(output).get("issues"))
        if completed.returncode != 0:
            raise PlanError(f"plan_trip 出错：{completed.stderr.decode('utf-8', 'replace')[-500:]}")
        result = json.loads(output)
        via = "cli"
    return PlanCall(result=result, latency_ms=round((time.perf_counter() - start) * 1000), via=via, refresh=refresh)
