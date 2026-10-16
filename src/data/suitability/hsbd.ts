import type { Suitability } from "../attractions/types";

// 马蹄湾 · 同行适合度。2026-10-16 按 NPS 格伦峡谷国家休闲区无障碍页面和 Wilderness River Adventures 漂流页面整理：
// 马蹄湾的新步道按 ABA 无障碍标准修到崖边，崖边有一小块带护栏的无障碍观景台，路上有两处遮阳棚；
// 游船有无障碍的班次，码头、上下船由工作人员协助。大坝下放的河水常年冰凉，崖顶夏天中午很晒
const ACCESS = "https://www.nps.gov/glca/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "hsbd-horseshoe-bend": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["dropoff", "heat"],
    noteZh:
      "官方说步道符合 ABA 无障碍标准，压实的路面有缓坡，回程上坡推轮椅可能要人帮；只有观景台一小段有护栏，其余约 300 米高的崖边都没有，孩子一定要牵着。路上只有两处遮阳棚，夏天别中午去。",
    source: ACCESS,
  },
  "hsbd-glen-canyon-dam-overlook": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh: "往返约 290 米，但全是陡而不平的岩石台阶，只有部分扶手，崖边落差很大；坐轮椅、推婴儿车的去 Carl Hayden 游客中心隔着落地窗看大坝。",
  },
  "hsbd-carl-hayden-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "有能摸的展品和带字幕的介绍片，大坝资料有盲文版；隔着落地窗就能看大坝和钢拱桥。",
    source: ACCESS,
  },
  "hsbd-wahweap-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边观景停车场，在停车场边、车上就能看湖；往岩石上走地面不平，边上没有护栏。",
  },
  "hsbd-horseshoe-bend-kayak": {
    kidsFromAge: 8,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water", "remote"],
    noteZh:
      "平水、没有急流，但要自己划约 16 公里、5–6 小时，峡谷里阵风大，河水夏天也很冰，全程要穿救生衣，谷里没有信号；小孩坐双人艇跟大人一条船。想轻松看谷底，老人和小小孩改坐格伦峡谷半日漂流。",
  },
  "hsbd-glen-canyon-float": {
    kidsFromAge: 4,
    minAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["water"],
    noteZh:
      "官方写明 4 岁以上，全程平水、坐带马达的大橡皮艇，不用自己划；连大巴约 5 小时，中途在岩画海滩上岸要走一段沙地。河水冰凉，孩子下水玩要大人看着。",
    source: "https://www.lakepowell.com/things-to-do/horseshoe-bend-rafting-trip",
  },
  "hsbd-glen-canyon-dam-cruise": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游船能坐轮椅，官方说上下码头、上船有工作人员协助；约 90 分钟全程坐着，婴儿车上船要收起来。",
    source: ACCESS,
  },
};
