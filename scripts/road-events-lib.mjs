// NPS 道路事件（WZDx 4.1，developer.nps.gov/api/v1/roadevents）：哪条路从哪天起封、封到哪天、全封还是半封、封的是哪一段。
// 11-22 查过：13 个 NPS 单位在发，和网站有关的只有 6 座（优胜美地、红杉与国王峡谷、火山口湖、拉森、雷尼尔山、大烟山），
// 正好是季节性山路最多的几座。要知道的坑：
//   - “封到哪天”大多是占位的（Tioga Road 写到 2028-01-01），而且标着没核实（is_end_date_verified: false）；
//     可靠的是“从哪天起封”，和“这条现在还在不在”：路通了条目就从接口里消失；
//   - 同一件事拆成很多段（雷尼尔山冬季封路 58 段），先按 公园 + 路名 + 起止日期 合并；
//   - 路名很笼统（雷尼尔山冬季那条里有 Paradise Valley Road，只是天堂一带的小环路，去天堂的主路冬天照样通），
//     所以不按坐标“离得近就算关”，只认下面 ROAD_MAP 里核对过的路名 → 季节性山路（src/data/roads.ts）或几个景点；
//     对不上的只在公园页“实时信息”里列出来，不改行程。
// 输出和“每晚模型读公告提取的关闭清单”同样的格式（src/lib/copilot/live.ts 的 ExtractedClosures），
// 网站行程页、Copilot 排行程拿去和公告的清单合在一起用。不联网的部分在这里，抓取在 scripts/road-events.mjs。
import { attractions, parks } from "./load-data.mjs";
import { seasonalRoads } from "../src/data/roads.ts";

/** 发数据的单位名 → 网站的公园代码（只收网站有的公园） */
export const ROAD_SOURCES = {
  "Yosemite National Park": "yose",
  "Sequoia & Kings Canyon National Parks": "seki",
  "Crater Lake National Park": "crla",
  "Lassen Volcanic": "lavo",
  "Mount Rainier": "mora",
  "Great Smoky Mountains National Park": "grsm",
};

/**
 * 核对过的路名（小写、去掉首尾空格后包含这几个字）→ 这条路封了以后去不了的季节性山路或景点。
 * 加新的：看 road-events-latest.json 里 unmapped 的，确认那条路封了哪些景点就真的去不了，再加进来
 */
export const ROAD_MAP = {
  yose: [
    { match: "tioga road", roads: ["yose-tioga-road"] },
    { match: "glacier point road", roads: ["yose-glacier-point-road"] },
  ],
  seki: [
    // Hume Lake Road 路口以东到 Cedar Grove、Roads End
    { match: "highway 180", roads: ["seki-kings-canyon-highway"] },
    { match: "crescent meadow road", attractions: ["seki-crescent-meadow"] },
    { match: "moro rock", attractions: ["seki-moro-rock"] },
    { match: "panoramic point", attractions: ["seki-panoramic-point"] },
  ],
  crla: [
    { match: "rim drive", roads: ["crla-west-rim-drive", "crla-east-rim-drive"] },
    { match: "north entrance road", roads: ["crla-north-entrance-road"] },
    { match: "pinnacles road", attractions: ["crla-pinnacles"] },
  ],
  lavo: [{ match: "lassen national park highway", roads: ["lavo-park-highway"] }],
  mora: [
    { match: "sunrise road", roads: ["mora-sunrise-road"] },
    { match: "stevens canyon road", roads: ["mora-stevens-canyon-road"] },
  ],
  grsm: [],
};

const parkByCode = new Map(parks.map((park) => [park.code, park]));
const roadById = new Map(seasonalRoads.map((road) => [road.id, road]));
const known = new Set(attractions.map((a) => a.id));

