# cong 康加里 Congaree 调研记录（2026-10-20）

新公园。景点文件 `src/data/attractions/cong.ts`（导出名 `congaree`），同行适合度 `src/data/suitability/cong.ts`。所有来源都是 2026-10-20 查的。

## 主要来源

- 步道表（长度、难度、开没开；页面 2026-07-10 更新）：https://www.nps.gov/cong/planyourvisit/Trail-Information.htm
- 现况、洪水（页面 2026-07-20 更新）：https://www.nps.gov/cong/planyourvisit/conditions.htm
- 划船、导览公司：https://www.nps.gov/cong/planyourvisit/canoeing.htm
- 营地：https://www.nps.gov/cong/planyourvisit/camping.htm
- 无障碍：https://www.nps.gov/cong/planyourvisit/accessibility.htm
- 同步萤火虫 2026：https://www.nps.gov/cong/learn/nature/synchronous-fireflies-at-congaree.htm 和 Recreation.gov 抽签页 https://www.recreation.gov/ticket/facility/300008 （接口里的说明：每晚限 145 辆车，活动期间大门 16:30 起只出不进，19:00 起持证的进观赏区）
- NPS alerts 接口（2026-10-20 拉取，3 条：Cedar Creek 倒树、偏远步道要用 GPS、来这里要自己安排回程车）
- NPS 游客中心接口（Harry Hampton 游客中心每天 9:00–17:00，元旦、总统日、哥伦布日、感恩节、圣诞节关）
- 坐标：游客中心、木栈道、步道按 OSM（Nominatim、Overpass，2026-10-20 查）；Recreation.gov 接口给的营地坐标

## parks.ts 条目

```ts
  {
    code: "cong",
    nameZh: "康加里",
    nameEn: "Congaree",
    region: "south", // 新片区，见 maca.md
    tagline: "美国最高的阔叶老林和柏树沼泽",
    stateEn: "South Carolina",
    hero: "cong-boardwalk",
    intro:
      "南卡首府哥伦比亚东南约 30 分钟，Congaree 河和 Cedar Creek 的泛滥平原上保留着美国东南部面积最大的一片原始河漫滩阔叶林：没被砍过的火炬松、橡树、山核桃长到四五十米高，NPS 称这里是美国最高的落叶阔叶林；低洼处是膝根（cypress knees）密布的落羽杉、紫树沼泽。一年大约十次洪水把林子淹上，带来养分，也让这片地一直没被开发。大多数人走游客中心出发的约 4 公里高架木栈道，再往里走 Weston Lake 步道，或者跟导览公司在 Cedar Creek 上划独木舟；每年 5 月中旬还有同步闪光的萤火虫，要抽签才能进。",
    bestMonths: [3, 4, 5, 10, 11],
    seasonNote:
      "春秋最舒服：3–4 月树刚发芽、蚊子还少，10–11 月凉爽，11 月落羽杉变成铁锈红。5 月中旬是同步萤火虫季（要抽签）。6–9 月又热又闷，蚊子非常多（游客中心门口有个“蚊子指数表”），午后常有雷雨。一年约十次洪水会淹掉低处的步道和一部分木栈道，冬春最常见，出发前看公告。",
    areas: {
      "harry-hampton": "Harry Hampton 游客中心 · 木栈道",
      "cedar-creek": "Cedar Creek（South Cedar Creek 码头 · 划船）",
      east: "东区：Bates Ferry（US-601）",
    },
    gateway: { nameZh: "Harry Hampton 游客中心", lat: 33.82962, lon: -80.82337 },
    timeZone: "America/New_York",
    airports: ["CAE", "CLT", "CHS"],
    nonresidentSurcharge: false,
    lodgingTip:
      "园内没有旅馆，只有两个要预订、没有自来水的帐篷营地（Longleaf 能开车到停车场，Bluff 要背东西走约 1.6 公里）。多数人住西北约 30 分钟车程的哥伦比亚（Columbia）：市中心、大学一带和 I-77 沿线连锁酒店、餐馆最多，也有不少整套民宿；从园里开回市区路上几乎没有加油站和餐馆，进园前加满油、买好吃的。从机场来最方便的是哥伦比亚机场（CAE，到公园约 35 分钟）；从夏洛特（约 1 小时 45 分钟）或查尔斯顿（约 1 小时 45 分钟）开车过来也行。附近没有出租车和网约车，必须自己开车。",
  },
```

- `nonresidentSurcharge: false`：康加里不收门票（NPS 门票接口会查到“no entrance fee”），不在 2026 年收非居民附加费的 11 座公园里。
- `nearby`：现有公园里没有顺路的（大烟山约 3.5 小时、新河峡谷约 4.5 小时）。不写。
- `hero`：木栈道。

## airports.ts

