import type { Suitability } from "../attractions/types";

// 大提顿 · 同行适合度。2026-10-16 按 NPS 无障碍页面和行动不便页面整理：南珍妮湖的铺装步道和东岸码头、渡船能上轮椅，
// Craig Thomas、Colter Bay 游客中心无障碍，Moose、珍妮湖、Colter Bay 三个游客中心能借轮椅；路边观景点有路缘坡道和无障碍车位；
// 梅诺渡口、杰克逊湖大坝的铺装或压实小路有的地方宽度、坡度不达标。空中缆车按 NPS 地点页
const ACCESS = "https://www.nps.gov/grte/planyourvisit/accessibility.htm";
const PHYS = "https://www.nps.gov/grte/planyourvisit/physical-mobility.htm";

export const suitability: Record<string, Suitability> = {
  "grte-jenny-lake": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "南珍妮湖的铺装步道官方说符合无障碍标准，能推到湖边的观景处；东岸码头、栈桥和渡船都能上轮椅。湖水很冷，划船要穿救生衣。",
    source: PHYS,
  },
  "grte-hidden-falls": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh:
      "下船到隐秘瀑布约 800 米土路，一路缓上坡；再上灵感点是石阶、裸露的树根和岩石，观景处是没有护栏的岩壁边。带小孩、老人走到隐秘瀑布就回头。",
  },
  "grte-teton-park-road": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车沿路看，路边观景点官方说有路缘坡道和无障碍车位。",
    source: ACCESS,
  },
  "grte-oxbow-bend": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边停车区就能看河湾和 Mount Moran；岸边柳丛常有驼鹿，别下到河边靠近。",
  },
  "grte-mormon-row": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh: "沿碎石路开到谷仓旁，坐轮椅在车边就能拍；谷仓周围是土路和草地。野牛常在路边吃草，别下车靠近，保持 25 码以上。",
  },
  "grte-schwabacher-landing": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "下到河边停车场是约 1.6 公里土路，停车场旁就能看到河面；去最经典的倒影池要沿河边土路走几百米。",
  },
  "grte-snake-river-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "191 号公路边的观景点，官方说路边观景点都有路缘坡道和无障碍车位。",
    source: ACCESS,
  },
  "grte-craig-thomas-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "9 个无障碍车位，正门有按钮自动门，互动展品都按轮椅高度设计；能借轮椅。",
    source: PHYS,
  },
  "grte-chapel-transfiguration": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "梅诺渡口约 500 米的小路平坦压实，但官方说有的地方太窄、不达标；Menor 杂货店和 Maud Noble 小屋没有坡道进不去。",
    source: PHYS,
  },
  "grte-lsr-preserve": {
    kidsFromAge: 4,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh:
      "从停车场到保护区中心有约 230 米符合无障碍坡度的硬化路，再往前约 150 米到溪边和小瀑布观景处；去菲尔普斯湖的环线约 5 公里，是土路。",
    source: PHYS,
  },
  "grte-moose-wilson-road": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh: "开车沿路看，在车上就能找驼鹿和黑熊；路窄，熊或驼鹿在路边时别下车，和熊保持 100 码以上。",
  },
  "grte-cascade-canyon": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["wildlife"],
    noteZh:
      "坐渡船往返约 15 公里、爬升约 450 米，先要爬到灵感点；峡谷里熊和驼鹿很常见，结伴、带防熊喷雾。带孩子、老人走到隐秘瀑布或灵感点就回头。",
  },
  "grte-string-leigh-lake": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["water"],
    noteZh:
      "东岸步道前约 800 米是不平的压实土路，过了野餐区有台阶、石头和树根；野餐区有无障碍旱厕，坐轮椅在湖边野餐区看就好。湖水浅但很冷，孩子玩水要有人看着。",
    source: PHYS,
  },
  "grte-taggart-lake": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "2026 年北段封闭改造，只能走南线，往返约 6.8 公里、坡更陡，体力一般的慢慢走。",
  },
  "grte-delta-lake": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble", "altitude"],
    noteZh:
      "往返约 12 公里、爬升约 700 米，湖在海拔约 2,750 米；最后一段是 NPS 不维护的非正式路线，要手脚并用翻过乱石坡、自己找路。不适合小孩和体力一般的，全家可以改走 Taggart Lake 或隐秘瀑布。",
  },
  "grte-jenny-lake-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "有无障碍厕所、车位、路缘坡道和入口，但官方说展品可能要人协助才能看；能借轮椅。",
    source: PHYS,
  },
  "grte-signal-mountain": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "开车盘山上去，山顶停车场就能看谷地；Jackson Point 观景台要从停车处走一小段土路。",
  },
  "grte-jackson-lake-dam": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "有铺装的观景小路，视野很好，但官方说宽度和坡度不达标，轮椅要有人陪着。",
    source: PHYS,
  },
  "grte-colter-bay": {
    kidsFromAge: 4,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "苍鹭池—天鹅湖环线约 5 公里是土路；坐轮椅、推婴儿车走码头出发、沿湖约 500 米的铺装平路就好，游客中心有按钮自动门、能借轮椅。",
    source: PHYS,
  },
  "grte-cunningham-cabin": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "从停车处走几百米平坦土路到小屋，坐轮椅在停车处远看；周围草原常有野牛，别靠近。",
  },
  "grte-jackson-town-square": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
  },
  "grte-aerial-tram": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh:
      "NPS 地点页把这里列为轮椅能到；山顶海拔 3,185 米，比山下冷得多、风大，老人下了缆车慢慢走。山顶除了观景平台和小木屋，都是碎石山路。",
    source: "https://www.nps.gov/places/000/jackson-hole-mountain-resort-aerial-tram-trailhead.htm",
  },
  "grte-elk-refuge": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "要爬上敞篷雪橇坐约 1 小时，很冷；坐轮椅的先打电话问有没有带坡道的雪橇，不然可以在 89 号公路边的停车处远看鹿群。",
  },
};
