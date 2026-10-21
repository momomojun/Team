# 航海家 Voyageurs（voya）调研记录 · 2026-10-20

按 [11-nine-parks.md](../../agent-briefs/11-nine-parks.md) 整理。页面都是 2026-10-20 打开的。NPS 的步道清单是网页里动态加载的，用 NPS 网站自己的搜索接口（`nps.gov/solr/`，不用 key）读出了全部 26 条 Things To Do；2026 年游船的班次是按 Recreation.gov 公开的每天余票接口（`/api/ticket/availability/facility/233405?date=…`，不登录）逐日查出来的。

新文件：`src/data/attractions/voya.ts`（12 个景点）、`src/data/suitability/voya.ts`。

## 自驾能不能玩

**能开到边上，但公园的大半在水上。** 航海家约 40% 是水面，主体 Kabetogama 半岛不通公路。开车能到的只有四个游客中心（Rainy Lake、Kabetogama Lake、Ash River、Crane Lake）和附近几条短步道（Oberholtzer、Echo Bay、Kabetogama 湖观景点、Blind Ash Bay、Rainy Lake 休闲步道）。其余的（Kettle Falls 酒店、Ellsworth 石头花园、Little American 岛金矿、半岛上的步道和营地）都要坐船：

- 最省事的是公园自己的护林员游船（6 月中到 9 月底，从 Rainy Lake、Kabetogama、Ash River 三个游客中心开，Recreation.gov 每年 4 月 15 日 9:00 开订），行程里按“开到游客中心 + 坐船来回”算成景点；
- 自己租船（游客中心附近的度假村、码头出租摩托艇、独木舟、皮划艇）或找水上出租车、导游；
- 租船屋（houseboat）住在湖上几天，是这里最有特色的玩法，要提前订。

冬天（大约 1–3 月，看冰情）是另一种自驾：湖面冻实以后，公园在 Rainy Lake 和 Kabetogama–Ash River 之间铲出两条**冰上公路**，7,000 磅（约 3.2 吨）以下的小车、皮卡可以直接开到湖上，限速 30 英里/时。

三个片区（Rainy Lake / Kabetogama / Ash River）之间开车：International Falls 到 Kabetogama 约 40 分钟，Kabetogama 到 Ash River 约 30 分钟，Ash River 到 Crane Lake 约 1 小时；都在 US-53 往东岔进去的小路尽头，彼此不直接相通。

## parks.ts 的条目

```ts
  {
    code: "voya",
    nameZh: "航海家",
    nameEn: "Voyageurs",
    region: "greatlakes",
    tagline: "明尼苏达北部的湖、岛和北极光",
    stateEn: "Minnesota",
    hero: "voya-kettle-falls",
    intro:
      "明尼苏达北部和加拿大安大略交界处的一片湖区：Rainy、Kabetogama、Namakan、Sand Point 四个大湖和 500 多个岛，水面约占公园四成，中间的 Kabetogama 半岛不通公路。名字来自 18 世纪划着桦皮大独木舟在这条水路上运皮毛的法裔加拿大船夫（voyageurs）。岸边是 20 多亿年前的古老岩石和北方针叶林，湖里有白头海雕、潜鸟，林子里有狼和黑熊。夏天坐护林员游船去湖中间 1913 年建成的 Kettle Falls 酒店，或者租船屋在湖上住几天；冬天湖面冻实，可以开车上冰上公路。2020 年被评为国际暗夜公园，常能看到北极光。",
    bestMonths: [6, 7, 8, 9],
    seasonNote:
      "6 月中到 9 月底护林员游船、游客中心全开，7–8 月最暖、游船最多，但 6 月到 7 月蚊子、鹿虻多；9 月人少、开始变色，月底游船就停了。5 月初湖上可能还有冰，10 月以后只剩 Rainy Lake 游客中心短时间开放。冬天（大约 1–3 月）可以开冰上公路、雪地摩托、越野滑雪，夜里最冷到零下 30 多摄氏度。北极光一年四季都可能有，秋冬夜长最容易看到。",
    areas: {
      rainy: "Rainy Lake（International Falls 一侧）",
      kabetogama: "Kabetogama Lake",
      "ash-river": "Ash River · Namakan Lake",
      "kettle-falls": "Kettle Falls（坐船）",
    },
    gateway: { nameZh: "Kabetogama Lake 游客中心", lat: 48.44487, lon: -93.03009 },
    timeZone: "America/Chicago",
    airports: ["INL", "DLH", "MSP"],
    nearby: ["isro"],
    nonresidentSurcharge: false,
    lodgingTip:
      "园内只有坐船才到得了的 Kettle Falls 酒店（1910–1913 年建的老客房，另有带厨房的度假屋，住客可以订酒店的船从 Ash River 游客中心接送）和许多只能划船、开船去的营地。多数人住园外：西边的 International Falls（连锁酒店最多，到 Rainy Lake 游客中心约 20 分钟），或者 Kabetogama、Ash River 湖边的家庭度假村（小木屋，大多带船出租，5 月到 10 月营业）；南边的 Crane Lake 也有几家。想住湖上的可以在 Rainy Lake、Ash River、Crane Lake 的公司租船屋，夏天周末很早订满。三个片区之间开车要 30–60 分钟，按要坐的游船选住处。",
  },
```

