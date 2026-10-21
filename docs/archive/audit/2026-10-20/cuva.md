# cuva 凯霍加谷 Cuyahoga Valley 调研记录（2026-10-20）

新公园。景点文件 `src/data/attractions/cuva.ts`（导出名 `cuyahogaValley`），同行适合度 `src/data/suitability/cuva.ts`。所有来源都是 2026-10-20 查的。

## 主要来源

- 现况和关闭（页面 2026-10-19 更新）：https://www.nps.gov/cuva/planyourvisit/conditions.htm
- 步道表：https://www.nps.gov/cuva/planyourvisit/hiking.htm
- Towpath Trail（约 20 英里、11 个步道口、Beaver Marsh 观景处的位置）：https://www.nps.gov/cuva/planyourvisit/ohio-and-erie-canal-towpath-trail.htm
- Brandywine 瀑布（60 英尺、木栈道、停车场 10:00–16:00 常满）：https://www.nps.gov/cuva/learn/historyculture/brandywine-falls.htm
- 停车场（Brandywine 90 个车位、天气好和周末 10 点前满；Boston Mill 游客中心周末满）：https://www.nps.gov/cuva/planyourvisit/parking.htm
- The Ledges（1.8 英里、不无障碍、观景点看日落）：https://www.nps.gov/cuva/the-ledges.htm
- Blue Hen 瀑布（从 Boston Mill 走 Buckeye Trail，来回 3 英里、580 英尺）：https://www.nps.gov/thingstodo/hike-to-blue-hen-falls.htm
- 火车：https://www.nps.gov/cuva/planyourvisit/train.htm ；Cuyahoga Valley Scenic Railroad：https://www.cvsr.org/excursions/fall-scenic/fall-scenic （Classic 约 3 小时 40 分、24 英里往返，Express 约 2 小时，$26–39）
- 无障碍（只有总的说明）：https://www.nps.gov/cuva/planyourvisit/accessibility.htm
- Boston Mill 游客中心时间（9:30–17:00，夏天可能延长、冬天可能缩短；感恩节、圣诞、元旦关）：NPS 搜索结果里的 https://www.nps.gov/cuva/boston-mill-visitor-center.htm 摘要（页面本身没打开）
- 坐标：瀑布、观景点、桥、游客中心、车站按 OSM（Nominatim、Overpass，2026-10-20 查）

## parks.ts 条目

```ts
  {
    code: "cuva",
    nameZh: "凯霍加谷",
    nameEn: "Cuyahoga Valley",
    region: "greatlakes", // 新片区，见 maca.md
    tagline: "克利夫兰和阿克伦之间的运河、瀑布和砂岩崖",
    stateEn: "Ohio",
    hero: "cuva-brandywine-falls",
    intro:
      "夹在克利夫兰和阿克伦两座城市之间、沿凯霍加河约 35 公里长的一条河谷，是美国离大城市最近的国家公园之一。19 世纪这里是俄亥俄–伊利运河（Ohio & Erie Canal）的主干，当年拉船的纤道现在是约 32 公里平坦的 Towpath 步道，可以骑车、走路，再坐观光火车回来；河谷两侧的小溪切出 Brandywine 等几十条瀑布，Virginia Kendall 一带还有长满青苔的砂岩崖壁 The Ledges。凯霍加河 1969 年因为污染严重着过火，后来成了美国治理环境的标志，如今河谷里有河狸、苍鹭和白头海雕。",
    bestMonths: [5, 6, 9, 10],
    seasonNote:
      "10 月中旬红叶最好，也是一年里最挤的时候，天气好的周末 Brandywine 瀑布停车场 10 点前就满。春天（4–5 月）瀑布水量大、林下野花多；夏天可以骑车走 Towpath、坐火车，6–8 月有“Explorer”火车接骑车的人。冬天公园照开，Kendall Hills 一带能滑雪橇、越野滑雪，瀑布偶尔结冰。",
    areas: {
      boston: "Boston · Peninsula（游客中心 · 火车站）",
      brandywine: "Brandywine 瀑布一带",
      "virginia-kendall": "Virginia Kendall（The Ledges · Kendall Lake）",
      south: "南段：Everett · Beaver Marsh（Ira）",
      north: "北段：Canal Exploration Center · Rockside",
    },
    gateway: { nameZh: "Boston Mill 游客中心", lat: 41.2626, lon: -81.56031 },
    timeZone: "America/New_York",
    airports: ["CLE", "CAK"],
    nonresidentSurcharge: false,
    lodgingTip:
      "园内住处很少：Brandywine 瀑布旁边的 Inn at Brandywine Falls 是一家老房子民宿，Boston 一带的 Stanford House 是公园的老农舍、整栋出租给团体。大多数人住园外：北头 I-77 和 Rockside Road 一带的 Independence 连锁酒店最多，离火车 Rockside 站近；东边的 Hudson 小镇安静、有餐馆；南头住阿克伦（Akron）或 Cuyahoga Falls，离 Beaver Marsh、Everett 一带近。从克利夫兰市区开过来约 30 分钟，当天来回也很常见。",
  },
```

