# 行程靠不靠得住 / How we check the itineraries

有人问：你们怎么确保排出来的行程是对的、真实存在、没问题？这里写我们怎么做、做到哪、还有什么做不到。

**English summary.** We can't promise an itinerary is always right: parks close roads for fires and floods at any time. What we can promise, and check: (1) **nothing is made up**: the AI only understands the request and explains the result; a deterministic engine builds the trip from a curated database of real places, and anything in the AI's write-up that isn't in the engine's output is thrown out; (2) **the plan works**: opening hours, shuttles, boat departures, parking, seasonal roads, temporary closures and lodging seasons are all applied, and the engine is tested against 73 real itineraries from travel creators and NPS / Parks Canada; (3) **we say what may be out of date**: every stop shows where each fact came from and when it was checked, data older than six months is flagged, and NPS alerts are read nightly.

## 一、不编造：AI 不“写”行程

- AI 只做两件事：听懂用户的话（Intake）、最后把结果写成说明（Writer）。排行程的是确定的代码（`src/lib/generate-trip.ts`），同样的输入每次结果一样。
- 景点只能从网站的景点库里挑：将近 1000 个，都是按 NPS、Parks Canada 等官方资料整理的，有坐标、有来源。模型加不进库里没有的地方。
- 理解需求时，模型摘出来的条件原话里没有的会被丢掉（后台统计的“丢掉的片段”）。
- 写说明时 `writer.py` 的 `faithful()` 检查：说明里出现的时间、数字、景点名都要在排出来的结果里出现过，有一条对不上就整段换成模板（评测时统计“编造率”）。讲解版的讲解词全按网站数据拼（`src/lib/narration.ts`）。

## 二、排得通：按真实的规则排

- 开放季节和开放时间、班车季和末班车（`shuttles.ts`）、游船导览的班次（`tours.ts`）、停车场几点停满（`parking.ts`）、季节性山路近 20 年的开通关闭（`roads.ts`）、临时关闭（`closures.ts`）、住处那一晚开不开（`lodging-seasons.ts`）、带孩子老人能不能去（`suitability/`）。
- Critic（`copilot/nps_copilot/critic.py`，纯代码）把“去不了、赶不上”和“要注意”分开，前一种一定写进说明。
- 测试：网站 `npm test`（187 个，含下面的真实行程对照和行程质量门禁），Copilot 七组回放评测（含没见过的样例），不达标合不进 main。

### 拿真人走过的行程对照（`npm run eval:routes`，10-27）

73 条真实行程：博主路线里按天排的 31 条（`src/data/creators.ts`），NPS 和 Parks Canada 官方推荐的 42 条（`tests/fixtures/real-routes/nps-itineraries.json`，每条附官方页面）。每条按同样的公园、天数、月份让引擎自己排一遍，再反过来把真人的行程按我们的规则排一遍。完整报告：[archive/audit/2026-10-27/real-routes-eval.md](archive/audit/2026-10-27/real-routes-eval.md)。

| 看什么 | 结果 |
|---|---|
| 真人去了的景点，引擎也排了 | 67%（博主 76%、NPS 58%） |
| 其中有名的（必去或园内热度前 5） | 86%（210 / 243） |
| 每天几站：真人 / 引擎“正常” / “轻松” / “悠闲” | 博主 3.3 / 5.6 / 4.9 / 3.5，NPS 官方 5.0 / 5.0 / 4.1 / 3.0 |
| 一天之内景点之间开车（分钟）：真人 / “正常” / “轻松” / “悠闲” | 博主 68 / 132 / 116 / 74，NPS 官方 130 / 138 / 105 / 59 |
| 真人的整天行程按我们的规则排，出现“去不了、赶不上”的 | 3 / 40 条 |
| 真人去了、我们的数据说那个月关着的 | 5 个 |

