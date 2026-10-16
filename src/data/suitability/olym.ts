import type { Suitability } from "../attractions/types";

// 奥林匹克 · 同行适合度。2026-10-16 按 NPS 行动不便无障碍页面整理：官方说园内所有海滩都没有无障碍通道；
// 页面逐条列了步道的路面、宽度和坡度（飓风岭几条铺装步道、霍河雨林、Maple Glade 等），我们按这些数据判断。
// 索尔达克温泉按度假村官网
const PHYS = "https://www.nps.gov/olym/planyourvisit/physical-mobility-accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "olym-hurricane-ridge": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh:
      "停车场到观景处的铺装小路约 120 米，坡度 6–13%，轮椅要有人推；Big Meadow 铺装步道约 400 米、最大坡 9%，比较好走。山顶游客中心烧毁后只有临时厕所。",
    source: PHYS,
  },
  "olym-hurricane-hill": {
    kidsFromAge: 5,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh:
      "全程铺装但一路上坡，前 800 米坡度 5–9%，之后有 15–20% 的陡段，爬升约 200 米；官方说路沿着山边，有几段外侧落差很大。带小孩、推婴儿车或轮椅的走前一段看看群山就回头。",
    source: PHYS,
  },
  "olym-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
  },
  "olym-lake-crescent": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "101 号公路沿湖走，路边停车带就能看湖；湖很深、水终年冰冷，租划艇、下水都要穿救生衣，孩子别离开大人。",
  },
  "olym-marymere-falls": {
    kidsFromAge: 3,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "前段是平缓的林间土路，婴儿车能推一段；最后的小环线上下台阶多，要把婴儿车留在下面，背着孩子上观瀑台。",
  },
  "olym-mount-storm-king": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff", "scramble"],
    noteZh:
      "往返约 7 公里、爬升约 640 米，之字形陡坡加碎石；“End of maintained trail”牌子以上是要拉绳攀爬的岩脊，坠落风险高，一定在牌子处回头。带孩子、老人改走玛丽米尔瀑布。",
  },
  "olym-spruce-railroad": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    hazards: ["water"],
    noteZh:
      "官方说是铺装的 Olympic Discovery Trail 一段，坡缓，轮椅可以有人陪着走；魔鬼潘趣碗夏天常有人从岩石上跳水，湖水冰冷，孩子别跟着跳。",
    source: PHYS,
  },
  "olym-sol-duc-falls": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "林间土路、有树根，接近瀑布有几级台阶，越野型婴儿车能推大部分；看瀑布的木桥有栏杆，桥下岩缝很深，孩子别爬。",
  },
  "olym-sol-duc-hot-springs": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh:
      "官网说 4 岁以下只能下约 37°C、水深 15–20 厘米的小浅池和淡水泳池，中池、大池要 4 岁以上；大矿泉池和淡水泳池能上轮椅。热池水温高，老人泡一会儿就起来歇歇。",
    source: "https://www.olympicnationalparks.com/things-to-do/sol-duc-hot-springs-resort/mineral-hot-springs-pool-at-sol-duc-hot-springs-resort/",
  },
  "olym-rialto-beach": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["water"],
    noteZh:
      "停车场就在海滩边，坐轮椅能在停车场看海，官方说园内海滩都没有无障碍通道；往北到墙洞是约 5 公里往返的砾石沙滩，要按潮汐表去，涨潮时浪会卷动大漂流木，孩子别在木头上爬。",
    source: PHYS,
  },
  "olym-second-beach": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "约 1 公里林间土路，最后是陡坡和台阶下到沙滩，回程要爬上来；涨潮时浪会推动漂流木，孩子别在木头上爬，玩潮池要看好潮汐。",
  },
  "olym-cape-flattery": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh: "土路、木栈道和台阶下到海边，回程上坡；尽头的观景平台下面就是海蚀悬崖，平台外不少地方没有护栏，孩子要牵着。",
  },
  "olym-hall-of-mosses": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh:
      "压实碎石路，前约 120 米坡度在 5% 以内，之后有 7–25% 的陡段、大台阶和石头，轮椅走前一段就回头；游客中心旁 160 米的 Mini Rain Forest 小环线坡度在 5% 以内，最平缓。",
    source: PHYS,
  },
  "olym-spruce-nature-trail": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "压实碎石路，但官方说台阶多、有陡坡，最窄处约 60 厘米，婴儿车、轮椅都不好过；背着孩子走没问题。",
    source: PHYS,
  },
  "olym-hoh-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "有 5 个厢式车无障碍车位；坐轮椅想进雨林，走旁边坡度在 5% 以内的 Mini Rain Forest 小环线（约 160 米）。",
    source: PHYS,
  },
  "olym-ruby-beach": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["water"],
    noteZh:
      "停车场北头有无障碍观景点，坐轮椅在那里看海蚀柱；下到沙滩约 160 米压实碎石路，有的地方很陡，沙滩上堆满漂流木，浪大时孩子别在木头上爬。",
    source: PHYS,
  },
  "olym-tree-of-life": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "要走台阶下到沙滩；树已下沉、随时可能倒，崖壁也在塌，别让孩子钻到树根下或爬上去。",
  },
  "olym-maple-glade": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "约 800 米压实碎石路，坡度在 5% 以内（最大 7%），但树根、小桥会高出路面 5 厘米以上，还有至少一处约 10 厘米的台阶，轮椅要有人帮忙抬。",
    source: PHYS,
  },
  "olym-lake-quinault": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "南岸路边和老旅馆前就能看湖；旅馆前草坪是缓坡，轮椅在铺装处看就好。",
  },
  "olym-largest-sitka-spruce": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "从路边走几分钟平坦土路就到，有树根，婴儿车能推大半段；路边车位很少。",
  },
};