- `nonresidentSurcharge: false`：公园不收门票（NPS 门票接口会查到），不在 2026 年收非居民附加费的 11 座公园里。
- `nearby`：现有公园里没有顺路的（新河峡谷约 4 小时）。新公园里，印第安纳沙丘约 5 小时，不算顺路，不写。
- `airports`：CLE（克利夫兰，到 Boston Mill 约 35 分钟）、CAK（阿克伦–坎顿，约 35 分钟）。

## airports.ts

```ts
  CLE: { code: "CLE", nameZh: "克利夫兰霍普金斯国际机场", city: "克利夫兰", lat: 41.4117, lon: -81.8498 },
  CAK: { code: "CAK", nameZh: "阿克伦–坎顿机场", city: "阿克伦 / 坎顿", lat: 40.9161, lon: -81.4422 },
```

## lodging.ts

```ts
  {
    id: "cuva-stay-inn-brandywine",
    park: "cuva",
    nameZh: "Inn at Brandywine Falls（园内民宿）",
    nameEn: "The Inn at Brandywine Falls",
    inPark: true,
    lat: 41.27807,
    lon: -81.53863,
    note: "Brandywine 瀑布旁边 1840 年代的 James Wallace 老宅改的民宿（B&B），在公园地界里，走路就到瀑布；房间很少，周末、红叶季要早订。",
  },
  {
    id: "cuva-stay-independence",
    park: "cuva",
    nameZh: "Independence（北头 I-77 · Rockside Road）",
    nameEn: "Independence, OH",
    inPark: false,
    lat: 41.38166,
    lon: -81.64069,
    note: "公园北头、I-77 和 Rockside Road 交会处的一片连锁酒店和餐馆，离火车 Rockside 站、Canal Exploration Center 几分钟，到 Boston Mill 游客中心约 20 分钟；价格稳定，去克利夫兰机场约 20 分钟。",
  },
  {
    id: "cuva-stay-hudson",
    park: "cuva",
    nameZh: "Hudson 小镇",
    nameEn: "Hudson, OH",
    inPark: false,
    lat: 41.24006,
    lon: -81.44067,
    note: "公园东边约 15 分钟的新英格兰风格老镇，镇中心有餐馆、咖啡馆，周边有几家酒店和民宿；到 The Ledges、Brandywine 瀑布都近。",
    airbnb: "Hudson, OH",
  },
  {
    id: "cuva-stay-akron",
    park: "cuva",
    nameZh: "阿克伦（Akron）/ Cuyahoga Falls",
    nameEn: "Akron & Cuyahoga Falls, OH",
    inPark: false,
    lat: 41.13627,
    lon: -81.48281,
    note: "公园南头的城市，酒店、餐馆、超市多，整套民宿也多；到 Beaver Marsh、Everett 廊桥、火车阿克伦 Northside 站都在 20 分钟内。",
    rental: true,
    airbnb: "Cuyahoga Falls, OH",
  },
```