- **节奏和 NPS 官方推荐的几乎一样**（每天 5 站、站间开两个多小时）；博主走得慢得多，连“轻松”都比他们满。一部分是因为视频只拍了一部分地方，但也说明想慢慢玩的人要选慢一点的：10-28 加了最慢的一档“悠闲”（一天最多四站），排出来 3.5 站、站间开车 74 分钟，和博主的 3.3 站、68 分钟接近。
- **有名的景点很少漏**：漏的 33 个里大多是“排不下”（一天的时间不够），少数是那个月关着（锡安的窄缝 4 月常因为融雪水大关闭、冰川 6 月初向阳大道还没通）、要抽签（天使降临）。
- **真人的行程放到我们的规则里基本都走得通**：3 条有问题的都说得通（锡安窄缝 4 月关着，两条横穿整个公园的语音导览最后一站到游客中心时已经关门）。我们的数据说关着、真人却去了的 5 个，查下来都不是数据错：真人去的时候路还没开（博主自己说了）、春天融雪、或者月份是我们按“春天”猜的。另外 5 个是现在临时关着、真人去的那年还开着的（Laurel Falls 修到 2027 年，NPS 自己的推荐页面还没改）。
- `tests/real-routes.test.ts` 是门禁：改了挑景点的逻辑，覆盖不能比基线（`tests/fixtures/real-routes/baseline.json`）低 2 个百分点以上，真人行程“去不了”的不能变多。

### 照公开的旅行规划评测打分（`npm run eval:quality`，10-28）

