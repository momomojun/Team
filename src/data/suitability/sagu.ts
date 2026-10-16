import type { Suitability } from "../attractions/types";

// 巨人柱 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：东西两个游客中心完全无障碍，Desert Discovery（西区）、Desert Ecology（东区）
// 是有解说牌的铺装步道，东区 Cactus Forest 环线 7 个观景停车处有无障碍车位，西区 Bajada 环线野餐区有无障碍车位；
// 沙漠博物馆按博物馆官网，Sabino Canyon 接驳车按运营方官网。5–9 月白天常到 40°C 以上，步道几乎没有树荫
const ACCESS = "https://www.nps.gov/sagu/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "sagu-red-hills-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方写明完全无障碍，有自动门、地面平；门口的仙人掌园小环线是铺装路，放映厅有音量辅助和口述影像。",
    source: ACCESS,
  },
  "sagu-desert-discovery": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "约 800 米的铺装环线，路边有解说牌和带长椅的遮阳亭，轮椅、婴儿车都能推；夏天只在清早或日落前来。",
    source: ACCESS,
  },
  "sagu-valley-view-overlook": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "土路，要下到两条干河床再缓缓上坡，推不了婴儿车；看完日落天很快黑，带头灯。",
  },
  "sagu-signal-hill": {
    kidsFromAge: 2,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "约 270 米不平的石阶，推不了轮椅和婴儿车；山脚的野餐区有无障碍野餐桌和厕所，但看不到岩画。",
  },
  "sagu-bajada-loop": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "坐在车里看巨人柱；砂石路但普通车能开，沿途野餐区有无障碍车位、无障碍野餐桌和厕所（厕所没有水）。",
    source: ACCESS,
  },
  "sagu-wasson-peak": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "往返约 11 公里、爬升约 550 米，几乎没有树荫，夏天别走，冬天也要每人带 2–3 升水；带小孩、老人走红山游客中心附近的 Desert Discovery 铺装步道。",
  },
  "sagu-desert-museum": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "可以在服务台租轮椅、婴儿车和电动代步车；八成以上是户外，大部分小路铺装，个别土路和老展馆不好推，有坡。夏天早上一开门就进，中午很晒。",
    source: "https://desertmuseum.org/visit/mobilitydevices",
  },
  "sagu-gates-pass": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场边就能看日落；往小石屋和岩石坡上走是碎石和石阶，坡边孩子要牵着。",
  },
  "sagu-rincon-mountain-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方写明完全无障碍，有自动门、地面平，可以借助听设备；门口的仙人掌园小路是铺装的。",
    source: ACCESS,
  },
  "sagu-cactus-forest-drive": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh:
      "铺装环线，7 个观景停车处有无障碍车位；路边约 400 米的 Desert Ecology 步道是铺装的，Mica View 步道是压实地面，轮椅、助行器都能走。",
    source: ACCESS,
  },
  "sagu-javelina-rocks": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "路边停车就能看；爬上圆石堆要手脚并用，孩子要有人在旁边护着，石缝里常有蛇。",
  },
  "sagu-freeman-homestead": {
    kidsFromAge: 2,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
  },
  "sagu-tanque-verde-ridge": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "到观景点约 1 公里的碎石小路，推不了婴儿车；步道口的 Javelina 野餐区厕所有铺装小路能到。再往上走没有水和树荫，夏天别去。",
  },
  "sagu-bridal-wreath-falls": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "flashFlood"],
    noteZh: "往返约 9.5 公里、爬升约 350 米，几乎没有树荫；夏天太热，季风季小峡谷里有山洪。带小孩、老人在东区开 Cactus Forest 环线、走铺装的 Desert Ecology 步道就好。",
  },
  "sagu-sabino-canyon": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "partial",
    seniors: "ok",
    noteZh:
      "峡谷里是一条铺装公路，坐接驳车进去、走下来都行；车上婴儿车要折起来放座位下，孩子要能坐在大人腿上。运营方说司机后面第一排留给带助行器的乘客，能不能直接推轮椅上车没写，要先打 520-792-2953 问。",
    source: "https://sabinocanyoncrawler.com/",
  },
};
