// 行程地图的路线动画（10-18 仓库主人定的：第一次排出行程、改了行程时自动播一段，之后看行程还是静态地图）。
// 这里是不碰地图的几何计算：一天的路线画到百分之几时线画到哪、车头在哪、各站在路线上的位置。地图上怎么播见 park-map.tsx

import type { NarrationLine, StopNarration } from "../../lib/narration";

/** 讲解版的开头和结尾：开头讲怎么看这张地图，结尾总结、提醒要提前订的 */
export interface TourNarration {
  /** 朗读用的语言（zh-CN / zh-TW / en-US） */
  lang: string;
  intro: { title: string; lines: NarrationLine[]; speech: string[] };
  outro: { lines: NarrationLine[]; speech: string[] };
}

/** 动画里的一天：前一晚住处 → 各站 → 当晚住处 */
export interface TourDay {
  day: number;
  color: string;
  /** 左上角的大字，比如“第 2 天 · 10 月 21 日” */
  title: string;
  /** 每天开头的章节字幕：大字“第 2 天”、日期、一句“6 个景点，开车 5 小时 25 分” */
  heading?: string;
  date?: string;
  subtitle?: string;
  /** 开车路线（[经度, 纬度]），还没查到真实道路时是按顺序连起来的直线 */
  path: [number, number][];
  straight?: boolean;
  /** 路上经过的各站和最后的住处：车头开到这里时弹出一个小牌子（“09:30 到 · 停 1 小时”） */
  stops: TourStop[];
  /** 这天最后看日落、星空：画到最后天色暗下来 */
  dusk?: boolean;
  /** 讲解版：这一天开头念的句子（“第 2 天，今天去 6 个地方，开车大约 5 小时”） */
  narration?: string[];
}

export interface TourStop {
  id: string;
  lon: number;
  lat: number;
  label: string;
  caption: string;
  /** 当晚住处：牌子换一种样式 */
  lodging?: boolean;
  /** 讲解版：到这一站时旁边的卡片（看点、怎么玩、什么时候、注意）和要念的句子 */
  narration?: StopNarration;
  /** 讲解卡片上的照片（Commons）和署名 */
  photo?: { url: string; credit: string };
}

const RAD = Math.PI / 180;

/** 两点之间的距离（公里，球面近似） */
export function km([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
  const x = (lon2 - lon1) * RAD * Math.cos(((lat1 + lat2) / 2) * RAD);
  const y = (lat2 - lat1) * RAD;
  return Math.sqrt(x * x + y * y) * 6371;
}

/** 折线每个点离起点有多少公里 */
export function cumulative(path: [number, number][]): number[] {
  const out = [0];
  for (let i = 1; i < path.length; i++) out.push(out[i - 1] + km(path[i - 1], path[i]));
  return out;
}

/** 画到 distance 公里时的折线（最后一段按比例截）和车头的位置 */
export function sliceTo(path: [number, number][], cum: number[], distance: number): { line: [number, number][]; head: [number, number] } {
  if (path.length === 0) return { line: [], head: [0, 0] };
  const total = cum[cum.length - 1];
  if (distance >= total) return { line: path, head: path[path.length - 1] };
  if (distance <= 0) return { line: [path[0]], head: path[0] };
  // 二分找到 distance 落在哪一段
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= distance) lo = mid;
    else hi = mid;
  }
  const span = cum[hi] - cum[lo] || 1;
  const f = (distance - cum[lo]) / span;
  const head: [number, number] = [path[lo][0] + (path[hi][0] - path[lo][0]) * f, path[lo][1] + (path[hi][1] - path[lo][1]) * f];
  return { line: [...path.slice(0, lo + 1), head], head };
}

/**
 * 各站在路线上的位置（离起点多少公里）：按顺序往后找离这一站最近的点，不往回找
 * （同一条路来回走两遍时，回程的那站不会被算到去程上）
 */
export function stopDistances(path: [number, number][], cum: number[], stops: { lon: number; lat: number }[]): number[] {
  const out: number[] = [];
  let from = 0;
  for (const stop of stops) {
    let best = from;
    let bestKm = Infinity;
    for (let i = from; i < path.length; i++) {
      const d = km(path[i], [stop.lon, stop.lat]);
      if (d < bestKm) {
        bestKm = d;
        best = i;
      }
    }
    out.push(cum[best] ?? 0);
    from = best;
  }
  return out;
}

/** 慢慢起步、慢慢停下（0–1 → 0–1） */
export function easeInOut(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
}

