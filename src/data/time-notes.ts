/**
 * 时区的坑：一座公园跨两个时区、同一个地方不同的项目按不同的时间计时、手机在州界和保留地边上自己跳时区。
 * 公园页的“时区”和行程里那天的提醒都用这里。2026-10-16 按 NPS、Recreation.gov、各导览公司和省政府页面整理
 * （调研记录见 docs/archive/audit/2026-10-16/timezones.md）。
 *
 * 行程本身已经按景点的时区换算（planner.ts 的 localShifts）：一天的时间按当天第一站的时区写，
 * 别的时区的景点开门、班次、停车场时间先换算过来，卡片上另外写当地时间。这里是给人看的说明。
 */
export interface TimeNote {
  park: string;
  /**
   * 什么时候才有差别：dst 是美国夏令时期间（3 月第二个周日到 11 月第一个周日，亚利桑那和纳瓦霍保留地、犹他差 1 小时），
   * winter 是那以外的日子（2026 年 11 月起艾伯塔不再拨回冬令时，冬天比蒙大拿快 1 小时）；不写是全年
   */
  when?: "dst" | "winter";
  /** 当地人对这里时间的叫法，和时区的一般叫法不一样时写（纪念碑谷是“纳瓦霍时间”，时区是山地时间） */
  zoneZh?: string;
  noteZh: string;
  sources: string[];
  checked: string;
}

const CHECKED = "2026-10-16";

