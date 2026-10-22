# Hugging Face Spaces（Docker Space）用的镜像：和 copilot/Dockerfile 一样是 Python 服务 + 跑行程引擎的 Node，
# 不同的是：端口 7860（Space 的规定），用 uid 1000 的用户跑（Space 的规定），运行日志写在 /tmp（免费 Space 没有持久存储）。
# 构建上下文是 hf-space.yml 拼出来的临时目录（仓库里要用的那几样 + 这个文件 + README.md），不在仓库里直接构建。
FROM node:24-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/* \
    && (id -u 1000 >/dev/null 2>&1 || useradd -m -u 1000 user)

WORKDIR /app

COPY package.json ./
COPY tests/register.mjs tests/resolve.mjs ./tests/
COPY scripts/plan-trip.mjs scripts/lookup.mjs ./scripts/
COPY src ./src
COPY copilot ./copilot
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -e "./copilot[api]" \
    && chown -R 1000:1000 /app

ARG COPILOT_BUILD_SHA=unknown
ENV PATH=/opt/venv/bin:$PATH \
    COPILOT_BUILD_SHA=$COPILOT_BUILD_SHA \
    COPILOT_RUNS=/tmp/runs \
    PORT=7860 \
    PYTHONUNBUFFERED=1

USER 1000
EXPOSE 7860
CMD ["python", "-m", "nps_copilot", "serve", "--host", "0.0.0.0", "--port", "7860"]
