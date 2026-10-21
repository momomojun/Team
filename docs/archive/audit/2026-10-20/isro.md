# 皇家岛 Isle Royale（isro）调研记录 · 2026-10-20

按 [11-nine-parks.md](../../agent-briefs/11-nine-parks.md) 整理。所有页面都是 2026-10-20 打开的；NPS 的页面用 curl 直接读（没登录），特许经营商的官网同样。

新文件：`src/data/attractions/isro.ts`（11 个景点）、`src/data/suitability/isro.ts`。

## 自驾能不能玩

**车开不上岛。** 皇家岛在苏必利尔湖中间，岛上没有公路、不能带车，渡轮只载人和独木舟、行李（NPS：“There are no car ferries”）。自驾的玩法是：开车到三处码头之一，停车，坐船或水上飞机当天来回，或者在岛上住一晚以上。

| 码头 / 机场 | 开车从哪来 | 到岛上哪 | 当天来回 |
|---|---|---|---|
| Copper Harbor（密歇根，Isle Royale Queen IV） | Houghton 往北约 1 小时（US-41） | Rock Harbor（东头） | 可以：8:00 开，单程约 3 小时 45 分（官网首页写 3 小时），岛上约 3 小时，14:45 开回 |
| Grand Portage（明尼苏达，Sea Hunter III） | Duluth 往东北约 2.5 小时（MN-61） | Windigo（西头） | 可以：8:30 开（中部时间），10:00 到，岛上约 4 小时，14:00 开回、15:30 到 |
| Hubbell（密歇根，Isle Royale Seaplanes） | Houghton 往东约 20 分钟 | Rock Harbor 或 Windigo | 可以：单程 35–45 分钟，一般坐早班去、末班回 |
| Houghton（密歇根，NPS 的 Ranger III） | — | Rock Harbor | 不行：单程约 6 小时，周二、周五去，周三、周六回，最少住一晚 |
| Grand Portage（Voyageur II） | — | 绕岛一圈，Windigo → 北岸 → Rock Harbor | 只有 9 月下旬两个周末有 Windigo 一日游，其余是背包客用 |

所以行程里把三种“当天来回”各算成一个景点（`start` 是码头，`durationMin` 含往返），岛上另外几个要过夜才去得了的（MV Sandy 游船、Greenstone Ridge 穿越）标 `lottery: true`，像卡特迈的 Dumpling 山一样自动生成攻略不排、写明要在 Rock Harbor Lodge 或营地过夜。陆地上收了 Houghton 游客中心、Ranger III 的运河游船、Brockway 山观景路（园外）和 Grand Portage 国家纪念地（园外，另一个 NPS 单位）。

另外：岛上收入园费按“每人每天”，到的那天和走的那天都算；渡轮、水上飞机受风浪、雾影响常延误、取消，NPS 建议“出发后几天内别安排要紧的事”，一日游也要带过夜的东西以防回不来（Grand Portage 那家写明一日游不会被困在岛上，风浪大会在出发前就取消）。

## parks.ts 的条目

