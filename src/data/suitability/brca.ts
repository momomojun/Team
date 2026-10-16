import type { Suitability } from "../attractions/types";

// 布莱斯峡谷 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：官方逐个给观景点评了通达度，Sunset、Bryce、Rainbow、Natural Bridge、
// Agua、Paria 是“很好”，Sunrise、Inspiration、Fairyland 是“好”；边缘步道只有日出点到日落点约 800 米是轮椅能走的，
// Bristlecone Loop 是硬地面、有人协助能走；班车有电动升降台，游客中心能借全地形轮椅。圆形剧场边缘海拔约 2,400 米，老人上坡会喘
const ACCESS = "https://www.nps.gov/brca/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "brca-sunrise-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场到崖边约 480 米铺装路，轮椅能到；最后一小段到最高处是土路陡坡（官方不建议轮椅），从这里沿边缘步道到日落点那段也能推。",
    source: ACCESS,
  },
  "brca-sunset-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场到观景台约 150 米平坦铺装路，官方评为通达度很好；洗手间有人协助能用。崖边护栏外就是陡坡，孩子别翻出去。",
    source: ACCESS,
  },
  "brca-navajo-queens": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "从崖边下到谷底再爬上来，之字弯陡、海拔高，上坡很喘，石柱间的沙土路下坡易滑；体力一般的可以只从日出点下 Queen's Garden 走到女王石像就原路回来，坡缓、来回约 3 公里。",
  },
  "brca-inspiration-point": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "停车场到下层观景台是约 66 米有坡的人行道，轮椅有人推能到；上、中层要走约 370 米土路，最陡 26%，老人会喘，在下层看就很好。",
    source: ACCESS,
  },
  "brca-bryce-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "约 80 米铺装路到第一个观景台，再走约 80 米到尽头，官方评为通达度很好；冬天可能结冰。",
    source: ACCESS,
  },
  "brca-natural-bridge": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场旁约 16 米平坦铺装观景台，停车就能看到石拱。",
    source: ACCESS,
  },
  "brca-rainbow-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "约 107 米有坡的铺装路到观景台尽头，有无障碍洗手间；海拔约 2,780 米，老人走慢一点。",
    source: ACCESS,
  },
  "brca-mossy-cave": {
    kidsFromAge: 2,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "碎石路、有几级台阶和小桥，坡不大；冬天洞口一带结冰很滑，孩子别爬到瀑布边的湿石头上。",
  },
  "brca-night-sky": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "天文讲解、望远镜观星一般在游客中心一带，能推婴儿车和轮椅过去；夜里摸黑走土路容易绊倒，夏天夜里也只有几度，给老人小孩多带衣服。",
  },
  "brca-fairyland-loop": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "约 13 公里、上上下下累计爬升 500 多米，在海拔 2,400 米上走大半天，后段沿边缘步道回来还有长上坡；带孩子、老人在仙境观景点看，或者只往下走到第一个岔口就回头。",
  },
  "brca-peekaboo-loop": {
    kidsFromAge: 9,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "从布莱斯点下到谷底再爬回来，坡陡、上坡长，和马队共用步道、路上有马粪；体力一般的可以骑 2 小时的马下圆形剧场（7 岁以上、体重 100 公斤以下），或者在布莱斯点看。",
  },
  "brca-fairyland-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "停车场到观景点约 27 米压实的土路，官方评为通达度好；冬天支路对汽车关闭。",
    source: ACCESS,
  },
  "brca-paria-view": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "约 39 米铺装路到第一个观景台，后面约 190 米是有坡的人行道，官方评为通达度很好；冬天要穿雪鞋进去。",
    source: ACCESS,
  },
  "brca-agua-canyon": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "约 24 米平坦铺装路到观景台，官方评为通达度很好。",
    source: ACCESS,
  },
  "brca-bristlecone-loop": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh:
      "约 1.6 公里硬地面环线，官方说轮椅有人协助能走，但有几段坡不达标；海拔约 2,800 米，是公园最高处，老人慢慢走、多歇，喘得厉害就在彩虹点看。",
    source: ACCESS,
  },
};
