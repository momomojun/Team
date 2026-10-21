# chir 奇里卡瓦 Chiricahua 调研记录（2026-10-20）

新公园。景点文件 `src/data/attractions/chir.ts`（导出名 `chiricahua`，11 个景点，含园外的 Fort Bowie 国家历史遗址），同行适合度 `src/data/suitability/chir.ts`。下面是共用文件要加的东西，主对话照着合并。所有来源都是 2026-10-20 查的（OSM、OSRM 是 10-21 凌晨查的）。

## 升格为国家公园的新闻

- H.R. 6830（Chiricahua National Park Act，众议员 Juan Ciscomani 提出）：参议院 2026-09-30 通过，10 月 15 日（周四）送到总统桌上。
  - KOLD 2026-10-16 “Clock starts on Trump’s decision over Chiricahua national park bill”：https://www.kold.com/2026/10/16/clock-starts-trumps-decision-over-chiricahua-national-park-bill/
  - azfamily 2026-10-02 “Arizona’s first new national park in decades could be days away”：https://www.azfamily.com/2026/10/02/arizonas-first-new-national-park-decades-could-be-days-away/
  - KJZZ 2026-10-02（面积 12,025 英亩；部落的顾虑）：https://www.kjzz.org/tribal-natural-resources/2026-10-02/gop-bill-sponsor-is-confident-trump-will-turn-chiricahua-into-arizonas-4th-national-park
  - EarthSky 2026-10-11：https://earthsky.org/earth/chiricahua-national-park-64-us/ （2025 年游客约 70,400 人次，营地 26 个营位）
  - 边界、联邦所有权和管理都不变；保留阿帕奇部落进园举行传统仪式的权利，可以为此临时对公众关闭部分区域（具体办法未定）。
- **签字的新闻没能确认**：到 2026-10-20 能搜到的报道（最晚 10-16）都还写“等总统签字”。主对话给的消息是 10 月 20 日签署（KOLD 10-21“Chiricahua National Monument officially named country’s newest national park”、KGUN9“It’s official: Now it’s Chiricahua National Park”、Tucson Sentinel），我没能搜到这几篇原文（Congress.gov 返回 403），设立日期按主对话说的 2026-10-20 写。合并前最好再打开一次报道核对日期。
- NPS 官网 2026-10-20 还叫 Chiricahua National Monument，2026 年版步道指南也是旧名。文案里统一写“国家公园”，提一句“原来是国家纪念地（1924 年设立）”。

## 主要来源（NPS 官网，2026-10-20 查）

