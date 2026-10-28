// 徒步路线的海拔剖面：沿着 trails.generated.ts 里每条步道的路线按等距离取点（最多 160 个），请 Valhalla 的 /height 给海拔
// （和生成路线是同一个公共服务，海拔来自约 30 米分辨率的数字高程模型），算出爬升、下降、最高最低。
// 输出 src/data/attractions/elevation.generated.ts；公园页的“徒步”按公园取（/api/elevation/[park]），画剖面、导出 GPX 用。
// 路线改了（npm run data:trails）以后重新跑：npm run data:elevation；只重算几个：UPDATE=zion,yose-mist-trail npm run data:elevation
// 跑完打印和资料里写的爬升（景点的 hike.gainFt）差得多的，核对用：可能是资料写错了，也可能是 OSM 上的路线只画了一段
import { existsSync, writeFileSync } from "node:fs";
import { attractions, sleep, USER_AGENT } from "./load-data.mjs";
import { trails } from "../src/data/attractions/trails.generated.ts";
import { cumulative, pointAt } from "../src/components/map/route-tour.ts";
import { climb, CLIMB_THRESHOLD, smoothElevations, SMOOTH_WINDOW, totalClimb } from "../src/lib/elevation.ts";

const OUTPUT = new URL("../src/data/attractions/elevation.generated.ts", import.meta.url);
const VALHALLA = "https://valhalla1.openstreetmap.de/height";
const MAX_SAMPLES = 160;
/** 取样间隔最短 15 米：高程模型本身约 30 米一格，再密只是在噪声里多算爬升 */
const MIN_STEP = 15;

const previous = existsSync(OUTPUT) ? (await import(OUTPUT.href)).profiles : {};
const update = (process.env.UPDATE ?? "").split(",").filter(Boolean);
/** ONLY=zion-angels-landing：只看这几条、不写文件 */
const only = (process.env.ONLY ?? "").split(",").filter(Boolean);
const wanted = (id) => update.length === 0 || update.some((key) => id === key || id.startsWith(`${key}-`));
const byId = new Map(attractions.map((a) => [a.id, a]));

/** 爬升、下降、最高最低：每次都按 src/lib/elevation.ts 现在的算法从取样重算 */
const withStats = ({ step, meters, ele }) => {
  const smooth = smoothElevations(ele);
  return { step, meters, ele, ...climb(smooth), min: Math.min(...smooth), max: Math.max(...smooth) };
};

const profiles = {};
const checks = [];
/**
 * 一条步道的海拔：沿着存下来的路线（地图上画的、GPX 里的）按等距离取点，只请 Valhalla 给这些点的海拔。
 * 不用它的 resample_distance：它按取样点之间的直线量距离，之字形的路（上优胜美地瀑布、布莱斯的躲猫猫环线）
 * 会把弯道抄近路，量出来短两三成，剖面的横轴就不对了。失败返回 null
 */
async function sample(id, trail) {
  const cum = cumulative(trail.path);
  const meters = cum.at(-1) * 1000;
  const count = Math.max(2, Math.min(MAX_SAMPLES, Math.floor(meters / MIN_STEP) + 1));
  const step = meters / (count - 1);
  const points = Array.from({ length: count }, (_, i) => pointAt(trail.path, cum, (i * step) / 1000));
  const res = await fetch(VALHALLA, {
    method: "POST",
    headers: { "User-Agent": USER_AGENT, "Content-Type": "application/json" },
    body: JSON.stringify({ shape: points.map(([lon, lat]) => ({ lat, lon })), range: false }),
  }).catch((error) => ({ ok: false, status: String(error) }));
  const data = res.ok ? await res.json() : null;
  const height = data?.height;
  await sleep(1100); // 公共服务，控制请求频率
  // 没有数据的点（海上、高程模型的空洞）是 null
  if (!height || height.length !== count || height.some((e) => e === null || e === undefined)) {
    console.warn(`✗ ${id}: ${res.status ?? ""} ${data?.error ?? "海拔不全"}`);
    return null;
  }
  return { step: Math.round(step * 10) / 10, meters: Math.round(meters), ele: height.map((e) => Math.round(e)) };
}

for (const [id, trail] of Object.entries(trails)) {
  if (only.length > 0 && !only.some((key) => id === key || id.startsWith(`${key}-`))) continue;
  // 不重新取样的照旧，但爬升按现在的算法重算（改了阈值、平滑不用重新请求）：UPDATE=none npm run data:elevation
  const fresh = wanted(id) || !previous[id] ? await sample(id, trail) : null;
  const samples = fresh ?? previous[id];
  if (!samples) continue;
  const profile = (profiles[id] = withStats(samples));
  if (fresh) {
    console.log(`${id}: ${(profile.meters / 1000).toFixed(2)} km · ${profile.ele.length} 点 · ${profile.min}–${profile.max} 米 · 爬升 ${profile.gain} / 下降 ${profile.loss}`);
  }
  // 和资料比（景点的 hike.gainFt）：环线比一圈的爬升；往返的我们只有单程，比去程的爬升（资料大多这么写）和来回的爬升
  const hike = byId.get(id)?.hike;
  if (hike?.gainFt) {
    checks.push({ id, listed: Math.round(hike.gainFt * 0.3048), up: profile.gain, total: totalClimb(profile, trail.loop), km: trail.km, loop: trail.loop });
  }
}

if (only.length === 0) writeFileSync(
  OUTPUT,
  `// 由 scripts/build-elevation.mjs 生成，请勿手改。海拔由 Valhalla（FOSSGIS 公共服务）按数字高程模型取样，路线 © OpenStreetMap contributors。
export interface TrailProfile {
  /** 取样间隔（米）：第 i 个点在路线上第 i × step 米处，最后一个点在终点（沿着存下来的路线量） */
  step: number;
  /** 路线长度（米）：单程，环线是一整圈 */
  meters: number;
  /** 每个取样点的海拔（米），高程模型的原始值；画剖面、算爬升前先 smoothElevations（src/lib/elevation.ts） */
  ele: number[];
  /** 单程的累计爬升、下降（米）：前后 ${SMOOTH_WINDOW} 个点取中位数去掉尖刺，再按 ${CLIMB_THRESHOLD} 米的阈值累计 */
  gain: number;
  loss: number;
  /** 平滑后的最低、最高海拔 */
  min: number;
  max: number;
}

export const profiles: Record<string, TrailProfile> = ${JSON.stringify(profiles)};
`,
);
console.log(`写入 ${Object.keys(profiles).length} / ${Object.keys(trails).length} 条步道的海拔`);

// 核对：往返的取去程爬升和来回爬升里离资料近的那个；差 40% 以上、而且差 60 米以上的列出来
const close = (c) => (c.loop || Math.abs(c.up - c.listed) <= Math.abs(c.total - c.listed) ? c.up : c.total);
const off = checks.filter((c) => Math.abs(close(c) - c.listed) > Math.max(60, c.listed * 0.4));
const ratio = checks.map((c) => close(c) / Math.max(1, c.listed)).sort((a, b) => a - b);
const median = (list) => list[list.length >> 1]?.toFixed(2);
console.log(`
和资料的爬升比：${checks.length} 条，中位数 ${median(ratio)} 倍；差得多的 ${off.length} 条：`);
for (const c of off) console.log(`  ${c.id}: 资料 ${c.listed} 米，算出去程 ${c.up}、来回 ${c.total} 米（${c.loop ? "环线" : "往返"}，路线 ${c.km} km）`);
