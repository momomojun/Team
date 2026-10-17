import type { Suitability } from "../attractions/types";

// 卡特迈 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：Brooks Camp 多数公共建筑无障碍，看熊平台靠带坡道的高架栈道连着，
// 全都能上轮椅，但路窄、坑洼、常很泥，可能要人帮忙；游客中心能借少量全地形轮椅，上下水上飞机对行动不便的人比较难。
// 海岸看熊按 Homer 的 Smokey Bay Air 官网（7 岁以上）
const ACCESS = "https://www.nps.gov/katm/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "katm-brooks-falls": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "assisted",
    seniors: "caution",
    hazards: ["wildlife", "remote", "motion"],
    noteZh:
      "要坐小飞机或水上飞机进去，上下飞机对腿脚不好的人比较难；到瀑布观景台约 2 公里，栈道和平台都能上轮椅，但土路窄、常很泥，要有人帮忙，可以借全地形轮椅。熊常从步道上走过，孩子要一直牵着、抱着，别跑别喊。",
    source: ACCESS,
  },
  "katm-coastal-bears": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["wildlife", "remote", "motion"],
    noteZh:
      "小飞机降在沙滩上，跟着向导蹚水、走泥滩到熊几十米外，没有观景台；Smokey Bay Air 要求 7 岁以上，各家公司年龄下限不同，Alaska Bear Adventures 的海岸团要 8 岁或 10 岁以上。体力一般的要能走几公里泥地，订之前问清楚。",
    source: "https://smokeybayair.com/bear-viewing",
  },
  "katm-vtts": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["remote", "motion"],
    noteZh:
      "先坐水上飞机到 Brooks Camp，再坐约 1.5 小时的巴士走砂石路，一整天；在观景小屋看就够，下到谷底往返约 5.4 公里、落差约 300 米，回程一路上坡，小孩、老人别下去。NPS 没写巴士能不能上轮椅。",
    source: ACCESS,
  },
  "katm-dumpling-mountain": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["wildlife", "remote"],
    noteZh: "到观景点单程约 2.4 公里、爬升约 240 米，熊也走这条路，结伴出声；带小孩、老人在观景点就回头，别再往上走到山顶苔原。",
  },
};
