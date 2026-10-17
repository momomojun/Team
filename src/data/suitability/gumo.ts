import type { Suitability } from "../attractions/types";

// 瓜达卢佩山 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：Pine Springs、McKittrick 峡谷、Dog Canyon 三个游客中心都是无障碍的，
// 无障碍设施里列了游客中心到 Pinery 遗址的铺装步道、Frijole 牧场到 Manzanita 泉的铺装步道；其余步道多是碎石、乱石和陡坡。
// 园内和附近几十英里没有加油站和商店，夏天低处常超过 38°C
const ACCESS = "https://www.nps.gov/gumo/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "gumo-pine-springs-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "有无障碍车位、无障碍洗手间和饮水机；去 Pinery 遗址的铺装步道就从这里出发。",
    source: ACCESS,
  },
  "gumo-pinery": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "往返约 1.2 公里的铺装步道，官方列在无障碍设施里，轮椅、婴儿车都能推到驿站遗址；遗址石墙别让孩子爬。",
    source: ACCESS,
  },
  "gumo-guadalupe-peak": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["dropoff", "heat"],
    noteZh:
      "往返约 13.5 公里、爬升约 900 米，要 6–8 小时，最后一段沿崖边的碎石路上山顶，山顶完全暴露，大风和午后雷暴都很危险；不适合小孩和体力一般的老人。全家可以开到 62/180 号公路边看 El Capitan 和瓜达卢佩峰，或走铺装的 Pinery 步道。",
  },
  "gumo-devils-hall": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble", "flashFlood"],
    noteZh: "后半段在干河床的大圆石间手脚并用往上爬，石头松动、雨后很滑，下雨或有雷雨预报别进；带老人、小孩只走前面约 1.6 公里沿峡谷的步道就回头。",
  },
  "gumo-el-capitan-viewpoint": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "公路两侧都有路边停车点，在车里就能看 El Capitan 绝壁；路边车开得快，孩子别跑到车道上。",
  },
  "gumo-frijole-ranch": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场旁有遮阳野餐棚和饮水机，去 Manzanita 泉是往返约 800 米的铺装步道；老牧场主屋改的博物馆进门有台阶。",
    source: ACCESS,
  },
  "gumo-smith-spring": {
    kidsFromAge: 5,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    noteZh: "前约 400 米到 Manzanita 泉是铺装步道，轮椅、婴儿车能推到这里；之后是碎石山路，爬升约 120 米到 Smith 泉。带老人、小孩可以只走到 Manzanita 泉。",
    source: ACCESS,
  },
  "gumo-mckittrick-nature-trail": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "partial",
    seniors: "caution",
    noteZh: "约 1.4 公里的土路小环线，先爬上一面向阳的坡；峡谷口的游客站官方列为无障碍，轮椅可以在游客站的户外展板和厕所一带看看。",
    source: ACCESS,
  },
  "gumo-pratt-cabin": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "往返约 7.4 公里，坡度不大，但要过两次溪、踩着石头走，留足 3–4 小时，17:00 前要开出大门；体力一般的走到第一次过溪处看看红叶就回头。",
  },
  "gumo-grotto": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "往返约 11 公里，要 3–5 小时，最晚中午前出发才赶得上关门；带小孩、老人走到 Pratt 小屋就回头。",
  },
  "gumo-salt-basin-dunes": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "remote"],
    noteZh: "从步道口在沙地上走约 1.6 公里才到沙丘，往返近 6 公里没有树荫；地方偏远、雨后土路会陷车，附近没有服务。只在凉快的季节来，带足水。",
  },
  "gumo-dog-canyon": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "约 1 公里的平缓土路小环线；Dog Canyon 游客站官方列为无障碍，但只在有人手时开。",
    source: ACCESS,
  },
};
