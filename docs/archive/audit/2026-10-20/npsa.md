# 美属萨摩亚 National Park of American Samoa（npsa）调研记录 · 2026-10-20

按 [11-nine-parks.md](../../agent-briefs/11-nine-parks.md) 整理。页面都是 2026-10-20 打开的。主要来源：NPS 的 Things To Do（用 `nps.gov/solr/` 读出全部 9 条）、`basicinfo.htm`、`accessibility.htm`、`visitorcenters.htm`、公园的游客指南 PDF（`/npsa/planyourvisit/upload/NPSA-Visitor-Guide.pdf`，没写年份，内容有些旧），美属萨摩亚旅游局（americansamoa.travel）的交通、入境、住宿页面。坐标按 OpenStreetMap。

新文件：`src/data/attractions/npsa.ts`（11 个景点）、`src/data/suitability/npsa.ts`。

## 自驾能不能玩

**图图伊拉岛（Tutuila）上能，曼努阿群岛（Manu'a）不能。**

- **到美属萨摩亚**：从美国只能飞檀香山（HNL）→ 帕果帕果（PPG）。旅游局写“每周两班、夏天和圣诞新年加班”；第三方时刻表网站 flightmapper 上 2026 年是每周三班（1–4 月 Hawaiian Airlines HA 865 周一、二、四，4 月 22 日起改成 Alaska Airlines 的 AS 865 周一、三、五，10 月 28 日以后同样），夜里起飞、单程约 5.5 小时（时长是常识，没核对）。另外从萨摩亚独立国的阿皮亚（Apia）每天有 Samoa Airways、Talofa Airways 的小飞机过来。
- **入境**：美属萨摩亚有自己的移民管理，和美国本土不一样。美国公民要护照（或出生证明）和回程机票；**外国人要提前至少 72 小时（不算周末、假日）在美属萨摩亚法律事务部网上申请入境许可**，持有效美国签证、绿卡的属于“免签国家 + 美国签证持有者”这一类，交护照、回程机票、签证证明（旅游局 entry-requirements 页面）。中国护照的人要有有效的美国签证再申请这个许可。还要填健康申报。
- **图图伊拉岛上**：机场附近有几家租车公司（大多是本地的小公司，有的没有网站），靠**右**行驶，限速低；也可以坐“aiga bus”（彩色的家庭巴士，没有时刻表，招手即停，50 美分到 2 美元），出租车按政府定价但上车前先讲好价。公园在岛北岸，从帕果帕果翻山过去：去 Vatia 走 Afono Pass，去 Mount 'Alava 步道口走 Fagasā Pass，都是窄而陡的山路。**周日 aiga bus 不开。**
- **曼努阿群岛**（Ofu、Olosega、Ta'u，往东约 100 公里）：公园的另一半在这里。只能坐 Samoa Airways 的 19 座双水獭小飞机（旅游局写每周四班，飞 Ta'u 的 Fiti'uta 和 Ofu 两个机场）或者 Manu'atele 渡轮（时刻、票价要打电话问港务局）；游客指南写航班“有限而且有时不可靠”。岛上没有出租车、公交，Ta'u 和 Ofu 之间只能坐当地渔船，Ofu 和 Olosega 之间有桥。所以曼努阿的景点按“PPG 机场出发、要在岛上住几晚”写，标 `lottery: true`，自动生成攻略不排。

## parks.ts 的条目

