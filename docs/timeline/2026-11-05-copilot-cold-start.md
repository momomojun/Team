# 11-05：Vercel 连上 Modal 上的 Copilot；冷启动时对话框不再消失（分支 `fix/copilot-cold-start`）

- 起因：仓库主人在 Vercel 填好 `COPILOT_URL`、`COPILOT_TOKEN`、合并 #90 以后打开行程页，没看到“Copilot · 用一句话说需求”。
- 原因：行程页先问 `/api/copilot/chat` 这个 Copilot 开没开，网站去查 Copilot 的 `/health` 只等 3 秒。Modal 上没人用 5 分钟就关机，下一个人来要冷启动（拉镜像、起 Node 和 Python，约 7 秒以上），3 秒到了就当成没开、对话框不显示。机器已经开着的时候（比如刚冒烟测试过）0.3 秒就回来，所以有时看得到、有时看不到。
- 改了：查 `/health` 的等待时间统一成 `HEALTH_TIMEOUT_MS`（30 秒，`src/lib/copilot/upstream.ts`），对话框、配音、后台都用它；后台的 `/stats` 等 30 + 15 秒。本机没开 Copilot 时连接马上被拒，不会真等 30 秒。
- 对话框下面的说明原来写“用本机的 Qwen3.5 4B 模型”，线上已经不是了，改成先用免费的云端模型、都出错才用付费的 DeepSeek，本机开发时也能用本机模型（中英文都改了）。
- staging 第一次自动部署：#90 合并的提交 97f41ae，`copilot-staging.yml` 构建、冒烟、部署到 https://momomojun-staging--nps-copilot-web.us-east.modal.run ，`/health` 的 build 对得上、模型顺序、口令都核对通过。GOALS 的 P24 改成已完成。
- 正式环境现在跑的还是 11-04 手动部署的那一版（build 94690ae，没有“缺口令就不启动”那个检查），要在 Actions 里手动跑一次 “Deploy Copilot to Modal”（tag 填 `copilot-v0.4.0`、环境 `main`）换上 #90 的部署文件。
