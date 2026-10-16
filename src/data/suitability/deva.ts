import type { Suitability } from "../attractions/types";

// 死亡谷 · 同行适合度。2026-10-16 按 NPS 的观景点与步道无障碍页面、游客中心设施页面整理：官方说园内大多是土路、碎石、沙地，
// 步道基本不维护；Dante's View、Father Crowley、沙丘、Ubehebe、Artists Drive、魔鬼高尔夫球场在车上就能看，
// Badwater 有坡道和栈道到盐池边，Harmony Borax 部分铺装、有人协助能走，盐溪栈道 2026 年 2 月重开，官方标为 ADA 无障碍。
// 5–9 月低海拔白天常超过 46°C，带老人小孩只在清晨、傍晚下车走
const ACCESS = "https://www.nps.gov/deva/planyourvisit/sightseeing-and-hiking-accessibility.htm";
const FACILITY = "https://www.nps.gov/deva/planyourvisit/facility-accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "deva-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "停车场到大门都有缘石坡道，有无障碍洗手间和家庭洗手间；门口的大温度计在铺装地上，轮椅能到。",
    source: FACILITY,
  },
  "deva-zabriskie": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "停车场到观景台是铺装路，但坡很陡，官方写明有 2 个无障碍车位；轮椅要有人推，老人慢慢走几分钟就到。",
    source: ACCESS,
  },
  "deva-golden-canyon": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "碎石、细沙和天然石阶，后段有陡坡，全程没有遮阴；带孩子、老人在凉季上午走，进峡谷 1 公里左右看够金色岩壁就回头，不用走到 Red Cathedral。",
    source: ACCESS,
  },
  "deva-badwater": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["heat"],
    noteZh:
      "有坡道和栈道一直到盐池边，栈道尽头还有坡道下到盐滩，但盐滩上有大坑，轮椅在栈道上看就好；夏天地面极烫，只在清晨、傍晚去，婴儿车在盐滩上推不远。",
    source: ACCESS,
  },
  "deva-devils-golf-course": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "砾石小停车场，没有无障碍车位，但在车上就能看；盐块像刀刃一样锋利，孩子别在上面跑，摔一跤就是划伤。",
    source: ACCESS,
  },
  "deva-artists-palette": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车沿单行道看，在车上就能看到彩色山坡；观景点旁两片砾石空地不维护，婴儿车只能推一小段。",
    source: ACCESS,
  },
  "deva-dantes-view": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "观景区是铺装的，有 2 个无障碍车位，在车上也能看；附近的旱厕不是无障碍的。",
    source: ACCESS,
  },
  "deva-mesquite-dunes": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["heat"],
    noteZh:
      "在停车场、车上就能看到沙丘，有无障碍车位和旱厕；去沙丘的路是碎石，沙丘上是深沙，婴儿车、轮椅都推不动。夏天沙面烫脚，孩子玩沙选清晨或傍晚，老人在沙里走很费力，爬第一道沙脊就够了。",
    source: ACCESS,
  },
  "deva-ubehebe": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh:
      "停车场就在坑边，在车上就能看；坑沿是松散的火山渣，风大，孩子要牵着、别靠近边缘。下到坑底再爬回来很累，带老人小孩在停车场旁看就好。",
    source: ACCESS,
  },
  "deva-racetrack": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["remote", "heat"],
    noteZh:
      "单程约 42 公里搓板砾石路、往返要大半天，一路颠，没有信号、没有水和厕所，爆胎了救援要很久；干湖床平坦，干的时候婴儿车能推一段。带婴儿、体力一般的老人不建议专门跑一趟。",
  },
  "deva-mosaic-canyon": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "scramble"],
    noteZh:
      "前 800 米是光滑的大理石岩壁，脚下滑；约 1.6 公里后有干瀑布要手脚并用爬。带孩子、老人只走最精彩的前 800 米就回头，夏天别中午进。",
    source: ACCESS,
  },
  "deva-harmony-borax": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "小环线部分铺装，夹着小段沙地、碎石和破损路面，坡度中等，官方说有些地方要有人协助；有 2 个无障碍车位，路边有两处歇脚点，没有厕所。",
    source: ACCESS,
  },
  "deva-salt-creek": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "2026 年 2 月重开的木栈道环线，官方标为 ADA 无障碍，轮椅、婴儿车能绕一圈；夏天上午 10 点后太晒，不建议走。",
    source: "https://www.nps.gov/places/salt-creek.htm",
  },
  "deva-natural-bridge": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["heat"],
    noteZh: "碎石上坡，开头一段较陡，老人可能要人扶一把；走 800 米看到石桥就可以回头，夏天别中午走。",
    source: ACCESS,
  },
  "deva-darwin-falls": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "water"],
    noteZh:
      "进山路冲毁后要从 190 号公路走进去，往返约 11 公里，前段没有遮阴；峡谷里有烂泥、芦苇、要过几次溪、还有小段攀爬。带孩子、老人只在凉季去，体力一般的不建议。",
    source: ACCESS,
  },
  "deva-father-crowley": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "观景区铺装平整，有 2 个无障碍车位，在车上也能看；想看军机要走到更远的崖边，那段是土路、没护栏，孩子别去。",
    source: ACCESS,
  },
};