```ts
  {
    code: "npsa",
    nameZh: "美属萨摩亚",
    nameEn: "National Park of American Samoa",
    region: "southpacific",
    tagline: "南太平洋的雨林、果蝠和珊瑚礁",
    stateEn: "American Samoa",
    hero: "npsa-pola-island",
    intro:
      "美国唯一在赤道以南的国家公园，在夏威夷西南约 4,200 公里，分在三座火山岛上：主岛图图伊拉岛北岸的雨林和海崖，东边曼努阿群岛的 Ofu 岛珊瑚礁潟湖和 Ta'u 岛（美属萨摩亚最高的 Lata 山，966 米）。林子是和亚洲、非洲同源的旧热带雨林，唯一的本地哺乳动物是翼展近 1 米的果蝠，白天也常在树冠上飞；海里记录到 950 多种鱼、250 多种珊瑚。公园的土地是向当地村子租来的，萨摩亚人的生活方式（fa'asamoa）就在公园里：进村前先问许可，周日要安静，傍晚的祈祷时间（sā）要停下来等。几乎没有一般国家公园的设施，适合有探险精神的人。",
    bestMonths: [6, 7, 8, 9],
    seasonNote:
      "全年都是 28–31°C 左右的高温高湿。6–9 月是稍凉、稍干的季节，最适合徒步；10 月到次年 5 月是漫长的雨季，热带风暴多，12–2 月雨最多。8–11 月常能看到南半球的座头鲸。周日几乎所有商店关门、公交停开，很多村子不让游泳、不让上部分步道，排行程时把周日当休息日。",
    areas: {
      "pago-pago": "帕果帕果和港湾（游客中心）",
      vatia: "Vatia 一带（北岸）",
      "mount-alava": "Mount 'Alava 山脊",
      aunuu: "'Aunu'u 岛（园外）",
      ofu: "Ofu 岛（坐小飞机）",
      tau: "Ta'u 岛（坐小飞机）",
    },
    gateway: { nameZh: "帕果帕果（公园游客中心）", lat: -14.27445, lon: -170.6969 },
    timeZone: "Pacific/Pago_Pago",
    airports: ["PPG"],
    nonresidentSurcharge: false,
    lodgingTip:
      "公园里没有住宿。图图伊拉岛上住帕果帕果港湾一带（Utulei 的 Sadie's by the Sea 在海边、Fagatogo 有老旅馆 Sadie Thompson Inn）或机场附近的 Tafuna（Tradewinds Hotel 最大，还有几家小旅馆和 Airbnb），到公园北岸开车都在 30–40 分钟以内。曼努阿群岛只有几家小旅馆（Ofu 岛的 Vaoto Lodge、Ta'u 岛的 Fitiuta Lodge 等），要和机票一起提前订，岛上没有餐馆和商店，吃住都靠旅馆。公园以前协助安排的村民家寄宿（homestay，Vatia、Fagasā、Fiti'uta 等村）现在开不开没能确认，想住要先发邮件问公园。",
  },
```

### 片区和首页地图

现有片区都用不了（夏威夷那个片区是 `hawaii`，名字就是夏威夷）。提议新片区 **`southpacific`：南太平洋 · South Pacific**（不叫“美属萨摩亚”，是给以后可能加的关岛、北马里亚纳之类留余地；只放这一座的话也可以直接叫 **`samoa`：美属萨摩亚 · American Samoa**）。

首页地图要一张新的小图（像夏威夷那样）：

- 范围：图图伊拉岛和曼努阿群岛一起画大约 `{ west: -170.9, east: -169.35, south: -14.4, north: -14.1 }`，横向很长、纵向很扁（两组岛之间约 100 公里是海）。只画图图伊拉岛的话是 `{ west: -170.88, east: -170.53, south: -14.38, north: -14.23 }`，曼努阿用一个小箭头或文字标出来也行。
- 数据源：`build-map.mjs` 用的 Natural Earth 1:50m `admin_1_states_provinces` 里**没有美属萨摩亚**（它在 admin_0 里是单独的 “American Samoa”），要另外读 `ne_10m_admin_0_countries`（1:50m 的 admin_0 可能只有图图伊拉岛的一个粗轮廓）。
- 投影：`projection: { lon0: -170.2, lat0: -14.25, lat1: -14.35, lat2: -14.15 }` 之类；注意在南半球、经度是西经 170°，离日期变更线很近（和夏威夷一样都在线的东边，不用跨 180°）。
- `viewOf` 加新片区，`west-map.tsx` 加一张小图和标签（“美属萨摩亚”/“American Samoa”），城市点可以标帕果帕果（-14.2755, -170.7048）。

## airports.ts