### 片区（region）

和皇家岛一样，提议新片区 **`greatlakes`：五大湖 · Great Lakes**。航海家严格说不在五大湖边，但 Rainy Lake 一带属于苏必利尔湖以西的同一片北方湖区，和皇家岛常一起玩（Grand Portage 到 International Falls 约 4.5 小时）。不想叫“五大湖”的话，可以叫 **`northwoods`：北方湖区 · Northwoods**。首页美国东部图的范围已经包括明尼苏达北部（`build-map.mjs` 里 `east.bounds.west = -95.8`，注释写了留给航海家），把新片区加进 `EAST_REGIONS` 就能画上去。

## airports.ts

```ts
  INL: { code: "INL", nameZh: "瀑布国际机场", city: "国际瀑布城（International Falls）", lat: 48.56754, lon: -93.40396 },
  MSP: { code: "MSP", nameZh: "明尼阿波利斯-圣保罗国际机场", city: "明尼阿波利斯", lat: 44.87802, lon: -93.22093 },
```

DLH 见 [isro.md](isro.md)。坐标按 Nominatim 的机场条目。INL 只有经明尼阿波利斯的支线；DLH 到 Kabetogama 约 2.5 小时；MSP 约 4.5–5 小时，但航班最多、租车最便宜。

## lodging.ts

```ts
  {
    id: "voya-stay-kettle-falls-hotel",
    park: "voya",
    nameZh: "Kettle Falls 酒店",
    nameEn: "Kettle Falls Hotel",
    inPark: true,
    lat: 48.50294,
    lon: -92.63991,
    note: "园内唯一的旅馆，1910–1913 年建的老酒店，在 Rainy Lake 和 Namakan Lake 之间的水坝边，没有路，只能坐船或水上飞机来；酒店房间双人 $110/晚（官网价目表，没写年份），带厨房的度假屋 $210 起、至少住 3 晚。住客可以订酒店的船从 Ash River 游客中心接送（每人 $50）。",
  },
  {
    id: "voya-stay-international-falls",
    park: "voya",
    nameZh: "International Falls",
    nameEn: "International Falls, MN",
    inPark: false,
    lat: 48.60103,
    lon: -93.41059,
    note: "和加拿大 Fort Frances 隔河相望的边境小城，连锁酒店、超市、加油站最多，全年营业；到 Rainy Lake 游客中心约 20 分钟，到 Kabetogama 约 40 分钟。",
    airbnb: "International Falls, MN",
  },
  {
    id: "voya-stay-kabetogama",
    park: "voya",
    nameZh: "Kabetogama 湖边度假村",
    nameEn: "Kabetogama Lake Resorts",
    inPark: false,
    lat: 48.43769,
    lon: -93.02737,
    rental: true,
    note: "Kabetogama 湖南岸一串家庭经营的度假村，小木屋带厨房，多数出租船、独木舟，大约 5 月钓鱼季开到 10 月；离 Kabetogama 游客中心几分钟，去 Ash River 约 30 分钟。",
    airbnb: "Kabetogama, MN",
  },
  {
    id: "voya-stay-ash-river",
    park: "voya",
    nameZh: "Ash River 度假村和船屋",
    nameEn: "Ash River Resorts & Houseboats",
    inPark: false,
    lat: 48.4357,
    lon: -92.85,
    rental: true,
    note: "Ash River Trail 公路尽头的几家度假村和船屋出租公司，离 Ash River 游客中心（Kettle Falls 游船出发处）最近；比 Kabetogama 更安静，补给少，进来前在 Orr 或 International Falls 买齐。",
    airbnb: "Ash River, MN",
  },
  {
    id: "voya-stay-crane-lake",
    park: "voya",
    nameZh: "Crane Lake",
    nameEn: "Crane Lake, MN",
    inPark: false,
    lat: 48.26669,
    lon: -92.48943,
    note: "公园南头的小村子，几家度假村和船屋公司，去 Sand Point Lake、Namakan Lake 南部最近；离其他三个游客中心都要 1 小时以上，护林员游船不从这里开。",
  },
```