```ts
  {
    code: "isro",
    nameZh: "皇家岛",
    nameEn: "Isle Royale",
    region: "greatlakes",
    tagline: "苏必利尔湖上的狼、驼鹿和荒野岛",
    stateEn: "Michigan",
    hero: "isro-rock-harbor-day-trip",
    intro:
      "苏必利尔湖西北部的一座长约 72 公里的荒岛和周围 400 多个小岛，离加拿大比离密歇根本土还近。岛上不通车、没有公路，只有约 265 公里步道和 36 处只能走路、划船到的营地，是全美游客最少的国家公园之一，也是少有的游客平均停留好几天的公园：很多人从西头的 Windigo 背包走到东头的 Rock Harbor。岛上的狼和驼鹿从 1958 年起一直有人在研究，是世界上持续最久的捕食者和猎物研究。只能坐渡轮、水上飞机或自己的船来，每年只开 4 月 16 日到 10 月 31 日。",
    bestMonths: [7, 8, 9],
    seasonNote:
      "公园 4 月 16 日到 10 月 31 日开放，11 月到次年 4 月中整座岛关闭。渡轮、水上飞机大约 5 月中到 9 月底才有，Rock Harbor Lodge、游客中心、商店只在 6 月上旬到 9 月中旬营业。7–8 月最暖、班次最多，但 6 月到 7 月初黑蝇、蚊子多；8 月底到 9 月蚊虫少、人少，9 月下旬开始有红叶，班次也越来越少。湖上常年冷，夏天也要带抓绒和雨衣。",
    areas: {
      "rock-harbor": "东头：Rock Harbor（Copper Harbor、Houghton 坐船）",
      windigo: "西头：Windigo（Grand Portage 坐船）",
      interior: "岛中间（背包穿越）",
      keweenaw: "密歇根本土：Houghton · Copper Harbor",
      "grand-portage": "明尼苏达本土：Grand Portage",
    },
    gateway: { nameZh: "Houghton（公园总部和游客中心）", lat: 47.12296, lon: -88.56375 },
    mapAt: { lat: 48.0, lon: -88.83 },
    timeZone: "America/Detroit",
    airports: ["CMX", "DLH", "MQT"],
    nearby: ["voya"],
    nonresidentSurcharge: false,
    lodgingTip:
      "岛上只有东头的 Rock Harbor Lodge（60 间湖景房和 20 栋带小厨房的小木屋，2026 年 6 月 5 日到 9 月 11 日最后一晚）和西头 Windigo 的 2 间简易小木屋，提前 366 天开订、夏天很快订满；其余都是先到先得的营地（6 人以下免费、要在岛上领许可）。当天来回的住码头附近：去 Rock Harbor 的住 Copper Harbor（小镇上几家汽车旅馆，大多只在夏天开），或者 Houghton / Hancock（大学城，连锁酒店多，到 Copper Harbor 码头约 1 小时）；坐水上飞机的住 Houghton 最近。去 Windigo 的住 Grand Portage 的 Grand Portage Lodge & Casino，或者往南约 1 小时的 Grand Marais（明尼苏达北岸的度假小镇，小木屋、民宿多）。",
  },
```

`nearby: ["voya"]`：Grand Portage 到航海家的 International Falls 约 4.5 小时，能接成一趟“明尼苏达北部”；从 Houghton 过去约 7 小时，太远的话可以不写。

### 片区（region）

现有片区都用不了。提议新片区 **`greatlakes`：五大湖 · Great Lakes**，皇家岛（密歇根）、航海家（明尼苏达）都放这里；印第安纳沙丘、凯霍加谷如果其他助手没有另提片区，也可以放进来（都在五大湖沿岸）。首页的美国东部图（`scripts/build-map.mjs` 的 `east`）范围已经到西经 95.8°、北纬 49.3°，注释里写了留给航海家和这座岛（注释里写的是旧译名“罗亚尔岛”），两座都画得下：要把 `greatlakes` 加进 `EAST_REGIONS`。`RegionId`、`regionOrder`（建议放在 `appalachia` 前面或 `plains` 后面）、`dictionaries.ts` 和英文字典的片区名也要加。

## airports.ts

```ts
  CMX: { code: "CMX", nameZh: "霍顿县纪念机场", city: "汉考克 / 霍顿（Houghton）", lat: 47.16827, lon: -88.48651 },
  DLH: { code: "DLH", nameZh: "德卢斯国际机场", city: "德卢斯（Duluth）", lat: 46.84189, lon: -92.20298 },
  MQT: { code: "MQT", nameZh: "马凯特索耶国际机场", city: "马凯特（Marquette）", lat: 46.35364, lon: -87.39536 },
```

CMX、DLH 的坐标按 Nominatim 的机场（aerodrome）条目；MQT 在 Nominatim 上只查到通用航空楼（46.33939, -87.38924），这里用的是机场中心的大概位置，合并前可以再核对。CMX 只有 United 经芝加哥的支线；DLH 到 Grand Portage 约 2.5 小时；MQT 到 Copper Harbor 约 2.5 小时。明尼阿波利斯（MSP）到 Grand Portage 约 5 小时，太远不列。

