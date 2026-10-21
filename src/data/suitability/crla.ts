import type { Suitability } from "../attractions/types";

// 火山口湖 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：Rim Village 的酒店、Rim 咖啡馆（电梯上二楼看湖）和 Kiser Studio 游客中心是无障碍建筑，
// 沿湖的铺装步道约 1.2 公里、坡度小于 5% 但路面不平；Plaikni Falls 前 3/4 和 Sun Notch 官方说有人协助能走轮椅，
// Vidae Falls 野餐区有无障碍位置、车位和厕所，Pinnacles 步道平而宽。辛诺特观景台要走陡石阶下去。
// 护林员雪鞋徒步的年龄和 Cleetwood Cove 游船的年龄按 activities.ts 里的运营方说明
const ACCESS = "https://www.nps.gov/crla/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "crla-rim-village": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh:
      "沿湖的铺装步道约 1.2 公里、坡度小于 5%，路面有些不平；Rim 咖啡馆有电梯上二楼隔窗看湖。辛诺特观景台要走陡石阶下去，轮椅、婴儿车到不了，酒店后面往加菲尔德峰方向的坡最陡到 15%。",
    source: ACCESS,
  },
  "crla-garfield-peak": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh:
      "往返约 5.8 公里、爬升约 310 米，山顶海拔约 2,455 米；有几段贴着火山口崖边，早季还有很滑的残雪坡。带孩子、老人走酒店后面的铺装段看看湖就回头。",
  },
  "crla-steel-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "全年开放，介绍影片有字幕；公园总部历史区还有几条有无障碍路段的小步道。",
    source: ACCESS,
  },
  "crla-snowshoe-walk": {
    kidsFromAge: 8,
    minAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "8 岁以上才能参加；不走现成的步道，在海拔约 2,100 米的雪地里起起伏伏走 1.6–3 公里，冬天很冷。体力一般的老人在 Rim Village 看雪中的湖就好。",
  },
  "crla-watchman-peak": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "路短，但一路上坡到海拔约 2,440 米的瞭望塔，日落后下山天黑要带头灯；不想爬的在路边 Watchman Overlook 停车场就能近看巫师岛。",
  },
  "crla-discovery-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边停车就能看到湖和巫师岛；石墙外就是火山口内壁，孩子别翻过去。",
  },
  "crla-cloudcap-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车到支路尽头，停车场边就能看，在车上也看得到；风很大，给老人小孩带外套。",
  },
  "crla-mount-scott": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["altitude"],
    noteZh: "往返约 7 公里、爬升约 380 米，坡度平缓但一直上坡，山顶海拔约 2,721 米，空气稀薄、风大；体力一般的去云顶观景台，开车就能到差不多的高度。",
  },
  "crla-cleetwood-cove": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh:
      "2026–2028 年整体重建、全线关闭。重开后：1.7 公里内下降约 210 米，回程相当于爬 60 多层楼，心脏和呼吸不好的别下去；湖水只有约 14°C，孩子下水要看着。湖上游船按运营方规定 3 岁以上。",
  },
  "crla-phantom-ship-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边观景台，停车就能看；想从高处近看幽灵船，附近的 Sun Notch 官方说体力好的轮椅使用者有人协助能上去。",
    source: ACCESS,
  },
  "crla-plaikni-falls": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "官方说前 3/4 有人协助能走轮椅，最后到瀑布的一小段上坡可能太陡；婴儿车也推到这里为止。",
    source: ACCESS,
  },
  "crla-sun-notch": {
    kidsFromAge: 3,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh: "是一小段上坡路，官方说体力好的轮椅使用者有人协助能走；终点在火山口边缘，内壁陡峭松散，孩子一定牵着，别越过崖边。",
    source: ACCESS,
  },
  "crla-vidae-falls": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "东环湖路边停车就能看瀑布；旁边的 Vidae Falls 野餐区有无障碍位置、车位和厕所。",
    source: ACCESS,
  },
  "crla-pinnacles": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "官方说步道平而宽，停车场边就能看到尖塔。2026 年整季 Pinnacles Road 因施工只能步行或骑车进入，出发前查 NPS 路况。",
    source: ACCESS,
  },
};
