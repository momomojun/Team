import type { Suitability } from "../attractions/types";

// 温泉 · 同行适合度。2026-10-20 按 NPS 无障碍页面整理：浴场街的每座楼都能坐轮椅进，Fordyce 有电梯到每一层、能免费借两台轮椅，
// Grand Promenade 全程铺装、Fountain Street 和 Fordyce 后面有坡道；
// 步道的坡度按 NPS Hot Springs and North Mountain Trails 页面写的平均坡度；观景塔按运营方官网（有电梯、无障碍）；
// Quapaw 按官网“不接待 14 岁以下”。温泉出水口的水约 62°C，所有地方都要看好小孩别伸手。
const TRAILS = "https://www.nps.gov/hosp/planyourvisit/hot-springs-and-north-mountain-trails.htm";
const ACCESS = "https://www.nps.gov/hosp/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "hosp-fordyce": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说电梯能到每一层，走廊宽 79–97 厘米，大多数轮椅能过，馆内能免费借两台轮椅；最近的停车楼离这里约 400 米，过 Central Avenue 的路口有坡道。",
    source: ACCESS,
  },
  "hosp-bathhouse-row": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["thermal"],
    noteZh: "官方说浴场街每座楼都能坐轮椅进，绕街区一圈有 1.2–1.5 米宽的铺装步道（南头 Reserve Street 那端没有坡道）；取水龙头和出水口的水约 62°C，孩子别伸手去接，接的水放凉再喝。",
    source: ACCESS,
  },
  "hosp-buckstaff": {
    kidsFromAge: 12,
    stroller: "no",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["thermal"],
    noteZh:
      "男女分开、按老规矩单人泡温泉、进蒸汽箱，热水和蒸汽对心脏病、高血压、孕妇不合适，老人泡的时间短一点、多喝水。官网没写年龄要求，带孩子的先打电话问；楼里有老电梯，坐轮椅的先问能不能接待。",
    source: "https://www.buckstaffbaths.com/appointments-and-hours",
  },
  "hosp-quapaw": {
    kidsFromAge: 14,
    minAge: 14,
    stroller: "no",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["thermal"],
    noteZh: "官网写不接待 14 岁以下的孩子。温泉池水温高，心脏病、高血压的老人泡的时间短一点；池边湿滑。",
    source: "https://www.quapawbaths.com/",
  },
  "hosp-grand-promenade": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["thermal"],
    noteZh:
      "官方说全程铺装，Fountain Street 和 Fordyce 后面有坡道上来，沿途有带靠背的长椅，平均坡度 3.7%；坐轮椅上坡道要有人推。展示泉、热水瀑布的水很烫，孩子别伸手、别爬上石坡。",
    source: ACCESS,
  },
  "hosp-mountain-tower": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车到塔下，坐电梯上观景台，运营方写无障碍；观景台有围栏。恐高的人上去前想好。",
    source: "https://hotspringstower.com/",
  },
  "hosp-hot-springs-mountain-trail": {
    kidsFromAge: 3,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "官方写平均坡度 0.5%，是全园最平的步道，但是土路和碎石，婴儿车推得动但颠。",
    source: TRAILS,
  },
  "hosp-goat-rock": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh: "单程约 1.8 公里、起伏不大（官方写平均坡度 3.2%），终点的岩坡边没有护栏、碎石滑，孩子要牵着。",
    source: TRAILS,
  },
  "hosp-west-mountain": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车到观景点，下车走几步就能看；山路窄弯多，容易晕车的孩子提前准备。",
  },
  "hosp-gulpha-gorge": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "官方说营地和厕所都有坡道；营地和野餐区地势平，溪水浅；下雨后会涨水，小孩玩水要看着。对面的 Gulpha Gorge 步道很陡（官方写平均坡度 13.8%），老人不建议往上走。",
    source: TRAILS,
  },
};
