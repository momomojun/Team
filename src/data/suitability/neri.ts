import type { Suitability } from "../attractions/types";

// 新河峡谷 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：Canyon Rim、Sandstone 游客中心全无障碍，
// Canyon Rim 上层观景台有坡道、下层要走 178 级台阶；Sandstone 瀑布约 400 米木栈道能走部分助行设备；
// Long Point、Glade Creek 步道只有前约 400 米无障碍。Bridge Walk、漂流按运营方官网的年龄要求
const ACCESS = "https://www.nps.gov/neri/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "neri-canyon-rim": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游客中心全无障碍，屋后木栈道有坡道到第一个观景点，能看到大桥；下层观景台要走 178 级台阶，回程全是上坡，老人在上层看就够。",
    source: ACCESS,
  },
  "neri-long-point": {
    kidsFromAge: 5,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh: "前约 400 米官方说轮椅能走，到岩尖的观景处不行；最后一小段陡，岩尖没有护栏，孩子要牵着。回程是缓上坡，看完日落带头灯。",
    source: ACCESS,
  },
  "neri-endless-wall": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh: "林间路不难，但 Diamond Point 等观景点都悬在近 300 米深的峡谷边，没有护栏，雨后砂岩很滑；孩子一直牵着。",
  },
  "neri-fayette-station-road": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车下到谷底、在车上就能仰望大桥；单行急弯多，容易晕车的孩子提前准备。",
  },
  "neri-bridge-walk": {
    kidsFromAge: 8,
    minAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "运营方要求 8 岁以上、身高至少 122 厘米；全程系安全绳，在约 60 厘米宽的检修走道上走约 1.8 公里往返，脚下 260 米是河，恐高的慎重。不够年龄的在 Canyon Rim 观景台看桥。",
    source: "https://bridgewalk.com/",
  },
  "neri-whitewater-rafting": {
    kidsFromAge: 12,
    minAge: 12,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh:
      "下游峡谷是 III–V 级激流，运营方要求 12 岁以上、会游泳，水上 4–6 小时，落水的可能不小。带小孩、老人改订上游河段（Upper New）的平缓漂流，年龄要求低得多。",
    source: "https://adventuresonthegorge.com/whitewater-rafting/lower-new-river-rafting-full-day/",
  },
  "neri-kaymoor": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "下到谷底要走 821 级木台阶，落差约 270 米，回程全靠爬台阶，雨后湿滑。带孩子、老人走到半山的矿口看矿车就回头。",
  },
  "neri-nuttallburg": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "谷底的短步道是土路和碎石，选煤塔从停车场附近就能看到；进来的路窄陡、单车道，谷底没信号。",
  },
  "neri-thurmond": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "火车站有轮椅坡道和电梯到二楼（门不是自动的）；铁轨还在用，孩子别上轨道。",
    source: ACCESS,
  },
  "neri-grandview": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "官方说主观景台有轮椅专用平台，但从停车场过去约 450 米的路铺着大块不平的石头，坐轮椅要有人帮；游客中心有坡道。",
    source: ACCESS,
  },
  "neri-sandstone-falls": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "约 400 米木栈道跨两座桥上到岛上的观景台，官方说能走部分助行设备；河水又急又冷，孩子别下水，涨水时步道可能被淹。",
    source: ACCESS,
  },
  "neri-babcock-grist-mill": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "磨坊离停车场很近，从路边就能看到；到溪边拍照的位置是石头和土坡。",
  },
};
