// Tesla 充电（公园页的“Tesla 充电”）：超充站（Supercharger）和目的地充电（Destination，酒店、游客中心的慢充）。
// 两个来源对着看：
//   1. NLR 充电站数据（美国能源部的 AFDC，加拿大的由 NRCan 提供；美国政府数据），ev_network 是 Tesla / Tesla Destination 的；
//      有桩数、功率、开放日期、最后核实日期、状态（开着、暂时不可用、在建）
//   2. OpenStreetMap（© OpenStreetMap contributors，ODbL）上 brand / operator / network 写着 Tesla 的充电站；
//      志愿者自己去看了标的，常有 24 小时、只给住客用这类信息
// 同一个站（超充 500 米内、目的地充电 300 米内）合成一条，记下哪边有；只有一边有、两边桩数不一样的，页面上标出来让人自己核对。
// Tesla 官网的地图拦自动访问（403，不绕过），supercharge.info（社区维护）没写数据的授权，所以都只在页面上给链接、不下载。
// 超充再用 OSRM 算从公园定位点和每家推荐住宿开过去多久（按 src/lib/drive-speed.ts 校正）。
//
// 输出 src/data/tesla.generated.ts。重新跑：npm run data:tesla（ONLY=zion,banf 只查几个公园；原始返回在 node_modules/.cache 存 12 小时）
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { correctedMinutes } from "../src/lib/drive-speed.ts";
import { attractions, lodgingOptions, parks, serviceArea, sleep, USER_AGENT } from "./load-data.mjs";

const OUTPUT = new URL("../src/data/tesla.generated.ts", import.meta.url);
const CACHE = new URL("../node_modules/.cache/nps-guide/", import.meta.url);
const ENV_FILE = new URL("../.env.local", import.meta.url);
const UPDATED = new Date().toLocaleDateString("sv");
const NLR = "https://developer.nlr.gov/api/alt-fuel-stations/v1/nearest.json";
// 主站最稳，轮流试的时候多试它几次
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
/** 和补给点一样：从定位点查到最远的景点 / 住宿再加 25 英里，最多 150 英里 */
const MAX_RADIUS_MI = 150;
/** 超充最多列最近的这么多个（按直线距离先挑，再算车程） */
const MAX_SUPERCHARGERS = 30;
/** 目的地充电只要景点、住宿、定位点附近这么多英里内的 */
const DESTINATION_NEAR_MI = 8;
const MAX_DESTINATIONS = 60;
/** 同一个站：两边的坐标差这么多米以内 */
const SAME_SUPERCHARGER_M = 500;
const SAME_DESTINATION_M = 300;
/** 目的地充电在这么近的推荐住宿就算这家住处有（酒店的停车场常常离酒店的坐标一两百米） */
const AT_LODGING_M = 250;
/** 目的地充电离景点这么近，就写“在哪个景点旁” */
const AT_ATTRACTION_M = 1500;
/**
 * 推荐住宿里很多是一整个小镇（Springdale、Banff），坐标在镇中心，镇上的目的地充电不能说成“这家住处有”；
 * 只有名字是一家店（Lodge、Hotel、Inn……）的才对
 */
const PROPERTY = /lodge|inn|hotel|resort|chateau|ahwahnee|motel|suites|cabins?|ranch|chalet|curry village/i;

// 在 git worktree（.claude/worktrees/<名字>）里跑时，key 在主仓库的 .env.local（和 Copilot 的 providers.py 一样）
const MAIN_ENV_FILE = new URL("../../../../.env.local", import.meta.url);
for (const file of [ENV_FILE, ...(fileURLToPath(import.meta.url).includes(".claude") ? [MAIN_ENV_FILE] : [])]) {
  if (!process.env.DATA_GOV_API_KEY && existsSync(file)) process.loadEnvFile(fileURLToPath(file));
}
if (!process.env.DATA_GOV_API_KEY) console.log("没有 DATA_GOV_API_KEY，用 DEMO_KEY（每小时只有 30 次）");
const API_KEY = process.env.DATA_GOV_API_KEY || "DEMO_KEY";
const ONLY = new Set((process.env.ONLY ?? "").split(",").filter(Boolean));
const selected = (park) => ONLY.size === 0 || ONLY.has(park.code);

// ---- 请求（和 build-services.mjs 一样的缓存、重试） ----

