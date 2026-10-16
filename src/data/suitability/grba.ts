import type { Suitability } from "../attractions/types";

// 大盆地 · 同行适合度。2026-10-16 按 NPS 行动不便游客页面、Lehman Caves 导览页面整理：两座游客中心都有自动门和无障碍洗手间；
// 景观道上的 Mather、惠勒峰观景台有短栈道，园内按 ADA 标准修的步道只有 Sky Island（Bristlecone 步道口，海拔约 3,000 米）和 Shoshone 两条；
// 洞穴只有 30 分钟的 Gothic Palace 导览没有台阶，轮椅要有人协助，园里不借轮椅。景观道上段在 3,000 米上下，老人走路会喘
const ACCESS = "https://www.nps.gov/grba/planyourvisit/physical-mobility-impairments.htm";
const CAVE = "https://www.nps.gov/grba/planyourvisit/lehman-caves-tours.htm";

export const suitability: Record<string, Suitability> = {
  "grba-lehman-caves-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "门口有无障碍车位，按钮自动门，有一间不分性别的无障碍洗手间；还能免费借前挂式婴儿背带进洞。",
    source: ACCESS,
  },
  "grba-lehman-caves": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "partial",
    seniors: "caution",
    noteZh:
      "Grand Palace 导览 90 分钟、69 级台阶，窄处要弯腰；官方说 5 岁以下只在 11 月 1 日到 3 月 5 日能参加，夏天带小小孩改订 60 分钟 Lodge Room 或 30 分钟 Gothic Palace。洞里不许背后背式背带，只能用前挂式；坐轮椅、走不了台阶的订没有台阶的 Gothic Palace，要有家人推。",
    source: CAVE,
  },
  "grba-mountain-view-trail": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "约 500 米的平缓土路小环线，抱着孩子也能走；冬天可能有积雪。",
  },
  "grba-scenic-drive": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh:
      "开车沿途就能看，Mather 和惠勒峰两个观景台都有短栈道，轮椅能到；路尽头海拔约 3,000 米，老人下车走动慢一点，路尽头的 Sky Island 无障碍步道是木栈道加橡胶垫。",
    source: ACCESS,
  },
  "grba-alpine-lakes": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh:
      "坡不大，但全程在海拔 3,000 米以上，老人小孩容易喘、头疼；可以只走到 Stella 湖就原路回来。坐轮椅、推婴儿车的走步道口旁约 600 米的 Sky Island 无障碍步道。",
  },
  "grba-bristlecone-grove": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh:
      "往返约 4.5 公里，一路缓上坡，海拔约 3,000–3,200 米，林子里是碎石冰碛；体力一般的慢慢走、多歇，冰川步道那段更陡，带孩子老人到狐尾松林就回头。",
  },
  "grba-wheeler-peak": {
    kidsFromAge: 12,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["altitude"],
    noteZh:
      "往返约 14 公里、爬升约 945 米，最后到近 4,000 米的山顶，过了山口没有任何遮挡，午后常有雷暴、风很大；不适合孩子和体力一般的老人，全家可以改走高山湖环线。",
  },
  "grba-night-sky": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "天文剧场走一小段土路就到，官方说完全无障碍，有留给轮椅的位置，附近有无障碍洗手间，行动不便的有专用车位；夏夜也会降到 10°C 以下，给老人小孩多带衣服。",
    source: ACCESS,
  },
  "grba-baker-creek": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "约 5.3 公里、爬升约 260 米，起点海拔约 2,450 米，坡不陡但要走两三个小时；体力一般的沿溪走一段山杨林就原路回来。",
  },
  "grba-lexington-arch": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "remote"],
    noteZh:
      "要开很烂的土路进去，车停在原步道口前约 1.6 公里，加上步道往返约 12 公里，烧过的山坡几乎没有遮阴，一路没有水、厕所和信号；带小孩、体力一般的老人不建议专门去。",
  },
  "grba-great-basin-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "平坦人行道到门口，按钮自动门，展品大多坐轮椅能看，低处的抽屉可以请工作人员帮忙。",
    source: ACCESS,
  },
};
