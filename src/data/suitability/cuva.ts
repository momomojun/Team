import type { Suitability } from "../attractions/types";

// 凯霍加谷 · 同行适合度。2026-10-20 整理：NPS 无障碍页面只写了“陡峡谷里的步道最难走”，具体的按各景点页：
// Towpath 是压实碎石的平路，轮椅、自行车、婴儿车都能走；Brandywine 瀑布有一条没有台阶的木栈道；The Ledges 官方写“行动不便的人去不了”。
const TOWPATH = "https://www.nps.gov/cuva/planyourvisit/ohio-and-erie-canal-towpath-trail.htm";

export const suitability: Record<string, Suitability> = {
  "cuva-boston-mill-vc": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游客中心在平地上，门口就是 Towpath，推婴儿车、坐轮椅都方便（无障碍页面没写细节，按现场的平路判断）。",
  },
  "cuva-brandywine-falls": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["dropoff", "water"],
    noteZh:
      "官方说有一条没有台阶的木栈道到上面的观景处，坐轮椅、推婴儿车走这条；下到峡谷里正对瀑布的一段有很多台阶。别让孩子翻栏杆、爬岩石，离瀑布顶和底都要 15 米以上，石头很滑。",
    source: "https://www.nps.gov/cuva/learn/historyculture/brandywine-falls.htm",
  },
  "cuva-ledges": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh: "官方写行动不便的人去不了：崖下是石阶、窄石缝和不平的岩石路；崖顶观景点边上没有护栏，孩子要牵着。只想看日落的老人可以从停车场穿过草地直接走到观景点，不用绕崖下一圈。",
    source: "https://www.nps.gov/cuva/the-ledges.htm",
  },
  "cuva-beaver-marsh": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "Towpath 是压实碎石的平路，官方说轮椅、婴儿车都能走；沼泽上的木栈道两边有栏杆，自行车多，孩子别跑到路中间。",
    source: TOWPATH,
  },
  "cuva-towpath-bike": {
    kidsFromAge: 6,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "全程平坦，官方说轮椅、婴儿车都能走；骑车适合会骑的孩子，路上自行车、行人多，小小孩坐儿童座椅或拖车。来回距离自己控制，累了可以坐火车回来（6–8 月）。",
    source: TOWPATH,
  },
  "cuva-scenic-railroad": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "坐着看风景，适合所有年龄；老车厢上下有台阶，坐轮椅的订票时问清楚有没有无障碍车厢和升降设备，婴儿车要折起来放。",
  },
  "cuva-everett-covered-bridge": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "车停在桥边，走几步就到桥上；周围是草地和土路。",
  },
  "cuva-blue-hen-falls": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh: "官方说这段 Buckeye Trail 不能坐轮椅、常常泥泞，来回约 4.8 公里、上下约 180 米；瀑布周围是陡坡，孩子别往下爬。",
    source: "https://www.nps.gov/thingstodo/hike-to-blue-hen-falls.htm",
  },
  "cuva-peninsula": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "小镇街道平，Lock 29 旁边就是 Towpath；老房子改的小店有的门口有台阶。",
  },
};