async function cached(label, request, load) {
  const file = new URL(`${label}-${createHash("sha1").update(request).digest("hex").slice(0, 10)}.json`, CACHE);
  if (existsSync(file) && Date.now() - statSync(file).mtimeMs < 12 * 3600_000) {
    return JSON.parse(readFileSync(file, "utf8"));
  }
  const data = await load();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(file, JSON.stringify(data));
  return data;
}

async function dataGov(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "X-Api-Key": API_KEY, "User-Agent": USER_AGENT } });
    if (res.ok) return res.json();
    if (res.status !== 429 || attempt > 12) throw new Error(`api.data.gov ${res.status}: ${await res.text()}`);
    console.log(`  api.data.gov 超出次数限制，10 分钟后重试`);
    await sleep(600_000);
  }
}

async function overpass(query) {
  // 公共服务忙起来一整天都 502：试 4 次不行就算了，这座公园先只用 NLR 的，下次再跑补上
  for (let attempt = 0; attempt < 4; attempt++) {
    const endpoint = OVERPASS[attempt % OVERPASS.length];
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(query),
      signal: AbortSignal.timeout(660_000),
    }).catch(() => null);
    let status = res ? `HTTP ${res.status}` : "网络错误";
    if (res?.status === 400) throw new Error(`Overpass 查询写错了：${(await res.text()).slice(0, 500)}`);
    if (res?.ok) {
      const data = await res.json().catch(() => null);
      if (data && !data.remark?.includes("error")) return data;
      status = data?.remark ?? "返回不完整";
    }
    console.log(`  ${new URL(endpoint).host} ${status}，${15 * (attempt + 1)} 秒后重试`);
    await sleep(15_000 * (attempt + 1));
  }
  throw new Error("Overpass 失败");
}

