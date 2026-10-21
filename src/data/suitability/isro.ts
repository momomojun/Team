import type { Suitability } from "../attractions/types";

// 皇家岛 · 同行适合度。2026-10-20 按 NPS 无障碍页面整理：Houghton 游客中心入口、厕所无障碍；Rock Harbor 游客中心入口无障碍，
// Windigo 游客中心在 19% 的坡上（入口本身无障碍），两处都有护林员开的高底盘高尔夫球车接送，要提前联系公园和船公司；
// Ranger III 船员帮着上下跳板，下层的厕所、餐吧无障碍；MV Sandy 能上轮椅，但几条线上岸后的步道都不行。
// Grand Portage 的渡轮官网写可能容纳不了助行器、轮椅，不能上电动代步车。岛上步道礁石、树根多，没有铺装的
const ACCESS = "https://www.nps.gov/isro/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "isro-rock-harbor-day-trip": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["remote", "motion", "water"],
    noteZh:
      "来回坐船共约 7.5 小时，湖上冷、风浪大时很颠，容易晕船的孩子、老人提前吃药；岛上码头、游客中心、Lodge 之间是铺装小路，婴儿车能推，步道上推不了。坐轮椅的提前联系公园和船公司，游客中心有高尔夫球车接送。岛上医疗很有限。",
    source: ACCESS,
  },
  "isro-seaplane": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["remote", "motion"],
    noteZh:
      "小型水上飞机，要从浮筒爬进机舱，行动不便的上下比较难；只能带登机箱大小的软包，婴儿车要能折叠塞进去。2 岁以下不占座免费。雾和风会延误，偶尔要在岛上多等。",
    source: "https://www.isleroyaleseaplanes.com/pricing-and-sc",
  },
  "isro-windigo-day-trip": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["remote", "motion", "wildlife"],
    noteZh:
      "船程单程约 1.5 小时，是几种去法里最短的；船公司说可能容纳不了助行器、轮椅（提前打电话问），不能上电动代步车。Windigo 游客中心在很陡的坡上，有高尔夫球车接送。驼鹿常在湾边，离它至少 23 米。",
    source: "https://www.isleroyaleboats.com/day-trips.html",
  },
  "isro-scoville-point": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff", "remote"],
    noteZh: "4.2 英里的环线全是礁石和树根，岬角的岩石边没有护栏、浪大；带小孩、老人走 1.8 英里的 Stoll 纪念步道小环线就够。",
  },
  "isro-lookout-louise": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["remote", "wildlife"],
    noteZh: "MV Sandy 能上轮椅（水位低时上下船比较难，提前联系 Lodge），但上岸后的 1 英里步道是一路往上的石头路，轮椅、婴儿车都不行；老人可以只坐船。",
    source: ACCESS,
  },
  "isro-edisen-fishery": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["remote"],
    noteZh: "坐船约半小时到渔场，上岸后到灯塔约 400 米，路不难但不平；NPS 写这条线上岸的部分不算无障碍，坐轮椅的提前问 Lodge。",
    source: ACCESS,
  },
  "isro-greenstone-ridge": {
    kidsFromAge: 12,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["remote", "wildlife"],
    noteZh:
      "约 40 英里、背着全部装备走 4–5 天，营地只有旱厕和要过滤的湖水，离最近的医院要坐几小时船；狼在营地附近活动频繁。孩子要有多日背包的经验，老人不建议。想带全家体验，住 Rock Harbor Lodge 走短步道。",
  },
  "isro-houghton-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "入口和厕所无障碍，介绍片有字幕。",
    source: ACCESS,
  },
  "isro-keweenaw-cruise": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["motion"],
    noteZh: "官方写所有年龄都欢迎；Ranger III 是 60 多年前的老船，没按无障碍标准设计，订票时说一声，船员会帮着上下跳板，下层厕所和餐吧能上轮椅。",
    source: "https://www.nps.gov/isro/planyourvisit/ranger-iii-info.htm",
  },
  "isro-brockway-mountain": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh: "开车上山，在山顶停车场就能看；观景处边上是陡坡，孩子别跑到栏杆外。路窄、急弯多，容易晕车的提前准备。",
  },
  "isro-grand-portage": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "遗产中心和贸易站之间是平路，能推婴儿车；Mount Rose 步道一路上坡，老人量力。复原的木屋有门槛、台阶，坐轮椅的进不去所有房间。",
  },
};
