import type { Suitability } from "../attractions/types";

// 科伯克谷 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：Kotzebue 的西北极遗产中心无障碍，可以借轮椅；
// 公园里没有路、没有修过的步道，园内没有任何设施，只能坐小飞机或船进去
const ACCESS = "https://www.nps.gov/kova/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "kova-heritage-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "遗产中心无障碍，需要的话可以借轮椅；讲座有助听设备。",
    source: ACCESS,
  },
  "kova-kotzebue": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "镇子小，机场、旅馆、超市都走得到，但很多路是砂石路，推车、轮椅会颠；海边风大很冷。",
  },
  "kova-sand-dunes": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["remote", "motion", "heat"],
    noteZh:
      "单程飞约 1 小时，降在沙面上，没有任何设施；夏天沙面能晒到 38°C，起风又很冷，溪边湿沙会陷脚。小孩、老人在飞机附近的沙丘走走就好，带足水、防晒和外套。",
    source: ACCESS,
  },
  "kova-onion-portage": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["remote", "motion"],
    noteZh: "坐水上飞机降在 Kobuk 河上，岸边是沙地和灌丛，没有设施；驯鹿什么时候来说不准，要等，秋天很冷。体力一般的可以改坐观光飞行从空中看。",
    source: ACCESS,
  },
  "kova-flightseeing": {
    kidsFromAge: 2,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion", "remote"],
    noteZh: "坐 Cessna 206 这类小飞机 2–3 小时，颠簸，晕机的提前吃药；上下飞机要爬，行动不便的先问航空公司。",
  },
};
