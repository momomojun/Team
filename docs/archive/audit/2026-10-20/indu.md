# indu 印第安纳沙丘 Indiana Dunes 调研记录（2026-10-20）

新公园。景点文件 `src/data/attractions/indu.ts`（导出名 `indianaDunes`），同行适合度 `src/data/suitability/indu.ts`。所有来源都是 2026-10-20 查的。

## 主要来源

- 门票（$25/车 7 天、园区年卡 $45；州立公园另收、互不通用）：https://www.nps.gov/indu/planyourvisit/fees.htm
- 现况（页面 2026-06-13 更新，只有“活动可能因天气取消”）：https://www.nps.gov/indu/planyourvisit/conditions.htm
- 步道表：https://www.nps.gov/indu/planyourvisit/hiking.htm
- Mount Baldy（离湖面 126 英尺、每年往内陆移约 4 英尺、山顶只在护林员带队时开放；页面 2026-06-15 更新）：https://www.nps.gov/indu/planyourvisit/mb16.htm
- West Beach（Dune Succession 270 多级台阶、600 个车位、浴室季节）：https://www.nps.gov/indu/planyourvisit/wb16.htm
- Cowles Bog：https://www.nps.gov/indu/planyourvisit/cb16.htm
- 无障碍（海滩轮椅、Portage Lakefront 的沙滩垫）：https://www.nps.gov/indu/planyourvisit/accessibility.htm
- 游客中心时间：NPS 2026–27 年园区报纸 Singing Sands 的搜索摘要（阵亡将士纪念日到劳动节 8:00–18:00，其余 8:30–16:30）；PDF 本身没能下载
- Dunewood 营地：Recreation.gov 258887（66 个营位：54 个开车到、12 个走进去，没有水电接口，有淋浴）
- 州立公园 3 Dune Challenge：https://www.in.gov/dnr/state-parks/parks-lakes/indiana-dunes-state-park/ （8 号步道 1.5 英里、翻过三座最高的沙丘，Rugged）
- 坐标：游客中心、海滩、步道口、停车场按 OSM（Nominatim、Overpass，2026-10-20 查）

## parks.ts 条目

```ts
  {
    code: "indu",
    nameZh: "印第安纳沙丘",
    nameEn: "Indiana Dunes",
    region: "greatlakes", // 新片区，见 maca.md
    tagline: "密歇根湖南岸的沙丘、沼泽和湖滩",
    stateEn: "Indiana",
    hero: "indu-west-beach",
    intro:
      "芝加哥东南约 1 小时，密歇根湖南岸约 24 公里长的一条湖岸带：一边是能游泳的细沙湖滩和几十米高的沙丘，背后是一圈圈不同年代的老沙丘上长出来的橡树林、黑橡树稀树草原、沼泽和泥炭藓沼。20 世纪初芝加哥大学的 Henry Cowles 就是在这里研究沙丘上的植物怎么一步步演替，开创了美国的生态学；这里也是美国生物多样性最高的国家公园之一。公园和钢厂、电厂、小镇交错在一起，2019 年才从国家湖滨升为国家公园；中间的印第安纳沙丘州立公园是州里的，另收门票。",
    bestMonths: [6, 7, 8, 9, 10],
    seasonNote:
      "6–8 月是湖滩季，周末 West Beach 等大停车场常满，湖水 7–8 月才暖；离岸流和大浪的日子很危险，看海滩的旗子。9–10 月人少、秋叶好，沙丘上走起来不晒。冬天湖边结冰、风大，沙丘可以越野滑雪；春天（4–5 月）是看候鸟的季节，Great Marsh 一带鸟最多。",
    areas: {
      west: "西区：West Beach · Miller Woods · Portage Lakefront",
      central: "中区：游客中心 · Cowles Bog · Chellberg 农场",
      "state-park": "印第安纳沙丘州立公园（州里的，另收费）",
      east: "东区：Beverly Shores · Great Marsh · Mount Baldy",
    },
    gateway: { nameZh: "印第安纳沙丘游客中心（Porter）", lat: 41.6338, lon: -87.05443 },
    timeZone: "America/Chicago",
    airports: ["ORD", "MDW"],
    nonresidentSurcharge: false,
    lodgingTip:
      "园内只有 Dunewood 营地（66 个营位，Recreation.gov 预订）。最方便的是住游客中心旁边的 Chesterton / Porter（连锁酒店、餐馆，到 West Beach、Mount Baldy 都在 20–25 分钟内）或东头的 Michigan City（湖边酒店、赌场酒店、大型奥特莱斯，离 Mount Baldy 最近）。Beverly Shores、Dune Acres 一带的湖边小镇有不少整套度假屋，夏天要提前几个月订。从芝加哥当天来回也很常见：开车约 1 小时，或者坐 South Shore Line 通勤火车到 Dune Park、Beverly Shores 站。",
  },
```