- 基本信息（徒步班车“2025 年秋天起停开、现在也没开”，页面 2026-03-05 更新）：https://www.nps.gov/chir/planyourvisit/basicinfo.htm
- 2026 年版步道指南和地图（PDF，各条步道里程、爬升、建议走法；游客中心 8:30–16:30，园区 24 小时开放；营地 23 个营位、车长 29 英尺以内；观景路过了营地车长不能超过 24 英尺、不许拖车）：https://www.nps.gov/chir/planyourvisit/upload/2026_Park_Hiking_Guide_8x14_Remediated.pdf （还有中文版：`2026_Park_Hiking_Guide_8x14_Chinese_Remediated.pdf`）
- 徒步页（班车的老规矩：忙季周末 9:00 从 Faraway Ranch、9:10 从营地出发，先到先坐，送到 Massai Point 或 Echo Canyon）：https://www.nps.gov/chir/planyourvisit/hiking.htm
- 观景路（Bonita Canyon Drive 8 英里，沿途停靠点、车长限制）：https://www.nps.gov/chir/planyourvisit/scenic-drive.htm
- 交通和停车场（每个停车场的车位数、坐标；Echo Canyon 停车场 2–4 月和节假日周末很快停满，没写几点；没有网约车、出租车）：https://www.nps.gov/chir/planyourvisit/directions.htm
- 门票（不收门票、不收停车费，也不卖年卡）：https://www.nps.gov/chir/planyourvisit/fees.htm
- 天气和注意事项（季风季 6 月 15 日到 9 月 30 日，山洪、雷电；东南亚利桑那发现狂犬病；园内除营地外全年禁火；页面 2026-08-12 更新）：https://www.nps.gov/chir/planyourvisit/conditions.htm
- 无障碍（只有 Bonita Creek 铺装段适合所有助行设备；Faraway Ranch 主屋周围大致能走；Massai Point 步道约 0.1 英里电动助行设备可能能走；营地 8 号营位无障碍；页面 2026-10-17 更新）：https://www.nps.gov/chir/planyourvisit/accessibility.htm
- 常见问题（3 月最忙；10 月、12 月、3 月学校假期；10–4 月周末节假日停车难；夏天人最少；最近的加油站 Sunizona 27 英里、Willcox 37 英里；11–4 月可能下雪）：https://www.nps.gov/chir/faqs.htm
- 营地：https://www.nps.gov/chir/planyourvisit/bonita-canyon-campground.htm ；营地说明 PDF（“提前 6 个月”）：https://www.nps.gov/chir/planyourvisit/upload/Campground_Info_2025_Remediated-corrected.pdf ；Recreation.gov 250901：https://www.recreation.gov/camping/campgrounds/250901 （接口：22 个标准营位 + 1 个团体帐篷营地 + 3 个管理员位，旺季价 $25/晚、团体 $50；每年最多住 14 晚；2026-12-23 到 12-31、2027-02-12 到 04-11 标为“Busy”）
- Faraway Ranch 历史：https://www.nps.gov/chir/learn/historyculture/faraway-ranch.htm ；Massai Point 历史：https://www.nps.gov/chir/learn/historyculture/massai-point.htm
- 护林员活动页（活动表是动态加载的，没读到）：https://www.nps.gov/chir/planyourvisit/ranger-guided-programs.htm
- NPS API（alerts、thingstodo、places）用 DEMO_KEY 被限流（OVER_RATE_LIMIT），没读到。
- Fort Bowie 国家历史遗址（园外，另一个 NPS 单位）：https://www.nps.gov/fobo/planyourvisit/basicinfo.htm 、https://www.nps.gov/fobo/planyourvisit/hours.htm （园区、步道日出到日落开放）、https://www.nps.gov/fobo/planyourvisit/directions.htm （从奇里卡瓦走 Hwy 186、Apache Pass Road 砂石路 8 英里到步道口；往返 3 英里走到游客中心和要塞废墟）
- 坐标：停车场按 NPS directions.htm 给的坐标；步道、山顶、岩石、营地按 OSM（Overpass）；城镇按 Nominatim。
- 车程（OSRM 公共服务试算）：Willcox → 游客中心 36.5 英里 / 50 分钟，Sunizona 25 英里 / 39 分钟，Bisbee 73 英里 / 约 2 小时，Portal 走 Pinery Canyon 土路 26.5 英里 / 85 分钟，图森机场 114 英里 / 2 小时 15 分，埃尔帕索机场 281 英里 / 5 小时 20 分，Fort Bowie 步道口 22 英里 / 50 分钟。

## 景点（`src/data/attractions/chir.ts`，11 个）

| id | 景点 | 片区 |
|---|---|---|
| chir-visitor-center | 游客中心 | lower |
| chir-faraway-ranch | Faraway Ranch 历史农庄 | lower |
| chir-bonita-creek | Bonita Creek 小环线 | lower |
| chir-bonita-canyon-drive | Bonita Canyon Drive 观景路（必去） | lower |
| chir-natural-bridge | Natural Bridge 步道 | lower |
| chir-massai-point | Massai Point 观景台和自然步道（必去） | massai |
| chir-echo-canyon-loop | Echo Canyon 环线（必去，hero） | massai |
| chir-heart-of-rocks | Heart of Rocks 和大平衡石（必去） | massai |
| chir-sugarloaf | Sugarloaf 山顶瞭望台 | massai |
| chir-night-sky | Massai Point 看星空 | massai |
| chir-fort-bowie | Fort Bowie 国家历史遗址（outsidePark） | fort-bowie |

- 没有单独收的：Inspiration Point、Big Loop、Lower Rhyolite / Sarah Deming（写进 Heart of Rocks 的提示和游客中心的提示）；Echo Canyon 到 Grotto 的短走（写进 Echo Canyon 环线的提示）；Erickson 家族墓地（写进 Faraway Ranch 的提示）。
- 园外没收 Portal 的 Cave Creek Canyon（科罗纳多国家森林，看鸟胜地）：从公园过去要走土路 Pinery Canyon 翻山，铺装路要绕两个多小时，写在住宿里。
- 照片（photoFile）按 Commons 搜索选的，Natural Bridge、Bonita Creek、看星空没找到合适的，没填。
- **车程表要注意**：OSRM 公共服务现在把 Echo Canyon、Sugarloaf 停车场吸附到营地附近的路上（游客中心 → Echo Canyon 只算 0.5 英里 / 2 分钟），Massai Point 吸附到山另一边的土路上（游客中心 → Massai Point 算出 30 英里 / 101 分钟）。OSM 上 Bonita Canyon Drive 是 tertiary、连着的，可能是公共 OSRM 的数据旧。跑 `npm run data:travel` 以后看一下 chir 的车程：游客中心到 Massai Point 实际约 6 英里，盘山路约 15–20 分钟。不对的话要在 `route-fixes.ts` 修，或者在车程表里手动改。

