# jeff 圣路易斯拱门 Gateway Arch 调研记录（2026-10-20）

新公园（协调者 10-20 追加）。景点文件 `src/data/attractions/jeff.ts`（导出名 `gatewayArch`），同行适合度 `src/data/suitability/jeff.ts`。所有来源都是 2026-10-20 查的。

## 主要来源

- 开放时间（页面 2026-02-17 更新）：https://www.nps.gov/jeff/planyourvisit/hours.htm （游客中心 / 博物馆每天 9:00–18:00，阵亡将士纪念日到劳动节的周五、周六开到 20:00；最后一班电车在关门前 1 小时；园区 5:00–23:00；Old Courthouse 9:00–17:00；感恩节、圣诞、元旦关）
- 现况（页面 2025-09-06 更新，没有关闭）：https://www.nps.gov/jeff/planyourvisit/conditions.htm
- 门票（电车、纪录片票价里含 $3 的国家公园门票，年卡持有人免这 $3、每张卡最多买 4 张）：https://www.nps.gov/jeff/planyourvisit/fees.htm
- Old Courthouse（2020–2025 年 2,450 万美元整修，2025 年 5 月四个新展厅开放；每天 14:15 左右有护林员讲解）：https://www.nps.gov/jeff/planyourvisit/och.htm
- 无障碍：https://www.nps.gov/jeff/planyourvisit/accessibility.htm
- 电车（五人一个的小舱、全程 45–60 分钟、顶上最多 10 分钟、至少走 96 级台阶、不许带轮椅和婴儿车）：https://www.gatewayarch.com/gateway-arch-national-park/tram-ride-to-the-top/
- 票价和套票、游船票价：https://www.gatewayarch.com/buy-tickets/
- 游船（3–11 月每天有观光游船，1 小时；停在鹅卵石老码头）：https://www.gatewayarch.com/riverfront/riverboat-cruises/
- 经营方：电车、纪录片、游船都由 Gateway Arch Park Foundation 的 gatewayarch.com 卖票（网站署名 Gateway Arch Park Foundation / Gateway Arch Riverboats），客服 877-982-1410
- 坐标：拱门、游客中心、Old Courthouse、游船码头按 OSM（Nominatim，2026-10-20 查）

## parks.ts 条目

```ts
  {
    code: "jeff",
    nameZh: "圣路易斯拱门",
    nameEn: "Gateway Arch",
    region: "greatlakes", // 新片区，见 maca.md；名字是“五大湖 · 中西部”，圣路易斯算中西部
    tagline: "密西西比河边 192 米高的不锈钢拱门",
    stateEn: "Missouri",
    hero: "jeff-tram",
    intro:
      "美国面积最小的国家公园（约 0.8 平方公里），在圣路易斯市中心的密西西比河边。主角是芬兰裔建筑师埃罗·沙里宁（Eero Saarinen）设计的大拱门：不锈钢外皮，高、宽都是 630 英尺（约 192 米），1965 年建成，是美国最高的人造纪念碑，纪念托马斯·杰斐逊和 19 世纪美国的西进扩张。坐拱门里面的小电车上到顶端，从小窗户往下看密西西比河和整座城；拱门底下是免费的博物馆，讲从原住民到路易斯安那购地、刘易斯与克拉克、拓荒者的西部故事。几个街区外的老法院（Old Courthouse）是 1847 年德雷德·斯科特（Dred Scott）争取自由的诉讼开始的地方。2018 年由“杰斐逊国家扩张纪念地”改名升为国家公园。",
    bestMonths: [4, 5, 9, 10],
    seasonNote:
      "全年都能去，室内为主。4–5 月、9–10 月最舒服；6–8 月又热又湿，电车票常提前卖光，暑假周末最挤；7 月 4 日前后 Fair Saint Louis 在拱门草地上办，人山人海。冬天冷、风大，但人少、电车好订。密西西比河涨水时河边的 Leonor K. Sullivan 大道和游船码头会被淹、游船停航。",
    areas: {
      arch: "拱门和地下博物馆",
      downtown: "老法院 · 市中心",
      riverfront: "河滨（游船码头 · Eads 大桥）",
    },
    gateway: { nameZh: "拱门游客中心（4th Street 入口）", lat: 38.62501, lon: -90.18653 },
    timeZone: "America/Chicago",
    airports: ["STL"],
    nonresidentSurcharge: false,
    lodgingTip:
      "就住圣路易斯市中心：拱门西边隔一条街的 Hyatt Regency St. Louis at the Arch 等几家酒店走路几分钟到游客中心，房间能看到拱门的要另外选；北边河边的老仓库区 Laclede's Landing、西边市中心 Washington Avenue 一带有更多酒店和整套公寓。市中心晚上部分街区比较冷清，住得离拱门近、走大路比较安心。公园没有自己的停车场，开车来停附近的收费停车楼（比如 Stadium East 停车楼）或河边老码头的收费停车场。从机场（STL）坐 MetroLink 轻轨到 8th & Pine 或 Laclede's Landing 站约 30 分钟，不用开车。",
  },
```

