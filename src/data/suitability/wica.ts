import type { Suitability } from "../attractions/types";

// 风洞 · 同行适合度。2026-10-16 按 NPS 无障碍页面和洞穴导览页面整理：进洞只能跟护林员导览，除了约 30 分钟的
// 无障碍导览（坐电梯、走约 30 米、没有台阶，要打电话约）以外都要连续爬台阶；孩子只能抱着或用胸前背带，
// 洞里不能带任何包；烛光导览 8 岁、野洞探险 16 岁起。拉什莫尔山按它自己的 NPS 无障碍页面
const ACCESS = "https://www.nps.gov/wica/planyourvisit/accessibility.htm";
const TOURS = "https://www.nps.gov/wica/planyourvisit/guidedtours.htm";
const MORU = "https://www.nps.gov/moru/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "wica-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "上下两层有电梯，展品间距宽，影片有字幕；行动不便的可以在前台问无障碍导览。",
    source: ACCESS,
  },
  "wica-natural-entrance-tour": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "约 300 级台阶，有低矮的地方要弯腰，洞里暗、地面湿滑；婴儿只能抱着或用胸前背带，背包式背架不能带。膝盖、心肺不好的改约 30 分钟的无障碍导览，或者 150 级台阶的伊甸园导览。",
    source: TOURS,
  },
  "wica-fairgrounds-tour": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "官方定为吃力：约 450 级台阶，其中一口气往上爬 89 级。带小孩、老人选伊甸园导览更稳妥。",
    source: TOURS,
  },
  "wica-garden-of-eden-tour": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh:
      "最轻松的一种，坐电梯进出，约 150 级台阶；婴儿抱着或用胸前背带。轮椅和走不了台阶的打电话约约 30 分钟、没有台阶的无障碍导览。",
    source: TOURS,
  },
  "wica-candlelight-tour": {
    kidsFromAge: 8,
    minAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "官方定为吃力：约 424 级台阶，一部分是没有铺的天然洞底，只靠蜡烛照明，8 岁以上才能参加。小一点的孩子参加伊甸园或天然入口导览。",
    source: TOURS,
  },
  "wica-wild-cave-tour": {
    kidsFromAge: 16,
    minAge: 16,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["scramble"],
    noteZh:
      "官方定为非常吃力：最长约 4 小时，大部分时间手脚并用地爬，要钻过约 25 厘米高的缝；16 岁以上，17 岁以下要家长签字。全家同去的改走天然入口导览。",
    source: TOURS,
  },
  "wica-natural-entrance": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "从游客中心有坡道和人行道到天然洞口，官方写轮椅能到。",
    source: ACCESS,
  },
  "wica-bison-flats": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh: "在路边停车点或车上就能看；野牛常横穿公路，留在车里最安全，孩子别走进犬鼠城。",
  },
  "wica-rankin-ridge": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "土路环线，有些上下坡；瞭望塔不开放，在塔下看就够。",
  },
  "wica-lookout-point": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["wildlife", "heat"],
    noteZh: "约 7 公里的草原起伏路，野牛常在步道附近，夏天下午热、有雷暴。带孩子、老人只爬到 Lookout Point 小山顶就原路回来。",
  },
  "wica-backroads": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh: "砂石路上在车里看野牛和马鹿；野牛群常在路边，别下车靠近。",
  },
  "wica-custer-wildlife-loop": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh: "在车里看就行；野牛堵路时等它们走开，野驴凑到车窗边也别喂、别让孩子伸手。",
  },
  "wica-needles-highway": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "开车看石林和隧道；Sylvan 湖边的环湖步道有一段要踩大石头、过石缝，婴儿车、轮椅在湖边停车场和湖坝一带看就好。",
  },
  "wica-mount-rushmore": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh:
      "大观景台两侧有电梯，总统步道从观景台到山脚下的观景处约 300 米能推轮椅，后面一圈有 422 级台阶；信息中心能免费借轮椅。",
    source: MORU,
  },
  "wica-rushmore-lighting": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "露天剧场有电梯下去；仪式 21 点左右开始，结束后孩子容易困，山上夜里凉。",
    source: MORU,
  },
  "wica-crazy-horse": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游客中心、博物馆和观景台是平层；想近看雕像要另坐巴士到山脚。",
  },
};