/** UTC 时间按公园所在时区换成当地日期（YYYY-MM-DD） */
export function localDate(iso, park) {
  if (!iso) return null;
  const zone = parkByCode.get(park)?.timeZone ?? "America/Los_Angeles";
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

/** 一条事件封了哪些季节性山路、哪些景点（按 ROAD_MAP） */
export function mapRoads(park, names) {
  const roads = new Set();
  const stops = new Set();
  const unmapped = [];
  for (const raw of names) {
    const name = String(raw).trim().toLowerCase();
    const rules = (ROAD_MAP[park] ?? []).filter((rule) => name.includes(rule.match));
    if (rules.length === 0) unmapped.push(String(raw).trim());
    for (const rule of rules) {
      for (const id of rule.roads ?? []) {
        roads.add(id);
        const road = roadById.get(id);
        for (const stop of [...(road?.attractions ?? []), ...(road?.afterRoad ?? [])]) stops.add(stop);
      }
      for (const stop of rule.attractions ?? []) stops.add(stop);
    }
  }
  return { roads: [...roads], attractions: [...stops].filter((id) => known.has(id)), unmapped };
}

/** 接口原样的 FeatureCollection → 合并好的事件（只收网站有的公园） */
export function summarizeFeed(feed) {
  const sources = new Map((feed.road_event_feed_info?.data_sources ?? []).map((source) => [source.data_source_id, source.organization_name]));
  const events = new Map();
  for (const feature of feed.features ?? []) {
    const properties = feature.properties ?? {};
    const core = properties.core_details ?? {};
    const park = ROAD_SOURCES[sources.get(core.data_source_id)];
    if (!park) continue;
    const names = (core.road_names ?? []).map((name) => String(name).trim()).filter(Boolean);
    const from = localDate(properties.start_date, park);
    const until = localDate(properties.end_date, park);
    const key = [park, names.join("|"), from, until].join("#");
    if (events.has(key)) {
      events.get(key).segments += 1;
      continue;
    }
    const { roads, attractions: stops, unmapped } = mapRoads(park, names);
    events.set(key, {
      key,
      park,
      roadNames: names,
      from,
      until,
      untilVerified: Boolean(properties.is_end_date_verified),
      impact: properties.vehicle_impact ?? null,
      type: core.event_type ?? null,
      description: String(core.description ?? "").trim(),
      roads,
      attractions: stops,
      unmapped,
      segments: 1,
    });
  }
  return [...events.values()].sort((a, b) => a.park.localeCompare(b.park) || String(a.from).localeCompare(String(b.from)));
}

const conditionsPage = (park) => `https://www.nps.gov/${park}/planyourvisit/conditions.htm`;

/**
 * 事件 → 关闭清单（ExtractedClosures 的格式）。只收全封、对到了景点的；“封到哪天”没核实的不当成重开日（多半是占位的），
 * 照“没公布重开日”处理：路通了条目会从接口里消失，第二天的清单里就没有了
 */
export function toClosures(events, fetched) {
  const covered = [...new Set(Object.values(ROAD_SOURCES))];
  const closures = events
    .filter((event) => event.attractions.length > 0 && event.impact === "all-lanes-closed")
    .map((event) => ({
      alert: `road:${event.key}`,
      park: event.park,
      attractions: event.attractions,
      strict: event.attractions,
      from: event.from,
      reopen: event.untilVerified ? event.until : null,
      title: `${event.roadNames.join(", ")}: closed (NPS road events)`,
      url: conditionsPage(event.park),
      evidence: event.description,
      found_by: ["road-events"],
    }));
  return { fetched, parks: Object.fromEntries(covered.map((code) => [code, fetched])), closures };
}

/**
 * 每条季节性山路每一季：哪天开始封（接口写的开始日）、哪天发现又通了（条目消失的第一天，最多差一天）。
 * history 是上一晚的结果：{ [路 id]: [{ closedFrom, lastSeen, openedSeen }] }，按时间排
 */
export function updateHistory(history, events, today) {
  const next = structuredClone(history ?? {});
  const closedNow = new Map();
  for (const event of events) {
    if (event.impact !== "all-lanes-closed" || !event.from || event.from > today) continue;
    for (const road of event.roads) {
      const earlier = closedNow.get(road);
      if (!earlier || event.from < earlier) closedNow.set(road, event.from);
    }
  }
  for (const [road, from] of closedNow) {
    const seasons = (next[road] ??= []);
    const last = seasons.at(-1);
    // 同一季（还没发现通车）：开始日以接口为准（可能改过），记下今天还封着
    if (last && !last.openedSeen) Object.assign(last, { closedFrom: last.closedFrom < from ? last.closedFrom : from, lastSeen: today });
    else seasons.push({ closedFrom: from, lastSeen: today, openedSeen: null });
  }
  for (const [road, seasons] of Object.entries(next)) {
    const last = seasons.at(-1);
    if (last && !last.openedSeen && !closedNow.has(road) && last.lastSeen < today) last.openedSeen = today;
  }
  return next;
}

/** 历史 → 往年日期（[年份, 开通日, 关闭日]，和 roads-manual.json 一样）：秋天封的那年记关闭日，第二年发现通车记开通日 */
export function historyToYears(history) {
  const out = {};
  for (const [road, seasons] of Object.entries(history ?? {})) {
    const years = new Map();
    for (const season of seasons) {
      const closeYear = Number(season.closedFrom.slice(0, 4));
      // 秋冬封的（7 月以后）算那年的关闭日；春天还在封的那一季的开通日，算发现通车那年
      if (Number(season.closedFrom.slice(5, 7)) >= 7) years.set(closeYear, { ...(years.get(closeYear) ?? {}), close: season.closedFrom.slice(5) });
      if (season.openedSeen) {
        const openYear = Number(season.openedSeen.slice(0, 4));
        years.set(openYear, { ...(years.get(openYear) ?? {}), open: season.openedSeen.slice(5) });
      }
    }
    out[road] = [...years.entries()].sort((a, b) => b[0] - a[0]).map(([year, { open, close }]) => [year, open ?? null, close ?? null]);
  }
  return out;
}
