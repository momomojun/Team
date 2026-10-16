import type { Suitability } from "../attractions/types";

// 波浪谷 · 同行适合度。2026-10-16 按 BLM Coyote Buttes North 页面整理：BLM 说 The Wave 往返约 10 公里、体力要求高，
// 没有步道和路标，要自己找路，沿途没有饮用水，5–9 月酷热无遮阴已经出过多起死亡事故。几处步道口都要开 House Rock Valley Road 等土路，
// 雨后可能过不去；狭缝峡谷遇雨有山洪
const BLM = "https://www.blm.gov/visit/wave-coyote-buttes-north";

export const suitability: Record<string, Suitability> = {
  "wave-the-wave": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "remote"],
    noteZh:
      "往返约 10 公里，翻沙丘和砂岩坡，没有路标、没有遮阴和水，BLM 要求每人每天至少带约 3.8 升水；有老人、年轻人在夏天中暑死在这条路上。带孩子、体力一般的老人只在 3–5 月、9–11 月去，早上出发，走不动就回头。",
    source: BLM,
  },
  "wave-wire-pass": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["flashFlood", "scramble"],
    noteZh:
      "前段是平的沙石河床，窄缝里有一处两三米高的岩石落差要手脚并用爬下去，旁边有绕行小路；狭缝里遇上山洪无处可躲，下雨或有预警别进。带小孩、老人走到窄缝入口看看就回头。",
  },
  "wave-toadstools": {
    kidsFromAge: 2,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["heat"],
    noteZh: "约 2.4 公里往返，大部分是平缓的沙地河床，最后爬一小段坡到蘑菇石；沙地推不了婴儿车，没有遮阴，夏天避开中午。",
  },
  "wave-white-pocket": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["remote", "heat"],
    noteZh:
      "四驱团全天 7–8 小时，二十多公里深沙土路非常颠，现场和路上都没有信号、水和厕所；到了以后在起伏的砂岩上随意走，没有护栏。腰背不好的老人、小小孩要掂量这段车程。",
  },
};
