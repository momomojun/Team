import type { Suitability } from "../attractions/types";

// 北瀑布 · 同行适合度。2026-10-16 按 NPS 无障碍页面和逐处的无障碍说明整理：北瀑布游客中心、Sterling Munro 木栈道“完全无障碍”，
// 雪松步道轮椅可能要有人帮忙，Rainy Lake、华盛顿山口观景台是平坦铺装步道，罗斯湖观景点在车上就能看；
// 迪亚布洛湖游船按北瀑布学会官网（写明能上轮椅）
const ACCESS = "https://www.nps.gov/noca/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "noca-diablo-lake-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边观景台，有无障碍停车位、路缘坡道和厕所，下车就能看湖。",
    source: "https://www.nps.gov/noca/planyourvisit/accessibility-at-diablo-lake-overlook.htm",
  },
  "noca-washington-pass-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场到观景平台约 120 米平坦铺装路，有无障碍停车位和厕所；再往外绕的小环线有台阶和陡坡，轮椅到主平台就好。",
    source: "https://www.nps.gov/noca/planyourvisit/accessibility-at-washington-pass-overlook.htm",
  },
  "noca-maple-pass-loop": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "环线约 11.6 公里、爬升约 620 米，山脊段完全暴露、风大，7 月中旬前有滑的雪坡；带孩子、老人可以只走到 Lake Ann 就回头，或者走同一停车场出发的 Rainy Lake 铺装步道。",
  },
  "noca-cascade-pass": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "往返约 12 公里、爬升约 520 米，前半程是三十多个之字弯；到步道口还要开约 1 小时坑洼碎石路。体力一般的走到林线、看到对面冰川就回头。",
  },
  "noca-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说游客中心完全无障碍；旁边约 100 米的 Sterling Munro 木栈道也完全无障碍，River Loop 步道路面好、坡度都在 10% 以内。",
    source: ACCESS,
  },
  "noca-trail-of-the-cedars": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "官方说是无障碍环线，坡度中等，坐轮椅的可能要有人帮忙，沿途有长椅；先过 Skagit 河上的吊桥，无障碍厕所在 Skagit 杂货店对面。",
    source: "https://www.nps.gov/noca/planyourvisit/accessibility-at-trail-of-the-cedars.htm",
  },
  "noca-ladder-creek-falls": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "环线不长，但上上下下几乎全是台阶，岩石常年湿滑，有扶手；婴儿车放在发电站前，背着孩子走，老人慢慢扶着走。",
  },
  "noca-gorge-creek-falls": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "有无障碍停车位和厕所，沿人行道走上公路桥就能看瀑布；桥面是钢格板，雨天滑，车流很近，孩子要牵着。",
    source: "https://www.nps.gov/noca/planyourvisit/accessibility-at-gorge-creek-falls.htm",
  },
  "noca-thunder-knob": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "往返约 6 公里、爬升约 200 米，坡缓的林间土路；季节性木桥没装时不好过河。",
  },
  "noca-diablo-lake-trail": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "往返约 12 公里、爬升约 400 米，一路上下起伏；到 Ross 大坝下的吊桥后原路返回（渡轮只载度假村住客）。带孩子、老人走到第一处俯瞰湖面的岩石平台就回头。",
  },
  "noca-diablo-lake-cruise": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官网说游船能上轮椅：有登船坡道、轮椅座位和船上的无障碍厕所；需要其他帮助先打 360-854-2599。2 岁及以下免费，婴儿车上船要收起来。",
    source: "https://ncascades.org/signup/programs/skagit-tours/diablo-lake-afternoon-cruise",
  },
  "noca-ross-lake-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说在车上就能看到湖景；旁边的 Happy Creek 森林木栈道是完全无障碍的约 500 米环线。",
    source: "https://www.nps.gov/noca/planyourvisit/accessibility-at-ross-lake-overlooks.htm",
  },
  "noca-blue-lake": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "往返约 7 公里、爬升约 320 米，湖在海拔约 1,900 米，初夏湖边还有积雪；体力一般的可以改去旁边华盛顿山口观景台的铺装平台看尖峰。",
  },
  "noca-rainy-lake": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "约 1.6 公里平坦铺装路到湖边观景台，沿途有长椅，有无障碍停车位和厕所；6 月下旬前路上常有积雪。",
    source: "https://www.nps.gov/noca/planyourvisit/accessibility-at-rainy-lake-trail.htm",
  },
};