- `nonresidentSurcharge: false`：印第安纳沙丘收门票（$25/车），但不在 2026 年收非居民附加费的 11 座公园里（fees 页面只写了普通门票，没有附加费）。
- `nearby`：现有公园里没有顺路的。新公园里凯霍加谷约 5 小时、圣路易斯拱门约 4.5 小时，不写。
- `airports`：ORD（芝加哥奥黑尔，到游客中心约 1 小时 10 分）、MDW（芝加哥中途，约 50 分钟）。South Bend（SBN）约 45 分钟，航班少，没收。

## airports.ts

```ts
  ORD: { code: "ORD", nameZh: "芝加哥奥黑尔国际机场", city: "芝加哥", lat: 41.9786, lon: -87.9048 },
  MDW: { code: "MDW", nameZh: "芝加哥中途国际机场", city: "芝加哥", lat: 41.7868, lon: -87.7522 },
```

## lodging.ts

```ts
  {
    id: "indu-stay-chesterton",
    park: "indu",
    nameZh: "Chesterton / Porter",
    nameEn: "Chesterton & Porter, IN",
    inPark: false,
    lat: 41.61072,
    lon: -87.05227,
    note: "游客中心和州立公园旁边的小城，I-94 和 IN-49 交会处有几家连锁酒店，老城有餐馆、周六的欧式集市；到 West Beach、Mount Baldy 都在 20–25 分钟内，住这里两头都顺。",
    airbnb: "Chesterton, IN",
  },
  {
    id: "indu-stay-michigan-city",
    park: "indu",
    nameZh: "Michigan City",
    nameEn: "Michigan City, IN",
    inPark: false,
    lat: 41.70754,
    lon: -86.89503,
    note: "公园东头的湖港城市，有湖边酒店、赌场酒店和大型奥特莱斯，到 Mount Baldy 约 5 分钟；城里的 Washington Park 海滩和灯塔也值得看。",
  },
  {
    id: "indu-stay-beverly-shores",
    park: "indu",
    nameZh: "Beverly Shores 湖边度假屋",
    nameEn: "Beverly Shores, IN",
    inPark: false,
    lat: 41.6853,
    lon: -86.9957,
    note: "被公园包围的湖边小镇，几乎全是整套度假屋，走几步就到 Lake View、Kemil 海滩和 Great Marsh；没有酒店、只有一个加油站便利店，夏天周末很早订满，最少住几晚的要求常见。",
    rental: true,
    airbnb: "Beverly Shores, IN",
  },
```

（Beverly Shores 的坐标是镇中心 Broadway 和 Lake Front Drive 一带，按 Lake View Beach 的位置往南估的。）

`campgrounds.ts` 里还没有：Dunewood Campground（Recreation.gov 258887，41.67196617, -86.98378623）。

## lodging-seasons.ts

不用写。Dunewood 营地有季节（一般 4 月到 10 月），但营地不在 lodging.ts 里。

## bookings.ts

```ts
  {
    id: "indu-dunewood-campground",
    park: "indu",
    targets: [],
    places: ["Dunewood Campground"],
    kind: "campground",
    titleZh: "Dunewood 营地",
    window: { type: "rolling", months: 6, time: "10:00", tz: "America/New_York" },
    url: "https://www.recreation.gov/camping/campgrounds/258887",
    noteZh:
      "园内唯一的营地，66 个营位（54 个开车到、12 个走进去，4 个无障碍），有厕所和淋浴，没有水电接口；离 Lake View 海滩约 2.4 公里，旁边就是 South Shore Line 的 Beverly Shores 站。在 Recreation.gov 预订，最多连住 14 晚；提前多久开放官方页面没写，按一般规则 6 个月写。",
    source: "https://www.recreation.gov/camping/campgrounds/258887",
    verified: "2026-10-20",
  },
  {
    id: "indu-mount-baldy-summit",
    park: "indu",
    targets: ["indu-mount-baldy"],
    kind: "tour",
    titleZh: "Mount Baldy 登顶（护林员带队）",
    window: { type: "anytime" },
    url: "https://www.nps.gov/indu/planyourvisit/calendar.htm",
    noteZh: "Mount Baldy 的山顶平时关闭，只能跟护林员的带队徒步上去，夏天多在周末，其他季节也偶尔有。日程在公园的活动日历、Facebook 和游客中心公布，要不要预约页面没写，看具体那场的说明。不上山顶的话，海滩步道全年都能走。",
    source: "https://www.nps.gov/indu/planyourvisit/mb16.htm",
    verified: "2026-10-20",
  },
```

## activities.ts

