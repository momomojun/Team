import type { Suitability } from "../attractions/types";

// 干龟 · 同行适合度。2026-10-16 按 NPS 无障碍页面（2018 年更新）和运营方官网整理：Yankee Freedom 在 Key West
// 码头有升降机帮上船，要提前说；杰斐逊堡码头有坡道，要塞只有一层（草地和砖路）能推轮椅，二、三层上不去。
// 水上飞机 2 岁以下坐大人腿上、免费，2 岁起要买座位；其余是 Key West 和下礁岛群的景点，按常识判断
const ACCESS = "https://www.nps.gov/drto/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "drto-ferry": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["motion", "remote", "heat"],
    noteZh:
      "单程约 2 小时 15 分的外海航程，冬天风浪大容易晕船；岛上没有医院，几乎没有遮阴。坐轮椅提前打电话约码头升降机，要塞只能逛一层，看不到炮台上的风景。",
    source: ACCESS,
  },
  "drto-seaplane": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion", "remote"],
    noteZh:
      "10 座小飞机低空飞约 40 分钟，颠簸、噪音大；2 岁以下坐大人腿上，2 岁起要买座位。上下飞机要从浮筒爬梯子，行动不便的先打电话问；岛上没有医院和吃的。",
    source: "https://keywestseaplanecharters.com/rates/",
  },
  "drto-mallory-square": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "海边铺装广场，日落前人很挤，孩子看紧，码头边别靠太近。",
  },
  "drto-fort-zachary-taylor": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "要塞一层和野餐区是平地；海滩是碎珊瑚石，婴儿车、轮椅推不了，孩子穿沙滩鞋。",
  },
  "drto-seven-mile-bridge": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "桥面是平坦的铺装路，婴儿车能推，但往返约 7 公里完全没有遮阴；带孩子、老人早上或傍晚走一段就回头，不一定要走到 Pigeon Key。",
  },
  "drto-bahia-honda": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场旁有野餐区和海滩，沙滩推不了车；上旧铁路桥观景的短步道有坡。",
  },
};
