import type { Suitability } from "../attractions/types";

// 奇里卡瓦 · 同行适合度。2026-10-20 按 NPS 无障碍页面整理：只有 Bonita Creek 步道的铺装段适合所有助行设备；
// Faraway Ranch 主屋周围大致能走；Massai Point 步道有约 0.1 英里电动助行设备可能能走；其余步道台阶大、有窄缝、起伏大，
// 大多数助行设备都去不了。游客中心和旁边的厕所无障碍（门不是自动门）。2026 年版步道指南还写了：路面多是碎石、石块和沙，
// 建议穿登山鞋、带登山杖；有几条步道怕高的人不建议走（尤其 Hailstone）；海拔高、氧气少；东南亚利桑那发现狂犬病，离动物远远的。
const ACCESS = "https://www.nps.gov/chir/planyourvisit/accessibility.htm";
const GUIDE = "https://www.nps.gov/chir/planyourvisit/upload/2026_Park_Hiking_Guide_8x14_Remediated.pdf";

export const suitability: Record<string, Suitability> = {
  "chir-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游客中心和旁边的厕所无障碍，门不是自动门，要有人帮忙开。",
    source: ACCESS,
  },
  "chir-faraway-ranch": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "官方说主屋周围的地面大多数助行设备能走；谷仓、老木屋之间是土路和草地，婴儿车推得动但颠。主屋里面要跟导览进。",
    source: ACCESS,
  },
  "chir-bonita-creek": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "约 300 米平坦铺装环线，是公园唯一所有轮椅、助行设备都能走的步道；野餐区有硬化小路通到无障碍厕所。",
    source: ACCESS,
  },
  "chir-bonita-canyon-drive": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "在车上就能看到大半石林，路边停车点下车就是观景处。盘山路弯多，容易晕车的孩子提前准备。",
  },
  "chir-natural-bridge": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "往返约 7.6 公里、爬升约 300 米，要翻过一道山脊；过火区遮阴少，夏天中午很晒。小孩、老人量力而行，走一段就回头也行。",
    source: GUIDE,
  },
  "chir-massai-point": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh:
      "停车场旁的观景处和野餐区有一张无障碍野餐桌；自然步道北段铺装到展览亭，官方说其中约 150 米电动助行设备可能能走，其余是石阶和碎石路。观景处外面是陡坡，孩子牵好。",
    source: ACCESS,
  },
  "chir-echo-canyon-loop": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh:
      "约 5.3 公里，路面是碎石、石块和台阶，最后一段 Ed Riggs 步道一直上坡；官方提醒 Hailstone 步道怕高的人不建议走。带小孩、老人只走到 Grotto（往返约 2 公里）就很值。不要让孩子爬到石头上。",
    source: GUIDE,
  },
  "chir-heart-of-rocks": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    seniorsSerious: true,
    hazards: ["dropoff", "scramble", "heat"],
    noteZh:
      "官方定为费力的长线：往返约 12 公里、爬升 300 多米，要 4–6 小时，下午 1 点以后不要出发；进 Heart of Rocks 小环线要手脚并用爬上大石头。海拔约 2,000 米，体力一般的老人走一半就很累，带老人请务必慎重考虑，可以只开到 Massai Point 看石林。夏天午后常有雷暴。",
    source: GUIDE,
  },
  "chir-sugarloaf": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh: "往返约 2.9 公里，一直上坡、爬升约 150 米，山顶海拔 2,228 米，容易喘；山顶四周是悬崖，孩子牵好。",
    source: GUIDE,
  },
  "chir-night-sky": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh: "在停车场看就行，不用走路。夜里山顶冷，给孩子老人多穿；晚上动物活动多（附近发现过狂犬病），不要靠近、不要喂。",
    source: "https://www.nps.gov/chir/planyourvisit/conditions.htm",
  },
  "chir-fort-bowie": {
    kidsFromAge: 5,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "从步道口往返约 4.8 公里土路，有起伏，几乎没有遮阴，夏天很热。走不了的可以把车开到游客中心旁的无障碍车位，只看要塞废墟。",
    source: "https://www.nps.gov/fobo/planyourvisit/directions.htm",
  },
};