```ts
  PPG: { code: "PPG", nameZh: "帕果帕果国际机场", city: "帕果帕果（图图伊拉岛）", lat: -14.33477, lon: -170.71597 },
```

坐标按 Nominatim 的机场条目。檀香山（HNL）是唯一从美国过来的转机点，但 HNL 到 PPG 不能开车，不用列进 `airports`（网站的 `airports.ts` 里现在也没有 HNL）。曼努阿的 Fiti'uta（FTI）、Ofu（OFU）机场只有岛内航班，不当常用机场。

## lodging.ts

```ts
  {
    id: "npsa-stay-utulei",
    park: "npsa",
    nameZh: "Sadie's by the Sea（Utulei）",
    nameEn: "Sadie's by the Sea",
    inPark: false,
    lat: -14.27802,
    lon: -170.68205,
    note: "帕果帕果港湾口 Utulei 的海边酒店，旁边就是能游泳、浮潜的沙滩，到公园游客中心约 10 分钟，翻 Afono Pass 到 Vatia 约 30 分钟。",
  },
  {
    id: "npsa-stay-tafuna",
    park: "npsa",
    nameZh: "Tafuna（机场一带）",
    nameEn: "Tafuna, Tutuila",
    inPark: false,
    lat: -14.33579,
    lon: -170.73043,
    note: "机场附近的平地，Tradewinds Hotel（岛上最大的酒店，有泳池）、Pago Airport Inn 等几家和 Airbnb 都在这里；航班大多深夜到、深夜走，住这里最方便。到公园北岸约 40 分钟。",
    airbnb: "Tafuna, American Samoa",
  },
  {
    id: "npsa-stay-ofu",
    park: "npsa",
    nameZh: "Ofu 岛的小旅馆（Vaoto Lodge 等）",
    nameEn: "Ofu Island Lodges",
    inPark: false,
    lat: -14.18448,
    lon: -169.67005,
    note: "曼努阿群岛的 Ofu 岛上只有一两家家庭旅馆（旅游局列了 Vaoto Lodge），靠近 Ofu 机场，走路去公园的海滩；岛上没有餐馆、商店，三餐一般由旅馆包，和机票一起提前订。",
  },
  {
    id: "npsa-stay-tau",
    park: "npsa",
    nameZh: "Ta'u 岛的小旅馆（Fitiuta Lodge 等）",
    nameEn: "Ta'u Island Lodges",
    inPark: false,
    lat: -14.21524,
    lon: -169.42755,
    note: "Ta'u 岛东头 Fiti'uta 村一带，旅游局列了 Fitiuta Lodge；离 Fiti'uta 机场和 Si'u Point 步道口都近，补给很少。",
  },
```

坐标：Sadie's by the Sea、Tradewinds（代表 Tafuna）按 OSM；Ofu 用的是 Ofu 机场，Ta'u 用的是 Fiti'uta 村（两家旅馆在 OSM / Nominatim 上都没找到）。

## lodging-seasons.ts

不用写，都是全年营业（没查到季节性关门）。

## bookings.ts

```ts
  {
    id: "npsa-entry-permit",
    park: "npsa",
    targets: [],
    kind: "permit",
    titleZh: "美属萨摩亚入境许可（外国人）",
    window: { type: "days-before", days: 5 },
    url: "https://legalaffairs.as.gov/visitor-visa-home",
    noteZh:
      "美属萨摩亚自己管入境：不是美国公民的人要提前至少 72 小时（不算周末、假日）网上申请入境许可。持有效美国签证、绿卡的按“免签国家 + 美国签证持有者”一类申请，要护照、回程机票和签证证明。美国公民带护照或出生证明、回程机票就行。另外要在 travel.doh.as 填健康申报。days 写 5 是把“72 小时不算周末”按最坏情况估的。",
    source: "https://www.americansamoa.travel/entry-requirements",
    verified: "2026-10-20",
  },
  {
    id: "npsa-flights",
    park: "npsa",
    targets: [],
    places: ["檀香山—帕果帕果航班"],
    kind: "transport",
    titleZh: "檀香山—帕果帕果航班",
    window: { type: "anytime" },
    url: "https://www.hawaiianairlines.com/",
    noteZh: "从美国过来只有这一条航线，每周两三班（2026 年按第三方时刻表是周一、三、五），旺季常满，先订机票再订住宿。",
    source: "https://www.americansamoa.travel/getting-here",
    verified: "2026-10-20",
  },
  {
    id: "npsa-manua-flights",
    park: "npsa",
    targets: ["npsa-ofu-beach", "npsa-siu-point"],
    kind: "transport",
    titleZh: "去曼努阿群岛的岛内航班",
    window: { type: "anytime" },
    url: "https://www.samoaairways.com/",
    noteZh: "Samoa Airways 的 19 座双水獭小飞机，旅游局写每周四班，飞 Ta'u（Fiti'uta）和 Ofu；座位少、常因天气改期，回程留一两天余地。也可以坐 Manu'atele 渡轮，时刻、票价打港务局 684-633-4160 问。",
    source: "https://www.americansamoa.travel/getting-here",
    verified: "2026-10-20",
  },
```

