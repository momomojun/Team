# Copilot v0.7.0（2026-11-22）

上一版 v0.6.0 是 11-20 发的，之后合并了 PR #120 到 #123、#125 到 #130 和这一版的 PR #131。这一版的镜像里是 Copilot（Python）和排行程引擎（Node）；网站本身在 Vercel 上随 `main` 自动部署，不分版本，下面也列了这段时间网站的大改动。

## Copilot

- **多 agent 排行程（默认打开）**：用户说了“中间留一天休息”“每天开车别超过 3 小时”“只住一家”“前两天大提顿、后四天黄石”“一天只去一个片区”这类软要求时，规划 agent 摘出来（每条带原话），代码核对后翻成引擎的 18 种旋钮，引擎排完逐条判分，没做到的交给审查 agent 最多商量 3 轮（换轻松节奏、加减景点、合并住处、放弃这条），最后由代码写清楚做到了哪些、哪条没做到、少去了哪些。`COPILOT_TEAM=0` 关掉。**每次排行程多调 1 次模型（有没做到的再多 1–3 次）**，免费额度用得比原来快大约一半。
  - 评测（`copilot/eval/cases/soft-v1.jsonl`，30 题，先写期望、冻结再写代码）：原来的调度员 7/30，多 agent 本机 Qwen3.5 4B 27/30、Qwen3.5 35B-A3B 29/30、gpt-oss 20B 27/30、Gemini 3.5 Flash Lite 27/30（看过失败再修的，不再算没见过的；第一次的成绩 25–27 见 RESULTS.md）。
  - 对照题（`soft-v2.jsonl`，20 道，一半中文一半英文，用户什么软要求都没提）：本机三个模型都是 20/20，没有无中生有；4B 编出来的 20 条、35B 的 3 条全被代码核对拦下。
  - 代码核对：原话必须真在用户的话里、必须有说到这件事的词（“节奏适中”不是中间休息一天，“一家四口”不是只住一家，问句不是一定要去）；天数按原话认（模型只给公园不给天数、把最后一天写错时）。
- **本机兜底模型换成 Qwen3.5 35B-A3B**（MoE，约 22 GB，要 32 GB 内存）：理解、推理的几组明显比 4B 好（search agent 自己查 33/44 对 27/44，读公告日期 20/24 对 16/24），慢 2–3 倍。一键启动没下好 35B 时自动退回 4B；Docker 一键启动默认下 35B，小电脑设 `MODEL=qwen3.5:4b-q4_K_M`。线上（Modal）不跑本机模型，不受影响；CI 门禁照旧回放 4B 的录音。
- **Intake**：公园已经认出来时，园里的景点、片区和“海边、雨林”这类地形不当成另一座公园（原来 Gemini 会把 the rainforest 当成石化林反问）；“我想住 airbnb”是住宿偏好，不是一家叫 airbnb 的酒店。
- **数据版本**（#128）：每个回答记下用的哪份数据（网站数据、给 Copilot 的资料、各地叫法各算 sha256，合成 12 位），`/health`、日志、评测报告、`stats` 都有；镜像多打一个 `sha-<提交>-p<提示词>-d<数据>` 标签。
- **护栏和数据快照校验**（#129）：读公告接口挂了时行程说明里写按哪天的公告排的；`serve` 启动时用 Pydantic 逐条验公园、机场、景点、资料，坏了直接起不来。
- **NPS 道路事件**（#130）：每晚抓 NPS 的道路封闭（WZDx），两周内出发的行程不排封着的路上的景点；国王峡谷 180 号公路加进季节性山路。

## 网站

- **整站改版**（#122、#123、#125、#126、#127）：照着 Wabunka 的观感重做，首页深色、内页浅色，衬线字、金色按钮，行程页首屏就是 Copilot；新的活动页（按月份列 335 个活动）。
- **后台**：架构图扩成五张（加了“多 agent 排行程”），新加“技术栈”；顶上“测试和评测 →”点进去是新的 `/admin/evals`：测试分几层、多 agent 对照调度员、本机模型对照、十组门禁、历次评测（34 轮）。
- **行程引擎**：“一天只去一个片区”先挑片区、再整片分到各天。

## 怎么用

```bash
COPILOT_TAG=copilot-v0.7.0 docker compose -f copilot/docker-compose.yml up -d
```

只关掉多 agent：Modal 正式环境（`main`）的 Secret `nps-copilot` 里加 `COPILOT_TEAM=0`，机器重新开起来就生效。整版回滚到上一版：把 `COPILOT_TAG` 换成 `copilot-v0.6.0`；Modal 上在 Actions 里手动跑 “Deploy Copilot to Modal”，tag 填 `copilot-v0.6.0`。详见 docs/GUIDE.md 第 7 节。

