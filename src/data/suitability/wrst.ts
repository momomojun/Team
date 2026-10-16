import type { Suitability } from "../attractions/types";

// 兰格尔–圣伊莱亚斯 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：Copper Center 游客中心、展厅和放映厅无障碍，
// 有铺装步道；Kennecott 的路都没铺装，几栋楼有坡道、观景平台，很多入口不合 ADA 标准；选矿厂导览和冰川徒步按 St. Elias Alpine Guides 官网
const ACCESS = "https://www.nps.gov/wrst/planyourvisit/accessibility.htm";
const MILL = "https://www.steliasguides.com/trips/kennecott-mill-town-tour/";

export const suitability: Record<string, Suitability> = {
  "wrst-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游客中心、展厅和放映厅都能进轮椅，院子是铺装路；北方森林环线有一段铺装，能推轮椅到铜河边看山。",
    source: ACCESS,
  },
  "wrst-liberty-falls": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "从停车场走几分钟土路到瀑布，冬天积雪结冰很滑。",
  },
  "wrst-chitina": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "小镇路是砂石和土路，开车到河边能看捕鱼水车；铜河水急，别让孩子下到河岸边。",
  },
  "wrst-mccarthy-road": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["remote"],
    noteZh: "开车看，单程约 3 小时颠簸砂石路，沿途没有加油站和信号，爆胎了只能自己换；坐车久的老人、小孩中途在 Kuskulana 大桥边下车歇一歇。",
  },
  "wrst-mccarthy": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "从路尽头停车场过步行桥，再走约 800 米砂石路到镇上，推车、轮椅能走但颠；镇上很小，没有医院。",
  },
  "wrst-kennecott": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "坐接驳车到镇上；路都是土路和坡，娱乐厅、学校平台有轮椅坡道，发电厂有临街观景台，其他老房子多是台阶和高架走道。",
    source: ACCESS,
  },
  "wrst-mill-tour": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble"],
    noteZh:
      "沿陡坡、陡楼梯和梯子一层层往下走约 1.6 公里，公司要求每个人自己能上下楼梯，说 3–5 岁会很吃力，2 岁以下要用背带；怕高、腿脚不好的可以只在外面看选矿厂，逛开放的老房子。",
    source: MILL,
  },
  "wrst-root-glacier": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["wildlife"],
    noteZh: "往返约 6.4 公里碎石土路，要过一条季节性小溪，整条路有熊；冰面很滑，没冰爪别上冰。带小孩、老人走到能看见冰川的侧碛观景处就回头。",
  },
  "wrst-glacier-hike": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "半日团要走约 8–11 公里、5–6 小时，其中一段穿冰爪在冰面上走；公司说全天团对 8 岁以下会比较吃力，带小孩建议订私人团。",
    source: "https://www.steliasguides.com/trips/full-day-root-glacier-hike/",
  },
  "wrst-bonanza-mine": {
    kidsFromAge: 12,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["wildlife", "remote"],
    noteZh: "往返约 14.5 公里、爬升约 1,160 米，一路陡上到林线以上，上段是碎石坡，天气说变就变；体力一般的、带小孩的去 Root 冰川步道或者只在 Kennecott 镇上逛。",
  },
  "wrst-flightseeing": {
    kidsFromAge: 2,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion", "remote"],
    noteZh: "坐小飞机 1–2 小时，气流颠簸，容易晕机的提前吃药；上下飞机要爬，行动不便的订之前问航空公司。",
  },
  "wrst-slana": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "小护林站，停车场是砂石地；NPS 没写能不能进轮椅，需要的先打电话问。",
  },
  "wrst-nabesna-road": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["remote"],
    noteZh: "开车看，在车上就能看火山和驼鹿；路上几乎碰不到人、没信号，29 英里以后有溪流漫过路面，普通车别过。",
  },
  "wrst-skookum-volcano": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["remote"],
    noteZh: "单程约 4 公里、爬升约 550 米，大半段走在碎石河床上，路线不明显，附近没人、没信号；体力一般的在 Nabesna Road 边的观景点和 Twin Lakes 看就好。",
  },
  "wrst-worthington-glacier": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场边就能看冰川，到观景台是短步道；冰川末端和冰碛坡很滑，别带孩子靠近冰面。",
  },
};
