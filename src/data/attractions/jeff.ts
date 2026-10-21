import type { Attraction } from "./types";

// 圣路易斯拱门在市中心的密西西比河边，景点都在几个街区里，走路就能串起来：拱门和地下的游客中心 / 博物馆（入口在西边 4th Street 一侧），
// 西边隔几个街区是 Old Courthouse，东边台阶下去是河滨的 Leonor K. Sullivan 大道和游船码头。公园没有自己的停车场，停附近的收费停车楼。
// 拱门草地、博物馆、Old Courthouse 免费；电车、纪录片、游船由 Gateway Arch Park Foundation 的 gatewayarch.com 卖票。
// 时间按 NPS hours 页面（2026-02-17 更新）；电车按 gatewayarch.com。坐标按 OSM（Nominatim，2026-10-20 查）。
const VC = { lat: 38.62501, lon: -90.18653 };
const VC_WALK = { lat: 38.62501, lon: -90.18653, nameZh: "拱门游客中心（西侧 4th Street 入口，停附近的收费停车楼）" };

export const gatewayArch: Attraction[] = [
  {
    id: "jeff-tram",
    park: "jeff",
    nameZh: "坐电车上拱门顶",
    nameEn: "Tram Ride to the Top",
    kind: "experience",
    area: "arch",
    lat: 38.6246,
    lon: -90.18498,
    start: VC_WALK,
    durationMin: 60,
    // 游客中心 9:00–18:00（夏天周五、周六到 20:00），最后一班电车在关门前 1 小时
    hours: [{ open: "09:00", lastEntry: "17:00", close: "18:00" }],
    permit:
      "分时段的电车票在 gatewayarch.com、电话 877-982-1410 或游客中心售票处买：成人（16 岁以上）$15–19、3–15 岁 $11–15，持国家公园年卡 $12–16，价格随日期浮动。夏天和节假日常提前卖光，官方强烈建议提前订；当天的票 9 点起卖、不保证有",
    mustSee: true,
    summary:
      "拱门的两条腿里各藏着一串五人一个的小蛋形车舱，像摩天轮和电梯的混合体，一路晃悠悠地沿着弧线爬上 192 米高的拱顶。顶上是一条窄窄的弧形观景廊，从一排小窗户往东看密西西比河和伊利诺伊的平原，往西看整个圣路易斯市中心和老法院的圆顶。从排队到下来约 45–60 分钟，顶上最多待 10 分钟。",
    tips: [
      "进游客中心要过安检，留 15 分钟以上；按票上的时间提前到电车入口排队",
      "车舱很挤、很矮，幽闭恐惧、个子很高的人慎重；全程至少要走 96 级台阶、大部分时间站着，轮椅、助行器、婴儿车都不能带上去",
      "上午第一批和傍晚人少；阵亡将士纪念日到劳动节的周五、周六开到晚上 8 点，最后一班电车 7 点",
    ],
    photoFile: "Gateway Arch tram car.JPG",
  },
  {
    id: "jeff-museum",
    park: "jeff",
    nameZh: "拱门下的博物馆",
    nameEn: "Museum at the Gateway Arch",
    kind: "visitor",
    area: "arch",
    lat: VC.lat,
    lon: VC.lon,
    start: VC_WALK,
    durationMin: 75,
    hours: [{ open: "09:00", close: "18:00" }],
    mustSee: true,
    summary:
      "拱门两条腿之间的地下，免费、不用票的博物馆：六个展厅按时间讲 1764 年建城、路易斯安那购地、刘易斯与克拉克西行、拓荒者和原住民的遭遇，一直到 1960 年代怎么造这座拱门，有很多能动手摸的展品。旁边的小影院放 35 分钟的建造纪录片，看完再坐电车上去更有感觉。",
    tips: [
      "纪录片要买票（成人 $7、3–15 岁 $3、持年卡 $4），可以和电车买套票",
      "有触摸展品、盲文说明和助听设备，能免费借轮椅",
      "商店在博物馆关门前约 15 分钟关；咖啡馆 9:00–16:00（夏天延长时到 18:00）",
    ],
    photoFile: "Gateway Arch, Gateway Arch National Park, St. Louis, MO.jpg",
  },
  {
    id: "jeff-arch-grounds",
    park: "jeff",
    nameZh: "拱门草地和倒影池",
    nameEn: "Gateway Arch Grounds",
    kind: "landmark",
    area: "arch",
    lat: 38.62451,
    lon: -90.18568,
    durationMin: 40,
    bestTime: ["sunrise", "sunset"],
    summary:
      "站在拱门脚下仰头看，才能感觉到它有多大：不锈钢外皮的弧线一直伸到天上，阳光一变颜色就跟着变。拱门周围是沙里宁和景观设计师一起规划的草地、林荫道和两个倒影池，早上太阳从河对面升起、傍晚夕阳照在拱门上的时候最好看。",
    tips: [
      "园区 5:00–23:00 开放，比游客中心早开晚关，适合早上散步、晚上看灯光",
      "拍全景可以走到西边的 Luther Ely Smith 广场或 Kiener Plaza，正对着拱门",
      "铺装步道全部无障碍，从街面有坡道上来",
    ],
    photoFile: "Gateway Arch - St. Louis - Missouri (17275578342).jpg",
  },
  {
    id: "jeff-old-courthouse",
    park: "jeff",
    nameZh: "老法院（Old Courthouse）",
    nameEn: "Old Courthouse",
    kind: "landmark",
    area: "downtown",
    lat: 38.62573,
    lon: -90.18935,
    durationMin: 60,
    hours: [{ open: "09:00", close: "17:00" }],
    summary:
      "拱门正西、带铜绿色圆顶的 19 世纪法院。1847 年和 1850 年，被奴役的德雷德·斯科特和妻子哈丽特在这里起诉要求自由，案子一路打到最高法院，判决激化了南北矛盾、成了内战的导火索之一；争取女性投票权的 Virginia Minor 案也从这里开始。2020–2025 年整修后重开，有四个新展厅和两间按原样布置的法庭，免费。",
    tips: [
      "大多数日子 14:15 左右有护林员讲解，不用票",
      "有电梯到二楼的法庭；东边的法庭无障碍，西边的门口有一级台阶",
      "从拱门游客中心走过来约 5 分钟，中间穿过 Luther Ely Smith 广场",
    ],
    photoFile: "Old St. Louis County Courthouse, Gateway Arch National Park, St. Louis, MO - 53057879019.jpg",
  },
  {
    id: "jeff-riverboat",
    park: "jeff",
    nameZh: "密西西比河游船",
    nameEn: "Gateway Arch Riverboats sightseeing cruise",
    kind: "experience",
    area: "riverfront",
    lat: 38.62313,
    lon: -90.18408,
    start: { lat: 38.62272, lon: -90.18366, nameZh: "拱门游船码头（Leonor K. Sullivan 大道旁的老码头）" },
    durationMin: 60,
    openMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    closedNote:
      "观光游船 3 月到 11 月每天开，12 月只有圣诞主题的游船（和圣诞老人唱歌、睡衣早餐之类），1–2 月不开。密西西比河涨水或者天气不好时也会停航。",
    bestTime: ["afternoon", "sunset"],
    permit: "在 gatewayarch.com 买票（成人 16–59 岁 $26、60 岁以上 $24、3–15 岁 $16，婴儿免费但也要拿票），可以和电车买套票；2 小时的晚餐游船要预订",
    summary:
      "坐仿 19 世纪明轮船样式的 Tom Sawyer 号，在密西西比河上开 1 小时：从河面上看拱门和市中心的天际线，船从 1874 年建成的 Eads 大桥底下经过，船上有讲解圣路易斯河港的历史。",
    tips: [
      "因天气、水位取消的不退钱，可以改期或换一年内有效的代金券",
      "码头在拱门东边的河边，从拱门草地走大台阶（约 65 级）或坡道下来；河边的老码头有收费停车场",
      "傍晚那班看夕阳照在拱门上最好",
    ],
    photoFile: "Arch from riverboat (17938061139).jpg",
  },
  {
    id: "jeff-riverfront",
    park: "jeff",
    nameZh: "河滨步道和 Eads 大桥",
    nameEn: "Riverfront Trail & Eads Bridge",
    kind: "viewpoint",
    area: "riverfront",
    lat: 38.62891,
    lon: -90.17887,
    start: { lat: 38.62945, lon: -90.18405, nameZh: "Laclede's Landing（MetroLink 站）" },
    durationMin: 45,
    bestTime: ["morning", "sunset"],
    summary:
      "拱门东边沿着密西西比河的 Leonor K. Sullivan 大道和河滨步道，北边是 1874 年建成的 Eads 大桥：世界上第一座大量用钢材建的大跨度拱桥，现在桥面上走车、走人，桥下层跑轻轨。走上桥往回看，拱门、河和市中心都在一个画面里；北边桥头的 Laclede's Landing 是 19 世纪留下来的仓库区，石子路两边是餐馆和酒吧。",
    tips: [
      "Eads 大桥的人行道能一直走到伊利诺伊那头，往返约 3 公里，风大",
      "河水上涨时河边的大道和老码头会被淹、封路，看拱门草地上的告示",
      "从拱门草地有两条无障碍坡道下到河边大道",
    ],
    photoFile: "Gateway Arch & St. Louis MO Riverfront at Dawn.jpg",
  },
];