```ts
  {
    park: "indu",
    nameZh: "春季候鸟迁徙",
    nameEn: "Spring bird migration",
    months: [4, 5],
    summary: "密歇根湖南岸是候鸟北上的必经之地，4–5 月几百种鸣禽、猛禽、水鸟在这里歇脚，Great Marsh、Cowles Bog、Chellberg 农场一带最好看；每年 5 月有 Indiana Dunes Birding Festival。",
    booking: "看鸟不用预约；观鸟节的活动多要报名，看 Indiana Dunes Birding Festival 的官网。",
    attraction: "indu-great-marsh",
  },
  {
    park: "indu",
    nameZh: "Mount Baldy 登顶徒步",
    nameEn: "Mount Baldy summit hike",
    months: [6, 7, 8],
    summary: "公园最出名的“会走路的沙丘”：Mount Baldy 每年往内陆移约 1.2 米，山顶平时关闭，只能跟护林员上去，边走边讲沙丘怎么被风推着走、为什么会把树埋掉。",
    booking: "夏天多在周末，日程看公园活动日历或游客中心。",
    url: "https://www.nps.gov/indu/planyourvisit/mb16.htm",
    attraction: "indu-mount-baldy",
  },
```

（观鸟节是 Indiana Audubon 等办的，这次没查 2027 年的日期。）

## tours.ts

不收：护林员活动没有固定班次。

## closures.ts

没有查到临时关闭：conditions 页面只有“活动可能因天气、交通取消”。NPS alerts 接口这次被限流，没拉到。

## parking.ts

不收：官方没写几点停满（West Beach 有 600 个车位，夏天周末会满，但页面没写时间）。

## time-notes.ts

```ts
  {
    park: "indu",
    noteZh:
      "印第安纳沙丘所在的西北印第安纳三个县（Lake、Porter、LaPorte）用中部时间，和芝加哥一样；印第安纳州大部分地方、往东进密歇根州都是东部时间。从这里往东开去密歇根（比如 Warren Dunes 州立公园），或者从印第安纳波利斯开过来，表要差 1 小时；手机在 Michigan City 一带有时会连上密歇根的基站。",
    sources: ["https://www.nps.gov/indu/planyourvisit/wb16.htm"],
    checked: "2026-10-20",
  },
```

（West Beach 页写步道口开放时间是“Central Time”。三个县用中部时间是常识，没另查州政府的页面；“手机连上密歇根基站”是推测，主对话可以删掉这半句。）

## 门票

- 进园要买门票：私家车 $25（7 天）、摩托车 $20、步行或骑车 $15/人，园区年卡 $45，国家公园年卡通用。在游客中心、West Beach 收费站（夏天）或 Recreation.gov 买；公园说不打算在每个停车场都设收费站，大部分停车场靠自觉买。
- 2026 年免费日：2 月 16 日、5 月 25 日、6 月 14 日、7 月 3–5 日、8 月 25 日、9 月 17 日、10 月 27 日、11 月 11 日。
- 州立公园（Indiana Dunes State Park）另收门票，国家公园门票和年卡在那边不能用，州立公园的年卡在国家公园也不能用（fees 页原话 “None of the passes and fees work between the two parks”）。

## 荣誉

不是世界遗产、不是国际暗夜公园。园里有 4 个国家自然地标（Cowles Bog、Pinhook Bog 等）和 Bailly Homestead 国家历史地标（Recreation.gov 营地介绍），honors.ts 没有这类。

## 其他

- 密歇根湖的离岸流很危险，每年都有人溺水；救生员 2024 年起因招不到人不一定有（West Beach 页），大浪、红旗的日子别下水。
- 海滩上禁止玻璃瓶和生火；Mount Baldy 下到海滩的步道是陡的松沙坡，“回去只能爬上来”。
- 蜱虫全年都有（Cowles Bog 页），步道边有毒漆藤。
- South Shore Line 通勤火车（芝加哥市中心到 South Bend）在 Dune Park、Beverly Shores 等站停，不开车也能来。

## 拿不准的

- 游客中心时间：NPS 2026–27 年园区报纸写夏天 8:00–18:00、其余 8:30–16:30；FAQ 页写夏天 8:30–18:00、其余 9:00–16:00。按园区报纸写。
- 门票是不是全园都要买：fees 页说游客中心、West Beach 收费站、网上都能买、“不打算在每个停车场建收费站”，West Beach 的收费站只在夏天开；每个步道页写“Passes are required”。按全园要买写。
- West Beach 的 3-Loop 步道：页面写总长 3.4 英里，三个环分别 0.9、1.2、2.2 英里加起来 4.3 英里，对不上；Dune Succession 一处写 0.9 英里、一处写“约 1 英里”。景点按 0.9 英里写。
- 救生员：West Beach 页（2025-05-12 更新）还在说 2024 年的情况，2026 年有没有救生员没查到。
- Pinhook Bog 的泥炭藓沼步道只能跟工作人员进、要提前批准（步道表），一年开放几次没查到，没收成景点。
- Century of Progress 老房子的开放参观（Indiana Landmarks 办的）2026 年的日期没查到。
- 3 Dune Challenge 的爬升（常说约 552 英尺）和三座沙丘的高度没在州政府页面上查到，景点只写州政府页面上的 1.5 英里、Rugged。
- NPS alerts 接口被限流，没拉到公告。
