import type { Suitability } from "../attractions/types";

// 红木国家及州立公园 · 同行适合度。2026-10-16 按 NPS 无障碍页面和“Walks and Hikes”页面整理：官方列出的无障碍步道有
// 大树（Big-Tree Wayside）、Elk Prairie Trail、Revelation Trail、Simpson-Reed、Leiffer Loop 等；伯德·约翰逊夫人林部分铺装但有陡坡，
// 官方说不算无障碍；Stout Grove 的季节桥、蕨类峡谷都不能走轮椅。部分游客中心能免费借全地形履带轮椅、沙滩轮椅和普通轮椅
const ACCESS = "https://www.nps.gov/redw/planyourvisit/accessibility.htm";
const TRAILS = "https://www.nps.gov/redw/planyourvisit/hiking.htm";

export const suitability: Record<string, Suitability> = {
  "redw-lady-bird-johnson-grove": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "环线起伏不大，部分铺装、部分是土路，婴儿车能推但有几段坡；官方说有陡坡、不算无障碍，进林子前还要过坡度很大的天桥。轮椅改去牛顿·德鲁里风景道边的大树。",
    source: TRAILS,
  },
  "redw-tall-trees-grove": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "去程一路下坡约 240 米，回程全是上坡，加上 10 公里窄土路开车，至少留 4 小时；体力一般的老人可以改走伯德·约翰逊夫人林或大树这种平路。",
  },
  "redw-fern-canyon": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "要在溪水里走、翻倒木、过窄木板桥，官方说不能走轮椅；带小孩、老人从峡谷口走进去一小段原路返回就好，穿能湿水的鞋。",
    source: TRAILS,
  },
  "redw-newton-b-drury-parkway": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "铺装公路，在车上就能看巨树；沿途的大树和 Elk Prairie Trail 都是官方列出的无障碍步道。",
    source: TRAILS,
  },
  "redw-stout-grove": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "环线开头一段下坡，之后是平坦土路，婴儿车能推；夏季过河的临时步行桥官方说不能走轮椅，轮椅在停车场一带看看巨树。",
    source: TRAILS,
  },
  "redw-howland-hill-road": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "大部分是土路，在车上就能看巨树贴着车身过去；路边停车处都是土地，婴儿车推起来颠，雨后有泥坑。",
  },
  "redw-kuchel-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游客中心在平地上，可以问能不能借沙滩轮椅；旁边海滩浪大，孩子别背对大海、别在漂流木上玩。",
    source: ACCESS,
  },
  "redw-redwood-creek-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场边就是观景处，在车上也能看溪谷；有野餐桌和厕所。",
  },
  "redw-elk-prairie": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh:
      "Elk Prairie Trail 是官方列出的无障碍步道，在游客中心旁、路边就能看到马鹿；马鹿至少隔开一辆校车的距离，5–6 月产仔、8–10 月发情时更要远离，孩子别跑过去。",
    source: TRAILS,
  },
  "redw-big-tree": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "从停车场走约 70 米平路就到，Big-Tree Wayside 是官方列出的无障碍步道。",
    source: TRAILS,
  },
  "redw-gold-bluffs-beach": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["water", "wildlife"],
    noteZh:
      "沿 Davison Road 在车上就能看海滩，沙滩是软沙，婴儿车推不动；海浪大、水冷，常有突然涌上岸的“疯狗浪”，孩子别在浪里和漂流木上玩。沙丘草地上的马鹿要远远看。",
  },
  "redw-klamath-river-overlook": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场边就能看到河口和海；从停车场往下的 Coastal Trail 是陡路，约 800 米到下方观景点，带老人小孩在上面看就好。",
  },
  "redw-coastal-drive": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车看海，High Bluff 观景台路边停车就能看；走到 B-71 雷达站是一小段土路。",
  },
  "redw-grove-of-titans": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "林子里是约 400 米（1,300 英尺）的高架栈道，但要先走一段 Mill Creek Trail，途中有不少金属台阶，婴儿车、轮椅过不去；轮椅可以去 Stout Grove 或大树。",
  },
  "redw-boy-scout-tree": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "往返约 9 公里，有陡坡和之字形路，到终点至少 3 小时；带孩子、老人走前面一两公里看看原始林就回头（目前离步道口约 2.8 公里处有倒树挡路）。",
  },
  "redw-enderts-beach": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh:
      "步道下降约 60 米、部分路段较陡，回程上坡；看潮池要赶退潮，涨潮很快，海浪会突然打上礁石，孩子别走到外侧礁石上。不想下去的在步道口旁的 Crescent Beach 观景台看海就好。",
  },
  "redw-avenue-of-the-giants": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车看就行，巨树就在路两边；Founders Grove 的约 0.8 公里环线是平路，婴儿车能推。",
  },
};
