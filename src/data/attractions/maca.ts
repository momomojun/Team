import type { Attraction } from "./types";

// 猛犸洞不收门票，进洞只能跟护林员的导览团（要买票，Recreation.gov 或游客中心），导览大多从游客中心出发：
// Historic、Mammoth Passage、Violet City 走路下到游客中心旁的历史入口；Frozen Niagara、Domes & Dripstones、Grand Avenue、
// Great Onyx 先坐公园的大巴（10 分钟左右）到别的洞口。所以导览类景点的 start 都是游客中心停车场，位置画在实际进洞的洞口。
// 导览时长、距离、台阶、年龄按 NPS Explore All Tours 页面（2026-10-20 查）。导览班次每段日期、平日周末都不同，
// 而且只提前 1–3 个月公布，没收进 tours.ts（见 docs/archive/audit/2026-10-20/maca.md）。
// 坐标：游客中心、洞口、步道、渡口按 OSM（Nominatim）；停车场按 OSM（Overpass），2026-10-20 查。
// 2026 年 10 月的现况（NPS alerts）：Green River 渡轮 9 月初起因水位低停运；无障碍导览的电梯故障、导览暂停；
// Heritage、Old Guides、Sunset Point 步道和 Sinkhole 步道的一部分整修关闭。
const VC = { lat: 37.18702, lon: -86.10128 };
const VC_PARKING = { lat: 37.18795, lon: -86.10105, nameZh: "猛犸洞游客中心停车场（导览在游客中心集合）" };
const HISTORIC_ENTRANCE = { lat: 37.18729, lon: -86.10342 };
const FROZEN_NIAGARA_ENTRANCE = { lat: 37.14945, lon: -86.05805 };
const CARMICHAEL_ENTRANCE = { lat: 37.16732, lon: -86.09209 };
const GREEN_RIVER_FERRY = { lat: 37.17955, lon: -86.1124 };
const TOUR_PERMIT =
  "导览票在 Recreation.gov 预订（或打 877-444-6777），公园常到出发前 1–3 个月才放出那段时间的班次，夏天和节假日热门场次提前几周卖光；当天游客中心卖剩下的票，不保证有。提前 30 分钟到游客中心取票";

