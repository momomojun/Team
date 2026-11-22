/**
 * 国家公园可能遇到的危险（GOALS O63，组员 Tianyue 提的）：野生动物（熊、野牛、驼鹿和马鹿、美洲狮、蛇、短吻鳄）和别的常见危险
 * （坠落、溺水和冷水、山洪、高温、地热、雷电、高海拔、失温、开车），每种写清楚实际有多常见、怎么防、遇到了怎么办，
 * 哪些公园官方资料提到了，附近几年官方通报的事件。只用官方资料（NPS、Parks Canada、USGS、NWS、CDC），转述不照抄，
 * 每条都有来源；写得平实，不渲染。景点上的危险标记另见 src/data/suitability/（同行适合度），公园页“安全”两样一起列。
 * SAFETY_CHECKED 之后要复查（事件、数字会变）。
 */
export const SAFETY_CHECKED = "2026-11-22";

/**
 * NPS 公开的死亡记录（https://www.nps.gov/aboutus/mortality-data.htm 和它链接的表格，数据到 2026-02-17）：
 * 数字是按表格自己数的，只用 NPS 核实过的 2014–2019 年（2020 年以后的 NPS 说还没核实，2023–2025 年明显不全）
 */
export const SAFETY_MORTALITY = {
  zh: "按 NPS 公开的死亡记录（我们按 NPS 核实过的 2014–2019 年数的）：所有 NPS 管理的地方（含休闲区、公园路）6 年里意外死亡 1,080 人，最多的是车祸 354、溺水 314、坠落 205，另有高温 41、失温 19、山洪 7、雷击 4、野生动物 3。只看名字叫“国家公园”的，坠落排第一（156），然后是车祸（91）和溺水（65）。2019 年平均每 10 万人次游客约 0.11 人死亡：出事的很少，而且多半是可以避免的。",
  en: "From the NPS's public mortality records (our count of the 2014–2019 years the NPS has validated): across every NPS site, including recreation areas and parkways, there were 1,080 accidental deaths in those six years. The leading causes were vehicle crashes (354), drowning (314) and falls (205), followed by heat (41), hypothermia (19), flash floods (7), lightning (4) and wildlife (3). In places named national parks, falls come first (156), then crashes (91) and drowning (65). In 2019 there were about 0.11 deaths per 100,000 recreational visits: deaths are rare, and most are preventable.",
  sources: [
    { title: "NPS Mortality Data", url: "https://www.nps.gov/aboutus/mortality-data.htm" },
    { title: "NPS mortality spreadsheet (CY2007–2026)", url: "https://www.nps.gov/aboutus/upload/NPS-Mortality-Data-CY2007-to-CY2026-Released.xlsx" },
  ],
};

export type SafetyHazardId =
  | "bear"
  | "bison"
  | "moose-elk"
  | "mountain-lion"
  | "snake"
  | "alligator"
  | "fall"
  | "water"
  | "flash-flood"
  | "heat"
  | "thermal"
  | "lightning"
  | "altitude"
  | "cold"
  | "driving";

export interface SafetyHazard {
  id: SafetyHazardId;
  titleZh: string;
  titleEn: string;
  /** 是什么、实际有多常见（有官方数字的写数字） */
  whatZh: string;
  whatEn: string;
  /** 怎么防（官方建议） */
  preventZh: string[];
  preventEn: string[];
  /** 遇到了怎么办 */
  ifZh: string[];
  ifEn: string[];
  /** 近几年官方通报的事件（只有野生动物写） */
  incidents: { date: string; park: string; summaryZh: string; summaryEn: string; url: string; news?: boolean }[];
  /** 官方资料提到有这种危险的公园：在哪、为什么 */
  parks: Record<string, { zh: string; en: string }>;
  sources: { title: string; url: string }[];
}

