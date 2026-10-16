import type { Suitability } from "../attractions/types";

// 圆顶礁 · 同行适合度。2026-10-16 按 NPS 无障碍页面整理：游客中心有坡道入口和无障碍洗手间，公路边的岩画有栈道，
// 吉福德之家和弗鲁塔露营地旁的 Fremont River 步道轮椅能走，景观道大部分在车上就能看，很多观景点和解说牌轮椅能到；
// 公园免费借两台全地形轮椅（先到先得）。峡谷步道遇雨有山洪，岩坡上几乎没有遮阴
const ACCESS = "https://www.nps.gov/care/planyourvisit/accessibility.htm";

export const suitability: Record<string, Suitability> = {
  "care-visitor-center": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "坡道入口，有专用车位、无障碍洗手间、字幕介绍片和能摸的展品；能问借全地形轮椅。",
    source: ACCESS,
  },
  "care-fruita-gifford-house": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "吉福德之家和露营地旁的 Fremont River 步道官方说轮椅能走，木屋学校、农具棚也是无障碍的；进果园要走草地和土埂，轮椅推起来费劲。",
    source: ACCESS,
  },
  "care-petroglyph-panel": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说有栈道通到岩画前，轮椅能到，下车几步就是。",
    source: ACCESS,
  },
  "care-hickman-bridge": {
    kidsFromAge: 5,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "开头一段是连续上坡和石阶，后面是沙地和岩面，几乎没有遮阴；带孩子、老人夏天一早走，上坡慢慢歇，到石桥下绕一圈就原路回来。",
  },
  "care-rim-overlook": {
    kidsFromAge: 9,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat", "dropoff"],
    noteZh:
      "往返约 7.4 公里、爬升约 340 米，一路暴晒；终点就在约 300 米高的崖边，没有护栏。带孩子、体力一般的走到希克曼天然桥就够，在弗鲁塔谷底仰看崖壁也很壮观。",
  },
  "care-scenic-drive": {
    kidsFromAge: 0,
    stroller: "yes",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "官方说大部分景色在车上就能看；沿途野餐区有无障碍车位和洗手间，两条土路支线有点颠。",
    source: ACCESS,
  },
  "care-grand-wash": {
    kidsFromAge: 3,
    stroller: "no",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["flashFlood"],
    noteZh: "几乎全程平路，但脚下是沙石河床，婴儿车推不动；这是山洪通道，下雨或有雷暴预警别进，7–9 月午后尤其要看天。",
  },
  "care-cassidy-arch": {
    kidsFromAge: 7,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["dropoff", "heat"],
    noteZh:
      "之字形山路一路陡上，上到岩面后跟着石堆走，有几处靠近落差，拱门就悬在崖边；带孩子要牵着，体力一般的在大冲沟里平路走一段就好。",
  },
  "care-capitol-gorge": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "no",
    seniors: "ok",
    hazards: ["flashFlood"],
    noteZh:
      "到拓荒者签名墙约 800 米是平坦的砾石河床，结实的推车能推到；再往水袋要爬一小段岩坡。窄峡谷遇雨有山洪，雷雨天别进，出发前查土路有没有开。",
  },
  "care-panorama-point": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    noteZh: "停车场边就能看，走几步上小山包视野更全，那段是土路小坡；夜里观星别离开停车场乱走，用红光手电。",
  },
  "care-goosenecks-sunset-point": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["dropoff"],
    noteZh: "鹅颈观景点离停车场约 150 米，日落点单程约 600 米，都是土路和岩面；两处都在深谷崖边，孩子要牵着，天黑后带头灯走回去。",
  },
  "care-chimney-rock": {
    kidsFromAge: 6,
    stroller: "no",
    wheelchair: "no",
    seniors: "caution",
    hazards: ["heat"],
    noteZh: "约 5.8 公里，开头一段陡上山脊，之后上上下下、几乎没有遮阴；带孩子、老人爬到山脊上看到烟囱岩就原路回来。",
  },
  "care-cathedral-valley": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "caution",
    hazards: ["remote"],
    noteZh:
      "两座神殿在车上就能看到，但要开约 27 公里颠簸土路、往返约 3 小时，路上没有水、没有信号，雨后会陷车；带婴儿、体力一般的老人要掂量这段车程。",
  },
  "care-burr-trail": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "yes",
    seniors: "ok",
    noteZh: "开车看，之字形段是土路、弯急路窄，坐车会颠；绕一圈要大半天，带老人小孩备好水和零食。",
  },
  "care-goblin-valley": {
    kidsFromAge: 0,
    stroller: "partial",
    wheelchair: "partial",
    seniors: "ok",
    hazards: ["heat"],
    noteZh:
      "观景台在停车场边，能俯瞰整片石柱；下到谷里是沙地和岩坡，婴儿车、轮椅下不去。夏天中午谷里很热，孩子爬石柱选早上或傍晚。",
  },
};
