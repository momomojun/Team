# 任务说明：加剩下的 10 座国家公园（2026-10-20）

给 AI 助手的任务说明。仓库主人 10-20 要把美国剩下的国家公园加进网站。目标清单里写的是 9 座，对照 `national-parks.ts` 发现漏了圣路易斯拱门，一共 10 座。中文名用 `national-parks.ts` 里已经有的。

| 代码 | 公园 | 州 / 地区 |
|---|---|---|
| `maca` | 猛犸洞 Mammoth Cave | 肯塔基 |
| `cong` | 康加里 Congaree | 南卡罗来纳 |
| `hosp` | 温泉 Hot Springs | 阿肯色 |
| `cuva` | 凯霍加谷 Cuyahoga Valley | 俄亥俄 |
| `indu` | 印第安纳沙丘 Indiana Dunes | 印第安纳 |
| `isro` | 皇家岛 Isle Royale | 密歇根（只能坐船、水上飞机进） |
| `voya` | 航海家 Voyageurs | 明尼苏达（大半要坐船） |
| `viis` | 维尔京群岛 Virgin Islands | 美属维尔京群岛圣约翰岛 |
| `npsa` | 美属萨摩亚 National Park of American Samoa | 美属萨摩亚 |
| `jeff` | 圣路易斯拱门 Gateway Arch | 密苏里（城市里，登顶要订分时段票） |

## 你只做调研和写新文件，不改共用的文件

几个助手同时在一个工作目录里干活。共用的文件由主对话合并，你**不要改**：`parks.ts`、`attractions/index.ts`、`lodging.ts`、`bookings.ts`、`activities.ts`、`airports.ts`、`closures.ts`、`tours.ts`、`parking.ts`、`time-notes.ts`、`park-zones.ts`、`honors.ts`、`national-parks.ts`、`fees-manual.ts`、`lodging-seasons.ts`、英文表等。

每座公园你要交三个**新文件**：

1. **景点** `src/data/attractions/<代码>.ts`
   - 照着 `src/data/attractions/neri.ts`、`shen.ts`、`acad.ts` 的写法，字段含义看 `src/data/attractions/types.ts`。
   - 每座公园 8–18 个景点，按这座公园真正值得去的来定：步道、观景点、洞穴导览、游船、游客中心、景观道。
   - id 写成 `<代码>-英文短名`，片区 `area` 用你在第 3 个文件里定的片区 key。
   - 坐标用 NPS 页面或 OpenStreetMap 上的，景点本身和停车 / 出发点（`start`）分开写。
   - 字段要写全：
     - `durationMin`（停留时间）；
     - 步道的 `hike`（英里、英尺、难度）；
     - `openMonths`；关闭的写 `closedNote`；
     - `permit` 写清要不要预约、怎么订；
     - `hours`（有入场时间的）；
     - `mustSee`；
     - `summary` 和 `tips`：中文，大白话，像现有文件那样写具体的数字和做法；
     - `photoFile`：Commons 上有合适照片就填文件名，没有就不填，图集由脚本另外生成。
   - 步道要画路线的，写 `trail.via`（途经点坐标），参考 `neri.ts` 的写法。
   - 只能坐船、坐飞机去的体验（罗亚尔岛的渡轮、美属萨摩亚的离岛），按 `katm.ts`、`drto.ts` 的写法：`start` 写开车能到的码头或机场，`durationMin` 含往返。
2. **同行适合度** `src/data/suitability/<代码>.ts`
   - 照着 `src/data/suitability/neri.ts`，**每个景点都要有一条**（有测试检查）。
   - 字段：建议几岁、婴儿车、轮椅、老人、危险、`noteZh`。
   - 先查这座公园的 NPS 无障碍页面（accessibility），官方写明了的附 `source`。
   - 洞穴导览、游船的年龄下限按官方写在 `minAge`。
3. **调研记录** `docs/archive/audit/2026-10-20/<代码>.md`。共用文件要加的东西，写成可以直接粘贴的 TypeScript 片段，主对话照着合并：
   - **`parks.ts` 的条目**：照着 `src/data/parks.ts` 里 `neri` 那一条的全部字段写：
     - `nameZh`、`nameEn`、`tagline`、`stateEn`；
     - `hero`（一个景点 id）、`intro`、`bestMonths`、`seasonNote`；
     - `areas`（片区 key → 中文名和简介）、`gateway`、`timeZone`；
     - `airports`（2–4 个 IATA 代码）、`nearby`（现有公园里常一起玩的代码，没有就不写）；
     - `nonresidentSurcharge`（2026 年非居民附加费只有 11 座公园收，这 10 座应该都是 false，核对一下）、`lodgingTip`；
     - `region`：现有的片区 key 能用就用（看 `parks.ts` 开头的定义），用不了就提议一个新片区（中文名、英文名），说明理由。
   - **`airports.ts`**：新机场的名字和坐标（看现有的写法）。
   - **`lodging.ts`**：园内酒店、门户小镇、民宿区，照现有写法，坐标要写。
   - **`lodging-seasons.ts`**：只开一季的住处的营业日期和来源。
   - **`bookings.ts`**：要提前订的，包括洞穴导览票、渡轮、园内住宿、营地、许可证的开放规则。
   - **`activities.ts`**：特别活动、季节现象。
   - **`tours.ts`**：固定班次的船、导览团、洞穴团的 2026 年班次。
   - **`closures.ts`**：现在的临时关闭，查各公园的 Current Conditions 和 alerts 页面。
   - **`parking.ts`**：官方写了几点停满的停车场才收。
   - **`time-notes.ts`**：时区的坑，如果有的话。
   - **门票**：NPS 门票接口会自动查，这里只写特殊的，比如猛犸洞的洞穴团要另买票、温泉的浴场门票。
   - **荣誉**：世界遗产、国际暗夜公园。
   - 其他不寻常的情况。
   - 最后一节"拿不准的"：官方说法互相矛盾、没查到的。

## 规矩

- **事实以英文官方资料为准**：NPS 官网（`nps.gov/<代码>/planyourvisit/...`）、Recreation.gov、特许经营商官网，其次是州政府、当地旅游局。每条写来源 URL 和查的日期（2026-10-20）。2026 年有临时情况的（施工、风暴、停办），写明是哪年的情况。
- **不登录任何网站**，不点同意条款，不绕过拦截；不用小红书。打不开的页面写“没能确认”。
- **网页搜索有额度**：每个助手最多用 60 次 WebSearch。先用 WebFetch 直接打开 NPS 的页面（`/planyourvisit/things2do.htm`、`hours.htm`、`conditions.htm`、`accessibility.htm`、`fees.htm`、`lodging.htm`、`camping.htm`），少搜。碰到额度报错就停下，把进度写进调研记录。
- **每做完一项马上写进文件**（先写调研记录，再写景点文件），中途停下也不丢东西。
- **中文写法**照现有文件：
  - 简体，大白话，具体到数字。
  - 中文和英文、数字之间空一格。
  - 景点名常用中文名，加英文原名（比如“弗洛伊德·柯林斯水晶洞（Floyd Collins Crystal Cave）”这种只在第一次出现时）。
  - 不写营销腔。
- 写完跑 `npx tsc --noEmit -p .`，确认你的新文件没有类型错误（别的文件的错误不用管）。不要跑会联网改数据的脚本（`npm run data:*`），不要提交、不要推送。

## 交回什么

最后回一段话：每座公园做到哪了、景点数、没查到或拿不准的事、用了大约多少次 WebSearch。
