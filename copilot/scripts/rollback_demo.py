"""换镜像回滚演示：依次启动几个已发布的版本，每个版本都确认 /health 报的版本对、发同一句话，看回复有什么不同。

  python copilot/scripts/rollback_demo.py copilot-v0.2.1 copilot-v0.2.0 copilot-v0.2.1

- 镜像从 GHCR 拉（公开，不用登录）；模型用本机的 Ollama（experiments/local-model-validation/start-local.ps1），容器通过 host.docker.internal 连过去
- 默认那句话是“带不到 1 岁的宝宝去梅萨维德”：0.2.0 不排崖居导览（当时数据写“建议 4 岁以上”），0.2.1 照排、提醒“请务必慎重考虑”
- 本机 8765 被占了就加 --port 8766
- 跑完不关容器（最后一个版本留着），要关：docker compose -f copilot/docker-compose.yml down
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COMPOSE = ROOT / "copilot" / "docker-compose.yml"
MESSAGE = "2027年6月10日从杜兰戈飞，去梅萨维德玩3天，带一个不到1岁的宝宝，节奏紧凑"
WATCH = ["悬崖宫殿", "阳台屋", "长屋", "慎重考虑", "不适合同行的人"]


def call(url: str, body: dict | None = None, timeout: float = 180) -> dict:
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json; charset=utf-8"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def wait_health(base: str, expect: str, seconds: int = 120) -> dict:
    deadline = time.time() + seconds
    while True:
        try:
            health = call(f"{base}/health", timeout=5)
            if health.get("version") == expect:
                return health
        except OSError:
            pass
        if time.time() > deadline:
            raise SystemExit(f"{expect} 没起来")
        time.sleep(1)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("tags", nargs="+", help="按顺序启动的镜像 tag，比如 copilot-v0.2.1 copilot-v0.2.0 copilot-v0.2.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--message", default=MESSAGE)
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    base = f"http://127.0.0.1:{args.port}"
    env = {**os.environ, "COPILOT_PORT": str(args.port), "MSYS_NO_PATHCONV": "1"}
    rows = []
    for tag in args.tags:
        expect = "copilot/" + tag.removeprefix("copilot-v")
        print(f"\n=== 切到 {tag} ===")
        started = time.time()
        subprocess.run(["docker", "compose", "-f", str(COMPOSE), "up", "-d", "--quiet-pull"], env={**env, "COPILOT_TAG": tag},
                       check=True, capture_output=True)
        health = wait_health(base, expect)
        switch_s = round(time.time() - started, 1)
        print(f"/health：{health['version']}，提示词 {', '.join(health['prompts'])}，切换用了 {switch_s} 秒")
        session = call(f"{base}/sessions", {"reference_date": "2026-10-18"})["session"]
        reply = call(f"{base}/sessions/{session}/messages", {"text": args.message})
        lines = [line for line in reply["text"].splitlines() if any(word in line for word in WATCH)]
        print(f"回复：{reply['status']}，{len((reply.get('result') or {}).get('days', []))} 天")
        for line in lines:
            print("  " + line)
        rows.append({"tag": tag, "version": health["version"], "switch_s": switch_s, "status": reply["status"],
                     "serious": "慎重考虑" in reply["text"], "lines": lines})
    print("\n=== 总结 ===")
    for row in rows:
        print(f"{row['tag']}：切换 {row['switch_s']} 秒，{row['status']}，{'有' if row['serious'] else '没有'}“请务必慎重考虑”")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
