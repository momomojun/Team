import type { Suitability } from "../attractions/types";

// 锡安 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：官方说锡安没有一条步道按法律算 ADA 无障碍，
// Pa'rus、下翡翠池、Riverside Walk 是“有人协助能走”；班车都能上轮椅，游客中心能借全地形轮椅
const ACCESS = "https://www.nps.gov/zion/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "zion-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "无障碍停车位和洗手间；能借全地形轮椅（要先看借用条件），峡谷班车都能上轮椅。",
    source: ACCESS,
  },
  "zion-watchman-trail": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "土路碎石、几乎没有遮阴，夏天中午很晒；带孩子、老人一早或傍晚走，想轻松看 Watchman 山峰可以走平坦的 Pa'rus 步道。",
  },
  "zion-canyon-junction": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "Pa'rus 铺装步道经过这里；桥上有车，孩子别跑到车道上。",
    source: ACCESS,
  },
  "zion-patriarchs": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "班车站下车就能看到山峰；去观景台的小路短但很陡，轮椅、婴儿车在站台看就好。",
  },
  "zion-emerald-pools": {
    kidsFromAge: 3,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh:
      "到下翡翠池是铺装路，官方说轮椅有人协助能走；中、上池是碎石和台阶，路边有落差，曾有人在这里坠落，带小孩、老人走到下池就回头。",
    source: ACCESS,
  },
  "zion-angels-landing": {
    kidsFromAge: 12,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["dropoff", "scramble", "heat"],
    noteZh:
      "最后约 800 米是两侧数百米悬崖的窄脊，要抓铁链手脚并用，有人坠亡；不适合小孩、恐高和体力一般的。全家可以走到 Scout Lookout，不用许可证也能看到天使降临。",
  },
  "zion-narrows": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water", "flashFlood"],
    noteZh:
      "全程在河里走，水冷、石头滑，深处到腰；有山洪风险，流量超过 150 cfs 封闭。带小孩、老人在 Riverside Walk 尽头下水玩一段就回头，别往 Wall Street 深处走。",
  },
  "zion-canyon-overlook": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh: "路短，但有台阶、凿出来的石阶和一段沿崖边的栈道，部分有栏杆，终点观景台边上落差很大，孩子要牵着。",
  },
  "zion-kolob": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "开车就能看沿途观景点；终点 Timber Creek Overlook 有无障碍停车和洗手间，到观景点的小路是土路，有坡。",
    source: ACCESS,
  },
  "zion-riverside-walk": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "铺装步道，官方说轮椅有人协助能走，有几段坡；尽头就是窄缝入口，孩子可以在浅水边玩。",
    source: ACCESS,
  },
  "zion-pa-rus": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "全程铺装、平缓，官方说轮椅有人协助能走；有自行车，孩子靠边走。",
    source: ACCESS,
  },
  "zion-scout-lookout": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "dropoff"],
    noteZh: "铺装但很陡，21 道之字弯 Walter's Wiggles 一直上坡，夏天晒；山脊上观景处边上是悬崖，孩子别靠近，铁链段开始的地方就回头。",
  },
  "zion-observation-point": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff", "heat"],
    noteZh: "从东侧台地走，爬升不大但往返约 11 公里，路上遮阴少；终点观景台是悬崖边，没有护栏。",
  },
  "zion-checkerboard-mesa": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边停车就能看，在车上也看得到。",
  },
  "zion-human-history-museum": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "有坡道和无障碍停车位；冬天闭馆。",
    source: ACCESS,
  },
};
