// 从 scripts/data/alltrails-parks.json 生成每个徒步景点的 AllTrails 匹配数据与各公园热门步道榜单。
// 输出 src/data/attractions/alltrails.generated.ts。重跑：npm run data:alltrails
import { readFileSync, writeFileSync } from "node:fs";
import { attractions, parks } from "./load-data.mjs";

const INPUT = new URL("./data/alltrails-parks.json", import.meta.url);
const COUNTS_INPUT = new URL("./data/alltrails-park-counts.json", import.meta.url);
const OUTPUT = new URL("../src/data/attractions/alltrails.generated.ts", import.meta.url);

const rawTrails = JSON.parse(readFileSync(INPUT, "utf8"));
let liveParkCounts = {};
try {
  liveParkCounts = JSON.parse(readFileSync(COUNTS_INPUT, "utf8"));
} catch {}
const bySlug = new Map(rawTrails.map((t) => [t.slug, t]));

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function minDistKm(a, t) {
  const pts = [a, ...(a.start ? [a.start] : []), ...(a.trail?.via ?? [])];
  return Math.min(...pts.map((p) => haversineKm(p.lat, p.lon, t.lat, t.lon)));
}

const STOP_WORDS = new Set([
  "trail",
  "trails",
  "hike",
  "loop",
  "and",
  "the",
  "to",
  "via",
  "of",
  "in",
  "at",
  "from",
  "overlook",
  "viewpoint",
  "view",
  "point",
  "closed",
  "national",
  "park",
  "nature",
  "walk",
  "path",
  "road",
]);

function normalizeWord(w) {
  if (w === "falls") return "fall";
  if (w === "lakes") return "lake";
  if (w === "peaks") return "peak";
  if (w === "caverns") return "cavern";
  if (w === "dunes") return "dune";
  if (w === "pools") return "pool";
  if (w === "trees") return "tree";
  if (w === "groves") return "grove";
  if (w === "arches") return "arch";
  if (w === "canyons") return "canyon";
  if (w === "springs") return "spring";
  if (w === "meadows") return "meadow";
  if (w === "bridges") return "bridge";
  if (w === "mosses") return "moss";
  if (w === "mountains" || w === "mt") return "mountain";
  if (w === "st") return "saint";
  if (w === "sulfur") return "sulphur";
  if (w === "bailey") return "bailly";
  return w;
}

