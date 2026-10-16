import type { Suitability } from "../attractions/types";

// 拉森火山 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：Kohm Yah-mah-nee 游客中心完全无障碍，卢米斯博物馆西侧有轮椅入口；
// 硫磺厂的铺装人行道官方说要有人协助，火山毁灭区是约 0.8 公里硬化路面环线，曼萨尼塔湖的环湖路是土路、只有南岸一段比较好走；
// 曼萨尼塔湖、海伦湖、火山毁灭区、国王溪的野餐区有平整位置、无障碍厕所和车位。伯尼瀑布按加州州立公园无障碍页面，
// 地铁熔岩洞按景点数据。地热区只能走步道和栈道
const ACCESS = "https://www.nps.gov/lavo/planyourvisit/accessibility.htm";
const BURNEY = "https://www.parks.ca.gov/AccessibleFeatures/Details/455";

export const suitability: Record<string, Suitability> = {
  "lavo-sulphur-works": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["thermal"],
    noteZh:
      "停车场到泥浆池有铺装人行道，官方说轮椅要有人协助，停车场有无障碍车位和旱厕；人行道外的地面下可能是酸性沸水，孩子一定牵着，别让他们跑出人行道。",
    source: ACCESS,
  },
  "lavo-lake-helen": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "公路就在湖边，停车就能看湖和拉森峰；野餐区有平整位置、无障碍厕所和车位。海拔约 2,500 米，老人走动慢一点。",
    source: ACCESS,
  },
  "lavo-bumpass-hell": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["thermal"],
    noteZh:
      "往返约 4.5 公里，起点海拔约 2,500 米，最后一段下到盆地、回程要爬坡，没有遮阴；盆地里只能走栈道，离开栈道有人被严重烫伤，孩子一定牵着。不想走远的可以去硫磺厂，路边就能看地热。",
  },
  "lavo-lassen-peak": {
    kidsFromAge: 9,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh:
      "往返约 8 公里、爬升约 600 米，从约 2,590 米爬到约 3,187 米，一路之字形碎石坡，空气稀薄、午后常有雷暴，7 月初还有积雪；体力一般的在海伦湖看拉森峰就好。",
  },
  "lavo-manzanita-lake": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "环湖路是土路，官方说没有一段算无障碍，但不少人从船坡那边能走南岸的一段；湖边野餐区有无障碍厕所和车位。",
    source: ACCESS,
  },
  "lavo-cinder-cone": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "往返约 6.4 公里，前段是软沙土路，最后爬锥体的一段全是松软火山渣，又陡又滑，全程暴晒、没有信号；带孩子、老人走到锥底看看熔岩流就回头。",
  },
  "lavo-kohm-yah-mah-nee": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说游客中心完全无障碍，有触摸展品和语音讲解，门口有无障碍车位；旁边的露天剧场轮椅也能到。",
    source: ACCESS,
  },
  "lavo-mill-creek-falls": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "往返约 6 公里，一路上上下下，回程也要爬坡，有窄路和过溪的地方；过火区的枯立木可能倒下，刮大风时别去。体力一般的在游客中心附近走走就好。",
  },
  "lavo-brokeoff-mountain": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh: "往返约 12 公里、爬升约 790 米，山顶海拔约 2,800 米，上半段没有遮阴，8 月中前还有残雪；体力一般的改走曼萨尼塔湖或火山毁灭区。",
  },
  "lavo-kings-creek-falls": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "去程下坡、回程一路上坡，海拔约 2,200 米；Cascades 那段石阶陡、紧挨着瀑布，带孩子走原路别走石阶，瀑布观景台有围栏。",
  },
  "lavo-summit-lake": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场边就能看湖；湖边小路是土路，北营地有无障碍营位。",
  },
  "lavo-devastated-area": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说是约 0.8 公里的硬化路面环线，步道口有无障碍车位和旱厕，抬头就是拉森峰。",
    source: ACCESS,
  },
  "lavo-hot-rock": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "公路边的小停车区，在车上就能看到巨石。",
  },
  "lavo-chaos-crags": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "公路边的观景停车区，下车或在车上就能看岩峰和乱石滩。",
  },
  "lavo-loomis-museum": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说轮椅入口在楼的西侧，无障碍厕所在门外的 Loomis Plaza。",
    source: ACCESS,
  },
  "lavo-burney-falls": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh:
      "从顶上观景台下到瀑布底的环线有坡，回程要爬上来，婴儿车在顶上观景台看就好；州立公园说从 Beach 停车场出发的 Burney Creek Trail 是无障碍路线，能到一处看瀑布的观景点（地面滑动时会临时关闭）。",
    source: BURNEY,
  },
  "lavo-subway-cave": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "进出洞口都要下上台阶，洞里全黑、地面是凹凸不平的熔岩，有的地方顶很低；每人一支手电，孩子牵着走。",
  },
};