## parks.ts 条目

```ts
  {
    code: "chir",
    nameZh: "奇里卡瓦",
    nameEn: "Chiricahua",
    region: "southwest",
    tagline: "火山灰凝成的石柱森林",
    stateEn: "Arizona",
    hero: "chir-echo-canyon-loop",
    intro:
      "亚利桑那东南角的奇里卡瓦山是索诺兰、奇瓦瓦两片沙漠之间的一座“天空之岛”。约 2,700 万年前附近 Turkey Creek 火山大爆发，厚厚的火山灰熔结成流纹岩，后来裂开、风化成几千根石柱和摇摇欲坠的平衡石，早年的牧场主叫它“石林”（Wonderland of Rocks）。8 英里的观景路从橡树林谷底一直开到山顶的 Massai Point，几条步道从山顶下到石柱中间。这里也是奇里卡瓦阿帕奇人的故乡，谷底的 Faraway Ranch 讲早期移民的故事。1924 年设为国家纪念地，2026 年 10 月 20 日升为美国第 64 座国家公园。",
    bestMonths: [3, 4, 5, 10, 11],
    seasonNote:
      "海拔约 1,600–2,200 米，比图森凉快不少。3 月最挤（亚利桑那的冬季候鸟和春假），10 月、12 月学校放假也多，10 月到次年 4 月的周末停车难；夏天人最少，但 6 月中到 9 月底是季风季，午后常有雷暴、山洪和闪电。11 月到次年 4 月随时可能下雪，一场几英寸到一英尺，山顶的路可能结冰。4–6 月最干，常有禁火令。",
    areas: {
      lower: "谷底 · 游客中心 · Faraway Ranch",
      massai: "山顶 · Massai Point · Echo Canyon 石林",
      "fort-bowie": "Fort Bowie 国家历史遗址（北边约 50 分钟，园外）",
    },
    gateway: { nameZh: "奇里卡瓦游客中心", lat: 32.00543, lon: -109.35642 },
    timeZone: "America/Phoenix",
    airports: ["TUS", "PHX", "ELP"],
    nearby: ["sagu"],
    nonresidentSurcharge: false,
    lodgingTip:
      "园里没有旅馆，只有一个 Bonita Canyon 营地（20 多个营位，Recreation.gov 提前 6 个月预约，3–4 月、10 月和节假日很快订满；车长 29 英尺以内，没有淋浴和电）。最近的住处在西北的 Willcox（约 50 分钟），I-10 边上有连锁汽车旅馆、超市和加油站，最方便；东边山那头的 Portal 是看鸟的人住的小村子，有几家山庄和出租小屋，但到公园要走 Pinery Canyon 土路翻山（建议高底盘车），铺装路要绕 Willcox 或 Douglas；南边的老矿镇 Bisbee 约 2 小时，住老房子改的民宿、逛街吃饭最有意思，适合和图森、Tombstone 连着玩。园内和附近没有加油站，Sunizona（27 英里）和 Willcox（37 英里）是最后的补给点。",
  },
```

- `region: "southwest"`：巨人柱（sagu）用的就是 `southwest`（“亚利桑那 · 新墨西哥 · 得州”），不用新片区。
- `nonresidentSurcharge: false`：不收门票、不收停车费，也不卖年卡（https://www.nps.gov/chir/planyourvisit/fees.htm），不在 2026 年收附加费的 11 座里。
- `nearby: ["sagu"]`：图森的巨人柱到公园约 2 小时 20 分，图森进出常连着玩。建议在 sagu 的 `nearby` 里也加上 `"chir"`（共用文件，主对话决定）。白沙（whsa）约 4.5 小时、大弯更远，不写。
- `airports`：TUS（图森，约 2 小时 15 分）、PHX（凤凰城，约 3.5 小时）、ELP（埃尔帕索，约 5 小时 20 分）。NPS 交通页：“Nearest Airport: TUS (Tucson)；Airports within 6 hours: PHX (Phoenix), ELP (El Paso), ABQ (Albuquerque)”。
- hero 用 Echo Canyon 环线（Commons `Echo Canyon Trail, Chiricahua National Monument, Willcox, AZ.jpg`），也可以换成 Massai Point。
- intro 里的“约 2,700 万年前 Turkey Creek 火山”是常见说法，没逐字核对 NPS 地质页面。

