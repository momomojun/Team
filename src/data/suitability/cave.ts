import type { Suitability } from "../attractions/types";

// 卡尔斯巴德洞窟 · 同行适合度。2026-10-16 按 NPS 无障碍页面和导览页面整理：坐电梯下去的 Big Room 是洞里唯一能推轮椅的路线，
// 但地面湿滑不平、不符合 ADA，官方说要有人协助，只能走标出来的轮椅路段；婴儿车除非孩子行动不便，所有洞里都不许带，
// 天然入口步道坡度 15–20%。护林员洞穴导览 6 岁以下不能参加，下层洞穴 12 岁以上，16 岁以下要大人陪
const ACCESS = "https://www.nps.gov/cave/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "cave-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "有无障碍车位，停车场到大门、放映厅、商店、洗手间和餐厅都有坡道，大门是自动门；坐电梯就能下到 Big Room。",
    source: ACCESS,
  },
  "cave-natural-entrance": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "铺装但很陡（坡度 15–20%），之字形下降约 230 米，地面潮湿，膝盖受力大；心脏和呼吸不好的不建议走。婴儿车不许带，婴儿用背带。老人小孩直接坐电梯下去逛 Big Room，一样能看到最精彩的部分。",
    source: ACCESS,
  },
  "cave-big-room": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh:
      "坐电梯下去，是洞里唯一能推轮椅的路线，但地面湿滑不平，官方说要有人协助，只能走标出来的轮椅路段（游客中心有地图）；婴儿车不许带进洞，婴儿用背带。洞里常年约 13°C，带件薄外套。",
    source: ACCESS,
  },
  "cave-kings-palace": {
    kidsFromAge: 6,
    minAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh: "官方说 6 岁以下不能参加护林员洞穴导览，16 岁以下要大人陪；约 1.6 公里，有台阶，最后一段上坡很陡。轮椅、婴儿车、助行器都不许带，医疗需要可以拄拐杖。",
    source: "https://www.nps.gov/cave/planyourvisit/tour_schedule.htm",
  },
  "cave-lower-cave": {
    kidsFromAge: 12,
    minAge: 12,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble"],
    noteZh:
      "12 岁以上才能报，16 岁以下要大人陪；要爬下约 18 米的梯子、抓着绳子倒退下湿滑的斜坡、钻窄缝，官方说怕高、夜盲、膝盖不好的不适合。必须穿抓地好的登山鞋。",
    source: "https://www.nps.gov/cave/planyourvisit/lower_cave.htm",
  },
  "cave-bat-flight": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "有专门的残障停车区，露天剧场最上一排留了轮椅位，旁边有家庭无障碍厕所；剧场里所有电子设备都不能拿出来，小孩要能安静坐一会儿。",
    source: ACCESS,
  },
  "cave-desert-nature-trail": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "官方说只有一段能推轮椅：从东停车场出发约 300 米到有遮阳亭的观景点，后面是土路。",
    source: ACCESS,
  },
  "cave-walnut-canyon-overlook": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "约 165 米的铺装小路走到崖边，官方没说能不能推轮椅，坐轮椅最好有人陪；崖边孩子要牵着。",
  },
  "cave-walnut-canyon-drive": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "坐在车里看风景的砂石单行道，房车和拖车不能开。",
    source: ACCESS,
  },
  "cave-rattlesnake-springs": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "野餐区有无障碍厕所和无障碍野餐桌，树下就能观鸟；泉里不能游泳。",
    source: ACCESS,
  },
  "cave-slaughter-canyon-cave": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "约 0.8 公里陡峭碎石小路爬升约 150 米，夏天很热、沿途没有水，下山容易滑；洞里的导览 2026 年没开，只能走到洞口回头。",
  },
};
