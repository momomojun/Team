import type { Suitability } from "../attractions/types";

// 大弯 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：Panther Junction 和奇索斯盆地游客中心、化石发现展馆、Window View 小环线、
// Panther Path 和格兰德河村自然步道的木栈道写明轮椅能到；官方说多数观景台和路边解说牌轮椅能到，
// 圣埃伦娜峡谷、温泉、Boquillas 峡谷的步道口厕所无障碍，但附近步道地形崎岖，轮椅去不了。
// 5–9 月河边和低处沙漠下午常到 40°C 以上；奇索斯山里有黑熊和美洲狮
const ACCESS = "https://www.nps.gov/bibe/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "bibe-panther-junction": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "洗手间、展厅、书店、服务台和饮水机都无障碍，门口的仙人掌花园小路 Panther Path 轮椅也能走。",
    source: ACCESS,
  },
  "bibe-fossil-discovery": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "展馆和旱厕轮椅都能到，旁边有遮阳的无障碍野餐区；没有饮用水，自己带。",
    source: ACCESS,
  },
  "bibe-balanced-rock": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "前 1.2 公里是松软的沙质河床，最后约 400 米在乱石坡和光滑岩面上找路，下坡容易崴脚；全程没有树荫，夏天只在清早走。去步道口的土路要高底盘车。",
  },
  "bibe-lost-mine": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff", "wildlife"],
    noteZh:
      "往返约 7.7 公里、一路上坡爬约 340 米，尽头山脊两边是陡崖；山里有黑熊和美洲狮，孩子别跑在前面。带小孩、老人只走到 1.6 公里处的山鞍（往返约 1 小时），已经能看到最经典的景色。",
  },
  "bibe-window-view": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方写明这条铺装小环线完全无障碍，路边有长椅，坐轮椅也能看“窗口”日落。",
    source: ACCESS,
  },
  "bibe-window-trail": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff", "heat"],
    noteZh:
      "往返约 9 公里，去时一路下坡，回来要爬回约 300 米、没有树荫；尽头出水口是几十米深的跌水，岩面光滑没有栏杆，孩子一定别靠近。老人、小孩在盆地的 Window View 小环线看“窗口”就好。",
  },
  "bibe-emory-peak": {
    kidsFromAge: 12,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["scramble", "dropoff", "wildlife"],
    noteZh:
      "往返约 16 公里、爬升约 760 米，最后约 8 米要手脚并用爬露天岩壁，有坠落风险；山上有黑熊。不适合小孩和体力一般的老人，恐高或风大时在攀岩段下面的观景处停下。",
  },
  "bibe-south-rim": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["dropoff", "wildlife"],
    noteZh:
      "一圈约 20 公里、一天要 7–9 小时，不少人分两天在山上过夜；南缘是约 600 米高的悬崖，崖边没有护栏。不适合小孩和体力一般的老人，全家可以在盆地走 Window View 小环线。",
  },
  "bibe-burro-mesa-pouroff": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["flashFlood", "heat"],
    noteZh: "砾石河床走进窄峡谷，路不难，但雷雨天峡谷里有山洪，天色不对就别进；夏天只在清早走。",
  },
  "bibe-sotol-vista": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "铺装环路，有无障碍旱厕；官方说多数观景台轮椅能到。",
    source: ACCESS,
  },
  "bibe-mule-ears": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "观景台有无障碍步道，官方说多数观景台轮椅能到；去 Mule Ears 泉的约 6 公里步道是沙漠土路，夏天很热。",
    source: ACCESS,
  },
  "bibe-tuff-canyon": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "崖边的观景平台离停车场几百米；下到谷底的是陡坡，婴儿车、轮椅和腿脚不好的在上面看就好。",
  },
  "bibe-castolon": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["heat"],
    noteZh: "官方说小店无障碍，老房子之间是碎石地；河谷是园里最热的地方之一，5–9 月中午别在外面久待。",
    source: ACCESS,
  },
  "bibe-santa-elena-canyon": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["water", "heat"],
    noteZh:
      "官方说步道口厕所无障碍，但地形崎岖，轮椅去不了步道；要先蹚过 Terlingua 溪，再爬铺砌的台阶上崖边，水大就别过，格兰德河里也别下水。坐轮椅可以在停车场和路上的圣埃伦娜峡谷观景台看峡谷口。",
    source: ACCESS,
  },
  "bibe-night-sky": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "远离灯光的路边停车处就能看；奇索斯盆地的露天剧场按轮椅设计，但土坡道有几段很陡。",
    source: ACCESS,
  },
  "bibe-hot-springs": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["water", "heat"],
    noteZh:
      "官方说步道口厕所无障碍，但附近地形崎岖，轮椅去不了；约 41°C 的温泉不适合婴儿久泡，有心脏病的老人也少泡一会儿。一步之外就是水流急的格兰德河，孩子别下河。",
    source: ACCESS,
  },
  "bibe-rgv-nature-trail": {
    kidsFromAge: 2,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "开头约 400 米宽土路接木栈道，官方说木栈道轮椅能走；之后爬石灰岩小山就是碎石坡了，坐轮椅在湿地栈道上看看。山顶没有遮挡，夏天傍晚也很热。",
    source: ACCESS,
  },
  "bibe-boquillas-crossing": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["heat"],
    noteZh:
      "口岸有无障碍厕所，但过河坐的是小划桥船，岸边是碎石，再走约 800 米土路进村，婴儿车、轮椅都不好办；走不动可以骑驴、骑马或坐车进村。孩子也要带护照，夏天中午很热。",
  },
  "bibe-boquillas-canyon": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["heat"],
    noteZh: "先翻一座小山丘再下到河边沙滩，路不长但没有树荫；官方说附近地形崎岖，轮椅去不了。夏天只在清早或傍晚走，别下河。",
    source: ACCESS,
  },
  "bibe-terlingua": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh: "废墟之间是碎石土路，有老矿坑口，孩子别乱钻；坐轮椅可以在 Starlight Theatre 和杂货铺门廊一带看日落。",
  },
  "bibe-river-road": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "坐在车里看河谷就好；路边的 Closed Canyon 是窄缝峡谷，有光滑岩坎要上下，雨天有山洪风险，带小孩走一小段就回头。",
  },
};
