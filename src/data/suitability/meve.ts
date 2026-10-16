import type { Suitability } from "../attractions/types";

// 梅萨维德 · 同行适合度。2026-10-16 按 NPS 无障碍页面、行动不便游客页面和崖居导览页面整理：游客中心完全无障碍，
// Mesa Top Loop 是全园最好走的一片，铺装小路，多数观景点“有人协助能走”；太阳神庙观景台、云杉树屋的有顶阳台写明无障碍。
// 崖居导览都要爬梯子，官方要求孩子能自己爬，婴儿背在背带里；全园海拔 2,100–2,600 米
const ACCESS = "https://www.nps.gov/meve/planyourvisit/accessibility.htm";
const MOBILITY = "https://www.nps.gov/meve/planyourvisit/physical-mobility.htm";
const TOURS = "https://www.nps.gov/meve/planyourvisit/cliff_dwelling_tours.htm";

export const suitability: Record<string, Suitability> = {
  "meve-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方写明完全无障碍：无障碍停车位、铺装步道、展品和洗手间都能到。",
    source: MOBILITY,
  },
  "meve-point-lookout": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff"],
    noteZh: "之字形陡路往上爬约 120 米，海拔约 2,600 米、遮阴少；山顶台地边缘是悬崖，孩子别跑到崖边。带老人想看山谷可以去路边的 Montezuma Valley、Mancos Valley 观景台。",
  },
  "meve-night-sky": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "Morefield 营地官方写的是“有人协助能走”，露天剧场能不能推轮椅进去没写；路边观景台停车就能看星星。夏天夜里也冷，带厚外套。",
  },
  "meve-park-point": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场、厕所和野餐桌都是无障碍的；上山顶瞭望台是一段很陡的铺装坡，轮椅在停车场看看远山就好。",
    source: ACCESS,
  },
  "meve-far-view-sites": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "串起遗址的约 1.2 公里土路有车辙、下雨后泥泞，官方说轮椅有人协助能走；其中两处遗址在车里就能看到。",
    source: MOBILITY,
  },
  "meve-museum": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "馆里各处有坡道，可以借轮椅。",
    source: ACCESS,
  },
  "meve-spruce-tree-house": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说在总护林员办公室后面的有顶阳台看最方便，轮椅能到；离崖居更近的下层观景台是一段很陡的铺装小路，冬天常结冰。",
    source: ACCESS,
  },
  "meve-petroglyph-point": {
    kidsFromAge: 10,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff", "scramble"],
    noteZh:
      "官方定为难度很高的步道：沿崖壁下的窄路碎石多、有陡崖，最后要手脚并用爬上约 30 米的石阶；恐高的、带小孩的别走。想看崖居可以在博物馆后面的阳台看云杉树屋。",
  },
  "meve-pithouses": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "Mesa Top Loop 是全园最好走的一片，停车场到遗址顶棚都是几分钟的铺装小路；官方说这一带多数观景点轮椅有人协助能走，个别地方有坡。",
    source: MOBILITY,
  },
  "meve-square-tower-house": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh:
      "Mesa Top Loop 路边的铺装观景台，轮椅有人协助能到。下到崖居的护林员徒步团是另一回事：要攀石、爬梯子、走约 10 米长的崖边窄道，不适合小孩和体力一般的人。",
    source: MOBILITY,
  },
  "meve-sun-point-view": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "assisted",
    seniors: "ok",
    noteZh: "Mesa Top Loop 路边的铺装观景台，官方说这一带多数观景点轮椅有人协助能到。",
    source: MOBILITY,
  },
  "meve-sun-temple": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方写明有无障碍的铺装观景台，坐轮椅也能隔着峡谷看悬崖宫殿全貌，是不能下崖居的人最好的位置。",
    source: ACCESS,
  },
  "meve-cliff-palace": {
    kidsFromAge: 4,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble", "dropoff"],
    noteZh:
      "要下石阶、爬 4 段梯子，路边有陡坎，海拔约 2,100–2,300 米；官方要求孩子能自己爬梯子，婴儿要背在背带里、大人背着也得能爬，心肺不好的先掂量。不下去的可以在太阳神庙旁的无障碍观景台看全貌。",
    source: TOURS,
  },
  "meve-cliff-palace-overlook": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "官方说到观景台是一段铺装小路加一段楼梯，轮椅过不去；坐轮椅改去太阳神庙旁的无障碍观景台隔着峡谷看。",
    source: ACCESS,
  },
  "meve-balcony-house": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble", "dropoff"],
    noteZh:
      "全园最费劲的导览：爬约 10 米高的木梯、四肢着地钻约 45 厘米宽的岩缝，再踩石阶和梯子爬出约 20 米高的崖壁；官方要求孩子能自己爬梯子，恐高、幽闭恐惧、膝盖不好的别报。带小孩、老人改报悬崖宫殿，或走苏打峡谷观景步道隔着峡谷看。",
    source: TOURS,
  },
  "meve-soda-canyon-overlook": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh: "林间土路几乎是平的，但三个观景点都在峡谷崖边的岩石上，孩子要牵着；夏天很晒，带水。",
  },
  "meve-long-house": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["scramble", "heat"],
    noteZh:
      "连走路全程约 3.6 公里、几乎没有树荫，导览里要下陡阶梯、爬两段约 4.5 米的梯子，官方说这是费力的导览。坐轮椅的可以走铺装的 Long House Loop 到长屋观景台（往返约 4.8 公里，有人协助）。",
    source: TOURS,
  },
  "meve-step-house": {
    kidsFromAge: 3,
    stroller: "partial",
    wheelchair: "assisted",
    seniors: "caution",
    noteZh:
      "往返约 1.6 公里、高差约 50 米，进去那条路台阶多；官方说轮椅只能走出口那条路进出，坡陡、不合法定坡度，要有人协助，最好用宽轮圈。老人回程上坡慢慢走。",
    source: ACCESS,
  },
};
