import type { Suitability } from "../attractions/types";

// 基奈峡湾 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：Seward 游客中心、Exit Glacier 自然中心无障碍，自然中心能借轮椅；
// 去 Glacier View 的 1 英里环线能走轮椅（部分铺装、部分压实碎石）；游船都是私营的，官方说多数船能上轮椅，订票时要说明
const ACCESS = "https://www.nps.gov/kefj/planyourvisit/accessibility.htm";
const HARDING = "https://www.nps.gov/kefj/planyourvisit/harding_icefield_trail.htm";

export const suitability: Record<string, Suitability> = {
  "kefj-exit-glacier-nature-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "自然中心和洗手间无障碍，开放时间内能借轮椅；门口就是能走轮椅的 Glacier View 环线。",
    source: ACCESS,
  },
  "kefj-exit-glacier": {
    kidsFromAge: 3,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["wildlife"],
    noteZh:
      "前 1 英里环线到 Glacier View 能推轮椅、婴儿车，能看到冰川全景；再上坡约 1 公里到冰川边的观景台是碎石陡坡。这一带黑熊常见，结伴、出声；冰川出水口的峡谷有突发洪水，别进禁区。",
    source: ACCESS,
  },
  "kefj-harding-icefield": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["wildlife", "dropoff"],
    noteZh:
      "单程约 6.3 公里、爬升约 950 米，NPS 说平均每英里爬 1,000 英尺，要 6–8 小时；上段常到 7 月初还有陡雪坡，积雪期算登山路线，有雪崩。黑熊几乎天天出现。带小孩、体力一般的走到 Marmot Meadows 俯瞰 Exit Glacier 就回头，或改走山下的冰川步道。",
    source: HARDING,
  },
  "kefj-fjords-cruise": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "yes",
    seniors: "caution",
    hazards: ["motion"],
    noteZh:
      "6–7.5 小时，出了复活湾有一段开阔海面，晕船的提前吃药；NPS 说多数游船能上轮椅，订票时说明。甲板很冷，婴儿车在船上推不开，用背带。只想短一点可以坐 3–4 小时的复活湾游船。",
    source: ACCESS,
  },
  "kefj-northwestern-fjord": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "yes",
    seniors: "caution",
    hazards: ["motion"],
    noteZh:
      "8.5–9 小时一整天在船上，外海风浪大的日子晕船很明显；Major Marine 这条线 12 岁以下不能上船，带小孩订 Kenai Fjords Tours，或者改坐 6 小时的 Aialik 湾航线。轮椅订票时说明。",
    source: ACCESS,
  },
  "kefj-resurrection-bay-cruise": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "3–4 小时，只在风浪小的复活湾里，带小孩、容易晕船的最合适；NPS 说多数游船能上轮椅，订票时说明。",
    source: ACCESS,
  },
  "kefj-sea-kayak": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh: "海水只有几度，翻船很危险；Seward 的皮划艇公司多数要 8 岁以上，还有体重和腰围限制，订之前问清楚。带小孩、老人可以坐游船看海獭。",
  },
  "kefj-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游客中心和洗手间无障碍，展览能用 NPS App 听语音讲解。",
    source: ACCESS,
  },
  "kefj-sealife-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官网写明能推轮椅和婴儿车，现场还能借少量轮椅、婴儿车。",
    source: "https://alaskasealife.org/directions_accessibility",
  },
  "kefj-beluga-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "路边停车区就能看海湾；退潮后的泥滩像流沙一样陷人，潮水涨得很快，千万别让孩子下去踩泥。",
  },
};