Ash River 的坐标是游客中心一带（Ash River 在 Nominatim 上只有河的条目）。

## lodging-seasons.ts

```ts
  // 酒店官网只写“夏天只能坐船、水上飞机来，冬天可以开雪地摩托来”，没写营业日期；Recreation.gov 的 Kettle Falls 游船说明写“2026 年 10 月的团，酒店厨房已经停了，要自带午饭”。
  // 一般说法是 5 月中钓鱼季开到 9 月底、10 月初，按 05-15 到 09-30 估
  "voya-stay-kettle-falls-hotel": { open: [{ from: "05-15", to: "09-30" }], year: 2026, source: "https://www.kettlefallshotel.com/faq", checked: "2026-10-20" },
```

Kabetogama、Ash River、Crane Lake 的度假村大多只在 5–10 月营业（钓鱼季），但各家不同，按地区写、不收营业季。

## bookings.ts

```ts
  {
    id: "voya-boat-tours",
    park: "voya",
    targets: ["voya-grand-tour", "voya-kettle-falls", "voya-ellsworth-rock-gardens", "voya-life-on-the-lake"],
    kind: "tour",
    titleZh: "护林员游船（Recreation.gov）",
    applies: [{ from: "06-07", to: "10-04" }],
    window: { type: "fixed-date", opens: "2026-04-15", time: "09:00", tz: "America/Chicago", forYear: 2026 },
    url: "https://www.recreation.gov/ticket/facility/233405",
    noteZh:
      "每年 4 月 15 日 9:00（中部时间）放出当年夏天的全部场次，常常订满；还有空位时游客中心卖现场票，开船前 30 分钟停售，只收信用卡。成人 17 岁以上，儿童 3–16 岁；老人卡、残障卡半价。开船前一天午夜前取消可退（扣 $3）。每班至少 6 人才开（Rainy Lake 的 Kettle Falls 要 21 人）。2026 年票价没查到，以 Recreation.gov 为准。",
    source: "https://www.nps.gov/voya/planyourvisit/guided-tours.htm",
    verified: "2026-10-20",
  },
  {
    id: "voya-north-canoe",
    park: "voya",
    targets: ["voya-north-canoe-voyage"],
    kind: "tour",
    titleZh: "North Canoe Voyage 大独木舟体验",
    applies: [{ from: "06-15", to: "09-30" }],
    window: { type: "fixed-date", opens: "2026-04-15", time: "09:00", tz: "America/Chicago", forYear: 2026 },
    url: "https://www.nps.gov/voya/planyourvisit/guided-tours.htm",
    noteZh: "在 Recreation.gov 的“VNP Special Interpretive Programs”页面订，和游船同一天开放；8 岁以上，成人 17 岁以上、儿童 8–16 岁。",
    source: "https://www.nps.gov/voya/planyourvisit/guided-tours.htm",
    verified: "2026-10-20",
  },
  {
    id: "voya-campsites",
    park: "voya",
    targets: [],
    places: ["园内划船、开船才能到的营地"],
    kind: "campground",
    titleZh: "园内营地（只能坐船到）",
    window: { type: "block", day: 15, visitDay: 1, monthsAhead: 6, time: "09:00", tz: "America/Chicago" },
    url: "https://www.recreation.gov/camping/campgrounds/249981",
    noteZh:
      "所有帐篷营地都要在 Recreation.gov 预约并付每晚的费用。旺季（明尼苏达钓鱼开幕日前的周五到 10 月 15 日）的营位前一年 11 月 15 日 9:00 一次放出；淡季（10 月 16 日到钓鱼开幕日前的周四）每晚 $10，当年 4 月 15 日放。4 月 1 日到钓鱼开幕日前一天营地不能预约（冰化、没法过去）。这条的 window 只是占位：实际是“旺季整季在前一年 11 月 15 日放”，合并时建议改成 fixed-date 或在 noteZh 里说明。",
    source: "https://www.nps.gov/voya/planyourvisit/permitsandreservations.htm",
    verified: "2026-10-20",
  },
  {
    id: "voya-houseboat",
    park: "voya",
    targets: [],
    places: ["船屋过夜许可"],
    kind: "permit",
    titleZh: "船屋过夜许可",
    applies: [{ from: "05-01", to: "10-31" }],
    window: { type: "anytime" },
    url: "https://www.recreation.gov/permits/251977",
    noteZh: "船屋、帆船、带卧铺的游艇在园内过夜，5 月 1 日到 10 月 31 日要 Recreation.gov 的许可（每晚 $15）；船屋本身向 Rainy Lake、Ash River、Crane Lake 的出租公司订，夏天提前几个月。",
    source: "https://www.nps.gov/voya/planyourvisit/permitsandreservations.htm",
    verified: "2026-10-20",
  },
  {
    id: "voya-kettle-falls-hotel",
    park: "voya",
    targets: ["voya-stay-kettle-falls-hotel"],
    kind: "lodging",
    titleZh: "Kettle Falls 酒店",
    window: { type: "anytime" },
    url: "https://www.kettlefallshotel.com/",
    noteZh: "直接向酒店订（电话、邮件）；度假屋至少住 3 晚，订金 30%，取消只有在那几晚被别人订掉时才退（扣 15%）。不住店的散客酒店不接送，要坐护林员游船或自己开船来。",
    source: "https://www.kettlefallshotel.com/",
    verified: "2026-10-20",
  },
```

