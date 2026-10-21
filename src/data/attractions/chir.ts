import type { Attraction } from "./types";

// 奇里卡瓦：2026 年 10 月 20 日由国家纪念地（1924 年设立）升为国家公园，边界和管理都没变；NPS 官网 10 月下旬还叫 Chiricahua National Monument。
// 不收门票，园区 24 小时开放，游客中心每天 8:30–16:30。只有一个入口（西边 Hwy 181 尽头），8 英里的 Bonita Canyon Drive
// 从入口经 Faraway Ranch、游客中心、营地一路爬到山顶的 Massai Point，是条走到头再原路回来的路，不通到山的另一边。
// 车长限制：超过 29 英尺的车和所有拖车停在 Faraway Ranch，过了营地只准 24 英尺以内的车上山。
// 园里没有加油站、商店和餐馆；最近的加油站在西南的 Sunizona（27 英里）和西北的 Willcox（37 英里）。手机信号很差。
// 徒步班车（以前忙季周末 9:00 从 Faraway Ranch、9:10 从营地送到山顶）NPS 写着“2025 年秋天起停开、现在也没开”，下面都按自己开车上山写。
// 片区：lower 是谷底（入口、Bonita Creek、Faraway Ranch、游客中心、营地，海拔约 1,650 米），massai 是山顶一带
// （Massai Point、Echo Canyon、Sugarloaf 和石林步道，约 2,100 米），fort-bowie 是北边约 50 分钟车程的 Fort Bowie 国家历史遗址（另一个 NPS 单位）。
// 坐标：停车场按 NPS 交通页面（directions.htm）给的坐标，步道口、山顶、岩石按 OpenStreetMap（2026-10-20 查）。
// 步道里程、爬升按 NPS 2026 年版步道指南（2026_Park_Hiking_Guide_8x14_Remediated.pdf）。
const VC_PARKING = { lat: 32.00561, lon: -109.3562, nameZh: "游客中心停车场（25 个车位，29 英尺以内）" };
const MASSAI_PARKING = { lat: 32.00738, lon: -109.31222, nameZh: "Massai Point 停车场（25 个车位，24 英尺以内）" };
const ECHO_PARKING = { lat: 32.01202, lon: -109.31584, nameZh: "Echo Canyon 停车场（19 个车位，24 英尺以内）" };
const FARAWAY_PARKING = { lat: 32.00871, lon: -109.37537, nameZh: "Faraway Ranch 停车场（大车、拖车也停这里）" };

