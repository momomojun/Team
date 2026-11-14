# Copilot v0.5.0（2026-11-13）

上一版 v0.4.0 是 10-29 发的，之后合并了 PR #77、#78、#88 到 #91、#93 到 #95、#102 和这一版的 PR。这一版的镜像里是 Copilot（Python）和排行程引擎（Node）；网站本身在 Vercel 上随 `main` 自动部署，不分版本，下面也列了这段时间网站的大改动。

## Copilot

- **回答问题前按意思找资料**：资料（1996 条）用 Gemini 的嵌入接口（gemini-embedding-2，768 维）变成向量，存进 Neon 的 pgvector；回答问题时按意思找最相关的 4 条交给模型（Modal 上 `COPILOT_RETRIEVAL=vector`）。嵌入接口、数据库任何一步出错，或者一条都没找到，都退回原来的关键词；问题里点了全名、还没算向量的景点住处放到最前面（只认用户原话）。要 Modal 的 Secret 里有 `DATABASE_URL`。
  - 检索：48 题前 5 条里有对的，关键词 0.81，按意思找 1.00（第 1 条就对 0.88）；和关键词合起来反而是 0.92，所以只用按意思找。
  - 回答问题的 A/B/C 对照：A 不给资料 0（48 题全部老实说“资料里没写”，没编）、B 关键词 0.73、C 按意思找 0.94，英文问题 0.44 → 0.88。详见 `copilot/eval/RESULTS.md`。
  - 建库：`python -m nps_copilot vectors sync`，只算新的、改过的；Gemini 免费档每个嵌入型号每天只能算 1000 条，用完就停、第二天接着算。
- **九组门禁**：多了一组“找资料”（回放 Gemini 嵌入 + Neon 录好的名单，不联网），PR 评论的成绩表多一行。
- **后台和 `/stats` 的“最近几轮”**：每一轮回答问题是怎么找的资料、找了多久、有没有退回关键词（退回的写原因，比如额度用完）。
- **部署到 Modal**：staging（合进 main 就自动部署）和正式（发版后部署）两个环境，直接拉 GHCR 上测过的镜像；Vercel 上的网站经 `COPILOT_URL` + `COPILOT_TOKEN` 连过去。没设口令就不启动。网站查 Copilot 开没开等 30 秒，冷启动时对话框不再消失。
- **带老人、坐轮椅、7 岁以下的孩子又没说节奏**：不再追问，直接按轻松排，说明里写想多看一些可以直接说。
- **CI 和代码审查**：Copilot 那一项先跑 Ruff（查出两处正则里混进退格字符的真 bug）；评测成绩贴到 PR 评论；CodeRabbit 用中文审代码（只提意见）。`npm run scrum` 出每周 scrum 周报的草稿。

## 网站

- **账号**（Huiling 的 #88，11-05 线上打开）：Neon Auth 注册登录，登录以后行程和 Copilot 对话存进 Neon，换设备接着用。
- **对话框**：Copilot 还在追问、下面又有以前的行程时，写明“下面显示的还是你之前的行程”。
- **后台**：线上和本机给的一样（计费、最近的对话）；本机的计费总账发到 GitHub，线上也看得到；标签页看不见时不再每 30 秒刷新（不然 Modal 的机器一直关不掉、一直扣额度）。
- **Vercel 不再构建机器人分支**（每晚读公告推的 `bot/closures-*`、`data/alerts-live`）。

## 怎么用

```bash
COPILOT_TAG=copilot-v0.5.0 docker compose -f copilot/docker-compose.yml up -d
```

回滚到上一版：把 `COPILOT_TAG` 换成 `copilot-v0.4.0`；Modal 上在 Actions 里手动跑 “Deploy Copilot to Modal”，tag 填 `copilot-v0.4.0`。只想关掉按意思找：在 Modal 的 Secret `nps-copilot` 里删掉 `DATABASE_URL`，机器重新开起来以后就一直按关键词找（闲置 5 分钟自动关，或者在 Actions 里重新部署一次）。详见 docs/GUIDE.md 第 7 节。