/** OSRM 公共服务：从 sources 到 destinations 的车程（分钟，按平均车速校正），不通公路是 null */
async function driveTable(sources, destinations) {
  const points = [...sources, ...destinations];
  const coords = points.map((p) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`).join(";");
  const src = sources.map((_, i) => i).join(";");
  const dst = destinations.map((_, i) => i + sources.length).join(";");
  const url = `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=duration,distance&sources=${src}&destinations=${dst}`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    if (data?.code === "Ok") {
      return data.durations.map((row, i) =>
        row.map((s, j) => (s == null ? null : correctedMinutes(s, data.distances?.[i]?.[j] ?? 0))),
      );
    }
    console.log(`  OSRM ${res ? `HTTP ${res.status}` : "网络错误"}，${5 * attempt} 秒后重试`);
    await sleep(5000 * attempt);
  }
  throw new Error("OSRM 失败");
}

// ---- 距离 ----

const toRad = (deg) => (deg * Math.PI) / 180;
function meters(a, b) {
  const h =
    Math.sin(toRad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}
const miles = (a, b) => meters(a, b) / 1609.344;
const round5 = (deg) => Math.round(deg * 1e5) / 1e5;

// ---- NLR ----

function fromNlr(station) {
  const kind = station.ev_network === "Tesla" ? "supercharger" : "destination";
  const units = station.ev_charging_units ?? [];
  const kws = units.flatMap((unit) => Object.values(unit.connectors ?? {}).map((c) => c.power_kw ?? 0));
  const access = `${station.access_days_time ?? ""} ${station.groups_with_access_code ?? ""}`;
  const stalls = kind === "supercharger" ? station.ev_dc_fast_num : station.ev_level2_evse_num;
  return {
    kind,
    // NLR 的站名都带着“ - Tesla Supercharger / - Tesla Destination”
    name: station.station_name.replace(/\s*-\s*Tesla (Supercharger|Destination)\s*$/i, "").trim(),
    city: station.city?.trim() || undefined,
    state: station.state?.trim() || undefined,
    lat: round5(station.latitude),
    lon: round5(station.longitude),
    stalls: stalls ?? undefined,
    kw: Math.max(0, ...kws) || undefined,
    status: station.status_code === "T" ? "down" : station.status_code === "P" ? "planned" : "open",
    expected: station.status_code === "P" ? station.expected_date ?? undefined : undefined,
    opened: station.open_date ?? undefined,
    confirmed: station.date_last_confirmed ?? undefined,
    facility: station.facility_type ?? undefined,
    // 访问说明是一段英文，只挑出几件要紧的事（页面上按语言写）
    guests: /guest|patron|customer|resident|employee/i.test(access) || undefined,
    teslaOnly: (kind === "destination" && !(station.ev_connector_types ?? []).includes("J1772")) || undefined,
    allHours: /24 hours/i.test(access) || undefined,
    nlr: station.id,
  };
}

// ---- OSM ----

/**
 * 一次查完美国、加拿大和两块海外领地所有标了 Tesla 的充电站（约 5 MB，两分钟），再按公园分。
 * 每座公园单独查要 70 次，公共服务忙的时候一座就要等十几分钟
 */
const OSM_QUERY = `[out:json][timeout:600];
area["ISO3166-1"~"^(US|CA|VI|AS)$"][admin_level=2]->.a;
(
  nwr["amenity"="charging_station"]["brand"~"Tesla",i](area.a);
  nwr["amenity"="charging_station"]["operator"~"Tesla",i](area.a);
);
out center tags;`;

const number = (value) => {
  const n = Number.parseFloat(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

function fromOsm(element) {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (lat == null || lon == null) return null;
  const label = `${tags.name ?? ""} ${tags.brand ?? ""} ${tags.network ?? ""}`;
  const fast = tags["socket:tesla_supercharger"] ?? tags["socket:nacs"];
  const fastKw = number(tags["socket:tesla_supercharger:output"] ?? tags["socket:nacs:output"]);
  const kind = /destination/i.test(label)
    ? "destination"
    : /supercharger/i.test(label) || tags["socket:tesla_supercharger"] || (fastKw ?? 0) >= 72
      ? "supercharger"
      : "destination";
  return {
    kind,
    // 只写着“Tesla Supercharger / Tesla Destination Charger”的不算名字
    name: (tags.name ?? "").replace(/^Tesla (Supercharger|Destination)( Charger| Charging)?$/i, "").trim() || undefined,
    city: tags["addr:city"] || undefined,
    lat: round5(lat),
    lon: round5(lon),
    stalls: number(tags.capacity) ?? number(fast) ?? number(tags["socket:tesla_destination"]),
    kw: kind === "supercharger" ? fastKw : number(tags["socket:tesla_destination:output"]),
    allHours: tags.opening_hours === "24/7" || undefined,
    guests: /customers|private/.test(tags.access ?? "") || undefined,
    id: `${element.type[0]}${element.id}`,
  };
}

// ---- 合并 ----

/** NLR 的每一条，配上 OSM 上同一个站（最近的、没被别人配走的）；OSM 上多出来的另外列 */
function merge(nlr, osm) {
  const used = new Set();
  const stations = nlr.map((station) => {
    const limit = station.kind === "supercharger" ? SAME_SUPERCHARGER_M : SAME_DESTINATION_M;
    let best = null;
    let bestM = Infinity;
    for (const candidate of osm) {
      if (candidate.kind !== station.kind || used.has(candidate.id)) continue;
      const m = meters(station, candidate);
      if (m < limit && m < bestM) {
        best = candidate;
        bestM = m;
      }
    }
    if (!best) return { ...station, sources: ["nlr"] };
    used.add(best.id);
    return {
      ...station,
      allHours: station.allHours ?? best.allHours,
      guests: station.guests ?? best.guests,
      osm: { id: best.id, ...(best.stalls ? { stalls: best.stalls } : {}), ...(best.kw ? { kw: best.kw } : {}) },
      sources: ["nlr", "osm"],
    };
  });
  // OSM 上一个站常常画成几个点（每两个桩一个点，或者一个点再加一块停车场），离已经配上的同类站这么近的算同一个站
  for (const extra of osm) {
    if (used.has(extra.id)) continue;
    const limit = extra.kind === "supercharger" ? SAME_SUPERCHARGER_M : SAME_DESTINATION_M;
    const owner = stations.find((s) => s.kind === extra.kind && s.osm && meters(s, extra) < limit);
    if (!owner) continue;
    used.add(extra.id);
    if (extra.kind === "destination" && extra.stalls) owner.osm.stalls = (owner.osm.stalls ?? 0) + extra.stalls;
  }
  // OSM 上多出来的，自己再合并一次
  for (const extra of osm) {
    if (used.has(extra.id)) continue;
    const limit = extra.kind === "supercharger" ? SAME_SUPERCHARGER_M : SAME_DESTINATION_M;
    const twin = stations.find((s) => s.kind === extra.kind && s.sources.length === 1 && s.sources[0] === "osm" && meters(s, extra) < limit);
    used.add(extra.id);
    if (twin) {
      if (extra.kind === "destination" && extra.stalls) twin.stalls = (twin.stalls ?? 0) + extra.stalls;
      twin.name ||= extra.name ?? "";
      continue;
    }
    stations.push({
      kind: extra.kind,
      name: extra.name ?? "",
      city: extra.city,
      lat: extra.lat,
      lon: extra.lon,
      stalls: extra.stalls,
      kw: extra.kw,
      status: "open",
      allHours: extra.allHours,
      guests: extra.guests,
      osm: { id: extra.id },
      sources: ["osm"],
    });
  }
  return stations;
}

/** 去掉 undefined，输出短一点 */
const compact = (object) => Object.fromEntries(Object.entries(object).filter(([, v]) => v !== undefined));

// ---- 输出 ----

const previousFile = existsSync(OUTPUT) ? await import(OUTPUT.href) : null;
const previous = previousFile?.teslaChargers ?? {};
const results = { ...previous };

function write() {
  const lines = parks
    .filter((park) => results[park.code])
    .map((park) => {
      const { stations, ...rest } = results[park.code];
      return `  ${park.code}: {\n    ...${JSON.stringify(rest)},\n    stations: [\n${stations.map((s) => `      s(${JSON.stringify(s)}),`).join("\n")}\n    ],\n  },`;
    });
  writeFileSync(
    OUTPUT,
    `// 由 scripts/build-tesla.mjs 生成，请勿手改。来源：NLR 充电站数据（美国能源部 AFDC、加拿大 NRCan，美国政府数据）
// 和 OpenStreetMap（© OpenStreetMap contributors，ODbL）；车程是 OSRM（OpenStreetMap 路网）按平均车速校正过的。
export type TeslaKind = "supercharger" | "destination";

export interface TeslaStation {
  kind: TeslaKind;
  /** 站名（NLR 的去掉了“ - Tesla Supercharger”；只在 OSM 上有的可能是空的） */
  name: string;
  city?: string;
  state?: string;
  lat: number;
  lon: number;
  /** 超充是直流桩数，目的地充电是交流桩数（NLR；只在 OSM 上有的用 OSM 的） */
  stalls?: number;
  /** 最大功率（千瓦） */
  kw?: number;
  /** 开着 / 暂时不可用 / 在建 */
  status: "open" | "down" | "planned";
  /** 在建的预计开放日期 */
  expected?: string;
  /** NLR：开放日期、最后核实的日期（YYYY-MM-DD） */
  opened?: string;
  confirmed?: string;
  /** NLR 的场所类型，比如 HOTEL、GAS_STATION、GROCERY */
  facility?: string;
  /** 只给住客、顾客用 */
  guests?: boolean;
  /** 目的地充电只有 Tesla 接口（没有 J1772，别的车要转接头） */
  teslaOnly?: boolean;
  /** 24 小时 */
  allHours?: boolean;
  /** NLR 的站号（打卡用 nlr:<号>） */
  nlr?: number;
  /** OSM 上同一个站：元素（n/w/r + 号）和那边写的桩数、功率 */
  osm?: { id: string; stalls?: number; kw?: number };
  /** 哪几个来源有这个站 */
  sources: ("nlr" | "osm")[];
  /** 直线距离公园定位点多少英里 */
  miles: number;
  /** 超充：从公园定位点开过去多少分钟（OSRM；不通公路是 null） */
  drive?: number | null;
  /** 目的地充电：就在哪几家推荐住宿（lodging.ts 的 id） */
  lodging?: string[];
  /** 目的地充电：就在哪个景点旁（景点 id） */
  near?: string;
}

export interface TeslaPark {
  /** 查的半径（英里） */
  radius: number;
  /** 这次查到了 OSM（Overpass 公共服务忙的时候可能查不到，只有 NLR 的） */
  osm: boolean;
  /** 每家推荐住宿开到最近的超充：[住宿 id, 超充在 stations 里的下标, 分钟] */
  lodgingNearest: [string, number, number][];
  stations: TeslaStation[];
}

export const teslaUpdated = "${UPDATED}";

const s = (station: TeslaStation) => station;

/** 按公园代码 */
export const teslaChargers: Record<string, TeslaPark> = {
${lines.join("\n")}
};
`,
  );
}

// OSM 一次查完；查不到（公共服务太忙）就都只用 NLR，上次查到过 OSM 的公园沿用上次的结果
let osmAll = null;
try {
  const data = await cached("tesla-osm-all", OSM_QUERY, () => overpass(OSM_QUERY));
  osmAll = data.elements.map(fromOsm).filter(Boolean);
  console.log(`OSM：${osmAll.length} 个标了 Tesla 的充电站`);
} catch {
  console.log("OSM 查不到，这次只用 NLR");
}
for (const park of parks) {
  if (!selected(park)) continue;
  const area = serviceArea(park);
  const radius = Math.min(MAX_RADIUS_MI, Math.ceil(Math.max(...area.map((p) => miles(park.gateway, p))) + 25));

  if (!osmAll && previous[park.code]?.osm) {
    console.log(`${park.code}: OSM 查不到，沿用上次的结果`);
    continue;
  }

  // 1. NLR
  const params = new URLSearchParams({
    latitude: String(park.gateway.lat),
    longitude: String(park.gateway.lon),
    radius: String(radius),
    fuel_type: "ELEC",
    ev_network: "Tesla,Tesla Destination",
    access: "public",
    status: "E,T,P",
    limit: "200",
    country: "all",
  });
  const nlr = await cached(`tesla-nlr-${park.code}`, params.toString(), () => dataGov(`${NLR}?${params}`));

  // 2. OSM
  // 2. OSM：从一次查好的全部里取这座公园半径内的
  const osm = osmAll && { elements: osmAll.filter((e) => miles(park.gateway, e) <= radius) };

  const merged = merge(nlr.fuel_stations.map(fromNlr), osm?.elements ?? []).map((station) => ({
    ...station,
    miles: Math.round(miles(park.gateway, station) * 10) / 10,
  }));

  // 3. 挑：超充按直线距离取最近的，目的地充电只要景点、住宿、定位点附近的
  const lodgings = lodgingOptions.filter((l) => l.park === park.code);
  const sights = attractions.filter((a) => a.park === park.code);
  const anchors = [park.gateway, ...area];
  const superchargers = merged
    .filter((s) => s.kind === "supercharger")
    .sort((a, b) => a.miles - b.miles)
    .slice(0, MAX_SUPERCHARGERS);
  const destinations = merged
    .filter((s) => s.kind === "destination" && anchors.some((p) => miles(p, s) <= DESTINATION_NEAR_MI))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, MAX_DESTINATIONS)
    .map((s) => {
      const at = lodgings.filter((l) => PROPERTY.test(l.nameEn) && meters(l, s) <= AT_LODGING_M).map((l) => l.id);
      const sight = sights
        .map((a) => ({ a, m: meters(a.start ?? a, s) }))
        .filter(({ m }) => m <= AT_ATTRACTION_M)
        .sort((x, y) => x.m - y.m)[0]?.a;
      return { ...s, ...(at.length ? { lodging: at } : {}), ...(sight && !at.length ? { near: sight.id } : {}) };
    });

  // 4. 车程：定位点和每家推荐住宿 → 每个超充（一次 OSRM table）
  let lodgingNearest = [];
  if (superchargers.length) {
    const sources = [park.gateway, ...lodgings];
    const table = await cached(
      `tesla-osrm-${park.code}`,
      JSON.stringify([sources, superchargers].map((list) => list.map((p) => [p.lat, p.lon]))),
      async () => {
        await sleep(1000);
        return driveTable(sources, superchargers);
      },
    );
    superchargers.forEach((s, j) => (s.drive = table[0][j]));
    lodgingNearest = lodgings
      .map((l, i) => {
        const row = table[i + 1];
        let best = -1;
        for (let j = 0; j < row.length; j++) if (row[j] != null && (best < 0 || row[j] < row[best])) best = j;
        return best < 0 ? null : [l.id, best, row[best]];
      })
      .filter(Boolean);
    // 按车程排（不通公路的排最后），lodgingNearest 的下标跟着换
    const order = superchargers.map((_, j) => j).sort((a, b) => (superchargers[a].drive ?? 1e9) - (superchargers[b].drive ?? 1e9) || superchargers[a].miles - superchargers[b].miles);
    const position = new Map(order.map((j, k) => [j, k]));
    lodgingNearest = lodgingNearest.map(([id, j, m]) => [id, position.get(j), m]);
    superchargers.splice(0, superchargers.length, ...order.map((j) => superchargers[j]));
  }

  results[park.code] = { radius, osm: osm !== null, lodgingNearest, stations: [...superchargers, ...destinations].map(compact) };
  write();
  const only = (source) => merged.filter((s) => s.sources.length === 1 && s.sources[0] === source).length;
  console.log(
    `${park.code}: 超充 ${superchargers.length}、目的地充电 ${destinations.length}（半径 ${radius} 英里；NLR ${nlr.fuel_stations.length} 条、OSM ${osm ? `${osm.elements.length} 个` : "没查到"}，只在 NLR ${only("nlr")}、只在 OSM ${only("osm")}）`,
  );
}

write();
