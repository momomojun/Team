# Copilot v0.6.0（2026-11-20）

上一版 v0.5.0 是 11-13 发的，之后合并了 PR #105 到 #108、#110、#113、#117、#118 和这一版的 PR。这一版的镜像里是 Copilot（Python）和排行程引擎（Node）；网站本身在 Vercel 上随 `main` 自动部署，不分版本，下面也列了这段时间网站的大改动。

## Copilot

- **会自己查的问答（search agent，默认关着）**：回答问题时，模型自己决定调哪几个查询工具、填什么参数，看了结果再决定还要不要查，查够了带着出处回答。最多调 4 次模型、整圈 20 秒；地方写名字、代码对成网站的 id，日期由代码检查（不存在的不查；问题里没写年份、写成了已经过去的日子，按下一次的这一天查）；回答照旧过数字检查、不能说出工具名，说找到了却没给出处的按对不上处理；出了问题退回原来的“找一次就答”。提示词 `agent_v2`。
  - **要在 Modal 的 Secret `nps-copilot` 里加 `COPILOT_QA_AGENT=1` 才打开**；不加，这一版照旧是“找一次就答”。11-20 在 staging 打开试过：“沙漠公园有推荐吗”“这个季节有推荐吗”都走了“自己查”、查询都成功。
  - 评测（`copilot/eval/cases/agent-v1.jsonl`，44 题，先写期望、冻结再写代码；Gemini 3.5 Flash Lite 录音回放）：自己查 **39 / 44**，找一次就答 19 / 44。一句话问两件事 4 / 8 对 2 / 8，后一步用前一步的结果 6 / 6 对 1 / 6，按季节比公园 8 / 9 对 1 / 9，资料加工具 4 / 4 对 0 / 4；网站答不了的、刁难的两边都守住了。每题耗时中位数 3.3 秒对 1.4 秒，模型调用大约两倍。没过的 5 题里 3 题是判分偏严。详见 `copilot/eval/RESULTS.md`。
- **查询工具从 4 种加到 9 种**：原来的查资料、开没开、车程、按条件找景点，加上按季节比公园（和“什么时候去”页同一套打分）、门票、日出日落、要提前订什么、人多不多。问整座公园要订什么时，也列出只按地名登记的营地规则，按核对过的营业季节去掉那天不营业的。
- **十组门禁**：多了一组“回答问题：自己查 · 找一次就答”（回放 Gemini 录好的回答），PR 评论的成绩表多一行，也按每类比基线。
- **回答说“资料里没写”就不附出处**：原来模型勾了“找到了”、回答却说没写时，后面还会附一串资料；两条回答问题的路都改了。
- **后台“最近几轮”**：写明这一轮是模型自己查、自己查退回了找一次就答，还是找一次就答；自己查走了几步、每步查了什么、没查成的原因、查询花了多久、为什么停下。
- **修了镜像里查询工具全部报错**（发版前在 staging 查出来的）：查询工具加了季节打分以后引到了网站的 npm 包 `server-only`，镜像里没装 npm 包，所有查询都失败；本机和 CI 装着 npm 包，测试都过。现在 `server-only` 直接换成空模块；查询报错时不再悄悄返回空、会记下原因；CI、staging 部署和发版的镜像冒烟测试都在镜像里把 8 种查询各跑一次。
- 其他：季节打分给模型看的气温说法改准（“最热的片区平均最高”，不是最热的一天）；极昼不再写成极夜；没有人次排名的公园不写“第 None”；node 查询按这一圈剩下的时间设超时；评测脚本 `--configs` 写错就报错。

## 网站

- **景点照片**：70 座公园的景点图片和封面全面更新，图集扩到 8165 张；修了照片和景点对错、封面不同步，匹配加了校验（#106、#107、#108）。
- **查询工具的网站一侧**（`src/lib/copilot/lookup-tool.ts`）：季节打分挪到 `src/lib/season-score.ts`，“什么时候去”页和 Copilot 共用，算法没变。
- **后台**：“最近几轮”的备注里多了回答问题用的哪种做法、自己查的每一步（要 Copilot 是这一版才有数据）。

## 怎么用

```bash
COPILOT_TAG=copilot-v0.6.0 docker compose -f copilot/docker-compose.yml up -d
```

打开会自己查的问答：Modal 正式环境（`main`）的 Secret `nps-copilot` 里加一行 `COPILOT_QA_AGENT=1`，保存以后机器重新开起来就生效（闲置 5 分钟自动关）。只想关掉它：删掉这一行，回到找一次就答。整版回滚到上一版：把 `COPILOT_TAG` 换成 `copilot-v0.5.0`；Modal 上在 Actions 里手动跑 “Deploy Copilot to Modal”，tag 填 `copilot-v0.5.0`。详见 docs/GUIDE.md 第 7 节。

还没做的：“推荐沙漠公园”这类没有问号的句子会被当成排行程的要求、不当成提问；推荐公园时只靠搜几篇介绍会漏（比如第一次只推荐了三座沙漠公园）；回答那一步看不到上一轮的问答；英文回答的出处里有 76 条资料（片区、州、临时关闭）只有中文名；没排行程时模型偶尔把“行程”也列成出处。

---

