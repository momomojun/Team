# 11-05：线上打开账号（Neon）；带老人小孩直接按轻松排；Copilot 追问时说明下面是旧行程（分支 `feature/neon-online-and-chat-hints`）

- **账号上线**：组员 Huiling 的 #88（11-04 合并）做了 Neon Auth 登录、行程和 Copilot 对话存进 Neon 的 Postgres，但 Vercel 上没配，线上一直是关着的（登录接口报 “Neon Auth is not configured”）。仓库主人 11-05 建了 Neon 项目 `nps-guide`（AWS US East 1，开 Postgres 和 Better Auth）、Domains 加了网站域名，在 Vercel 填 `DATABASE_URL`、`NEON_AUTH_BASE_URL`、`NEON_AUTH_COOKIE_SECRET` 后重新部署。核对：账号页能注册登录；注册后数据库里 1 个用户、1 个有效会话；`user_trips`、`chat_threads` 在第一次登录时自动建好，行程（4 天）和一段 4 条消息的对话都存进去了。步骤写进 GUIDE 第 6 节，代码位置写进 DEVELOPMENT 的代码结构；GOALS 的 W11（不做账号）改成“后来改主意”。
- **起因**：仓库主人在线上试“6 月带爸妈去优胜美地玩 4 天，从旧金山飞”，以为排出了一个旧的或错的行程。查 Modal 上的运行日志：模型读出的条件全对，Copilot 在追问“这次想怎么玩？”，下面显示的是浏览器里以前存的行程。
- **带老人、坐轮椅、7 岁以下的孩子又没说节奏**：不再追问，直接按轻松排（`intake.py` 的 `_needs_easy_pace`，节奏记成 `inferred`，说明里告诉用户想多看一些可以直接说）；孩子大一点、没有老人的照旧问。仓库主人 11-05 同意的。
  - 评测：开发集的 `zh-seniors-no-fabrication`、holdout-v1 的 `H01-rambling`、`H12-en-wheelchair-grandma` 原来期望先追问节奏、第二轮回答，规则改了，改成一轮、期望节奏是轻松（zh-seniors 原来期望第二轮选的“适中”，H01 原来不查节奏）。这是产品规则变了，不是为了过门禁调代码；但 holdout-v1 这两条看过了，以后不再算没见过的数据。改完八组门禁都不低于基线（开发集 25、holdout-v1 37），基线没改。
- **对话框**：Copilot 还在追问、这次对话还没排出行程、下面又有以前的行程时，追问下面加一行“下面显示的还是你之前的行程。回答完上面的问题、排好以后，才会换成新的。”（中英文）。
- **Vercel 不再构建机器人分支**：每晚读公告推的 `bot/closures-*`、`data/alerts-live` 每次都触发一个没用的预览版。根目录加 `vercel.json`（`git.deploymentEnabled`：`bot/**` 不部署，这些分支从 main 拉出来，带着这个文件）；`data/alerts-live` 是只放数据的分支、没有 main 的文件，每晚的 workflow 往里写 `{"git":{"deploymentEnabled":false}}`，下一次每晚运行以后生效。
- 邮箱验证（现在注册后显示没验证，不影响登录）以后再做。
