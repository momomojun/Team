# maca 猛犸洞 Mammoth Cave 调研记录（2026-10-20）

新公园。景点文件 `src/data/attractions/maca.ts`（导出名 `mammothCave`），同行适合度 `src/data/suitability/maca.ts`。下面是共用文件要加的东西，主对话照着合并。所有来源都是 2026-10-20 查的。

## 主要来源

- 洞穴导览总表（时长、距离、台阶、年龄、每场人数）：https://www.nps.gov/maca/planyourvisit/explore-all-tours.htm
- 洞穴导览页（2026 年 10 月到 2027 年 2 月的班次、订票、取消规则；页面 2026-10-20 更新）：https://www.nps.gov/maca/planyourvisit/cave-tours.htm
- 票价：https://www.nps.gov/maca/planyourvisit/fees.htm
- 游客中心一带和南侧步道（长度、哪几条在关）：https://www.nps.gov/maca/planyourvisit/visitor-center-area-and-south-side-trails.htm
- 无障碍：https://www.nps.gov/maca/planyourvisit/accessibility.htm
- 秋季游览（营地关闭日期、红叶）：https://www.nps.gov/maca/planyourvisit/visiting-in-fall.htm
- NPS alerts 接口（2026-10-20 拉取，4 条：Green River 渡轮因水位低停运、无障碍导览电梯故障、几条步道整修关闭、洞穴要买票）
- NPS 游客中心接口（开放时间、坐标）
- Recreation.gov 洞穴导览票（facility 234640）接口：`booking_window_configs` 是 `open_days: 180`、`close_hours: 1`；页面写“完整的班次可能到出发前几个月才公布”：https://www.recreation.gov/ticket/facility/234640
- Recreation.gov Mammoth Cave Campground（232467）：109 个营位、最多连住 14 晚、房车最长 38 英尺：https://www.recreation.gov/camping/campgrounds/232467
- 园内旅馆 The Lodge at Mammoth Cave：https://www.mammothcavelodge.com/lodging-mammoth-cave/ （Woodland Cottages “通常 4 月 1 日到 11 月 1 日”，其他房型全年）
- 坐标：游客中心、洞口、步道、渡口按 OSM（Nominatim，2026-10-20 查）；停车场按 OSM（Overpass）

## parks.ts 条目

```ts
  {
    code: "maca",
    nameZh: "猛犸洞",
    nameEn: "Mammoth Cave",
    region: "south", // 新片区，见下面“片区”
    tagline: "世界上最长的洞穴系统",
    stateEn: "Kentucky",
    hero: "maca-historic-tour",
    intro:
      "肯塔基中部的石灰岩丘陵底下，是世界上已知最长的洞穴系统：已经测绘的通道超过 430 英里（约 690 公里），而且还在不断发现新的。洞里分好几层，上层是又宽又干的大通道和巨大的洞厅，19 世纪的硝石矿遗迹、游客用烟熏在洞顶的签名都还在；东南边 Frozen Niagara 一带才有钟乳石、石笋和石瀑布。看洞只能跟护林员的导览团进（全年都有，要买票），从 30 分钟的自助短线到 6 小时爬行钻洞的 Wild Cave 都有。地面上是 Green 河谷和丘陵森林，有 80 多英里步道；1981 年列为世界遗产，2021 年获国际暗夜公园认证。",
    bestMonths: [4, 5, 6, 9, 10],
    seasonNote:
      "洞里常年约 12°C（50 多华氏度），一年四季都能看。6–8 月和春秋学校假期最挤，导览票常提前几周卖光；夏天地面闷热潮湿、多雷阵雨、蜱虫多。10 月下旬红叶。冬天导览场次、线路都少很多（2026 年 11 月中到 2027 年 2 月每天只有四五条线），园内两个大营地 12 月到 2 月关闭。",
    areas: {
      "visitor-center": "游客中心 · 历史入口",
      "frozen-niagara": "Frozen Niagara · New Entrance 一带（坐车去）",
      "flint-ridge": "Flint Ridge · Great Onyx 洞",
      "south-side": "南侧：Cedar Sink · Sand Cave · Sloans Crossing",
      river: "Green 河（划船 · 渡口）",
    },
    gateway: { nameZh: "猛犸洞游客中心", lat: 37.18702, lon: -86.10128 },
    timeZone: "America/Chicago",
    airports: ["BNA", "SDF"],
    nonresidentSurcharge: false,
    lodgingTip:
      "园内只有游客中心旁边的 The Lodge at Mammoth Cave（Sunset Terrace 客房、Historic Cottages、Family Cabins 全年开，便宜的 Woodland Cottages 一般 4 月到 10 月底），走路就到游客中心和历史入口，早上的导览最方便。园外最多人住东边 I-65 旁的 Cave City（53 号出口，到游客中心约 20 分钟）：连锁汽车旅馆、餐馆、加油站都在这里；南边的 Park City（48 号出口）更小更安静。Bowling Green 离游客中心约 45 分钟，酒店和超市最多。园里的 Mammoth Cave Campground 3 月到 11 月开（Recreation.gov 预订），西侧的 Houchin Ferry 小营地全年开。Green 河北岸的营地和 Brownsville 一带要坐 Green River 渡轮过河，渡轮因为水位低或涨水常停（2026 年 9 月起因水位低停运），停了就要绕路约 45 分钟。",
  },
```

