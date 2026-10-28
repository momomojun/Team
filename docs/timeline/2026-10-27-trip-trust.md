# 10-27：行程靠不靠得住——资料出处、数据保质期、对照真实行程（分支 `feature/trip-trust`）

- 为什么做：有人问“怎么确保排出来的行程是对的、真实存在、没问题”。现有的防编造（AI 不排行程、说明要对得上结果）、按规则排（开放、班车、山路……）、实时公告都有了，缺的是：用户看不到每条信息从哪来、哪天核对的；数据过期没人提醒；没拿真人的行程验证过引擎排得合不合理。仓库主人说 A、B、C 都做（GOALS O75）。
- A 数据保质期：`src/lib/freshness.ts` 把手工整理的 630 条数据（临时关闭、住处营业季节、班车、班次、预约规则、停车场、季节性山路、逐园核对、Google 评分快照）按核对日期列出来，超过 183 天没核对、或者写的是去年的算过期（`staleness.ts`）。`npm run check:freshness`，GitHub 每月 1 号跑一次（`.github/workflows/data-freshness.yml`），有过期的开 `data-freshness` issue。现在 1 条过期（皇家岛 Windigo 小木屋写的是 2025 年的营业季节）；`--today 2027-03-01` 有 202 条。逐园核对的日期按 `docs/archive/audit/` 生成索引（`npm run data:audit-index`，`tests/freshness.test.ts` 检查是最新的）：70 座公园、422 个景点有记录。
- B 资料出处：行程里点开一站，最下面“资料出处”列出这一站的每条信息来自哪个官方页面、哪天核对的、过期的标“该重查了”（`src/lib/provenance.ts`、`stop-sources.tsx`）；公园官网经 `PlannerPark.officialUrl` 传进来（NPS 的用 nps.gov 公园首页）。中英文都在浏览器里看过（锡安翡翠池：逐园核对、官网、班车 2026 年时刻表、同行适合度、Google 快照、车程估算）。
- C 对照真实行程：派了一个子助手按 NPS、Parks Canada 官网收集官方推荐行程（52 条、15 座公园，202 个站对上了我们的景点，135 个对不上的保留官方名字；记录在 `docs/archive/audit/2026-10-27/nps-itineraries.md`），加上博主路线里按天排的 31 条。`npm run eval:routes`（`scripts/real-routes-lib.mjs`）让引擎按同样的条件排一遍再比，结果见 [TRUST.md](../TRUST.md)：有名景点覆盖 86%，节奏和 NPS 官方推荐几乎一样，真人的整天行程按我们的规则排只有 3 条有问题、都说得通，我们说关着、真人却去了的 5 个查下来都不是数据错。`tests/real-routes.test.ts` 按 `baseline.json` 当门禁。第一次按机场进出跑出来只有 69%，是评测方法的问题（一日游第一天要从机场开好几个小时），改成从公园定位点出发。
- 检查：`npm test` 181 个全过；tsc、lint 没有新问题。
- 拿不准的：NPS 官方的整天分天行程很少（9 条），黄石、锡安、落基山、仙纳度、火山口湖没找到；博主路线只记了视频里出现的地方，节奏的差距要打折看；“没挑上”的 81 个景点大多是小景点，没有逐个看是不是该排。
