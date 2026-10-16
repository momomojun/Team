import type { Suitability } from "../attractions/types";

// 德纳里 · 同行适合度。2026-10-16 按 NPS 行动不便页面整理：游客中心有电梯和无障碍厕所，Mountain Vista 环线符合 ADA，
// Savage River 环线前 800 米轮椅能走，McKinley Station 是压实碎石路；很多巴士有轮椅升降台，订票时要说明。
// 按阿拉斯加州法律，坐园内巴士的孩子要用安全座椅或增高垫（家长自带）。观光飞行按 K2 Aviation 官网，漂流按 Denali Raft Adventures 官网
const PHYS = "https://www.nps.gov/dena/planyourvisit/physicalmobility.htm";

export const suitability: Record<string, Suitability> = {
  "dena-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "10 个无障碍车位，正门是按钮自动门，有电梯通各层，男女厕所都能进轮椅，另有家庭厕所。",
    source: PHYS,
  },
  "dena-horseshoe-lake": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["wildlife"],
    noteZh: "土路、有石头和树根，大部分坡度约 5%，最后下到湖边有 20% 的陡坡，回程要爬上来；湖里常有驼鹿，看起来温顺其实很危险，离远一点。",
    source: PHYS,
  },
  "dena-mount-healy": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "入口区最陡的步道，开头平缓，后面坡度到 25%，路宽约 60 厘米，一路爬到山脊；山上风大、天气变化快。体力一般的可以改走马蹄湖或 McKinley Station 步道。",
    source: PHYS,
  },
  "dena-sled-dogs": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "犬舍没有近处车位，最近的离犬舍约 45 米；路是压实碎石、没有明显坡，狗窝周围是很松的碎石，轮椅可能要人推。从游客中心坐班车过去。",
    source: PHYS,
  },
  "dena-mountain-vista": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说休息区的环线是压实碎石、符合 ADA，最大坡度 5%，有无障碍厕所；德纳里峰夏天大约只有三分之一的日子能看到。",
    source: PHYS,
  },
  "dena-savage-river": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "官方说环线前 800 米轮椅能走、几乎没有坡；再往后是窄土路。停车位少，也可以坐免费的 Savage River 班车。",
    source: PHYS,
  },
  "dena-bus": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "assisted",
    seniors: "caution",
    noteZh:
      "很多巴士有轮椅升降台，订票时要说明；到 East Fork 往返约 4.5 小时，讲解团更长，路是碎石土路，每约 90 分钟停一次，休息站都有无障碍厕所。孩子要坐家长自带的安全座椅或增高垫（州法律要求）。",
    source: PHYS,
  },
  "dena-viewpoint-south": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "3 号公路边的观景点，下车或在车上就能看德纳里峰。",
  },
  "dena-talkeetna": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion", "remote"],
    noteZh:
      "官网说婴儿也能坐，每人一个座位，2 岁以下要用 FAA 认证的安全座椅（可以向 K2 借）；小飞机颠簸、耳压变化大，K2 建议带小孩选短航线、加冰川降落，别选绕德纳里峰的高空航线。上下小飞机要自己爬，行动不便的先问航空公司。",
    source: "https://flyk2.com/flying-with-kids",
  },
  "dena-mckinley-station": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "约 1.5 米宽的压实碎石路，一道长缓坡下降约 30 米，最大坡度 8.5%，回程上坡轮椅要有人推。",
    source: PHYS,
  },
  "dena-nenana-rafting": {
    kidsFromAge: 5,
    minAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh:
      "官网写平缓的 Wilderness（McKinley）段 5 岁以上，III–IV 级急流的峡谷段 12 岁以上；冰川融水非常冷，公司提供干式防水服。带孩子、老人选风景段。",
    source: "https://www.denaliraft.com/",
  },
};
