import type { Suitability } from "../attractions/types";

// 落基山 · 同行适合度。2026-10-16 按 NPS 无障碍指南（Access Guide，2026 年 7 月版）整理：官方给了每条无障碍步道的坡度和障碍，
// Sprague Lake、Lily Lake、Coyote Valley 和 Holzwarth 进场路允许残障人士用电动助行器；Bear Lake 环湖和 Forest Canyon 官方写明不适合轮椅；
// 班车都能上轮椅。Bear Lake 一带的步道起点海拔都在 2,800 米以上，Trail Ridge Road 最高处超过 3,600 米
const ACCESS = "https://home.nps.gov/romo/planyourvisit/upload/Access-Guide-508-updated-July-7-2026.pdf";

export const suitability: Record<string, Suitability> = {
  "romo-beaver-meadows-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "有无障碍车位；下层的大型互动地图和放映厅坐升降机能到，室外和下层都有冲水厕所。",
    source: ACCESS,
  },
  "romo-sheep-lakes": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边停车场有无障碍车位，在停车场边、车里就能看羊群；旁边的长椅是原木做的，地面不平。",
    source: ACCESS,
  },
  "romo-alluvial-fan": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["water"],
    noteZh:
      "从西停车场走铺装路到瀑布旁的小桥，平均坡度 6%、有一小段 10%，轮椅有人协助能到；东停车场那头有一段超过 19% 的陡坡，别从那边走。水边的巨石又湿又滑，孩子别爬上去。",
    source: ACCESS,
  },
  "romo-deer-mountain": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh: "往返约 10 公里、一路之字形上坡到约 3,050 米的山顶，夏天午后常有雷暴；带小孩、老人可以改走平缓的 Sprague Lake 或熊湖环湖。",
  },
  "romo-moraine-park": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh:
      "路边停车处、车里就能看草甸和麋鹿；路边的 Discovery Center 有无障碍车位和到二楼的电梯。秋天发情期的公麋鹿会冲人，和它们保持至少 23 米，孩子别跑进草甸。",
    source: ACCESS,
  },
  "romo-sprague-lake": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh:
      "约 1.3 公里的压实碎石环湖路，大多很平，官方列为无障碍步道；但上桥、栈道和钓鱼平台有约 7.5 厘米的坎，逆时针走约 500 米处有一小段露出的石头和树根，轮椅最好有人帮一把。",
    source: ACCESS,
  },
  "romo-bear-lake": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["altitude"],
    noteZh:
      "官方说环湖步道不适合轮椅：西南侧有 25 级原木台阶，最陡一段坡度 23%；轮椅、婴儿车在步道口湖边看一眼就好，想绕湖可以去 Sprague Lake。海拔约 2,890 米，老人慢慢走。",
    source: ACCESS,
  },
  "romo-emerald-lake": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh: "往返约 5.8 公里、海拔从 2,890 米爬到约 3,080 米，一路上坡，6 月前常有积雪；带小孩、老人可以只走到第一个宁芙湖（单程约 800 米）就回头。",
  },
  "romo-alberta-falls": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["water", "altitude"],
    noteZh: "土路上有石头和树根，推不了婴儿车；海拔约 2,850 米，走慢一点。瀑布边的岩石湿滑、水流急，孩子别靠近水边。",
  },
  "romo-mills-lake": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh: "往返约 9 公里，最后一段要走过大片光滑的岩板，下雨后很滑；带小孩、老人走到艾伯塔瀑布（单程约 1.3 公里）就回头。",
  },
  "romo-sky-pond": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble", "altitude"],
    noteZh:
      "往返约 14.5 公里，Timberline Falls 旁要手脚并用爬一段湿滑的岩坡，终点海拔约 3,320 米；带孩子、老人在开阔的 The Loch 湖边折返，不用爬那段岩坡。",
  },
  "romo-many-parks-curve": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh:
      "约 150 米长的观景栈道坡度 6–9%、中间没有平台，轮椅最好有人帮；坐轮椅从下层停车场（往东开时才进得去）过去最平，上层停车场到人行横道的小路很陡。",
    source: ACCESS,
  },
  "romo-rainbow-curve": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "无障碍车位在厕所西南侧，停车场一圈是水泥人行道、坡度不大；海拔约 3,300 米，下车别跑。",
    source: ACCESS,
  },
  "romo-forest-canyon-overlook": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh:
      "海拔约 3,570 米；到观景台约 200 米的柏油路破碎不平、一大段坡度 14.5%，官方说不适合轮椅，坐轮椅在停车场看山就好。老人走回来是上坡，喘就停下歇。",
    source: ACCESS,
  },
  "romo-tundra-communities": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh:
      "全程柏油路，但海拔约 3,690 米起步，平均坡度 7.6%、最陡 26%，官方说坐轮椅或行动不便的要有人协助；停车场右侧的入口是斜坡、左侧是石阶。体力一般的老人走一小段看看苔原就回头。",
    source: ACCESS,
  },
  "romo-alpine-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["altitude"],
    noteZh:
      "有无障碍车位和触摸式地图，厕所在停车场对面的室外；海拔约 3,595 米，有心肺问题的别久待。对面的 Alpine Ridge Trail 全是台阶，老人小孩量力而行。",
    source: ACCESS,
  },
  "romo-gore-range-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边观景台有无障碍车位，停车就能看；小路边缘落差很大，孩子要牵着。",
    source: ACCESS,
  },
  "romo-milner-pass": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "大陆分水岭的标牌就在停车场旁，轮椅能到停车场拍照；去 Poudre 湖边是土路。",
  },
  "romo-old-fall-river-road": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "坐在车里看风景；路窄弯急、大多没有护栏，恐高的人坐外侧会紧张。中途 Chasm Falls 要下车走一小段陡土路，婴儿车、轮椅去不了。",
  },
  "romo-farview-curve": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "有 1 个无障碍车位，但从停车位上人行道的路缘坡道很陡（16%），坡顶还有垃圾桶挡路，轮椅要有人帮忙。",
    source: ACCESS,
  },
  "romo-holzwarth": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh:
      "到牧场约 800 米的压实碎石路很宽、坡度不大，官方允许残障人士用电动助行器；牧场里的小路有石头树根、最陡 16%，小屋都要上木台阶。草甸上常有驼鹿，至少离 23 米。",
    source: ACCESS,
  },
  "romo-kawuneeche-valley": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh:
      "Coyote Valley 步道约 1.6 公里，压实碎石和栈道，官方列为无障碍步道，夏天有泥坑，上桥有个小坎。驼鹿看着温顺但会冲人，至少离 23 米，带小驼鹿的母驼鹿更要远离。",
    source: ACCESS,
  },
  "romo-kawuneeche-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "有无障碍车位，冲水厕所在室外停车场旁。",
    source: ACCESS,
  },
  "romo-adams-falls": {
    kidsFromAge: 2,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "单程约 500 米的土路，有石头和小坡，推不了婴儿车；瀑布在花岗岩窄缝里，观景处的岩石湿滑，孩子别靠近水边往下探。",
  },
};
