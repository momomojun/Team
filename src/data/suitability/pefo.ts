import type { Suitability } from "../attractions/types";

// 石化林 · 同行适合度。2026-10-16 按 NPS 无障碍页面和步道页面（逐条列了路面、坡度）整理：园内大部分步道铺装、没有障碍，
// 但好几条坡度超过 ADA 标准；普埃科村落环线官方说婴儿车、手动和电动轮椅都能走，长木、玛瑙屋步道前 800 米铺装能推；
// 游客中心、彩绘沙漠旅馆、彩虹森林博物馆都有无障碍洗手间。公园路沿途的观景点大多在路边，下车几步就到；夏天荒地反射热，午后常有雷暴
const ACCESS = "https://www.nps.gov/pefo/planyourvisit/accessibility.htm";
const TRAILS = "https://www.nps.gov/pefo/planyourvisit/trails.htm";

export const suitability: Record<string, Suitability> = {
  "pefo-painted-desert-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "有无障碍洗手间、带字幕的影片和能摸的展台；2026 年大楼施工关闭期间，咨询搬到彩绘沙漠旅馆，旁边的小餐馆也有无障碍洗手间。",
    source: ACCESS,
  },
  "pefo-tiponi-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边观景点，停车场边、车上就能看。",
  },
  "pefo-tawa-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场边就能看；通往北入口的 Tawa 步道是压实的平路，官方说符合户外场所标准，最陡约 8%；往彩绘沙漠旅馆的崖边步道是土路碎石、有挡水坎，推车、轮椅不好走。",
    source: TRAILS,
  },
  "pefo-painted-desert-inn": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "有无障碍洗手间，但这是老建筑，官方说有些地方可能要人帮忙；屋后的卡奇纳观景点就在停车场边。",
    source: ACCESS,
  },
  "pefo-pintado-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边观景点，停车场边、车上就能看；风大，婴儿车别离手。",
  },
  "pefo-onyx-bridge": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "flashFlood"],
    noteZh:
      "先沿之字形小路下降约 90 米，谷底没有路标要自己看图找路，没有水和遮阴，回程是上坡；雷雨天河沟会涨水。带孩子、老人在卡奇纳观景点看荒野就好，或者只下几个弯就回头。",
  },
  "pefo-route-66": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "观景台就在停车场边，老车和电线杆在车上也看得到。",
  },
  "pefo-puerco-pueblo": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "约 0.5 公里铺装环线，官方说婴儿车、手动和电动轮椅都能走，只有一小段岔路不行；有无障碍洗手间。",
    source: TRAILS,
  },
  "pefo-newspaper-rock": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场边几步就到崖边观景台，离岩画有一段距离，带望远镜看得清楚。",
  },
  "pefo-tepees": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "公园路两边就是，开车经过、路边停一下就能看；Blue Forest 步道往返约 4.8 公里，是土路荒地，老人小孩不用走。",
  },
  "pefo-blue-mesa": {
    kidsFromAge: 4,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "台地顶的环形路上几个观景点在车上、停车场边就能看；下到荒地的环线铺装和碎石交替，开头一段下坡很陡，回程要爬上来，荒地里反射热。老人、轮椅在台地顶看就好，雨后膨润土很滑。",
    source: TRAILS,
  },
  "pefo-agate-bridge": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场边走几步就到观景台，石桥不能走上去。",
  },
  "pefo-jasper-forest": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场边的观景台就能俯瞰谷底的化石木；下到谷底的老路往返约 4 公里，没有遮阴，带老人小孩不用下去。",
  },
  "pefo-crystal-forest": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "约 1.2 公里铺装环线，路宽，平均坡度约 5%，但有几段最陡约 22%，轮椅要有人推；没有遮阴，夏天上午去。",
    source: TRAILS,
  },
  "pefo-rainbow-forest-museum": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "博物馆有坡道、无障碍洗手间、能摸的展台和带字幕的影片；馆后的巨木步道虽然铺装，但有几组台阶、最陡约 19%，官方说婴儿车和轮椅可能不适合。",
    source: TRAILS,
  },
  "pefo-long-logs-agate-house": {
    kidsFromAge: 3,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["heat"],
    noteZh:
      "两条步道前约 800 米铺装，官方说婴儿车和轮椅能推，后面是粗糙的土路，长木环线不建议大多数轮椅走；全程几乎没有遮阴。带婴儿、轮椅推到铺装段尽头就回头，老人夏天上午走。",
    source: TRAILS,
  },
};