## tours.ts

不收。公园没有固定班次的导览；Samoa Airways 去曼努阿的航班时刻没查到。

## activities.ts

```ts
  {
    park: "npsa",
    nameZh: "看果蝠",
    nameEn: "Fruit Bat Watching",
    summary: "两种果蝠（翼展近 1 米）是美属萨摩亚唯一的本地哺乳动物，和别处不一样，白天也常在雨林树冠上空飞，Lower Sauma Ridge、Mount 'Alava 的步道上最容易看到。它们给雨林里很多树传粉、播种。",
    booking: "不用预约；带望远镜，傍晚飞出来觅食时最多。",
    url: "https://www.nps.gov/thingstodo/fruit-bat-watching.htm",
    attraction: "npsa-lower-sauma",
  },
  {
    park: "npsa",
    nameZh: "座头鲸",
    nameEn: "Humpback Whales",
    months: [8, 9, 10, 11],
    summary: "8–11 月南半球的座头鲸来这一带，在曼努阿群岛常能看到母鲸带着小鲸在浪区外玩；图图伊拉岛的海岸也看得到。",
    booking: "不用预约；从岸边的高处看。",
    url: "https://www.nps.gov/npsa/planyourvisit/upload/NPSA-Visitor-Guide.pdf",
  },
  {
    park: "npsa",
    nameZh: "周日和傍晚祈祷（sā）",
    nameEn: "Sunday & Evening Prayer (Sā)",
    summary:
      "周日是去教堂、休息的日子，村子里要安静，平时可以的活动（比如游泳）周日常不允许，Tuafanua 步道、Breakers Point 周日关闭，aiga bus 也不开。每天傍晚各村有祈祷时间 sā，开车、走路进村时碰上了要停下来安静等它结束，主干道上不用停。",
    booking: "不用预约。周日可以去教堂听唱诗（穿得正式：男士长裤、女士过膝裙），其他行程挪到别的日子。",
    url: "https://www.nps.gov/npsa/planyourvisit/basicinfo.htm",
  },
```

## closures.ts

NPS 的 Alerts & Conditions 页面（最后更新 2024 年 1 月）没有公告；NPS API 的公告接口要 key，DEMO_KEY 当天额度用完了，没能核对。**合并前用 `npm run check:closures` 再看一下 npsa。** 游客指南里写 Fogama'a 火山口（园外的国家自然地标）“已关闭”，没收成景点。

没有要进 `closures.ts` 的条目（没查到）。

## parking.ts

不收。步道口都是路边、村子里的小空地；Pola Island 那段路是单车道的碎石路，“能停哪停哪”。

## time-notes.ts

```ts
  {
    park: "npsa",
    noteZh:
      "美属萨摩亚用萨摩亚标准时间（UTC-11），全年不调夏令时，比夏威夷晚 1 小时，是美国最晚的时区之一。隔壁的萨摩亚独立国（阿皮亚）2011 年跳到了日期变更线另一边（UTC+13）：两地钟表时间一样，但阿皮亚比这里早一整天，从阿皮亚飞过来的航班会“到在出发的前一天”，订票时看清日期。",
    sources: ["https://www.americansamoa.travel/general-information"],
    checked: "2026-10-20",
  },
```