---

# Copilot v0.7.0 (2026-11-22)

The previous release, v0.6.0, shipped on Nov 20; since then PRs #120 to #123, #125 to #130 and this release's PR #131 were merged. The image contains the Copilot (Python) and the trip-planning engine (Node). The website deploys from `main` on Vercel automatically and has no versions of its own; its major changes in this period are listed below too.

## Copilot

- **Multi-agent trip planning (on by default)**: when the user states soft wishes such as "a rest day in the middle", "no more than 3 hours of driving a day", "one hotel the whole time", "Grand Teton the first two days, Yellowstone the last four" or "one area a day", the planning agent extracts them (each with a quote), code validates them and turns them into 18 kinds of engine knobs, the engine plans, each wish is graded, and anything missed goes to the review agent for up to 3 rounds (an easier pace, adding or dropping stops, merging hotels, giving up a wish); finally code writes what was met, what wasn't and why, and what was left out. `COPILOT_TEAM=0` turns it off. **Each plan makes 1 more model call (1–3 more when something is missed)**, so free quotas are used up roughly half again as fast.
  - Eval (`copilot/eval/cases/soft-v1.jsonl`, 30 cases, expectations written and frozen before the code): the old dispatcher 7/30; multi-agent with local Qwen3.5 4B 27/30, Qwen3.5 35B-A3B 29/30, gpt-oss 20B 27/30 and Gemini 3.5 Flash Lite 27/30 (fixed after looking at failures, so no longer unseen; the first-run scores of 25–27 are in RESULTS.md).
  - Control cases (`soft-v2.jsonl`, 20 cases, half Chinese and half English, with no soft wishes at all): all three local models score 20/20 with nothing invented; the 20 wishes 4B made up and the 3 from 35B were all caught by the code check.
  - Code checks: the quote must really be in the user's words and must talk about that wish ("balanced pace" is not a rest day, "family of four" is not one hotel, a question is not a must-see); day numbers are read from the user's words when the model gives a park without days or gets the last day wrong.
- **Local fallback model is now Qwen3.5 35B-A3B** (MoE, about 22 GB, needs 32 GB of RAM): clearly better than 4B on the understanding and reasoning suites (search agent 33/44 vs 27/44, alert dates 20/24 vs 16/24), 2–3 times slower. The one-click start falls back to 4B when 35B isn't downloaded; the Docker one-click start downloads 35B by default, and smaller machines can set `MODEL=qwen3.5:4b-q4_K_M`. Production (Modal) doesn't run local models and isn't affected; the CI gates still replay the 4B recordings.
- **Intake**: once a park is recognized, its sights, areas and landforms like "the coast" or "the rainforest" are no longer taken for another park (Gemini used to ask whether "the rainforest" meant Petrified Forest); "I'd like an Airbnb" is a lodging preference, not a hotel named Airbnb.
- **Data version** (#128): every answer records which data it used (sha256 of the site data, the Copilot notes and the regional names, combined into 12 characters), shown in `/health`, logs, eval reports and `stats`; images also get a `sha-<commit>-p<prompts>-d<data>` tag.
- **Guardrails and data snapshot checks** (#129): when the alerts API is down, the trip note says which day's alerts were used; `serve` validates parks, airports, sights and notes with Pydantic at startup and refuses to start on bad data.
- **NPS road events** (#130): NPS road closures (WZDx) are fetched nightly and trips within two weeks skip sights on closed roads; Kings Canyon Highway 180 joins the seasonal roads.

## Website

- **Site redesign** (#122, #123, #125, #126, #127): rebuilt after Wabunka's look and feel, with a dark home page and light inner pages, serif type, gold buttons and the Copilot as the first screen of the trip page; a new activities page (335 activities by month).
- **Dashboard**: the architecture diagrams grow to five (adding "Multi-agent planning"), plus a new "Tech stack" section; "Tests and evals →" at the top opens the new `/admin/evals`: layers of testing, multi-agent vs dispatcher, local models compared, the 10 gates, and every eval round (34).
- **Trip engine**: "one area a day" now picks areas first and then assigns whole areas to days.

## How to use

```bash
COPILOT_TAG=copilot-v0.7.0 docker compose -f copilot/docker-compose.yml up -d
```

To switch off only the multi-agent planning: add `COPILOT_TEAM=0` to the `nps-copilot` secret in Modal's production environment (`main`); it takes effect when the machine restarts. To roll the whole release back: set `COPILOT_TAG` to `copilot-v0.6.0`; on Modal, run "Deploy Copilot to Modal" manually in Actions with the tag `copilot-v0.6.0`. See docs/GUIDE.md section 7.
