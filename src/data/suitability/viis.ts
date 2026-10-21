import type { Suitability } from "../attractions/types";

// 维尔京群岛 · 同行适合度。2026-10-20 按 NPS 无障碍页面和各步道的 Things To Do 页面整理：Cruz Bay 游客中心入口、停车、厕所无障碍；
// Trunk Bay 有沙滩轮椅、无障碍停车、厕所、更衣室和到水边的无障碍通道，Hawksnest 也有；Cinnamon Bay 遗址木栈道（前 0.09 英里）、
// Francis Bay 咸水塘木栈道、Annaberg 遗址之间的小路无障碍（但从停车场上去的路太陡，超过轮椅安全坡度）。风暴、大浪后海滩的坡道可能被冲坏。
// 几处海滩都没有救生员
const ACCESS = "https://www.nps.gov/viis/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "viis-cruz-bay-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "入口、停车、厕所无障碍；从客轮码头走过来约两个路口，有坡。",
    source: ACCESS,
  },
  "viis-trunk-bay": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["water", "heat"],
    noteZh:
      "有沙滩轮椅、无障碍停车、厕所和通到水边的无障碍通道，是岛上设施最全的海滩；没有救生员，浮潜步道要能自己游、不能站在珊瑚上，小孩穿救生衣、大人在旁边。中午很晒，带遮阳。",
    source: ACCESS,
  },
  "viis-trunk-bay-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边停车处就能看，下车站在路边；车流不停，孩子别跑到马路上。",
  },
  "viis-cinnamon-bay": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "遗址前约 150 米是 1.2 米宽、几乎没坡的木栈道和水泥路，轮椅、婴儿车能走，之后是土路；海滩坡缓，但没有救生员。",
    source: "https://www.nps.gov/thingstodo/cinnamon-bay-nature-loop-and-accessible-trail.htm",
  },
  "viis-maho-bay": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "沙滩平、从路边几步就到，有无障碍停车和厕所，水浅浪小，带小孩看海龟很合适；没有救生员。",
    source: "https://www.nps.gov/thingstodo/maho-bay.htm",
  },
  "viis-francis-bay": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "咸水塘边的木栈道约 1 米宽、轮椅和婴儿车能走；从糖厂停车场下到海滩那段很陡，想轻松的停在海滩那头。",
    source: ACCESS,
  },
  "viis-annaberg": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["heat"],
    noteZh: "遗址之间的小路无障碍，但从停车场上去的一段又陡又多石头，超过轮椅的安全坡度，要有人推、帮忙；废墟墙边别让孩子攀爬。",
    source: "https://www.nps.gov/thingstodo/annaberg-sugar-plantation.htm",
  },
  "viis-waterlemon-cay": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh:
      "到下水处要沿海边土路走 10–20 分钟；游到小岛要一段距离，北侧水流很急，没有救生员。带小孩、老人在第一个小沙滩边的浅水珊瑚附近浮潜就够，穿救生衣。",
    source: "https://www.nps.gov/viis/planyourvisit/snorkeling.htm",
  },
  "viis-lind-point": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "约 1 英里的窄石头路，有上下坡，不算无障碍；老人、小孩可以坐出租车到北岸公路那头的步道口，走更短的一段到海滩。",
    source: "https://www.nps.gov/thingstodo/hike-the-lind-point-trails.htm",
  },
  "viis-reef-bay-trail": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    seniorsSerious: true,
    hazards: ["heat", "remote"],
    noteZh:
      "往返约 6 英里、回程爬升约 270 米，又陡又多石头，湿热、蚊子多。带队徒步可以坐船回来，但风浪大时船来不了还得原路爬上去，官方说走不了来回的别报名。老人、小孩只走到岩刻再回头也要 3–4 小时，带老人请务必慎重考虑。",
    source: "https://www.nps.gov/viis/planyourvisit/rangerguidedtours.htm",
  },
  "viis-ram-head": {
    kidsFromAge: 6,
    stroller: "partial",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff", "heat"],
    noteZh:
      "到 Salt Pond 湾海滩只有约 400 米的缓坡，全家都能去；Ram Head 那段窄、陡、碎石多，没有遮阴，顶上悬崖没有护栏，带小孩、老人在海滩玩就够，别正午上去。",
    source: "https://www.nps.gov/thingstodo/salt-pond-and-ram-head-trails.htm",
  },
  "viis-north-shore-drive": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "在车上就能看；山路陡、急弯多，容易晕车的提前准备。靠左行驶，开车的人要格外小心。",
  },
  "viis-magens-bay": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "海湾平静、有救生员和更衣室，带小孩最放心的海滩之一；无障碍设施没有核对。",
  },
};