```ts
  CAE: { code: "CAE", nameZh: "哥伦比亚都会机场", city: "哥伦比亚（南卡）", lat: 33.9388, lon: -81.1195 },
  CHS: { code: "CHS", nameZh: "查尔斯顿国际机场", city: "查尔斯顿（南卡）", lat: 32.8986, lon: -80.0405 },
```

CLT 已经有了。

## lodging.ts

```ts
  {
    id: "cong-stay-columbia",
    park: "cong",
    nameZh: "哥伦比亚（Columbia）市区",
    nameEn: "Columbia, SC",
    inPark: false,
    lat: 34.00075,
    lon: -81.03523,
    note: "南卡首府，到 Harry Hampton 游客中心约 30 分钟（约 32 公里）；市中心、南卡大学一带和 I-77 沿线连锁酒店、餐馆、大超市最多，价格稳定。公园周边几乎没有住处和餐馆，住这里最实际。",
    airbnb: "Columbia, SC",
  },
  {
    id: "cong-stay-columbia-southeast",
    park: "cong",
    nameZh: "哥伦比亚东南郊（I-77 / Garners Ferry Road 一带）",
    nameEn: "Southeast Columbia (I-77 / Garners Ferry Rd)",
    inPark: false,
    lat: 33.9682,
    lon: -80.9632,
    note: "I-77 和 Garners Ferry Road（US-76/378）一带的连锁酒店和整套民宿，比市中心离公园近约 10 分钟，停车方便；晚上看完萤火虫回来最省事。",
    rental: true,
    airbnb: "Columbia, SC",
  },
```

（东南郊的坐标是 I-77 与 Garners Ferry Road 交叉口附近，按地图估的，主对话合并前可以再用 Nominatim 核一下；只收一个哥伦比亚也行。）

`campgrounds.ts` 里还没有康加里的营地，Recreation.gov 上有：Longleaf Campground（10190876，33.8358, -80.828003）、Bluff Hike In Camping（10191039，33.832108, -80.815506）。主对话可以照 campgrounds.ts 的写法补上。

## lodging-seasons.ts

不用写：园外是城市，全年营业；营地页面没写季节（Longleaf 冬天水龙头会关）。

## bookings.ts

```ts
  {
    id: "cong-firefly-lottery",
    park: "cong",
    targets: ["cong-fireflies"],
    kind: "lottery",
    titleZh: "同步萤火虫观赏证抽签",
    applies: [{ from: "05-13", to: "05-20" }],
    window: {
      type: "seasonal-lottery",
      seasons: [{ visit: ["05-13", "05-20"], apply: ["04-07", "04-14"], results: "04-17" }],
      time: "10:00",
      tz: "America/New_York",
    },
    url: "https://www.recreation.gov/ticket/facility/300008",
    noteZh:
      "2026 年的观赏期是 5 月 13–20 日，每晚只放 145 辆车，观赏证在 Recreation.gov 抽签：4 月 7 日上午 10 点（美东）到 4 月 14 日上午 10 点申请，每户一份，申请费 $1 不退，4 月 17 日出结果。活动那几天下午 4:30 起公园大门只出不进，白天来的人要离开，持证的 19:00 起进观赏区。2027 年的日期一般 3 月底公布，按往年是 5 月中旬、4 月上旬抽签。",
    source: "https://www.nps.gov/cong/learn/nature/synchronous-fireflies-at-congaree.htm",
    verified: "2026-10-20",
  },
  {
    id: "cong-campgrounds",
    park: "cong",
    targets: [],
    places: ["Longleaf Campground", "Bluff Campground"],
    kind: "campground",
    titleZh: "Longleaf、Bluff 营地",
    window: { type: "rolling", months: 6, time: "10:00", tz: "America/New_York" },
    url: "https://www.recreation.gov/camping/campgrounds/10190876",
    noteZh:
      "两个营地都必须先在 Recreation.gov 订好（或打 877-444-6777）才能扎营，只能搭帐篷、吊床，不收房车。Longleaf 有 10 个普通营位（$15/晚）和 4 个团体营位（$25/晚），车停在砾石停车场、最远的营位走约 90 米，有旱厕、没有自来水；Bluff 在 Bluff 步道上，要从 Longleaf 或游客中心背东西走约 1.6 公里，6 个营位（$10/晚），没有厕所和水。提前多久能订官方没写，按 Recreation.gov 的一般规则（6 个月）写。野外露营要提前 72 小时以上发邮件到 cong_information@nps.gov 申请免费许可。",
    source: "https://www.nps.gov/cong/planyourvisit/camping.htm",
    verified: "2026-10-20",
  },
  {
    id: "cong-canoe-tours",
    park: "cong",
    targets: ["cong-cedar-creek-paddle"],
    kind: "tour",
    titleZh: "Cedar Creek 独木舟、皮划艇导览（导览公司）",
    window: { type: "anytime" },
    url: "https://www.nps.gov/cong/planyourvisit/canoeing.htm",
    noteZh:
      "公园不租船。想跟团的向哥伦比亚的导览公司预订：Palmetto Outdoor（独木舟，多数日子 11:00）、J.K. Adventure Guides（9:00、13:00）、Carolina Outdoor Adventures（皮划艇，每天 9:30，有满月夜划），都约 3 小时、在 South Cedar Creek 码头集合；春秋周末早点订。想自己划的在 River Runner Outdoor Center 租船（周一到周六 10:00–18:00 取船）。",
    source: "https://www.nps.gov/cong/planyourvisit/canoeing.htm",
    verified: "2026-10-20",
  },
```

