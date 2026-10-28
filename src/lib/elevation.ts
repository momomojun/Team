// 步道的海拔剖面和 GPX：数据由 scripts/build-elevation.mjs 生成（data/attractions/elevation.generated.ts），
// 公园页的“徒步”按公园取（/api/elevation/[park]）。这里只放不碰页面的计算，测试也用
import { cumulative } from "@/components/map/route-tour";
import type { TrailProfile } from "@/data/attractions/elevation.generated";

/**
 * 高程模型约 30 米一格：沿着峡谷壁、悬崖边走的步道（天使降临、圣埃伦娜峡谷），取样点一会儿落在谷底一会儿落在崖顶，
 * 剖面上一根根尖刺、爬升多算好几百米。先取前后 5 个点的中位数去掉尖刺，再按 2 米的阈值累计。
 * 这组参数是拿 AllTrails 上长度差不多的 234 条步道的爬升定的（10-28）：中位数 1.01 倍、平均差 25 米、73% 在 ±25% 以内
 */
export const SMOOTH_WINDOW = 5;
/** 爬升只在离上一个拐点高出（或低出）超过这么多米才算一段 */
export const CLIMB_THRESHOLD = 2;

/**
 * 前后 window 个点的中位数：去掉高程模型的尖刺，剖面和爬升都用它。
 * 靠近两头的点前后各取一样多（第一个、最后一个点不动）：不然一路上坡的起点会被往上拉，登山口的海拔就不对了
 */
export function smoothElevations(elevations: number[], window = SMOOTH_WINDOW): number[] {
  const last = elevations.length - 1;
  return elevations.map((_, i) => {
    const half = Math.min(window >> 1, i, last - i);
    const around = elevations.slice(i - half, i + half + 1).sort((a, b) => a - b);
    return around[around.length >> 1];
  });
}

/** 按阈值累计爬升、下降（米），传进来的应该是 smoothElevations 过的 */
export function climb(elevations: number[], threshold = CLIMB_THRESHOLD): { gain: number; loss: number } {
  let gain = 0;
  let loss = 0;
  let anchor = elevations[0] ?? 0;
  for (const e of elevations) {
    if (e - anchor >= threshold) {
      gain += e - anchor;
      anchor = e;
    } else if (anchor - e >= threshold) {
      loss += anchor - e;
      anchor = e;
    }
  }
  return { gain: Math.round(gain), loss: Math.round(loss) };
}

/** 全程的爬升：环线就是一圈；往返原路回来，回程的爬升就是去程的下降 */
export function totalClimb(profile: Pick<TrailProfile, "gain" | "loss">, loop: boolean): number {
  return loop ? profile.gain : profile.gain + profile.loss;
}

/** 第 i 个取样点离起点多少米 */
export const sampleMeters = (profile: TrailProfile, i: number) => Math.min(i * profile.step, profile.meters);

/** 离起点 meters 米处的海拔（平滑过的取样点之间按直线插值） */
export function elevationAt(profile: TrailProfile, meters: number, ele = smoothElevations(profile.ele)): number {
  if (ele.length === 0) return 0;
  if (meters <= 0) return ele[0];
  if (meters >= profile.meters) return ele[ele.length - 1];
  const i = Math.min(ele.length - 2, Math.floor(meters / profile.step));
  const from = sampleMeters(profile, i);
  const span = sampleMeters(profile, i + 1) - from;
  const t = span > 0 ? (meters - from) / span : 0;
  return ele[i] + (ele[i + 1] - ele[i]) * t;
}

const escapeXml = (text: string) =>
  text.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);

/**
 * 一条步道的 GPX（导进手机上的离线地图、手表）：路线是 OpenStreetMap 上的步道（单程，往返的原路返回），
 * 有海拔就按离起点的距离插值写进每个点。路线按 ODbL 授权，文件里写明出处
 */
export function trailGpx({
  name,
  path,
  profile,
  link,
  note,
}: {
  name: string;
  path: [number, number][];
  profile?: TrailProfile;
  link?: string;
  /** 写进 desc，比如“单程，往返原路返回” */
  note?: string;
}): string {
  const cum = cumulative(path);
  const total = cum[cum.length - 1] || 1;
  // Valhalla 量的长度和这里的球面近似差一点：按比例对齐，终点的海拔落在剖面的终点
  const scale = profile ? profile.meters / (total * 1000) : 0;
  const smooth = profile ? smoothElevations(profile.ele) : [];
  const points = path
    .map(([lon, lat], i) => {
      const ele = profile ? `<ele>${elevationAt(profile, cum[i] * 1000 * scale, smooth).toFixed(1)}</ele>` : "";
      return `      <trkpt lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}">${ele}</trkpt>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="NPS Guide" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(name)}</name>
    <copyright author="OpenStreetMap contributors"><license>https://opendatacommons.org/licenses/odbl/</license></copyright>
${link ? `    <link href="${escapeXml(link)}"><text>NPS Guide</text></link>\n` : ""}  </metadata>
  <trk>
    <name>${escapeXml(name)}</name>
${note ? `    <desc>${escapeXml(note)}</desc>\n` : ""}    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>
`;
}
