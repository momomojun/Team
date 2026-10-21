# 维尔京群岛 Virgin Islands（viis）调研记录 · 2026-10-20

按 [11-nine-parks.md](../../agent-briefs/11-nine-parks.md) 整理。页面都是 2026-10-20 打开的；NPS 的 Things To Do 清单用 NPS 网站自己的搜索接口（`nps.gov/solr/`）读出了全部 19 条。坐标按 OpenStreetMap（Overpass）和 Nominatim。

新文件：`src/data/attractions/viis.ts`（13 个景点）、`src/data/suitability/viis.ts`。

## 自驾能不能玩

**能，但要先过海，而且靠左行驶。** 公园在圣约翰岛（St. John），岛上没有机场，约六成土地是国家公园。

1. 飞到圣托马斯岛（St. Thomas）的 Cyril E. King 机场（STT）。美国公民不用护照；中国护照要有效的美国签证（美属维尔京群岛按美国入境，但从这里飞回美国本土不再过移民检查，只过海关和农业检查——这一点没有找官方页面核对，见“拿不准的”）。
2. 从机场打车或租车到岛东头的 Red Hook，约 30–45 分钟（市区常堵车）。
3. 过海到圣约翰岛的 Cruz Bay：
   - **客轮**：V.I. 公共工程部的数据是 5:30 到 22:00 每个整点一班，约 20 分钟，非居民单程 $8.15、2–11 岁 $1，行李另收（DPW 页面，没写年份）。
   - **汽车渡轮（car barge）**：Red Hook 和 Cruz Bay 之间每天有几家公司开，约 30 分钟，单程每辆车 $50–65（各处说法不一）。
4. 在圣约翰岛上开车：**靠左行驶**（车大多是美国的左舵车），山路陡、急弯多，北岸公路（North Shore Road，Route 20）和中央山脊公路（Centerline Road，Route 10）是主要的两条。也可以不开车，坐 Cruz Bay 码头边的“safari”敞篷出租车按人收费，或者跟 2–3 小时的环岛出租车团。

所以行程的 `gateway` 用 Cruz Bay（游客中心），所有景点都按圣约翰岛上开车算。STT 机场和 Cruz Bay 之间隔着海：**合并时要注意车程表**——OSM 上有 Red Hook–Cruz Bay 的渡轮航线（way 38283719），OSRM 公共服务的 car 配置一般会走渡轮，但如果 `data:travel` 算出来是 null，按现在的规则会当成 12 小时（`NO_ROAD_MIN`），要在 `route-fixes.ts` 之类的地方把 STT ↔ 圣约翰岛的车程手动设成约 90 分钟（打车 40 分钟 + 等船 + 坐船 20 分钟）。

另外：圣托马斯岛上的租车公司很多不让把车开上汽车渡轮去圣约翰岛，圣约翰岛上有自己的租车公司（Cruz Bay 码头附近），一般建议坐客轮过去再在岛上租车；去 Lameshur 湾的土路很多租车合同也不允许（NPS snorkeling 页面）。

## parks.ts 的条目

