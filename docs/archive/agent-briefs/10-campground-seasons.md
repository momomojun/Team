# 任务：给营地补上开放季节，冬天别排进关门的营地（给 Huiling 和她的 AI 助手）

2026-10-20 仓库主人审 PR #26（营地地图、住宿偏好“露营”）时发现的问题，交给做营地功能的 Huiling 修。
先读 [docs/GUIDE.md](../../GUIDE.md) 第 1–5 节（怎么跑、怎么开 PR、提交怎么写）。

## 问题

`src/data/campgrounds.ts` 的 149 个营地没有开放季节。排行程时判断“这晚营不营业”用的是 `src/lib/lodging-season.ts` 的 `lodgingOpenOn(id, 日期)`：
它只查 `src/data/lodging-seasons.ts` 里的表，**表里没有的 id 一律当全年营业**，所以营地永远当开着。

复现（10-20 在最新的 main 上跑的，住宿偏好选“露营”、2027 年 1 月 12 日出发 3 天）：

| 公园 | 排进去的营地 | 实际 |
|---|---|---|
| 火山口湖 `crla` | `crla-camp-mazama-village` | 一般只在夏天开（约 6–9 月） |
| 雷尼尔山 `mora` | `mora-camp-cougar-rock` | 一般 5 月底到 9 月 |
| 落基山 `romo` | `romo-camp-rocky-mountain-national-park-glacier-basin` | 夏季营地 |
| 黄石 `yell` | `yell-camp-slough-creek` | 一般 6–10 月 |
| 拉森 `lavo` | `lavo-camp-southwest` | 全年开（冬天是步行进的简易营位），这个是对的 |

（“实际”一栏是大概的印象，要按官方页面核对，不能照抄这张表。）

Copilot 也认得“露营”了（PR #26 改了 `copilot/nps_copilot/intake.py`），用户说“1 月去雷尼尔山露营”，Copilot 也会这样排。

不影响住宿偏好是“不限”“酒店”“民宿”的行程：那些情况下营地不会被自动选上（10-20 试过）。

## 要做的

1. **给季节性营地补上开放日期**，写进 `src/data/lodging-seasons.ts`（和酒店用同一张表、同一个格式，排行程、行程页的提醒就自动生效，不用改 `generate-trip.ts`）：
   - key 是营地 id（`campgrounds.ts` 里的 `id`），值是 `{ open: [{ from: "MM-DD", to: "MM-DD" }], year, source, checked }`，字段的意思看文件开头的说明和 `LodgingSeason` 类型；
   - **全年开的营地不写**（和酒店一样）；只开一部分营位的（冬天只开某个环线、只能步行进）算开着，在注释里写清；
   - 每条都要有官方来源（`source`）：优先各公园 NPS 的 campgrounds 页面（`https://www.nps.gov/<公园代码>/planyourvisit/campgrounds.htm`，或者 Operating Hours & Seasons 页面），其次 Recreation.gov 的营地页面（`campgrounds.ts` 里每条的 `bookUrl`）；写明是哪一年公布的日期（`year`）和哪天查的（`checked`）；
   - 官方只写了“通常 5 月下旬到 9 月”这种的，按估计写，在注释里写“按 NPS 说的大概月份估”；查不到的不要编，在 PR 里列出来；
   - 149 个可以按公园分批做；最要紧的是冬天会关门的（山上、北边、阿拉斯加的），南边沙漠里全年开的大多不用写。
2. **加测试**：在 `tests/` 里加几条（可以放进新文件 `tests/campground-seasons.test.ts`）：
   - 上面几个公园 1 月选“露营”时，不再排进关门的营地；全都关了的，就排营业的酒店（`generate-trip.ts` 在偏好的住处都关了时会从营业的里面挑，确认一下它真的这样做）；
   - 7 月选“露营”时照样排营地；
   - `lodging-seasons.ts` 里每个营地的 key 都是 `campgrounds.ts` 里真的有的 id（防止打错字）。
3. **页面上看一眼**：行程页的“营地地图”里，这晚不营业的营地要和酒店一样标“这晚不营业”（`planner.tsx` 的 `rankedFor` 已经按 `lodgingOpenOn` 标了，确认营地也显示出来）。改完在浏览器里实际看过，手机宽度也看。
4. 顺手：`src/components/prices/price-center.tsx` 第 12 行的 `pickupNotes` 没用到（`npm run lint` 有一个警告），用上或者删掉。

## 做完以后

- 跑 `npm run lint`、`npx tsc --noEmit -p .`、`npm test`、`python -m pytest -q copilot/tests`，都要过；改了中文数据的话跑一次 `npm run copilot:contracts`（Copilot 用的资料跟着更新）。
- 提交说明、PR 标题和描述写**中文 + 英文**（看 `git log` 里的例子），提交结尾按仓库的习惯写；一个 PR 只做这一件事。
- 在 `docs/DEVELOPMENT.md` 讲 `lodging-seasons.ts` 的那一行里补一句“营地也写在这里”，在 `docs/PROJECT.md` 的时间线里记一笔（哪天、做了什么、查了多少个营地、哪些没查到）。

## 规矩（项目的约定，GUIDE.md 第 5 节有完整的）

- 事实以英文官方资料为准；不登录任何网站；查不到就写没查到，不要编日期。
- 不要提交 `.env.local` 和任何 key。
- 不改 `copilot/eval/` 下面的评测样例和录音。
