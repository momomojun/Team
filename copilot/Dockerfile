# NPS Guide Copilot 的镜像：Python 服务 + 跑行程引擎要的 Node（plan_trip 直接跑仓库里的 TypeScript，不用 npm 包）。
# 在仓库根目录构建：docker build -f copilot/Dockerfile -t team-copilot .
# 模型不在镜像里：默认连宿主机上的 Ollama（OLLAMA_HOST_URL），用法和回滚见 copilot/RELEASE.md
FROM node:24-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 行程引擎：src/ 里的数据和逻辑、命令行入口、让 Node 直接跑 TypeScript 的解析钩子
COPY package.json ./
COPY tests/register.mjs tests/resolve.mjs ./tests/
COPY scripts/plan-trip.mjs ./scripts/
COPY src ./src

# Copilot（可编辑安装：代码按 /app/copilot 的位置找契约、提示词和录音）
COPY copilot ./copilot
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -e "./copilot[api]"

ARG COPILOT_BUILD_SHA=unknown
ENV PATH=/opt/venv/bin:$PATH \
    COPILOT_BUILD_SHA=$COPILOT_BUILD_SHA \
    COPILOT_RUNS=/data/runs \
    OLLAMA_HOST_URL=http://host.docker.internal:11435 \
    PYTHONUNBUFFERED=1

LABEL org.opencontainers.image.title="NPS Guide Copilot" \
      org.opencontainers.image.source="https://github.com/momomojun/Team" \
      org.opencontainers.image.revision=$COPILOT_BUILD_SHA

VOLUME /data/runs
EXPOSE 8765
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8765/health', timeout=4)"
CMD ["python", "-m", "nps_copilot", "serve", "--host", "0.0.0.0", "--port", "8765"]