- `nonresidentSurcharge: false`：猛犸洞不收门票，不在 2026 年收非居民附加费的 11 座公园里（https://www.nps.gov/maca/planyourvisit/fees.htm：“There is no fee to enter Mammoth Cave National Park”）。
- `nearby`：现有的公园里没有常一起玩的（大烟山约 4 小时车程）。新加的公园里，温泉（hosp）约 6 小时、圣路易斯拱门（jeff）约 4.5 小时，也不算顺路，不写。
- `airports`：BNA（纳什维尔，约 95 英里、1 小时 40 分）、SDF（路易斯维尔，约 90 英里、1 小时 30 分）。Bowling Green 的 BWG 没有定期航班，不收。

## 片区（region）

现有片区没有合适的：`appalachia` 是阿巴拉契亚山（大烟山、仙纳度、新河峡谷），猛犸洞在它西边的肯塔基石灰岩高原上，不是山区；`florida` 只是南佛罗里达。提议两个新片区，和这次一起加的几座公园一起用：

- `south`：“美国南部”（The South）：猛犸洞 maca（肯塔基）、温泉 hosp（阿肯色）、康加里 cong（南卡）。
- `greatlakes`：“五大湖 · 中西部”（Great Lakes & Midwest）：凯霍加谷 cuva（俄亥俄）、印第安纳沙丘 indu、圣路易斯拱门 jeff（密苏里），也可以放罗亚尔岛 isro、航海家 voya。

如果主对话不想加太多片区，猛犸洞放 `appalachia` 也说得过去（同在美国东南、常和大烟山一起按“南方自驾”排），但名字对不上。

## airports.ts

```ts
  BNA: { code: "BNA", nameZh: "纳什维尔国际机场", city: "纳什维尔", lat: 36.1263, lon: -86.6774 },
  SDF: { code: "SDF", nameZh: "路易斯维尔穆罕默德·阿里国际机场", city: "路易斯维尔", lat: 38.1744, lon: -85.736 },
```

（先查一下 airports.ts 里有没有 BNA，别重复。）

## lodging.ts

```ts
  {
    id: "maca-stay-lodge",
    park: "maca",
    nameZh: "The Lodge at Mammoth Cave（园内旅馆）",
    nameEn: "The Lodge at Mammoth Cave",
    inPark: true,
    lat: 37.18607,
    lon: -86.10112,
    note: "园内唯一的旅馆，就在游客中心旁边，走路 5 分钟到历史入口，赶早上第一场导览最方便；有 Sunset Terrace 客房、带厨房的 Family Cabins、Historic Cottages 和季节性的 Woodland Cottages（可以带狗），还有 Green River 餐厅。夏天和秋天周末早点订。",
  },
  {
    id: "maca-stay-cave-city",
    park: "maca",
    nameZh: "Cave City",
    nameEn: "Cave City, KY",
    inPark: false,
    lat: 37.13675,
    lon: -85.95622,
    note: "I-65 的 53 号出口，到游客中心约 20 分钟；连锁汽车旅馆、快餐、加油站最集中，价格便宜，周边还有 Dinosaur World、私营洞穴这类路边景点。",
    airbnb: "Cave City, KY",
  },
  {
    id: "maca-stay-park-city",
    park: "maca",
    nameZh: "Park City",
    nameEn: "Park City, KY",
    inPark: false,
    lat: 37.09394,
    lon: -86.04637,
    note: "I-65 的 48 号出口，从南边（纳什维尔）过来先到这里，走 KY-255 进园约 15 分钟；小镇只有几家旅馆和度假木屋，比 Cave City 安静。",
    rental: true,
    airbnb: "Park City, KY",
  },
  {
    id: "maca-stay-bowling-green",
    park: "maca",
    nameZh: "Bowling Green",
    nameEn: "Bowling Green, KY",
    inPark: false,
    lat: 36.99292,
    lon: -86.44287,
    note: "肯塔基第三大城，到游客中心约 45 分钟；酒店、餐馆和大超市（包括亚洲超市）最多，Corvette 博物馆也在这里。从纳什维尔开过来第一晚住这里最顺。",
  },
```

