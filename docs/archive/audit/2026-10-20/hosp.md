# hosp 温泉 Hot Springs 调研记录（2026-10-20）

新公园。景点文件 `src/data/attractions/hosp.ts`（导出名 `hotSprings`），同行适合度 `src/data/suitability/hosp.ts`。所有来源都是 2026-10-20 查的。

## 主要来源

- Things To Do（九座浴场各做什么用）：https://www.nps.gov/hosp/planyourvisit/things2do.htm
- 泡温泉（Buckstaff、Quapaw）：https://www.nps.gov/hosp/planyourvisit/soak-in-the-springs.htm
- Hot Springs / North Mountain 步道表（长度、坡度）：https://www.nps.gov/hosp/planyourvisit/hot-springs-and-north-mountain-trails.htm
- 步道总览（Sunset Trail、West Mountain）：https://www.nps.gov/hosp/planyourvisit/trails.htm
- 观景路和观景点：https://www.nps.gov/hosp/planyourvisit/scenic-overlooks.htm
- Fordyce 游客中心：https://www.nps.gov/hosp/planyourvisit/fordyce-bathhouse.htm
- 护林员导览（Bathhouse Row 户外讲解，页面 2026-05-21 更新）：https://www.nps.gov/hosp/planyourvisit/guidedtours.htm
- 营地：https://www.nps.gov/hosp/planyourvisit/campground.htm ；Recreation.gov 247559
- Buckstaff 时间（只接待现场来的，不预约）：https://www.buckstaffbaths.com/appointments-and-hours
- Quapaw（14 岁以下不提供服务；网站聊天窗口写周三到周一 10:00–18:00、周二休）：https://www.quapawbaths.com/
- 观景塔（9:00–18:00，票价）：https://hotspringstower.com/
- 坐标：浴场、塔、观景点、停车场按 OSM（Nominatim、Overpass，2026-10-20 查）

## parks.ts 条目

```ts
  {
    code: "hosp",
    nameZh: "温泉",
    nameEn: "Hot Springs",
    region: "south", // 新片区，见 maca.md
    tagline: "老城里的浴场街和 62°C 的泉水",
    stateEn: "Arkansas",
    hero: "hosp-bathhouse-row",
    intro:
      "美国最特别的国家公园之一：它就在阿肯色州温泉市的老城中心。Hot Springs Mountain 山脚冒出 40 多处温泉，水温约 62°C（143°F），是约 4,000 年前落下的雨水渗进地下、被加热后再冒出来的。1832 年联邦政府就把这里划为保留地，比黄石还早 40 年；1921 年升为国家公园。主街 Central Avenue 旁的“浴场街”（Bathhouse Row）一排八座 1890–1920 年代的浴场，是当年全美最火的疗养胜地：现在 Fordyce 是游客中心和博物馆，Buckstaff 还照百年前的老规矩泡澡，Quapaw 改成了温泉池水疗馆，Superior 是用温泉水酿啤酒的啤酒厂。浴场背后的山上是约 42 公里步道和两条观景山路。",
    bestMonths: [3, 4, 5, 10, 11],
    seasonNote:
      "温泉一年四季都一样热，泡澡冬天最舒服。春天（3–5 月）山上的山茱萸、紫荆开花，10 月下旬到 11 月上旬红叶；6–8 月又热又湿，午后常有雷雨，体感温度超过 38°C 时户外讲解取消。城里节庆多（3 月圣帕特里克节有号称“世界最短”的游行），周末住宿更贵。",
    areas: {
      "bathhouse-row": "浴场街（Bathhouse Row · Central Avenue）",
      "hot-springs-mountain": "Hot Springs Mountain · North Mountain",
      "west-mountain": "West Mountain · Sugarloaf Mountain",
    },
    gateway: { nameZh: "Fordyce 浴场游客中心", lat: 34.51372, lon: -93.05347 },
    timeZone: "America/Chicago",
    airports: ["LIT", "MEM"],
    nonresidentSurcharge: false,
    lodgingTip:
      "公园就在城里，住处很多。想走路逛浴场街的住老城：浴场街北头的 Arlington Resort Hotel（1924 年的老酒店，正对浴场街）或者浴场街里 Hale 浴场改的 Hotel Hale（只有 9 间房，房间浴缸放的就是温泉水）。连锁酒店集中在城南 Central Avenue 往 Lake Hamilton 的一路上，停车方便、便宜；Lake Hamilton、Lake Ouachita 湖边有很多整套湖景民宿。园内唯一的营地 Gulpha Gorge 在城东，40 个带水电和排污的房车营位，全部要在 Recreation.gov 预订。",
  },
```

