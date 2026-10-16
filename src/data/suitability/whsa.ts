import type { Suitability } from "../attractions/types";

// 白沙 · 同行适合度。2026-10-16 按 NPS 无障碍页面、行动不便游客页面和月光徒步、卢塞罗湖导览页面整理：
// 官方说沙丘间木栈道是园内唯一的无障碍步道，风沙大时也会推不过去；游客中心、沙丘大道沿线的旱厕和新建的野餐遮阳棚是无障碍的。
// 沙丘里没有树荫和水，夏天中暑出过人命；两个要买票的护林员活动官方都不建议带年幼的孩子和婴儿
const ACCESS = "https://www.nps.gov/whsa/planyourvisit/physical-mobility.htm";

export const suitability: Record<string, Suitability> = {
  "whsa-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "两个停车场都能进游客中心，男女洗手间各有一个无障碍隔间，门廊讲解和太阳望远镜活动轮椅也能参加。",
    source: ACCESS,
  },
  "whsa-dune-life-trail": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "开头约 270 米是平地，之后要爬上约 9 米高的软沙丘，NPS 评为中等；几乎没有遮阴，夏天清早或傍晚走。带老人、婴儿车走平地那段看看解说牌就回头。",
  },
  "whsa-playa-trail": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "平坦的短步道，但没有树荫和厕所，夏天中午别去。",
  },
  "whsa-interdune-boardwalk": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说是园内唯一的无障碍步道，轮椅、婴儿车都能推；风大时沙子会盖住栈道推不过去，先打 575-479-6124 问。2024 年起这一段划进安全走廊，木栈道 2026 年仍关着。",
    source: "https://www.nps.gov/whsa/planyourvisit/accessibility.htm",
  },
  "whsa-dunes-drive": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "在车里就能看沙丘；前半段柏油、后半段压实的石膏沙路，步道口和野餐区有无障碍旱厕，Roadrunner 等野餐区有新建的无障碍遮阳棚。",
    source: ACCESS,
  },
  "whsa-sledding": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "partial",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "每滑一次都要爬回沙坡顶，很费劲；5–9 岁的孩子最容易受伤，选坡底平缓的沙丘、脚朝下滑。老人和坐轮椅的可以在 Roadrunner 野餐区的无障碍遮阳棚下看孩子玩，夏天中午别来。",
  },
  "whsa-backcountry-loop": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "约 3.2 公里，一路翻 12–15 米高的软沙丘，没有树荫和水，每人至少带 4 升水；风沙大、看不到下一根标杆时原路返回。",
  },
  "whsa-alkali-flat": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh:
      "往返约 8 公里，在 18 米高的沙丘间一直上上下下，没有树荫、水和厕所；2015 年有一家人正午出发，父母都中暑身亡。NPS 说 30°C 以上别出发，带小孩、体力一般的老人走开头一小段，看到沙丘海就回头。",
  },
  "whsa-sunset-stroll": {
    kidsFromAge: 0,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    noteZh: "在软沙上慢慢走约 800 米，推不了婴儿车和轮椅；高温警报时取消，日落后气温掉得快，带外套。",
  },
  "whsa-moonlight-hike": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    noteZh:
      "要在黑暗里上下陡沙丘走约 1.6 公里、全程不开手电，官方说不建议带年幼的孩子和婴儿，行动不便、夜里看不清路的也别报；孩子要一直跟在大人身边。小孩可以改参加日落漫步。",
    source: "https://www.nps.gov/whsa/planyourvisit/moonlight-hike.htm",
  },
  "whsa-lake-lucero": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["remote"],
    noteZh:
      "往返约 2.4 公里，沿没有维护的干沟走松软不平的土路下到湖床，回程是缓上坡；在导弹靶场里不能中途离队，官方说必须能走完全程，不建议带年幼的孩子和婴儿。带小孩、老人可以改走干湖步道。",
    source: "https://www.nps.gov/whsa/planyourvisit/lake-lucero-tour.htm",
  },
};