## national-parks.ts

加进 rows（按设立日期排，放在最后、新河峡谷之后），并把 `pendingPark` 改成 `undefined`（注释里写着“签了以后把它加进上面的列表（代码 chir），这里改成 undefined”）：

```ts
  ["chir", "奇里卡瓦", "Chiricahua", "亚利桑那", "2026-10-20", 49, "chir"],
```

```ts
export const pendingPark: PendingPark | undefined = undefined;
```

- NPS 单位代码 `chir`，州“亚利桑那”（和 sagu、pefo、grca 一样的写法）。
- 面积：法案和报道写 12,025 英亩（KJZZ 2026-10-02），AP 写约 19 平方英里（49 平方公里）。12,025 英亩 = 48.7 平方公里，取 49。NPS 2023 年面积报告里的数没能打开核对。
- 文件头注释、`pendingPark` 上面的说明也要改（“可能的下一座……等总统签字”）。改完跑 `npm run data:visits`（DEVELOPMENT.md 里写的流程），游客人次接口的单位代码是 `CHIR`。
- 网站各处写“63 座国家公园”的地方（README 徽章、榜单页文案）要改成 64。

## airports.ts

TUS、PHX、ELP 都已经有了，不用加。

## lodging.ts

```ts
  {
    id: "chir-stay-willcox",
    park: "chir",
    nameZh: "Willcox",
    nameEn: "Willcox, AZ",
    inPark: false,
    lat: 32.25291,
    lon: -109.83158,
    note:
      "I-10 边上的小镇，离游客中心约 36 英里、50 分钟（Hwy 186 往东南 32 英里再转 Hwy 181）；连锁汽车旅馆、超市、加油站都有，是住得最方便、最便宜的地方。往东约 50 分钟到 Fort Bowie。",
    airbnb: "Willcox, AZ",
  },
  {
    id: "chir-stay-portal",
    park: "chir",
    nameZh: "Portal · Cave Creek Canyon",
    nameEn: "Portal, AZ (Cave Creek Canyon)",
    inPark: false,
    lat: 31.91359,
    lon: -109.14143,
    note:
      "奇里卡瓦山东麓的小村子，Cave Creek Canyon 是有名的看鸟地，有几家山庄和出租小屋，夜里很暗。到公园要走 Pinery Canyon 土路（FR 42）翻过山，约 26 英里、1.5 小时，NPS 建议高底盘或四驱，雨雪后可能过不去；走铺装路要绕 Willcox 或 Douglas，单程 2 小时以上。补给很少，进村前加满油。",
    rental: true,
    airbnb: "Portal, AZ",
  },
  {
    id: "chir-stay-bisbee",
    park: "chir",
    nameZh: "Bisbee",
    nameEn: "Bisbee, AZ",
    inPark: false,
    lat: 31.44172,
    lon: -109.91599,
    note:
      "南边的老铜矿镇，山坡上的老房子改成了民宿、小旅馆、画廊和餐馆，晚上能逛街吃饭；离游客中心约 73 英里、2 小时，适合和图森、Tombstone 连着玩，只住这里每天来回就太远了。",
    airbnb: "Bisbee, AZ",
  },
```

- 车程按 OSRM 试算；Portal 到公园 OSRM 走的是 Pinery Canyon 土路。

## campgrounds.ts（营地，合并进 Recreation.gov 营地表）

```ts
  {
    id: "chir-camp-bonita-canyon",
    park: "chir",
    nameZh: "Bonita Canyon 营地",
    nameEn: "Bonita Canyon Campground",
    inPark: true,
    camp: true,
    lat: 32.01111,
    lon: -109.35539,
    note: "22 个标准营位和 1 个团体帐篷营地，全年开、全部要在 Recreation.gov 预约（提前 6 个月滚动开放，当天有空位也能订）。每晚 $25（团体 $50），有冲水厕所和自来水，没有淋浴、电和排污站。车长 29 英尺以内，拖车加车头要放得进营位车道；过了营地观景路只准 24 英尺以内的车。",
    bookUrl: "https://www.recreation.gov/camping/campgrounds/250901",
  },
```

