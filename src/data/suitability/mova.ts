import type { Suitability } from "../attractions/types";

// 纪念碑谷 · 同行适合度。2026-10-16 整理：纳瓦霍部落公园官网和授权导览公司都没有公布无障碍信息，以下按景点资料和常识判断，
// 没有附来源。游客中心观景台和谷地环线在车上、停车场边就能看，谷底全是沙土路，坐车很颠、扬沙；野猫步道是园内唯一能自己走的步道
export const suitability: Record<string, Suitability> = {
  "mova-the-view": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游客中心前的观景台和停车场边就能正对手套岩，在车上也看得到；看日出日落时露台人多，轮椅早点占位置。",
  },
  "mova-valley-drive": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "坐在车里就能看各个观景点，观景点下车是沙土地，婴儿车推不远；刚下坡一段坑多沙深，腰背不好的老人坐车会难受，慢慢开。",
  },
  "mova-john-fords-point": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh: "停车处到岩台是沙地和岩面，轮椅在停车处看就好；伸出去的岩台边上没有护栏，孩子别跑到边上。",
  },
  "mova-wildcat-trail": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "约 5 公里，很多段是软沙，几乎没有遮阴，下到谷底容易、回程是一段上坡；带孩子、老人清晨走，体力一般的下到谷底看看西手套岩就原路回来。",
  },
  "mova-guided-tour": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "坐敞篷车，一路颠簸、扬沙，下车点都是沙地；带婴儿准备头巾和背带，要爬上车斗的轮椅用户提前问导览公司能不能安排。",
  },
  "mova-forrest-gump-point": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "在车上、路肩就能看；这是正常通车的公路，车速很快，孩子别跑到路中间拍照。",
  },
};
