# Copilot v0.4.0（2026-10-29）

上一版 v0.3.0 是 10-21 发的，之后合并了 PR #49 到 #74。这一版的镜像里是 Copilot（Python）和排行程引擎（Node）；网站本身在 Vercel 上随 `main` 自动部署，不分版本，下面也列了这段时间网站的大改动。

## Copilot

- **能放到公网**：设了 `COPILOT_TOKEN` 就要口令才能调（`/health` 除外）；按来源限流（每分钟 20 句、每天 300 句，所有人每天 2000 句），超了返回 429。`deploy/hf-space/` 和 “Deploy Copilot to Hugging Face” workflow 把它放到 Hugging Face Spaces，Vercel 上的网站经 `COPILOT_URL` + `COPILOT_TOKEN` 连过去（步骤见 GUIDE.md 第 7 节）。
- **模型**：免费档在前，前一个出错换下一个。聊天、读公告都是 Gemini 3.5 Flash Lite → Nemotron 3.5 Super（OpenRouter 免费版，换掉了免费推广期结束的 MiniMax M3.1 Flash）→ Qwen3.8 27B（Groq）→ **DeepSeek Flash（按量付费的备用，免费的都出错才用）** → 本机 Qwen3.5 4B。DeepSeek 全套评测 268 次约 $0.08。
- **计费总账**：每次真的调用模型都记一行（聊天、每晚读公告、评测、裁判），后台“计费（所有模型）”列实际花费、按付费标价折算、今天每家免费额度用了几成；每晚 GitHub 上读公告的那一份也并进来。命令行 `python -m nps_copilot billing`。
- **排行程时的过渡界面**：Copilot 每做一步报一次（`?stream=1`），网站上是一张国家公园公路旅行的进度条。
- **LangGraph、MLflow、Chroma**：`serve` 装了 `copilot[graph]` 就按 LangGraph 跑、对话存进 SQLite，重启以后接着聊；评测可以记到 MLflow；检索可以换成 Chroma 向量库。
- **一趟去很多座公园**：最多 6 座，一段一段开车一天能连起来就行；“我还要去红木”“顺便去一下”是加一座，不是换掉。
- **最慢一档节奏“更悠闲”**：一天最多四个地方（对照博主的真实行程定的）。
- **测试扩到 439 个、门禁八组**：新的没见过的样例 held-out v2（70 组，约四成故意刁难）第一次 61/70，改了规则以后 70/70；规则那一层的逐条测试 216 个。测试找出并修了 10 处：18 个机场没英文城市名、过去的日期照排、“不错/nice”当成否定、“June 3-7”算不出天数、“3-7 天”当成 7 天、模型把城市当公园、漏了出发地、“kids aged 6 and 9”、“最后一个”选不到、“18岁的儿子”还问几岁。
- **每晚读公告**：抽查模型分数改成每周一次、修好了一直没跑的开关；issue 写实际读公告的模型；读公告这一步也带上仓库的 `DEEPSEEK_API_KEY`，免费的都出错时用 DeepSeek（每周的抽查不用它，不花钱）。

## 网站

- **后台**：模型调用架构图、英文版后台（`/en/admin`，给老师看）、计费。
- **公园页**：概览加“在哪里”的小地图（机场开车多久、顺路的公园）和“一年里什么时候去”；新的“徒步”页（AllTrails 链接、海拔剖面、GPX 下载）；“Tesla 充电”页（超充和目的地充电，多个来源对照）。
- **徒步只看 AllTrails**：步道的热度、评分、数据都按 AllTrails，不再用 Google Maps；排行程挑步道也按 AllTrails 的评价数。5 条步道的爬升按 NPS 官网重查改正。
- **行程靠不靠得住**：每条信息写出处和核对日期，超过半年没核对的标“可能过期”；拿博主的真实行程对照；照 TravelPlanner、TripCraft 两篇论文给 110 条行程打分、拿开源的 VROOM 当裁判，查出的引擎问题都修了。
- **路线动画**：改成“一个钟说了算”，进度条能像 YouTube 一样拖；地图沿路提前下载、远的不再放太大；动画旁边放天气，行程里给穿衣、带不带伞的建议。
- **营地开放季节**：约 85 个季节性营地，冬天不再排进关门的营地。
- **本机一键启动**：双击根目录的 `start.cmd` 开好本机模型、Copilot 和网站。

## 怎么用

```bash
COPILOT_TAG=copilot-v0.4.0 docker compose -f copilot/docker-compose.yml up -d
```

回滚到上一版：把 `COPILOT_TAG` 换成 `copilot-v0.3.0`。详见 docs/GUIDE.md 第 7 节。