营地的开放规则（旺季整季在前一年 11 月 15 日一次放出）现有的 `BookingWindow` 类型表达不了（`block` 是每个月放一段）。最接近的是每年写一条 `fixed-date`（`opens: "2026-11-15"`, `forYear: 2027`）。

## tours.ts

按 Recreation.gov 2026 年每天的场次（6 月 1 日到 10 月 18 日逐日查，8 月 11 日、10 月 5 日两天没查到）整理；“几乎每周都有”的写成 `days`，偶尔加开的没写。

```ts
  {
    id: "voya-grand-tour",
    scheduleYear: 2026,
    periods: [{ from: "06-14", to: "09-27", departures: ["10:00", "16:30"], days: ["Fri", "Sat", "Sun", "Mon"] }],
    checkInMin: 30,
    daysZh: "周五到周一开，10:00 一班、16:30 一班（周日、周一还有 13:30；7–8 月个别周三加开）",
    meetZh: "Rainy Lake 游客中心（1797 Town Road 342，International Falls）",
    noteZh: "约 2.5 小时，最多 49 人、至少 6 人才开；船上有厕所。开船前 30 分钟到游客中心报到。",
    sources: ["https://www.recreation.gov/ticket/facility/233405"],
  },
  {
    id: "voya-kettle-falls",
    scheduleYear: 2026,
    periods: [{ from: "06-09", to: "10-04", departures: ["10:00"], days: ["Thu", "Fri", "Sun"] }],
    checkInMin: 30,
    daysZh: "Ash River 出发的每周四、周五、周日 10:00（6 月底到 7 月中的几个周一另有 14:00）；Rainy Lake 出发的 6.5 小时版只有 6 月中到 9 月中的 8 个周三 9:30",
    meetZh: "Ash River 游客中心（9899 Meadwood Rd）",
    noteZh: "约 5.5 小时：坐船 2 小时到酒店，岸上 2 小时，回程 1.5 小时；船上没有厕所，酒店有。午饭自带或在酒店买盒饭，2026 年 10 月的团酒店厨房已停，要自带。",
    sources: ["https://www.recreation.gov/ticket/facility/233405", "https://www.nps.gov/voya/planyourvisit/guided-tours.htm"],
  },
  {
    id: "voya-ellsworth-rock-gardens",
    scheduleYear: 2026,
    periods: [{ from: "06-07", to: "09-26", departures: ["13:00", "16:00"], days: ["Tue", "Sat"] }],
    checkInMin: 30,
    daysZh: "每周二、周六 13:00 和 16:00",
    meetZh: "Kabetogama Lake 游客中心（9940 Cedar Lane）",
    noteZh: "约 2.5 小时，最多 29 人、至少 6 人；船上没有厕所，花园有旱厕。",
    sources: ["https://www.recreation.gov/ticket/facility/233405"],
  },
  {
    id: "voya-life-on-the-lake",
    scheduleYear: 2026,
    periods: [{ from: "06-14", to: "09-26", departures: ["13:30"], days: ["Fri", "Sat"] }],
    checkInMin: 30,
    daysZh: "Rainy Lake 出发的每周五、周六 13:30（Ash River 出发的另一条线周二、周六 9:30，周四、周五、周日 16:30）",
    meetZh: "Rainy Lake 游客中心",
    noteZh: "约 2.5 小时：上 Little American 岛看 1890 年代淘金时的矿井，再去 Harry Oveson 渔营；岛上有一小段步道。",
    sources: ["https://www.recreation.gov/ticket/facility/233405"],
  },
```

