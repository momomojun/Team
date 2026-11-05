# 11-04：Copilot 部署到 Modal，分 staging 和正式（分支 `feature/modal-deploy`）

- 为什么做：Hugging Face 的 Docker Space 改成要订 PRO；仓库主人 11-02 定按课程大纲补“云部署、CI/CD、staging”，朋友推荐了 Modal（每月 $30 额度，不绑卡 $1；没人用时自动关、不收钱）。
- 部署文件 `deploy/modal/app.py`：直接拉 GHCR 上 CI 构建、冒烟测试过的镜像（不在 Modal 上另外构建），加装 LangGraph，对话存档和计费总账放在这个环境的 Volume `nps-copilot-data` 上；1/8 个 CPU、1 GB 内存、只开一台、闲置 5 分钟关；模型的 key 和 `COPILOT_TOKEN` 在 Modal 的 Secret `nps-copilot`。
- 两个环境：
  - `staging`：Copilot 或行程引擎的代码合进 main（`.github/workflows/copilot-staging.yml`）→ 构建镜像、回放冒烟测试、推 `ghcr.io/momomojun/team-copilot:main-<提交>` 和 `:staging` → 部署 → 等冷启动、核对 `/health` 的 build 是这次提交；
  - `main`（正式）：Copilot release 跑成功以后部署那个 tag 的镜像（`.github/workflows/modal-deploy.yml`）；回滚是在 Actions 里手动跑这个 workflow、填上一个 tag，不用重新构建，部署完核对 `/health` 的版本。
- 第一次手动部署：copilot-v0.4.0 到正式环境，https://momomojun--nps-copilot-web.us-east.modal.run ，冷启动约 7 秒；`/health` 显示版本 0.4.0、模型顺序 Gemini → Nemotron → Groq Qwen → DeepSeek（Secret 里的 key 都读到了）、口令开着、对话存档用 LangGraph。建了 `staging` 环境。
- GUIDE 第 7 节的 Hugging Face 换成 Modal（第一次设置、两个环境、手动部署和回滚、额度怎么算）；`deploy/hf-space/` 和它的 workflow 留着，没设 secret 就跳过。
- 还要仓库主人做：staging 环境也建一个 `nps-copilot` Secret；GitHub 加 `MODAL_TOKEN_ID`、`MODAL_TOKEN_SECRET`；Vercel 加 `COPILOT_URL`、`COPILOT_TOKEN`（Production 连正式、Preview 连 staging）。