## lodging.ts

```ts
  {
    id: "isro-stay-rock-harbor-lodge",
    park: "isro",
    nameZh: "Rock Harbor Lodge",
    nameEn: "Rock Harbor Lodge",
    inPark: true,
    lat: 48.14531,
    lon: -88.48354,
    note: "岛上唯一的酒店，在东头 Rock Harbor 码头边：60 间湖景房（每间住 4 人）和 20 栋带小厨房的双拼小木屋（住 6 人），有餐厅和小卖部；只能坐船或水上飞机来，提前 366 天开订，7–8 月很早订满，订之前先确认船票的日子对得上。",
  },
  {
    id: "isro-stay-windigo-cabins",
    park: "isro",
    nameZh: "Windigo 简易小木屋",
    nameEn: "Windigo Camper Cabins",
    inPark: true,
    lat: 47.91224,
    lon: -89.15721,
    note: "西头 Windigo 只有 2 间一室的小木屋：有上下铺床垫、电源、户外烤架，没有卫生间和床上用品，自带睡袋；Rock Harbor Lodge 统一预订，只能坐 Grand Portage 的船或水上飞机来。",
  },
  {
    id: "isro-stay-copper-harbor",
    park: "isro",
    nameZh: "Copper Harbor",
    nameEn: "Copper Harbor, MI",
    inPark: false,
    lat: 47.4697,
    lon: -87.8888,
    note: "Queen IV 渡轮的码头就在镇上，走路就到；只有几家汽车旅馆、民宿和小木屋，大多 5–10 月营业，夏天周末早订。镇上补给很少，去之前在 Houghton 买齐。",
    airbnb: "Copper Harbor, MI",
  },
  {
    id: "isro-stay-houghton",
    park: "isro",
    nameZh: "Houghton / Hancock",
    nameEn: "Houghton & Hancock, MI",
    inPark: false,
    lat: 47.1211,
    lon: -88.5694,
    note: "密歇根理工大学所在的小城，连锁酒店、超市最多，全年营业；公园总部和 Ranger III 码头在这里，到 Hubbell 水上飞机基地约 20 分钟，到 Copper Harbor 码头约 1 小时（赶 8:00 的船要 6:30 前出发）。",
    airbnb: "Houghton, MI",
  },
  {
    id: "isro-stay-grand-portage",
    park: "isro",
    nameZh: "Grand Portage Lodge & Casino",
    nameEn: "Grand Portage Lodge & Casino",
    inPark: false,
    lat: 47.95387,
    lon: -89.69183,
    note: "Grand Portage 奥吉布瓦部落开的湖边酒店，到 Sea Hunter III 的 Hat Point 码头约 10 分钟，是去 Windigo 最近的住处；附近只有一家加油站、小店。",
  },
  {
    id: "isro-stay-grand-marais",
    park: "isro",
    nameZh: "Grand Marais（明尼苏达）",
    nameEn: "Grand Marais, MN",
    inPark: false,
    lat: 47.7505,
    lon: -90.3343,
    rental: true,
    note: "明尼苏达北岸的度假小镇，旅馆、湖边小木屋、整套房子多，餐馆也多；到 Grand Portage 码头约 1 小时，赶 8:30 的船要 7 点前出发。",
    airbnb: "Grand Marais, MN",
  },
```

Copper Harbor、Houghton、Grand Marais 的坐标按 Nominatim 的镇中心；Grand Portage Lodge 按 OSM（way 552922879）。

## lodging-seasons.ts

```ts
  // Rock Harbor Lodge 官网：Operating Season "June 5, 2026 – September 12, 2026 (Full Operations. Last Night Stay is 9/11/2026)"
  "isro-stay-rock-harbor-lodge": { open: [{ from: "06-05", to: "09-11" }], year: 2026, source: "https://www.rockharborlodge.com/lodging/rock-harbor-lodge/", checked: "2026-10-20" },
  // 官网的营业季还写着 2025 年：“June 6 – September 5, 2025 (last night)”；2026 年的没写，按 2025 年的
  "isro-stay-windigo-cabins": { open: [{ from: "06-06", to: "09-05" }], year: 2025, source: "https://www.rockharborlodge.com/lodging/washington-harbor-camper-cabins/", checked: "2026-10-20" },
```

