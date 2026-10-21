import type { Suitability } from "../attractions/types";

// 印第安纳沙丘 · 同行适合度。2026-10-20 按 NPS 无障碍页面和各步道页整理：
// West Beach 有无障碍步道到海滩、夏天能借海滩轮椅；Portage Lakefront 有沙滩垫（晚春到早秋）和水泥步道；
// Paul H. Douglas Center 的短步道全无障碍；沙丘上的步道都是松沙和木台阶。
// 所有湖滩：密歇根湖的离岸流、大浪很危险，救生员不一定有。
const ACCESS = "https://www.nps.gov/indu/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "indu-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方列为无障碍（楼和展览），放映厅有助听设备。",
    source: ACCESS,
  },
  "indu-west-beach": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["water", "heat"],
    noteZh:
      "停车场到浴室和海滩有无障碍步道，阵亡将士纪念日到劳动节在入口找工作人员借大轮子的海滩轮椅；Dune Succession 要爬 270 多级木台阶，坐轮椅、推婴儿车只到海滩。湖里离岸流危险、救生员不一定有，孩子下水一直有大人在身边；夏天沙子很烫。",
    source: ACCESS,
  },
  "indu-mount-baldy": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh: "海滩步道约 1.2 公里，下到湖滩是陡的松沙坡，回程只能爬上来（NPS 原话），老人量力而行；山顶平时关闭，别自己爬，沙子里有被埋的树干塌出的洞。",
    source: "https://www.nps.gov/indu/planyourvisit/mb16.htm",
  },
  "indu-cowles-bog": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "约 7.6 公里、官方说要约 4 小时，最后几道沙丘是松沙陡坡；蜱虫全年都有、有毒漆藤。带孩子、老人走近路（少约 1.5 公里、不爬沙丘），或者只走到池塘一带回头。",
    source: "https://www.nps.gov/indu/planyourvisit/cb16.htm",
  },
  "indu-miller-woods": {
    kidsFromAge: 5,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    noteZh: "官方说教育中心旁边的短步道全无障碍，能看两片沼泽、有儿童游乐区；往湖边去的沙丘段是松沙，老人、小孩走起来累。",
    source: ACCESS,
  },
  "indu-portage-lakefront": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "官方说 Riverwalk 大部分是水泥步道，晚春到早秋沙滩上铺轮椅能走的沙滩垫；防波堤上风浪大时别带孩子走到尽头。",
    source: ACCESS,
  },
  "indu-great-marsh": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "官方步道表写另有一段轮椅能走的铺装步道；主步道是约 2 公里的平土路，雨后泥泞。",
    source: "https://www.nps.gov/indu/planyourvisit/hiking.htm",
  },
  "indu-chellberg-farm": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "农场一带地势平，能看动物和老房子；整圈约 5.5 公里，沿河一段起伏、雨后泥泞，老人可以只在农场附近走走。",
  },
  "indu-lake-view": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "停车场在海滩上方，下到沙滩有台阶和沙路；老房子在路边就能看。湖里离岸流危险，孩子下水要有大人陪。",
  },
  "indu-3-dune-challenge": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    seniorsSerious: true,
    hazards: ["heat"],
    noteZh:
      "州立公园标为 Rugged：约 2.4 公里连爬三座最高的沙丘，大部分是陡的松沙坡和台阶，夏天沙子烫、没有遮阴。体力一般的老人很吃力，带老人请务必慎重考虑；带孩子的选凉快的时候、多休息。",
    source: "https://www.in.gov/dnr/state-parks/parks-lakes/indiana-dunes-state-park/",
  },
};