- `nonresidentSurcharge: false`：不在 2026 年收非居民附加费的 11 座公园里；门票只有电车、纪录片票价里含的 $3。
- `nearby`：现有公园里没有顺路的。新公园里，猛犸洞约 4.5 小时、印第安纳沙丘约 4.5 小时、温泉约 5.5 小时，都不写。
- `hero`：电车（照片用拱门全景）。也可以换成 `jeff-arch-grounds`。

## airports.ts

```ts
  STL: { code: "STL", nameZh: "圣路易斯兰伯特国际机场", city: "圣路易斯", lat: 38.7487, lon: -90.37 },
```

## lodging.ts

```ts
  {
    id: "jeff-stay-downtown",
    park: "jeff",
    nameZh: "圣路易斯市中心（拱门一带）",
    nameEn: "Downtown St. Louis near the Arch",
    inPark: false,
    lat: 38.62609,
    lon: -90.18774,
    note: "拱门西边、Old Courthouse 周围的几家大酒店（比如 Hyatt Regency St. Louis at the Arch），走路几分钟到游客中心和老法院；周末棒球季（Busch Stadium 就在南边）价格涨。",
  },
  {
    id: "jeff-stay-lacledes-landing",
    park: "jeff",
    nameZh: "Laclede's Landing 老仓库区",
    nameEn: "Laclede's Landing",
    inPark: false,
    lat: 38.63044,
    lon: -90.18415,
    note: "拱门北边、Eads 大桥下的 19 世纪仓库区，石子路、老砖楼里有酒店、酒吧和餐馆，走到拱门约 10 分钟；有 MetroLink 轻轨站，去机场方便。晚上酒吧街比较吵。",
    airbnb: "Downtown St. Louis, MO",
  },
```

## lodging-seasons.ts

不用写。

## bookings.ts

```ts
  {
    id: "jeff-tram-tickets",
    park: "jeff",
    targets: ["jeff-tram"],
    kind: "timed-entry",
    titleZh: "拱门电车票（分时段）",
    window: { type: "anytime" },
    url: "https://www.gatewayarch.com/buy-tickets/",
    noteZh:
      "上拱门顶的电车按场次卖票，在 gatewayarch.com、电话 877-982-1410 或游客中心售票处买：成人（16 岁以上）$15–19、3–15 岁 $11–15、2 岁以下免费，价格随日期浮动；持国家公园年卡的 $12–16（免掉票价里 $3 的门票，每张卡最多 4 张，网上选 National Park Pass Holder）。夏天和节假日常提前卖光，官方强烈建议提前订；当天的票早上 9 点起开卖，不保证有。提前多久开放没写。和纪录片、游船的套票也在同一个网站。",
    source: "https://www.nps.gov/jeff/planyourvisit/fees.htm",
    verified: "2026-10-20",
  },
  {
    id: "jeff-riverboat",
    park: "jeff",
    targets: ["jeff-riverboat"],
    kind: "tour",
    titleZh: "拱门游船（密西西比河观光）",
    applies: [{ from: "03-01", to: "11-30" }],
    window: { type: "anytime" },
    url: "https://www.gatewayarch.com/riverfront/riverboat-cruises/",
    noteZh:
      "3–11 月每天有 1 小时的观光游船（成人 16–59 岁 $26、60 岁以上 $24、3–15 岁 $16，婴儿免费但也要拿票），2 小时的晚餐、早午餐游船要预订；12 月只有节日主题的游船。网上买票能免排队。因为天气、水位取消的不退钱，可以改期或换一年内有效的代金券。",
    source: "https://www.gatewayarch.com/buy-tickets/",
    verified: "2026-10-20",
  },
```

