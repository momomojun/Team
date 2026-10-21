import type { Attraction } from "./types";

// 康加里不收门票，园区全年 24 小时开放，只有 Harry Hampton 游客中心按时间开（每天 9:00–17:00，元旦、总统日、哥伦布日、感恩节、圣诞节关）。
// 景点几乎都从游客中心出发：木栈道环线、Weston Lake、Oakridge 等步道一条接一条往泛滥平原深处走；划船在东边约 5 公里的
// South Cedar Creek 码头；东区 US-601 旁另有一条 Bates Ferry 步道走到 Congaree 河边。
// 步道长度、难度按 NPS Trail Information 页面（2026-07-10 更新）。一年约十次洪水会淹掉低处的步道和一部分木栈道。
// 坐标：游客中心、木栈道、步道、码头按 OSM（Nominatim、Overpass，2026-10-20 查）。
const VC = { lat: 33.82962, lon: -80.82337 };
const VC_PARKING = { lat: 33.83038, lon: -80.82297, nameZh: "Harry Hampton 游客中心停车场" };
const SOUTH_CEDAR_CREEK = { lat: 33.81982, lon: -80.78782, nameZh: "South Cedar Creek 码头停车场" };

export const congaree: Attraction[] = [
  {
    id: "cong-visitor-center",
    park: "cong",
    nameZh: "Harry Hampton 游客中心",
    nameEn: "Harry Hampton Visitor Center",
    kind: "visitor",
    area: "harry-hampton",
    lat: VC.lat,
    lon: VC.lon,
    start: VC_PARKING,
    durationMin: 30,
    hours: [{ open: "09:00", close: "17:00" }],
    summary:
      "所有步道的起点：展览讲泛滥平原的老林为什么能保留下来、洪水怎么塑造这片林子，有介绍片和书店，护林员能告诉你这几天哪段被水淹了。门口有个出名的“蚊子指数表”（Mosquito Meter），从 1“全无”到 6“战争状态”，夏天常拨到 5–6。",
    tips: [
      "园里只有这里有饮水和像样的厕所（24 小时开的家庭卫生间），进步道前灌满水",
      "可以免费借轮椅（先到先得，能先打电话问 803-776-4396）",
      "游客中心关门后园区照样开，停车场和步道全天都能去",
    ],
    photoFile: "Congaree National Park South Carolina Mosquito Meter.JPG",
  },
  {
    id: "cong-boardwalk",
    park: "cong",
    nameZh: "木栈道环线",
    nameEn: "Boardwalk Loop Trail",
    kind: "hike",
    area: "harry-hampton",
    lat: 33.82192,
    lon: -80.81782,
    start: VC_PARKING,
    durationMin: 90,
    hike: { distanceMi: 2.6, difficulty: "easy", loop: true },
    bestTime: ["morning"],
    bestMonths: [3, 4, 10, 11],
    mustSee: true,
    summary:
      "公园最经典的一圈：约 4.2 公里的木栈道从游客中心后面的崖顶下到泛滥平原，在高大的火炬松、橡树和落羽杉、紫树中间绕一圈，脚下是一片片露出水面的落羽杉“膝根”。走到最远处有一个观景台看 Weston Lake——一条古河道留下的牛轭湖，常能看到乌龟、苍鹭和水獭。全程平坦，有长椅。",
    tips: [
      "木栈道分高架和贴地两段，洪水时贴地的那段会被淹，先在游客中心问哪段能走",
      "沿途有编号的解说牌，游客中心有对应的步道导览手册",
      "夏天蚊子很多，带驱蚊剂；栈道上不能骑车、不能带宠物（宠物只能走其他步道）",
    ],
    photoFile: "Congaree National Park South Carolina Boardwalk horizontal.JPG",
    trail: {
      via: [
        { lat: 33.82484, lon: -80.82349 },
        { lat: 33.82192, lon: -80.81782 },
        { lat: 33.8298, lon: -80.81821 },
      ],
      loop: true,
    },
  },
  {
    id: "cong-weston-lake",
    park: "cong",
    nameZh: "Weston Lake 环线",
    nameEn: "Weston Lake Loop Trail",
    kind: "hike",
    area: "harry-hampton",
    lat: 33.82074,
    lon: -80.81661,
    start: VC_PARKING,
    durationMin: 150,
    hike: { distanceMi: 4.5, difficulty: "moderate", loop: true },
    bestTime: ["morning"],
    bestMonths: [3, 4, 10, 11],
    mustSee: true,
    summary:
      "走完木栈道还想多看的，接着走这条约 7.2 公里的土路环线：绕过 Weston Lake，再沿着 Cedar Creek 的黑水河岸走一段，穿过落羽杉、紫树沼泽，是最容易看到水獭、涉禽和巨大老树的一条。路平，但比木栈道野得多。",
    tips: [
      "从游客中心沿木栈道走到 Weston Lake 再接上，往返总共约 7 公里",
      "木栈道以外的步道一下大雨就会积水甚至被淹，雨季出发前看公告；鞋会湿、会沾泥",
      "步道用棕色标记加编号（Weston Lake 是 3 号），倒树后有时要绕",
    ],
    photoFile: "Weston Lake Congaree.JPG",
    trail: { via: [{ lat: 33.82074, lon: -80.81661 }], loop: true },
  },
  {
    id: "cong-oakridge",
    park: "cong",
    nameZh: "Oakridge 步道",
    nameEn: "Oakridge Trail",
    kind: "hike",
    area: "harry-hampton",
    lat: 33.81174,
    lon: -80.83197,
    start: VC_PARKING,
    durationMin: 240,
    hike: { distanceMi: 7.1, difficulty: "hard", loop: true },
    bestMonths: [3, 4, 10, 11],
    summary:
      "往泛滥平原深处再走：约 11.4 公里的一圈，经过一道略高一点的林间土脊，上面是最粗大的老橡树和山核桃，沿途还会经过 Wise Lake 等几个牛轭湖。人比木栈道少得多，适合想看原始老林的人。",
    tips: [
      "NPS 公告：Oakridge、Boggy Gut、Kingsnake 几条偏远步道有些地方不好认路，一定要带 GPS 或离线地图",
      "林子里没有信号、没有水，带够水和驱蚊剂；倒树多时要爬过去或绕路",
      "大雨后整段被淹的情况常见，出发前在游客中心问",
    ],
    trail: {
      via: [
        { lat: 33.815, lon: -80.82824 },
        { lat: 33.81174, lon: -80.83197 },
      ],
      loop: true,
    },
  },
  {
    id: "cong-bluff-trail",
    park: "cong",
    nameZh: "Bluff 步道（松林）",
    nameEn: "Bluff Trail",
    kind: "hike",
    area: "harry-hampton",
    lat: 33.83015,
    lon: -80.8184,
    start: VC_PARKING,
    durationMin: 50,
    hike: { distanceMi: 1.8, difficulty: "easy", loop: true },
    summary:
      "游客中心北边地势高一点的崖顶上，约 2.9 公里的一圈穿过年轻的火炬松和长叶松林，能看到公园定期计划烧荒留下的焦黑树干——这是为了让长叶松林保持原来的样子。和泛滥平原里的沼泽老林完全不同，洪水时也能走。",
    tips: ["Bluff 营地就在这条步道上", "沙土路，夏天林子里晒，比木栈道热"],
    trail: { via: [{ lat: 33.83207, lon: -80.81533 }], loop: true },
  },
  {
    id: "cong-cedar-creek-paddle",
    park: "cong",
    nameZh: "Cedar Creek 独木舟、皮划艇",
    nameEn: "Cedar Creek paddle",
    kind: "experience",
    area: "cedar-creek",
    lat: 33.81922,
    lon: -80.78775,
    start: SOUTH_CEDAR_CREEK,
    durationMin: 180,
    bestTime: ["morning"],
    bestMonths: [3, 4, 5, 10, 11],
    mustSee: true,
    permit:
      "公园不租船、不用许可证。跟团的向哥伦比亚的导览公司订（Palmetto Outdoor、J.K. Adventure Guides、Carolina Outdoor Adventures，约 3 小时，在 South Cedar Creek 码头集合）；自己划的在 River Runner Outdoor Center 租船",
    summary:
      "在 Cedar Creek 的黑水上划独木舟，是看这片沼泽老林最好的方式：水面平静得像镜子，两岸是落羽杉、紫树和膝根，常能看到乌龟晒太阳、水獭、苍鹭，偶尔有鳄鱼和蛇。导览团从 South Cedar Creek 码头下水，一般往上游划一段再顺流回来，约 3 小时，适合第一次划船的人。",
    tips: [
      "NPS 公告（2026-04-20）：Bannister's Bridge 到 South Cedar Creek 之间有倒树，水位不同可能要把船扛过去；自己划长线的看清楚",
      "水位低时浅滩多、水位高时水流急，导览公司会按水位调整路线；洪水时停团",
      "带驱蚊剂、防晒和防水袋；夏天选早上那团",
    ],
  },
  {
    id: "cong-fireflies",
    park: "cong",
    nameZh: "同步萤火虫观赏",
    nameEn: "Synchronous Firefly Viewing",
    kind: "experience",
    area: "harry-hampton",
    lat: 33.82941,
    lon: -80.82184,
    start: VC_PARKING,
    durationMin: 120,
    bestTime: ["night"],
    openMonths: [5],
    closedNote:
      "同步萤火虫只在每年 5 月中旬前后约两周出现，公园在高峰的约一周办观赏活动（2026 年是 5 月 13–20 日）。别的月份晚上林子里也有普通萤火虫，但不会同步闪。",
    bestMonths: [5],
    permit:
      "要抽签拿观赏证：Recreation.gov 每年 4 月上旬开放一周（2026 年 4 月 7–14 日），每户一份、申请费 $1，每晚限 145 辆车。活动那几天下午 4:30 起大门只出不进，持证的 19:00 起进观赏区",
    lottery: true,
    summary:
      "康加里的萤火虫（Photuris frontalis）是世界上少数几种会同步闪光的萤火虫之一：5 月中旬天黑以后，泛滥平原林子边上成片的萤火虫一起一闪一闪，像波浪一样在林子里传。观赏在游客中心附近的步道和木栈道上，要等到天全黑。",
    tips: [
      "只能用红光手电（或用红色玻璃纸包住），手机屏幕调暗，不能用闪光灯",
      "看完已经很晚，回哥伦比亚的路上没有路灯，开慢点",
      "没抽中的：大烟山 6 月初也有同步萤火虫（Elkmont，同样要抽签）",
    ],
  },
  {
    id: "cong-bates-ferry",
    park: "cong",
    nameZh: "Bates Ferry 步道（Congaree 河边）",
    nameEn: "Bates Ferry Trail",
    kind: "hike",
    area: "east",
    lat: 33.77926,
    lon: -80.6459,
    start: { lat: 33.78344, lon: -80.63744, nameZh: "Bates Ferry 步道口停车场（US-601）" },
    durationMin: 70,
    hike: { distanceMi: 2.2, difficulty: "easy" },
    summary:
      "公园东区 US-601 旁一条约 3.5 公里的往返步道，沿着 1920 年代通往渡口的老路走到 Congaree 河边，是不用走偏远步道就能看到 Congaree 河的地方。人很少，安静。",
    tips: [
      "从游客中心开车过来约 30 分钟；河岸陡、土质松，下雨后很滑，别靠近水边",
      "洪水时会被淹",
    ],
    trail: { via: [{ lat: 33.77926, lon: -80.6459 }] },
  },
];
