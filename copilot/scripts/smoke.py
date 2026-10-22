"""对一个跑起来的 Copilot 服务做冒烟测试：/health 正常、发一句完整的需求能排出行程。

  python copilot/scripts/smoke.py http://127.0.0.1:8765 [--expect-version 0.2.0]
  --expect-version repo：和这份代码里的 nps_copilot.__version__ 比（CI 用：镜像必须是这次提交构建的）

用回放模型跑（COPILOT_PROVIDER=replay）时，用的这句话要在录音里（默认的这句在开发集里）。
CI 构建镜像以后、发版推镜像以后都跑一次；回滚以后也用它确认旧版本起来了。
服务设了口令（COPILOT_TOKEN，比如 Hugging Face Spaces 上的）：在跑这个脚本的终端里设同一个 COPILOT_TOKEN，请求会带上。
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

MESSAGE = "2027年6月1日从弗雷斯诺飞，去优胜美地玩4天，带爸妈，想轻松一点"


def call(url: str, body: dict | None = None) -> dict:
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    headers = {"Content-Type": "application/json; charset=utf-8"}
    if os.environ.get("COPILOT_TOKEN"):
        headers["X-Copilot-Token"] = os.environ["COPILOT_TOKEN"]
    request = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("base")
    parser.add_argument("--expect-version")
    parser.add_argument("--wait", type=int, default=60)
    parser.add_argument("--message", default=MESSAGE, help="换一句话测（回滚演示用）")
    parser.add_argument("--days", type=int, default=4, help="这句话应该排出几天")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    if args.expect_version == "repo":
        init = Path(__file__).resolve().parents[1] / "nps_copilot" / "__init__.py"
        args.expect_version = re.search(r'__version__ = "(.+?)"', init.read_text(encoding="utf-8")).group(1)

    deadline = time.time() + args.wait
    while True:
        try:
            health = call(f"{args.base}/health")
            break
        except OSError:
            if time.time() > deadline:
                print("服务没起来")
                return 1
            time.sleep(1)
    print("health:", json.dumps(health, ensure_ascii=False))
    if args.expect_version and health["version"] != f"copilot/{args.expect_version}":
        print(f"版本不对：{health['version']}，应该是 copilot/{args.expect_version}")
        return 1
    if health.get("plan_tool") == "missing":
        print("行程引擎不可用（容器里没有 node）")
        return 1
    session = call(f"{args.base}/sessions", {"reference_date": "2026-10-16"})["session"]
    reply = call(f"{args.base}/sessions/{session}/messages", {"text": args.message})
    days = len((reply.get("result") or {}).get("days", []))
    print("reply:", reply["status"], reply.get("request", {}) and reply["request"].get("parks"), f"{days} 天")
    print(reply["text"][:400])
    if reply["status"] != "planned" or days != args.days:
        print(f"冒烟测试失败：应该排出 {args.days} 天的行程")
        return 1
    print("冒烟测试通过")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