## lodging-seasons.ts

```ts
  // The Lodge at Mammoth Cave lodging page: Woodland Cottages "Usually April 1st to November 1st". Other room types (Sunset Terrace, Historic Cottages, Family Cabins) have no season listed = year-round. NPS fall page: "Most cabins and rooms at the Lodge at Mammoth Cave are available year-round."
  // 整个 maca-stay-lodge 全年开，不用写。只有 Woodland Cottages 是季节性的；如果以后单独收这个房型，写 { open: [{ from: "04-01", to: "10-31" }], year: 2026 }。
```

## bookings.ts

```ts
  {
    id: "maca-cave-tours",
    park: "maca",
    targets: [
      "maca-historic-tour",
      "maca-domes-dripstones",
      "maca-frozen-niagara",
      "maca-mammoth-passage",
      "maca-grand-avenue",
      "maca-great-onyx-lantern",
      "maca-violet-city-lantern",
      "maca-wild-cave",
    ],
    kind: "tour",
    titleZh: "猛犸洞洞穴导览票",
    window: { type: "rolling", days: 180, tz: "America/Chicago" },
    also: [{ type: "first-come" }],
    url: "https://www.recreation.gov/ticket/facility/234640",
    noteZh:
      "进洞只能跟导览团，票在 Recreation.gov 卖（或打 877-444-6777）。系统最早提前约 180 天开放，但公园常到出发前 1–3 个月才把那段时间的班次和线路放出来，所以要隔一阵上去看一次；放出来以后热门的场次（Historic、Domes & Dripstones、Grand Avenue）夏天和节假日常提前几周卖光。当天在游客中心也卖剩下的票，但不保证有。取消每张扣 $1，开团前取消都退；Wild Cave、Intro to Caving、Trog 提前 10 天以内取消另扣钱。提前 30 分钟到游客中心取纸质票。",
    source: "https://www.nps.gov/maca/planyourvisit/cave-tours.htm",
    verified: "2026-10-20",
  },
  {
    id: "maca-campground",
    park: "maca",
    targets: [],
    places: ["Mammoth Cave Campground"],
    kind: "campground",
    titleZh: "Mammoth Cave 营地",
    applies: [{ from: "03-01", to: "11-30" }],
    window: { type: "rolling", months: 6, time: "10:00", tz: "America/New_York" },
    url: "https://www.recreation.gov/camping/campgrounds/232467",
    noteZh:
      "游客中心旁边，109 个营位，走 5 分钟到游客中心；3 月 1 日到 11 月 30 日开，在 Recreation.gov 预订（按一般规则提前 6 个月滚动开放，营地页面没写，以网站实际开放为准），最多连住 14 晚，房车最长 38 英尺。",
    source: "https://www.recreation.gov/camping/campgrounds/232467",
    verified: "2026-10-20",
  },
```

## activities.ts

