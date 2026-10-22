# Copilot v0.3.0（2026-10-21）

上一版 v0.2.1 是 10-18 发的，之后合并了 PR #18 到 #47。这一版的镜像里是 Copilot（Python）和排行程引擎（Node）；网站本身在 Vercel 上随 `main` 自动部署，不分版本，下面也列了这段时间网站的大改动。

## Copilot

- **调度员**：模型看整段对话，决定排行程、改某一天、换住处、加减景点、回答问题、追问还是闲聊；代码照旧核对事实。打错的公园名先确认（“黄时”→黄石）。
- **查询工具**：回答问题时由代码认出要查什么，调 `is_open`（某天某个景点、某条季节性山路能不能去，附依据）、`drive_time`（两地开车多久）、`search`（按类型、长度、难度、同行的人、日期找景点）。
- **模型**：全是免费档，前一个出错换下一个。聊天 Gemini 3.5 Flash Lite → MiniMax M3.1 Flash（OpenRouter）→ Qwen3.8 27B（Groq）→ 本机 Qwen3.5 4B；读公告 MiniMax（推理 high）→ Gemini → Qwen3.8 27B → 本机。某几步可以单独换模型（`COPILOT_STEP_MODELS`）。聊天时一家 20 秒不回就换下一家。
- **NPS 实时公告**：模型读公告、提取临时关闭，代码核对；只读新的、改过的几条；两周内出发的行程现读要去的公园（最多等 12 秒）。每晚在 GitHub 上抓一次、抽查模型分数、把建议改动推到 bot 分支、把关闭清单发给网站。
- **配音**：`GET /tts`，本机 Kokoro（可选安装，见 GUIDE.md），给网站讲解版用。
- **监控**：每轮记下每次模型调用的模型、token、花费；`stats`、`/stats` 和网站后台 `/zh-Hans/admin`。
- **评测**：七组回放门禁（三组单句、三组多轮对话、读公告），故障测试、漂移测试、两个裁判交叉的模型打分；四轮模型对照的成绩在 `copilot/eval/RESULTS.md`。
- **修好的问题**：认“下周”“下下周”、“拉森”这类短名字；问没排进去的景点时给完整清单；换住处后每天的顺序变了会说一句。

## 网站

- 美国 64 座国家公园全有了（加上奇里卡瓦、美属维尔京群岛、美属萨摩亚等 11 座），987 个景点。
- 景点照片加了 NPS 官方照片当第二个来源，全部逐张看过一遍，一共 6269 张。
- 行程页的 Copilot 对话框；路线动画（跟车镜头）和讲解版：照片窗、本机配音、现场合成的配乐、3D 地形和环绕镜头（不会被山挡住）、进度条和倍速。
- 园内营地、港台明星同款、悬停拉近等。

## 怎么用

```bash
COPILOT_TAG=copilot-v0.3.0 docker compose -f copilot/docker-compose.yml up -d
```

回滚到上一版：把 `COPILOT_TAG` 换成 `copilot-v0.2.1`。详见 docs/GUIDE.md 第 7 节。

---

# Copilot v0.3.0 (2026-10-21)

The previous release, v0.2.1, shipped on Oct 18; since then PRs #18 through #47 were merged. The image contains the Copilot (Python) and the trip-planning engine (Node). The website deploys from `main` on Vercel automatically and has no versions of its own; its major changes in this period are listed below too.

## Copilot

- **Dispatcher**: the model reads the whole conversation and decides whether to plan a trip, change a day, switch lodging, add or remove stops, answer a question, ask a follow-up or just chat; code still checks the facts. Misspelled park names are confirmed first ("黄时" → Yellowstone).
- **Lookup tools**: when answering questions, code works out what to look up and calls `is_open` (can you visit an attraction or a seasonal road on a given day, with reasons), `drive_time` (drive time between two places) and `search` (find attractions by kind, length, difficulty, party and date).
- **Models**: free tiers only, each falling back to the next on error. Chat runs Gemini 3.5 Flash Lite → MiniMax M3.1 Flash (OpenRouter) → Qwen3.8 27B (Groq) → local Qwen3.5 4B; alert reading runs MiniMax (high reasoning) → Gemini → Qwen3.8 27B → local. Individual steps can use a different model (`COPILOT_STEP_MODELS`). In chat, a provider that doesn't answer within 20 s is skipped.
- **Live NPS alerts**: the model reads alerts and extracts temporary closures, checked by code; only new or changed alerts are read; trips starting within two weeks read the alerts of their parks on the spot (waiting at most 12 s). Every night GitHub fetches alerts, spot-checks the model's score, pushes proposed changes to a bot branch and publishes the closure list for the website.
- **Voice**: `GET /tts`, local Kokoro (optional install, see GUIDE.md), used by the website's narrated tour.
- **Monitoring**: every turn records each model call's model, tokens and cost; `stats`, `/stats` and the website's admin page `/zh-Hans/admin`.
- **Evaluation**: seven replay gates (three single-sentence sets, three multi-turn conversation sets, alert reading), fault tests, drift tests and LLM-as-judge with two cross-checking judges; results of the four model comparison rounds are in `copilot/eval/RESULTS.md`.
- **Fixes**: "下周" (next week), "下下周" (the week after) and short names like "拉森" (Lassen) are understood; questions about left-out places get the full list; when a lodging change reorders the days, the reply says so.

## Website

- All 64 U.S. national parks (11 added, including Chiricahua, the Virgin Islands and American Samoa), 987 attractions.
- NPS official photos as a second photo source, every photo reviewed by hand, 6,269 in total.
- The Copilot chat panel on the trip page; the route animation (follow camera) and the narrated tour: a photo window, local voice, generated music, 3D terrain with an orbit camera that is never hidden behind mountains, a scrubbable progress bar and playback speed.
- In-park campgrounds, Hong Kong and Taiwan celebrity photo spots, hover-to-zoom and more.

## How to run

```bash
COPILOT_TAG=copilot-v0.3.0 docker compose -f copilot/docker-compose.yml up -d
```

To roll back, set `COPILOT_TAG` to `copilot-v0.2.1`. See section 7 of docs/GUIDE.md.