---

# Copilot v0.4.0 (2026-10-29)

The previous release, v0.3.0, shipped on Oct 21; since then PRs #49 through #74 were merged. The image contains the Copilot (Python) and the trip-planning engine (Node). The website deploys from `main` on Vercel automatically and has no versions of its own; its major changes in this period are listed below too.

## Copilot

- **Ready for the public internet**: with `COPILOT_TOKEN` set, every call needs the token (except `/health`); requests are rate-limited per source (20 a minute and 300 a day, 2,000 a day across everyone), with 429 beyond that. `deploy/hf-space/` and the "Deploy Copilot to Hugging Face" workflow put it on Hugging Face Spaces, and the website on Vercel connects through `COPILOT_URL` + `COPILOT_TOKEN` (steps in GUIDE.md section 7).
- **Models**: free tiers first, each falling back to the next on error. Both chat and alert reading run Gemini 3.5 Flash Lite → Nemotron 3.5 Super (free on OpenRouter, replacing MiniMax M3.1 Flash, whose free promotion ended) → Qwen3.8 27B (Groq) → **DeepSeek Flash (a pay-as-you-go backup, used only after the free ones fail)** → local Qwen3.5 4B. A full DeepSeek eval run (268 calls) cost about $0.08.
- **Billing ledger**: every real model call is recorded (chat, nightly alert reading, evals, judge). The dashboard's "Billing (all models)" section shows actual cost, the list-price equivalent and how much of each provider's free quota is used today, including the nightly runs on GitHub. Command line: `python -m nps_copilot billing`.
- **A waiting screen while planning**: the Copilot reports each step (`?stream=1`), shown on the site as a national-park road-trip progress bar.
- **LangGraph, MLflow, Chroma**: with `copilot[graph]` installed, `serve` runs on LangGraph and keeps conversations in SQLite, so a restart doesn't lose them; evals can log to MLflow; retrieval can use a Chroma vector store.
- **Many parks in one trip**: up to 6, as long as each leg is within a day's drive; "我还要去红木" ("I also want Redwood") and "顺便去一下" add a park instead of replacing one.
- **The slowest pace, "Even slower"**: at most four places a day, calibrated against creators' real itineraries.
- **439 tests and eight eval gates**: the new unseen set held-out v2 (70 cases, about 40% adversarial) scored 61/70 on the first run and 70/70 after rule fixes; 216 rule-level tests were added. The tests found and fixed 10 problems: 18 airports without English city names, past dates being planned, "不错"/"nice" read as "no", "June 3-7" giving no day count, "3-7 days" read as 7, a city taken for a park, a missed origin, "kids aged 6 and 9", "the last one" not picking the last option, and an 18-year-old son still triggering the age question.
- **Nightly alert reading**: the model spot-check now runs weekly, and the switch that had kept it from ever running is fixed; the issue names the model that actually read the alerts; the reading step also gets the repo's `DEEPSEEK_API_KEY`, so DeepSeek steps in when the free models fail (the weekly spot-check doesn't use it, so it stays free).

## Website

- **Dashboard**: a model call architecture diagram, an English dashboard (`/en/admin`, for the instructor), and billing.
- **Park pages**: the overview gains a locator map (drive times from airports, parks along the way) and a month-by-month "when to go"; a new Hikes page (AllTrails links, elevation profiles, GPX downloads); a Tesla charging page (Superchargers and destination chargers, cross-checked across sources).
- **Trails from AllTrails only**: trail popularity, ratings and data all come from AllTrails instead of Google Maps, and the planner picks trails by AllTrails review counts. The elevation gain of 5 trails was corrected against nps.gov.
- **Can you trust the plan**: every fact shows its source and check date, anything not rechecked in six months is flagged as possibly stale, plans are compared with creators' real trips, and 110 plans are scored the way the TravelPlanner and TripCraft papers do, with the open-source VROOM as a referee; the engine problems it found are fixed.
- **Route animation**: driven by a single clock, with a YouTube-style scrubbable progress bar; map tiles are fetched ahead along the route and long legs no longer zoom in too far; weather sits beside the animation, and the itinerary suggests what to wear and whether to bring an umbrella.
- **Campground seasons**: about 85 seasonal campgrounds, so winter trips no longer book closed ones.
- **One-click local start**: double-click `start.cmd` in the repo root to start the local model, the Copilot and the website.

## How to run

```bash
COPILOT_TAG=copilot-v0.4.0 docker compose -f copilot/docker-compose.yml up -d
```

To roll back, set `COPILOT_TAG` to `copilot-v0.3.0`. See docs/GUIDE.md section 7.
