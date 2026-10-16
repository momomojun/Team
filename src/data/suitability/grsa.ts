import type { Suitability } from "../attractions/types";

// 大沙丘 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：游客中心完全无障碍；普通轮椅进不了沙丘，
// 游客中心免费借气球轮胎的沙地轮椅（大人、小孩各一台），干沙上要有力气的人推，梅达诺溪边的湿沙好推得多；
// 停车场到溪边有一条无障碍垫道。萨帕塔瀑布在 BLM 地界上，按 BLM 的说明。夏天午后沙面能到 65°C 以上，还常有雷暴
const ACCESS = "https://www.nps.gov/grsa/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "grsa-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方写明大楼和洗手间完全无障碍；沙地轮椅在这里借，要先预约。",
    source: ACCESS,
  },
  "grsa-dunefield": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["heat"],
    noteZh:
      "普通轮椅、婴儿车在软沙上推不动，可以借沙地轮椅，但干沙上要有力气的人推，别推到石头和仙人掌上；夏天午后沙面滚烫，小孩光脚会烫伤，清早或傍晚来，老人小孩在第一排沙丘脚下玩就够了。",
    source: ACCESS,
  },
  "grsa-medano-creek": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh:
      "停车场到溪边有无障碍垫道，借来的沙地轮椅在溪边湿实的沙上比较好推；溪水很浅，但刚化的雪水很凉，小孩玩久了要上岸晒晒。",
    source: ACCESS,
  },
  "grsa-high-dune": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "从底到顶约 210 米，沙地上走一步滑半步，海拔约 2,500 米，往返约 4 公里也要 2–4 小时；夏天上午早点下来，听到雷声立刻下撤。带小孩、老人在沙丘脚下的小坡爬一爬、滑一滑就好。",
  },
  "grsa-star-dune": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "往返约 10 公里、全程没有路，平均 6 小时以上，每人要带 3 升以上的水；不适合小孩和体力一般的老人，全家可以沿梅达诺溪河床走一段看看就回来。",
  },
  "grsa-sandboarding": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "滑一次就要抱着板爬一次沙坡，很耗体力；小孩在沙丘脚下的小坡滑就够了，老人在坡下看。夏天只在清早或傍晚滑，鞋别脱。",
  },
  "grsa-night-sky": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场就能看星星；营地露天剧场有铺装小路，官方说多数护林员讲座轮椅能参加。夏夜也会降到 10°C 以下，带厚外套。",
    source: ACCESS,
  },
  "grsa-montville-trail": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
  },
  "grsa-mosca-pass-trail": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh: "往返约 11 公里、爬升约 430 米，山口海拔约 2,960 米；带小孩、老人走游客中心旁的蒙特维尔小环线就好。春夏林子里有蜱虫，穿长裤。",
  },
  "grsa-castle-creek": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "普通车停在 Point of No Return，再在沙路上走约 2.4 公里，往返近 5 公里软沙，夏天很晒；有低速四驱的高底盘车可以直接开到野餐区，带小孩老人这样去最省力。",
  },
  "grsa-medano-pass-road": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["remote"],
    noteZh: "深沙、涉水、碎石陡坡一路颠簸，来回大约半天，全程没有手机信号，出了故障救援慢；腰背不好的老人坐着会很累，可以只开到 Point of No Return 前的路段看看。",
  },
  "grsa-zapata-falls": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["water", "altitude"],
    noteZh:
      "BLM 说这段路短但费力，海拔从约 2,740 米爬到约 2,870 米；最后要蹚冰凉湍急的溪水、踩湿滑的石头才能进岩缝，冬天结的冰不一定撑得住人。带小孩、老人走到岩缝口就回头，停车场就能俯瞰沙丘。",
    source: "https://www.blm.gov/visit/zapata-falls-campground",
  },
};