Copper Harbor 的旅馆大多只在夏天营业，但镇子整体按全年写（和其他城镇一样不写）。

## bookings.ts

```ts
  {
    id: "isro-queen-iv",
    park: "isro",
    targets: ["isro-rock-harbor-day-trip"],
    kind: "transport",
    titleZh: "Isle Royale Queen IV 渡轮（Copper Harbor ↔ Rock Harbor）",
    applies: [{ from: "05-11", to: "09-30" }],
    window: { type: "anytime" },
    url: "https://isleroyale.com/schedules.php",
    noteZh:
      "2027 年的订票系统 2026 年 12 月上旬开放；2026 年 1 月就开始有夏天的日子订满。2026 年往返成人 $175、12 岁及以下 $125（一日游同价），单程半价，订的时候付全款；开船前 14 天以内取消不退。码头停车 $10/晚，早上 7 点起放车。",
    source: "https://isleroyale.com/schedules.php",
    verified: "2026-10-20",
  },
  {
    id: "isro-grand-portage-ferries",
    park: "isro",
    targets: ["isro-windigo-day-trip"],
    kind: "transport",
    titleZh: "Grand Portage 渡轮（Sea Hunter III、Voyageur II）",
    applies: [{ from: "05-09", to: "09-27" }],
    window: { type: "anytime" },
    url: "https://www.isleroyaleboats.com/",
    noteZh:
      "Grand Portage Isle Royale Transportation Lines 经营，2027 年的票 2026 年 11 月下旬开放。Sea Hunter III 一日游 2026 年成人 $120.50、16 岁以下 $110.50，另收 6% 订票费；开船前两周内取消不退。回程要和去程一起订。",
    source: "https://www.isleroyaleboats.com/rates.html",
    verified: "2026-10-20",
  },
  {
    id: "isro-seaplanes",
    park: "isro",
    targets: ["isro-seaplane"],
    kind: "transport",
    titleZh: "Isle Royale Seaplanes 水上飞机（Hubbell 出发）",
    applies: [{ from: "05-17", to: "09-19" }],
    window: { type: "anytime" },
    url: "https://www.isleroyaleseaplanes.com/pricing-and-sc",
    noteZh:
      "2026 年 5 月 17 日到 9 月 19 日每天飞，一日游只在 6 月 6 日到 9 月 12 日（去 Windigo 到 9 月 6 日）；2026 年往返、一日游都是 $420/人，单程 $289，含税费；不收订金，订了就全款，起飞前 14 天以内取消不退。2027 年（5 月 23 日到 9 月 18 日）已经在接受预订，夏天大多数日子会满。",
    source: "https://www.isleroyaleseaplanes.com/pricing-and-sc",
    verified: "2026-10-20",
  },
  {
    id: "isro-ranger-iii",
    park: "isro",
    targets: [],
    places: ["Ranger III 渡轮（Houghton ↔ Rock Harbor）"],
    kind: "transport",
    titleZh: "Ranger III 渡轮（NPS 自己的船，要过夜）",
    window: { type: "anytime" },
    url: "https://www.nps.gov/isro/planyourvisit/ranger-iii-info.htm",
    noteZh:
      "一般周二、周五 9:00 从 Houghton 开，约 15:00（有的日子 14:30）到 Rock Harbor，周三、周六 9:00 开回；8:00 码头报到，8:45 以后不让上船。不能当天来回。船上没有餐饮，带外套和吃的；订票见 NPS 的 Ranger III Reservations 页面（没写什么时候开放），或打 906-482-0984。",
    source: "https://www.nps.gov/isro/planyourvisit/ranger-iii-departure-preparation.htm",
    verified: "2026-10-20",
  },
  {
    id: "isro-rock-harbor-lodge",
    park: "isro",
    targets: ["isro-stay-rock-harbor-lodge", "isro-stay-windigo-cabins"],
    kind: "lodging",
    titleZh: "Rock Harbor Lodge 和 Windigo 小木屋",
    window: { type: "rolling", days: 366 },
    url: "https://www.rockharborlodge.com/",
    noteZh: "提前 366 天开订，Aramark 旗下的 Isle Royale Resorts 经营（电话 877-841-1064，亚利桑那时间）；价格由 NPS 定，开订时可能先按上一年的价格报。官网已经可以订 2027 年。",
    source: "https://www.nps.gov/isro/planyourvisit/rock-harbor-lodge.htm",
    verified: "2026-10-20",
  },
  {
    id: "isro-mv-sandy",
    park: "isro",
    targets: ["isro-lookout-louise", "isro-edisen-fishery"],
    kind: "tour",
    titleZh: "MV Sandy 游船（只能上岛后订）",
    window: { type: "first-come" },
    url: "https://www.nps.gov/isro/planyourvisit/mv-sandy-tours.htm",
    noteZh: "只能到了 Rock Harbor 以后在 Lodge 办公室订；6 月初到 9 月中开，2026 年成人 $60、11 岁及以下 $30。",
    source: "https://www.rockharborlodge.com/things-to-do/sightseeing-tours/",
    verified: "2026-10-20",
  },
  {
    id: "isro-keweenaw-cruise",
    park: "isro",
    targets: ["isro-keweenaw-cruise"],
    kind: "tour",
    titleZh: "Ranger III 基威诺水道游船",
    applies: [{ from: "06-20", to: "08-31" }],
    window: { type: "fixed-date", opens: "2026-06-15", forYear: 2026 },
    url: "https://www.nps.gov/isro/planyourvisit/keweenaw-waterway-cruise.htm",
    noteZh: "官网写“6 月中开始预约”，打 906-482-0984 或到 Houghton 游客中心订，没有候补；成人（16 岁以上）$36、1–15 岁 $18，1 岁以下免费。日期 opens 是按“6 月中”估的。",
    source: "https://www.nps.gov/isro/planyourvisit/keweenaw-waterway-cruise.htm",
    verified: "2026-10-20",
  },
  {
    id: "isro-campgrounds",
    park: "isro",
    targets: ["isro-greenstone-ridge"],
    places: ["岛上 36 处营地"],
    kind: "permit",
    titleZh: "过夜许可（6 人以下上岛领，7 人以上要预约）",
    window: { type: "first-come" },
    url: "https://www.nps.gov/isro/planyourvisit/camping.htm",
    noteZh:
      "所有过夜（营地、野营、船上下锚）都要许可：6 人以下免费，到 Rock Harbor、Windigo 或在 Ranger III 上领，营位先到先得；7 人以上的团要提前预约，每张许可 $25。6 月 1 日到劳动节（Rock Harbor 等几处到 9 月 21 日）每处营地有连住晚数上限，Rock Harbor 营地只能住 1 晚。",
    source: "https://www.nps.gov/isro/planyourvisit/camping.htm",
    verified: "2026-10-20",
  },
```

