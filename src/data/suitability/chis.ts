import type { Suitability } from "../attractions/types";

// 海峡群岛 · 同行适合度。2026-10-16 按 NPS 无障碍页面和“行动不便”页面、Island Packers 的说明整理：
// 官方说各岛对轮椅和行动不便的人都不太方便，船上只有有限的无障碍条件，要先打电话问 Island Packers；
// 蝎子湾是从船上的台阶走到码头的升降平台，Anacapa、囚犯港、Santa Rosa 都要从不系泊、随浪起伏的船上爬 0–7 英尺的铁梯，
// San Miguel 要换小艇冲上沙滩涉水登岸；Island Packers 的定期船所有年龄都能坐。海蚀洞皮划艇团的年龄按运营方官网
const ACCESS = "https://www.nps.gov/chis/planyourvisit/accessibility.htm";
const MOBILITY = "https://www.nps.gov/chis/planyourvisit/physical-mobility.htm";
const KAYAK = "https://www.sbadventureco.com/channel-islands-tour-pricing/";

export const suitability: Record<string, Suitability> = {
  "chis-scorpion-anchorage": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["motion", "remote", "dropoff"],
    noteZh:
      "单程坐船 1–1.5 小时，海况差时很晃；从船上走台阶到码头的升降平台，码头附近有一段平坦土路轮椅、助行器能走，再往上的步道就不行了。Cavern Point 一带的海崖没有护栏，孩子要牵着；岛上没有医疗和商店，带孩子老人在码头附近的牧场和卵石滩玩就很好。",
    source: MOBILITY,
  },
  "chis-anacapa-island": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion", "remote", "dropoff"],
    noteZh:
      "要从随浪起伏的船上踏上码头铁梯（随潮水高 0–7 英尺），再爬 154 级台阶上岛，Island Packers 说手劲和行动力不够的可能不让下船；岛上步道两边是没有护栏的海崖。带小婴儿、行动不便的老人可以改坐不登岛的 Anacapa 沿岸巡游。",
    source: MOBILITY,
  },
  "chis-sea-cave-kayak": {
    kidsFromAge: 5,
    minAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water", "motion", "remote"],
    noteZh:
      "运营方规定海蚀洞皮划艇团 5 岁以上（浮潜加皮划艇团 10 岁以上），5–11 岁要和大人同坐一条双人艇；要在海上划 2.5–3 小时，进洞时有涌浪，加上来回坐船，体力一般的老人慎重。",
    source: KAYAK,
  },
  "chis-prisoners-harbor": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion", "remote"],
    noteZh:
      "单程坐船约 1.5 小时，下船要从不系泊的船上爬码头铁梯（随潮水高 0–7 英尺），比蝎子湾更偏、没有饮用水；行动不便的去蝎子湾更合适。",
    source: MOBILITY,
  },
  "chis-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说 Ventura 港的大陆游客中心无障碍；看不了岛的老人、轮椅在这里看展览和介绍片，观景塔上的望远镜能望见岛。",
    source: ACCESS,
  },
  "chis-whale-watching": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["motion"],
    noteZh:
      "冬季灰鲸船约 3–3.5 小时，夏季蓝鲸船 5–7 小时，外海浪大容易晕船；船上无障碍条件有限，坐轮椅的提前打电话问 Island Packers。带小孩、老人选短的冬季船或 Anacapa 沿岸巡游。",
    source: ACCESS,
  },
  "chis-santa-rosa-island": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion", "remote"],
    noteZh:
      "单程坐船 2–3 小时、风浪常常很大，下船要从不系泊的船上爬码头铁梯；上了码头是平的木栈桥。岛上风大、没有补给，去白沙滩往返约 4.8 公里，带小孩老人在码头附近的老牧场看看就好。",
    source: MOBILITY,
  },
  "chis-san-miguel-island": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["motion", "remote", "water"],
    noteZh:
      "单程坐船 3–4 小时，外海风浪最大；要从船上爬 4–5 英尺的梯子换小艇，再从小艇跳进浪里涉水上沙滩，上岛后还要爬一段陡坡，岛上可能有未爆弹。来回十几个小时，不适合体力一般的老人和小孩，可以改去 Santa Cruz 岛蝎子湾。",
    source: MOBILITY,
  },
};
