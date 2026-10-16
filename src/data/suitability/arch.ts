import type { Suitability } from "../attractions/types";

// 拱门 · 同行适合度。2026-10-16 按 NPS 行动不便游客页面（逐条列了步道路面、坡度、宽度）和火焰炉徒步页面整理：
// 园内没有一条步道官方写明轮椅无障碍，路面比较硬、坡度小的是精致拱门下观景点、双拱门，窗户区开头约 90 米没有障碍；
// 园内厕所都是无障碍的。大部分步道是没有遮阴的光滑岩坡和沙地，夏天中午很晒，园内只有游客中心和魔鬼花园能装水
const ACCESS = "https://www.nps.gov/arch/planyourvisit/physical-mobility.htm";

export const suitability: Record<string, Suitability> = {
  "arch-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "铺装路到门口、按钮自动门，展览和服务台轮椅能到，有无障碍洗手间和饮水机，室内和露台都有长椅。",
    source: ACCESS,
  },
  "arch-park-avenue": {
    kidsFromAge: 4,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "caution",
    noteZh:
      "停车场边的观景台就能看到“大街”；下到谷底要走一长段石阶，谷里是岩面和沙地，有几处岩坎。老人可以只下到谷底走一段，或者让人开车去北头 Courthouse Towers 接，只走下坡。",
    source: ACCESS,
  },
  "arch-la-sal-viewpoint": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边观景停车场，在车上、停车场边就能看；往外走到岩石台地上地面不平，轮椅、婴儿车别过去。",
  },
  "arch-balanced-rock": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "开头一段铺装，后面是岩面和石阶，最陡处约 23%；轮椅、婴儿车推到铺装段尽头就能看清整块平衡石。",
    source: ACCESS,
  },
  "arch-windows": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh:
      "开头约 90 米是平整硬地面、没有障碍，后面是岩面和石阶，最陡约 38%；轮椅在开头一段就能看到北窗、南窗。南窗后面的原始步道有岩坎、很陡，带老人小孩原路回来。",
    source: ACCESS,
  },
  "arch-double-arch": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "路面较硬、没有台阶，最陡约 14%，快到拱脚有一段沙地，轮椅有人推能走到附近；孩子爬拱下的岩石时下来比上去难，大人要跟着。",
    source: ACCESS,
  },
  "arch-delicate-arch": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "dropoff"],
    noteZh:
      "一路是没有遮阴的光滑岩坡，持续上坡，最后约 180 米是一侧落差很大的窄岩架，拱门所在的岩碗边也没有护栏；带孩子过岩架要牵着走里侧，体力一般的可以去精致拱门观景点远看。",
    source: ACCESS,
  },
  "arch-delicate-arch-viewpoint": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "下观景点路面硬、坡度 8% 以下、没有障碍，轮椅有人推能到；上观景点要爬石阶和陡坡，约 800 米往返，老人小孩量力而行。",
    source: ACCESS,
  },
  "arch-panorama-point": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场边就能看星空，野餐区有部分铺装；夜里别离开停车场乱走，用红光手电照脚下。",
    source: ACCESS,
  },
  "arch-fiery-furnace": {
    kidsFromAge: 10,
    minAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble", "dropoff"],
    noteZh:
      "官方说 5 岁以下不能进，12 岁以下要有大人陪；要在悬空的窄岩架上走、跳过岩缝、挤进窄缝再撑着爬上去。小孩、体力一般的老人在停车场边的观景点看就好，不用许可证。",
    source: "https://www.nps.gov/arch/planyourvisit/fiery-furnace-hike.htm",
  },
  "arch-sand-dune-arch": {
    kidsFromAge: 2,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "全是深沙，岩鳍间的窄道还有块大石头挡着，婴儿车推不进去；别让孩子爬到拱门上往下跳。",
    source: ACCESS,
  },
  "arch-broken-arch": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "去拱门的一段是平缓的沙地和岩面，绕环线回来那段有岩坎、大石头和台阶，要手脚并用；带孩子、老人走到拱门就原路回来，往返约 1.9 公里。",
    source: ACCESS,
  },
  "arch-skyline-arch": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "路边就能远看；走到拱下是岩面和沙地，有石阶，轮椅、婴儿车在路边看就好。",
    source: ACCESS,
  },
  "arch-landscape-arch": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "前段铺装，后面是压实的砂土和岩面，最陡约 30%，快到观景点有石阶；婴儿车大多能推到，轮椅推到铺装段尽头为止。",
    source: ACCESS,
  },
  "arch-double-o-arch": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff", "scramble", "heat"],
    noteZh:
      "过了风景拱门要爬上窄岩鳍的脊背走，两侧是陡坡，有几处要手脚并用；恐高的、体力一般的和小孩走到风景拱门就回头。",
    source: ACCESS,
  },
  "arch-devils-garden-loop": {
    kidsFromAge: 12,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff", "scramble", "heat"],
    noteZh:
      "约 12.7 公里，原始步道段要爬陡岩坡、走窄岩架、穿深沙沟，标记少要自己找路，几乎没有遮阴；不适合小孩，体力一般的只走到风景拱门。",
    source: ACCESS,
  },
  "arch-tower-arch": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "一开始就是很陡的岩壁，中段有岩坎和一座大沙丘，在沙里爬坡很累；要开 13 公里土路进去，没有信号、几乎没有遮阴。带老人小孩不建议专门去。",
    source: ACCESS,
  },
};