---

# Copilot v0.5.0 (2026-11-13)

The previous release, v0.4.0, shipped on Oct 29; since then PRs #77, #78, #88 through #91, #93 through #95, #102 and this release's PR were merged. The image contains the Copilot (Python) and the trip-planning engine (Node). The website deploys from `main` on Vercel automatically and has no versions of its own; its major changes in this period are listed below too.

## Copilot

- **Semantic retrieval before answering questions**: the 1,996 knowledge entries are turned into 768-dimensional vectors with Gemini's embedding API (gemini-embedding-2) and stored in Neon with pgvector; before answering, the Copilot finds the 4 entries closest in meaning and gives them to the model (`COPILOT_RETRIEVAL=vector` on Modal). If any embedding or database step fails, or nothing is found, it falls back to the old keyword search; an attraction or lodging named in full in the question but not yet embedded goes first (matched on the user's own words only). Needs `DATABASE_URL` in the Modal secret.
  - Retrieval: the right entry is in the top 5 for 0.81 of 48 questions with keywords and 1.00 with semantic search (right entry first: 0.88); combining the two gives only 0.92, so production uses semantic search alone.
  - A/B/C comparison for answers: A, no data, 0 (all 48 honestly answered "not in the data" and never made anything up); B, keywords, 0.73; C, semantic, 0.94; English questions 0.44 → 0.88. Details in `copilot/eval/RESULTS.md`.
  - Building the index: `python -m nps_copilot vectors sync` embeds only new or changed entries; Gemini's free tier allows 1,000 embeddings per model per day, so it stops when the quota runs out and resumes the next day.
- **Nine eval gates**: a new retrieval gate (replaying rankings recorded with Gemini embeddings + Neon, offline), with one more row in the PR score comment.
- **"Recent turns" on the dashboard and in `/stats`**: for each answered question, how the entries were found, how long it took, and whether it fell back to keywords (with the reason, such as an exhausted quota).
- **Deployed on Modal**: two environments, staging (deployed automatically on merge to main) and production (deployed after a release), both pulling the tested image from GHCR; the website on Vercel connects through `COPILOT_URL` + `COPILOT_TOKEN`. It refuses to start without a token. The website now waits 30 seconds when checking whether the Copilot is up, so the chat box no longer disappears during a cold start.
- **Seniors, wheelchairs or kids under 7 with no pace given**: no follow-up question any more; it plans a relaxed pace and says you can ask for more.
- **CI and code review**: the Copilot job runs Ruff first (it caught two real bugs where backspace characters had slipped into regexes); eval scores are posted on the PR; CodeRabbit reviews in Chinese (advisory only). `npm run scrum` drafts the weekly scrum report.

## Website

- **Accounts** (Huiling's #88, live since Nov 5): sign-up and sign-in with Neon Auth; once signed in, trips and Copilot chats are saved in Neon and follow you across devices.
- **Chat box**: while the Copilot is still asking questions and an older trip is shown below, it says that the trip below is the previous one.
- **Dashboard**: production shows the same as local (billing, recent chats); the local billing ledger is published to GitHub so production can show it; it no longer refreshes every 30 seconds while its tab is hidden (otherwise the Modal machine never shut down and kept using credits).
- **Vercel no longer builds the bot branches** (`bot/closures-*` and `data/alerts-live`, pushed by the nightly alert job).

## How to run

```bash
COPILOT_TAG=copilot-v0.5.0 docker compose -f copilot/docker-compose.yml up -d
```

To roll back, set `COPILOT_TAG` to `copilot-v0.4.0`; on Modal, run "Deploy Copilot to Modal" manually in Actions with the tag `copilot-v0.4.0`. To turn off only the semantic retrieval, remove `DATABASE_URL` from the Modal secret `nps-copilot`; once the machine restarts it uses keyword search only (it shuts down after 5 idle minutes, or redeploy from Actions). See docs/GUIDE.md section 7.