export const safetyHazards: SafetyHazard[] = [
  {
    "id": "bear",
    "titleZh": "熊",
    "titleEn": "Bears",
    "whatZh": "美国西部、阿拉斯加和加拿大落基山有灰熊（棕熊）和黑熊，东部和加州的公园主要是黑熊。熊伤人其实很少见：NPS 的死亡记录里，2007 到 2025 年所有国家公园单位一共只记了 10 起被野生动物致死（各种动物加起来）。出事多半是突然撞见、离得太近，或者熊吃惯了人的食物；黄石统计，1970 年以来被熊伤到的人里 91% 是一个人或两个人走。",
    "whatEn": "Grizzly (brown) bears and black bears live in the West, Alaska and the Canadian Rockies; parks in the East and California have black bears. Injuries are rare: NPS mortality records list only 10 wildlife-caused deaths (all species combined) across every park unit from 2007 to 2025. Most incidents start with a surprise encounter, getting too close, or a bear that has learned to eat human food. In Yellowstone, 91% of people injured by bears since 1970 were hiking alone or with just one other person.",
    "preventZh": [
      "离熊至少 100 码（约 91 米）；德纳里要求 300 码（约 274 米），仙纳度对黑熊是 150 英尺（约 46 米）。用望远镜或长焦镜头看",
      "三个人以上结伴走，边走边出声，白天走，留在正式步道上",
      "随身带防熊喷雾，放在伸手就拿得到的地方（别塞在背包里）；高温会让罐子爆裂，别留在车里",
      "食物、垃圾和有气味的东西放进防熊柜、防熊桶，或者挂到离地 3 米（10 英尺）以上；做饭和睡觉的地方隔开 100 码（约 91 米）",
      "带小孩的把小孩拉在身边；绝不要站到母熊和小熊中间"
    ],
    "preventEn": [
      "Stay at least 100 yards (91 m) from bears; Denali requires 300 yards, and Shenandoah asks for 150 feet from black bears. Use binoculars or a telephoto lens.",
      "Hike in groups of three or more, make noise, hike in daylight and stay on maintained trails.",
      "Carry bear spray where you can reach it in a second, not inside your pack. Heat can make the can burst, so don't leave it in a hot car.",
      "Keep food, trash and anything scented in bear lockers or bear-resistant containers, or hang it at least 10 feet off the ground. Cook and sleep at least 100 yards apart.",
      "Keep children close, and never get between a mother bear and her cubs."
    ],
    "ifZh": [
      "看到熊：别跑，也别爬树（两种熊都会爬树）；冷静地跟它说话，慢慢挥手让它知道你是人，背包别卸下",
      "熊站着不动：侧着身慢慢退开，给它留一条走的路；它跟过来就站住不动",
      "熊冲过来：很多是虚张声势，冲到跟前会停下或拐开；离你 9 到 18 米（30 到 60 英尺）时对着它喷防熊喷雾",
      "被灰熊（棕熊）扑倒：趴在地上装死，双手护住后颈，两腿分开，等熊走远再动；它一直不停，就拼命反击、打它的脸",
      "被黑熊攻击：别装死，尽量躲进车里或房子里；跑不掉就拿手边任何东西反击，打它的脸和鼻子",
      "熊闯进帐篷，或者一直尾随你：不管哪种熊都要反击",
      "跟熊有关的任何情况都马上告诉护林员"
    ],
    "ifEn": [
      "If you see a bear, don't run and don't climb a tree (both species climb). Talk calmly, slowly wave your arms so it knows you're human, and keep your pack on.",
      "If the bear isn't moving, back away slowly and sideways and leave it an escape route. If it follows, stop and hold your ground.",
      "Many charges are bluffs that stop short or veer off. Use bear spray when a charging bear is about 30 to 60 feet away.",
      "If a grizzly or brown bear makes contact, play dead: lie flat on your stomach, clasp your hands behind your neck, spread your legs and stay still until it leaves. If the attack keeps going, fight back hard and aim for the face.",
      "If a black bear attacks, don't play dead. Get to a car or building if you can; if not, fight back with anything at hand, aiming for the face and muzzle.",
      "If a bear comes into your tent or stalks you, fight back whatever the species.",
      "Report every bear encounter to a ranger right away."
    ],
    "incidents": [
      {
        "date": "2026-05-04",
        "park": "yell",
        "summaryZh": "老忠实泉附近的 Mystic Falls 步道，两名徒步者（15 岁和 28 岁）被灰熊所伤，可能是一只带着两三只小熊的母熊，两人被直升机送医；附近步道临时关闭。",
        "summaryEn": "On the Mystic Falls Trail near Old Faithful, two hikers (ages 15 and 28) were injured by a grizzly, likely a female with two or three cubs, and flown out by helicopter. Nearby trails were temporarily closed.",
        "url": "https://www.nps.gov/yell/learn/news/26008.htm"
      },
      {
        "date": "2026-05-06",
        "park": "glac",
        "summaryZh": "一名 33 岁的男子独自去走 Mt. Brown 步道后失踪，5 月 6 日在离步道口约 4 公里（2.5 英里）处找到遗体，伤势和遇熊一致，公园认为是突然撞见了熊。日期是找到遗体那天，出事的具体日子没公布。",
        "summaryEn": "A 33-year-old man who set out alone on the Mt. Brown Trail was found dead on May 6 about 2.5 miles from the trailhead, with injuries consistent with a bear encounter; the park said the evidence pointed to a surprise encounter. The date is when he was found; the exact day of the encounter was not released.",
        "url": "https://www.nps.gov/glac/learn/news/missing-hiker-and-bear-encounter-victim-identified.htm"
      },
      {
        "date": "2023-09-29",
        "park": "banf",
        "summaryZh": "班夫偏远的 Red Deer River 河谷，一对夫妇和他们的狗被灰熊攻击身亡；Parks Canada 处置了这只熊并封闭了周边区域。按新闻报道整理（报道引用 Parks Canada 的说法；日期按报道推算，是周五晚上收到求救信号的那天）。",
        "summaryEn": "In Banff's remote Red Deer River valley, a couple and their dog were killed by a grizzly. Parks Canada put the bear down and closed the surrounding area. Based on news reports quoting Parks Canada; the date is the Friday evening the emergency alert came in, as inferred from the reports.",
        "url": "https://www.npr.org/2023/10/02/1203036630/bear-attack-couple-dies-canada-banff",
        "news": true
      }
    ],
    "parks": {
      "yell": {
        "zh": "全园都有灰熊和黑熊，连老忠实泉的木栈道和停车场附近也有",
        "en": "The whole park is grizzly and black bear country, even the boardwalks and parking lots at Old Faithful."
      },
      "grte": {
        "zh": "灰熊、黑熊都有；离熊至少 100 码（约 91 米）",
        "en": "Grizzlies and black bears; stay at least 100 yards away."
      },
      "glac": {
        "zh": "灰熊、黑熊都有；在熊 100 码（约 91 米）以内停留、靠近是违规的",
        "en": "Grizzlies and black bears; approaching or lingering within 100 yards is prohibited."
      },
      "dena": {
        "zh": "离熊至少 300 码（约 274 米），离其他动物 25 码（约 23 米）",
        "en": "Stay 300 yards from bears and 25 yards from other animals."
      },
      "katm": {
        "zh": "全园都是棕熊的地盘",
        "en": "All of Katmai is brown bear country."
      },
      "lacl": {
        "zh": "海岸常有棕熊，看熊、钓鱼都要守规矩",
        "en": "Brown bears are common on the coast; follow viewing and fishing rules."
      },
      "kefj": {
        "zh": "徒步可能遇到熊",
        "en": "Bear encounters are possible on hikes."
      },
      "glba": {
        "zh": "黑熊、棕熊（灰熊）都有",
        "en": "Both black and brown (grizzly) bears."
      },
      "gaar": {
        "zh": "荒野里只能靠自己，食物要放防熊桶",
        "en": "You're on your own in the wilderness; store food in bear-resistant containers."
      },
      "kova": {
        "zh": "有黑熊和灰熊",
        "en": "Black bears and grizzlies."
      },
      "voya": {
        "zh": "有黑熊，露营要把食物收好",
        "en": "Black bears; store food properly when camping."
      },
      "yose": {
        "zh": "有黑熊，开车别超速",
        "en": "Black bears; obey speed limits on park roads."
      },
      "seki": {
        "zh": "有黑熊，会到营地找吃的",
        "en": "Black bears that come into campgrounds looking for food."
      },
      "grsm": {
        "zh": "园里有黑熊，见到要保持距离",
        "en": "Black bears; keep your distance."
      },
      "shen": {
        "zh": "离黑熊至少 150 英尺（约 46 米）",
        "en": "Stay at least 150 feet from black bears."
      },
      "redw": {
        "zh": "有黑熊，野餐、露营别让熊吃到食物",
        "en": "Black bears; don't let them get your picnic or camp food."
      },
      "lavo": {
        "zh": "有黑熊",
        "en": "Black bears."
      },
      "mora": {
        "zh": "有黑熊和美洲狮",
        "en": "Black bears and mountain lions."
      },
      "neri": {
        "zh": "有黑熊，露营要收好食物",
        "en": "Black bears; store food properly when camping."
      },
      "bibe": {
        "zh": "黑熊常在营地附近出没",
        "en": "Black bears often visit campgrounds."
      },
      "gumo": {
        "zh": "步道上可能遇到黑熊",
        "en": "Black bears may be met on trails."
      },
      "grsa": {
        "zh": "沙丘上方的山脚和山里有黑熊",
        "en": "Black bears live in the foothills and mountains above the dunes."
      },
      "blca": {
        "zh": "可能遇到黑熊，但很少见",
        "en": "Black bears are possible but rarely seen."
      },
      "chir": {
        "zh": "可能遇到黑熊或美洲狮",
        "en": "Black bears or mountain lions are possible."
      },
      "banf": {
        "zh": "灰熊和黑熊都有，Parks Canada 建议徒步、露营都带防熊喷雾",
        "en": "Grizzlies and black bears; Parks Canada recommends bear spray for hiking and camping."
      },
      "jasp": {
        "zh": "灰熊和黑熊都有，建议带防熊喷雾",
        "en": "Grizzlies and black bears; carry bear spray."
      },
      "yoho": {
        "zh": "灰熊和黑熊都有，建议带防熊喷雾",
        "en": "Grizzlies and black bears; carry bear spray."
      },
      "romo": {
        "zh": "有黑熊，建议离黑熊至少 120 英尺（约 36 米）",
        "en": "Black bears; stay at least 120 feet away."
      },
      "olym": {
        "zh": "黑熊的地盘；离野生动物至少 50 码（约 46 米），熊离你不到 50 码或进了营地要报告",
        "en": "Black bear country; stay at least 50 yards from wildlife, and report any bear that comes within 50 yards or into camp."
      }
    },
    "sources": [
      {
        "title": "NPS: Staying Safe Around Bears",
        "url": "https://www.nps.gov/subjects/bears/safety.htm"
      },
      {
        "title": "Yellowstone: Safety",
        "url": "https://www.nps.gov/yell/planyourvisit/safety.htm"
      },
      {
        "title": "Denali: Safety",
        "url": "https://www.nps.gov/dena/planyourvisit/safety.htm"
      },
      {
        "title": "Glacier: Have Fun and Stay Safe",
        "url": "https://www.nps.gov/glac/planyourvisit/safety.htm"
      },
      {
        "title": "Shenandoah: Safety",
        "url": "https://www.nps.gov/shen/planyourvisit/safety.htm"
      },
      {
        "title": "Parks Canada: Bear safety in the mountain national parks",
        "url": "https://parks.canada.ca/pn-np/mtn/ours-bears/securite-safety"
      },
      {
        "title": "NPS mortality data",
        "url": "https://www.nps.gov/aboutus/mortality-data.htm"
      },
      {
        "title": "Rocky Mountain: Wildlife Safety",
        "url": "https://www.nps.gov/romo/planyourvisit/wildlife-safety.htm"
      },
      {
        "title": "Olympic: Wildlife Safety",
        "url": "https://www.nps.gov/olym/planyourvisit/wildlife-safety.htm"
      }
    ]
  },
  {
    "id": "bison",
    "titleZh": "野牛",
    "titleEn": "Bison",
    "whatZh": "野牛看起来慢吞吞的，其实跑起来是人的三倍快，时速能超过 30 英里（约 48 公里），角很尖。黄石说，在黄石伤人最多的动物就是野牛，不是熊；几乎每年夏天都有游客因为靠得太近被顶伤，多数是在路边、步道和间歇泉的木栈道旁边。",
    "whatEn": "Bison look slow, but they can run three times faster than people, over 30 mph, and their horns are sharp. Yellowstone says bison have injured more people there than any other animal, bears included. Most summers someone is gored after getting too close, usually beside a road, a trail or a geyser boardwalk.",
    "preventZh": [
      "离野牛至少 25 码（约 23 米）；恶地公园规定至少 100 英尺（约 30 米），风洞公园建议离野牛比这还远",
      "竖起大拇指伸直手臂，拇指能整个盖住野牛，才算够远",
      "野牛走过来就你往后退，保持距离；别为了拍照往前凑",
      "开车遇到野牛堵路要耐心，别按喇叭、别往它身上开；夜里和看不清的时候开慢点",
      "野牛在产仔和交配的季节脾气更大，更要离远"
    ],
    "preventEn": [
      "Stay at least 25 yards (23 m) from bison; Badlands requires at least 100 feet, and Wind Cave recommends giving bison even more room.",
      "Rule of thumb: hold your arm out and raise your thumb. If your thumb covers the whole animal, you're far enough away.",
      "If a bison walks toward you, back away to keep your distance. Never move in for a photo.",
      "In a bison jam, be patient: don't honk or drive at them, and slow down at night or in poor visibility.",
      "Bison are more aggressive during calving and mating season, so give them extra space then."
    ],
    "ifZh": [
      "看到这些信号就是你太近了：点头、刨地、低吼、把尾巴翘起来",
      "野牛冲过来：赶紧走开或跑开，躲到车、房子或者大树、大石头后面",
      "在步道上看到野牛迎面走来，离开步道绕开它，别跟它抢路",
      "有人受伤马上打 911，告诉护林员"
    ],
    "ifEn": [
      "Warning signs that you're too close: head bobbing, pawing, bellowing and a raised tail.",
      "If a bison charges, walk or run away and get behind a car, building, or large tree or rock.",
      "If a bison is coming down the trail toward you, step off the trail and give it a wide berth.",
      "If someone is hurt, call 911 and tell a ranger."
    ],
    "incidents": [
      {
        "date": "2026-06-26",
        "park": "yell",
        "summaryZh": "Fishing Bridge 北边的 Mud Volcano 附近，一名 12 岁的游客被野牛所伤，送医治疗。",
        "summaryEn": "A 12-year-old visitor was injured by a bison near Mud Volcano, just north of Fishing Bridge, and taken to a hospital.",
        "url": "https://www.nps.gov/yell/learn/news/26014.htm"
      },
      {
        "date": "2025-06-10",
        "park": "yell",
        "summaryZh": "老忠实泉所在的上间歇泉盆地，一大群游客靠得太近，一名 30 岁男子被野牛顶伤，伤势较轻。",
        "summaryEn": "In the Upper Geyser Basin at Old Faithful, a large group of visitors got too close to a bison and a 30-year-old man was gored, with minor injuries.",
        "url": "https://www.nps.gov/yell/learn/news/25006.htm"
      },
      {
        "date": "2024-06-01",
        "park": "yell",
        "summaryZh": "黄石湖边的 Storm Point 步道附近，一头野牛为了护着自己的地盘冲到一位 83 岁女士几英尺内，用角把她挑离地面约一英尺，她伤得很重。",
        "summaryEn": "Near the Storm Point Trail on Yellowstone Lake, a bison defending its space came within a few feet of an 83-year-old woman and lifted her about a foot off the ground with its horns. She was seriously injured.",
        "url": "https://www.nps.gov/yell/learn/news/240603.htm"
      }
    ],
    "parks": {
      "yell": {
        "zh": "伤人最多的动物；路边、间歇泉木栈道、步道上都常见",
        "en": "The animal that injures the most people; common along roads, geyser boardwalks and trails."
      },
      "grte": {
        "zh": "路边常能看到野牛，离 25 码（约 23 米）以上",
        "en": "Bison are often seen from the road; stay more than 25 yards away."
      },
      "thro": {
        "zh": "野牛和野马会走上步道，迎面来了就下步道让开",
        "en": "Bison and wild horses use the trails; step off and let them pass."
      },
      "wica": {
        "zh": "野牛在产仔和交配季更凶，离得比 25 码更远",
        "en": "Bison are more aggressive in calving and mating season; stay well beyond 25 yards."
      },
      "badl": {
        "zh": "规定离野生动物至少 100 英尺（约 30 米），尤其是野牛",
        "en": "Rules require 100 feet from wildlife, especially bison."
      }
    },
    "sources": [
      {
        "title": "Yellowstone: Safety",
        "url": "https://www.nps.gov/yell/planyourvisit/safety.htm"
      },
      {
        "title": "Badlands: Safety",
        "url": "https://www.nps.gov/badl/planyourvisit/safety.htm"
      },
      {
        "title": "Wind Cave: Safety",
        "url": "https://www.nps.gov/wica/planyourvisit/safety.htm"
      },
      {
        "title": "Theodore Roosevelt: Safety",
        "url": "https://www.nps.gov/thro/planyourvisit/safety.htm"
      },
      {
        "title": "Grand Teton: Safety",
        "url": "https://www.nps.gov/grte/planyourvisit/safety.htm"
      },
      {
        "title": "Grand Teton: Mammals",
        "url": "https://www.nps.gov/grte/learn/nature/mammals.htm"
      }
    ]
  },
  {
    "id": "moose-elk",
    "titleZh": "驼鹿和马鹿",
    "titleEn": "Moose and elk",
    "whatZh": "驼鹿和马鹿（北美叫 elk）个头很大，马鹿公的能有 1,000 到 1,200 磅（450 到 540 公斤），驼鹿更大。平时它们会躲开人，但有两个季节特别凶：春末夏初母的护着刚生的小崽，秋天公的发情。被踢、被顶的大多是凑上去拍照的人。大烟山 2026 年 10 月就说，发情季已经有几位游客因为靠太近受伤。",
    "whatEn": "Moose and elk are huge: bull elk can weigh 1,000 to 1,200 pounds, and moose are bigger still. They usually avoid people, but two seasons are different: late spring, when cows guard newborn calves, and fall, when bulls are in the rut. Most people who get kicked or charged walked up for a photo. In October 2026, Great Smoky Mountains reported several visitors injured after getting too close to elk during the rut.",
    "preventZh": [
      "离驼鹿、马鹿至少 25 码（约 23 米）；加拿大落基山建议离马鹿 30 米（约 33 码），大约三辆大巴那么长",
      "要是动物因为你在旁边而改变动作（抬头盯你、走开、磨牙、耳朵往后贴），说明你太近了，往后退",
      "春天（大约 5 到 6 月）别靠近带小崽的母鹿；小崽常藏在步道边的草丛里",
      "秋天发情季（大约 8 到 10 月）公鹿会冲人、冲车，遇到公鹿带着一群母鹿挡在步道上，慢慢退开、换条路",
      "别站到母鹿和小崽中间，也别穿过一群鹿；在车里看最安全，但别把车停在路上"
    ],
    "preventEn": [
      "Stay at least 25 yards (23 m) from moose and elk; the Canadian Rockies parks recommend 30 m (about 33 yards, three bus lengths) from elk.",
      "If an animal changes what it's doing because of you (it stares, moves off, grinds its teeth or pins its ears back), you're too close. Back off.",
      "In spring (roughly May and June), stay away from cows with calves; calves are often hidden in vegetation near trails.",
      "During the fall rut (roughly August through October), bulls may charge people and cars. If a bull and his herd block the trail, back away slowly and find another route.",
      "Never get between a cow and her calf or walk through a herd. A car makes a good blind, but don't stop in the road."
    ],
    "ifZh": [
      "马鹿冲过来：躲到房子、车或者结实的东西后面",
      "驼鹿冲过来：赶紧跑，绕到树、车或房子后面；在空地上就走之字形跑，驼鹿不太会急转弯",
      "近距离撞见：结伴的人待在一起，别直视它，从旁边绕大圈走开",
      "有人受伤告诉护林员，需要急救打 911"
    ],
    "ifEn": [
      "If an elk charges, get behind a building, car or other solid barrier.",
      "If a moose charges, run. Duck around trees, cars or buildings; in the open, run in a zigzag, since moose don't turn well.",
      "If you meet one at close range, stay together as a group, avoid eye contact and walk a wide circle around it.",
      "Report injuries to a ranger and call 911 for emergencies."
    ],
    "incidents": [
      {
        "date": "2026-10-07",
        "park": "grsm",
        "summaryZh": "大烟山发布提醒：马鹿发情季里已经有几位游客因为靠得太近受伤，其中一人手臂被刺伤，还因违反公园规定被开了罚单。Oconaluftee 和 Cataloochee 的草地在发情季全部禁止进入。日期是公园发布提醒的那天。",
        "summaryEn": "Great Smoky Mountains warned that several visitors had been injured after getting too close to elk during the rut; one person suffered an arm puncture and was cited for breaking park rules. The fields at Oconaluftee and Cataloochee are closed during the rut. The date is when the park issued the warning.",
        "url": "https://www.nps.gov/grsm/learn/news/great-smoky-mountains-national-park-reminds-visitors-approaching-elk-is-both-dangerous-and-illegal.htm"
      }
    ],
    "parks": {
      "yell": {
        "zh": "母马鹿 5 月到 7 月初护崽，公马鹿 9 到 10 月发情时难以预料",
        "en": "Cow elk guard calves from May to early July; bull elk are unpredictable during the September–October rut."
      },
      "grte": {
        "zh": "常能看到驼鹿和马鹿，离 25 码（约 23 米）以上",
        "en": "Moose and elk are common; stay more than 25 yards away."
      },
      "glac": {
        "zh": "驼鹿、马鹿至少离 25 码（约 23 米）",
        "en": "Keep at least 25 yards from moose and elk."
      },
      "glba": {
        "zh": "驼鹿在灌木丛、草地和树林里很常见，可能非常危险",
        "en": "Moose are widespread in thickets, meadows and forest and can be extremely dangerous."
      },
      "dena": {
        "zh": "母驼鹿护崽时会冲人，曾在营地伤人",
        "en": "Cow moose defending calves have charged and injured people, including at a campground."
      },
      "kova": {
        "zh": "驼鹿是园里可能伤人的大型动物之一",
        "en": "Moose are among the large animals here that can hurt people."
      },
      "redw": {
        "zh": "罗斯福马鹿：5 月底到 6 月护崽，8 月底到 10 月发情，春秋都要离得更远",
        "en": "Roosevelt elk: calving late May–June, rut late August–October; give them extra room in spring and fall."
      },
      "grsm": {
        "zh": "Oconaluftee、Cataloochee 一带有马鹿；离 25 码以内是违规的",
        "en": "Elk around Oconaluftee and Cataloochee; approaching within 25 yards is illegal."
      },
      "banf": {
        "zh": "离马鹿 30 米；5 到 6 月母鹿护崽，8 到 9 月公鹿发情，镇上和路边也有",
        "en": "Stay 30 m from elk; cows defend calves in May–June and bulls rut in August–September, even in town and along roads."
      },
      "romo": {
        "zh": "离驼鹿至少 120 英尺（约 36 米），离马鹿至少 75 英尺（约 23 米）；9、10 月马鹿发情季，几片草地傍晚 5 点到早上 10 点禁止进入",
        "en": "Stay at least 120 feet from moose and 75 feet from elk; during the September–October elk rut, several meadows close from 5 p.m. to 10 a.m."
      },
      "olym": {
        "zh": "罗斯福马鹿是园里最危险的动物之一，离马鹿至少 100 英尺（约 30 米）",
        "en": "Roosevelt elk are among the most dangerous animals in the park; stay at least 100 feet away."
      }
    },
    "sources": [
      {
        "title": "Yellowstone: Safety",
        "url": "https://www.nps.gov/yell/planyourvisit/safety.htm"
      },
      {
        "title": "Glacier: Have Fun and Stay Safe",
        "url": "https://www.nps.gov/glac/planyourvisit/safety.htm"
      },
      {
        "title": "Glacier Bay: Safety (Moose Alert)",
        "url": "https://www.nps.gov/glba/planyourvisit/safety.htm"
      },
      {
        "title": "Redwood: Safety (Roosevelt Elk Safety)",
        "url": "https://www.nps.gov/redw/planyourvisit/safety.htm"
      },
      {
        "title": "Denali: Use Caution Around Moose (2015)",
        "url": "https://www.nps.gov/dena/learn/news/moose-danger.htm"
      },
      {
        "title": "Great Smoky Mountains: Approaching elk is dangerous and illegal (2026-10-07)",
        "url": "https://www.nps.gov/grsm/learn/news/great-smoky-mountains-national-park-reminds-visitors-approaching-elk-is-both-dangerous-and-illegal.htm"
      },
      {
        "title": "Parks Canada: Elk safety, Banff",
        "url": "https://parks.canada.ca/pn-np/ab/banff/securite-safety/faunesecurite-wildlifesafety/wapiti-elk"
      },
      {
        "title": "Rocky Mountain: Wildlife Safety",
        "url": "https://www.nps.gov/romo/planyourvisit/wildlife-safety.htm"
      },
      {
        "title": "Olympic: Roosevelt Elk",
        "url": "https://www.nps.gov/olym/learn/nature/roosevelt-elk.htm"
      },
      {
        "title": "Rocky Mountain: Elk rut meadow closures (2024 release)",
        "url": "https://www.nps.gov/romo/learn/news/annual-meadow-closures-in-place-beginning-on-september-1-for-elk-rut-season-in-rocky-mountain-national-park.htm"
      }
    ]
  },
  {
    "id": "mountain-lion",
    "titleZh": "美洲狮",
    "titleEn": "Mountain lions",
    "whatZh": "美洲狮（也叫山狮、cougar）在西部的山区和沙漠很常见，但它们独来独往、很躲人，绝大多数游客一辈子都见不到。见到时多半隔得很远，通常在清晨或黄昏。伤人的事极少，但它们对小孩更感兴趣，所以带孩子的要多留心。",
    "whatEn": "Mountain lions (also called cougars or pumas) live throughout the western mountains and deserts, but they are solitary and secretive, and most visitors never see one. Sightings are usually from a distance, around dawn or dusk. Attacks are very rare, but lions seem especially drawn to children, so families should pay extra attention.",
    "preventZh": [
      "别一个人跑步或徒步，结伴走；黄石、冰川要求离美洲狮至少 100 码（约 91 米）",
      "小孩一直留在大人身边，别让他们跑在前面，别让他们黄昏、清晨单独在河边或草丛里玩",
      "别靠近动物尸体，美洲狮会回来接着吃；别喂鹿",
      "晚上别把宠物留在外面"
    ],
    "preventEn": [
      "Don't jog or hike alone. Yellowstone and Glacier require you to stay at least 100 yards (91 m) from mountain lions.",
      "Keep children right next to you and never let them run ahead or play alone by rivers or in thick brush at dawn or dusk.",
      "Stay away from animal carcasses, since lions return to their kills, and don't feed deer.",
      "Don't leave pets outside at night."
    ],
    "ifZh": [
      "别跑：跑会勾起它追的本能。面对它站着，看着它的眼睛，给它留一条走的路",
      "别蹲下、别弯腰；把小孩抱起来，抱的时候也尽量别弯腰、别转身",
      "让自己显得大：举起手臂，把外套撑开，大声、坚定地说话；够得着的话（不用弯腰）扔石头、树枝",
      "被扑上来就反击：用石头、树枝、外套、空手都行；它通常咬头和脖子，尽量站着、正面对着它",
      "看到美洲狮都报告护林员"
    ],
    "ifEn": [
      "Don't run, which can trigger a chase. Stand and face the lion, make eye contact, and give it a way to escape.",
      "Don't crouch or bend over. Pick up small children, ideally without bending down or turning away.",
      "Make yourself look bigger: raise your arms, open your jacket, and speak firmly in a loud voice. Throw stones or branches if you can reach them without crouching.",
      "If attacked, fight back with rocks, sticks, a jacket or your bare hands. Lions usually go for the head and neck, so try to stay on your feet and face it.",
      "Report every mountain lion sighting to a ranger."
    ],
    "incidents": [
      {
        "date": "2025-07-20",
        "park": "olym",
        "summaryZh": "飓风岭 Victoria Overlook 附近一条热门步道上，一只戴着项圈的美洲狮咬伤了一名跟着家人走的 4 岁孩子，孩子被直升机送到西雅图的创伤中心；第二天公园找到并处置了这只美洲狮。",
        "summaryEn": "On a popular trail near Victoria Overlook on Hurricane Ridge, a collared mountain lion bit a 4-year-old walking with family. The child was flown to a trauma center in Seattle, and park staff found and killed the lion the next day.",
        "url": "https://www.nps.gov/olym/learn/news/mountain-lion-injures-child-in-olympic-national-park-rangers-seek-witnesses.htm"
      }
    ],
    "parks": {
      "olym": {
        "zh": "2025 年 7 月飓风岭有孩子被美洲狮咬伤",
        "en": "A child was bitten by a mountain lion at Hurricane Ridge in July 2025."
      },
      "yell": {
        "zh": "离美洲狮至少 100 码（约 91 米）",
        "en": "Stay at least 100 yards from mountain lions."
      },
      "glac": {
        "zh": "离美洲狮至少 100 码（约 91 米）",
        "en": "Stay at least 100 yards from mountain lions."
      },
      "grca": {
        "zh": "离美洲狮至少 100 英尺（约 30 米）",
        "en": "Stay at least 100 feet from mountain lions."
      },
      "mora": {
        "zh": "园里有美洲狮和黑熊",
        "en": "Home to mountain lions and black bears."
      },
      "redw": {
        "zh": "园里有美洲狮",
        "en": "Mountain lions live here."
      },
      "lavo": {
        "zh": "园里有美洲狮",
        "en": "Mountain lions live here."
      },
      "crla": {
        "zh": "园里有美洲狮",
        "en": "Mountain lions live here."
      },
      "grsa": {
        "zh": "园里有美洲狮",
        "en": "Mountain lions live here."
      },
      "blca": {
        "zh": "可能遇到，但很少见",
        "en": "Possible but rarely seen."
      },
      "grba": {
        "zh": "园里有美洲狮",
        "en": "Mountain lions live here."
      },
      "wica": {
        "zh": "园里有美洲狮",
        "en": "Mountain lions live here."
      },
      "bibe": {
        "zh": "园里有美洲狮，带孩子要看紧",
        "en": "Mountain lions live here; keep children close."
      },
      "gumo": {
        "zh": "步道上可能遇到美洲狮",
        "en": "Mountain lions may be met on trails."
      },
      "chir": {
        "zh": "可能遇到美洲狮或黑熊",
        "en": "Mountain lions or black bears are possible."
      },
      "sagu": {
        "zh": "东西两个园区都有美洲狮，遇到的机会很少",
        "en": "Mountain lions live in both districts; encounters are rare but possible."
      },
      "romo": {
        "zh": "建议离美洲狮至少 120 英尺（约 36 米）",
        "en": "Stay at least 120 feet from mountain lions."
      }
    },
    "sources": [
      {
        "title": "NPS: Mountain Lion Safety",
        "url": "https://www.nps.gov/articles/mountain-lion-safety.htm"
      },
      {
        "title": "Yellowstone: Safety",
        "url": "https://www.nps.gov/yell/planyourvisit/safety.htm"
      },
      {
        "title": "Glacier: Have Fun and Stay Safe",
        "url": "https://www.nps.gov/glac/planyourvisit/safety.htm"
      },
      {
        "title": "Grand Canyon: Safety",
        "url": "https://www.nps.gov/grca/planyourvisit/safety.htm"
      },
      {
        "title": "Olympic: Mountain lion injures child (2025-07-21)",
        "url": "https://www.nps.gov/olym/learn/news/mountain-lion-injures-child-in-olympic-national-park-rangers-seek-witnesses.htm"
      },
      {
        "title": "Saguaro: Hiking Safety Information",
        "url": "https://www.nps.gov/sagu/planyourvisit/hiking-safety-information.htm"
      },
      {
        "title": "Rocky Mountain: Wildlife Safety",
        "url": "https://www.nps.gov/romo/planyourvisit/wildlife-safety.htm"
      }
    ]
  },
  {
    "id": "snake",
    "titleZh": "毒蛇",
    "titleEn": "Venomous snakes",
    "whatZh": "西部沙漠、草原和东部山区的不少公园有响尾蛇，东部还有铜头蛇。蛇不会主动追人，多半是有人踩到或者手伸到它旁边才咬。按美国疾控中心（CDC）的估计，全美每年大约 7,000 到 8,000 人被毒蛇咬伤，死亡约 5 人，及时就医基本都能救回来。",
    "whatEn": "Rattlesnakes live in many desert, prairie and eastern mountain parks, and copperheads live in the East. Snakes don't chase people; most bites happen when someone steps on one or puts a hand right next to it. The CDC estimates 7,000 to 8,000 people are bitten by venomous snakes in the U.S. each year and about 5 die, so fast medical care almost always works.",
    "preventZh": [
      "走在正式步道上，看清楚再落脚；别把手伸进石缝、木头底下、草丛里或者看不见的地方",
      "蛇喜欢天热时躲在阴凉处，比如木栈道、台阶底下和高草里；天黑走路带手电",
      "穿包脚的鞋，别穿凉鞋走荒野步道；看紧小孩，别让他们跑在前面",
      "看到蛇就绕开，离远点，别去碰、别去拍特写，死蛇也别碰"
    ],
    "preventEn": [
      "Stay on established trails and watch where you step. Don't put your hands into rock cracks, under logs, into tall grass or anywhere you can't see.",
      "In hot weather snakes shelter in shade, such as under boardwalks, stairs and tall grass. Carry a flashlight after dark.",
      "Wear closed-toe shoes rather than sandals on trails, and keep children close.",
      "If you see a snake, give it a wide berth. Don't touch it or move in for a photo, and never handle one, even a dead one."
    ],
    "ifZh": [
      "被咬了别慌，马上打 911 或请人送医，别自己开车；别等出现症状再去",
      "坐下或躺下，伤处放平、保持不动；在肿起来之前摘掉戒指、手表",
      "用肥皂和清水洗伤口，盖上干净的纱布；用笔标出肿起来的边缘，记下时间",
      "安全的话从远处拍一张蛇的照片，方便医生判断",
      "不要绑止血带、不要割开伤口、不要用嘴吸、不要冰敷，也别喝酒、别吃阿司匹林、布洛芬这类止痛药"
    ],
    "ifEn": [
      "If you're bitten, stay calm and call 911 or get a ride to a hospital right away; don't drive yourself, and don't wait for symptoms.",
      "Sit or lie down with the bite in a neutral, comfortable position and keep still. Take off rings and watches before swelling starts.",
      "Wash the bite with soap and water and cover it with a clean, dry dressing. Mark the edge of any swelling and note the time.",
      "If it's safe, photograph the snake from a distance to help doctors.",
      "Don't use a tourniquet, cut the wound, try to suck out venom or apply ice, and don't drink alcohol or take aspirin, ibuprofen or naproxen."
    ],
    "incidents": [],
    "parks": {
      "badl": {
        "zh": "草原响尾蛇白天常躲在木栈道、台阶底下和高草里",
        "en": "Prairie rattlesnakes shelter under boardwalks, stairs and tall grass during the day."
      },
      "thro": {
        "zh": "有响尾蛇，咬人前不一定会发出响声",
        "en": "Rattlesnakes don't always rattle before striking."
      },
      "pinn": {
        "zh": "步道上能见到西部响尾蛇",
        "en": "Western rattlesnakes are seen on trails."
      },
      "deva": {
        "zh": "蛇、蝎子会躲在小洞和石缝里，手脚别乱放",
        "en": "Snakes and scorpions hide in holes and crevices; watch your hands and feet."
      },
      "gumo": {
        "zh": "天热的月份毒蛇、蝎子、蜘蛛都活跃，睡前抖一抖鞋和睡袋",
        "en": "Venomous snakes, scorpions and spiders are active in warm months; shake out shoes and sleeping bags."
      },
      "chir": {
        "zh": "响尾蛇不主动攻击，是被人踩到或贴得太近才咬",
        "en": "Rattlesnakes don't attack; they react when stepped on or approached too closely."
      },
      "whsa": {
        "zh": "毒蛇可能被沙子盖住，走正式路线",
        "en": "Venomous snakes can be hidden by sand; stay on established routes."
      },
      "grba": {
        "zh": "走正式步道，免得不小心踩到蛇",
        "en": "Stay on trails to avoid stepping on snakes."
      },
      "bibe": {
        "zh": "看紧小孩，以防碰到蛇",
        "en": "Keep small children close in case you cross paths with a snake."
      },
      "shen": {
        "zh": "有两种毒蛇：木纹响尾蛇和铜头蛇",
        "en": "Two venomous species: timber rattlesnake and copperhead."
      },
      "neri": {
        "zh": "有两种毒蛇",
        "en": "Two venomous snake species live here."
      },
      "maca": {
        "zh": "园里有毒蛇，走木栈道和步道",
        "en": "Venomous snakes are present; stay on boardwalks and trails."
      },
      "hosp": {
        "zh": "有铜头蛇、西部菱斑响尾蛇、木纹响尾蛇等毒蛇",
        "en": "Copperheads, western diamondback and timber rattlesnakes, among others."
      },
      "grsa": {
        "zh": "这里海拔高，从没见过毒蛇，只有无毒的蛇",
        "en": "No venomous snakes have ever been seen in this high-elevation park."
      },
      "sagu": {
        "zh": "园里有 6 种响尾蛇，天热时躲在灌木阴影和石缝里",
        "en": "Six species of rattlesnakes live here, sheltering in shady bushes and rock crevices during the heat of the day."
      }
    },
    "sources": [
      {
        "title": "CDC NIOSH: Venomous Snakes",
        "url": "https://www.cdc.gov/niosh/outdoor-workers/about/venomous-snakes.html"
      },
      {
        "title": "Badlands: Safety",
        "url": "https://www.nps.gov/badl/planyourvisit/safety.htm"
      },
      {
        "title": "Shenandoah: Safety",
        "url": "https://www.nps.gov/shen/planyourvisit/safety.htm"
      },
      {
        "title": "Chiricahua: Safety",
        "url": "https://www.nps.gov/chir/planyourvisit/safety.htm"
      },
      {
        "title": "Great Sand Dunes: Safety",
        "url": "https://www.nps.gov/grsa/planyourvisit/safety.htm"
      },
      {
        "title": "Saguaro: Hiking Safety Information",
        "url": "https://www.nps.gov/sagu/planyourvisit/hiking-safety-information.htm"
      }
    ]
  },
  {
    "id": "alligator",
    "titleZh": "短吻鳄和鳄鱼",
    "titleEn": "Alligators and crocodiles",
    "whatZh": "南佛罗里达的大沼泽地有短吻鳄，也有美洲鳄；比斯坎的海边红树林里有美洲鳄。看鳄鱼是很多人去大沼泽地的原因之一，它们平时趴着像雕像，但反应极快。佛州野生动物管理局说，鳄鱼造成的重伤在佛州很少见；被人喂过的鳄鱼会把人和食物联系起来，才会变得有攻击性。",
    "whatEn": "Everglades has both American alligators and American crocodiles, and crocodiles also live in Biscayne's mangrove shorelines. Seeing them is a big reason people visit the Everglades. They can lie still like statues but react lightning fast. Florida's wildlife agency says serious alligator injuries are rare; animals that have been fed by people start linking humans with food and can turn aggressive.",
    "preventZh": [
      "离短吻鳄、鳄鱼至少 15 英尺（约 4.5 米）；它对你发出嘶嘶声就是太近了，哪怕已经超过 15 英尺",
      "绝对别喂、别摸、别朝它扔东西，在大沼泽地这是违法的，会被罚款",
      "它们夜里更活跃，从黄昏到清晨捕食，晚上在水边要格外小心",
      "只在指定的游泳区、在白天下水；带狗的要拴绳，离水远一点，小狗在鳄鱼眼里就是猎物",
      "在比斯坎浮潜、叉鱼时，鱼饵、刚钓的鱼和拍水声都会招来鲨鱼和鳄鱼，靠近红树林和沙岸时多留意"
    ],
    "preventEn": [
      "Stay at least 15 feet from alligators and crocodiles. If one hisses at you, you're too close, even beyond 15 feet.",
      "Never feed, touch or throw things at them. In the Everglades, it's a crime that carries a fine.",
      "They're more active at night and hunt from dusk to dawn, so take extra care near water after dark.",
      "Swim only in designated areas during daylight. Keep dogs leashed and away from the water; gators see small dogs as prey.",
      "When snorkeling or spearfishing at Biscayne, bait, fresh catches and splashing can attract sharks and crocodiles, so stay alert near mangroves and sandy banks."
    ],
    "ifZh": [
      "听到嘶嘶声、看到它张嘴，就慢慢往后退，拉开距离",
      "有人被咬了马上打 911；就算伤口不大也要尽快就医",
      "看到对人表现出攻击性的鳄鱼，告诉护林员"
    ],
    "ifEn": [
      "If it hisses or opens its mouth, back away slowly and put more distance between you.",
      "If someone is bitten, call 911 and get medical care right away, even for a small wound.",
      "Report any alligator or crocodile acting aggressively toward people to a ranger."
    ],
    "incidents": [],
    "parks": {
      "ever": {
        "zh": "短吻鳄和美洲鳄都有，至少离 15 英尺（约 4.5 米），夜里更活跃",
        "en": "Both alligators and crocodiles; stay at least 15 feet away, and they're more active at night."
      },
      "bisc": {
        "zh": "海边红树林有美洲鳄，水里还有鲨鱼、水母、魟鱼",
        "en": "American crocodiles along mangrove shores, plus sharks, jellyfish and stingrays in the water."
      }
    },
    "sources": [
      {
        "title": "Everglades: Safety (Alligators and Crocodiles)",
        "url": "https://www.nps.gov/ever/planyourvisit/safety.htm"
      },
      {
        "title": "Biscayne: Safety",
        "url": "https://www.nps.gov/bisc/planyourvisit/safety.htm"
      },
      {
        "title": "Florida Fish and Wildlife Conservation Commission: Alligators",
        "url": "https://myfwc.com/conservation/you-conserve/wildlife/alligators/"
      }
    ]
  },
  {
    "id": "fall",
    "titleZh": "坠落和滑倒",
    "titleEn": "Falls",
    "whatZh": "在名字叫“国家公园”的这些公园里，意外死亡最常见的原因其实是坠落。我们按 NPS 公开的死亡记录统计，2014 到 2019 年这些公园一共有 422 起意外死亡，其中坠落 156 起，比车祸（91 起）和溺水（65 起）都多。大多数发生在悬崖边、观景点和瀑布旁湿滑的石头上，常常是为了拍照往边上走、或者翻过了栏杆。",
    "whatEn": "In the parks actually named national parks, the most common cause of accidental death is a fall. By our count of NPS's published mortality records, these parks had 422 accidental deaths from 2014 to 2019, and 156 of them were falls, more than vehicle crashes (91) or drownings (65). Most happen at cliff edges, overlooks and on wet rocks near waterfalls, often when someone steps toward the edge for a photo or climbs over a railing.",
    "preventZh": [
      "走在步道和铺好的路上，离悬崖边至少 6 英尺（约 2 米）；有栏杆的地方绝不翻过去",
      "拍照、用望远镜时最容易忘了脚下，先站稳再拍；别倒着走，别在边上跑跳、摆姿势",
      "石头上的细沙、碎石和瀑布边的湿石头、湿木头非常滑，别在上面走、别爬",
      "砂岩、页岩一碰就碎，别攀爬、别从坡上往下滑（布莱斯的石头连人的重量都撑不住）",
      "看紧小孩，牵着手走；别往下扔石头，下面可能有人"
    ],
    "preventEn": [
      "Stay on trails and paved walkways and keep at least 6 feet (2 m) from the edge. Never climb over a railing or fence.",
      "Taking photos or using binoculars is when people forget their footing. Plant your feet first, never back up without looking, and don't run, jump or pose near the edge.",
      "Sand or pebbles on rock, and wet rocks and logs near waterfalls, are extremely slippery. Don't walk or climb on them.",
      "Sandstone and shale crumble. Don't climb cliffs or slide down slopes; at Bryce, handholds won't support anything heavier than a chipmunk.",
      "Hold children's hands near edges, and never throw or roll rocks; there may be hikers below."
    ],
    "ifZh": [
      "有人摔下去别自己冒险去救，马上打 911；没信号就派人去最近的游客中心或护林站",
      "记下位置（步道名、观景点、GPS 坐标），留人在原地指引救援"
    ],
    "ifEn": [
      "If someone falls, don't put yourself at risk trying to reach them. Call 911; if there's no signal, send someone to the nearest visitor center or ranger station.",
      "Note the exact location (trail, overlook, GPS coordinates) and leave someone in place to guide rescuers."
    ],
    "incidents": [],
    "parks": {
      "grca": {
        "zh": "离边缘至少 6 英尺（约 2 米），别翻栏杆，看好孩子",
        "en": "Stay at least 6 feet from the edge, never climb railings, and watch children."
      },
      "zion": {
        "zh": "步道上曾有人从悬崖坠落身亡；拍照时尤其要注意边缘",
        "en": "Falls from cliffs on trails have been fatal; watch the edge when using a camera."
      },
      "care": {
        "zh": "步道上的悬崖坠落会致命，石面上的沙粒很滑",
        "en": "Cliff falls on trails can be fatal, and sand on slickrock is very slippery."
      },
      "brca": {
        "zh": "岩壁一碰就碎，别攀爬、别从坡上往下滑",
        "en": "The rock crumbles; don't climb or slide down slopes."
      },
      "chis": {
        "zh": "海崖边缘可能松动、被掏空，离远点",
        "en": "Sea cliff edges can be crumbly or undercut; stay back."
      },
      "acad": {
        "zh": "悬崖边的岩架上要小心脚下",
        "en": "Watch your footing near cliff ledges."
      },
      "pefo": {
        "zh": "别靠近悬崖边和陡坡，石面不稳",
        "en": "Avoid cliff edges and steep slopes; rock surfaces are unstable."
      },
      "havo": {
        "zh": "离地缝、悬崖边、喷气孔和熔岩远一点",
        "en": "Keep away from earth cracks, cliff edges, vents and lava."
      },
      "yose": {
        "zh": "悬崖上和悬崖下都可能有落石",
        "en": "Rockfall can happen on or just below cliffs."
      },
      "glac": {
        "zh": "瀑布旁的湿石头、湿木头别走别爬",
        "en": "Never walk or climb on wet rocks or logs near waterfalls."
      },
      "hale": {
        "zh": "观景点、岩架附近容易绊倒；别跳崖、跳水",
        "en": "Tripping hazards at overlooks and ledges; don't jump or dive."
      },
      "hsbd": {
        "zh": "只有观景平台有栏杆，步道沿线的崖边约 1,000 英尺（约 300 米）高、没有护栏",
        "en": "Railings only at the overlook platform; along the trail the rim is an unfenced 1,000-foot drop."
      }
    },
    "sources": [
      {
        "title": "NPS mortality data (dashboard and spreadsheet CY2007–2026)",
        "url": "https://www.nps.gov/aboutus/mortality-data.htm"
      },
      {
        "title": "Grand Canyon: Safety",
        "url": "https://www.nps.gov/grca/planyourvisit/safety.htm"
      },
      {
        "title": "Zion: Safety",
        "url": "https://www.nps.gov/zion/planyourvisit/safety.htm"
      },
      {
        "title": "Bryce Canyon: Safety",
        "url": "https://www.nps.gov/brca/planyourvisit/safety.htm"
      },
      {
        "title": "Glen Canyon NRA: Horseshoe Bend",
        "url": "https://www.nps.gov/glca/planyourvisit/horseshoe-bend.htm"
      }
    ]
  },
  {
    "id": "water",
    "titleZh": "溺水和冰冷的河水",
    "titleEn": "Drowning and cold water",
    "whatZh": "溺水是国家公园里最常见的死因之一。我们按 NPS 公开的死亡记录统计，2014 到 2019 年所有 NPS 管理的地方一共 314 人溺水身亡，仅次于车祸（354 人）。红杉与国王峡谷、大烟山都说溺水是本园数一数二的死因。很多人本来没打算下水，是在河边滑倒掉进去的；山里的河水即使夏天也冰冷湍急，掉进去很快就没力气。",
    "whatEn": "Drowning is one of the most common causes of death in national parks. By our count of NPS's published mortality records, 314 people drowned across all NPS-managed areas from 2014 to 2019, second only to vehicle crashes (354). Sequoia and Kings Canyon and Great Smoky Mountains both name drowning among their leading causes of death. Many victims never meant to swim; they slipped on a riverbank and fell in. Mountain rivers stay icy and fast even in summer, and cold water saps strength within minutes.",
    "preventZh": [
      "河边、瀑布边的石头不管干湿都很滑，河岸会突然塌；离急流和瀑布上方远一点，别站在水边的石头上拍照",
      "春天和初夏雪化的时候河水最急最冷；水看着平静，底下的水流也可能几秒钟就把人冲走",
      "国家公园里基本没有救生员；只在指定的地方、水流平缓的时候游泳，别一个人游，看紧小孩",
      "划船、漂流每个人都要穿合身的救生衣（大提顿规定 13 岁以下必须一直穿着）",
      "过没有桥的溪流时避开深水和急流，解开背包腰带，掉下去时能把包甩掉；别在急流和瀑布上方过河",
      "海边留意离岸流和突然涌上来的大浪（“偷袭浪”），别背对大海；去之前看当地的海滩预报和旗子",
      "喝了酒、用了药别下水"
    ],
    "preventEn": [
      "Rocks along rivers and waterfalls are slippery wet or dry, and banks can crumble without warning. Stay back from rapids and the tops of waterfalls, and don't pose on streamside rocks.",
      "Rivers run fastest and coldest during spring and early-summer snowmelt. Calm-looking water can hide a current that sweeps you away in seconds.",
      "Most parks have no lifeguards. Swim only in suitable spots when water is low and slow, never swim alone, and watch children closely.",
      "Everyone boating or floating needs a properly fitted life jacket; in Grand Teton, children under 13 must wear one at all times.",
      "When crossing a stream without a bridge, avoid deep or swift water and unbuckle your pack's waist strap so you can shed it if you fall. Never cross above rapids or falls.",
      "On ocean and Great Lakes beaches, watch for rip currents and sneaker waves, never turn your back on the ocean, and check the local beach forecast and warning flags first.",
      "Don't swim after drinking alcohol or using drugs."
    ],
    "ifZh": [
      "被离岸流卷走：别逆着游回岸边，先平行于海岸游出这股水流，再斜着游回去；游不动就浮在水面上，挥手呼救"
    ],
    "ifEn": [
      "If a rip current pulls you out, don't swim against it. Swim parallel to shore until you're out of the current, then angle back. If you can't, float and wave for help."
    ],
    "incidents": [],
    "parks": {
      "seki": {
        "zh": "溺水是本园最常见的死因；河水又冷又急，很多人是滑倒落水",
        "en": "Drowning is the parks' most frequent cause of death; rivers are cold and fast, and many victims slipped in."
      },
      "grsm": {
        "zh": "车祸和溺水是本园最主要的死因",
        "en": "Vehicle crashes and drownings are the leading causes of death here."
      },
      "yose": {
        "zh": "过溪避开深水急流，别在急流和瀑布上方过；只在水位低时游泳",
        "en": "Avoid deep or swift water at crossings, never cross above rapids or falls, and swim only at low water."
      },
      "glac": {
        "zh": "湖泊和溪流夏天也冰冷，湿滑的石头和急流很危险",
        "en": "Lakes and streams are frigid even in summer; slick rocks and swift currents are deadly."
      },
      "grte": {
        "zh": "没有救生员；划船漂流必须带救生衣，13 岁以下必须穿着",
        "en": "No lifeguards; life jackets are required on boats and floats, and kids under 13 must wear one."
      },
      "redw": {
        "zh": "海边会有突然涌上来的大浪，别背对大海",
        "en": "Sneaker waves surge up beaches without warning; never turn your back on the ocean."
      },
      "indu": {
        "zh": "夏天密歇根湖常有离岸流，下水前看海滩预报",
        "en": "Rip currents are common on Lake Michigan in summer; check the beach forecast."
      },
      "acad": {
        "zh": "海水冰冷，水深会突然变深；被离岸流卷走就平行于海岸游",
        "en": "Cold water and sudden drop-offs; if caught in a rip current, swim parallel to shore."
      },
      "viis": {
        "zh": "红旗表示浪大、离岸流强，留意海滩旗子",
        "en": "Red flags mean large waves and strong rip currents; check the beach flags."
      },
      "npsa": {
        "zh": "离岸流和大浪很常见，只在指定区域游泳",
        "en": "Rip currents and strong waves are common; swim in designated areas."
      },
      "hale": {
        "zh": "山洪会把人冲进海里；海边浪大、有离岸流",
        "en": "Flash floods have washed people out to sea; rough surf and rip currents on the coast."
      },
      "cuva": {
        "zh": "划船一定穿救生衣；春天水冷，小心失温",
        "en": "Always wear a life jacket when paddling; spring water is cold enough to cause hypothermia."
      },
      "romo": {
        "zh": "溪流、湖泊和瀑布看着平静其实很危险，离远点；冬天进出水口和急流上的冰很薄",
        "en": "Streams, lakes and waterfalls are deceptively dangerous; keep your distance, and in winter ice is thin near inlets, outlets and fast water."
      },
      "olym": {
        "zh": "海岸徒步要看潮汐表，涨潮会把人困住；长藻的石头和湿漂流木很滑、会滚动",
        "en": "On coastal hikes, check the tide chart, since rising tides can trap you; algae-covered rocks and wet drift logs are slippery and can roll."
      }
    },
    "sources": [
      {
        "title": "NPS mortality data (dashboard and spreadsheet CY2007–2026)",
        "url": "https://www.nps.gov/aboutus/mortality-data.htm"
      },
      {
        "title": "Sequoia & Kings Canyon: River Safety",
        "url": "https://www.nps.gov/seki/planyourvisit/river-safety.htm"
      },
      {
        "title": "Great Smoky Mountains: Safety",
        "url": "https://www.nps.gov/grsm/planyourvisit/safety.htm"
      },
      {
        "title": "Yosemite: Safety",
        "url": "https://www.nps.gov/yose/planyourvisit/safety.htm"
      },
      {
        "title": "Glacier: Have Fun and Stay Safe",
        "url": "https://www.nps.gov/glac/planyourvisit/safety.htm"
      },
      {
        "title": "Grand Teton: Safety",
        "url": "https://www.nps.gov/grte/planyourvisit/safety.htm"
      },
      {
        "title": "Acadia: Safety",
        "url": "https://www.nps.gov/acad/planyourvisit/safety.htm"
      },
      {
        "title": "NWS: Rip Current Safety",
        "url": "https://www.weather.gov/safety/ripcurrent"
      },
      {
        "title": "Rocky Mountain: High Country Hazards",
        "url": "https://www.nps.gov/romo/planyourvisit/hazards.htm"
      },
      {
        "title": "Olympic: Hiking the Wilderness Coast",
        "url": "https://www.nps.gov/olym/planyourvisit/wilderness-coast.htm"
      }
    ]
  },
  {
    "id": "flash-flood",
    "titleZh": "山洪",
    "titleEn": "Flash floods",
    "whatZh": "西南部沙漠的峡谷、干河床和狭缝峡谷里，一场雷雨就可能在几分钟、甚至几秒钟内让水位暴涨，水墙能有 12 英尺（约 3.7 米）以上高，夹着石头和树干冲下来。下雨的地方可能在几十公里外，头顶晴空也不代表安全。锡安说，被山洪夺命的人大多是被水里的石块、杂物撞伤致死。NPS 死亡记录里 2007 到 2025 年共记了 14 起山洪死亡，数量不多，但一旦遇上很难逃。",
    "whatEn": "In desert canyons, dry washes and slot canyons of the Southwest, a single thunderstorm can raise the water within minutes or even seconds, sending a wall of water, rocks and tree trunks 12 feet high or more down the canyon. The rain may fall miles away, so blue sky overhead doesn't mean you're safe. Zion says most flash flood deaths come from blunt force trauma from rocks and debris. NPS mortality records list 14 flash flood deaths from 2007 to 2025: rare, but very hard to escape once caught.",
    "preventZh": [
      "进狭缝峡谷、干河床（比如锡安的 The Narrows）之前，看美国国家气象局（NWS）的山洪可能性预报，到游客中心问当天情况",
      "预报写着“可能”“很可能”“预计会发生”时，换一条不走峡谷的路线；“不预计”也不等于零风险",
      "7 到 9 月的季风季雷雨最多，但一年四季都可能发生",
      "出发前把路线告诉别人，回来报平安；多带点吃的喝的，以防被水困住",
      "开车遇到被水淹的路就掉头：6 英寸（约 15 厘米）深的急水能把人冲倒，1 到 2 英尺（约 30 到 60 厘米）能把车冲走"
    ],
    "preventEn": [
      "Before entering a slot canyon or dry wash (such as Zion's Narrows), check the National Weather Service flash flood potential forecast and ask at a visitor center.",
      "If the rating is Possible, Probable or Expected, choose a route that avoids narrow canyons. Even Not Expected doesn't mean zero risk.",
      "The July–September monsoon brings the most storms, but floods can happen any time of year.",
      "Leave your plans with someone and check in when you're out. Carry extra food and water in case floodwater blocks your way.",
      "Turn around, don't drown: 6 inches of moving water can knock a person off their feet, and 12 to 24 inches can carry away a car."
    ],
    "ifZh": [
      "这些是山洪要来的信号：天气变坏、云越积越多、听到雷声、水突然由清变浑、水面漂来树枝杂物、水位上涨或水流变急、上游传来越来越大的轰鸣声",
      "一旦发现，别收拾东西、别拆帐篷，马上往高处爬，越快越好",
      "不要试着过河或走进洪水里；待在高处，等水退了再走"
    ],
    "ifEn": [
      "Warning signs: worsening weather, building clouds or thunder, water turning from clear to muddy, floating debris, rising water or stronger current, and a growing roar upstream.",
      "If you see them, don't stop to pack gear or take down tents. Get to higher ground as fast as you can.",
      "Don't try to cross or enter floodwater. Stay on high ground until the water goes down."
    ],
    "incidents": [],
    "parks": {
      "zion": {
        "zh": "The Narrows 等所有狭缝峡谷都可能遇上山洪，雨可能下在很远的地方",
        "en": "The Narrows and every slot canyon can flood, even from rain falling far away."
      },
      "arch": {
        "zh": "晴天也可能发山洪；被淹的干河床别过，6 英寸深的水就能把人冲倒",
        "en": "Flash floods can happen on sunny days; never cross a flooded wash, since 6 inches of water can knock you down."
      },
      "cany": {
        "zh": "晴天也可能发山洪；被淹的干河床别过",
        "en": "Flash floods can happen on sunny days; never cross a flooded wash."
      },
      "care": {
        "zh": "7 到 9 月最多；雷声一响就离开峡谷",
        "en": "Most common July–September; if you hear thunder, get out of the gorge."
      },
      "deva": {
        "zh": "下雨或降雨可能大时别进峡谷",
        "en": "Don't hike canyons during rain or when rain is likely."
      },
      "bibe": {
        "zh": "雷雨时避开狭窄的峡谷和干河床",
        "en": "Avoid narrow canyons and dry washes during thunderstorms."
      },
      "hale": {
        "zh": "水位能在 10 分钟内涨 4 英尺（约 1.2 米），曾把人冲进海里",
        "en": "Water can rise 4 feet in 10 minutes and has washed people out to sea."
      },
      "jotr": {
        "zh": "夏天季风季可能有暴雨和洪水",
        "en": "Summer monsoons can bring heavy rain and flooding."
      },
      "sagu": {
        "zh": "7 到 9 月季风季有山洪；附近有雷雨时别走峡谷和干河床，路被淹了绝不开车过",
        "en": "Flash floods happen in the July–September monsoon; avoid canyons and washes when storms are anywhere nearby, and never drive through a flooded road."
      }
    },
    "sources": [
      {
        "title": "Zion: Flash Floods",
        "url": "https://www.nps.gov/zion/planyourvisit/flash-flood.htm"
      },
      {
        "title": "Arches: Safety",
        "url": "https://www.nps.gov/arch/planyourvisit/safety.htm"
      },
      {
        "title": "Capitol Reef: Your Safety",
        "url": "https://www.nps.gov/care/planyourvisit/safety.htm"
      },
      {
        "title": "Death Valley: Safety",
        "url": "https://www.nps.gov/deva/planyourvisit/safety.htm"
      },
      {
        "title": "Haleakalā: Safety",
        "url": "https://www.nps.gov/hale/planyourvisit/safety.htm"
      },
      {
        "title": "NPS mortality data (spreadsheet CY2007–2026)",
        "url": "https://www.nps.gov/aboutus/mortality-data.htm"
      },
      {
        "title": "Joshua Tree: Safety Guidelines for Your Visit",
        "url": "https://www.nps.gov/jotr/planyourvisit/safety-guidelines-for-your-visit-to-joshua-tree-national-park.htm"
      },
      {
        "title": "Saguaro: Hiking Safety Information",
        "url": "https://www.nps.gov/sagu/planyourvisit/hiking-safety-information.htm"
      }
    ]
  },
  {
    "id": "heat",
    "titleZh": "高温和中暑",
    "titleEn": "Heat",
    "whatZh": "西南部沙漠的公园夏天非常热：死亡谷夏天白天能到 130°F（54°C），夜里也有 90°F（32°C）；大峡谷谷底夏天白天常超过 110°F（43°C）。按 NPS 死亡记录，2014 到 2019 年所有 NPS 管理的地方有 41 人死于中暑（高温），2007 到 2025 年共 83 人，是车祸、溺水、坠落之后最常见的意外死因之一。很多人是被“下坡好走”骗了，回程爬坡时又热又累。",
    "whatEn": "Desert parks in the Southwest get extremely hot in summer: Death Valley can hit 130°F by day and stay near 90°F at night, and the inner Grand Canyon often tops 110°F. NPS mortality records show 41 heat deaths across all NPS-managed areas from 2014 to 2019, and 83 from 2007 to 2025, making heat one of the most common accidental killers after crashes, drownings and falls. Many victims are lured by an easy downhill start and then struggle on the hot climb back out.",
    "preventZh": [
      "天热时别在低海拔的谷地徒步；夏天（5 到 9 月）大峡谷建议上午 10 点到下午 4 点别在谷里爬坡",
      "多喝水，一天至少 1 加仑（约 3.8 升），同时吃东西补盐分；只喝水不吃东西也会出问题",
      "早出发、早回来，往返的时间按回程爬坡更慢来算；带够水，很多步道沿途没有水",
      "戴帽子、穿浅色衣服、涂防晒；晒伤会让身体更难散热",
      "小孩、老人和有慢性病的人尽量待在最凉快的地方；别把人或宠物留在车里"
    ],
    "preventEn": [
      "Don't hike low-elevation valleys when it's hot. In the Grand Canyon from May to September, avoid hiking uphill in the inner canyon between 10 a.m. and 4 p.m.",
      "Drink plenty of water, at least a gallon a day, and eat salty snacks to keep electrolytes up; water alone without food can also make you sick.",
      "Start early and finish early, and budget extra time for the slow, hot climb back. Carry enough water, since many trails have none.",
      "Wear a hat and light-colored clothing and use sunscreen; sunburn makes it harder for your body to cool off.",
      "Keep children, older adults and anyone with health problems in the coolest place available, and never leave people or pets in a parked car."
    ],
    "ifZh": [
      "中暑前兆（热衰竭）：大量出汗、皮肤湿冷苍白、恶心呕吐、头痛、头晕、抽筋、没力气。马上停下来，到阴凉处休息，解开衣服，用湿布降温，小口喝水；吐了、症状加重或一小时还没好就要就医",
      "热射病（严重中暑）：体温很高（103°F 约 39.4°C 以上），皮肤又红又热，意识混乱、说胡话甚至昏迷。这是急症，马上打 911",
      "等救援时把人移到阴凉处，脱掉外衣，用凉水、湿布或冰块给他降温；神志不清的人不要喂水"
    ],
    "ifEn": [
      "Heat exhaustion: heavy sweating, cold pale clammy skin, nausea or vomiting, headache, dizziness, cramps and weakness. Stop, rest in shade, loosen clothing, cool off with wet cloths and sip water. Get medical help if you're vomiting, symptoms get worse, or they last more than an hour.",
      "Heat stroke: body temperature of 103°F or higher, hot red skin, confusion or loss of consciousness. This is a medical emergency: call 911.",
      "While waiting for help, move the person to shade, remove outer clothing and cool them with water, wet cloths or ice. Don't give drinks to someone who is confused."
    ],
    "incidents": [],
    "parks": {
      "deva": {
        "zh": "世界最热的地方之一，夏天白天能到 130°F（54°C），天热时别在谷底徒步",
        "en": "One of the hottest places on Earth; summer days can hit 130°F, so don't hike the valley floor in the heat."
      },
      "grca": {
        "zh": "5 到 9 月谷底常超过 110°F（43°C），上午 10 点到下午 4 点别爬坡；救援可能等很久",
        "en": "May–September the inner canyon often tops 110°F; avoid climbing between 10 a.m. and 4 p.m., and rescues may be delayed."
      },
      "zion": {
        "zh": "沙漠环境，每人每天至少带 1 加仑（约 3.8 升）水",
        "en": "Desert environment; carry at least a gallon of water per person per day."
      },
      "arch": {
        "zh": "4 到 9 月沙漠很热，7、8 月最热，带够水",
        "en": "The desert is hot from April to September, hottest in July and August; carry plenty of water."
      },
      "cany": {
        "zh": "4 到 9 月沙漠很热，7、8 月最热，带够水",
        "en": "The desert is hot from April to September, hottest in July and August; carry plenty of water."
      },
      "bibe": {
        "zh": "冬天也可能很热，脱水在这里会致命",
        "en": "It can get very hot even in winter, and dehydration can be deadly here."
      },
      "whsa": {
        "zh": "白沙地上没有遮挡，多喝水、吃点东西",
        "en": "No shade in the dunes; keep drinking water and eating snacks."
      },
      "gumo": {
        "zh": "沙漠徒步要带够水，步道上没有水",
        "en": "Carry plenty of water for desert hikes; there is none on the trails."
      },
      "pefo": {
        "zh": "温差很大，夏天酷热",
        "en": "Temperatures swing widely, from extreme heat to bitter cold."
      },
      "hsbd": {
        "zh": "沙漠里很热，把徒步挪到一天最凉快的时候，看紧孩子和宠物",
        "en": "The desert is harsh; move your hike to the coolest part of the day and watch kids and pets."
      },
      "brca": {
        "zh": "海拔高、紫外线强，每 1 到 2 小时喝约 1 升水",
        "en": "High elevation and strong sun; drink about a quart of water every 1–2 hours."
      },
      "maca": {
        "zh": "夏天气温能超过 90°F（32°C），中暑来得很快",
        "en": "Summer temperatures can exceed 90°F, and heat illness can come on fast."
      },
      "jotr": {
        "zh": "4 到 9 月沙漠很热，7、8 月最热；每人每天至少带 1 加仑（约 3.8 升）水，吃点咸的",
        "en": "The desert is hot from April to September, hottest in July and August; carry at least a gallon of water per person per day and eat salty snacks."
      },
      "sagu": {
        "zh": "索诺兰沙漠又热又干，脱水了自己都可能没察觉；徒步每小时喝约 1 夸脱（约 1 升）水",
        "en": "The Sonoran Desert is so hot and dry that you can dehydrate without noticing; drink about a quart of water per hour of hiking."
      }
    },
    "sources": [
      {
        "title": "NPS mortality data (spreadsheet CY2007–2026)",
        "url": "https://www.nps.gov/aboutus/mortality-data.htm"
      },
      {
        "title": "Death Valley: Safety (Beat the Heat)",
        "url": "https://www.nps.gov/deva/planyourvisit/safety.htm"
      },
      {
        "title": "Grand Canyon: Summer Hiking – Hike Smart",
        "url": "https://www.nps.gov/grca/planyourvisit/hike-smart.htm"
      },
      {
        "title": "Glen Canyon NRA: Horseshoe Bend",
        "url": "https://www.nps.gov/glca/planyourvisit/horseshoe-bend.htm"
      },
      {
        "title": "CDC: Symptoms of Heat-Related Illnesses",
        "url": "https://www.cdc.gov/extreme-heat/signs-symptoms/index.html"
      },
      {
        "title": "CDC NIOSH: Heat-related Illnesses",
        "url": "https://www.cdc.gov/niosh/heat-stress/about/illnesses.html"
      },
      {
        "title": "Joshua Tree: Safety Guidelines for Your Visit",
        "url": "https://www.nps.gov/jotr/planyourvisit/safety-guidelines-for-your-visit-to-joshua-tree-national-park.htm"
      },
      {
        "title": "Saguaro: Hiking Safety Information",
        "url": "https://www.nps.gov/sagu/planyourvisit/hiking-safety-information.htm"
      }
    ]
  },
  {
    "id": "thermal",
    "titleZh": "地热和火山",
    "titleEn": "Hot springs and volcanoes",
    "whatZh": "黄石、拉森火山的间歇泉、温泉和泥浆池温度接近沸腾，有的还是强酸性；看起来结实的地面可能只是一层薄壳，下面就是滚烫的酸水。黄石说，烫伤是园里严重受伤和死亡的常见原因，已经有 20 多人掉进或走进温泉后被烫死。夏威夷火山的火山气体（主要是二氧化硫）对心脏、呼吸系统不好的人、婴儿、小孩和孕妇影响更大。",
    "whatEn": "The geysers, hot springs and mud pots of Yellowstone and Lassen Volcanic are near boiling, and some are strongly acidic. Ground that looks solid can be a thin crust over scalding acid water. Yellowstone says burns are a common cause of serious injury and death there, and more than 20 people have died after entering or falling into its hot springs. At Hawaiʻi Volcanoes, volcanic gas (mainly sulfur dioxide) is a particular risk for people with heart or breathing problems, infants, children and pregnant women.",
    "preventZh": [
      "在地热区一定走在木栈道和步道上；地上有脚印不代表那里安全，只说明有人冒了险",
      "别摸、别下温泉水，在黄石的地热水里游泳、泡澡是违法的；就算水不烫，长时间接触里面的硫酸也会伤皮肤和肺",
      "看紧小孩，别让他们在木栈道上乱跑；宠物不能进地热区和木栈道",
      "觉得头晕、恶心或闻到很浓的气味，马上离开，有毒气体会聚在低处",
      "在夏威夷火山看喷发，只去指定的观景点，别进封闭区；出发前查空气质量提醒，别用手碰“贝利的头发”（火山玻璃丝）"
    ],
    "preventEn": [
      "Always stay on boardwalks and trails in thermal areas. Footprints off the path don't mean the ground is safe; they only mean someone took a risk.",
      "Never touch or enter thermal water; swimming or bathing in Yellowstone's thermal water is illegal. Even water that isn't scalding is acidic enough to damage skin and lungs with prolonged contact.",
      "Keep children close and don't let them run on boardwalks. Pets aren't allowed in thermal areas or on boardwalks.",
      "If you feel dizzy or sick, or smell strong fumes, leave right away; toxic gases can collect in low spots.",
      "At Hawaiʻi Volcanoes, watch eruptions only from designated overlooks, never enter closed areas, check air quality alerts before you go, and don't handle Pele's hair (strands of volcanic glass)."
    ],
    "ifZh": [],
    "ifEn": [],
    "incidents": [],
    "parks": {
      "yell": {
        "zh": "20 多人死于温泉烫伤；一定走木栈道，地热区禁止带宠物",
        "en": "More than 20 people have died from hot spring burns; stay on boardwalks, and pets are banned in thermal areas."
      },
      "lavo": {
        "zh": "Bumpass Hell、Sulphur Works、Devils Kitchen 等地热区的地面可能是薄壳，下面是沸腾的酸水；2010 年有人离开步道被严重烫伤",
        "en": "At Bumpass Hell, Sulphur Works and Devils Kitchen the ground can be a thin crust over boiling acid water; a visitor who left the trail in 2010 was badly burned."
      },
      "havo": {
        "zh": "火山气体对心肺不好的人、婴儿、孩子和孕妇影响大；看喷发只在指定观景点，远离地缝和喷气孔",
        "en": "Volcanic gas affects people with heart or lung conditions, infants, children and pregnant women; view eruptions only from designated overlooks and keep away from cracks and vents."
      }
    },
    "sources": [
      {
        "title": "Yellowstone: Safety",
        "url": "https://www.nps.gov/yell/planyourvisit/safety.htm"
      },
      {
        "title": "Lassen Volcanic: Hydrothermal Areas",
        "url": "https://www.nps.gov/lavo/planyourvisit/exploring-the-hydrothermal-areas.htm"
      },
      {
        "title": "Hawaiʻi Volcanoes: Safety",
        "url": "https://www.nps.gov/havo/planyourvisit/safety.htm"
      }
    ]
  },
  {
    "id": "lightning",
    "titleZh": "雷电",
    "titleEn": "Lightning",
    "whatZh": "西部山区和西南沙漠的夏天，午后雷暴几乎天天有，常常来得很快；西南部的季风季是 7 到 9 月。NPS 死亡记录里 2007 到 2025 年有 10 人被雷击身亡，大峡谷说雷电在园里伤过人也死过人，大盆地说每年被雷电伤到的人比被野生动物伤到的还多。听得到雷声，就说明闪电已经在 10 英里（约 16 公里）以内。",
    "whatEn": "In the western mountains and Southwest deserts, afternoon thunderstorms are almost daily in summer and build fast; the Southwest monsoon runs July through September. NPS mortality records list 10 lightning deaths from 2007 to 2025. Grand Canyon says lightning has killed and injured visitors there, and Great Basin says lightning injures more people each year than wildlife. If you can hear thunder, lightning is within 10 miles.",
    "preventZh": [
      "出发前看天气预报；夏天把爬山顶、走山脊的行程放在早上，中午前下山",
      "听到雷声就马上去安全的地方：有墙有顶的建筑或者关好车窗的汽车（不是敞篷车）；凉亭、帐篷、树下都挡不了雷",
      "最后一声雷响过后等 30 分钟再出来",
      "到不了安全的地方时，离开山顶、山脊、空旷地和孤立的大树；远离水、铁栏杆、铁链和栅栏",
      "结伴的人分散开，彼此保持能看见；在森林里待在较矮的树丛中"
    ],
    "preventEn": [
      "Check the forecast before you go. In summer, plan summits and ridge walks for the morning and be down by midday.",
      "When you hear thunder, get to a safe place right away: an enclosed building or a hard-topped car with the windows up. Picnic shelters, tents and trees offer no protection.",
      "Wait 30 minutes after the last thunder before going back out.",
      "If you can't reach shelter, get off peaks, ridges, open areas and away from lone trees, and keep away from water and metal such as railings, cables and fences.",
      "In a group, spread out but stay in sight of each other. In a forest, stay near a lower stand of trees."
    ],
    "ifZh": [
      "被雷击的人身上不带电，可以马上碰他：打 911，没有呼吸、没有心跳就立刻做心肺复苏（CPR），会用的话用 AED",
      "在没有遮挡的高处被雷雨困住：尽快往低处走，别躲在大石头下或浅洞里"
    ],
    "ifEn": [
      "Lightning victims carry no charge and are safe to touch. Call 911, and if they're not breathing or have no pulse, start CPR right away and use an AED if one is available.",
      "If a storm catches you high and exposed, keep moving down to lower ground; don't shelter under rock overhangs or in shallow caves."
    ],
    "incidents": [],
    "parks": {
      "grca": {
        "zh": "季风季雷暴带来闪电，园里有人被雷击伤亡",
        "en": "Monsoon storms bring deadly lightning; visitors here have been killed and injured."
      },
      "grba": {
        "zh": "雷电每年伤到的人比野生动物还多",
        "en": "Lightning injures more people every year than wildlife."
      },
      "zion": {
        "zh": "7 到 9 月季风季雷暴频繁",
        "en": "Frequent thunderstorms during the July–September monsoon."
      },
      "arch": {
        "zh": "听到雷声马上找地方躲，等 30 分钟没雷声再走",
        "en": "Take shelter at the first thunder and wait 30 minutes after the last."
      },
      "cany": {
        "zh": "听到雷声马上找地方躲，等 30 分钟没雷声再走",
        "en": "Take shelter at the first thunder and wait 30 minutes after the last."
      },
      "brca": {
        "zh": "全年都有雷电危险，夏天最多；听到雷声就是在 10 英里以内",
        "en": "A year-round danger, worst in summer; if you hear thunder, lightning is within 10 miles."
      },
      "grte": {
        "zh": "夏天午后常有雷暴，避开山顶、山脊和空旷地",
        "en": "Afternoon storms are common in summer; avoid summits, ridges and open areas."
      },
      "yell": {
        "zh": "夏天午后常有雷暴，离开水面、山脊和空旷地",
        "en": "Afternoon storms in summer; get off the water, ridges and open areas."
      },
      "yose": {
        "zh": "夏天午后常有闪电，留意天气变化，备好撤退计划",
        "en": "Lightning is common on summer afternoons; watch the sky and have a plan."
      },
      "meve": {
        "zh": "夏天午后常有雷暴，来得很快",
        "en": "Afternoon thunderstorms are common in summer and arrive quickly."
      },
      "crla": {
        "zh": "7 到 9 月夏季雷暴",
        "en": "Summer thunderstorms July–September."
      },
      "chir": {
        "zh": "7 到 9 月季风季，一听到雷声马上躲",
        "en": "July–September monsoon; take shelter at the first thunder."
      },
      "gumo": {
        "zh": "雷雨来得快，避开山顶、山脊和平坦的空地",
        "en": "Storms build quickly; avoid hilltops, ridges and flat open areas."
      },
      "badl": {
        "zh": "闪电可能在暴雨来之前就落下，避开树、高处和干河床",
        "en": "Lightning can strike well ahead of a storm; avoid trees, high places and dry washes."
      },
      "bibe": {
        "zh": "雷电时放低身体，避开山脊",
        "en": "Stay low and avoid ridges during lightning."
      },
      "shen": {
        "zh": "预计有雷暴时别去高处",
        "en": "Avoid high places when storms are forecast."
      },
      "blca": {
        "zh": "避开高的东西和栏杆，结伴的人分散开",
        "en": "Avoid tall objects and railings, and spread your group out."
      },
      "hosp": {
        "zh": "春夏常有大雨和雷电",
        "en": "Heavy rain and lightning are common in spring and summer."
      },
      "jotr": {
        "zh": "夏天季风季有雷电、大风和冰雹",
        "en": "Summer monsoons bring lightning, wind and hail."
      },
      "sagu": {
        "zh": "看到闪电马上找安全的地方，避开山顶、山脊和平坦的空地",
        "en": "If you see lightning, move quickly to safety and avoid hilltops, ridges and flat open areas."
      },
      "romo": {
        "zh": "6 到 9 月闪电常见；高山苔原上你就是最高的东西，早出发，午后雷暴来之前回到林线以下",
        "en": "Lightning is common June–September; on the treeless tundra you are the tallest thing around, so start early and get below treeline before afternoon storms."
      }
    },
    "sources": [
      {
        "title": "NWS: Lightning Safety When Outdoors",
        "url": "https://www.weather.gov/safety/lightning-outdoors"
      },
      {
        "title": "NPS mortality data (spreadsheet CY2007–2026)",
        "url": "https://www.nps.gov/aboutus/mortality-data.htm"
      },
      {
        "title": "Grand Canyon: Safety",
        "url": "https://www.nps.gov/grca/planyourvisit/safety.htm"
      },
      {
        "title": "Great Basin: Safety",
        "url": "https://www.nps.gov/grba/planyourvisit/safety.htm"
      },
      {
        "title": "Bryce Canyon: Safety",
        "url": "https://www.nps.gov/brca/planyourvisit/safety.htm"
      },
      {
        "title": "Grand Teton: Safety",
        "url": "https://www.nps.gov/grte/planyourvisit/safety.htm"
      },
      {
        "title": "Arches: Safety",
        "url": "https://www.nps.gov/arch/planyourvisit/safety.htm"
      },
      {
        "title": "NWS: Lightning Safety overview (first aid, myths)",
        "url": "https://www.weather.gov/safety/lightning-safety-overview"
      },
      {
        "title": "Joshua Tree: Safety Guidelines for Your Visit",
        "url": "https://www.nps.gov/jotr/planyourvisit/safety-guidelines-for-your-visit-to-joshua-tree-national-park.htm"
      },
      {
        "title": "Saguaro: Hiking Safety Information",
        "url": "https://www.nps.gov/sagu/planyourvisit/hiking-safety-information.htm"
      },
      {
        "title": "Rocky Mountain: Lightning Safety",
        "url": "https://www.nps.gov/romo/planyourvisit/lightning-safety.htm"
      }
    ]
  },
  {
    "id": "altitude",
    "titleZh": "高原反应",
    "titleEn": "Altitude sickness",
    "whatZh": "西部很多公园海拔都在 2,000 米以上：黄石大部分地方超过 1 英里（约 1,600 米），甘尼森黑峡谷的峡谷边约 8,000 英尺（2,440 米），布莱斯最高 9,115 英尺（2,778 米），那里的氧气只有海平面的七成左右。从低海拔飞过来的人，第一两天就算只是轻松散步、开车，也可能头痛、气短、恶心、睡不好。严重的高原病很少见（NPS 死亡记录里 2007 到 2025 年只记了 1 起），但有心肺病、贫血的人反应会更明显。",
    "whatEn": "Many western parks sit above 6,500 feet: most of Yellowstone is over a mile high, the Black Canyon rim is about 8,000 feet, and Bryce tops out at 9,115 feet, where you get only about 70% of the oxygen you're used to. Visitors flying in from low elevations can get headaches, shortness of breath, nausea and poor sleep in the first day or two, even on an easy walk or a scenic drive. Severe altitude illness is rare (NPS mortality records list one altitude death from 2007 to 2025), but people with heart or lung conditions or anemia may feel it more.",
    "preventZh": [
      "头一两天放慢节奏，别一下飞机就去爬高山，让身体慢慢适应",
      "多喝水，少喝酒和咖啡，少量多餐",
      "布莱斯、黑峡谷这类步道从顶上往下走，回程全是上坡，累之前就往回走",
      "有心脏病、肺病、贫血的人出发前问问医生"
    ],
    "preventEn": [
      "Take it easy for the first day or two instead of heading straight for high trails after you land.",
      "Drink plenty of water, go easy on alcohol and caffeine, and eat light, frequent meals.",
      "At parks like Bryce and Black Canyon, trails start at the rim, so the return is all uphill. Turn back before you get tired.",
      "If you have heart or lung disease or anemia, check with your doctor before the trip."
    ],
    "ifZh": [
      "出现头痛、气喘、心跳快、恶心、没胃口、没力气、头晕：别再往高处走，停下休息、喝水",
      "休息后不好转就往低处走；如果意识混乱、走路不稳、躺着也喘不过气，这是急症，马上下撤并打 911"
    ],
    "ifEn": [
      "Headache, fast breathing or pulse, nausea, loss of appetite, low energy or dizziness are signs not to go any higher. Stop, rest and drink water.",
      "If you don't improve with rest, go lower. Confusion, stumbling, or breathlessness even at rest is an emergency: descend right away and call 911."
    ],
    "incidents": [],
    "parks": {
      "yell": {
        "zh": "大部分地方海拔超过 1 英里（约 1,600 米），轻松散步、开车也可能有高原反应",
        "en": "Most of the park is over a mile high; even easy walks or drives can bring on altitude sickness."
      },
      "brca": {
        "zh": "最高 9,115 英尺（2,778 米），氧气约为平时的七成；步道回程都是上坡",
        "en": "Up to 9,115 feet, with about 70% of the oxygen you're used to; trails end with an uphill return."
      },
      "blca": {
        "zh": "峡谷边海拔约 8,000 英尺（2,440 米）",
        "en": "The rim is about 8,000 feet."
      },
      "meve": {
        "zh": "海拔 7,000 到 8,400 英尺（2,134 到 2,560 米），脱水和高原反应是常见病因",
        "en": "7,000–8,400 feet; dehydration and altitude sickness are common causes of illness here."
      },
      "grsa": {
        "zh": "适应要一两天，多喝水、少喝酒和咖啡、慢慢走",
        "en": "Allow a day or two to adjust; drink plenty, avoid alcohol and caffeine, and go slowly."
      },
      "grba": {
        "zh": "海拔高，加上剧烈运动容易引起高原反应",
        "en": "High elevations plus strenuous activity can bring on altitude sickness."
      },
      "chir": {
        "zh": "海拔 5,400 到 7,300 英尺（1,646 到 2,225 米），贫血、心肺病的人反应更明显",
        "en": "5,400–7,300 feet; anemia or heart and lung conditions can make it worse."
      },
      "pefo": {
        "zh": "海拔高、太阳强，注意补水休息",
        "en": "High elevation and strong sun; stay hydrated and rest."
      },
      "whsa": {
        "zh": "海拔 4,235 英尺（1,291 米），从低处来的人要适应",
        "en": "4,235 feet; visitors from lower elevations should acclimate."
      },
      "hale": {
        "zh": "步道海拔在 6,380 到 9,780 英尺（1,945 到 2,981 米）之间，往回爬的时间按下去的两倍算",
        "en": "Trails range from 6,380 to 9,780 feet; plan twice as long to hike out as in."
      },
      "romo": {
        "zh": "海拔高容易脱水、晒伤和高原反应（头痛、恶心、头晕），不舒服就往低处走",
        "en": "High elevation raises the risk of dehydration, sunburn and altitude sickness (headache, nausea, dizziness); if you feel sick, go lower."
      }
    },
    "sources": [
      {
        "title": "Yellowstone: Safety (altitude sickness)",
        "url": "https://www.nps.gov/yell/planyourvisit/safety.htm"
      },
      {
        "title": "Bryce Canyon: Safety",
        "url": "https://www.nps.gov/brca/planyourvisit/safety.htm"
      },
      {
        "title": "Black Canyon of the Gunnison: Safety",
        "url": "https://www.nps.gov/blca/planyourvisit/safety.htm"
      },
      {
        "title": "Mesa Verde: Be Safe & Know the Rules",
        "url": "https://www.nps.gov/meve/planyourvisit/safety.htm"
      },
      {
        "title": "Great Sand Dunes: Safety",
        "url": "https://www.nps.gov/grsa/planyourvisit/safety.htm"
      },
      {
        "title": "Chiricahua: Safety",
        "url": "https://www.nps.gov/chir/planyourvisit/safety.htm"
      },
      {
        "title": "NPS mortality data (spreadsheet CY2007–2026)",
        "url": "https://www.nps.gov/aboutus/mortality-data.htm"
      },
      {
        "title": "Rocky Mountain: High Country Hazards",
        "url": "https://www.nps.gov/romo/planyourvisit/hazards.htm"
      }
    ]
  },
  {
    "id": "cold",
    "titleZh": "失温",
    "titleEn": "Hypothermia",
    "whatZh": "失温不只发生在冬天：黄石说大多数失温出现在 30 到 50°F（−1 到 10°C）的天气，淋了雨、吹了风、掉进冷水，夏天也会发生。阿拉斯加的公园夏天也常是阴雨、只有十几度；锡安的狭缝峡谷里泡在水里，体温掉得最快。NPS 死亡记录里 2014 到 2019 年有 19 人死于失温，2007 到 2025 年共 46 人；大弯也说失温在那里夺走过人命。",
    "whatEn": "Hypothermia isn't just a winter problem. Yellowstone says most cases happen when it's 30–50°F, and rain, wind or a fall into cold water can cause it even in summer. Alaska's parks are often rainy and in the 40s to 60s°F in summer, and wading in Zion's narrow canyons drains body heat fastest. NPS mortality records list 19 hypothermia deaths from 2014 to 2019 and 46 from 2007 to 2025; Big Bend notes hypothermia has taken lives there too.",
    "preventZh": [
      "带雨衣和保暖的衣服，分层穿；别穿棉质衣服，湿了就完全不保暖，换成羊毛或化纤",
      "还没淋湿就穿上雨衣，还没开始发抖就加衣服；戴帽子和手套",
      "感到冷之前就吃点高能量的东西",
      "又湿又冷保持不了干暖时，就改计划、往回走；按队里体力最弱的人来安排",
      "沙漠公园昼夜温差很大，夏天也要带一件外套"
    ],
    "preventEn": [
      "Bring rain gear and warm layers. Skip cotton, which doesn't insulate when wet; choose wool or synthetics.",
      "Put on rain gear before you get wet and warm layers before you start shivering. Wear a hat and gloves.",
      "Eat high-energy food before you get chilled.",
      "If you can't stay warm and dry, change your plans and turn back. You're only as strong as the weakest person in your group.",
      "Desert parks swing widely between day and night, so carry a jacket even in summer."
    ],
    "ifZh": [
      "失温的信号：止不住地发抖、走路不稳、手脚不灵、很累、说话含糊、意识混乱、犯困",
      "发现了就停下来，找地方躲开风雨，马上把湿衣服换成干衣服，钻进睡袋",
      "给他喝热的饮料（不要酒），用自己的体温帮他取暖；情况严重或不好转就打 911",
      "在冷水里等救援时，缩成一团保存体温"
    ],
    "ifEn": [
      "Warning signs: uncontrollable shivering, stumbling and poor coordination, fatigue, slurred speech, confusion and drowsiness.",
      "Stop, get out of the wind and rain, change wet clothes for dry ones right away, and get into a sleeping bag.",
      "Give warm, non-alcoholic drinks and share body heat. Call 911 if it's severe or not improving.",
      "If you're in cold water waiting for rescue, pull into a ball to conserve body heat."
    ],
    "incidents": [],
    "parks": {
      "yell": {
        "zh": "全年都可能失温，夏夜也可能降到 20 多°F（零下几度）",
        "en": "A year-round risk; summer nights can drop into the 20s°F."
      },
      "grte": {
        "zh": "冰川湖和蛇河夏天也常低于 60°F（16°C），落水后很快失温",
        "en": "Glacial lakes and the Snake River often stay below 60°F, even in summer; hypothermia sets in fast after a fall."
      },
      "glac": {
        "zh": "湖泊和溪流夏天也冰冷",
        "en": "Lakes and streams are frigid even in summer."
      },
      "zion": {
        "zh": "狭缝峡谷里泡在水里最容易失温",
        "en": "Wading in narrow canyons is the quickest way to lose body heat."
      },
      "care": {
        "zh": "峡谷探险和徒步淋湿后容易失温",
        "en": "Getting wet while canyoneering or hiking can lead to hypothermia."
      },
      "dena": {
        "zh": "亚北极地区，夏天下雨阴冷是常事",
        "en": "Subarctic: rainy, chilly summer days are normal."
      },
      "kefj": {
        "zh": "亚北极地区，夏天下雨阴冷是常事",
        "en": "Subarctic: rainy, chilly summer days are normal."
      },
      "glba": {
        "zh": "夏天白天一般只有 45 到 65°F（7 到 18°C）",
        "en": "Summer days are usually only 45–65°F."
      },
      "kova": {
        "zh": "又湿又有风的日子，不觉得冷也会失温",
        "en": "Hypothermia can set in on a windy, wet day even when it doesn't feel that cold."
      },
      "wrst": {
        "zh": "高山荒野，天气多变",
        "en": "Mountain wilderness with fast-changing weather."
      },
      "crla": {
        "zh": "冬天穿得不够、待太久或者衣服湿了容易失温",
        "en": "Winter visitors who are underdressed, out too long or wet are at risk."
      },
      "grba": {
        "zh": "沙漠里的冬天也很冷，高于冰点时也会失温",
        "en": "Desert winters are cold, and hypothermia can strike well above freezing."
      },
      "whsa": {
        "zh": "这里曾有人死于中暑、失温、脱水和迷路",
        "en": "People have died here of heat illness, hypothermia, dehydration and getting lost."
      },
      "bibe": {
        "zh": "冬季风暴来得快，失温和雷电都在这里夺过人命",
        "en": "Winter storms move in quickly; hypothermia and lightning have both taken lives here."
      },
      "indu": {
        "zh": "冬天注意冻伤和失温",
        "en": "Watch for frostbite and hypothermia in winter."
      },
      "cuva": {
        "zh": "春天划船水冷，小心失温",
        "en": "Spring paddling means cold water and hypothermia risk."
      },
      "banf": {
        "zh": "冬天有雪崩危险，园里每年有几千次雪崩，出发前看雪崩预报",
        "en": "Thousands of avalanches occur in the park every year; check avalanche conditions before winter outings."
      },
      "romo": {
        "zh": "高山上随时可能失温",
        "en": "Hypothermia is a risk in the high country."
      },
      "olym": {
        "zh": "园方说失温是户外头号杀手，50°F（10°C）也会发生；穿羊毛或化纤，别穿棉",
        "en": "The park calls hypothermia the number one killer outdoors; it can happen at 50°F, so wear wool or synthetics, not cotton."
      }
    },
    "sources": [
      {
        "title": "Yellowstone: Safety (hypothermia)",
        "url": "https://www.nps.gov/yell/planyourvisit/safety.htm"
      },
      {
        "title": "Zion: Safety (hypothermia)",
        "url": "https://www.nps.gov/zion/planyourvisit/safety.htm"
      },
      {
        "title": "Capitol Reef: Your Safety",
        "url": "https://www.nps.gov/care/planyourvisit/safety.htm"
      },
      {
        "title": "Grand Teton: Safety",
        "url": "https://www.nps.gov/grte/planyourvisit/safety.htm"
      },
      {
        "title": "Big Bend: Safety",
        "url": "https://www.nps.gov/bibe/planyourvisit/safety.htm"
      },
      {
        "title": "Glacier Bay: Safety",
        "url": "https://www.nps.gov/glba/planyourvisit/safety.htm"
      },
      {
        "title": "Parks Canada: Banff safety and guidelines",
        "url": "https://parks.canada.ca/pn-np/ab/banff/securite-safety"
      },
      {
        "title": "NPS mortality data (spreadsheet CY2007–2026)",
        "url": "https://www.nps.gov/aboutus/mortality-data.htm"
      },
      {
        "title": "Rocky Mountain: High Country Hazards",
        "url": "https://www.nps.gov/romo/planyourvisit/hazards.htm"
      },
      {
        "title": "Olympic: Wilderness Safety",
        "url": "https://www.nps.gov/olym/planyourvisit/wilderness-safety.htm"
      }
    ]
  },
  {
    "id": "driving",
    "titleZh": "开车",
    "titleEn": "Driving",
    "whatZh": "看全部 NPS 管理的地方，车祸是意外死亡的头号原因：按 NPS 死亡记录，2014 到 2019 年有 354 人死于车祸，比溺水和坠落都多。黄石说交通事故是园里受伤和死亡最常见的原因；死亡谷说那里大多数死亡是单车翻车；大烟山每年都有酒驾致死。公园的路多是弯道、陡坡、没有路肩，还常有动物横穿和停在路中间看动物的车。",
    "whatEn": "Across all NPS-managed areas, vehicle crashes are the leading cause of accidental death: NPS mortality records show 354 crash deaths from 2014 to 2019, more than drownings or falls. Yellowstone says traffic accidents are the most common cause of injury and death in the park, Death Valley says most of its deaths are single-vehicle rollovers, and Great Smoky Mountains sees several alcohol-related deaths every year. Park roads are winding and steep, often without shoulders, with animals crossing and cars stopped to watch wildlife.",
    "preventZh": [
      "按限速开：黄石一般 45 英里/时（约 72 公里/时），锡安、仙纳度大多 35 英里/时（约 56 公里/时），火山口湖 35 到 45，慢行区 20",
      "所有人都系安全带，小孩坐安全座椅；喝了酒绝不开车",
      "长下坡挂低挡，别一直踩刹车；山路弯多、有盲弯和陡崖，别越过中线",
      "停车看风景、看动物一定开进路边的停车带，四个轮子都离开车道；别在路中间停车，堵车时耐心等",
      "清晨、黄昏和夜里动物最常横穿马路，开慢一点；冬天下雪结冰时按要求装防滑链",
      "很多地方没信号、加油站很少，出发前加满油，告诉别人你的路线"
    ],
    "preventEn": [
      "Obey speed limits: 45 mph in most of Yellowstone, 35 mph on most of Zion's roads and Skyline Drive, 35–45 at Crater Lake with 20 mph slow zones.",
      "Everyone buckles up, kids ride in car seats, and never drive after drinking.",
      "Shift into a low gear on long downgrades instead of riding the brakes. Mountain roads have blind curves and steep drop-offs; stay in your lane.",
      "To stop for views or wildlife, pull completely into a turnout with all four wheels off the road. Never stop in the travel lane, and be patient in wildlife jams.",
      "Slow down at dawn, dusk and night, when animals cross most often, and carry chains when they're required in snow and ice.",
      "Cell service and gas stations are scarce. Fill up before you go and share your route with someone."
    ],
    "ifZh": [],
    "ifEn": [],
    "incidents": [],
    "parks": {
      "yell": {
        "zh": "交通事故是园里受伤和死亡最常见的原因；限速一般 45 英里/时，路边常因看野牛、熊堵车",
        "en": "Traffic accidents are the top cause of injury and death; most roads are 45 mph, and bison and bear jams are common."
      },
      "deva": {
        "zh": "大多数死亡是单车翻车：路长弯多，长下坡挂低挡，一定系安全带",
        "en": "Most deaths are single-vehicle rollovers on long, winding roads; use low gear on downgrades and wear seatbelts."
      },
      "grsm": {
        "zh": "山路窄、弯多、有盲弯和陡崖，车祸和溺水是主要死因，每年都有酒驾致死",
        "en": "Narrow, winding roads with blind curves and drop-offs; crashes and drownings are the leading causes of death, and alcohol-related crashes kill several people every year."
      },
      "zion": {
        "zh": "限速一般 35 英里/时，雷达测速；全车都要系安全带，小孩坐安全座椅",
        "en": "Usually 35 mph and radar-enforced; seatbelts and child seats are required."
      },
      "shen": {
        "zh": "天际线公路限速大多 35 英里/时，鹿、黑熊、野火鸡常横穿",
        "en": "Skyline Drive is mostly 35 mph; deer, black bears and wild turkeys cross often."
      },
      "crla": {
        "zh": "限速 35 到 45 英里/时，慢行区 20；超速会撞死熊和其他动物",
        "en": "35–45 mph with 20 mph slow zones; speeding kills bears and other wildlife."
      },
      "yose": {
        "zh": "雪天按要求装防滑链；超速会撞死熊",
        "en": "Use chains when required in snow and ice; speeding kills bears."
      },
      "bibe": {
        "zh": "园内最高限速 45 英里/时，夜里留意路边的西貒（长得像野猪）、鹿和兔子；野路要高底盘四驱",
        "en": "45 mph maximum; watch for javelina, deer and rabbits at night, and backcountry roads need high-clearance 4WD."
      },
      "meve": {
        "zh": "山路陡、窄、弯多，别在路上停车",
        "en": "Steep, narrow, winding road; don't stop in the roadway."
      },
      "thro": {
        "zh": "限速严格执行，弯路多、动物多",
        "en": "Speed limits are enforced; winding roads and lots of wildlife."
      },
      "badl": {
        "zh": "砂石路湿的时候比限速再慢 5 到 10 英里/时",
        "en": "On wet gravel roads, drive 5–10 mph below the posted limit."
      },
      "acad": {
        "zh": "全程系安全带，别酒驾",
        "en": "Wear seatbelts at all times and never drink and drive."
      },
      "jotr": {
        "zh": "路窄弯多、路肩松软；别在路上停车看动物、拍照，留意横穿马路的沙漠龟",
        "en": "Narrow, winding roads with soft shoulders; never stop in the road for photos or wildlife, and watch for tortoises crossing."
      }
    },
    "sources": [
      {
        "title": "NPS mortality data (dashboard and spreadsheet CY2007–2026)",
        "url": "https://www.nps.gov/aboutus/mortality-data.htm"
      },
      {
        "title": "Yellowstone: Safety (driving)",
        "url": "https://www.nps.gov/yell/planyourvisit/safety.htm"
      },
      {
        "title": "Death Valley: Safety",
        "url": "https://www.nps.gov/deva/planyourvisit/safety.htm"
      },
      {
        "title": "Great Smoky Mountains: Safety",
        "url": "https://www.nps.gov/grsm/planyourvisit/safety.htm"
      },
      {
        "title": "Zion: Safety",
        "url": "https://www.nps.gov/zion/planyourvisit/safety.htm"
      },
      {
        "title": "Shenandoah: Safety",
        "url": "https://www.nps.gov/shen/planyourvisit/safety.htm"
      },
      {
        "title": "Crater Lake: Safety",
        "url": "https://www.nps.gov/crla/planyourvisit/safety.htm"
      },
      {
        "title": "Joshua Tree: Safety Guidelines for Your Visit",
        "url": "https://www.nps.gov/jotr/planyourvisit/safety-guidelines-for-your-visit-to-joshua-tree-national-park.htm"
      }
    ]
  }
];