export const timeNotes: TimeNote[] = [
  {
    park: "ante",
    when: "dst",
    noteZh:
      "羚羊峡谷在纳瓦霍保留地上，保留地实行夏令时，但每一家导览公司和 Antelope Point 码头都按亚利桑那时间（全年不调夏令时，和佩吉、凤凰城一样）。3 月到 11 月初手机常连上犹他或保留地的基站，自动快 1 小时；Ken's Tours 直接写“不是犹他时间，也不是纳瓦霍时间”，建议把手机时区手动设成凤凰城（Phoenix），按预订确认邮件上的时间到。",
    sources: [
      "https://lowerantelope.com/terms-of-service/",
      "https://www.antelopecanyon-x.com/faq/",
      "https://antelopepointlakepowell.com/guest-service/",
      "https://www.nps.gov/glca/planyourvisit/seasonalhours.htm",
    ],
    checked: CHECKED,
  },
  {
    park: "hsbd",
    when: "dst",
    noteZh:
      "佩吉、马蹄湾、Wahweap、Lees Ferry 都按亚利桑那时间；Lone Rock 虽然在犹他境内，营地和收费站也按亚利桑那时间。湖北边的 Bullfrog、Halls Crossing、Hite 按犹他时间，夏天快 1 小时。佩吉离犹他州界不到 7 英里，夏天手机常自己快 1 小时，订了游船、皮划艇的按亚利桑那时间到。",
    sources: ["https://www.nps.gov/glca/planyourvisit/seasonalhours.htm", "https://lakepowelladventure.com/current-time-in-page-arizona"],
    checked: CHECKED,
  },
  {
    park: "mova",
    when: "dst",
    zoneZh: "纳瓦霍时间",
    noteZh:
      "纪念碑谷在纳瓦霍保留地上，按纳瓦霍时间：实行夏令时，和犹他一样。3 月到 11 月初比佩吉、大峡谷快 1 小时（佩吉 8 点 = 纪念碑谷 9 点），Valley Drive 的最晚入场时间也是纳瓦霍时间；从佩吉沿 160 号公路过来，手机会在 Tuba City、Kayenta 一带跳过去。冬天两边一样。",
    sources: ["https://www.nps.gov/cach/planyourvisit/hours.htm", "https://navajonationparks.org/navajo-tribal-parks/monument-valley/"],
    checked: CHECKED,
  },
  {
    park: "wave",
    when: "dst",
    noteZh:
      "抽签按犹他（纳瓦霍）时间：申请、开奖、确认付款都是。中签后第二天早上 8:30 的领证和安全讲解按领证点的当地时间：卡纳布按犹他时间，佩吉按亚利桑那时间。夏天住佩吉、去卡纳布领证的，要按佩吉的 7:30 到。波浪谷本身在州界以南一点点，属亚利桑那，但步道口在犹他，徒步按犹他时间算就行。",
    sources: ["https://www.recreation.gov/permits/4251909", "https://www.visitsouthernutah.com/dailylottery/"],
    checked: CHECKED,
  },
  {
    park: "grca",
    noteZh:
      "大峡谷全年按亚利桑那时间（不调夏令时）。夏天从锡安、布莱斯、卡纳布（犹他）过来要把表拨慢 1 小时；从东门经 Cameron（纳瓦霍保留地）进来，夏天手机可能显示快 1 小时。冬天（11 月到 3 月初）从拉斯维加斯过来要拨快 1 小时，夏天和内华达一样。",
    sources: ["https://www.nps.gov/pefo/planyourvisit/hours.htm"],
    checked: CHECKED,
  },
  {
    park: "pefo",
    when: "dst",
    noteZh:
      "公园 8:00–17:00 全年按山地标准时间（亚利桑那时间）。北边紧挨纳瓦霍保留地、往东是新墨西哥，夏天手机可能快 1 小时，17:00 关路按亚利桑那时间算。",
    sources: ["https://www.nps.gov/pefo/planyourvisit/hours.htm"],
    checked: CHECKED,
  },
  {
    park: "zion",
    when: "dst",
    noteZh: "犹他实行夏令时；从锡安去佩吉（羚羊峡谷、马蹄湾）、大峡谷，3 月到 11 月初要把表拨慢 1 小时，导览按亚利桑那时间。",
    sources: ["https://www.nps.gov/glca/planyourvisit/seasonalhours.htm"],
    checked: CHECKED,
  },
  {
    park: "brca",
    when: "dst",
    noteZh: "犹他实行夏令时；从布莱斯去佩吉（羚羊峡谷、马蹄湾）、大峡谷，3 月到 11 月初要把表拨慢 1 小时，导览按亚利桑那时间。",
    sources: ["https://www.nps.gov/glca/planyourvisit/seasonalhours.htm"],
    checked: CHECKED,
  },
  {
    park: "grba",
    noteZh:
      "大盆地在内华达，用太平洋时间：Lehman Caves 导览、Recreation.gov 放票都按太平洋时间。东边几公里就是犹他（山地时间，全年快 1 小时），在 Baker、州界上的 Border Inn 一带手机可能显示犹他时间。",
    sources: ["https://www.nps.gov/grba/planyourvisit/40th-anniversary.htm"],
    checked: CHECKED,
  },
  {
    park: "thro",
    noteZh:
      "North Unit 用中部时间，South Unit、Painted Canyon 和 Medora 用山地时间，全年差 1 小时（North Unit 快）。行程里同一天去两边的，North Unit 的景点按当地时间另外写了一遍。",
    sources: ["https://www.nps.gov/thro/planyourvisit/hours.htm"],
    checked: CHECKED,
  },
  {
    park: "bibe",
    noteZh:
      "大弯用中部时间，比瓜达卢佩山、卡尔斯巴德洞窟、埃尔帕索（山地时间）快 1 小时，全年。去 Boquillas 按美方口岸的时间（周五到周一 9:00–16:00）：NPS 说科阿韦拉州的钟夏天比口岸慢 1 小时，墨西哥的法律又把 Boquillas 所在的 Ocampo 列为跟美国同步，两边说法不一，回程按美方口岸 16:00 关门算。",
    sources: [
      "https://www.nps.gov/bibe/planyourvisit/visiting-boquillas.htm",
      "https://www.nps.gov/bibe/learn/news/port-of-entry-begins-summer-schedule-4-28.htm",
    ],
    checked: CHECKED,
  },
  {
    park: "gumo",
    noteZh:
      "公园用山地时间，但附近的基站大多在南边、东边的中部时区，园里大部分地方手机、手表会显示中部时间（快 1 小时），还会来回跳（NPS 原话）。McKittrick 峡谷大门 8:00–17:00、游客中心的时间都按山地时间，建议把手机时区手动设成丹佛或埃尔帕索。",
    sources: ["https://www.nps.gov/thingstodo/gumo_whattimeisit.htm", "https://www.nps.gov/gumo/planyourvisit/hours.htm"],
    checked: CHECKED,
  },
  {
    park: "cave",
    noteZh: "公园用山地时间（新墨西哥），进洞 9:30–14:30 也按山地时间；从大弯（中部时间）过来要拨慢 1 小时。",
    sources: ["https://www.nps.gov/cave/planyourvisit/hours.htm"],
    checked: CHECKED,
  },
  {
    park: "glac",
    when: "winter",
    noteZh:
      "冰川（蒙大拿）用山地时间。艾伯塔 2026 年 11 月 1 日起全年固定在 UTC-6，冬天（11 月到次年 3 月初）从冰川开去 Waterton、班夫要拨快 1 小时；夏天两边一样。",
    sources: ["https://www.alberta.ca/albertas-new-time-system-abt"],
    checked: CHECKED,
  },
  {
    park: "banf",
    noteZh:
      "艾伯塔 2026 年 11 月 1 日起不再拨回冬令时，全年 UTC-6（省政府叫“艾伯塔时间”）。Parks Canada 写的“山地时间早上 8 点”开订（梦莲湖班车、营地），冬天比美国的山地时间（丹佛、盐湖城）早 1 小时。时区数据旧的手机、浏览器 11 月以后可能还按 UTC-7 显示，差 1 小时，系统更新一下。班夫到幽鹤、Golden 不用调表。",
    sources: ["https://www.alberta.ca/albertas-new-time-system-abt"],
    checked: CHECKED,
  },
  {
    park: "yoho",
    noteZh:
      "幽鹤在 BC 省，但 Field、Golden 一带跟艾伯塔用同一个时间（Golden 镇议会 2026 年 9 月决定全年 UTC-6），从班夫过来不用调表；再往西到 Revelstoke 是 BC 的太平洋时间，慢 1 小时。Field 本身没找到官方说法。",
    sources: ["https://www2.gov.bc.ca/gov/content/governments/celebrating-british-columbia/daylight-saving-time"],
    checked: CHECKED,
  },
  {
    park: "jasp",
    noteZh:
      "贾斯珀用艾伯塔时间（2026 年 11 月起全年 UTC-6）。往西过 Yellowhead Pass 进 BC 省（罗布森山、Valemount）是 BC 的太平洋时间（2026 年 3 月起全年 UTC-7），一年到头都慢 1 小时。",
    sources: ["https://www.alberta.ca/albertas-new-time-system-abt", "https://news.gov.bc.ca/releases/2026AG0013-000209"],
    checked: CHECKED,
  },
];

/** 某座公园的时区说明；给了日期就只留这一天有差别的 */
export function timeNotesFor(park: string, inDst?: boolean): TimeNote[] {
  return timeNotes.filter(
    (note) => note.park === park && (inDst === undefined || !note.when || (note.when === "dst") === inDst),
  );
}