## tours.ts

```ts
  {
    id: "isro-rock-harbor-day-trip",
    scheduleYear: 2026,
    periods: [
      { from: "05-11", to: "05-31", departures: ["08:00"], days: ["Mon", "Fri"] },
      { from: "06-01", to: "06-30", departures: ["08:00"], days: ["Mon", "Tue", "Thu", "Fri", "Sat"] },
      { from: "07-01", to: "07-31", departures: ["08:00"], days: ["Mon", "Tue", "Thu", "Fri", "Sat", "Sun"] },
      { from: "08-01", to: "08-31", departures: ["08:00"] },
      { from: "09-01", to: "09-13", departures: ["08:00"], days: ["Mon", "Tue", "Thu", "Fri", "Sat"] },
      { from: "09-14", to: "09-30", departures: ["08:00"], days: ["Mon", "Fri"] },
    ],
    checkInMin: 45,
    daysZh: "5 月和 9 月中以后只有周一、周五；6 月和 9 月上旬周三、周日不开；7 月周三不开；8 月天天开（8 月 19、26 日除外）",
    meetZh: "Copper Harbor 的 Isle Royale Line 码头（14 Waterfront Landing）",
    noteZh:
      "8:00 开，单程约 3 小时 45 分（风浪大时更久），约 11:45 到 Rock Harbor，14:45 开回，约 18:30 回到 Copper Harbor；停车场 7:00 开始放车。2026 年 8 月 19、26 日和 9 月 28 日不去岛上。",
    sources: ["https://isleroyale.com/schedules.php"],
  },
  {
    id: "isro-windigo-day-trip",
    scheduleYear: 2026,
    periods: [
      { from: "06-10", to: "07-11", departures: ["08:30"], days: ["Wed", "Thu", "Fri", "Sat"] },
      { from: "07-15", to: "08-16", departures: ["08:30"], days: ["Wed", "Thu", "Fri", "Sat", "Sun"] },
      { from: "08-19", to: "09-05", departures: ["08:30"], days: ["Wed", "Thu", "Fri", "Sat"] },
      { from: "09-19", to: "09-27", departures: ["08:00"], days: ["Sat", "Sun"] },
    ],
    checkInMin: 20,
    daysZh: "Sea Hunter III 只在周三到周六（7 月中到 8 月中加周日）开；9 月下旬只有两个周末由 Voyageur II 开",
    meetZh: "Grand Portage 的 Hat Point 码头（Grand Portage Isle Royale Transportation Lines）",
    noteZh:
      "时间都是中部时间（明尼苏达），比岛上和密歇根慢 1 小时。8:30 开、10:00 到 Windigo，13:45 回船上、14:00 开、15:30 回到 Grand Portage；9 月 19、20、26、27 日改坐 Voyageur II，8:00 开、13:00 从 Windigo 回。9 月 6–18 日没有一日游。",
    sources: ["https://www.isleroyaleboats.com/day-trips.html", "https://www.isleroyaleboats.com/schedules.html"],
  },
  {
    id: "isro-seaplane",
    scheduleYear: 2026,
    periods: [{ from: "06-06", to: "09-12", departures: ["08:00"] }],
    checkInMin: 30,
    meetZh: "Hubbell 的 Isle Royale Seaplanes 基地（26998 W. 16th Street）",
    noteZh:
      "一日游一般排当天第一班去、最后一班回（官网写 Rock Harbor 每天 8:00、10:00、14:00、16:00 去，9:00、11:00、15:00、17:00 回），实际时间看当天排班和天气；去 Windigo 的一日游到 9 月 6 日。提前多久到官网没写，按 30 分钟估。",
    sources: ["https://www.isleroyaleseaplanes.com/pricing-and-sc"],
  },
  {
    id: "isro-keweenaw-cruise",
    scheduleYear: 2026,
    periods: [
      { from: "06-25", to: "06-25", departures: ["12:30"], year: 2026 },
      { from: "07-16", to: "07-16", departures: ["12:30"], year: 2026 },
    ],
    checkInMin: 45,
    daysZh: "2026 年只有 6 月 25 日、7 月 16 日两个周四；8 月 20 日还有两班约 45 分钟的家庭免费短游",
    meetZh: "Houghton 游客中心旁的 Ranger III 码头",
    noteZh: "11:45 报到，12:30 准时开，约 3 小时，开到基威诺水道南口再回来；风雨照开。",
    sources: ["https://www.nps.gov/isro/planyourvisit/keweenaw-waterway-cruise.htm"],
  },
  {
    id: "isro-lookout-louise",
    scheduleYear: 2026,
    periods: [{ from: "06-05", to: "09-12", departures: ["09:00"], days: ["Tue", "Thu"] }],
    checkInMin: 15,
    meetZh: "Rock Harbor Lodge 码头（MV Sandy）",
    noteZh: "NPS 写周二、周四；Lodge 官网写 9:00–12:30。季节按 Lodge 的营业季估（官网只写“6 月初到 9 月中”）。",
    sources: ["https://www.nps.gov/isro/planyourvisit/mv-sandy-tours.htm", "https://www.rockharborlodge.com/things-to-do/sightseeing-tours/"],
  },
  {
    id: "isro-edisen-fishery",
    scheduleYear: 2026,
    periods: [{ from: "06-05", to: "09-12", departures: ["13:30"], days: ["Tue", "Thu", "Sat"] }],
    checkInMin: 15,
    meetZh: "Rock Harbor Lodge 码头（MV Sandy）",
    noteZh: "NPS 写周二、周四、周六；Lodge 官网的时刻表没写哪趟是哪条线，13:30–18:00 是按页面上的顺序推的，拿不准，出发前在 Lodge 办公室确认。",
    sources: ["https://www.nps.gov/isro/planyourvisit/mv-sandy-tours.htm", "https://www.rockharborlodge.com/things-to-do/sightseeing-tours/"],
  },
```