export const chiricahua: Attraction[] = [
  // ===== 谷底 · Bonita Canyon =====
  {
    id: "chir-visitor-center",
    park: "chir",
    nameZh: "奇里卡瓦游客中心",
    nameEn: "Chiricahua Visitor Center",
    kind: "visitor",
    area: "lower",
    lat: 32.00543,
    lon: -109.35642,
    start: VC_PARKING,
    durationMin: 30,
    hours: [{ open: "08:30", close: "16:30" }],
    summary:
      "游客中心兼小博物馆：有奇里卡瓦火山爆发、阿帕奇人和早期移民的展览、介绍片和书店。在这里拿纸质步道地图、问当天的步道和天气，再开车上山。",
    tips: [
      "每天 8:30–16:30；园里没有手机信号，进山前把地图下载好，有问题当场问护林员",
      "往返 Heart of Rocks 的长线可以从游客中心后面的 Lower Rhyolite 步道直接出发（往返约 12 公里、爬升约 490 米），比从山顶下来更累",
      "停车场只有 25 个车位，10–4 月的周末常满，满了停在旁边 Rhyolite Creek Road 的砂石路肩",
    ],
    photoFile: "Visitor Center, Chiricahua National Monument, Willcox, AZ.jpg",
  },
  {
    id: "chir-faraway-ranch",
    park: "chir",
    nameZh: "Faraway Ranch 历史农庄",
    nameEn: "Faraway Ranch Historic District",
    kind: "landmark",
    area: "lower",
    lat: 32.00817,
    lon: -109.37255,
    start: FARAWAY_PARKING,
    durationMin: 60,
    summary:
      "瑞典移民 Erickson 一家 1886 年在这里落户，从两间小木屋一点点扩成两层半的农舍；女儿 Lillian 和丈夫 Ed Riggs 后来把它办成“远离一切”的度假牧场，带客人骑马上山看石林，把这片石林介绍给了外面的人，1924 年这里设为国家纪念地。现在农舍、谷仓、畜栏和旁边 Stafford 一家的老木屋都在，可以沿小路自己转，看解说牌。",
    tips: [
      "主屋里面要跟护林员的导览才能进，导览看人手，不是每天都有；去之前打电话（520-824-3560）或到游客中心问当天有没有",
      "从游客中心走 Silver Spur Meadow 步道过来往返约 4.8 公里，大多平路，可以牵狗",
      "入口附近的 Erickson 家族墓地就在路边，右转一下就到",
    ],
    photoFile: "Faraway Ranch House Arizona 2014.JPG",
  },
  {
    id: "chir-bonita-creek",
    park: "chir",
    nameZh: "Bonita Creek 小环线和野餐区",
    nameEn: "Bonita Creek Loop Trail",
    kind: "hike",
    area: "lower",
    lat: 32.00981,
    lon: -109.38415,
    start: { lat: 32.00964, lon: -109.384, nameZh: "Bonita Creek 停车场（9 个车位）" },
    durationMin: 20,
    hike: { distanceMi: 0.2, difficulty: "easy", loop: true },
    bestTime: ["morning"],
    summary:
      "进园后左手边第一站，一段约 300 米的平坦铺装小环线穿过溪边草地和栎树林，是公园唯一所有轮椅、助行设备都能走的步道。溪边是园里看鸟最好的地方之一，有野餐桌和无障碍厕所。",
    tips: [
      "溪水只在春天融雪和夏末季风雨后才有，平时多是干河床",
      "早上鸟最多，带望远镜",
    ],
  },
  {
    id: "chir-bonita-canyon-drive",
    park: "chir",
    nameZh: "Bonita Canyon Drive 观景路",
    nameEn: "Bonita Canyon Drive",
    kind: "drive",
    area: "lower",
    lat: 32.01803,
    lon: -109.35239,
    start: VC_PARKING,
    durationMin: 60,
    mustSee: true,
    summary:
      "1930 年代修的 8 英里（约 13 公里）山路，从入口沿 Bonita Canyon 谷底的橡树林慢慢爬升，过了营地开始盘山，两边的流纹岩柱越来越密：Organ Pipe（像管风琴的一排石柱）、Sea Captain 等几个路边停车点都能看，最后到海拔约 2,100 米的 Massai Point。全程在车上就能看到大半石林。",
    tips: [
      "过了营地只准 24 英尺以内的车，不许拖车；房车和拖车停在 Faraway Ranch",
      "上山的路边停车点都在对面车道，下山时顺手停最方便",
      "路窄弯多，有骑车的人和野生动物（白尾鹿、浣熊科的长鼻浣熊 coati），慢慢开；天黑后动物更多",
    ],
    photoFile: "Organ Pipe Rocks from Bonita Canyon Drive, Chiricahua National Monument, Willcox, AZ.jpg",
  },
  {
    id: "chir-natural-bridge",
    park: "chir",
    nameZh: "Natural Bridge 天然桥步道",
    nameEn: "Natural Bridge Trail",
    kind: "hike",
    area: "lower",
    lat: 32.02106,
    lon: -109.35533,
    start: { lat: 32.02252, lon: -109.34894, nameZh: "Natural Bridge 步道口（路边只有 3 个车位）" },
    durationMin: 150,
    hike: { distanceMi: 4.7, gainFt: 1000, difficulty: "moderate" },
    bestTime: ["morning"],
    trail: {
      via: [
        { lat: 32.02916, lon: -109.34837 },
        { lat: 32.02763, lon: -109.3547 },
        { lat: 32.02106, lon: -109.35533 },
      ],
    },
    summary:
      "观景路半山腰出发，往返约 7.6 公里，翻过一道山脊再下到 Picket Park 的松林和栎树林里，终点是峡谷上一座不大的天然石桥，只能隔着峡谷远远看。沿途经过 2011 年 Horseshoe Two 山火烧得最重的一带，视野很开阔，人比山顶几条步道少得多。",
    tips: [
      "步道口在观景路边，只有 3 个车位，车头斜着停；满了就换别的步道",
      "石桥不大，不少人觉得“就这”；冲着清静和山景去比较不失望",
      "过火区遮阴少，带足水",
    ],
  },
  // ===== 山顶 · Massai Point 一带 =====
  {
    id: "chir-massai-point",
    park: "chir",
    nameZh: "Massai Point 观景台和自然步道",
    nameEn: "Massai Point Overlook & Nature Trail",
    kind: "viewpoint",
    area: "massai",
    lat: 32.00711,
    lon: -109.31239,
    start: MASSAI_PARKING,
    durationMin: 45,
    hike: { distanceMi: 0.5, difficulty: "easy", loop: true },
    bestTime: ["sunset", "morning"],
    mustSee: true,
    summary:
      "观景路的终点，海拔 2,094 米。绕停车场一圈约 800 米的自然步道上能俯瞰整片“石林”（Wonderland of Rocks）：几千根流纹岩石柱、平衡石密密麻麻排满山谷，一直延伸到西边的 Sulphur Springs 河谷。石头展览亭里讲这些石柱怎么来的：约 2,700 万年前附近 Turkey Creek 火山大爆发，火山灰熔结成厚厚的岩层，后来裂开、风化成一根根柱子。",
    tips: [
      "从步道西北侧的铺装段开始逆时针走，北段铺到展览亭；想偷懒可以走陡台阶直接下到观景处",
      "1934 年纪念地揭幕典礼就在这里办，发言用的 Speakers Rock 还在",
      "这里也是看日落和星空的好地方：晴天晚上东边看不到城市灯光，地平线上的星星最早出来",
    ],
    photoFile: "Massai Point, Chiricahua National Monument, Arizona.jpg",
  },
  {
    id: "chir-echo-canyon-loop",
    park: "chir",
    nameZh: "Echo Canyon 环线",
    nameEn: "Echo Canyon Loop (Echo Canyon, Hailstone & Ed Riggs Trails)",
    kind: "hike",
    area: "massai",
    lat: 32.01052,
    lon: -109.31743,
    start: ECHO_PARKING,
    durationMin: 150,
    hike: { distanceMi: 3.3, gainFt: 560, difficulty: "moderate", loop: true },
    bestTime: ["morning", "afternoon"],
    mustSee: true,
    trail: {
      loop: true,
      via: [
        { lat: 32.00867, lon: -109.32116 },
        { lat: 32.00368, lon: -109.32662 },
        { lat: 32.00354, lon: -109.32116 },
        { lat: 32.00268, lon: -109.31425 },
        { lat: 32.00742, lon: -109.31493 },
      ],
    },
    summary:
      "公园最受欢迎的一圈，约 5.3 公里。逆时针走：先沿 Echo Canyon 步道下坡，钻过一线天一样的岩缝、走进 Grotto（几块巨石搭成的“石洞”），两边全是几层楼高的石柱和平衡石；到谷底的松林和柏树林左转上 Hailstone 步道，石壁上有一颗颗像冰雹的球粒（spherulite）；最后沿 Ed Riggs 步道爬回停车场。",
    tips: [
      "逆时针走看石头的角度最好，而且下坡多在前面、最后才爬坡",
      "只想短走：从停车场下到 Grotto 约 800 米，往前走到看见一个“窗口”和之字形下坡就回头，往返约 2 公里",
      "Hailstone 一段在崖边，怕高的要注意；不能爬到石头上去，石柱很不稳",
      "Echo Canyon 停车场只有 19 个车位，2–4 月和节假日周末很快停满，满了停 Massai Point 或 Sugarloaf 停车场再走过来",
    ],
    photoFile: "Echo Canyon Trail, Chiricahua National Monument, Willcox, AZ.jpg",
  },
  {
    id: "chir-heart-of-rocks",
    park: "chir",
    nameZh: "Heart of Rocks 和大平衡石",
    nameEn: "Heart of Rocks Loop & Big Balanced Rock",
    kind: "hike",
    area: "massai",
    lat: 31.99601,
    lon: -109.3225,
    start: ECHO_PARKING,
    durationMin: 300,
    hike: { distanceMi: 7.4, gainFt: 1000, difficulty: "hard" },
    bestTime: ["morning"],
    mustSee: true,
    trail: {
      via: [
        { lat: 32.00742, lon: -109.31493 },
        { lat: 32.00268, lon: -109.31425 },
        { lat: 31.99857, lon: -109.3071 },
        { lat: 31.99408, lon: -109.3095 },
        { lat: 31.99304, lon: -109.31664 },
        { lat: 31.99405, lon: -109.32183 },
        { lat: 31.99701, lon: -109.32299 },
        { lat: 31.99689, lon: -109.32122 },
        { lat: 31.99559, lon: -109.32247 },
      ],
    },
    summary:
      "石林最密的地方，往返约 12 公里、爬升 300 多米。从 Echo Canyon 停车场走 Ed Riggs 步道下山，转 Mushroom Rock、Big Balanced Rock 步道，路过上千吨重、立在一个小底座上的大平衡石（Big Balanced Rock），再走约 1.6 公里的 Heart of Rocks 小环线：Punch and Judy、Kissing Rocks、Thor's Hammer、Camel's Head 这些有名字的怪石都在这一圈里。",
    tips: [
      "NPS 说下午 1 点以后不要出发；一般要走 4–6 小时，带够水、电解质和吃的",
      "Heart of Rocks 小环线进去看到左边的指示牌就爬上大石头、顺时针走，反着走很难认路",
      "回程顺路走 Inspiration Point 支线（往返约 1.6 公里），站在崖边俯瞰整条 Rhyolite 峡谷",
      "一整天的“大环线”（Big Loop，13–19 公里）把 Echo Canyon、Heart of Rocks、Sarah Deming、Rhyolite 几条都串起来，以前坐徒步班车上山再走回游客中心；班车 2025 年秋天起停开，现在要自己安排接送或原路走回",
      "6 月中到 9 月是季风季，午后常有雷暴，听到雷声马上往回走、离开山脊",
    ],
    photoFile: "Chiricahua balanced rock.jpg",
  },
  {
    id: "chir-sugarloaf",
    park: "chir",
    nameZh: "Sugarloaf 山顶瞭望台",
    nameEn: "Sugarloaf Mountain Trail",
    kind: "hike",
    area: "massai",
    lat: 32.01425,
    lon: -109.32478,
    start: { lat: 32.01643, lon: -109.32122, nameZh: "Sugarloaf 停车场（17 个车位，有厕所）" },
    durationMin: 75,
    hike: { distanceMi: 1.8, gainFt: 500, difficulty: "moderate" },
    bestTime: ["morning", "sunset"],
    trail: {
      via: [
        { lat: 32.01506, lon: -109.32716 },
        { lat: 32.01418, lon: -109.32474 },
      ],
    },
    summary:
      "往返约 2.9 公里，一路之字形爬上公园最高点 Sugarloaf 山顶（海拔 2,228 米），中间穿过一段人工凿出来的石头隧道。山顶有一座 1930 年代的石头防火瞭望台，360 度看得到整片石林、西边的 Sulphur Springs 河谷和东边的奇里卡瓦山主峰。",
    tips: [
      "短但一直上坡，海拔 2,000 米以上，慢慢走、多歇；不舒服就停",
      "瞭望台山火季有时有人值守，不要打扰；四周悬崖没有完整的护栏，孩子牵好",
      "从观景路岔进 Echo Canyon 的路口右转，就是 Sugarloaf 停车场",
    ],
    photoFile: "Sugarloaf Mountain Fire Tower, Sugarloaf Mountain Trail, Chiricahua National Monument, Willcox, AZ.jpg",
  },
  {
    id: "chir-night-sky",
    park: "chir",
    nameZh: "Massai Point 看星空",
    nameEn: "Stargazing at Massai Point",
    kind: "experience",
    area: "massai",
    lat: 32.00726,
    lon: -109.31249,
    start: MASSAI_PARKING,
    durationMin: 60,
    bestTime: ["night"],
    bestMonths: [4, 5, 6, 10, 11],
    summary:
      "奇里卡瓦 2021 年获国际暗夜公园认证。园区 24 小时开放，晴天晚上自己开到山顶的 Massai Point 或 Echo Canyon 停车场，就能看到银河从地平线升起；谷底的 Faraway Ranch、Bonita Creek 停车场也很暗。",
    tips: [
      "园里只能在营地过夜，看完要开回营地或出园（到 Willcox 约 1 小时），夜里山路上动物多，慢慢开",
      "山顶晚上比谷底冷不少，冬天常到零下，带厚外套；只用红光手电",
      "7–9 月季风季多云多雷暴，看星空不太靠得住",
    ],
  },
  // ===== 园外 · Fort Bowie =====
  {
    id: "chir-fort-bowie",
    park: "chir",
    nameZh: "Fort Bowie 国家历史遗址",
    nameEn: "Fort Bowie National Historic Site",
    kind: "hike",
    area: "fort-bowie",
    lat: 32.14433,
    lon: -109.43603,
    start: { lat: 32.15666, lon: -109.45284, nameZh: "Fort Bowie 步道口（Apache Pass Road）" },
    durationMin: 120,
    hike: { distanceMi: 3, difficulty: "moderate" },
    bestTime: ["morning"],
    outsidePark: true,
    trail: { via: [{ lat: 32.14433, lon: -109.43603 }] },
    summary:
      "奇里卡瓦山北头的 Apache Pass 是 19 世纪美军和奇里卡瓦阿帕奇人冲突的中心：1862 年这里打过阿帕奇山口之战，同年美军在泉水边建了 Fort Bowie，1886 年 Geronimo 投降前一直是这一带作战的大本营，1894 年废弃。从步道口走约 2.4 公里到游客中心和第二座要塞的土坯废墟，沿路经过驿站遗址、军人墓地和 Apache 泉，往返约 4.8 公里。",
    tips: [
      "另一个 NPS 单位，不收门票；园区和步道每天日出到日落开放",
      "从奇里卡瓦开过去约 50 分钟：沿 Hwy 186 往北，转 Apache Pass Road 走约 13 公里砂石路，雨后可能有积水，看到水流过路面就掉头",
      "一路几乎没有遮阴，带水、帽子；走不了的人可以把车开到游客中心旁的无障碍车位（先看 NPS 无障碍页面的说明）",
    ],
    photoFile: "Ruins of Fort Bowie (6127707842).jpg",
  },
];
