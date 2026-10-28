# 行程质量评测（2026-10-27）

110 条固定的请求（每座公园一条，加 40 条两座公园的），月份、天数（2–5 天）、节奏、同行的人轮着来，出发、回程是常用机场。

## TravelPlanner 式：逐条检查

| 指标 | 结果 |
|---|---|
| 排出了行程（Delivery rate） | 100.0% |
| 常识约束 micro / macro | 99.2% / 96.4% |
| 用户硬约束 micro / macro | 99.8% / 99.1% |
| 最终通过率（两类全过） | 95.5% |

| 检查 | 没过的行程 | 例子 |
|---|---|---|
| 景点不重复 | 0 | — |
| 景点都在要去的公园 | 0 | — |
| 那天开着 | 0 | — |
| 时间排得开（入场时间、班次、日落、天黑） | 2 | isro+voya：voya-kettle-falls missDeparture；grsm+shen：shen-stony-man missSunset、shen-stony-man dark |
| 每天不太满、不太晚回 | 4 | isro+voya：第 1 天 overloaded；grsm+shen：第 3 天 overloaded；dena+kefj：第 1 天 overloaded |
| 每晚有住处、最后回到回程地 | 0 | — |
| 不排要抽签的 | 0 | — |
| 天数对 | 0 | — |
| 点名要去的排了 | 1 | chir：chir-night-sky |
| 点名不去的没排 | 0 | — |
| 节奏（悠闲最多四站、轻松不排困难徒步、最长徒步） | 0 | — |
| 同行的人不适合的没排 | 0 | — |

## TripCraft 式：连续分（0–1，越高越好）

| 分 | 平均 | 怎么算 |
|---|---|---|
| 时间 | 0.742 | 写了最佳时段的景点在那个时段、停车场早满的赶在停满前到，合的比例 |
| 空间 | 0.998 | 同一天的景点换遍所有顺序（不多出“去不了、赶不上、太满”、不丢日出日落）最少开多久 ÷ 引擎排的开多久；401 天里 25 天有更短的顺序 |
| 顺序 | 0.972 | 一天里同一片区的景点挨着去、几座公园不来回跳 |
| 同行的人 | 0.851 | 有同行的人的行程：适合 1 分、要注意 0.5 分、不适合 0 分 |

时间分按写的最佳时段分开（一天只有一个日出、一个日落：一座公园好几个看日落的观景点，只有一个能排在日落）：

| 写的时段 | 合的比例 | 没合的例子 |
|---|---|---|
| 写了几个时段（在其中一个就算合） | 84.8%（168 / 198） | jotr jotr-pioneertown、cany cany-dead-horse-point、badl badl-yellow-mounds、thro thro-buck-hill |
| 只写上午 | 87.6%（127 / 145） | pinn pinn-chalone-peak、noca noca-washington-pass-overlook、grte grte-teton-park-road、romo romo-sheep-lakes |
| 只写日落 | 43.8%（49 / 112） | yose yose-el-capitan、yose yose-valley-view、seki seki-panoramic-point、pinn pinn-prewett-point |
| 停车场一早就满（赶在停满前到） | 75.7%（56 / 74） | pinn pinn-old-pinnacles-balconies、olym olym-hurricane-ridge、arch arch-windows、acad acad-carriage-roads |
| 只写日出 | 49.0%（25 / 51） | crla crla-discovery-point、grte grte-oxbow-bend、glac glac-swiftcurrent-lake、glac glac-wild-goose-island |
| 只写下午 | 57.7%（15 / 26） | yell yell-grand-prismatic-overlook、yell yell-grand-prismatic、grsa grsa-medano-creek、deva deva-artists-palette |
| 只写晚上 | 100.0%（10 / 10） | — |

## 换个顺序能少开最多车的几天

- grsa+romo 第 2 天：少开 23 分钟（萨帕塔瀑布 → 城堡溪野餐区（东侧沙丘） → 滑沙 → 沙丘区漫步）
- sagu 第 1 天：少开 14 分钟（Gates Pass 观景台 → 亚利桑那–索诺拉沙漠博物馆 → 红山游客中心（西区） → 沙漠探索步道 → Signal Hill 岩画 → Bajada 环线景观道）
- chir+sagu 第 4 天：少开 13 分钟（Wasson Peak（图森山最高点） → 红山游客中心（西区） → 沙漠探索步道 → Bajada 环线景观道）
- meve 第 1 天：少开 12 分钟（云杉树屋（观景台） → 方塔屋（观景台） → 太阳点观景台 → 太阳神庙 · 悬崖宫殿远眺）
- jeff 第 2 天：少开 10 分钟（拱门草地和倒影池 → 拱门下的博物馆）
- chir+sagu 第 5 天：少开 10 分钟（Valley View 观景步道 → Signal Hill 岩画 → Javelina Rocks 观景点 → Tanque Verde 山脊步道（观景点） → Freeman 家园步道 → 林孔山游客中心（东区） → Cactus Forest 环线景观道）
- grsa 第 3 天：少开 4 分钟（蒙特维尔自然步道 → 梅达诺山口四驱路 → 大沙丘游客中心）
- shen 第 2 天：少开 4 分钟（Dark Hollow 瀑布 → Rapidan 营地（胡佛总统夏季营地）导览 → Byrd 游客中心 → Big Meadows 草甸）
- ante+hsbd 第 4 天：少开 3 分钟（水洞峡谷 → 羚羊峡谷 X → 上羚羊峡谷）
- cave+whsa 第 5 天：少开 3 分钟（天然入口步道 → 大房间（Big Room） → 卡尔斯巴德洞窟游客中心）
