import type { Suitability } from "../attractions/types";

// 克拉克湖 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：Port Alsworth 游客中心有轮椅坡道；
// Port Alsworth、Silver Salmon Creek、Chinitna 湾的护林站能借沙滩轮椅，要提前打电话或发邮件预约。
// 进公园只能坐小飞机，官方没写飞机和步道的无障碍情况；海岸看熊的年龄按 Smokey Bay Air 官网（7 岁以上）
const ACCESS = "https://www.nps.gov/lacl/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "lacl-coastal-bears": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["wildlife", "remote", "motion"],
    noteZh:
      "小飞机降在海滩上，跟向导在盐沼、泥滩走到熊附近；Homer 的 Smokey Bay Air 要 7 岁以上，各家公司不同，订之前问。Chinitna 湾和 Silver Salmon Creek 护林站能借沙滩轮椅，要提前约，上下小飞机还是要人帮忙。",
    source: ACCESS,
  },
  "lacl-crescent-lake": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["wildlife", "remote", "motion"],
    noteZh: "全程约 11 小时，单程飞约 70 分钟，到了主要坐在带顶棚的船上看熊，不用走多少路；时间长、湖上冷，小孩和体力一般的要能坐得住。",
  },
  "lacl-proenneke-cabin": {
    kidsFromAge: 2,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion", "remote"],
    noteZh: "坐水上飞机穿过 Lake Clark Pass，山口气流颠簸，晕机的提前吃药；从湖边浮筒下飞机、走到小屋是土路，行动不便的先问航空公司能不能帮忙上下。",
  },
  "lacl-port-alsworth": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["wildlife", "remote", "motion"],
    noteZh:
      "游客中心有轮椅坡道；去 Tanalian 瀑布单程约 3.2 公里，林间土路有坡，沿途有熊，结伴出声。带小孩、老人在村里和湖边走走，或者走到能俯瞰湖的地方就回头；这里离医院要坐飞机。",
    source: ACCESS,
  },
  "lacl-tanalian-mountain": {
    kidsFromAge: 12,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["wildlife", "remote"],
    noteZh: "往返约 13.8 公里、爬升约 1,070 米，NPS 建议至少留 8 小时，林线以上没遮挡、风大，出了事只能等飞机救援；体力一般的、带小孩的走 Tanalian 瀑布步道就够。",
  },
};