## activities.ts

```ts
  {
    park: "cong",
    nameZh: "同步萤火虫",
    nameEn: "Synchronous fireflies",
    months: [5],
    summary:
      "每年 5 月中旬前后约两周，泛滥平原林子边上的一种萤火虫（Photuris frontalis）会成片同时一闪一闪，是世界上少数几种会同步闪光的萤火虫之一。天黑以后在游客中心附近的步道和木栈道上看，只能用红光手电、不能用闪光灯。",
    booking: "要抽签拿观赏证（每晚 145 辆车）：2026 年 4 月 7–14 日在 Recreation.gov 申请，4 月 17 日出结果，活动 5 月 13–20 日。",
    status: "2026 年的已经结束；2027 年的日期一般 3 月底公布。",
    url: "https://www.recreation.gov/ticket/facility/300008",
    attraction: "cong-fireflies",
  },
  {
    park: "cong",
    nameZh: "落羽杉秋色",
    nameEn: "Bald cypress fall color",
    months: [11],
    summary: "11 月落羽杉的针叶变成铁锈红、橙色，倒映在 Weston Lake 和 Cedar Creek 的黑水里，是划船、走木栈道最好看的时候，蚊子也少了。",
    booking: "不用预约。",
    attraction: "cong-weston-lake",
  },
```

## tours.ts

不收：独木舟导览是私营公司的，“多数日子”几点开，没有完整的固定班次（班次写在 bookings 的 noteZh 里）。

## closures.ts

没有整段关闭的景点。NPS 步道页 2026-07-10 更新时 11 条步道都写 OPEN；公告只有提醒（Cedar Creek 在 Bannister's Bridge 到 South Cedar Creek 之间有倒树、可能要扛船绕过，公告 2026-04-20；Oakridge、Boggy Gut、Kingsnake 不好认路、要带 GPS，公告 2025-11-20；Boggy Gut 很多倒树）。这些写在景点 tips 里了。

洪水是常态：conditions 页面说一年约十次，Cedar Creek 水位到约 8 英尺、Congaree 河（公园西界）到约 15 英尺就是洪水位，会淹掉木栈道低处的一段和所有偏远步道。不是临时关闭，写在景点 tips 里。

## parking.ts

不收：官方没写停车场几点满。

## time-notes.ts

没有时区的坑（美东时间，和哥伦比亚、夏洛特、查尔斯顿一样）。

## 门票

进园免费。营地 $10–25/晚；萤火虫抽签每份申请 $1。导览公司的划船团另收费。

## 荣誉

- 1983 年起是联合国教科文组织生物圈保护区（Congaree Biosphere Region），honors.ts 没有这一类，不用加。
- 不是世界遗产、不是国际暗夜公园。
- 公园里很多树是南卡、全美的“冠军树”（同种里最大的），这点 NPS 有专门页面，没细查数字，文案里没写具体高度。

## 其他

- 附近没有出租车、网约车，公交也常常停（NPS 公告）。必须自己开车。
- 园内只在游客中心有水；Longleaf 营地的水龙头冬天上冻时关。
- 蚊子：游客中心门口的“蚊子指数表”（Mosquito Meter）从 1（全无）到 6（战争状态），夏天常在 5–6，带驱蚊剂、穿长袖。

## 拿不准的

- 木栈道 2.6 英里（约 4.2 公里）是 NPS 步道表写的“round trip”，实际是一个环线（OSM 的路名也是 Boardwalk Loop）。高架的一段和贴地的低木栈道各占多少没查到；洪水时哪段先淹看公告。
- Kingsnake 步道表只写 12 英里，没写是不是往返；没收这条。
- Fork Swamp 步道 0.6 英里，位置（NPS 没写步道口）没查清，没收。
- Longleaf、Bluff 营地提前多久能订：官方页面和 Recreation.gov 接口都没写，按一般规则 6 个月写。
- 以前 NPS 有免费的护林员独木舟导览（Recreation.gov 抽签），现在划船页只列了私营导览公司，没提护林员导览，2026 年是否还有没查到。
- 东南郊住宿点的坐标是估的（见 lodging.ts）。
