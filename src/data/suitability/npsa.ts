import type { Suitability } from "../attractions/types";

// 美属萨摩亚 · 同行适合度。2026-10-20 按 NPS 无障碍页面和游客指南整理：只有 Lower Sauma Ridge 观景点有人协助能上轮椅，
// 没有别的修好的路边观景点，步道都没有铺装、又陡又崎岖；整个领地的无障碍设施都很少。游客中心和厕所无障碍。
// 医疗：图图伊拉岛有医院，曼努阿群岛非常有限。到处有狗，咬人不少见；海边有离岸流（ava）
const ACCESS = "https://www.nps.gov/npsa/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "npsa-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游客中心和厕所无障碍；有给孩子的 Junior Ranger 手册。",
    source: ACCESS,
  },
  "npsa-vatia-road": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "在车上和路边的休息亭就能看；山路陡、急弯多，容易晕车的提前准备。",
  },
  "npsa-pola-island": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "只走几十米，但是卵石海滩、坑坑洼洼，推不了婴儿车、轮椅；海浪和离岸流很强，孩子别靠近水边。路尽头的狗凶，留在车上等过了最后一户人家再下车。",
  },
  "npsa-lower-sauma": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "公园唯一一个有人协助能上轮椅的观景点；往返约 0.6 公里，坡缓。",
    source: ACCESS,
  },
  "npsa-upper-sauma": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    seniorsSerious: true,
    hazards: ["heat", "dropoff"],
    noteZh: "往返约 5 公里、爬升约 450 米，雨林里湿热、陡、滑；带老人请务必慎重考虑，老人、小孩走旁边的 Lower Sauma 步道就够。",
  },
  "npsa-tuafanua-trail": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble", "water"],
    noteZh: "下到海滩要攀几段带绳子的陡梯子，NPS 写观景处不无障碍；海滩浪和流都很危险，不能下水。带小孩、老人走到山脊上看海就回头。周日关闭。",
    source: "https://www.nps.gov/thingstodo/tuafanua-trail.htm",
  },
  "npsa-mount-alava": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    seniorsSerious: true,
    hazards: ["heat"],
    noteZh:
      "往返约 11 公里、爬升约 490 米，要 4–5 小时，又湿又热、路滑，每人要带 2–3 升水。Adventure Trail 那条更难（56 段梯子、783 级台阶），不建议带孩子、老人；带老人走主路也请务必慎重考虑。",
    source: "https://www.nps.gov/thingstodo/mount-alava-trail.htm",
  },
  "npsa-wwii-heritage": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble"],
    noteZh: "前半段到 Blunts Point 的炮台不长，带孩子老人走到那里就好；后面最后一段是带绳子的陡梯子。",
  },
  "npsa-aunuu": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["motion", "water"],
    noteZh: "坐约 10 分钟的当地小船，上下船要从船边跨，腿脚不便的不容易；岛上走的是村里的路。小船上要穿救生衣（没有的话自己带）。",
  },
  "npsa-ofu-beach": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["remote", "motion", "water"],
    noteZh:
      "要坐 19 座的小飞机过去、住几晚，航班常因天气改期；岛上医疗非常有限，带够药。潟湖水浅，但礁石缺口有离岸流，孩子穿救生衣、大人一直在旁边，别碰珊瑚。",
  },
  "npsa-siu-point": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["remote", "heat", "motion"],
    noteZh: "往返约 9 公里的海岸林老路，没有补给、没有信号的地方多；要坐小飞机去 Ta'u 住几晚，医疗非常有限。老人、小孩走到 Saua 遗址就回头。",
  },
};