North Canoe Voyage 的场次在另一个 Recreation.gov 页面（Special Interpretive Programs），没有查，不写 tours.ts。

## activities.ts

```ts
  {
    park: "voya",
    nameZh: "北极光和星空",
    nameEn: "Northern Lights & Dark Skies",
    summary:
      "2020 年起是国际暗夜公园。公园指定了两处看星空的地方：Ash River 游客中心路上的 Meadwood Road 日间休息区、Rainy Lake 游客中心的上层停车场；湖边、营地的码头视野也很开阔。夏天看银河最好；北极光全年都可能出现，秋冬夜长最常见。",
    booking: "不用预约；看 NOAA 的极光预报（Kp 指数），选没有月亮的晴夜。夏夜也凉，带外套和驱蚊水。",
    url: "https://www.nps.gov/voya/planyourvisit/stargazing.htm",
    attraction: "voya-night-sky",
  },
  {
    park: "voya",
    nameZh: "冰上公路",
    nameEn: "Ice Roads",
    months: [1, 2, 3],
    summary: "湖面冻实以后，公园在 Rainy Lake（从游客中心的下水坡道出发）和 Kabetogama–Ash River 之间铲出冰上公路，小车可以直接开到湖上，路边能看到冰钓小屋；Sphunge 岛有铲好的雪橇坡和冰场。",
    booking: "免费、不用预约；只允许 7,000 磅以下的车，限速 30 英里/时，雪地摩托不能走冰路。每年哪天开、走哪条线看冰情，出发前看公园每周发的冰况报告。",
    url: "https://www.nps.gov/voya/planyourvisit/winter-activities.htm",
    attraction: "voya-ice-road",
  },
  {
    park: "voya",
    nameZh: "冬季雪鞋、越野滑雪出租",
    nameEn: "Winter Equipment Rental",
    months: [1, 2, 3],
    summary: "1–3 月 Rainy Lake 游客中心出租木框雪鞋和越野滑雪板，可以直接去 Oberholtzer 步道、Tilson 连接步道。",
    booking: "周五到周一 10:00–16:00，成人 $10/副、16 岁及以下 $5；每年 1 月 1 日开放网上预约。",
    url: "https://www.nps.gov/voya/planyourvisit/winter-activities.htm",
  },
  {
    park: "voya",
    nameZh: "星空晚会",
    nameEn: "Voyageurs Star Parties",
    summary: "公园每年办星空晚会，护林员和天文志愿者带望远镜讲解；日期每年公布在公园的活动日历上。",
    booking: "看公园活动日历；2026 年的日期没查。",
    url: "https://www.nps.gov/voya/planyourvisit/stargazing.htm",
    attraction: "voya-night-sky",
  },
```