```ts
  {
    code: "viis",
    nameZh: "维尔京群岛",
    nameEn: "Virgin Islands",
    region: "caribbean",
    tagline: "加勒比海的白沙湾、珊瑚礁和甘蔗种植园遗址",
    stateEn: "U.S. Virgin Islands",
    hero: "viis-trunk-bay",
    intro:
      "美属维尔京群岛的圣约翰岛约六成是国家公园，另有约 2,300 公顷的海域：从山脊的干燥热带林一直到海湾里的珊瑚礁、海草床。北岸一串白沙湾一个接一个，Trunk Bay 常被评为世界上最美的海滩之一，Maho Bay 的海草床里常能看到绿海龟。林子里散落着丹麦殖民时代的甘蔗种植园和糖厂遗址，讲述着奴隶制和 1733 年奴隶起义的历史；Reef Bay 山谷里还有泰诺人留下的岩刻。1956 年 Laurance Rockefeller 把买下的土地捐给国家才建了公园。要从圣托马斯岛坐约 20 分钟的渡轮过来，岛上靠左开车。",
    bestMonths: [12, 1, 2, 3, 4],
    seasonNote:
      "全年 25–32°C 左右。12 月到 4 月是旱季和旺季，风浪小、最舒服，但房价最高，渡轮、海滩人多；冬天偶尔有从北边来的大浪（“Christmas winds”），北岸海滩下水要小心。6–11 月是飓风季，8–10 月最容易有热带风暴，雨多、闷热，很多餐馆和度假屋 9 月前后歇业，但人少、便宜。夏天常有撒哈拉沙尘让天空发灰。",
    areas: {
      "cruz-bay": "Cruz Bay（码头 · 游客中心）",
      "north-shore": "北岸海湾（North Shore Road）",
      annaberg: "Annaberg · Leinster Bay",
      "reef-bay": "中部山脊 · Reef Bay",
      "coral-bay": "东南：Salt Pond · Ram Head",
      "st-thomas": "圣托马斯岛（园外）",
    },
    gateway: { nameZh: "Cruz Bay（游客中心 · 客轮码头）", lat: 18.33275, lon: -64.79379 },
    timeZone: "America/St_Thomas",
    airports: ["STT"],
    nonresidentSurcharge: false,
    lodgingTip:
      "园内能住的只有北岸的 Cinnamon Bay 海滩营地：带床和风扇的生态帐篷、水泥小屋和自带帐篷的营位，没有空调，提前 11 个月开订、最少住 2 晚（圣诞、新年、复活节等周最少 7 晚）。其余的住 Cruz Bay（码头边的小镇，酒店、度假屋、餐馆都在这里，坐客轮最方便），或者东边更安静的 Coral Bay（度假屋为主，餐馆少）。圣约翰岛整体房价高，旺季要提前很久订；想省钱可以住圣托马斯岛东头的 Red Hook 一带，每天坐客轮过去（单程约 20 分钟），但在岛上要另外租车或坐出租车。",
  },
```

`timeZone`：`America/St_Thomas` 在 IANA 里是 `America/Puerto_Rico` 的别名，大西洋标准时间 UTC-4，全年不调夏令时（夏天和美东一样，冬天比美东快 1 小时）。如果代码里有只认“规范名”的地方，改用 `America/Puerto_Rico`。

`nearby`：网站上没有附近的公园，不写。

### 片区和首页地图

现有片区都用不了。提议新片区 **`caribbean`：加勒比海 · Caribbean**（以后可以放波多黎各的 El Yunque、圣克罗伊岛的国家历史遗址等）。

首页地图需要一张新的小图（像夏威夷那样）：

- 范围：只画圣托马斯岛和圣约翰岛的话，大约 `{ west: -65.1, east: -64.6, south: 18.28, north: 18.42 }`；想把圣克罗伊岛也画进来，要扩到 `south: 17.65`，但两块之间大半是海，圆点会很挤。建议只画圣托马斯、圣约翰两岛，标出 Charlotte Amalie（城市点，坐标 18.3419, -64.9307）。
- 数据源：`build-map.mjs` 现在只读 Natural Earth 1:50m 的 `admin_1_states_provinces`，里面只有美国 50 个州和加拿大的省，**没有美属维尔京群岛**（它在 admin_0 里是单独的 “U.S. Virgin Is.”）。要另外读 `ne_10m_admin_0_countries` 或 `ne_10m_admin_0_map_units`（1:50m 的岛太粗，圣约翰岛可能只有几个点）。
- 投影可以照夏威夷那样写一个 `projection: { lon0: -64.85, lat0: 18.35, lat1: 18.3, lat2: 18.4 }`。
- `viewOf` 要加 `caribbean`，`west-map.tsx` 里加第五张小图，字典加标签（“美属维尔京群岛”/“U.S. Virgin Islands”）。

## airports.ts

```ts
  STT: { code: "STT", nameZh: "西里尔·E·金机场", city: "圣托马斯岛（Charlotte Amalie）", lat: 18.33477, lon: -64.97245 },
```