## lodging-seasons.ts

不用写：都全年营业。

## bookings.ts

```ts
  {
    id: "cuva-scenic-railroad",
    park: "cuva",
    targets: ["cuva-scenic-railroad"],
    kind: "tour",
    titleZh: "凯霍加谷观光火车（CVSR）",
    window: { type: "anytime" },
    url: "https://www.cvsr.org/book-tickets/calendar",
    noteZh:
      "火车是非营利的 Cuyahoga Valley Scenic Railroad 经营的，在官网按日期订票（$26–39，看座位等级）。10 月的红叶季（Fall Scenic）周末常卖光，早点订；平时有余票也能在车站买。主要的上车站是北头的 Rockside（Independence）和南头的阿克伦 Northside，往返约 3 小时 40 分；也可以从中间的 Peninsula 站坐约 2 小时的短线。6–8 月的 Explorer 是给骑 Towpath 的人坐的单程接驳车，在行李车厢现场买票、最好带零钱。",
    source: "https://www.cvsr.org/excursions/fall-scenic/fall-scenic",
    verified: "2026-10-20",
  },
```

公园本身不用预约。园内没有营地（Recreation.gov 上没有 cuva 的营地）。

## activities.ts

```ts
  {
    park: "cuva",
    nameZh: "河谷红叶",
    nameEn: "Fall color in the valley",
    months: [10],
    summary: "10 月中旬前后河谷两侧的枫树、橡树一起变色，坐火车、骑 Towpath、在 Ledges 观景点看都好；也是一年里最挤的时候，CVSR 这个月开 Fall Scenic 红叶专列。",
    booking: "火车票在 cvsr.org 订；天气好的周末 Brandywine 瀑布停车场 10 点前满，早去或改平日。",
    url: "https://www.cvsr.org/excursions/fall-scenic/fall-scenic",
    attraction: "cuva-scenic-railroad",
  },
  {
    park: "cuva",
    nameZh: "骑 Towpath、坐火车回来（Explorer）",
    nameEn: "Bike the Towpath, ride the train back (Explorer)",
    months: [6, 7, 8, 9],
    summary: "沿运河纤道骑车顺着河谷走，骑累了在沿线车站举手招呼火车，带着自行车坐回出发的地方。2026 年 Explorer 接驳从 6 月 1 日开到 9 月 7 日。",
    booking: "不用预约，在行李车厢现场买单程票（最好带零钱），自行车不超过 40 磅、拆下拖车和包。2027 年的日期等 CVSR 公布。",
    url: "https://www.nps.gov/cuva/planyourvisit/ohio-and-erie-canal-towpath-trail.htm",
    attraction: "cuva-towpath-bike",
  },
```

## tours.ts

不收：火车的班次按日期变（2026-10-21 Fall Scenic 是 9:00、9:55、11:00、11:55 四班），官网的完整时刻表这次没打开，没法写成整年的班次。

## closures.ts

```ts
  {
    attractions: ["cuva-towpath-bike"],
    from: "2026-08-24",
    reopen: "2026-11-21",
    reasonZh:
      "Towpath 的 Boston 步道口到 Peninsula（Lock 29 步道口）一段整修、Stumpy Basin 木栈道整个重建，暂定 8 月 24 日到 11 月 20 日关闭（2027 年 3 月 29 日到 4 月 21 日还要再关一次）。可以骑北段（Boston 以北）或南段（Peninsula 以南到 Beaver Marsh），中间这段改坐火车。",
    source: "https://www.nps.gov/cuva/planyourvisit/conditions.htm",
    checked: "2026-10-20",
  },
  {
    attractions: ["cuva-towpath-bike"],
    from: "2027-03-29",
    reopen: "2027-04-22",
    reasonZh: "Towpath 的 Boston 到 Peninsula 一段第二期整修，暂定 2027 年 3 月 29 日到 4 月 21 日关闭；可以骑北段或南段。",
    source: "https://www.nps.gov/cuva/planyourvisit/conditions.htm",
    checked: "2026-10-20",
  },
```