```ts
  {
    park: "maca",
    nameZh: "暗夜公园星空",
    nameEn: "Night sky at an International Dark Sky Park",
    months: [5, 6, 7, 8, 9, 10],
    summary:
      "猛犸洞 2021 年获国际暗夜公园认证，是美国东部少有的能看到银河的地方。夏秋季公园有护林员带的夜空讲解和星空观测，游客中心附近的停车场、Green River 渡口一带视野开阔。",
    booking: "免费、不用预约，日程看公园的活动日历或游客中心公告。",
    url: "https://www.nps.gov/maca/planyourvisit/calendar.htm",
  },
  {
    park: "maca",
    nameZh: "Green 河划独木舟、皮划艇",
    nameEn: "Paddling the Green River",
    months: [5, 6, 7, 8, 9, 10],
    summary:
      "Green 河在园内蜿蜒约 30 英里，水流平缓，两岸是石灰岩崖壁和森林，河边常有从洞里流出来的泉水。最常见的是从 Dennison Ferry 划到 Green River Ferry 约 7 英里、半天，或从 Green River Ferry 划到 Houchin Ferry。",
    booking: "园外的划船公司（Cave City、Park City、Brownsville 一带）出租独木舟、皮划艇并接送；自带船的在 Dennison Ferry、Green River Ferry、Houchin Ferry 的坡道下水。涨水、水位太低时出发前打公园渡轮热线 270-758-2166 问。",
    url: "https://www.nps.gov/maca/planyourvisit/thingstodo.htm",
    attraction: "maca-green-river-paddle",
  },
```

## tours.ts

**建议不收**。猛犸洞的导览班次每段日期都不一样、同一段里还分平日和周末（比如 10 月 Historic 每天 10:00、12:15，周一到周四加 10:30，周末加 12:45、15:15），而 `tours.ts` 一段只能写一组班次；而且公园只提前 1–3 个月公布，2026 年夏天的班次已经查不到，写进去以后不在这几段日期里的日子会被当成“不开”。导览按普通景点排（游客中心开门时间内），订票靠 `bookings.ts`。

供参考，NPS 2026-10-20 公布的班次（中部时间）：

- 10 月 4–31 日：Historic 10:00、12:15（周一到周四加 10:30，周六日加 12:45、15:15）；Extended Historic 8:45、16:00；Domes & Dripstones 11:00、12:45、14:15、14:45（周一到周四加 13:15、16:00，周六日加 10:00）；Frozen Niagara 8:45、16:15（周末加 11:30）；Gothic Avenue 13:45、15:45；Grand Avenue 9:45；Great Onyx Lantern 11:15、15:30；Mammoth Passage 周一到周四 11:00、13:15、15:00；Violet City Lantern 周六日 14:00；Discovery 自助线周五到周日 10:00–15:00。
- 11 月 1–14 日：Historic 10:00、10:45、11:45、13:00、15:00；Domes & Dripstones 8:45、9:45、11:15、12:00、12:30、14:30；Frozen Niagara 9:15；Grand Avenue 周六日 9:30；Mammoth Passage 9:00、15:15；Violet City Lantern 周六日 14:00。
- 11 月 15–28 日：Broadway 10:15、11:15、12:45；Domes & Dripstones 10:00、13:00、14:15；Frozen Niagara 10:00、12:45、14:30；Grand Avenue 9:15；Great Onyx Lantern 周四到周日 13:45；Mammoth Passage 9:00。**这段 Historic 不开**。
- 11 月 29 日到 2027 年 2 月 28 日：Domes & Dripstones 14:15；Frozen Niagara 14:45；Grand Avenue 9:15；Mammoth Passage 9:30；Broadway 11:15（12 月 27 日起）或周六日 14:00（12 月）。**冬天 Historic、Great Onyx、Violet City 都不开**。

## closures.ts

```ts
  {
    attractions: ["maca-green-river-paddle"],
    from: "2026-09-03",
    reopen: null,
    reasonZh:
      "Green River 渡轮 9 月初起因水位太低停运，水位回升、安全了才恢复；河北岸的营地、步道和 Brownsville 一带要绕路（经 KY-70、KY-259 约多开 45 分钟）。水位低时划船也容易搁浅，出发前问划船公司或打渡轮热线 270-758-2166。",
    source: "https://www.nps.gov/maca/planyourvisit/conditions.htm",
    checked: "2026-10-20",
  },
```

（渡轮停运的公告在 NPS alerts 接口里，`lastIndexedDate` 是 2026-09-03；conditions 页面本身只让人看 X 账号和打热线。划船不一定要坐渡轮，这条放不放进 closures 主对话定；不放的话写在景点 tips 里已经够了。）

另外两条公告不对应景点、没写进 closures：

- 无障碍导览（Accessible Tour）的电梯故障，导览暂停（公告 2026-05-06）；10 月以后的班次表里也没有 Accessible、Cleaveland Avenue 两条线。没收这条线当景点。
- Heritage Trail、Old Guides Trail、Sunset Point Trail 和 Sinkhole Trail 的一部分整修关闭（公告 2025-05-05，步道页 2025-11-17 更新时还写着关闭）。这几条都是游客中心旁边的短步道，没收；River Styx Spring 步道写在游客中心景点的 tips 里。

