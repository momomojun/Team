import type { Suitability } from "../attractions/types";

// 羚羊峡谷 · 同行适合度。2026-10-16 按纳瓦霍授权导览公司（Antelope Canyon Navajo Tours、Ken's Tours、Taadidiin Tours、
// Waterhole Canyon Experience）的 FAQ 和 Antelope Point Marina 游船页面整理：几条狭缝峡谷都只能跟团进，轮椅都去不了，
// 沙地推不了婴儿车，小孩要用背带；上羚羊谷底平、没有梯子，下羚羊要上下好几段陡钢梯，水洞峡谷 8 岁以上。
// 7–9 月雨季上游下雨也会有山洪，导览公司会临时取消
const UPPER = "https://www.antelopecanyon.com/faq/";

export const suitability: Record<string, Suitability> = {
  "ante-upper-antelope-canyon": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["flashFlood"],
    noteZh:
      "导览公司说各年龄的孩子都能去，软沙里推不了婴儿车，用背带或背架；峡谷里没有梯子，来回约 1.2 公里，出峡谷后有一段台阶和上坡，做过膝、髋手术的会吃力。官方说不接待轮椅。去峡谷口的四驱车很颠，孕妇可以提前要驾驶室座位。",
    source: UPPER,
  },
  "ante-lower-antelope-canyon": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble", "flashFlood"],
    noteZh:
      "Ken's 说普通团各年龄都能参加，但进出要上下好几段陡钢梯（有扶手），走不了的小孩要用胸前或背后背带抱着；膝盖不好、怕爬梯的老人改去谷底平坦的上羚羊。轮椅、婴儿车都进不去。",
    source: "https://lowerantelope.com/faq",
  },
  "ante-antelope-canyon-x": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["flashFlood"],
    noteZh:
      "进出峡谷都要走约 60 米长的枕木台阶，回程是上坡；导览公司建议能自己正常行走的人参加，轮椅、助行器去不了。体力一般的老人可以只在峡谷口看看，或者改去上羚羊。",
    source: "https://www.antelopecanyon-x.com/faq/",
  },
  "ante-waterholes-canyon": {
    kidsFromAge: 8,
    minAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble", "flashFlood"],
    noteZh: "官方写明徒步团 8 岁以上，摄影团 13 岁以上；路线里有几段短梯子和要侧身挤过的窄处，比上羚羊更需要手脚并用。带小小孩、腿脚不便的老人去上羚羊。",
    source: "https://www.waterholecanyonexperience.com/",
  },
  "ante-antelope-canyon-kayak": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water", "flashFlood", "heat"],
    noteZh:
      "单程约 4 公里湖上划船，再在沙底狭缝里走 1.5–3 公里，前后四个多小时，下午常起风，快艇浪大；湖水冷，翻船后要能自己爬回船上。小孩坐双人艇跟大人一条船，体力一般的老人改坐 1 小时的羚羊峡谷游船。",
  },
  "ante-antelope-canyon-boat-tour": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "码头官网标为无障碍，从停车场到湖边坐码头免费接驳车，全程坐在船上不用走；4 岁以下不在票价表里，订票时问清。婴儿车上船后要收起来。",
    source: "https://antelopepointlakepowell.com/boat-tours/",
  },
};
