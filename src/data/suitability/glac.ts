import type { Suitability } from "../attractions/types";

// 冰川 · 同行适合度。2026-10-16 按 NPS 行动不便页面整理：雪松步道是无障碍步道，奔鹰瀑布轮椅、婴儿车都能走，
// Apgar、St. Mary、洛根山口游客中心和山羊舔盐点观景台无障碍；园内班车都有坡道或升降台，红巴士只有少数能上轮椅。
// 园内所有步道都可能碰到灰熊，熊多、常因熊关闭的步道标了 wildlife
const PHYS = "https://www.nps.gov/glac/planyourvisit/physical-mobility.htm";

export const suitability: Record<string, Suitability> = {
  "glac-apgar-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "单层建筑，停车场到门口有无障碍步道；旁边就是铺装的 Apgar 自行车道。",
    source: PHYS,
  },
  "glac-lake-mcdonald": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "Apgar 村边铺装处就能看湖，湖滩是鹅卵石，婴儿车、轮椅下不去；湖水夏天也冰冷，孩子玩水要有人看着。",
  },
  "glac-trail-of-the-cedars": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说是 0.9 英里（约 1.4 公里）的无障碍环线，路面是木栈道和硬化铺装；峡谷桥上有栏杆。",
    source: PHYS,
  },
  "glac-avalanche-lake": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["wildlife"],
    noteZh:
      "往返约 7.4 公里、爬升约 150 米，林间缓上坡，有树根和石头；林子里视线差、常有熊，结伴、出声、带熊喷雾。体力一般的可以只走雪松步道。",
  },
  "glac-red-bus-tour": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "官方说只有少数几辆红巴士能上轮椅，订票时要说明；婴儿车要收起来放在车上。下雨或冷时车顶不开，老人孩子带外套。",
    source: PHYS,
  },
  "glac-going-to-the-sun-road": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车沿路看，路边停车点很多；西段一侧就是悬崖，下车拍照时孩子别靠近矮墙。",
  },
  "glac-logan-pass": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游客中心有坡道上到上层平台，铺装步道上能看群峰和解说牌；海拔约 2,026 米，老人走动慢一点。",
    source: PHYS,
  },
  "glac-hidden-lake-overlook": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["wildlife"],
    noteZh:
      "往返约 4.2 公里、爬升约 185 米，木栈道有很多台阶，7 月上旬前常埋在雪下；灰熊常在湖边觅食，下湖段常关闭。带孩子、老人走一段栈道看草甸和雪山羊就回头。",
  },
  "glac-highline-trail": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["dropoff", "wildlife"],
    noteZh:
      "单程约 19 公里，开头是崖壁上凿出的窄道，一侧是几十米的落差，只有一根钢索扶；Granite Park 一带灰熊常出没。不适合小孩和体力一般的老人，全家可以改走隐湖观景台。",
  },
  "glac-jackson-glacier-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边观景点，在车上就能远看冰川，带望远镜。",
  },
  "glac-st-mary-virginia-falls": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "往返约 5.8 公里、累计爬升约 165 米，先下后上，回程要爬坡，没有遮阴；带孩子、老人可以只走到圣玛丽瀑布就回头。",
  },
  "glac-sun-point-baring-falls": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场附近就能看湖；去巴林瀑布是林间土路，先下坡，回程上坡。太阳点岩台风很大，边上孩子要牵着。",
  },
  "glac-wild-goose-island": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边停车区就能看，在车上也看得到。",
  },
  "glac-st-mary-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "单层建筑，停车场到门口有无障碍步道；厕所在外面，门不是自动门。",
    source: PHYS,
  },
  "glac-swiftcurrent-lake": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh:
      "从 Grinnell Glacier 步道口到一座小桥的一段是硬化土路，轮椅能走一小段，Many Glacier 酒店旁的码头也无障碍；环湖一圈约 3.7 公里土路。对岸山坡常有熊和驼鹿，别靠近。",
    source: PHYS,
  },
  "glac-many-glacier-boat": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "partial",
    seniors: "ok",
    noteZh:
      "官方说码头无障碍，但船是老木船，两湖之间还要下船走一段上坡小路换船；坐轮椅的订票前先问船公司。4–12 岁买儿童票，婴儿车上船要收起来。",
    source: PHYS,
  },
  "glac-grinnell-glacier": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["wildlife", "dropoff"],
    noteZh:
      "坐船也要往返约 11.6 公里、爬升约 490 米，后半段在崖壁上爬升，外侧落差大，还要从瀑布下穿过；灰熊很多。带孩子、老人坐船走平路到格林内尔湖就回头。",
  },
  "glac-iceberg-lake": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["wildlife"],
    noteZh: "往返约 15.4 公里、爬升约 370 米，坡不陡但路长；沿途浆果坡灰熊常出没，常临时关闭。体力一般的走到 Ptarmigan 瀑布就回头。",
  },
  "glac-running-eagle-falls": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说这条约 500 米的短步道轮椅、婴儿车都能走，路面是硬化土；步道口有旱厕。",
    source: PHYS,
  },
  "glac-two-medicine-lake": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路尽头的停车场和小商店旁就能看湖和 Sinopah 山。",
  },
  "glac-goat-lick": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说一小段铺装路通到观景台；厕所比较简陋。",
    source: PHYS,
  },
  "glac-bowman-lake": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["remote"],
    noteZh: "最后约 10 公里是窄的坑洼土路，一路没有加油站、手机基本没信号，带够水和吃的；湖边停车处就能看湖。",
  },
};
