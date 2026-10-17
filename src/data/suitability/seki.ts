import type { Suitability } from "../attractions/types";

// 红杉与国王峡谷 · 同行适合度。2026-10-16 按 NPS 无障碍总页和 Giant Forest & Lodgepole、Grant Grove、Cedar Grove、
// Foothills 各区的无障碍页面整理：谢尔曼将军树步道（从无障碍停车场出发）官方写明轮椅能走，Big Trees Trail 是铺装加栈道；
// 格兰特将军树步道虽然铺装但有陡坡，官方不算无障碍；夏季巨人森林一带的免费班车都能上轮椅，
// Giant Forest 博物馆、Lodgepole、Kings Canyon 游客中心能借手动轮椅
const GIANT_FOREST = "https://www.nps.gov/seki/planyourvisit/accessibility-giant-forest-lodgepole.htm";
const GRANT_GROVE = "https://www.nps.gov/seki/planyourvisit/accessibility-grant-grove.htm";
const CEDAR_GROVE = "https://www.nps.gov/seki/planyourvisit/accessibility-cedar-grove.htm";
const FOOTHILLS = "https://www.nps.gov/seki/planyourvisit/accessibility-foothills.htm";

export const suitability: Record<string, Suitability> = {
  "seki-giant-forest-museum": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "门口是专用的无障碍停车场，平坦铺装路到门口；能借手动轮椅。馆外紧挨着的洗手间不无障碍，要用马路对面停车场的。",
    source: GIANT_FOREST,
  },
  "seki-general-sherman": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh:
      "官方说从 Sherman Tree 无障碍停车场出发的铺装小路轮椅能走、坡很缓；从 Wolverton Road 旁的主停车场走是下坡去、上坡回，海拔约 2,100 米，老人回程慢慢走。",
    source: GIANT_FOREST,
  },
  "seki-moro-rock": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh:
      "350 多级窄石阶，大部分有栏杆，但一侧就是几百米的悬崖，顶上平台也不大；小孩要牵着，恐高和膝盖不好的在停车场看看巨岩就好，打雷时别上。",
  },
  "seki-tunnel-log": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车从树干下穿过去，在车上就能看；下车拍照留意来往车辆。",
  },
  "seki-crescent-meadow": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh:
      "夏天有能上轮椅的班车到这里，有无障碍旱厕，但停车位坡很大；绕草甸的步道是土路，轮椅在步道口附近看看草甸。这里常见黑熊，孩子别离开大人身边。",
    source: GIANT_FOREST,
  },
  "seki-tokopah-falls": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "坡缓但是石头土路，最后一段在乱石间走；初夏融雪时河水又急又冷，孩子别下到河边石头上。",
  },
  "seki-general-grant": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "全程铺装，但有几段陡坡，官方不算无障碍步道，轮椅要有人推；绕树的一小段有台阶，可以绕开。",
    source: GRANT_GROVE,
  },
  "seki-kings-canyon": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车看，沿途观景台路边停车就能看峡谷；下谷底的山路弯多，容易晕车的提前吃药。",
  },
  "seki-zumwalt-meadow": {
    kidsFromAge: 3,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "大部分是平坦土路，有一段要走过乱石坡；婴儿车能推开头一段，到乱石坡就回头。",
  },
  "seki-congress-trail": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "全程铺装，但起伏比谢尔曼树那一小段大，轮椅最好有人协助；从停车场下来回程要爬坡。",
  },
  "seki-big-trees-trail": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说是铺装路，草甸另一侧是长栈道，坡度中等，有歇脚处；博物馆旁有专用无障碍停车场。",
    source: GIANT_FOREST,
  },
  "seki-mist-falls": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "往返约 13 公里，前面几英里平但没有树荫，夏天很晒，最后约 1.6 公里（1 英里）上坡、爬升约 180 米（600 英尺）；带孩子、老人走到 Bubbs Creek 岔路的大桥看看河就回头。瀑布边石头湿滑，别靠近水边。",
  },
  "seki-roaring-river-falls": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "官方说是约 160 米长、有坡的铺装小路，步道口正前方有一个无障碍车位，轮椅有人推能到瀑布观景处。",
    source: CEDAR_GROVE,
  },
  "seki-panoramic-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "停车场到观景台是铺装路，但坡比较陡，轮椅要有人推；有一个无障碍车位和无障碍旱厕。",
    source: GRANT_GROVE,
  },
  "seki-hospital-rock": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "野餐区和洗手间有铺装缓坡路；看岩画的平台要爬陡台阶，轮椅可以在地面用望远镜看。下到河边的小路又陡又窄。",
    source: FOOTHILLS,
  },
};
