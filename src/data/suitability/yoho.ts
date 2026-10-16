import type { Suitability } from "../attractions/types";

// 幽鹤 · 同行适合度。2026-10-16 按 Parks Canada 幽鹤景点页整理：Field、翡翠湖、天然桥、塔卡考瀑布、螺旋隧道观景点
// 标了无障碍设施，翡翠湖到湖后木桥是平的碎石路，塔卡考瀑布是平坦的铺装路；伯吉斯页岩按 Parks Canada 导览页（8 岁以下不能参加）
const PLACES = "https://parks.canada.ca/pn-np/bc/yoho/activ/places";
const WALCOTT = "https://parks.canada.ca/pn-np/bc/yoho/activ/burgess/walcott";

export const suitability: Record<string, Suitability> = {
  "yoho-emerald-lake": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场边就能看湖，有无障碍厕所；从停车场到湖后木桥是平的碎石路，能推车、轮椅有人帮忙能走一段，环湖后半圈是土路和树根。",
    source: PLACES,
  },
  "yoho-natural-bridge": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场旁的观景台就能看到石梁和激流，有无障碍设施；别让孩子翻围栏走上石梁。",
    source: PLACES,
  },
  "yoho-takakkaw-falls": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "从停车场到瀑布脚下约 0.9 公里平坦铺装路，有无障碍厕所；越靠近瀑布水雾越大、石头湿滑。进山的路有急弯，车长超过 7 米要倒车。",
    source: PLACES,
  },
  "yoho-spiral-tunnels": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "公路边的观景点，有无障碍设施，停车走几步就到。",
    source: PLACES,
  },
  "yoho-lake-ohara": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "坐巴士上去后都是土路，湖海拔约 2,000 米；带小孩、老人绕湖走一圈（约 2.8 公里，基本平）就很好，Lake Oesa、Opabin 高原是陡坡和碎石，量力而行。",
  },
  "yoho-wapta-falls": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "单程约 2.2 公里，前面是平缓林间土路，最后一段下到河边很陡；带小孩、老人在上方观景台看瀑布就回头。",
  },
  "yoho-field-visitor-centre": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "Field 村标了无障碍设施，游客中心在 1 号公路旁，冬季关闭（厕所全年开）。",
    source: PLACES,
  },
  "yoho-iceline": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    noteZh: "环线约 20 公里、爬升约 1,090 米，要 8 小时左右，开头是连续陡坡，高处没遮挡、风大；体力一般的和小孩别走全程，可以走到第一段坡顶看塔卡考瀑布就回头，或者只去塔卡考瀑布脚下。",
  },
  "yoho-sherbrooke-lake": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "单程约 4.3 公里、爬升约 280 米的林间缓坡，人少；体力一般的慢慢走，到湖边原路回。",
  },
  "yoho-burgess-shale": {
    kidsFromAge: 12,
    minAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    noteZh:
      "Parks Canada 规定 8 岁以下不能参加，16 岁以下要大人陪；Walcott 采石场往返约 22–24 公里、爬升约 825–900 米，要跟上团队走 11 小时，接近化石点是陡坡碎石。体力一般的、带小孩的去 Field 游客中心看化石展就好。",
    source: WALCOTT,
  },
};