## activities.ts

```ts
  {
    park: "isro",
    nameZh: "狼和驼鹿",
    nameEn: "Wolves & Moose of Isle Royale",
    summary:
      "岛上的驼鹿大约 1900 年前后游过或踩冰过来，狼 1940 年代末从冰上走过来；1958 年起密歇根理工大学每年冬天调查两者的数量，是世界上持续最久的捕食者和猎物研究。2018–2019 年 NPS 从本土迁来狼补充种群。驼鹿在 Windigo 一带、Hidden Lake 的矿泉边比较常见，狼很少露面。",
    booking: "不用预约；离驼鹿至少 23 米（25 码），秋天发情期的公驼鹿更要远离。2026 年狼在营地附近活动频繁，食物一律放硬壳防动物容器或营地的储物柜。",
    url: "https://www.nps.gov/isro/learn/nature/wolves.htm",
  },
  {
    park: "isro",
    nameZh: "Ranger III 家庭免费短游",
    nameEn: "Ranger III Families Ride Free Cruise",
    months: [8],
    summary: "2026 年 8 月 20 日（周四）Ranger III 在 Houghton 开两班约 45 分钟的免费短游（上午、下午各一班），适合带孩子坐一下这艘 60 多年的公园渡轮。",
    booking: "要预约，等 NPS 的新闻稿公布细节；打 906-482-0984。",
    url: "https://www.nps.gov/isro/planyourvisit/keweenaw-waterway-cruise.htm",
    attraction: "isro-keweenaw-cruise",
  },
  {
    park: "isro",
    nameZh: "基威诺半岛红叶",
    nameEn: "Keweenaw Fall Colors",
    months: [9, 10],
    summary: "9 月下旬到 10 月上旬，Copper Harbor 一带的枫树、白桦林最红，Brockway 山观景路是看红叶最好的地方；这时去岛上的船已经很少（Queen IV 9 月中以后只有周一、周五）。",
    booking: "不用预约；Isle Royale Seaplanes 秋天有红叶、灯塔观光飞行，向公司询问。",
    attraction: "isro-brockway-mountain",
  },
```