- 营位数：Recreation.gov 接口列出 26 个（22 个标准营位、1 个团体帐篷营地、3 个管理员位）；2026 年步道指南写 23 个营位；EarthSky 写 26 个。这里按 22 + 1 写。
- 价钱：Recreation.gov rates 接口的旺季（2–4 月）标准营位 $25、团体 $50；淡季没看到另一档价钱。
- 8 号营位无障碍（accessibility.htm）。

## lodging-seasons.ts

不用加：营地全年开，园外的城镇按全年营业算。

## bookings.ts

```ts
  {
    id: "chir-bonita-canyon-campground",
    park: "chir",
    targets: [],
    places: ["Bonita Canyon Campground"],
    kind: "campground",
    titleZh: "Bonita Canyon 营地",
    window: { type: "rolling", months: 6 },
    url: "https://www.recreation.gov/camping/campgrounds/250901",
    noteZh:
      "园里唯一的营地，全部营位都要在 Recreation.gov 预约，最多提前 6 个月，当天有空位也能订。3–4 月（春假）、10 月和节假日常常提前几个月订满；Recreation.gov 把 2026 年 12 月 23–31 日、2027 年 2 月 12 日到 4 月 11 日标成“忙”。到达当天中午以后入住，第二天中午还没到就可能被取消。",
    source: "https://www.nps.gov/chir/planyourvisit/upload/Campground_Info_2025_Remediated-corrected.pdf",
    verified: "2026-10-20",
  },
```

- 别的营地 bookings 怎么对营地 id（`targets` 写 `chir-camp-bonita-canyon`），照主对话合并营地时的写法改。
- 景点都不用预约：Faraway Ranch 主屋导览看当天人手，不能预约；徒步班车停开。

## activities.ts

```ts
  {
    park: "chir",
    nameZh: "季风雷暴季",
    nameEn: "Monsoon season",
    months: [7, 8, 9],
    summary:
      "6 月 15 日到 9 月 30 日是季风季，午后常有猛烈的雷暴、闪电和山洪，雨后满山转绿，平时干着的 Bonita 溪也可能流水。Willcox 到公园的 Hwy 186 常被短时的山洪漫过，南边 Hwy 181 的干河床可能积水好几天。",
    booking: "不用预约。早上出发、中午前下山；看到积水漫过路面就掉头，不要涉水开过去。",
    url: "https://www.nps.gov/chir/planyourvisit/conditions.htm",
  },
  {
    park: "chir",
    nameZh: "春季旺季",
    nameEn: "Spring busy season",
    months: [3, 4],
    summary:
      "3 月是公园一年里最忙的月份：亚利桑那的冬季候鸟、春假的学生都来，Echo Canyon、游客中心的停车场周末常满，营地提前几个月订满。4–6 月是一年里最干的时候，常有禁火令。",
    booking: "营地提前 6 个月在 Recreation.gov 订；步道尽量平日、早上去。",
    url: "https://www.nps.gov/chir/faqs.htm",
  },
  {
    park: "chir",
    nameZh: "冬季雪景",
    nameEn: "Winter snow",
    months: [12, 1, 2],
    summary:
      "11 月到次年 4 月随时可能下雪：谷底一场几英寸，山顶能到一英尺，雪可以留一个星期左右，石柱上积了雪很好看。",
    booking: "不用预约。下雪后山路可能结冰，先打电话问游客中心（520-824-3560）；步道上的石阶结冰很滑。",
    url: "https://www.nps.gov/chir/faqs.htm",
    attraction: "chir-massai-point",
  },
```

## tours.ts

不用加。Faraway Ranch 主屋导览没有公布的固定班次（NPS 护林员活动页的活动表是动态加载的，没读到；National Parks Traveler 的旧文章说以前一天两场、常因人手取消）。徒步班车 2025 年秋天起停开（basicinfo.htm，2026-03-05 更新），以前是忙季周末一班。

## closures.ts

2026-10-20 没找到临时关闭：Alerts & Conditions 页面（2026-08-12 更新）只有季风、狂犬病、禁火的常规提醒；NPS alerts 接口被限流没读到，合并前用 `npm run check:closures` 或打开 https://www.nps.gov/chir/planyourvisit/conditions.htm 再看一次。

## parking.ts

不收：官方只说 Echo Canyon 停车场“2 月、3 月、4 月和节假日周末很快停满”，FAQ 说 10–4 月周末节假日停车难，都没写几点。

## time-notes.ts 和 park-zones.ts

park-zones.ts 要加 `chir: "America/Phoenix",`。