坐标按 Nominatim 的机场条目。美国本土直飞的有迈阿密、亚特兰大、纽约、夏洛特等；从波多黎各圣胡安（SJU）也有很多短途航班，但网站不需要把 SJU 列成常用机场（到了 SJU 还要再飞）。

## lodging.ts

```ts
  {
    id: "viis-stay-cinnamon-bay",
    park: "viis",
    nameZh: "Cinnamon Bay 海滩营地",
    nameEn: "Cinnamon Bay Beach & Campground",
    inPark: true,
    lat: 18.35242,
    lon: -64.7547,
    note: "园内唯一的住处，就在圣约翰岛最长的海滩后面：生态帐篷（有床、风扇、电源）、水泥小屋（住 4 人、有小冰箱）和 31 个自带帐篷的营位，全都没有空调；有餐厅、餐车和浮潜、桨板出租。提前 11 个月开订，最少住 2 晚，节假日周最少 7 晚，旺季很快订满。",
  },
  {
    id: "viis-stay-cruz-bay",
    park: "viis",
    nameZh: "Cruz Bay",
    nameEn: "Cruz Bay, St. John",
    inPark: false,
    lat: 18.33082,
    lon: -64.79448,
    note: "客轮码头所在的小镇，酒店、度假屋、餐馆、超市、租车公司都在这里，走路就到游客中心和 Lind Point 步道口；房价高，旺季要提前几个月订。",
    airbnb: "Cruz Bay, St John, USVI",
  },
  {
    id: "viis-stay-coral-bay",
    park: "viis",
    nameZh: "Coral Bay",
    nameEn: "Coral Bay, St. John",
    inPark: false,
    lat: 18.345,
    lon: -64.712,
    rental: true,
    note: "圣约翰岛东头的海湾小村，以山坡上的度假屋为主，比 Cruz Bay 安静、便宜一点，去 Salt Pond、Ram Head、Lameshur 湾近；餐馆和商店很少，要租车。",
    airbnb: "Coral Bay, St John, USVI",
  },
  {
    id: "viis-stay-red-hook",
    park: "viis",
    nameZh: "Red Hook（圣托马斯岛）",
    nameEn: "Red Hook, St. Thomas",
    inPark: false,
    lat: 18.32608,
    lon: -64.85176,
    note: "圣托马斯岛东头的码头区，去圣约翰岛的客轮、汽车渡轮都从这里开；酒店比圣约翰岛便宜、选择多，到机场约 40 分钟。住这里每天坐客轮过去，到了 Cruz Bay 再租车或坐出租车。",
    airbnb: "Red Hook, St Thomas, USVI",
  },
```

Coral Bay 的坐标是村子中心的大概位置（Nominatim 上只查到“圣约翰岛”整座岛），合并前可以在地图上点一下。

## lodging-seasons.ts

不用写。Cinnamon Bay 营地的官网没写季节性关闭，NPS 写“现在开放”；但加勒比的营地、餐馆常在 9 月前后（飓风季高峰）歇业几周，没有查到 Cinnamon Bay 2026 年有没有，见“拿不准的”。

## bookings.ts