## closures.ts

2026-10-20 的 NPS Alerts & Conditions：

- Dryweed 岛一带 17 个营地、船屋营位和日间休息点因黑熊活动关到 2026 年 10 月底（Permits 页面还写“到 9 月底”，两处日期不一致）。都是营地，不是我们收录的景点，不进 `closures.ts`。
- 10 月 5 日起公园开始收湖上的危险标志浮标，美国海岸警卫队同时收主航道的航标：10 月下旬自己开船要格外小心。
- 8 月 24 日起取消了全园篝火禁令。
- Kab-Ash 步道的 Salmi Road 入口关闭（Kabetogama 一侧），Locator Lake 的 Cranberry Creek 搬运道永久关闭。这两处都没收成景点。

没有要进 `closures.ts` 的条目。

## parking.ts

不收，官方没有写哪个停车场几点停满。

## time-notes.ts

不用写。全园都是中部时间，和明尼苏达一样。Recreation.gov 上的游船时间也是中部时间。从皇家岛过来的注意密歇根是东部时间（见 [isro.md](isro.md)）。

## 门票

- 不收门票（`fees.htm`：Free，“An entrance pass is not required”）。
- 要另付的：游船（Recreation.gov，老人卡、残障卡半价）、营地（预约费 + 每晚费用，淡季每晚 $10）、船屋许可（每晚 $15）、冬季装备出租。

## 荣誉

- 国际暗夜公园，2020 年（`honors.ts` 已经有 `voya`，不用加）。
- 不是世界遗产。

## 其他

- 公园里不能带宠物上步道（防止把病传给狼），游船上也不能带宠物。
- 加拿大就在湖对面，自己开船越过湖中间的国界要按加拿大边境局的规定报关；护林员游船不出境。
- 游客中心：Rainy Lake 2026 年 5 月 23 日到 9 月每天 9:00–17:00，10 月 1–31 日 10:00–16:00，之后关；Kabetogama、Ash River、Crane Lake 9 月 27 日最后一天，2027 年 5 月 29 日（阵亡将士纪念日周末）再开。冬天 Rainy Lake 游客中心以前周末开、出租装备，2026–27 冬天的时间还没公布（hours 页面写“Closed: Unless otherwise noted”）。

## 拿不准的

- 2026 年游船票价：Recreation.gov 的接口没给价格，NPS 页面只写“看 Recreation.gov”。网上旧资料是 Grand Tour 成人 $30、儿童 $15（2019 年），Kettle Falls 成人 $60、儿童 $30（年份不明），没写进文件。
- Kettle Falls 酒店的营业季官网没写，按 5 月中到 9 月底估。
- 冰上公路每年哪天开、开到哪天，官方只说看冰情，按 1–3 月写。
- 营地的“旺季整季前一年 11 月 15 日放”现有的 `BookingWindow` 写不出来（见上）。
- Dryweed 岛营地关到 9 月底还是 10 月底：Alerts 页（10 月 1 日更新）写 10 月底，Permits 页写 9 月底。
- Kabetogama 湖观景点的步道口坐标：NPS 只写“去 Ash River 游客中心路上 Meadwood Drive 的第三个停车场”，OSM 上没有这个点，用了 Blind Ash Bay 南边那个步道口的坐标（两条步道相连），合并前可以在地图上看一下。
- Rainy Lake 游客中心在 OSM 上有两个点（48.59504, -93.19079 和 48.58476, -93.16113），用的是后一个（游客中心建筑，旁边就是 Oberholtzer 步道），Recreation.gov 写的是 48.5925, -93.17638。