另外几条只写在景点 tips 里：

- Stanford Road / Valley Trail 一段 2026 年 10 月起拆旧路面关闭（Stanford 步道口停车场北半部也关），Stanford Trail 到 Brandywine 瀑布照常开。
- Oak Hill Road（Cuyahoga Falls 界到 Everett Road 连接线）因 Furnace Run 边坡坍塌封路，绕行 Everett Road、Riverview Road、Ira Road。
- Ledges 的 Ice Box Cave 为防蝙蝠白鼻综合征关闭；Ledges 禁止攀岩。
- Dickerson Run Trail 关闭（没收这条）。
- Boston Store 的停车场只给行动不便的人。

## parking.ts

```ts
  ...lot(["cuva-brandywine-falls"], {
    lot: "Brandywine 瀑布停车场",
    fullBy: "10:00",
    freeAfter: "16:00",
    months: [6, 7, 8],
    noteZh: "只有约 90 个车位、没有备用停车场：满了就早上 10 点前或下午 4 点后再来，或者停 Boston 一带的 Stanford 步道口，走 Stanford Trail 过来（约 2.4 公里单程，山路）。春秋天气好的周末也一样早满。",
    source: "https://www.nps.gov/cuva/learn/historyculture/brandywine-falls.htm",
  }),
```

（parking 页写“天气好和周末一般 10 点前满”，Brandywine 页写“天气好的时候和整个夏天 10:00–16:00 一般是满的”。按夏天每天写；春秋周末那一半只能写在 noteZh 里，因为 ParkingRule 一条只能有一组 months。）

## time-notes.ts

没有时区的坑（美东时间）。

## 门票

进园免费。火车另买票（$26–39）。Hale Farm & Village（园里的 19 世纪农庄，西部保留地历史学会经营）另收门票，没收这个景点。

## 荣誉

不是世界遗产、不是国际暗夜公园（城市边上）。

## 其他

- 公园不拥有园里的大部分公路（NPS 说的），封路要打 Boston Mill 游客中心 440-717-3890 问。
- 公园分散在很多小路之间，没有大门和统一的入口，导航直接输景点的停车场。

## 拿不准的

- Boston Mill 游客中心的开放时间（9:30–17:00）只在搜索结果摘要里看到，2026 年的季节时间没确认；NPS 游客中心接口被限流。
- Canal Exploration Center 夏天每天 10:00–16:00 的说法来自一个旧的西语页面，2026 年的季节时间没查到，没收成景点。
- Blue Hen 瀑布原来在 Boston Mills Road 上有个小停车场，现在 NPS 写从 Boston Mill 游客中心走 Buckeye Trail 过去（来回约 4.8 公里），那个小停车场还能不能停没确认，景点按从游客中心走写。
- CVSR 2026 年 11 月以后（北极快车之类的圣诞专列）、2027 年的普通班次没查到。
- 木栈道式的 Beaver Marsh 观景处官方叫 Viewing Area，离 Ira 步道口 0.3 英里，景点按这个写。
- Brandywine Gorge Loop 的长度：步道表写 1.4 英里，Brandywine 瀑布页写 1.5 英里。按 1.4 写。
- 园内无障碍的细节（Brandywine 木栈道哪一段无台阶、Beaver Marsh 观景处）无障碍页面没写具体的，按瀑布页“有一条没有台阶的木栈道”和 Towpath 页“轮椅、自行车、婴儿车都能走”写。