```ts
  {
    id: "viis-cinnamon-bay",
    park: "viis",
    targets: ["viis-stay-cinnamon-bay"],
    kind: "campground",
    titleZh: "Cinnamon Bay 海滩营地",
    window: { type: "rolling", months: 11 },
    url: "https://www.cinnamonbayvi.com/",
    noteZh:
      "向营地直接订（网站或 340-714-7144），网上提前 11 个月开放；最少 2 晚，圣诞、新年、总统节、复活节那一周最少 7 晚；按国家公园规定，3 个月内最多连住 14 晚、一年最多 30 晚。入住前 30 天内取消不退订金，30 天以前取消退 90%。",
    source: "https://www.cinnamonbayvi.com/faq",
    verified: "2026-10-20",
  },
  {
    id: "viis-reef-bay-hike",
    park: "viis",
    targets: ["viis-reef-bay-trail"],
    kind: "tour",
    titleZh: "Reef Bay 护林员带队徒步（坐船回来）",
    window: { type: "anytime" },
    url: "https://www.nps.gov/viis/planyourvisit/rangerguidedtours.htm",
    noteZh:
      "公园和 Friends of Virgin Islands National Park 合办，在 Friends 的网站订、收费；7:45 在游客中心报到（游客中心不能给参加的人停车），坐车到步道口往下走约 4.8 公里，最后坐约 40 分钟的船回 Cruz Bay。提前 48 小时以上取消退一半；船偶尔因风浪接不了人，就要原路爬回去，走不了来回约 10 公里的别报。",
    source: "https://www.nps.gov/viis/planyourvisit/rangerguidedtours.htm",
    verified: "2026-10-20",
  },
  {
    id: "viis-trunk-bay-pass",
    park: "viis",
    targets: ["viis-trunk-bay"],
    kind: "permit",
    titleZh: "Trunk Bay 每日设施费",
    window: { type: "first-come" },
    url: "https://www.recreation.gov/activitypass/AP22093",
    noteZh: "16 岁以上每人 $5（老人卡、残障卡持卡人 $2.50），在海滩入口的收费亭或 Recreation.gov 买；2026 年 10 月 1 日起只收卡、手机支付，不收现金。免费入园日也照收。",
    source: "https://www.nps.gov/viis/planyourvisit/fees.htm",
    verified: "2026-10-20",
  },
```

Ram Head 护林员带队徒步（季节性、看活动日历）和 Cinnamon Bay 的星空讲解（11 月到 5 月隔周三 20:15）不用预约，写进 activities。

## tours.ts

```ts
  {
    id: "viis-reef-bay-trail",
    scheduleYear: 2026,
    periods: [{ from: "01-01", to: "12-31", departures: ["08:00"] }],
    checkInMin: 15,
    daysZh: "带队徒步不是每天都有，日期看 Friends of Virgin Islands National Park 的活动日历",
    meetZh: "Cruz Bay 的游客中心（7:45 报到；参加的人不能把车停在游客中心）",
    noteZh: "只对坐带队徒步的人有用：自己走 Reef Bay 步道没有班次。出发时间按 7:45 报到估成 8:00。",
    sources: ["https://www.nps.gov/viis/planyourvisit/rangerguidedtours.htm"],
  },
```

这一条有点勉强：自己走 Reef Bay 步道的人不受班次限制。不想让排行程被它卡住的话，可以不收 tours.ts，只留 bookings.ts 那条。

## activities.ts

```ts
  {
    park: "viis",
    nameZh: "Cinnamon Bay 海滩星空讲解",
    nameEn: "Night Sky in the Park",
    months: [11, 12, 1, 2, 3, 4, 5],
    summary: "护林员在 Cinnamon Bay 海滩讲加勒比各民族怎么看星空，11 月到 5 月每隔一个周三 20:15 开始。",
    booking: "免费、不用预约；带手电，晚上海滩蚊虫多，穿长裤、抹驱蚊水。具体日期看公园的活动日历。",
    url: "https://www.nps.gov/viis/planyourvisit/rangerguidedtours.htm",
    attraction: "viis-cinnamon-bay",
  },
  {
    park: "viis",
    nameZh: "Ram Head 护林员带队徒步",
    nameEn: "Ram Head Guided Hike",
    summary: "护林员带着从 Salt Pond 湾走到 Ram Head 顶，一路讲 1733 年奴隶起义和这片岬角的历史，全程不到 2.5 英里，路陡、几乎没有遮阴。",
    booking: "季节性举办，日期看公园活动日历；带足水、矿物防晒霜，结束后可以在 Salt Pond 湾游泳浮潜。",
    url: "https://www.nps.gov/viis/planyourvisit/rangerguidedtours.htm",
    attraction: "viis-ram-head",
  },
  {
    park: "viis",
    nameZh: "Maho Bay 看海龟",
    nameEn: "Sea Turtles at Maho Bay",
    summary: "Maho Bay 中间的海草床是绿海龟吃草的地方，清晨和傍晚最常见；从路边直接走下沙滩，水浅、浪小。",
    booking: "不用预约；离海龟至少 3 米，别追、别摸，只站在沙子上。",
    url: "https://www.nps.gov/viis/planyourvisit/snorkeling.htm",
    attraction: "viis-maho-bay",
  },
```

