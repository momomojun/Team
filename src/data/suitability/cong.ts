import type { Suitability } from "../attractions/types";

// 康加里 · 同行适合度。2026-10-20 按 NPS 无障碍页面和步道表整理：游客中心全无障碍、可以免费借轮椅；
// 步道表写木栈道“轮椅和婴儿车都能走”；木栈道以外的步道是土路，一下雨就积水、会被洪水淹。
// 全园夏天蚊子多、闷热，林子里没有信号。
const ACCESS = "https://www.nps.gov/cong/planyourvisit/accessibility.htm";
const TRAILS = "https://www.nps.gov/cong/planyourvisit/Trail-Information.htm";

export const suitability: Record<string, Suitability> = {
  "cong-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "自动门、展览和商店在同一层，有无障碍厕所和 24 小时家庭卫生间；轮椅可以免费借（先到先得）。",
    source: ACCESS,
  },
  "cong-boardwalk": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方步道表写轮椅、婴儿车都能走，全程平坦、有长椅；约 4.2 公里一圈，体力一般的可以只走游客中心附近的一段原路回。高架那段有的地方没有栏杆，看好小孩；洪水时贴地的一段会被淹。",
    source: TRAILS,
  },
  "cong-weston-lake": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh: "约 7.2 公里的土路，平但常积水、泥泞，有倒树要跨过；沿着 Cedar Creek 走的一段河岸没有护栏，小孩别靠近水边。带小孩、老人只走木栈道到 Weston Lake 观景台就够。",
  },
  "cong-oakridge": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["remote"],
    noteZh: "约 11.4 公里、官方标为 Difficult，有些地方不好认路（NPS 要求带 GPS），没有信号和水，夏天闷热、蚊子多。不适合带小孩，体力一般的老人不建议走完。",
    source: TRAILS,
  },
  "cong-bluff-trail": {
    kidsFromAge: 3,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "约 2.9 公里的沙土路环线，平缓；沙土松软的地方婴儿车推不动，夏天松林里晒。",
  },
  "cong-cedar-creek-paddle": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water", "wildlife"],
    noteZh:
      "水面平静，但要自己划约 3 小时、全程穿救生衣，偶尔有鳄鱼、蛇，别把手伸进水里。小孩坐在大人的独木舟中间，导览公司各有年龄要求，订的时候问清楚；上下船的码头是坡道，老人上下船要人扶。",
  },
  "cong-fireflies": {
    kidsFromAge: 4,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "天黑以后在步道和木栈道上看，只能用红光，路看不太清；观赏区一部分在木栈道上，坐轮椅、推婴儿车走木栈道那段。小孩要能安静等到天全黑（晚上 9 点以后）。",
  },
  "cong-bates-ferry": {
    kidsFromAge: 4,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "老路很平，但到河边最后的河岸又陡又松，雨后很滑；Congaree 河水流急、浑，孩子别靠近水边。",
    source: TRAILS,
  },
};
