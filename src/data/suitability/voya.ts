import type { Suitability } from "../attractions/types";

// 航海家 · 同行适合度。2026-10-20 按 NPS 无障碍页面和各步道、游船的 Things To Do 页面整理：三个游客中心入口、厕所无障碍；
// 公园的游船能上轮椅，但和护林员一起上岸走的那一段不一定（Little American 岛、Kettle Falls 是宽的碎石路，Ellsworth 石头花园只有下半部分无障碍）；
// Oberholtzer 步道前 1/4 英里、Kabetogama 湖观景点 0.2 英里无障碍。游船 Recreation.gov 上 3 岁以下有单独的票，North Canoe Voyage 官方要求 8 岁以上
const ACCESS = "https://www.nps.gov/voya/planyourvisit/accessibility.htm";
const TOURS = "https://www.nps.gov/thingstodo/voyageurs-boat-tour.htm";

export const suitability: Record<string, Suitability> = {
  "voya-rainy-lake-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "入口、厕所无障碍，介绍片有字幕。",
    source: ACCESS,
  },
  "voya-kettle-falls": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["remote", "water"],
    noteZh:
      "游船能上轮椅，Kettle Falls 岸上是宽的碎石路，酒店老楼有台阶、门槛；全程约 5.5 小时，船上没有厕所（酒店有），小孩、老人坐这么久要有准备。湖上冷，带外套。",
    source: TOURS,
  },
  "voya-grand-tour": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "不上岸，船上有厕所，约 2.5 小时，带小孩、老人最轻松的一趟。婴儿车要折起来放。",
    source: TOURS,
  },
  "voya-life-on-the-lake": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "游船能上轮椅；Little American 岛的小路是约 1.2 米宽的碎石路，有一段之字形上下坡，坐轮椅要人帮忙。",
    source: TOURS,
  },
  "voya-ellsworth-rock-gardens": {
    kidsFromAge: 3,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["water"],
    noteZh: "游船能上轮椅，花园下半部分无障碍；上半部分要爬一块约 18 米高、斜着的花岗岩，雨后很滑，老人、小孩在下半部分看就够。船上没有厕所。",
    source: TOURS,
  },
  "voya-north-canoe-voyage": {
    kidsFromAge: 8,
    minAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh: "官方要求 8 岁以上，要自己划桨，风大时挺累；发救生衣，但建议会游泳。不到年龄的可以坐 Grand Tour 游船。",
    source: "https://www.nps.gov/voya/planyourvisit/guided-tours.htm",
  },
  "voya-oberholtzer-trail": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "前 1/4 英里是约 1.2 米宽的平整碎石路，轮椅、婴儿车能走；后面是有树根、石头的土路。",
    source: ACCESS,
  },
  "voya-echo-bay-trail": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "路宽、坡不大，但有树根和石头；老人、小孩走 1.5 英里的小环线就够。",
  },
  "voya-kabetogama-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "约 0.2 英里、1.2 米宽的碎石路，开头有一点上坡，停车场有一个无障碍车位，就在步道口那个角上。",
    source: "https://www.nps.gov/thingstodo/hike-kabetogama-lake-overlook-trail.htm",
  },
  "voya-blind-ash-bay": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh: "窄、绕、全是石头和树根，有上下坡；岩石顶上的观景处没有护栏，雨后很滑，孩子要牵着。老人可以只走到 Kabetogama 湖观景点。",
    source: "https://www.nps.gov/thingstodo/hike-blind-ash-bay-trail.htm",
  },
  "voya-ice-road": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["water", "remote"],
    noteZh: "在车里就能看；严寒（常到零下二三十摄氏度），带小孩、老人别在冰上久站。冰路以外的冰面不安全，别下车往外走，冰水、压力脊处可能裂开。",
    source: "https://www.nps.gov/voya/planyourvisit/winter-activities.htm",
  },
  "voya-night-sky": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "在停车场、休息区就能看；夜里凉、蚊子多，秋冬很冷，给孩子老人多带衣服、毯子。",
  },
};
