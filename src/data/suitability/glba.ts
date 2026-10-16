import type { Suitability } from "../attractions/types";

// 冰川湾 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：Glacier Bay Lodge 和二楼游客中心有电梯、坡道，所有人都能去；
// 森林步道只有到 Blackwater 池塘的半英里木栈道算无障碍，特林吉特步道是平的碎石路；Bartlett Cove 的其他步道没铺装，有树根石头。
// 皮划艇按 Glacier Bay Sea Kayaks 官网（10 岁以上、要会游泳），游船按 Glacier Bay Lodge & Tours 官网
const ACCESS = "https://www.nps.gov/glba/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "glba-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "游客中心在酒店二楼，有电梯；酒店门口是坡道，院子里是碎石和木栈道。",
    source: ACCESS,
  },
  "glba-day-boat": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["motion", "remote"],
    noteZh:
      "约 8 小时，一早 6:50 登船；船舱有暖气、能坐着看，湾里风浪不大，但甲板很冷。码头坡道随潮水变，低潮时坡度接近 18%，坐轮椅的订票时问清楚上船的办法；湾里没有信号，出了事要等船回来。",
    source: ACCESS,
  },
  "glba-forest-trail": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "酒店到 Blackwater 池塘观景台的半英里木栈道无障碍，推车、轮椅能到池塘边；后半圈沿海滩回来是土路和树根。附近有熊，出声走。",
    source: ACCESS,
  },
  "glba-tribal-house": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "从码头停车场到部落屋门口是平的碎石路，官方说多数新式轮椅能走。",
    source: ACCESS,
  },
  "glba-bartlett-river": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["wildlife"],
    noteZh: "往返约 6.4 公里、4–5 小时，树根石头多、雨后泥泞；鲑鱼季河口熊多，带熊喷雾、结伴出声。带小孩、老人走一小段林间路，或者改走森林步道。",
  },
  "glba-shore-walk": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "海滩是石头和泥沙，推车、轮椅走不了，码头上有一段平的铺装路通到观景平台；潮差能到 7 米，涨潮很快，带孩子看潮池前先看好潮汐表。",
    source: ACCESS,
  },
  "glba-kayak": {
    kidsFromAge: 10,
    minAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["water"],
    noteZh: "公司要求 10 岁以上、所有人都会游泳，10–12 岁的要订家庭定制团、大人得能主要负责划；海水只有几度。体力一般的可以坐看鲸船或游船。",
    source: "https://glacierbayseakayaks.com/day-trips/one-day-kayak-adventure/",
  },
  "glba-flightseeing": {
    kidsFromAge: 2,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion", "remote"],
    noteZh: "小飞机飞 1–2 小时，山区气流颠簸，容易晕机的提前吃药；上下飞机要爬，行动不便的先问航空公司。",
  },
  "glba-whale-watching": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion"],
    noteZh: "约 3.5 小时，Icy Strait 风浪比湾里大，晕船的提前吃药；船小，坐轮椅的订之前问船公司。",
  },
  "glba-nagoonberry-loop": {
    kidsFromAge: 3,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "约 3.5 公里的平坦环线，林子和草甸里是土路，推车能走一段；草甸边常有黑熊、驼鹿，出声走。",
  },
};