- `nonresidentSurcharge: false`：进园免费，不在 2026 年收非居民附加费的 11 座公园里。
- `nearby`：现有公园里没有顺路的。新公园里，猛犸洞约 6 小时、圣路易斯拱门约 5.5 小时，都不算顺路，不写。
- `airports`：LIT（小石城，到温泉约 1 小时）、MEM（孟菲斯，约 3 小时）。达拉斯（DFW）约 4.5 小时，没收。

## airports.ts

```ts
  LIT: { code: "LIT", nameZh: "小石城比尔和希拉里·克林顿国家机场", city: "小石城", lat: 34.7294, lon: -92.2243 },
  MEM: { code: "MEM", nameZh: "孟菲斯国际机场", city: "孟菲斯", lat: 35.0424, lon: -89.9767 },
```

## lodging.ts

```ts
  {
    id: "hosp-stay-arlington",
    park: "hosp",
    nameZh: "Arlington Resort Hotel（浴场街北头）",
    nameEn: "The Arlington Resort Hotel & Spa",
    inPark: false,
    lat: 34.51697,
    lon: -93.05249,
    note: "1924 年的老牌度假酒店，正对浴场街北头，走路几分钟到 Fordyce 游客中心和 Grand Promenade；有自己的温泉浴场。楼很老，房间新旧不一，价格中等。",
  },
  {
    id: "hosp-stay-hotel-hale",
    park: "hosp",
    nameZh: "Hotel Hale（浴场街里）",
    nameEn: "Hotel Hale",
    inPark: true,
    lat: 34.51452,
    lon: -93.05337,
    note: "浴场街上最老的 Hale 浴场（1892 年）改成的小酒店，只有 9 间房，每间的浴缸都通温泉水；在国家公园的地界里，房间少、价格高，周末要早订。",
  },
  {
    id: "hosp-stay-downtown",
    park: "hosp",
    nameZh: "温泉市老城一带",
    nameEn: "Downtown Hot Springs, AR",
    inPark: false,
    lat: 34.5115,
    lon: -93.0545,
    note: "浴场街对面和南边几条街的精品酒店、汽车旅馆和民宿，走路就到浴场和餐馆；周末、节庆时价格涨得多，老城停车要找公共停车楼。",
    airbnb: "Hot Springs, AR",
  },
  {
    id: "hosp-stay-lake-hamilton",
    park: "hosp",
    nameZh: "Lake Hamilton 湖边（城南）",
    nameEn: "Lake Hamilton, Hot Springs",
    inPark: false,
    lat: 34.4637,
    lon: -93.0866,
    note: "城南约 15 分钟的湖区，连锁酒店沿 Central Avenue（AR-7）一路排开，湖边有大量带码头的整套民宿，适合一家人、想划船的；去浴场街开车 15–20 分钟。",
    rental: true,
    airbnb: "Lake Hamilton, AR",
  },
```

- Hotel Hale 在国家公园地界里（浴场街的建筑都是 NPS 的，Hale 是租给私人经营的），所以写 `inPark: true`；主对话觉得不合适可以改成 false。
- Lake Hamilton 的坐标是湖北岸 AR-7 一带，按地图估的，合并前可以用 Nominatim 再核一下。

`campgrounds.ts` 里还没有温泉的营地：Gulpha Gorge Campground（Recreation.gov 247559，34.523509, -93.036279）。

## lodging-seasons.ts

不用写：都是全年营业的城市旅馆。

## bookings.ts

```ts
  {
    id: "hosp-gulpha-gorge-campground",
    park: "hosp",
    targets: [],
    places: ["Gulpha Gorge Campground"],
    kind: "campground",
    titleZh: "Gulpha Gorge 营地",
    window: { type: "rolling", months: 6, time: "10:00", tz: "America/New_York" },
    url: "https://www.recreation.gov/camping/campgrounds/247559",
    noteZh:
      "园内唯一的营地，40 个营位（帐篷、房车都行，不是直通车位），每个都有 30/50 安培电、水和排污，$34/晚，全部要在 Recreation.gov 提前订（无障碍营位只提前一周开放）。最多连住 14 晚、一年最多 30 晚。提前多久开放官方页面没写，按 Recreation.gov 的一般规则 6 个月写。",
    source: "https://www.nps.gov/hosp/planyourvisit/campground.htm",
    verified: "2026-10-20",
  },
```

- **Buckstaff 泡澡不能预约**（只接待现场来的，先到先得），所以不写进 bookings；写在景点 permit 里。
- Quapaw 的温泉池、水疗服务网站上能订，没查到要提前多久，不写。

## activities.ts