狼的引入（2018–2019 年）和“1958 年起”的研究年份是常识性的说法，NPS wolves 页面没有逐字核对（`learn/nature/wolves.htm` 没打开读），合并前可以再看一眼。

## closures.ts

2026-10-20 的 NPS Current Conditions（`current-conditions-at-isle-royale.htm`）：

- Rock Harbor 灯塔的塔楼关闭（灯塔外面和旁边的展览照常）。只写进 `isro-edisen-fishery` 的提示里，不算景点关闭。
- 东头 Three Mile、Daisy Farm、Moskey Basin、Caribou Island 四处营地因狼和人冲突、食物存放问题禁止搭帐篷，只能住避难棚；13 个野营区关闭。写在 `isro-greenstone-ridge` 的提示里。
- 现在（10 月下旬）Rock Harbor、Windigo 的游客中心、Lodge、商店、厕所、淋浴都已经关了；11 月 1 日起整座岛关闭到 4 月 15 日。这是每年的季节关闭，按 `openMonths` 写，不进 closures.ts。

没有要进 `closures.ts` 的条目。

## parking.ts

不收。三处码头的停车都是收费的长期停车场（Copper Harbor $10/晚，Hubbell $10/天，Houghton 免费），没有“几点停满”的说法。Houghton 2026 年夏天上层停车场施工，NPS 建议拼车，写在景点提示里。

