import type { Suitability } from "../attractions/types";

// 猛犸洞 · 同行适合度。2026-10-20 按 NPS 导览总表（每条线的年龄、台阶、难度）和无障碍页面整理：
// 所有导览 16 岁以下要有 18 岁以上的成人陪同；导览不许带婴儿背架（child backpack carriers）和婴儿车，婴儿只能抱着；
// 游客中心全无障碍，Echo River Spring、Sand Cave、Sloans Crossing Pond 步道是无障碍的（Heritage Trail 也是，但 2026 年在整修）。
// 唯一不用台阶的 Accessible Tour 2026 年 5 月起因电梯故障暂停，没收成景点。
const ACCESS = "https://www.nps.gov/maca/planyourvisit/accessibility.htm";
const TOURS = "https://www.nps.gov/maca/planyourvisit/explore-all-tours.htm";

export const suitability: Record<string, Suitability> = {
  "maca-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游客中心全无障碍（按钮开门、低柜台、无障碍厕所）；走到历史入口的步道是陡的下坡，回程上坡，坐轮椅、推婴儿车只到洞口上方的观景处。",
    source: ACCESS,
  },
  "maca-historic-tour": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "官方不限年龄，但 2 小时、约 3.2 公里、540 级台阶（猛犸穹顶一口气 155 级），还要侧身挤过窄缝、弯腰走低矮的通道，中途没有别的出口。不许带婴儿背架，婴儿只能一直抱着，不建议带太小的孩子；膝盖不好、幽闭恐惧的改订 Frozen Niagara 或 Mammoth Passage。",
    source: TOURS,
  },
  "maca-domes-dripstones": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh:
      "官方标为 Strenuous（最累的一档），640 级台阶，开头从落水洞底下一口气陡下约 280 级，中途没有别的出口、洞里没有厕所。不许带婴儿背架；体力一般、怕高的老人改订 Frozen Niagara（同样看钟乳石，只有 64 级台阶）。",
    source: TOURS,
  },
  "maca-frozen-niagara": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh:
      "官方标为 Easy，约 400 米、64 级必走的台阶（另有 98 级可选），是带小孩、老人看钟乳石最轻松的线。不许带婴儿车和婴儿背架，婴儿要抱着；坐轮椅的去不了（64 级台阶是必走的）。",
    source: TOURS,
  },
  "maca-mammoth-passage": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "官方标为 Easy，约 1.2 公里、135 级台阶，洞里是宽阔的大通道；进出洞口有一段陡的户外山坡路，回程上坡，老人慢慢走。不许带婴儿车和婴儿背架。",
    source: TOURS,
  },
  "maca-grand-avenue": {
    kidsFromAge: 10,
    minAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    seniorsSerious: true,
    noteZh:
      "官方要求 6 岁以上，标为 Strenuous：4 小时、约 6.4 公里、1,521 级台阶，好几段又高又陡的坡。对小孩和体力一般的老人都很累，带老人请务必慎重考虑，6–9 岁的孩子能不能坚持 4 小时要想清楚；可以改成 Historic 加 Frozen Niagara 两条短线。",
    source: TOURS,
  },
  "maca-great-onyx-lantern": {
    kidsFromAge: 6,
    minAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "官方要求 6 岁以上；约 1.6 公里、82 级台阶，台阶不多但全程只有煤油灯照明，路面看不太清，老人和小孩要慢慢走。只有 16 岁以上的人能提灯。",
    source: TOURS,
  },
  "maca-violet-city-lantern": {
    kidsFromAge: 8,
    minAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    seniorsSerious: true,
    noteZh:
      "官方要求 6 岁以上，标为 Difficult：3 小时、约 4.8 公里，只靠煤油灯照明，土路不平、很多陡坡没有扶手。灯光暗、容易绊倒，体力一般的老人和刚够年龄的小孩请务必慎重考虑。",
    source: TOURS,
  },
  "maca-wild-cave": {
    kidsFromAge: 16,
    minAge: 16,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["scramble"],
    noteZh:
      "官方要求 16 岁以上（18 岁以下要大人陪），胸围、臀围不超过 42 英寸，6 小时在没开发的通道里爬行、钻窄缝、攀岩，是公园最累的项目，不适合老人。带孩子的可以订 10 岁以上的 Introduction to Caving，或只收 8–12 岁的 Trog（家长要陪头尾各 30 分钟）。",
    source: TOURS,
  },
  "maca-river-styx-loop": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh: "林间土路，崖顶观景点和下到河边的一段是陡坡、局部靠近崖边；回程从河边爬上历史入口是上坡。老人、小孩可以只从历史入口下到 River Styx 泉再原路返回。",
  },
  "maca-echo-river-spring": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说是完全无障碍的步道，硬化路面，解说牌按一下有语音讲解；观景平台边上是水潭，孩子别下水。",
    source: ACCESS,
  },
  "maca-cedar-sink": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh: "坑边的观景台走起来不难，下到坑底要走很多石阶，回程上爬；雨后台阶湿滑。老人可以只在坑边的观景台看。",
  },
  "maca-sand-cave": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "约 150 米的无障碍木栈道到洞口前的观景台（官方列为无障碍步道），洞口不能进。",
    source: ACCESS,
  },
  "maca-sloans-crossing": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "约 600 米的平坦木栈道环线，官方列为无障碍步道；池塘边没有栏杆的地方看好小孩。",
    source: ACCESS,
  },
  "maca-green-river-paddle": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh:
      "水流平缓，但要自己划 3–4 小时，所有人都要穿救生衣；涨水后河水浑急，别下水游泳。小孩坐在大人的独木舟中间，年龄要求以划船公司为准；体力一般的老人可以选短一点的河段。",
  },
};
