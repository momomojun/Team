import type { Suitability } from "../attractions/types";

// 优胜美地 · 同行适合度。2026-10-16 按 NPS 无障碍页面和各步道、地点页面整理：山谷免费班车都能上轮椅；
// 官方写明能坐轮椅去的有下优胜美地瀑布环线东半段、库克草甸环线、新娘面纱瀑布半路的观景平台、冰川点观景台、
// 马里波萨巨杉林的 Big Trees Loop（持残障停车证可以开车到灰熊巨人停车场）；其余步道按景点数据和常识判断
const ACCESS = "https://www.nps.gov/yose/planyourvisit/accessibility.htm";
const LOWER_FALL = "https://www.nps.gov/yose/planyourvisit/lowerfalltrail.htm";
const COOKS_MEADOW = "https://www.nps.gov/yose/planyourvisit/cooksmeadowtrail.htm";
const MIRROR_LAKE = "https://www.nps.gov/yose/planyourvisit/mirrorlaketrail.htm";
const BRIDALVEIL = "https://www.nps.gov/places/000/bridalveil-fall.htm";
const GLACIER_POINT = "https://www.nps.gov/places/000/glacier-point.htm";
const MARIPOSA = "https://www.nps.gov/yose/planyourvisit/mg.htm";

export const suitability: Record<string, Suitability> = {
  "yose-tunnel-view": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边停车场就是观景位，下车就能看；停车场车多，孩子别在车道上跑。",
  },
  "yose-bridalveil-fall": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "partial",
    seniors: "ok",
    noteZh:
      "全程铺装；官方说半路有一个轮椅能到的观景平台，再往上坡变陡，轮椅到不了最后的观景区。春天水雾大、路面湿滑，婴儿车要罩好。",
    source: BRIDALVEIL,
  },
  "yose-el-capitan": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "在 Northside Drive 路边停车或在车上就能看到岩壁；草甸里是土路，轮椅留在路边看就好。",
  },
  "yose-yosemite-falls": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "环线全程铺装、能推婴儿车；官方说东半段轮椅能走（结冰积雪时除外），西半段有一段坡太陡，轮椅原路返回。",
    source: LOWER_FALL,
  },
  "yose-mist-trail": {
    kidsFromAge: 6,
    stroller: "partial",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water", "dropoff"],
    noteZh:
      "过了弗纳尔瀑布桥是六百多级湿滑的花岗岩台阶，瀑布顶上有人越过栏杆被冲下去；带小孩、老人走到弗纳尔瀑布桥（铺装但很陡）看瀑布就回头，婴儿车也只能推到这里。",
  },
  "yose-mirror-lake": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "前 1 英里是铺装的服务道路，一直通到湖边，婴儿车可以推到湖边，再往前禁止推车；路有缓坡，轮椅最好有人协助。",
    source: MIRROR_LAKE,
  },
  "yose-half-dome": {
    kidsFromAge: 14,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["dropoff", "scramble"],
    noteZh:
      "往返约 24 公里、爬升约 1,460 米，最后约 120 米要抓钢缆爬陡峭的花岗岩坡，两边没有遮挡，遇雷雨很危险；不适合小孩和体力一般的。全家可以走雾径到弗纳尔瀑布，在冰川点或哨兵桥看半穹顶。",
  },
  "yose-horsetail-fall": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "caution",
    noteZh:
      "从停车场到观景区要沿平坦的路走约 2.4 公里，2 月傍晚很冷，人挤人要等一两个小时，看完天已经黑了；带老人小孩多穿、带头灯和折叠椅，轮椅要有人推。",
  },
  "yose-glacier-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说从主停车场沿约 270 米铺装的之字形小路能坐轮椅到观景台，洗手间、小卖部都无障碍；观景台边上是几百米深的悬崖，孩子别爬护栏。",
    source: GLACIER_POINT,
  },
  "yose-taft-point": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh:
      "林间土路不难走，但终点悬崖边只有一小段护栏，旁边的 The Fissures 裂缝深不见底；小孩一定牵着，别让他们靠近崖边和裂缝。想轻松看山谷可以开到冰川点。",
  },
  "yose-tuolumne-meadows": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "Tioga Road 路边就能看到草甸；草甸里的小路是土路，海拔约 2,600 米，老人走慢点容易喘。",
  },
  "yose-olmsted-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场就能看到半穹顶背面；往上爬花岗岩坡视野更好，但轮椅、婴儿车上不去。",
  },
  "yose-tenaya-lake": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "路边停车就能看湖；沙滩是软沙，轮椅、婴儿车推不动。湖水夏天也冰，孩子下水要看着。",
  },
  "yose-mariposa-grove": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh:
      "官方说 Big Trees Loop 平坦、轮椅能走；持残障停车证可以开车到灰熊巨人停车场，从那里有一段轮椅能走的步道。去灰熊巨人和加州隧道树的步道是土路、有坡，婴儿车只能推 Big Trees Loop。",
    source: MARIPOSA,
  },
  "yose-sentinel-dome": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "前面是平缓的林间土路，最后一段爬光秃秃的花岗岩坡，坡陡但不暴露，海拔约 2,400 米会喘；顶上风大，下山别太晚。",
  },
  "yose-washburn-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边观景台，停车下来就能看，在车上也看得到。",
  },
  "yose-valley-view": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边停车就能看；下到河边是土坡，春天水急，孩子别下水。",
  },
  "yose-swinging-bridge": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "山谷的铺装自行车道经过桥头，轮椅有人推能到桥上；春季融雪时默塞德河又急又冷，每年都有人溺水，孩子只在夏末水缓时到浅滩玩。",
  },
  "yose-cooks-meadow": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说这条环线轮椅能走（积雪时除外），也能推婴儿车；栈道下雨或结霜很滑。",
    source: COOKS_MEADOW,
  },
  "yose-sentinel-bridge": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "桥面平坦，停车场就在旁边，轮椅能上桥看半穹顶倒影；车位很少，可以坐山谷班车过来。",
  },
  "yose-upper-yosemite-fall": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "dropoff"],
    noteZh:
      "往返约 11.6 公里、爬升约 820 米，一路陡的之字形石路，夏天下午很晒；瀑布顶观景处在悬崖边。带孩子、老人走到哥伦比亚岩（往返约 3.2 公里）看完山谷就回头。",
  },
  "yose-four-mile-trail": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "往返约 15 公里、爬升约 975 米，一直是之字形上坡，冬春上段结冰；体力一般的走一两公里看看酋长岩就回头，想看冰川点的全景直接开车上去。",
  },
  "yose-nevada-fall": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water", "dropoff"],
    noteZh:
      "往返约 8.7 公里、爬升约 600 米，雾径台阶湿滑，两道瀑布顶上都有人越过栏杆被冲下去；带小孩、老人走到弗纳尔瀑布桥或弗纳尔瀑布顶就回头。",
  },
  "yose-valley-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "在 Yosemite Village 的平地上，旁边就是博物馆和画廊；山谷免费班车都能上轮椅，停车场满了就坐班车来。",
    source: ACCESS,
  },
  "yose-tuolumne-grove": {
    kidsFromAge: 4,
    stroller: "partial",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "沿一条旧的铺装老路下到林子里，下降约 150 米，回程一路上坡；婴儿车能推但很累，老人回程慢慢走，想轻松看巨杉可以去马里波萨巨杉林的 Big Trees Loop。",
  },
  "yose-hetch-hetchy": {
    kidsFromAge: 5,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["water", "heat"],
    noteZh:
      "大坝和隧道是平路，轮椅、婴儿车能推到隧道那头看水库；之后是石头土路，夏天很晒，春季水大时瀑布下的桥上会被激流冲刷。带小孩、老人走过大坝看看就回头。",
  },
  "yose-lembert-dome": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude", "dropoff"],
    noteZh: "顶上海拔约 2,900 米，最后一段爬光滑的花岗岩坡，越往上越陡，朝草甸那一面是陡崖；带孩子停在坡下缓的地方看草甸就好，想轻松看日落可以去坑洼穹顶。",
  },
  "yose-cathedral-lakes": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh: "往返约 11 公里，湖在海拔约 2,900 米，开头一段一直上坡，容易喘；带孩子、老人可以只走到下湖，或者改走五月湖这种短的。",
  },
  "yose-gaylor-lakes": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh: "起点就在海拔约 3,000 米，一开始就是陡坡，刚上山的人容易头痛气喘；路短，翻过山脊看到第一个湖就可以回头，午后有雷阵雨前下山。",
  },
  "yose-may-lake": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh: "路短，但一路上坡、有一段花岗岩石板，湖在海拔约 2,800 米，老人走慢点、多歇几次。",
  },
  "yose-pothole-dome": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
  },
  "yose-chilnualna-falls": {
    kidsFromAge: 9,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "往返约 13 公里、爬升约 730 米，夏天中午热；带小孩、老人看完起点附近的那段小瀑布就回头。",
  },
  "yose-pioneer-history-center": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场到廊桥不远；木屋之间是土路和碎石，轮椅、婴儿车推起来颠簸，有的木屋要上台阶。",
  },
};
