import type { Suitability } from "../attractions/types";

// 大峡谷南缘 · 同行适合度。2026-10-16 按 NPS 无障碍页面、2018 版《Access Your Park》无障碍手册和各观景点的 NPS 地点页整理：
// 班车都有轮椅坡道（轮椅限宽 76 厘米、长 122 厘米，电动代步车上不去）；Hermit Road 只通班车，行动不便的可以在游客中心
// 领 Scenic Drive Accessibility Permit 自驾进去；Trail of Time、Monument Creek Vista 到 Hermits Rest 的 Greenway 是轮椅能走的。
// 南缘海拔约 2,100 米，下到峡谷里夏天很热，上来的时间约是下去的两倍
const GUIDE = "https://www.nps.gov/grca/planyourvisit/upload/GRCA-Accessibility-Guide-2018.pdf";

export const suitability: Record<string, Suitability> = {
  "grca-mather-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方手册标为轮椅能到的观景点，从游客中心走铺装路过去，观景台有护栏；日出时人多，推轮椅早点到。",
    source: GUIDE,
  },
  "grca-yavapai": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "博物馆有无障碍入口、能摸的峡谷立体地形图，隔着大窗户就能看峡谷；到 Verkamp's 的 Trail of Time 约 2 公里，轮椅能走。",
    source: GUIDE,
  },
  "grca-bright-angel": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "下到 1.5 Mile Resthouse 要掉约 345 米，回程全是上坡，2026 年 8 月山洪后沿途饮水全关；带孩子、老人走到第一条隧道（约 15 分钟）就回头，上来不吃力，夏天别中午下去。",
  },
  "grca-south-kaibab": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "dropoff"],
    noteZh:
      "一开始就是陡的之字弯，路一侧是落差，几乎没有遮阴、没有水，回程上坡比下去累得多；孩子要走在里侧，老人可以只下几个弯看看就回头。",
  },
  "grca-hopi-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "NPS 标为轮椅能到；3–11 月只通班车，班车有轮椅坡道，也可以领无障碍自驾许可开进去。日落后回程班车很挤，推轮椅要排很久。",
    source: "https://www.nps.gov/places/000/hopi-point.htm",
  },
  "grca-hermits-rest": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "无障碍洗手间、小卖部和礼品店；从 Monument Creek Vista 到这里的 Greenway 步道轮椅能走。",
    source: GUIDE,
  },
  "grca-lipan-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "NPS 标为轮椅能到；2026 年 6 月 22 日到 12 月 23 日翻修步道和观景台，观景点和支路封闭，这期间去 Moran 或 Desert View 看。",
    source: "https://www.nps.gov/places/000/lipan-point.htm",
  },
  "grca-desert-view": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场到观景点和塔下是铺装路，轮椅能到、塔一层的店也能进；塔的上层要爬相当于五层楼的楼梯，轮椅、婴儿车上不去，老人量力而行。",
    source: GUIDE,
  },
  "grca-grandview-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "NPS 标为轮椅能到；旁边的 Grandview 步道一下去就很陡，没护栏，带孩子只在观景台看。",
    source: "https://www.nps.gov/places/000/grandview-point.htm",
  },
  "grca-moran-point": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "NPS 没有标成无障碍观景点，停车场边就能看到峡谷，往崖边走几步没有护栏，孩子要牵着。",
  },
  "grca-mohave-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方手册标为在车上就能看的观景点；3–11 月只通班车，想在车上看要领无障碍自驾许可。",
    source: GUIDE,
  },
  "grca-pima-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "NPS 标为轮椅能到，从这里到 Hermits Rest 的 Greenway 步道也能推轮椅，有自行车，孩子靠边走。",
    source: "https://www.nps.gov/places/000/pima-point.htm",
  },
  "grca-village-historic": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "沿铺装的边缘步道串起各栋老建筑，有几段坡，轮椅有人推比较稳；Kolb Studio 和 Lookout Studio 有台阶，官方说 Kolb Studio 轮椅进不去。",
    source: GUIDE,
  },
  "grca-tusayan-ruin": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说遗址环线和博物馆、书店都是轮椅能走的。",
    source: GUIDE,
  },
};