萨摩亚独立国 2011 年改时区、现在是 UTC+13 是常识，没有另找官方来源；旅游局页面写了“新西兰周一 9 点 = 这里周日 10 点”。`park-zones.ts` 加 `npsa: "Pacific/Pago_Pago"`。

## 门票

- 不收门票、不用预约（游客指南：“No fees or reservations are required”；NPS fees 页面同样是 Free）。
- 要另付的：'Aunu'u 岛的小船（游客指南写每人 $1，NPS 写“在现场收费，问当地的船”）、园外的 Fagatele Bay 步道（私人土地，那户人家可能收费）。
- 预算里机票占大头（HNL–PPG 往返），曼努阿的岛内航班另算。

## 荣誉

- 不是世界遗产，没有国际暗夜公园认证。公园海域外的 Fagatele Bay 属于美属萨摩亚国家海洋保护区（NOAA），不算公园。

## 其他

- 公园的土地是 1993 年起向当地村子和家族租的（公园 1988 年设立），步道、海滩很多就在村子边上，游客指南一再强调：拍照、用海滩、做任何事之前先问村民，几乎都会同意。
- 进村穿着要得体：在海滩以外的地方别只穿泳衣，套上 T 恤、短裤或 lavalava（萨摩亚纱笼）；在村里走路时别边走边吃喝。
- 进传统的 fale（萨摩亚开放式房子）先坐到地上再说话、吃喝，盘腿或用垫子盖住腿，伸直腿不礼貌。被邀请喝 'ava（卡瓦根做的饮料）时，先往地上洒几滴，举杯说“manuia”再喝。
- 狗很多、常咬人（NPS basicinfo 写了“咬人不少见”）；去 Pola Island 那段路尽头的人家狗凶，游客指南让开车开过最后一户人家再停。
- 海边要注意礁石缺口的离岸流（ava）、掉落的椰子；Tuafanua 步道尽头的海滩浪和流都很危险，不能下水。
- 医疗：图图伊拉岛有医院，曼努阿很有限，药带够。
- 商店周一到周五 8:00–16:00、周六 8:00–14:00，周日大多关门。

## 拿不准的

- **Homestay（村民家寄宿）**：NPS 的 lodging 页面（2015 年更新）写可以在图图伊拉、Ofu、Ta'u 安排，公园“协助但不负责”；2012 年的寄宿信里列了 Vatia、Fagasā、Fiti'uta 等村；但民间网站写 2024 年起“暂停、另行通知”。现在开不开没能确认，所以没有收成住宿，只写在 lodgingTip 里。
- **HNL–PPG 的班次**：旅游局写每周两班，第三方时刻表网站写 2026 年每周三班，执飞从 Hawaiian Airlines 改成 Alaska Airlines 的航班号（两家已经合并）。没有航空公司官网的时刻表。
- **去曼努阿的航班**：游客指南写 Polynesian Airlines，旅游局写 Samoa Airways（就是改了名的同一家）每周四班；2026 年的时刻没查到。Manu'atele 渡轮的时刻、票价官网没写。
- Lower Sauma Ridge 步道的爬升 NPS 写“232ft/7m”，英尺和米对不上（7 米约 23 英尺），没写进 `hike.gainFt`。
- Mount 'Alava 山顶原来的电视塔和缆车遗迹、Adventure Trail（56 段梯子、783 级台阶）现在的状况没核对，按游客指南写。
- 曼努阿的旅馆坐标是机场 / 村子的位置。
- NPS 公告没读到（见 closures 一节）。
- 中国护照申请入境许可的具体要求（比如是不是一定要美国签证，还是“不在免签名单”的那一类还要土地主证明、无犯罪证明）：旅游局的表格写“免签国家 + 美国签证持有者”一类，按这个理解写了“要有效的美国签证”，出发前以法律事务部的页面为准。