## closures.ts

NPS 的 Alerts & Conditions 页面（`conditions.htm`）2026-10-20 打开时公告区是动态加载的，没有读到内容；NPS API 的公告接口要 key（DEMO_KEY 当天额度已经被用完），没能核对。**合并前用 `npm run check:closures` 或 NPS 公告接口再看一遍 viis。**

已知的：Trunk Bay 2026 年 10 月 1 日起不收现金（不是关闭）。没有要进 `closures.ts` 的条目（没查到）。

## parking.ts

不收。官方没写几点停满。NPS 写在 Cruz Bay 游客中心停车要先进游客中心领停车证；Trunk Bay、Maho Bay、Annaberg 的停车位都不多，旺季上午就难停是常识但没有官方时间。

## time-notes.ts

```ts
  {
    park: "viis",
    noteZh:
      "美属维尔京群岛用大西洋时间（UTC-4），全年不调夏令时：3 月到 11 月初和美东一样，冬天比美东快 1 小时。飞机落地后手机会自动跳，但从美东订的渡轮、导览的时间注意按当地时间。",
    sources: ["https://www.nps.gov/viis/planyourvisit/basicinfo.htm"],
    checked: "2026-10-20",
  },
```

`sources` 这里只是公园基本信息页，那页没写时区；时区本身是 IANA 数据库的 `America/St_Thomas`。`park-zones.ts` 要加 `viis: "America/St_Thomas"`。

## 门票

- 公园不收门票，开车进园也不收（`fees.htm`）。
- **特殊**：Trunk Bay 收每日设施费，16 岁以上每人 $5（老人卡、残障卡 $2.50），免费日也收；2026 年 10 月 1 日起只收卡。门票接口里应该会有这一项（Expanded Amenity Fee），预算里要按“去 Trunk Bay 的那天 × 16 岁以上人数”算。
- 船只过夜系泊每晚 $26（老人卡、残障卡半价），网站的行程用不到。
- 客轮、汽车渡轮另付（见上）。

## 荣誉

- 1976 年起是联合国教科文组织生物圈保护区（`honors.ts` 不收）。不是世界遗产，也没有国际暗夜公园认证。

## 其他

- **靠左行驶**：车大多是左舵（驾驶座在左边），转弯、出路口时最容易出错；NPS 也提醒步行要走右边、面对来车。
- 圣约翰岛的路陡、窄、急弯多，下雨后很滑，建议租四驱；去 Lameshur 湾的路很多租车合同不允许。
- 泰诺人的岩刻、种植园遗址都受保护，别碰、别刻画。
- 别站在珊瑚上，用不含氧苯酮等成分的“珊瑚友好”防晒霜（NPS 列了要避开的成分）。
- 手机信号：一些北岸海湾会连上英属维尔京群岛的基站（离 Tortola 很近），可能产生国际漫游费——常见说法，没有找官方页面核对。

## 拿不准的

- 汽车渡轮的价格：$50 和 $65 两种说法都有，没找到运营公司 2026 年的价目表。
- 客轮的末班时间：DPW 写 22:00，旅游局写 23:30；每年淡季（9–10 月）还有临时班次表。
- 圣托马斯岛的租车公司让不让把车开上汽车渡轮：各家不同，没有逐家核对。
- 从美属维尔京群岛飞回美国本土要不要过移民检查、中国护照的入境要求：没找官方页面核对，只写了“要有效的美国签证”。
- NPS 公告没读到（见 closures 一节）。
- Cinnamon Bay 营地 9 月前后会不会歇业：官网没写。
- Ram Head、Coral Bay、Magens Bay 海滩的坐标是大概位置（OSM 上 Ram Head 只有步道、Coral Bay 只有整座岛的条目）。
- Magens Bay（圣托马斯岛，园外）收门票和停车费，由 Magens Bay Authority 管，价格没查。