/** 每座公园官方的安全页面（没有的用“行前须知”页） */
export const parkSafetyPages: Record<string, string> = {
  "yose": "https://www.nps.gov/yose/planyourvisit/safety.htm",
  "seki": "https://www.nps.gov/seki/planyourvisit/safety.htm",
  "pinn": "https://www.nps.gov/pinn/planyourvisit/safety.htm",
  "chis": "https://www.nps.gov/chis/planyourvisit/safety.htm",
  "jotr": "https://www.nps.gov/jotr/planyourvisit/safety-guidelines-for-your-visit-to-joshua-tree-national-park.htm",
  "redw": "https://www.nps.gov/redw/planyourvisit/safety.htm",
  "lavo": "https://www.nps.gov/lavo/planyourvisit/safety.htm",
  "crla": "https://www.nps.gov/crla/planyourvisit/safety.htm",
  "mora": "https://www.nps.gov/mora/planyourvisit/safety.htm",
  "olym": "https://www.nps.gov/olym/planyourvisit/index.htm",
  "noca": "https://www.nps.gov/noca/planyourvisit/safety.htm",
  "yell": "https://www.nps.gov/yell/planyourvisit/safety.htm",
  "grte": "https://www.nps.gov/grte/planyourvisit/safety.htm",
  "glac": "https://www.nps.gov/glac/planyourvisit/safety.htm",
  "romo": "https://www.nps.gov/romo/planyourvisit/index.htm",
  "meve": "https://www.nps.gov/meve/planyourvisit/safety.htm",
  "grsa": "https://www.nps.gov/grsa/planyourvisit/safety.htm",
  "blca": "https://www.nps.gov/blca/planyourvisit/safety.htm",
  "deva": "https://www.nps.gov/deva/planyourvisit/safety.htm",
  "zion": "https://www.nps.gov/zion/planyourvisit/safety.htm",
  "brca": "https://www.nps.gov/brca/planyourvisit/safety.htm",
  "grca": "https://www.nps.gov/grca/planyourvisit/safety.htm",
  "grba": "https://www.nps.gov/grba/planyourvisit/safety.htm",
  "arch": "https://www.nps.gov/arch/planyourvisit/safety.htm",
  "cany": "https://www.nps.gov/cany/planyourvisit/safety.htm",
  "care": "https://www.nps.gov/care/planyourvisit/safety.htm",
  "pefo": "https://www.nps.gov/pefo/planyourvisit/safety.htm",
  "whsa": "https://www.nps.gov/whsa/planyourvisit/safety.htm",
  "cave": "https://www.nps.gov/cave/planyourvisit/safety.htm",
  "sagu": "https://www.nps.gov/sagu/planyourvisit/safety-information.htm",
  "chir": "https://www.nps.gov/chir/planyourvisit/safety.htm",
  "gumo": "https://www.nps.gov/gumo/planyourvisit/safety.htm",
  "bibe": "https://www.nps.gov/bibe/planyourvisit/safety.htm",
  "badl": "https://www.nps.gov/badl/planyourvisit/safety.htm",
  "wica": "https://www.nps.gov/wica/planyourvisit/safety.htm",
  "thro": "https://www.nps.gov/thro/planyourvisit/safety.htm",
  "cuva": "https://www.nps.gov/cuva/planyourvisit/safety.htm",
  "indu": "https://www.nps.gov/indu/planyourvisit/safety.htm",
  "jeff": "https://www.nps.gov/jeff/planyourvisit/index.htm",
  "isro": "https://www.nps.gov/isro/planyourvisit/safety.htm",
  "voya": "https://www.nps.gov/voya/planyourvisit/safety.htm",
  "dena": "https://www.nps.gov/dena/planyourvisit/safety.htm",
  "kefj": "https://www.nps.gov/kefj/planyourvisit/safety.htm",
  "wrst": "https://www.nps.gov/wrst/planyourvisit/safety.htm",
  "glba": "https://www.nps.gov/glba/planyourvisit/safety.htm",
  "katm": "https://www.nps.gov/katm/planyourvisit/safety.htm",
  "lacl": "https://www.nps.gov/lacl/planyourvisit/safety.htm",
  "gaar": "https://www.nps.gov/gaar/planyourvisit/safety.htm",
  "kova": "https://www.nps.gov/kova/planyourvisit/safety.htm",
  "havo": "https://www.nps.gov/havo/planyourvisit/safety.htm",
  "hale": "https://www.nps.gov/hale/planyourvisit/safety.htm",
  "npsa": "https://www.nps.gov/npsa/planyourvisit/safety.htm",
  "grsm": "https://www.nps.gov/grsm/planyourvisit/safety.htm",
  "shen": "https://www.nps.gov/shen/planyourvisit/safety.htm",
  "neri": "https://www.nps.gov/neri/planyourvisit/safety.htm",
  "maca": "https://www.nps.gov/maca/planyourvisit/safety.htm",
  "cong": "https://www.nps.gov/cong/planyourvisit/safety.htm",
  "hosp": "https://www.nps.gov/hosp/planyourvisit/safety.htm",
  "acad": "https://www.nps.gov/acad/planyourvisit/safety.htm",
  "ever": "https://www.nps.gov/ever/planyourvisit/safety.htm",
  "bisc": "https://www.nps.gov/bisc/planyourvisit/safety.htm",
  "drto": "https://www.nps.gov/drto/planyourvisit/safety.htm",
  "viis": "https://www.nps.gov/viis/planyourvisit/safety.htm",
  "banf": "https://parks.canada.ca/pn-np/ab/banff/securite-safety",
  "jasp": "https://parks.canada.ca/pn-np/ab/jasper/securite-safety",
  "yoho": "https://parks.canada.ca/pn-np/bc/yoho/securite-safety",
  "ante": "https://navajonationparks.org/navajo-tribal-parks/lake-powell/",
  "hsbd": "https://www.nps.gov/glca/planyourvisit/horseshoe-bend.htm",
  "mova": "https://navajonationparks.org/navajo-tribal-parks/monument-valley/",
  "wave": "https://www.blm.gov/visit/paria-canyon-vermilion-cliffs-wilderness"
};
