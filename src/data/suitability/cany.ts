import type { Suitability } from "../attractions/types";

// 峡谷地 · 同行适合度。2026-10-16 按 NPS 行动不便游客页面整理：天空之岛是最方便的园区，两座游客中心有无障碍车位和洗手间，
// 天空之岛游客中心能借全地形轮椅（要有人推）；官方列为轮椅能到的观景点有大观景点、格林河、Buck Canyon、Wooden Shoe，
// 迷宫区（含马蹄峡谷）没有一条无障碍步道。崖边大多没有护栏，步道多是没有遮阴的光滑岩坡，夏天带老人小孩只在早晚走
const ACCESS = "https://www.nps.gov/cany/planyourvisit/physical-mobility.htm";

export const suitability: Record<string, Suitability> = {
  "cany-island-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "有无障碍车位，缓坡到门口（大门没有按钮），展览和服务台坐轮椅能到，厕所都是无障碍的；服务台能借全地形轮椅，先到先得，要有人推。",
    source: ACCESS,
  },
  "cany-shafer-canyon-overlook": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh: "从停车场走约 200 米到崖边，路上有台阶和不平的岩面；崖边不是处处有护栏，孩子一定要牵着，轮椅、婴儿车在停车场附近看就好。",
    source: ACCESS,
  },
  "cany-mesa-arch": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh: "约 1 公里往返的土路，有几段石阶；拱门下面就是几百米的悬崖，没有护栏，日出时人挤人，孩子一定要牵着，别让他爬到拱上。",
    source: ACCESS,
  },
  "cany-grand-view-point": {
    kidsFromAge: 3,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh:
      "停车场边的观景台有铺装人行道，官方说轮椅能到，附近有无障碍厕所；往半岛尖端的崖边步道是岩面和土路，一侧是悬崖没有护栏，带小孩走要牵着，轮椅、婴儿车在观景台看就好。",
    source: ACCESS,
  },
  "cany-white-rim-overlook": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh: "平缓的土路和岩面，走到崖尖约 3 公里往返，官方说全地形轮椅一个人推大概就够；崖尖三面是悬崖，孩子别跑到前面。",
    source: ACCESS,
  },
  "cany-green-river-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方列为轮椅能到的观景点，停车场离观景台只有几十米。",
    source: ACCESS,
  },
  "cany-aztec-butte": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble"],
    noteZh:
      "前段是沙地，后面上山顶、去粮仓都要在陡的光滑岩坡上手脚并用，下来比上去难；带孩子、体力一般的走到分岔口看看就回头，想轻松看古人留下的痕迹，可以去针尖区的洞穴泉步道看岩洞里的手印和彩绘岩画。",
    source: ACCESS,
  },
  "cany-whale-rock": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh: "全程在光滑的砂岩圆顶上爬坡，坡陡的地方两侧往下落，鞋底不抓地很容易滑；孩子喜欢爬但要大人跟着，老人走到坡变陡的地方就回头。",
  },
  "cany-upheaval-dome": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "到第一观景点只有约 1 公里往返，但路陡，有石阶和不平的岩面；老人慢慢走、走到第一观景点就够，第二观景点更远更陡。",
    source: ACCESS,
  },
  "cany-dead-horse-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh:
      "州立公园说主观景台从停车场有一条铺装的 ADA 短路，大凉亭也能进；凉亭往两侧接崖边步道的路更陡、有光滑岩面，不算无障碍。台地三面都是几百米的悬崖，护栏外孩子别去。",
  },
  "cany-newspaper-rock": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "路边停车走几步就到岩画围栏前，路面平但不是正式的无障碍步道，轮椅可能要人帮一把。",
  },
  "cany-needles-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "铺装停车场和人行道，有无障碍车位、洗手间和饮水机，展览、礼堂坐轮椅能进（大门没有按钮）；冬季关门。",
    source: ACCESS,
  },
  "cany-cave-spring": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble"],
    noteZh:
      "前半圈牛仔营地和泉水岩洞是平路，后半圈要爬两段木梯上光滑岩顶；带婴儿、爬梯子吃力的老人走到泉水岩洞就原路回来，不用上梯子。",
  },
  "cany-pothole-point": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "平坦的砂岩面，跟着石堆走，坡很小；岩面凹凸不平，婴儿车推不了，抱着孩子走没问题。",
  },
  "cany-slickrock-trail": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "约 3.9 公里在光秃秃的砂岩上绕圈，上上下下、全程没有遮阴，容易走偏；带孩子、老人只走到第一个观景点就回头，夏天只在早上走。",
  },
  "cany-big-spring-canyon-overlook": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "铺装路尽头的停车场边就能看；往前走就是岩面和长线步道，轮椅想到正式的无障碍观景点可以去路上的 Wooden Shoe Arch 观景点。",
    source: ACCESS,
  },
  "cany-chesler-park": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "往返约 9.3 公里，要翻几道光滑岩坡、穿过沙地峡谷，实际上下比数字多，遮阴少；带孩子、体力一般的老人走到第一道岩坡看看石柱群就回头。",
  },
  "cany-horseshoe-canyon": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "remote"],
    noteZh:
      "往返约 11 公里，部分是深沙，回程 1.6 公里里要爬约 200 米陡坡，夏天非常热；要开约 50 公里砂石路进去，没有信号和水，官方说迷宫区没有无障碍步道。体力一般的老人、小孩不建议去。",
    source: ACCESS,
  },
};
