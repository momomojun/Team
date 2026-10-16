import type { Suitability } from "../attractions/types";

// 北极之门 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：公园全是荒野，没有修过的步道、园内没有设施；
// Coldfoot 的北极跨部门游客中心有无障碍厕所，从无障碍车位到门口约 20 米是不平的碎石和水泥路，门口有约 2 厘米的门槛。
// Dalton 公路一线大多是路边看，按景点数据判断
const ACCESS = "https://www.nps.gov/gaar/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "gaar-yukon-river": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车过桥就能看，桥北停车场下车拍；桥上别停车，木桥面湿了很滑。",
  },
  "gaar-finger-mountain": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车区就能看到石柱，有厕所；约 800 米的解说步道是苔原上的土路，山脊风很大，给孩子多穿一件。",
  },
  "gaar-arctic-circle": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边休息区，停车就能看到北极圈木牌和观景平台。",
  },
  "gaar-arctic-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "有无障碍厕所；从无障碍车位到门口约 20 米是不平的碎石和水泥路，门口有一道小门槛，轮椅要稍微帮一下。门前碎石步道能推车。",
    source: ACCESS,
  },
  "gaar-wiseman": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "村里是砂石土路，能开车到村中心看老木屋；房子都是私人的，带孩子别进院子。",
  },
  "gaar-wiseman-hike": {
    kidsFromAge: 12,
    stroller: "no",
    wheelchair: "no",
    seniors: "no",
    hazards: ["wildlife", "remote", "water"],
    noteZh:
      "往返约 23 公里，后段没有步道，要在一墩一墩的草丘上越野、自己认路，还要过溪流；熊多、蚊子极多，没有信号，出事救援要很久。带小孩、体力一般的在 Wiseman 村里走走，或者坐小飞机从空中看公园。",
  },
  "gaar-sukakpak": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "路边停车就能看山，在车上也看得到；登顶没有步道、是陡碎石坡，带孩子在山脚走走就好。",
  },
  "gaar-atigun-pass": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    hazards: ["remote"],
    noteZh: "开车看，在车上就能看到 Dall 大角羊和山口；Coldfoot 以北 380 多公里没有加油、修车和医疗，6、7 月也可能下雪，带够吃喝、保暖衣物和备胎。",
  },
  "gaar-aurora": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "坐车到 Wiseman 的小木屋，屋里有炉子，可以在屋里等、出门看；9 月以后夜里在零度上下，冬天更冷，小孩、老人穿够、多进屋暖一暖。",
  },
  "gaar-gates-flight": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion", "remote"],
    noteZh: "坐小飞机 1–2 小时，山谷里气流颠簸，晕机的提前吃药；降落在湖边要从浮筒爬下飞机，岸边是苔原，行动不便的选只在空中看的 1 小时团。",
  },
  "gaar-arrigetch-flight": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion", "remote", "wildlife"],
    noteZh: "3 小时的小飞机，单程飞约 1 小时，降落在湖上待约 30 分钟；颠簸、离救援很远，湖边有棕熊。小孩、老人要坐得住，晕机的提前吃药。",
  },
  "gaar-fairbanks-flight": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["motion", "remote"],
    noteZh: "傍晚到半夜约 4.5–5 小时，都坐在小飞机上，中途在 Coldfoot 落地休息；订票时要报准确体重，随身只能带 2–4 公斤，晕机的提前吃药。",
  },
  "gaar-anaktuvuk-pass": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["remote", "motion"],
    noteZh: "坐定期小飞机来回，村里是砂石路，冬天极冷，离医院要坐飞机。NPS 没写村里护林站和博物馆的无障碍情况，坐轮椅的先问航空公司和护林站。",
  },
};
