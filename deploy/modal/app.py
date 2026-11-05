"""把 Copilot 放到 Modal（modal.com）上：网站（Vercel）经 COPILOT_URL + COPILOT_TOKEN 连过来。

镜像不在 Modal 上另外构建，直接拉 GHCR 上 CI 构建、冒烟测试过的那一个（发版是 copilot-v*，staging 是 main-<提交>），
上线的和测过的是同一个镜像。没人用时自动关掉（不收钱），有人来再启动（第一次要等十几秒）。

  COPILOT_IMAGE=ghcr.io/momomojun/team-copilot:copilot-v0.4.0 modal deploy --env main deploy/modal/app.py
  COPILOT_IMAGE=ghcr.io/momomojun/team-copilot:main-abc1234 modal deploy --env staging deploy/modal/app.py

每个环境（main 是正式、staging 是预发布）要先建一个叫 nps-copilot 的 Secret：模型的 key、DATA_GOV_API_KEY、
COPILOT_TOKEN（网站连过来用的口令）。对话存档和计费总账放在这个环境的 Volume（nps-copilot-data）里，机器关了再开也在。
步骤见 docs/GUIDE.md 第 7 节
"""
import os

import modal

IMAGE = os.environ.get("COPILOT_IMAGE", "ghcr.io/momomojun/team-copilot:latest")

image = (
    modal.Image.from_registry(IMAGE)
    # 镜像里只装了 copilot[api]；加上 LangGraph，对话存进 Volume 上的 SQLite，机器关了再开接着聊
    .pip_install("langgraph>=1.0", "langgraph-checkpoint-sqlite>=2.0")
    .env({
        "COPILOT_RUNS": "/data/runs",
        "COPILOT_SESSIONS_DB": "/data/sessions.sqlite",
        # 不设 COPILOT_PROVIDER：按默认顺序用云端模型（Gemini → Nemotron → Groq → DeepSeek，Secret 里有哪家的 key 用哪家）
        "COPILOT_IMAGE": IMAGE,
    })
)

app = modal.App("nps-copilot")
data = modal.Volume.from_name("nps-copilot-data", create_if_missing=True)


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("nps-copilot")],
    volumes={"/data": data},
    # 最小的机器：1/8 个 CPU、1 GB 内存（排一趟行程 Node 要 250 MB 左右，加上 Python 约 450 MB）
    cpu=0.125,
    memory=1024,
    # 只开一台：对话的状态在这台机器上；没人用 5 分钟后关掉
    min_containers=0,
    max_containers=1,
    scaledown_window=300,
    timeout=180,
)
@modal.concurrent(max_inputs=20)
@modal.asgi_app()
def web():
    from nps_copilot.api import app as fastapi_app

    return fastapi_app
