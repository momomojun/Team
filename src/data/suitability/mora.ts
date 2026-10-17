import type { Suitability } from "../attractions/types";

// 雷尼尔山 · 同行适合度。2026-10-16 按 NPS 各片区无障碍页面整理：官方说 Paradise 的步道“大多铺装但很陡”，
// 没有一条算无障碍步道；天堂游客中心有电梯，能借手动轮椅；日出游客中心正门有台阶。
// 日出、蒂普苏湖看 Sunrise 页，影子步道、朗迈尔看 Longmire 页，箱形峡谷看 Ohanapecosh 页
const PARADISE = "https://www.nps.gov/mora/planyourvisit/paradise-accessibility.htm";
const SUNRISE = "https://www.nps.gov/mora/planyourvisit/sunrise-accessibility.htm";
const LONGMIRE = "https://www.nps.gov/mora/planyourvisit/longmire-accessibility.htm";
const OHANAPECOSH = "https://www.nps.gov/mora/planyourvisit/ohanapecosh-accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "mora-skyline-trail": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "环线约 9 公里、爬升约 520 米，Glacier Vista 一段坡很陡，7 月中旬前高处还有残雪坡、路迹不清；带孩子、老人走铺装的那段到默特尔瀑布就回头，也能看到雷尼尔山。",
  },
  "mora-myrtle-falls": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh:
      "铺装路，往返约 1.6 公里，有几段陡坡，轮椅要有人推，能到瀑布上方的小桥；经典机位的观景台要下台阶和陡土路，婴儿车、轮椅到不了。官方说去瀑布的一段路在施工，绕行路线坡更陡、有台阶。",
    source: PARADISE,
  },
  "mora-reflection-lakes": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "Stevens Canyon Road 路边停车就能看湖和倒影，在车上也看得到。",
  },
  "mora-narada-falls": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场旁的石桥上能看到瀑布顶；下到观景台是一段陡坡小路，水雾大、地面湿滑，婴儿车、轮椅在桥边看就好。",
  },
  "mora-sunrise-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "partial",
    seniors: "ok",
    noteZh:
      "停车场正对雷尼尔山和埃蒙斯冰川，坐轮椅在停车场就能看；游客中心正门有几级台阶，厕所在外面另一栋小房子里。海拔约 1,950 米，老人走动慢一点。",
    source: SUNRISE,
  },
  "mora-naches-peak-loop": {
    kidsFromAge: 4,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh:
      "蒂普苏湖停车场有 5 个无障碍车位和无障碍野餐桌，坐轮椅、推婴儿车在湖边看倒影就好；绕湖一圈的 0.8 公里小路大多是压实的平土路，但很窄，停车场附近有石阶，还要过几座木桥。",
    source: SUNRISE,
  },
  "mora-paradise-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "入口宽、地面平，展厅在二楼有电梯；凭带照片的证件能短时间借手动轮椅。",
    source: PARADISE,
  },
  "mora-nisqually-vista": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "环线约 1.9 公里，起点在下停车场最左边，一开始就是台阶，前段还有一长段陡坡；婴儿车要抬过台阶，坐轮椅的可以在游客中心附近看冰川。",
    source: PARADISE,
  },
  "mora-christine-falls": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "石桥两侧各有一处小停车点，下到观景点是约 30 米长的一小段下坡路；桥上车流很近，孩子要牵着，别走上桥拍照。",
  },
  "mora-comet-falls": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "往返约 6 公里、爬升约 370 米，一路陡坡；积雪化完前（通常 7 月前）要横切很陡的雪坡，NPS 不建议去。带孩子、老人想看瀑布，可以去路边的克里斯汀瀑布。",
  },
  "mora-trail-of-the-shadows": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "靠停车场的一半是平坦宽阔的碎石路，有不少解说牌，轮椅、婴儿车走这一半就好；远端有几段陡坡、路面颠簸，轮椅很难推。",
    source: LONGMIRE,
  },
  "mora-longmire": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "去博物馆的路铺装但不平、有陡的地方，门和过道很窄（最窄约 74 厘米）；National Park Inn 一楼有两间带无障碍淋浴的房间。",
    source: LONGMIRE,
  },
  "mora-box-canyon": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh:
      "停车场有铺装路下到观景处，但坡很陡，轮椅要有人推；也可以沿窄人行道走到桥上往下看。0.8 公里的铺装环线西侧有几段台阶，婴儿车推不过去。",
    source: OHANAPECOSH,
  },
  "mora-silver-falls": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh: "林中土路，上下坡、有树根；瀑布边岩石湿滑、水流急，孩子别越过栏杆下到水边。",
  },
  "mora-sunrise-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边的大弯道观景台，官方说有无障碍停车位，下车就能看雷尼尔山和喀斯喀特群峰。",
    source: SUNRISE,
  },
  "mora-sourdough-ridge": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "开头一段上坡爬到山脊，海拔约 2,100 米、没有遮挡，风大、晒；带孩子、老人爬上山脊看一眼雷尼尔山就原路回来。",
  },
  "mora-fremont-lookout": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "往返约 9 公里、爬升约 270 米，海拔 2,000 米以上，几乎没有树荫，最后一段走在碎石坡上，风很大；体力一般的走到 Frozen Lake 就回头。",
  },
  "mora-burroughs-mountain": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "环线约 10 公里（6 英里）、爬升约 370 米（1,200 英尺），高山苔原上没有遮挡；北坡的残雪到夏末都可能结冰，NPS 提醒没有防滑装备别硬走。带孩子、老人最多到第一巴勒斯山，或只走到 Frozen Lake。",
  },
};