亚利桑那不实行夏令时：3 月到 11 月和太平洋夏令时一样、比山地夏令时（新墨西哥、得州西部）慢 1 小时；冬天和山地标准时间一样。可能的坑（**没找到官方说法**，按地理推的，合并前决定要不要写）：Portal 离新墨西哥州界只有几公里，州界那边用山地时间、有夏令时，夏天在 Portal 一带手机可能跳到新墨西哥时间、快 1 小时。

```ts
  {
    park: "chir",
    when: "dst",
    noteZh:
      "亚利桑那不实行夏令时：3 月到 11 月比旁边的新墨西哥慢 1 小时。住在东边 Portal 一带的，手机可能连上新墨西哥的基站、自己跳快 1 小时，看日出日落、和别人约时间以亚利桑那时间为准。",
    sources: ["https://www.nps.gov/chir/planyourvisit/directions.htm"],
    checked: "2026-10-20",
  },
```

（来源只能证明 Portal 离新墨西哥很近，手机跳时区是推测；不想写推测的就不加这一条。）

## 门票

不收门票、不收停车费，NPS 门票接口应该返回空。Fort Bowie 也不收门票。

## 荣誉

- 国际暗夜公园：NPS 2026 年步道指南写“In 2021, Chiricahua National Monument was recognized as a Dark Sky Park”。DarkSky 的地点页 `darksky.org/places/chiricahua-national-monument/` 返回 403，没能核对 slug。

```ts
  chir: { program: "darksky", year: 2021, url: darkSkyPlace("chiricahua-national-monument") },
```

- 不是世界遗产。媒体推荐没查（10 月 20 日才升格，各家 2027 年榜单之前都还没有）。

## 其他不寻常的情况

- **还叫国家纪念地**：NPS 官网、步道指南、Recreation.gov 都还写 Chiricahua National Monument。用户搜英文资料会碰到旧名，页面上提一句。
- **部落进园仪式**：法案保留阿帕奇部落进园举行传统仪式的权利，允许为此临时对公众关闭部分区域，具体办法还没定（KJZZ、KOLD）。以后可能有临时关闭。
- **车长限制**：拖车和 29 英尺以上的车只能开到 Faraway Ranch；过了营地只准 24 英尺以内。房车旅行的人要在 Willcox 或 Sunizona 换小车。
- **补给**：园内没有加油站、商店、餐馆，手机基本没信号；网约车、出租车都没有（NPS 交通页）。
- **狂犬病**：东南亚利桑那发现狂犬病，NPS 提醒不要接近、喂、摸野生动物。
- **禁火**：营地以外全年禁火，营地只能用站立式烤架，4–6 月常有禁火令。
- **狗**：大部分步道禁止带狗，只有 Bonita Creek、Silver Spur Meadow、营地到游客中心的连接步道可以牵狗。
- 2025 年游客约 70,400 人次（EarthSky）。

## 拿不准的

1. **签字日期**：没能搜到 10 月 20 日签字的报道（KOLD、KGUN9、Tucson Sentinel 的那几篇搜不到，Congress.gov 返回 403），设立日期按主对话给的 2026-10-20 写。
2. **营位数**：步道指南 23 个、Recreation.gov 22 个标准 + 1 个团体（另有 3 个管理员位）、EarthSky 26 个。
3. **面积**：12,025 英亩（报道）≈ 48.7 平方公里，取 49；NPS 面积报告没核对。
4. **Faraway Ranch 主屋导览**：2026 年有没有固定场次没查到；WNPA 一个没日期的页面（现在 404）说因为保护工程屋里没摆家具、开放日 11:00–14:00。景点里写“看人手，先问游客中心”。
5. **徒步班车**：NPS 基本信息页（2026-03-05）写停开；徒步页还留着老规矩（忙季周末 9:00）。按停开写。
6. **OSRM 车程**：见“车程表要注意”。
7. **Fort Bowie 步道**：往返 3 英里，难度写成 moderate，爬升没查到官方数字，没写。
8. 几处常识性的说法没逐条找到官方原文：Sugarloaf 步道上一小段人工凿的石头隧道、瞭望台“1930 年代”、2011 年 Horseshoe Two 山火烧过 Natural Bridge 一带（步道指南只写“areas of intense burn”）、约 2,700 万年前 Turkey Creek 火山爆发、Big Balanced Rock“上千吨”。
9. Heart of Rocks 的“下午 1 点以后不要出发”是步道指南的建议，没写成 `hours`，只放在提示里。

WebSearch 用了 6 次。