function tokenize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\[closed\]/gi, "")
    .replace(/['’ʻ‘`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeWord)
    .filter((w) => !STOP_WORDS.has(w));
}

const MANUAL_SLUGS = {
  "yose-mist-trail": "us/california/vernal-and-nevada-falls-via-the-mist-trail",
  "yose-nevada-fall": "us/california/nevada-falls--2",
  "olym-hall-of-mosses": "us/washington/hoh-rain-forest-hall-of-moss",
  "chir-heart-of-rocks": "us/arizona/heart-of-the-rocks",
  "cave-natural-entrance": "us/new-mexico/carlsbad-caverns-national-park-trail",
  "grba-baker-creek": "us/nevada/baker-creek-loop",
  "zion-narrows": "us/utah/zion-narrows-trail-to-imlay-temple-and-big-spring",
  "zion-riverside-walk": "us/utah/the-zion-narrows-riverside-walk",
  "zion-scout-lookout": "us/utah/scout-lookout-trail",
  "isro-greenstone-ridge": "us/michigan/greenstone-ridge-trail",
  "pinn-prewett-point": "us/california/pinnacles-overlook-trail",
  "havo-mauna-ulu": "hawaii/hawaii/puu-huluhulu-via-napau-crater-trail",
  "cuva-beaver-marsh": "us/ohio/ohio-and-erie-canal-towpath-from-ira-trailhead",
  "lacl-port-alsworth": "us/alaska/tanalian-falls--2",
  "lacl-tanalian-mountain": "us/alaska/tanalian-mountain--3",
  "mora-skyline-trail": "us/washington/skyline-trail",
  "noca-cascade-pass": "us/washington/cascade-pass-and-sahale-arm-trail--2",
  "romo-emerald-lake": "us/colorado/emerald-lake-trail",
  "grsa-high-dune": "us/colorado/high-dune-loop",
  "sagu-wasson-peak": "us/arizona/wasson-peak-via-king-canyon-and-hugh-norris-trail",
  "sagu-bridal-wreath-falls": "us/arizona/bridal-wreath-falls-trail",
  "grsm-alum-cave": "us/tennessee/alum-cave-trail-to-mount-leconte",
  "neri-endless-wall": "us/west-virginia/endless-wall",
  "voya-echo-bay-trail": "us/minnesota/echo-bay-trail",
  "voya-oberholtzer-trail": "us/minnesota/oberholtzer-trail",
  "redw-grove-of-titans": "us/california/grove-of-titans-trail",
  "redw-enderts-beach": "us/california/enderts-beach-trail",
  "deva-natural-bridge": "us/california/natural-bridge-canyon-trail",
  "isro-scoville-point": "us/michigan/scoville-point-via-stoll-trail",
  "isro-lookout-louise": "us/michigan/lookout-louise-via-hidden-lake-trail",
  "gumo-salt-basin-dunes": "us/texas/salt-basin-dunes-trail",
  "whsa-playa-trail": "us/new-mexico/playa-trail",
  "olym-quinault-big-spruce": "us/washington/quinault-big-sitka-spruce-tree-trail",
};

const EXCLUDE_IDS = new Set([
  "grte-chapel-transfiguration", // 礼拜堂与古渡口历史区，非独立步道
  "grsa-dunefield", // 开放沙丘自由攀爬区，High Dune 已对应 grsa-high-dune
  "grsa-castle-creek", // 涉水戏沙起点，非独立步道
  "glba-shore-walk", // 潮间带海岸漫步，Forest Trail 已对应 glba-forest-trail
  "gaar-wiseman-hike", // 北极之门无步道荒野路线
  "chir-bonita-creek", // 营地步道，AllTrails 未单独收录
  "cave-big-room", // 卡尔斯巴德地下洞穴大自然的房间路线，地面入口已对应 cave-natural-entrance
  "npsa-upper-sauma", // 美属萨摩亚仅收录 6 条步道，已对应 npsa-lower-sauma
  "npsa-wwii-heritage", // 美属萨摩亚二战炮台步道，AllTrails 未单独收录
  // 风洞与猛犸洞地下洞穴向导游览团（非地面步道）
  "wica-natural-entrance-tour",
  "wica-fairgrounds-tour",
  "wica-garden-of-eden-tour",
  "wica-candlelight-tour",
  "wica-wild-cave-tour",
  "maca-historic-tour",
  "maca-domes-dripstones",
  "maca-frozen-niagara",
  "maca-mammoth-passage",
  "maca-grand-avenue",
  "maca-great-onyx-lantern",
  "maca-violet-city-lantern",
  "maca-wild-cave",
]);

function scoreMatch(a, t, distKm) {
  const aTokens = tokenize(a.nameEn);
  const slugTail = t.slug ? t.slug.split("/").slice(2).join(" ") : "";
  const tTokens = tokenize(`${t.name} ${slugTail}`);
  if (aTokens.length === 0 || tTokens.length === 0) return -1;

  const tSet = new Set(tTokens);
  const aSet = new Set(aTokens);
  let common = 0;
  for (const w of aSet) {
    if (tSet.has(w)) common++;
  }
  if (common === 0) return -1;

  const recall = common / aSet.size;
  const precision = common / new Set(tokenize(t.name)).size || 0.5;
  const f1 = (2 * recall * precision) / (recall + precision);

  let lenBonus = 0;
  if (a.hike?.distanceMi && t.lengthMi) {
    const ratio = Math.min(a.hike.distanceMi, t.lengthMi) / Math.max(a.hike.distanceMi, t.lengthMi);
    lenBonus = ratio * 0.25;
  }

  const geoBonus = distKm < 0.5 ? 0.35 : distKm < 1.5 ? 0.25 : distKm < 3 ? 0.15 : 0.05;
  const popBonus = Math.min(0.25, Math.log10((t.reviews || 0) + 1) * 0.06);
  const liveBonus = t.isLiveTop ? 0.35 : 0;

  return recall * 0.5 + f1 * 0.3 + lenBonus + geoBonus + popBonus + liveBonus;
}

const hikes = attractions.filter((a) => a.hike);
const candidatePairs = [];

for (const a of hikes) {
  if (EXCLUDE_IDS.has(a.id)) continue;
  if (MANUAL_SLUGS[a.id]) {
    const t = bySlug.get(MANUAL_SLUGS[a.id]);
    if (t) {
      candidatePairs.push({ a, t, d: minDistKm(a, t), s: 10 });
      continue;
    }
  }
  for (const t of rawTrails) {
    const d = minDistKm(a, t);
    if (d > 6) continue;
    const s = scoreMatch(a, t, d);
    if (s >= 0.65) {
      candidatePairs.push({ a, t, d, s });
    }
  }
}

candidatePairs.sort((x, y) => y.s - x.s);
const assignedAttraction = new Map();
const slugToAttractionId = new Map();

for (const pair of candidatePairs) {
  if (assignedAttraction.has(pair.a.id)) continue;
  if (slugToAttractionId.has(pair.t.slug)) continue;
  assignedAttraction.set(pair.a.id, pair);
  slugToAttractionId.set(pair.t.slug, pair.a.id);
}

// 1. 生成每个已匹配徒步景点的 AllTrailsPlace
const alltrailsPlaces = {};
for (const a of hikes) {
  const pair = assignedAttraction.get(a.id);
  if (!pair) continue;
  const { t } = pair;
  alltrailsPlaces[a.id] = {
    name: t.name,
    slug: t.slug,
    rating: t.rating,
    reviews: t.reviews,
    popularity: t.popularity,
    ...(t.usage ? { usage: t.usage } : {}),
    ...(t.photo ? { photo: t.photo } : {}),
  };
}

// 2. 生成每个公园的 AllTrails 热门步道 Top 40 榜单与总收录步道数
const alltrailsParkTop = {};
const alltrailsParkCounts = {};

for (const park of parks) {
  const code = park.code.toLowerCase();
  const inParkTrails = rawTrails.filter((t) => t.park === code && t.inParkSlug);
  const parkTrails =
    inParkTrails.length > 0
      ? inParkTrails
      : rawTrails.filter(
          (t) =>
            slugToAttractionId.has(t.slug) &&
            attractions.find((a) => a.id === slugToAttractionId.get(t.slug))?.park === code,
        );
  alltrailsParkCounts[code] = Math.max(liveParkCounts[code] || 0, parkTrails.length);

  const sorted = [...parkTrails].sort((a, b) => b.popularity - a.popularity || b.reviews - a.reviews);
  const top = [];

  for (const t of sorted) {
    const attractionId = slugToAttractionId.get(t.slug);
    const entry = {
      name: t.name,
      slug: t.slug,
      lat: t.lat,
      lon: t.lon,
      rating: t.rating,
      reviews: t.reviews,
      popularity: t.popularity,
      lengthMi: t.lengthMi,
      gainFt: t.gainFt,
      difficulty: t.difficulty,
      routeType: t.routeType,
      ...(t.usage ? { usage: t.usage } : {}),
      ...(t.features?.length ? { features: t.features } : {}),
      ...(t.photo ? { photo: t.photo } : {}),
      ...(attractionId ? { attractionId } : {}),
    };
    top.push(entry);
    if (top.length >= 40) break;
  }

  if (top.length > 0) {
    alltrailsParkTop[code] = top;
  }
}

const header = `// 由 scripts/build-alltrails.mjs 自动生成，请勿手改。重跑：npm run data:alltrails

export interface AllTrailsPlace {
  /** AllTrails 上的步道英文原名 */
  name: string;
  /** AllTrails 步道路径（拼在 https://www.alltrails.com/trail/ 后） */
  slug: string;
  /** 星级评分（1–5） */
  rating: number;
  /** 评价与打卡数量 */
  reviews: number;
  /** AllTrails 综合热度指数 */
  popularity: number;
  /** 步道客流强度：1 低 · 2 中 · 3 高 · 4 极高 */
  usage?: 1 | 2 | 3 | 4;
  /** AllTrails 步道精选封面图标识（用于拼接 images.alltrails.com 缩略图） */
  photo?: string;
}

export interface AllTrailsParkTrail extends AllTrailsPlace {
  /** 步道起点纬度 */
  lat: number;
  /** 步道起点经度 */
  lon: number;
  /** 全程往返或环线里程（英里） */
  lengthMi: number;
  /** 累计爬升（英尺） */
  gainFt: number;
  /** AllTrails 难度分级 */
  difficulty: "easy" | "moderate" | "hard";
  /** 路线形态：out 往返 · loop 环线 · point 点对点 */
  routeType: "out" | "loop" | "point";
  /** AllTrails 步道特征标签（如 waterfall, views, kids 等） */
  features?: string[];
  /** 若对应本站已收录的徒步景点，记录其景点 ID */
  attractionId?: string;
}

`;

const content =
  header +
  `export const alltrailsPlaces: Record<string, AllTrailsPlace> = ${JSON.stringify(alltrailsPlaces, null, 2)};\n\n` +
  `export const alltrailsParkCounts: Record<string, number> = ${JSON.stringify(alltrailsParkCounts, null, 2)};\n\n` +
  `export const alltrailsParkTop: Record<string, AllTrailsParkTrail[]> = ${JSON.stringify(alltrailsParkTop, null, 2)};\n`;

writeFileSync(OUTPUT, content);
console.log(
  `✓ Generated src/data/attractions/alltrails.generated.ts: ${Object.keys(alltrailsPlaces).length}/${hikes.length} hikes matched, ${Object.keys(alltrailsParkTop).length} parks with top trail rankings.`,
);