/** 整段动画放到哪了（0–1）：前面几天算整天，这一天按画到的比例 */
export function overallProgress(index: number, days: number, dayProgress: number): number {
  if (days <= 0) return 0;
  return Math.min(1, (index + Math.min(1, Math.max(0, dayProgress))) / days);
}

/** 线的颜色从尾巴的淡到车头的浓（line-gradient 用）：#rrggbb → rgba */
export function fade(color: string, alpha: number): string {
  const hex = color.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return color;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 一天画多久（毫秒）：按全程有几天分配，画线的部分一共十二秒上下（加上每天的开场卡片、到站停顿，四天的行程约二十五秒）；路线短的天也不会一闪而过 */
export function drawMs(days: number): number {
  return Math.round(Math.min(2800, Math.max(1500, 12000 / Math.max(1, days))));
}

/** 每天开场（卡片 + 镜头飞过去）多久：天数多的行程短一点 */
export function flyMs(days: number): number {
  return days > 5 ? 1300 : 1700;
}

// ---------- 跟车镜头（10-20 仓库主人：“太快了，想要镜头跟着车走”） ----------

/** 这一段该开多慢：离最近一站（起点、各站、终点）越近越慢（1 附近），长途开高速的中间快（0.2 左右） */
export function slowness(km: number, stopKm: number[], total: number): number {
  let gap = Math.min(km, Math.max(0, total - km));
  for (const stop of stopKm) gap = Math.min(gap, Math.abs(km - stop));
  return 0.2 + Math.exp(-gap / 2.5);
}

/** 每个路线点的累计“播放量”：路程 × 慢的程度；按它匀速播放，就是进站前减速、长途时加速 */
export function paceCost(cum: number[], stopKm: number[]): number[] {
  const total = cum[cum.length - 1] ?? 0;
  const out = [0];
  for (let i = 1; i < cum.length; i++) {
    const segment = cum[i] - cum[i - 1];
    out.push(out[i - 1] + segment * slowness(cum[i - 1] + segment / 2, stopKm, total));
  }
  return out;
}

/** 播到 value（0 到总播放量）时车在路线上的公里数 */
export function distanceAtCost(cum: number[], cost: number[], value: number): number {
  const total = cost[cost.length - 1] ?? 0;
  if (cost.length < 2 || value <= 0) return 0;
  if (value >= total) return cum[cum.length - 1];
  let lo = 0;
  let hi = cost.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cost[mid] <= value) lo = mid;
    else hi = mid;
  }
  const span = cost[hi] - cost[lo] || 1;
  return cum[lo] + ((value - cost[lo]) / span) * (cum[hi] - cum[lo]);
}

/** 跟车播一天多久（毫秒）：按播放量，限制在 9–18 秒（行程超过 6 天的，一天最多 12 秒）；从机场开进公园这种长途的一天也不会几秒就过去 */
export function followMs(totalCost: number, days: number): number {
  return Math.round(Math.min(days > 6 ? 12000 : 18000, Math.max(9000, totalCost * 160)));
}

/** 跟车镜头的缩放：开得慢（进站、园区里）凑近看（12.6），开得快（长途）拉远一点（10.2）；再近底图来不及加载 */
export function followZoom(slow: number): number {
  return 10.2 + (Math.min(1.2, Math.max(0.2, slow)) - 0.2) * 2.4;
}

/** 从 a 看 b 的方向（度，正北 0、顺时针） */
export function bearingOf([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
  const y = Math.sin((lon2 - lon1) * RAD) * Math.cos(lat2 * RAD);
  const x = Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) - Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lon2 - lon1) * RAD);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

/** 镜头方向慢慢转向 target（k 是这一帧转过去的比例），走最近的那个方向 */
export function turnToward(current: number, target: number, k: number): number {
  const diff = ((target - current + 540) % 360) - 180;
  return (current + diff * k + 360) % 360;
}

/** 这一天的范围（给地图缩放用） */
export function bounds(day: TourDay): [[number, number], [number, number]] {
  const points: [number, number][] = [...day.path, ...day.stops.map((stop) => [stop.lon, stop.lat] as [number, number])];
  const lons = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];
}

/**
 * 改了行程以后只播变了的那几天：一天的景点、顺序或者当晚住处变了就算变了
 * （before、after 是每天的“景点 id 列表 + 当晚住处”）。全新的行程（天数变了、第一次排）全部播
 */
export function changedDays(before: string[] | null, after: string[]): number[] {
  if (!before || before.length !== after.length) return after.map((_, day) => day);
  return after.flatMap((signature, day) => (signature !== before[day] ? [day] : []));
}