照两篇公开的论文的打分方法：[TravelPlanner](https://arxiv.org/abs/2402.01622)（ICML 2024）逐条查“常识约束”（景点不重复、那天开着、时间排得开、每晚有住处……）和“用户的硬约束”（几天、点名要去 / 不去的、节奏、同行的人）；[TripCraft](https://arxiv.org/abs/2502.20508)（ACL 2025）按 0–1 的连续分看时间、空间、顺序、同行的人。110 条固定的请求：每座公园一条，加 40 条常一起玩的两座公园，月份、天数、节奏、同行的人轮着来，出发、回程是常用机场。完整报告：[archive/audit/2026-10-28/plan-quality.md](archive/audit/2026-10-28/plan-quality.md)。

| 看什么 | 结果 |
|---|---|
| 排出了行程 | 100% |
| 常识约束、用户硬约束都全过的行程（TravelPlanner 的“最终通过率”） | 95.5%（105 / 110） |
| 时间分：写了最佳时段的景点在那个时段、停车场早满的赶在停满前到 | 0.742 |
| 空间分：同一天的景点换遍所有顺序（不多出“去不了、赶不上”、不丢日出日落）最少开多久 ÷ 引擎排的 | 0.998（401 天里 25 天能少开一点，最多 23 分钟） |
| 顺序分：同一片区的景点挨着去、几座公园不来回跳 | 0.972 |
| 同行的人：适合 1 分、要注意 0.5 分 | 0.851 |

- **没过的 5 条都是真问题**：奇里卡瓦点名要去 Massai Point 看星空，引擎说“没时间”，其实第一天上午 11 点就结束了；大烟山 + 仙纳度第 3 天开 8 小时车还塞了三站，最后一站天黑才到；航海家的 Kettle Falls 游船赶不上；皇家岛 + 航海家、德纳里 + 基奈峡湾、卡特迈 + 克拉克湖各有一天太满（坐船、坐小飞机的一日游本身就很长，再加上开车）。这些留着修（见 GOALS）。
- **时间分低在“一天只有一个日落”**：一座公园好几个看日落的观景点，只有一个能排在日落（只写“日落”的 44% 合）；另外黄石的大棱镜温泉写着下午去最好（早上水汽挡住颜色），引擎排在了早上 8 点，下午的偏好分量太轻。
- `tests/plan-quality.test.ts` 是门禁：最终通过率、时间分、顺序分不能比基线（`tests/fixtures/plan-quality/baseline.json`）低 2 个百分点以上，空间分不能低 0.5 个百分点，不能排同行的人不适合的、点名不去的。

### 拿 VROOM 当裁判看分天（`npm run eval:referee`，10-28）

[VROOM](https://github.com/VROOM-Project/vroom) 是开源的车辆路径优化器（物流公司排送货路线用的）。同样的景点、同样的每晚住处，一天当成一辆车，让它重新决定每个景点放哪一天、每天怎么走：车程用网站同一套，日出日落星空的景点还得在那个时段，入场时间、固定班次照旧，景点只能放在同一座公园的日子里，每天不超过这个节奏的上限。它排出来的再按我们的规则排一遍时间线，查有没有多出“去不了、赶不上、太满”。完整报告：[archive/audit/2026-10-28/vroom-referee.md](archive/audit/2026-10-28/vroom-referee.md)。

| 看什么 | 结果 |
|---|---|
| 两天以上的行程 | 103 条，VROOM 都解出来了 |
| VROOM 全排上、按我们的规则也不多出“去不了、赶不上”的 | 69 条：一共开车 52,188 → 51,396 分钟（少 1.5%），21 条少开 30 分钟以上 |
| 其中最累的一天也不比引擎长的 | 36 条：引擎 28,189 分钟、VROOM 28,336 分钟（VROOM 反而多 0.5%），只有 4 条能少开 30 分钟以上 |

- **分天这一步和成熟的优化器差不多**：VROOM 能多省的车，大多是把几天的景点塞进一天（它只管总共开多少，不管每天匀不匀）；最累的一天不许变长，它就省不下来了。
- **能改进的 4 条**：大沼泽地（少开 151 分钟：三个入口园内不通，引擎分天时来回跑了）、奇里卡瓦（60 分钟）、瓜达卢佩山（53 分钟）、大烟山 + 仙纳度（32 分钟）。
- VROOM 的排法有 33 条按我们的规则多出了问题：停车场几点停满、末班车、天黑还在徒步这些它不懂。所以它只能当裁判，不能直接拿来排行程。
- 要先装 VROOM 的 Python 包（`python -m pip install pyvroom`），所以不在 `npm test` 里，改了分天的逻辑以后手动跑。

## 三、会过时：告诉用户哪些可能不对

- **每一站的“资料出处”**（行程里点开一站，`src/lib/provenance.ts`）：景点资料哪天按官方资料逐条核对过（`docs/archive/audit/`，`npm run data:audit-index` 生成索引）、公园官网、临时关闭、班车、班次、预约、停车场、山路、同行适合度各自的官方页面和核对日期，Google 评分是哪天的快照，车程是估算的。超过半年没核对、写的是去年的时刻表的，标“该重查了”。
- **数据保质期检查**（`npm run check:freshness`，`src/lib/freshness.ts`）：手工整理的 630 条数据，超过 183 天没核对、或者写的是去年的，列出来；GitHub 每月 1 号自动跑一次（`.github/workflows/data-freshness.yml`），有过期的就开 `data-freshness` issue。10-27 只有 1 条过期（皇家岛 Windigo 小木屋写的是 2025 年的营业季节）；到 2027 年 3 月会有 202 条（大多是 2026 年的时刻表、营业季节），那时要整体重查一遍。
- **实时公告**：每晚模型读 NPS 公告（每周一抽查一次读得准不准），两周内出发的行程不排说关了的景点；本机每天核对一次临时封路。
- 最后一道：页面写“出发前以 nps.gov 为准”，要预订的给官方链接和开订日期。

## 还做不到的

- **数据会过期**：营业季节、班次、价格多是 2026 年 9–10 月的快照，明年要重查（保质期检查会提醒，但重查要人去官网看）。
- **车程是估算**：OSRM 按道路算、按平均车速校正，拿 7 条常走路线对过误差在 ±10% 以内；园区里偏乐观，停车、堵车没算。
- **“今天开着”只管两周**：NPS 公告只说现在的情况，更远的行程按往年的规律估。
- **没逐条核对的景点**：核对记录里写到了 422 个景点的 id，其余的是整座公园核对、或者按名字写的，“资料出处”里写的是公园的核对日期。
- **真人行程的样本**：博主的路线只记了视频里出现的地方，NPS 官方的多是一日游和短线，整天的只有 9 条；没有找到优胜美地以外热门公园（黄石、锡安、落基山）的官方分天行程。