# Copilot v0.6.0 (2026-11-20)

The previous release, v0.5.0, shipped on Nov 13; since then PRs #105 through #108, #110, #113, #117, #118 and this release's PR were merged. The image contains the Copilot (Python) and the trip-planning engine (Node). The website deploys from `main` on Vercel automatically and has no versions of its own; its major changes in this period are listed below too.

## Copilot

- **A Q&A that looks things up itself (the search agent, off by default)**: when answering a question, the model decides which lookup tools to call and with what arguments, reads the results, decides whether to look further, and answers with sources once it has enough. It makes at most 4 model calls and has 20 seconds in total. The model names places and code maps them to site ids; code checks dates (a day that doesn't exist is not looked up, and a past day written for a question that gives no year is moved to its next occurrence). Answers still go through the number check and must not reveal tool names, and an answer that claims found but gives no sources is treated as unfaithful; on any problem it falls back to the old retrieve-once Q&A. Prompt `agent_v2`.
  - **It turns on only with `COPILOT_QA_AGENT=1` in the Modal secret `nps-copilot`**; without it this release still uses retrieve-once. It was tried in staging on Nov 20: "any desert parks you'd recommend?" and "any recommendations this season?" both went through the search agent, and all lookups succeeded.
  - Eval (`copilot/eval/cases/agent-v1.jsonl`, 44 questions, expectations written and frozen before the code; replaying answers recorded with Gemini 3.5 Flash Lite): the search agent passes **39 / 44** and retrieve-once 19 / 44. Two things in one sentence: 4 / 8 vs 2 / 8; a later step using an earlier result: 6 / 6 vs 1 / 6; comparing parks by season: 8 / 9 vs 1 / 9; notes plus tools: 4 / 4 vs 0 / 4. Both held up on questions the site can't answer and on adversarial ones. Median time per question is 3.3 s vs 1.4 s, with roughly twice the model calls. Three of the five failures are over-strict scoring. Details in `copilot/eval/RESULTS.md`.
- **Lookup tools grow from 4 to 9**: the existing knowledge search, open-or-not, drive time and attraction search, plus seasonal park ranking (the same scoring as the "when to go" page), fees, sunrise and sunset, what to book ahead, and crowd levels. A whole-park booking question also lists campground rules registered only by place name, leaving out campgrounds closed that day according to their checked operating season.
- **Ten eval gates**: a new gate, "Q&A: search agent · retrieve-once" (replaying answers recorded with Gemini), with one more row in the PR score comment, which also checks each kind against the baseline.
- **No sources when the answer says the notes don't cover it**: before, when the model ticked "found" but its answer said the notes didn't cover it, a list of sources was still attached; both answering paths are fixed.
- **"Recent turns" on the dashboard**: each turn says whether it used the search agent, fell back from the search agent to retrieve-once, or used retrieve-once; for the search agent it shows the number of steps, what each step looked up, why lookups failed, how long lookups took, and why it stopped.
- **Fixed every lookup failing inside the image** (caught in staging before this release): once the lookup tool gained seasonal ranking it pulled in the site's npm package `server-only`; the image has no npm packages, so every lookup failed, while local machines and CI, which have npm packages installed, passed all tests. `server-only` now resolves to an empty module; a failing lookup no longer silently returns nothing and its reason is recorded; and the image smoke tests in CI, the staging deploy and the release run each of the 8 lookups once inside the image.
- Also: the temperature wording given to the model in seasonal scores is now accurate ("the hottest area's average high", not the hottest day); polar day is no longer shown as polar night; parks without a visitor rank no longer show "rank None"; node lookups get the loop's remaining time as their timeout; and the eval script exits with an error on an unknown `--configs` value.

## Website

- **Attraction photos**: images and covers for 70 parks were refreshed and the galleries grew to 8,165 photos; mismatched photos and out-of-sync covers were fixed, and matching now has checks (#106, #107, #108).
- **The website side of the lookup tools** (`src/lib/copilot/lookup-tool.ts`): seasonal scoring moved to `src/lib/season-score.ts`, shared by the "when to go" page and the Copilot, with the same algorithm.
- **Dashboard**: the recent-turns note now shows which answering path was used and each search agent step (data appears only with a Copilot of this release).

## How to run

```bash
COPILOT_TAG=copilot-v0.6.0 docker compose -f copilot/docker-compose.yml up -d
```

To turn on the search agent, add `COPILOT_QA_AGENT=1` to the secret `nps-copilot` in the Modal production environment (`main`); it takes effect once the machine starts again after saving (it shuts down after 5 idle minutes). To turn only that off, delete the line to go back to retrieve-once. To roll the whole release back, set `COPILOT_TAG` to `copilot-v0.5.0`; on Modal, run "Deploy Copilot to Modal" manually in Actions with the tag `copilot-v0.5.0`. See docs/GUIDE.md section 7.

Not done yet: a sentence without a question mark like "recommend desert parks" is treated as a trip request rather than a question; recommending parks from a few searched notes misses some (the first answer named only three desert parks); the answering step can't see the previous question and answer; 76 knowledge entries (regions, states, temporary closures) have only Chinese names, which show up in English answers' sources; and with no trip planned the model sometimes lists "your itinerary" as a source.
