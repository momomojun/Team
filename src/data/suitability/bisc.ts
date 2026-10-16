import type { Suitability } from "../attractions/types";

// 比斯坎 · 同行适合度。2026-10-16 按 NPS 无障碍页面和 Biscayne National Park Institute（BNPI）各团的官网说明整理：
// 游客中心有坡道、电梯和自动门，海堤步道轮椅能走；Homestead 出发的遗产游船能上轮椅，Coconut Grove 的
// Dinner Key 码头放不下坡道，Boca Chita、Stiltsville 两个团上不了轮椅；浮潜拼团 8 岁、泻湖划桨拼团 12 岁起，
// 下水的团都要会游泳、能自己爬 4 级垂直梯子，体重上限 275 磅
const ACCESS = "https://www.nps.gov/bisc/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "bisc-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "有坡道、电梯和自动门，放映厅有轮椅位，影片有字幕。",
    source: ACCESS,
  },
  "bisc-jetty-trail": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说轮椅和助行设备能走，大部分是木栈道、剩下是压实的土路，雨后有小水坑；沿途有长椅，几乎没有遮阴。",
    source: ACCESS,
  },
  "bisc-heritage-cruise": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "官网说船能上轮椅，码头和 Boca Chita 都有坡道（订票时打电话要坡道，船检修时可能换成不能上轮椅的船）；岛上大多是没铺的草地和石头路。4 岁以下免费，船一直在湾里，晕船的少。",
    source: "https://www.biscaynenationalparkinstitute.org/heritage-of-biscayne-cruise/",
  },
  "bisc-boca-chita": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "Dinner Key 码头放不下坡道，上船要跨一大步，这个团上不了轮椅，坐轮椅的改订 Homestead 出发的遗产游船；进灯塔要身高 107 厘米以上。",
    source: "https://www.biscaynenationalparkinstitute.org/island-experiences/boca-chita-key-heritage-cruise/",
  },
  "bisc-snorkel": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water", "motion"],
    noteZh:
      "拼团 8 岁以上，8 岁以下只能包船；要会游泳、能自己爬 4 级垂直梯子，体重 275 磅以内，外海有流和涌浪，有病史的要带医生意见。不下水的家人可以订遗产游船。",
    source: "https://www.biscaynenationalparkinstitute.org/snorkeling/snorkel-experience-2/",
  },
  "bisc-jones-lagoon": {
    kidsFromAge: 12,
    minAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh:
      "拼团 12 岁以上、要会游泳；8–12 岁只能包船，和大人同坐双人艇。要自己爬 4 级垂直梯子，体重 275 磅以内，官方说划起来对有些人又长又累。",
    source: "https://www.biscaynenationalparkinstitute.org/paddling/jones-lagoon-paddle-eco-adventure/",
  },
  "bisc-stiltsville": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "船本身能上轮椅，但 Dinner Key 码头放不下坡道，坐轮椅上不了船；不靠岸，4 岁以下免费。",
    source: "https://www.biscaynenationalparkinstitute.org/stiltsville-guided-tour-from-coconut-grove/",
  },
  "bisc-coral-castle": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "露天的石头园，地面是珊瑚石和草地，几乎没有遮阴；夏天挑早上去。",
  },
};