## time-notes.ts

```ts
  {
    park: "isro",
    noteZh:
      "皇家岛属于密歇根，岛上、Houghton、Copper Harbor、水上飞机都按东部时间；但从明尼苏达 Grand Portage 开的渡轮（Sea Hunter III、Voyageur II）按中部时间，比岛上慢 1 小时，船公司的时刻表上 Windigo 的开船时间也写中部时间（10:00 到、14:00 开）。在 Windigo 坐回 Grand Portage 的船，按船票上的中部时间到码头。",
    sources: ["https://www.isleroyaleboats.com/schedules.html", "https://www.isleroyaleseaplanes.com/before-you-go", "https://www.nps.gov/isro/planyourvisit/hours.htm"],
    checked: "2026-10-20",
  },
```

景点里 `isro-windigo-day-trip` 和 `isro-grand-portage` 写了 `timeZone: "America/Chicago"`（出发、回来的时刻都在明尼苏达）。另外要在 `src/data/park-zones.ts` 加 `isro: "America/Detroit"`。

## 门票

- 不按车收：每人每天 $7（16 岁以上，15 岁及以下免），到的那天和走的那天都算；皇家岛季票 $60（持卡人加 3 个成人，整季有效）；各种联邦年卡（美国居民年卡、非居民年卡、老人卡……）都能用，持卡人加 3 个成人免。只收卡，不收现金，最好在 pay.gov 提前付。
- 一日游的人也要付当天的 $7；NPS 门票接口应该能查到这一项，但预算里要按人、按在岛上的天数算，不是按车。
- 船票、水上飞机票另付（见 bookings），码头停车另付。

## 荣誉

- 不是世界遗产，也没有国际暗夜公园认证（附近的 Keweenaw Dark Sky Park 是县里的公园，没有核对是不是 DarkSky 认证的）。
- 1980 年被列为联合国教科文组织生物圈保护区（`honors.ts` 不收生物圈保护区，只记在这里）。

## 其他

- 岛上没有手机信号可以依靠；Rock Harbor Trading Post 和 Windigo 商店营业时能付费用卫星电话。
- 不能带宠物上岛（会把病传给狼），服务犬要提前办兽医证明。
- 自行车、带轮子的设备不能上步道，手动轮椅可以。
- Houghton 2026 年夏天上层停车场施工，Ranger III 的乘客建议拼车。

## 拿不准的

- Queen IV 单程时间：时刻表页写“约 3 小时 45 分”，官网首页写“只要 3 小时”。按 3 小时 45 分算（8:00 开、约 11:45 到，和 Rock Harbor Lodge 说的“Queen IV 11:30 到”接近）。
- MV Sandy 各条线的具体出发时间：NPS 写了星期，Lodge 官网只列了一串时间段，没对上是哪条线。行程里 Lookout Louise 按 9:00、Edisen Fishery 按 13:30 估。
- Windigo 小木屋 2026 年的营业日期官网没更新，用 2025 年的。
- Ranger III 的订票什么时候开放、2026 年票价：票价表是一个要下载的数据集，没能读出数字。
- Grand Portage 国家纪念地夏季的开放时间：官网现在只写冬季时间（9:00–16:30，周日关），夏季的没写。
- Brockway 山观景路冬天不除雪、不通车：是一般的说法，没找到官方写明的开放日期，按 5–10 月写。
- 狼、驼鹿现在的数量没写进文案（每年冬季调查的数字没去查）。