## parking.ts

不收：NPS 没写哪个停车场几点停满。

## time-notes.ts

```ts
  {
    park: "maca",
    noteZh:
      "猛犸洞用中部时间（和纳什维尔一样），从路易斯维尔（SDF，东部时间）开过来要把表拨慢 1 小时；肯塔基的东西两半时区不同，州界在路易斯维尔和猛犸洞之间。Recreation.gov 的导览票、游客中心都按中部时间，别按手机上没跳过来的东部时间算。",
    sources: ["https://www.recreation.gov/ticket/facility/234640"],
    checked: "2026-10-20",
  },
```

（Recreation.gov 接口 `facility_timezone: America/Chicago`；路易斯维尔所在的 Jefferson 县是东部时间。I-65 上 Hart 县和 Hardin 县之间换时区——Hart 县（Horse Cave、Munfordville）是中部时间，这个是常识没另查来源。）

## 门票

- 进园免费。洞穴导览单独买票（Recreation.gov 或游客中心），国家公园年卡不能抵，老人卡（Senior Pass）、Access Pass 持卡人本人半价。
- 2026 年票价（成人 13 岁以上 / 6–12 岁 / 3–5 岁）：Historic $24 / $18 / $6；Extended Historic $27 / $21 / $7；Domes & Dripstones $30 / $25 / $8；Frozen Niagara $26 / $22 / $7；Mammoth Passage $15 / $13 / $4；Discovery $12 / $9 / $3；Broadway $22 / $17 / $6；Grand Avenue $42 / $34；Gothic Avenue $23 / $19；Great Onyx Lantern $31 / $26；Violet City Lantern $32 / $27；River Styx $26 / $20；Star Chamber Lantern $30 / $25；Intro to Caving $49 / $42；Trog（8–12 岁）$25；Wild Cave $79（16 岁以上）。第一张表 NPS 没标列名，按第二张表的列序（成人 / 青少年 / 儿童）理解。
- 预算里建议按“每人一条主要导览”估：成人约 $25–30。

## 荣誉

- 世界遗产 1981 年、国际暗夜公园 2021 年：`honors.ts` 里已经有了。另外 1990 年起是联合国教科文组织生物圈保护区（Mammoth Cave Area Biosphere Region），honors.ts 没有这类，不用加。

## 其他

- 洞里常年约 54°F（12°C），带外套；夏天地面 90°F 以上、潮湿，蜱虫多。
- 白鼻综合征（White-nose Syndrome）：每个导览出洞都要踩消毒垫，去过别的洞穴的衣服鞋子不要穿进来。
- 导览不许带婴儿背架（child backpack carriers）、婴儿车、大背包，不许用闪光灯（Focus Photo 摄影团可以带三脚架）。只有服务犬能进洞。
- 16 岁以下要有 18 岁以上的成人陪同。
- 去游客中心不要只靠手机导航（Recreation.gov 原话），从 I-65 的 53 号（Cave City）或 48 号（Park City）出口进。

## 拿不准的

- Recreation.gov 的 `open_days: 180` 是系统配置，和公园说的“完整班次到出发前几个月才公布”不矛盾但实际能订的远没有 180 天；bookings 里按 180 天写、noteZh 里讲清楚。
- 游客中心接口里的季节时间：“Spring 2026” 写的是 2027-03-13 到 04-04（8:00–17:30），“Summer 2026” 是 2027-04-05 到 08-08（8:00–18:30），名字和年份对不上；标准时间 8:30–16:30。景点按 4–7 月 8:00–18:30、其他 8:30–16:30 写，3 月中、8 月初前后差一点。
- Grand Historic Tour 的距离 NPS 写“4 miles (3.2 km)”，英里和公里对不上，没收这条线。
- 无障碍导览的电梯什么时候修好没写。
- Houchin Ferry（园西边的另一个渡口）这次的公告没提，是否也因水位低停运没查到。
- Mammoth Cave Campground 的预订窗口（6 个月）没在官方页面上找到，按 Recreation.gov 的一般规则写。
- 票价表第一张没有列名（见“门票”）。
