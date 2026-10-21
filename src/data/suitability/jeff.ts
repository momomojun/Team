import type { Suitability } from "../attractions/types";

// 圣路易斯拱门 · 同行适合度。2026-10-20 按 NPS 无障碍页面和 gatewayarch.com 的电车页面整理：
// 博物馆、草地的铺装步道全无障碍、能免费借轮椅；拱门顶坐不了轮椅、至少要走 96 级台阶，电车舱里不许带轮椅和婴儿车；
// Old Courthouse 有电梯到二楼法庭。
const ACCESS = "https://www.nps.gov/jeff/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "jeff-tram": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "运营方写电车对行动不便的人“不完全无障碍”：全程至少要走 96 级台阶（一次最多 28 级），大部分时间站着，轮椅、助行器、婴儿车都不能带。五人一个的小车舱又挤又矮，幽闭恐惧的人慎重。2 岁以下免费，但要一直抱着；走不了台阶的老人在下面的博物馆和草地看。",
    source: "https://www.gatewayarch.com/gateway-arch-national-park/tram-ride-to-the-top/",
  },
  "jeff-museum": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说展厅有多种无障碍设计（触摸展品、盲文说明、助听设备），能免费借普通和加宽的轮椅（先到先得，押州身份证件）。",
    source: ACCESS,
  },
  "jeff-arch-grounds": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说穿过草地的铺装步道全部无障碍，从街面有坡道上来；倒影池边没有栏杆的地方看好小孩。夏天草地没什么遮阴。",
    source: ACCESS,
  },
  "jeff-old-courthouse": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "官方说有电梯到二楼的法庭，东边的法庭无障碍，西边的法庭门口有一级台阶。",
    source: ACCESS,
  },
  "jeff-riverboat": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["water"],
    noteZh: "婴儿免费但也要拿票；码头在河边鹅卵石的老码头上，坡很斜（官方说码头停车不无障碍），坐轮椅的订票前问清楚上船的方式。船上看好小孩别靠栏杆。",
    source: ACCESS,
  },
  "jeff-riverfront": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说从 Leonor K. Sullivan 大道有两条无障碍坡道上到拱门草地（另有约 65 级的大台阶）；河边步道和 Eads 大桥人行道都是平路，桥上风大。",
    source: ACCESS,
  },
};