export const mammothCave: Attraction[] = [
  {
    id: "maca-visitor-center",
    park: "maca",
    nameZh: "猛犸洞游客中心和历史入口",
    nameEn: "Mammoth Cave Visitor Center & Historic Entrance",
    kind: "visitor",
    area: "visitor-center",
    lat: VC.lat,
    lon: VC.lon,
    start: VC_PARKING,
    durationMin: 45,
    // NPS 游客中心接口：标准时间 8:30–16:30，春季 8:00–17:30、夏季 8:00–18:30；圣诞节关闭
    hours: [
      { open: "08:00", close: "18:30", months: [4, 5, 6, 7] },
      { open: "08:30", close: "16:30" },
    ],
    mustSee: true,
    summary:
      "所有导览的集合点：买票取票、看洞穴怎么形成和 4,000 多年来人在洞里活动的展览。从游客中心后面沿步道往下走约 300 米，就是历史入口（Historic Entrance）——一个长满蕨类的石灰岩大洞口，夏天站在洞口能感到洞里吹出来的凉风；不跟团也能走到洞口看看。",
    tips: [
      "就算不进洞，也可以从历史入口接 River Styx Spring 步道下到 Green 河边，看地下河从山里流出来的地方（来回约 1.2 公里）",
      "去游客中心不要只靠手机导航：从 I-65 的 53 号（Cave City）出口走 KY-70，或 48 号（Park City）出口走 KY-255 进园",
      "游客中心旁边就是园内旅馆、餐厅、营地商店和邮局；游客中心一带的 Heritage、Sunset Point 步道 2026 年在整修关闭",
    ],
    photoFile: "Mammoth Cave Historic Entrance.jpg",
  },
  {
    id: "maca-historic-tour",
    park: "maca",
    nameZh: "历史导览（Historic Tour）",
    nameEn: "Historic Tour",
    kind: "experience",
    area: "visitor-center",
    lat: HISTORIC_ENTRANCE.lat,
    lon: HISTORIC_ENTRANCE.lon,
    start: VC_PARKING,
    durationMin: 120,
    hike: { distanceMi: 2, difficulty: "moderate" },
    openMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    closedNote:
      "2026–27 年冬天的班次表里，Historic 只开到 11 月 14 日，11 月中到 2 月改开 Broadway（同样从历史入口进，看圆形大厅、硝石矿遗迹和巨人棺材石，约 2.8 公里、160 级台阶）、Mammoth Passage 和 Frozen Niagara、Domes & Dripstones。3 月以后的班次公园要到出发前 1–3 个月才公布。",
    permit: TOUR_PERMIT,
    mustSee: true,
    summary:
      "最经典的一条线：从历史入口走进洞，穿过让这个洞得名的巨大洞厅和 19 世纪的硝石矿遗址，再钻进越来越窄的深处——侧着身挤过“胖子的苦恼”（Fat Man's Misery）弯弯曲曲的窄缝，弯腰走过“高个子的烦恼”（Tall Man's Agony），最后爬 155 级台阶上到高约 60 米的猛犸穹顶（Mammoth Dome）。约 3.2 公里、540 级台阶。",
    tips: [
      "成人 $24、6–12 岁 $18、3–5 岁 $6；想多看 1840 年代洞里的肺结核病房遗迹可以订 Extended Historic（2 小时 15 分，$27）",
      "洞里常年约 12°C，夏天也要带外套；穿防滑的运动鞋，台阶湿滑",
      "不许带婴儿背架、婴儿车和大背包，不能用闪光灯；出洞后所有人都要踩消毒垫（防蝙蝠白鼻综合征）",
    ],
    photoFile: "Mammoth Dome, Mammoth Cave, Mammoth Cave National Park, Mammoth Cave, KY.jpg",
  },
  {
    id: "maca-domes-dripstones",
    park: "maca",
    nameZh: "穹顶与钟乳石导览（Domes & Dripstones）",
    nameEn: "Domes and Dripstones Tour",
    kind: "experience",
    area: "frozen-niagara",
    lat: FROZEN_NIAGARA_ENTRANCE.lat,
    lon: FROZEN_NIAGARA_ENTRANCE.lon,
    start: VC_PARKING,
    durationMin: 120,
    hike: { distanceMi: 0.75, difficulty: "hard" },
    permit: TOUR_PERMIT,
    mustSee: true,
    summary:
      "坐大巴到东南边的 New Entrance，从一个落水洞（sinkhole）底下沿陡峭的台阶一口气下去约 280 级，经过好几个高高的竖井穹顶和塌落的巨石堆，最后到洞里钟乳石最集中的 Frozen Niagara：一道像结冰瀑布一样的石瀑布。约 1.2 公里、640 级台阶，全年都开，冬天每天只剩一两场。",
    tips: [
      "开头下台阶很陡、中途没有别的出口，膝盖不好、怕高的人改订 Frozen Niagara（只有 64 级台阶）",
      "成人 $30、6–12 岁 $25、3–5 岁 $8；洞里没有厕所，出发前在游客中心上好",
      "冬天（2026 年 11 月底到 2027 年 2 月）每天只有 14:15 一场（12 月周六日加 10:30），很容易满",
    ],
    photoFile: "Travertine flowstone (Frozen Niagara, Mammoth Cave, Kentucky, USA) 2 (38230671124).jpg",
  },
  {
    id: "maca-frozen-niagara",
    park: "maca",
    nameZh: "Frozen Niagara 导览",
    nameEn: "Frozen Niagara Tour",
    kind: "experience",
    area: "frozen-niagara",
    lat: FROZEN_NIAGARA_ENTRANCE.lat,
    lon: FROZEN_NIAGARA_ENTRANCE.lon,
    start: VC_PARKING,
    durationMin: 75,
    hike: { distanceMi: 0.25, difficulty: "easy" },
    permit: TOUR_PERMIT,
    summary:
      "最轻松的看钟乳石的线：坐大巴到 Frozen Niagara 洞口，只走约 400 米、64 级台阶，就能看到石瀑布、钟乳石和石笋；想再往下看帷幕厅（Drapery Room）的可以多走 98 级可选的台阶。适合带小孩和老人，全年都开。",
    tips: [
      "成人 $26、6–12 岁 $22、3–5 岁 $7；每场只有 38 人，常比大线先卖光",
      "猛犸洞大部分地方是干燥的大通道，钟乳石只在这一带，时间只够一条线又想看钟乳石的选这条或 Domes & Dripstones",
    ],
    photoFile: "Travertine flowstone (Frozen Niagara, Mammoth Cave, Kentucky, USA) 1 (38230617984).jpg",
  },
  {
    id: "maca-mammoth-passage",
    park: "maca",
    nameZh: "猛犸通道导览（Mammoth Passage）",
    nameEn: "Mammoth Passage Tour",
    kind: "experience",
    area: "visitor-center",
    lat: HISTORIC_ENTRANCE.lat,
    lon: HISTORIC_ENTRANCE.lon,
    start: VC_PARKING,
    durationMin: 75,
    hike: { distanceMi: 0.75, difficulty: "easy" },
    permit: TOUR_PERMIT,
    summary:
      "最短、最便宜的护林员导览：从历史入口进去，看圆形大厅（Rotunda）这类最大的洞厅和早期探洞人、硝石矿留下的东西，约 1.2 公里、135 级台阶。这一段没有钟乳石。时间少、带小孩的入门首选；有的日子还开自助走同一段的 Discovery Tour（30 分钟，$12）。",
    tips: [
      "成人 $15、6–12 岁 $13、3–5 岁 $4",
      "进出洞口要走一段陡的户外山坡路，回程是上坡",
    ],
    photoFile: "Rotunda, Mammoth Cave, Mammoth Cave National Park, Mammoth Cave, KY.jpg",
  },
  {
    id: "maca-grand-avenue",
    park: "maca",
    nameZh: "大道导览（Grand Avenue）",
    nameEn: "Grand Avenue Tour",
    kind: "experience",
    area: "frozen-niagara",
    lat: CARMICHAEL_ENTRANCE.lat,
    lon: CARMICHAEL_ENTRANCE.lon,
    start: VC_PARKING,
    durationMin: 240,
    hike: { distanceMi: 4, difficulty: "hard" },
    permit: TOUR_PERMIT,
    summary:
      "最长的常规导览，4 小时走约 6.4 公里：从 Carmichael 入口进去，穿过管子一样的圆形通道、闪着石膏结晶的 Cleaveland Avenue、又窄又高的峡谷通道，最后到 Frozen Niagara 出洞，钟乳石和干燥大通道都看得到。全程 1,521 级台阶、好几段陡坡，中途在洞里有厕所的地方歇一下。",
    tips: [
      "6 岁以上才能参加；成人 $42、6–12 岁 $34",
      "冬天也开（2026–27 冬季每天 9:15），夏天常是一天里最先卖光的大线",
      "带水和一点吃的；体力一般的分成两条短线（Historic + Frozen Niagara）看",
    ],
    photoFile: "Gypsum speleothem (Cleaveland Avenue, Mammoth Cave, Kentucky, USA) 4 (24066441698).jpg",
  },
  {
    id: "maca-great-onyx-lantern",
    park: "maca",
    nameZh: "Great Onyx 洞提灯导览",
    nameEn: "Great Onyx Lantern Tour",
    kind: "experience",
    area: "flint-ridge",
    lat: 37.21904,
    lon: -86.07813,
    start: VC_PARKING,
    durationMin: 135,
    hike: { distanceMi: 1, difficulty: "moderate" },
    openMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    closedNote:
      "2026–27 年冬天的班次只开到 11 月 28 日（11 月中以后只有周四到周日），12 月到 2 月不开；3 月以后的班次要到出发前 1–3 个月才公布。冬天想看钟乳石改订 Frozen Niagara 或 Domes & Dripstones。",
    permit: TOUR_PERMIT,
    summary:
      "坐大巴到 Green 河北岸的 Flint Ridge，进一个和猛犸洞主系统不相连的独立洞穴。洞里没有电灯，大家提着煤油灯走：灯光下的钟乳石、石笋、石膏花和卷曲的“石枝”（helictite）比主洞里多得多，是很多人最喜欢的一条线。约 1.6 公里、82 级台阶。",
    tips: [
      "6 岁以上才能参加；成人 $31、6–12 岁 $26；只有 16 岁以上的人能提灯",
      "Flint Ridge 就在游客中心北边，坐车过去要绕路，单程 20 分钟左右（含在导览时间里）",
    ],
    photoFile: "Great Onyx Cave Kentucky.jpg",
  },
  {
    id: "maca-violet-city-lantern",
    park: "maca",
    nameZh: "紫罗兰城提灯导览（Violet City）",
    nameEn: "Violet City Lantern Tour",
    kind: "experience",
    area: "visitor-center",
    lat: HISTORIC_ENTRANCE.lat,
    lon: HISTORIC_ENTRANCE.lon,
    start: VC_PARKING,
    durationMin: 180,
    hike: { distanceMi: 3, difficulty: "hard" },
    openMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    closedNote:
      "2026–27 年冬天只在 11 月 14 日前的周六、周日 14:00 开，11 月中到 2 月不开；春夏的班次要到出发前 1–3 个月才公布。",
    permit: TOUR_PERMIT,
    summary:
      "关掉洞里的电灯，只靠手里的煤油灯走 3 小时、约 4.8 公里：沿着 19 世纪游客走的路线穿过又宽又高的主通道，看史前人留下的火把痕迹、硝石矿和老游客的烟熏签名，最后从 Violet City 入口出洞、坐大巴回来。路面是土路，有不少没有扶手的陡坡。",
    tips: [
      "6 岁以上才能参加；成人 $32、6–12 岁 $27；只有 16 岁以上的人能提灯，不许带手电",
      "灯光暗、路面不平，看不清脚下的老人和小孩慎重",
    ],
    photoFile: "Violet City Sinkhole (Mammoth Cave Ridge, Kentucky, USA) 1.jpg",
  },
  {
    id: "maca-wild-cave",
    park: "maca",
    nameZh: "野洞探险（Wild Cave Tour）",
    nameEn: "Wild Cave Tour",
    kind: "experience",
    area: "frozen-niagara",
    lat: CARMICHAEL_ENTRANCE.lat,
    lon: CARMICHAEL_ENTRANCE.lon,
    start: VC_PARKING,
    durationMin: 360,
    hike: { distanceMi: 5, difficulty: "hard" },
    permit:
      "Recreation.gov 预订（成人 $79），每场只有 14 人，至少 2 人才开；16 岁以上，胸围、臀围都不能超过 42 英寸（约 107 厘米），要穿系带、包脚踝的防滑登山靴。提前 10 天以内取消每张扣 $12",
    summary:
      "公园最硬核的一条线：戴头盔、头灯、护膝，穿公园发的连体服，离开铺好的步道，在没开发的通道里爬行、钻窄缝、攀岩 6 小时、约 8 公里，体验真正的探洞。还有两条入门版：10 岁以上的 Introduction to Caving（3.5 小时，$49）和只收 8–12 岁孩子的 Trog（2 小时 45 分，$25）。",
    tips: [
      "装备由公园提供，不许带自己的探洞装备；里面穿短袖短裤，自带午饭和水",
      "2026 年 10 月到 2027 年 2 月的班次表里没有这三条线，一般在夏天和周末开，出发前 1–3 个月看 Recreation.gov",
      "幽闭恐惧、心肺或膝盖不好的人不要报",
    ],
  },
  {
    id: "maca-river-styx-loop",
    park: "maca",
    nameZh: "Green 河崖顶和 River Styx 泉步道",
    nameEn: "Green River Bluffs & River Styx Spring Trails",
    kind: "hike",
    area: "visitor-center",
    lat: 37.18839,
    lon: -86.10655,
    start: VC_PARKING,
    durationMin: 90,
    hike: { distanceMi: 2.1, difficulty: "moderate", loop: true },
    bestMonths: [4, 5, 10],
    summary:
      "游客中心旁边最值得走的一圈：从野餐区走 Green River Bluffs 步道（约 2.1 公里）沿着崖顶的林子走到俯瞰 Green 河的观景点，下到河边的 River Styx 泉——洞里的地下河在这里冒出山脚、流进 Green 河，水是蓝绿色的——再沿 River Styx Spring 步道爬上历史入口，回到游客中心。全程约 3.4 公里。",
    tips: [
      "从历史入口到河边一段是陡坡，回程上坡；只想看泉的从历史入口来回约 1.2 公里",
      "夏天蜱虫多，穿浅色长裤，走完检查身上",
      "游客中心一带的 Heritage、Sunset Point 步道和 Sinkhole 步道的一部分 2026 年在整修关闭，按现场指示牌走",
    ],
    photoFile: "River Styx Spring (Mammoth Cave Ridge, Kentucky, USA) (38037094924).jpg",
    trail: {
      via: [
        { lat: 37.19347, lon: -86.10275 },
        { lat: 37.18839, lon: -86.10655 },
        { lat: HISTORIC_ENTRANCE.lat, lon: HISTORIC_ENTRANCE.lon },
      ],
      loop: true,
    },
  },
  {
    id: "maca-echo-river-spring",
    park: "maca",
    nameZh: "Echo River 泉无障碍步道",
    nameEn: "Echo River Spring Trail",
    kind: "hike",
    area: "visitor-center",
    lat: 37.18773,
    lon: -86.10887,
    durationMin: 40,
    hike: { distanceMi: 0.7, difficulty: "easy", loop: true },
    summary:
      "约 1.1 公里的硬化环线，全程无障碍，走到另一处地下河出水口 Echo River 泉的观景平台：洞里的 Echo River 从这里的水潭冒出来流进 Green 河。沿途的解说牌按一下就有语音讲解，适合推婴儿车、坐轮椅的。",
    tips: [
      "步道口在去 Green River 渡口的路上，离游客中心开车几分钟",
      "雨后几天水潭的水最旺，干旱时水面平静、颜色更绿",
    ],
    photoFile: "Echo River Spring Trail- Echo Springs Viewing Platform.JPG (007f5ebd-fda3-4065-ac67-897a5310fb9b).JPG",
    trail: { via: [{ lat: 37.18773, lon: -86.10887 }], loop: true },
  },
  {
    id: "maca-cedar-sink",
    park: "maca",
    nameZh: "Cedar Sink 大落水洞",
    nameEn: "Cedar Sink Trail",
    kind: "hike",
    area: "south-side",
    lat: 37.14873,
    lon: -86.15454,
    start: { lat: 37.15574, lon: -86.16041, nameZh: "Cedar Sink 步道口停车场（KY-422）" },
    durationMin: 60,
    hike: { distanceMi: 1, difficulty: "moderate" },
    bestMonths: [4, 5, 10],
    summary:
      "公园南边一个巨大的落水洞：地面塌下去形成一个几十米深、长满树的大坑，坑底有一条地下河从一边的洞口冒出来、流一段又钻进另一边的洞里消失。步道约 1.6 公里，沿着坑边的观景台转一圈，再走石阶下到坑底看河，是在地面上看懂“喀斯特地形”最直观的地方。",
    tips: [
      "下到坑底的台阶多，回程要爬上来；雨后台阶和石头很滑",
      "大雨后坑底的河水会涨，别靠近洞口",
      "从游客中心开车约 20 分钟，在 Brownsville Road（KY-422）旁",
    ],
    photoFile: "Cedar Sink.jpg",
    trail: { via: [{ lat: 37.14873, lon: -86.15454 }] },
  },
  {
    id: "maca-sand-cave",
    park: "maca",
    nameZh: "Sand Cave（弗洛伊德·柯林斯遇难处）",
    nameEn: "Sand Cave Trail",
    kind: "landmark",
    area: "south-side",
    lat: 37.15445,
    lon: -86.04705,
    start: { lat: 37.15262, lon: -86.04758, nameZh: "Sand Cave 步道口停车场（KY-255）" },
    durationMin: 20,
    summary:
      "1925 年探洞人弗洛伊德·柯林斯（Floyd Collins）在这个砂岩崖下的小洞里被落石卡住，救援持续了两周多，全国报纸天天报道，最后他死在洞里——这件事让猛犸洞一带全国闻名。从停车场走约 150 米无障碍木栈道到洞口前的观景台，有解说牌讲这段故事。",
    tips: ["在公园东南入口 KY-255 路边，从 Park City 进园顺路停一下", "洞口不能进，留在木栈道上"],
    photoFile: "Sand Cave at Mammoth Cave National Park.jpg",
  },
  {
    id: "maca-sloans-crossing",
    park: "maca",
    nameZh: "Sloans Crossing 池塘步道",
    nameEn: "Sloans Crossing Pond Walk",
    kind: "hike",
    area: "south-side",
    lat: 37.15071,
    lon: -86.09894,
    durationMin: 25,
    hike: { distanceMi: 0.4, difficulty: "easy", loop: true },
    summary:
      "约 600 米的平坦环线，木栈道绕着一个被树林包围的小池塘：池塘是落水洞底部被黏土堵住后积水形成的，常能看到乌龟、青蛙和水鸟，早晚有鹿。全程无障碍，适合在两条导览之间散散步。",
    tips: ["在 Mammoth Cave Parkway 和 KY-255 的交叉口，从游客中心开车约 10 分钟", "春夏蚊子多"],
    trail: { via: [{ lat: 37.15071, lon: -86.09894 }], loop: true },
  },
  {
    id: "maca-green-river-paddle",
    park: "maca",
    nameZh: "Green 河独木舟、皮划艇",
    nameEn: "Green River canoe and kayak trip",
    kind: "experience",
    area: "river",
    lat: GREEN_RIVER_FERRY.lat,
    lon: GREEN_RIVER_FERRY.lon,
    start: { lat: 37.13675, lon: -85.95622, nameZh: "划船公司（Cave City 一带，接送到下水点）" },
    durationMin: 300,
    openMonths: [5, 6, 7, 8, 9, 10],
    closedNote:
      "园外的划船公司大多 4–5 月到 10 月营业，冬天水冷、多数不开。2026 年 9 月起 Green 河水位低，Green River 渡轮停运，划船也可能搁浅，出发前打电话问划船公司。",
    bestMonths: [6, 7, 8, 9],
    permit: "向园外的划船公司租船并预订接送（Cave City、Park City、Brownsville 一带）；公园不用许可证",
    summary:
      "Green 河在公园里平缓地绕来绕去，两岸是石灰岩崖壁和森林，划船时能看到洞里的泉水从岸边流进河里，常有乌龟、苍鹭和鹿。最常见的是从 Dennison Ferry 划到 Green River Ferry，约 7 英里（11 公里），3–4 小时，水流平缓，适合第一次划船的人。",
    tips: [
      "划船公司把人和船送到上游的下水点，在下游接；穿速干衣物和能下水的鞋，带防水袋",
      "河岸是公园的地，可以在沙洲上岸休息、野餐；涨水后河水浑急，别下水游泳",
      "Green River 渡轮在下水点下游，划到这里时注意避开渡轮的钢缆",
    ],
    photoFile: "Canoes on Green River, NPS Photo (5d3b9030-38b0-49c4-811f-23bfffc97c5d).jpeg",
  },
];