## activities.ts

```ts
  {
    park: "jeff",
    nameZh: "Fair Saint Louis 独立日烟花",
    nameEn: "Fair Saint Louis",
    months: [7],
    summary: "每年 7 月 4 日前后在拱门草地和河边办的独立日节庆，有音乐会、游行和在拱门旁放的烟花，是圣路易斯一年里最热闹的几天。",
    booking: "大部分免费；那几天拱门周边交通管制、酒店很早订满，电车票也更难买。",
    status: "2026 年的日期和节目这次没查（不是公园办的），2027 年看 Fair Saint Louis 官网。",
  },
  {
    park: "jeff",
    nameZh: "Old Courthouse 护林员讲解",
    nameEn: "Old Courthouse ranger tour",
    summary: "护林员带着参观老法院，讲德雷德·斯科特诉讼、19 世纪圣路易斯的奴隶拍卖和女性争取投票权的案子。",
    booking: "免费、不用票，大多数日子 14:15 开始（偶尔取消）；10 人以上的团体打 877-982-1410 预约。",
    url: "https://www.nps.gov/jeff/planyourvisit/och.htm",
    attraction: "jeff-old-courthouse",
  },
```

## tours.ts

不收：电车是分时段滚动发车（几分钟一班），不是固定班次；游船的班次官网没列。

## closures.ts

没有查到临时关闭（conditions 页面 2025-09-06 更新时没有列关闭；NPS alerts 接口被限流）。密西西比河涨水时河边的 Leonor K. Sullivan 大道会封、游船停航，是常有的事，写在景点 tips 里。

## parking.ts

不收：公园没有自己的停车场。

## time-notes.ts

没有时区的坑（密苏里中部时间）。

## 门票

- 拱门草地、地下博物馆、Old Courthouse 免费，不用票。
- 电车票、纪录片票（35 分钟的建造纪录片，成人 $7、3–15 岁 $3、年卡持有人 $4）里含 $3 的国家公园门票（16 岁以上）；持国家公园年卡的免这 $3。
- 套票：电车 + 纪录片 $19–23；电车 + 纪录片 + VR $26–30；电车 + 1 小时游船 $39–43；全套（电车、纪录片、VR、游船）$50–54。
- 所有人进游客中心都要过安检，留出 15 分钟以上；不许带武器（包括防狼喷雾、固定刃的刀）。

## 荣誉

不是世界遗产、不是国际暗夜公园（在城里）。

## 其他

- 电车：五人一个的小舱，坐的是 1967 年开始用的老电车，空间很挤，幽闭恐惧、个子很高的人慎重；上下各约 4 分钟（官网写时速约 3.86 英里，全程 45–60 分钟含排队），顶上观景台最多停 10 分钟，窗户很小。
- 拱门顶不能坐轮椅、不能带婴儿车：全程至少要走 96 级台阶（一次最多 28 级），大部分时间站着。
- 河边去拱门草地：Leonor K. Sullivan 大道有两条无障碍坡道和一道约 65 级的大台阶。
- 能免费借轮椅（普通的和加宽的，押州身份证件）。

## 拿不准的

- 电车票提前多久开售：官网和 NPS 都没写。
- 游船的具体班次（几点开）官网没列；2026 年 11 月以后是不是照常开、冬天节日游船几号开始没查。
- 河对岸东圣路易斯的 Malcolm W. Martin 公园有正对拱门的观景台，是很有名的拍拱门全景的地方，但这次没查到它 2026 年的开放情况，没收成景点。
- “上下各约 4 分钟”是常见说法，官网只写了时速和全程时间。
- Stadium East 停车楼的坐标没查到（Overpass 超时），lodgingTip 里只写了名字。
- Old Courthouse 的西侧法庭门口有一级台阶，东侧法庭无障碍（无障碍页）。
- NPS alerts 接口被限流，没拉到公告。
