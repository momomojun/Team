import type { Suitability } from "../attractions/types";

// 尖峰石阵 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：东西两侧游客中心完全无障碍，两边入口都有无障碍车位；
// 官方写明无障碍的步道只有西侧的 Prewett Point 步道和东侧 Bench Trail 新修的一段，西侧 Chaparral 停车场旁就能看到岩峰；
// 两个洞穴都要摸黑手脚并用，High Peaks 一带全程暴晒，按景点数据判断
const ACCESS = "https://www.nps.gov/pinn/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "pinn-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说游客中心完全无障碍，旁边有无障碍车位；东侧的 Bench Trail 有新修的一段硬化步道，轮椅也能走。",
    source: ACCESS,
  },
  "pinn-bear-gulch-cave": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble"],
    noteZh:
      "洞里全黑，要弯腰、侧身、手脚并用爬湿滑的石阶，有几处很窄；小孩每人一支头灯、大人在前后护着，膝盖不好的老人可以只走 Rim 步道到水库再原路回来。",
  },
  "pinn-high-peaks": {
    kidsFromAge: 9,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff", "scramble", "heat"],
    noteZh:
      "约 8.5 公里、爬升约 400 米，几乎没有树荫；顶上的 Steep and Narrow 是凿在岩壁上的窄石阶，扶着铁栏杆走，旁边是几十米深的石缝。带孩子、老人走到 Condor Gulch 观景台就回头。",
  },
  "pinn-condor-gulch-overlook": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "一路上坡、全程暴晒，夏天中午别走；观景台有护栏，体力一般的慢慢走，清早或傍晚来。",
  },
  "pinn-chalone-peak": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "往返约 14.5 公里、爬升约 620 米，几乎没有遮挡，路上没有水；带孩子、老人走到 Bear Gulch 水库就回头。",
  },
  "pinn-old-pinnacles-balconies": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble", "heat"],
    noteZh:
      "往返约 8.5 公里，几乎不爬升但没有树荫，要踩石头过几次溪；最后的洞穴要摸黑爬巨石。带小孩、老人不如从西侧走短的 Balconies 环线。",
  },
  "pinn-west-visitor-station": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说游客服务站和洗手间完全无障碍；Prewett Point 无障碍步道就从这里出发。",
    source: ACCESS,
  },
  "pinn-prewett-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说是新修的无障碍步道，不到 1 英里，沿途有带长椅的观景平台；没有树荫，中午很晒。",
    source: ACCESS,
  },
  "pinn-balconies-cave": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble"],
    noteZh:
      "前面是平缓的溪谷土路，洞里有一段全黑，要手脚并用爬巨石、钻低矮石缝，雨后可能要蹚水；老人、小孩不想钻洞可以走到洞口就回头，轮椅在 Chaparral 停车场就能看到岩峰。",
  },
  "pinn-juniper-canyon": {
    kidsFromAge: 9,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff", "scramble", "heat"],
    noteZh:
      "约 6.9 公里、爬升约 370 米，大部分是暴晒的陡坡；顶上 Steep and Narrow 要扶铁栏杆上下陡石阶，雨后湿滑。带孩子、老人改走 Balconies 环线或 Prewett Point。",
  },
};