```ts
  {
    park: "hosp",
    nameZh: "浴场街护林员讲解",
    nameEn: "Bathhouse Row Outdoor Walk",
    months: [3, 4, 5, 6, 7, 8, 11, 12],
    summary: "护林员带着沿浴场街走约 45 分钟，讲温泉怎么来、浴场街当年怎么从帐篷澡堂变成全美最火的疗养地，顺路看温泉出水口和热水瀑布。",
    booking:
      "免费、不用预约，在 Fordyce 游客中心集合。2026 年的时间：春季（3–5 月）每天 10:30，夏季（6–8 月）每天 10:00、11:30，冬季（11–3 月）每天 14:00；体感温度到 38°C（华氏 100 度）时取消。秋季（9–10 月）的时间页面没写，到游客中心问。",
    url: "https://www.nps.gov/hosp/planyourvisit/guidedtours.htm",
    attraction: "hosp-fordyce",
  },
  {
    park: "hosp",
    nameZh: "圣帕特里克节“世界最短游行”",
    nameEn: "World's Shortest St. Patrick's Day Parade",
    months: [3],
    summary: "每年 3 月 17 日在老城 Bridge Street 上举行，整条街只有约 30 米长，号称世界上最短的圣帕特里克节游行，满街是穿绿衣服的人和各种奇怪的游行方队。",
    booking: "免费，在浴场街南头的 Bridge Street；当天老城停车和住宿都很紧张。",
  },
```

（第二条的“约 30 米”是常见说法，官方页面这次没查，主对话可以不收这条。）

## tours.ts

不收：护林员讲解不用预约、时间写在 activities 里；Buckstaff 是分上下午两段接待，不是班次。

## closures.ts

没有查到临时关闭。conditions 页面（2025-07-21 更新）没有列关闭；NPS alerts 接口这次被限流，没拉到（见“拿不准的”）。

## parking.ts

不收：官方没写几点停满。老城停车：浴场街对面有市政停车楼，Central Avenue 路边按时收费（这个是常识，没另查来源）。

## time-notes.ts

没有时区的坑（阿肯色全州中部时间）。

## 门票

- 进园、Fordyce 游客中心、步道、观景山路都免费。
- 要另付钱的都是私营的：Buckstaff 泡澡（价格官网没写，到现场看）、Quapaw 温泉池和水疗、Hot Springs Mountain Tower（成人 12–54 岁 $13、55 岁以上 $12、5–11 岁 $6.50、4 岁以下免费，9:00–18:00，17:30 停止售票）。国家公园年卡都不能抵。
- 营地 $34/晚。

## 荣誉

不是世界遗产、不是国际暗夜公园（在城里）。浴场街是国家历史地标区（National Historic Landmark District），honors.ts 没有这一类。

## 其他

- 温泉水能喝：浴场街一带有几处热水取水龙头（jug fountains），当地人提着大桶来灌；另有冷泉水龙头。水是热的，给孩子喝先放凉。
- 不能在温泉出水口泡脚、下水：露天的温泉都是展示用的，只能在 Buckstaff、Quapaw 这些浴场里泡。
- Superior 浴场改的啤酒厂用温泉水酿酒，Ozark 浴场展出驻园艺术家的作品，Lamar 浴场是公园商店（Bathhouse Row Emporium）。

## 拿不准的

- **Fordyce 游客中心开放时间**：NPS 一个旧页面写每天 9:00–17:00（感恩节、圣诞、元旦关）；2025 年 3 月的 NPS 公告写从 3 月 4 日起每周二、周三关闭，只开周四到周一 9:00–17:00，“直到另行通知”。2026 年是不是还这样没确认（basicinfo 页面的时间是 JS 加载的，NPS 游客中心接口这次被限流）。景点按 9:00–17:00 写，tips 里提醒周二周三可能关。
- 公园户外区域（步道、泉、取水龙头）的开放时间：一条公告写 6:00–22:00，没在别的官方页面确认；两条观景山路几点关大门也没查到。
- Quapaw 的营业时间只在网站的聊天窗口里看到（周三到周一 10:00–18:00，周二休），价格没写。
- Buckstaff 泡澡的价格、年龄要求官网没写；需要先确认是否接待小孩。
- 九座浴场还是八座：Things To Do 页写“nine historic bathhouses”，常说的浴场街是八座（Superior、Hale、Maurice、Fordyce、Quapaw、Ozark、Buckstaff、Lamar），第九座可能算的是浴场街外的 Libbey 或 Moody 之类，没细查。文案写“一排八座”。
- Goat Rock 步道起点（North Mountain 观景停车场）的坐标是按 OSM 上的一个停车场推测的。
- NPS alerts 接口被限流，2026-10-20 没能拉到温泉的公告。
