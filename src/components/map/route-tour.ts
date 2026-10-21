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

// ---------- 讲解版的进度条和倍速（10-20 仓库主人：“讲解版可以拉进度条和调倍速”） ----------

/** 一天怎么播：各点的累计公里、各站在路线上的位置、播放量、这一天画多久（帧循环和进度条用同一份，两边对得上） */
export interface DayPlan {
  cum: number[];
  total: number;
  stopKm: number[];
  cost: number[];
  dayMs: number;
}

export function planDay(day: TourDay, days: number, calm: boolean): DayPlan {
  const cum = cumulative(day.path);
  const total = cum[cum.length - 1] ?? 0;
  const stopKm = stopDistances(day.path, cum, day.stops);
  const cost = paceCost(cum, stopKm);
  return { cum, total, stopKm, cost, dayMs: calm ? drawMs(days) : followMs(cost[cost.length - 1] ?? 0, days) };
}

/** 画到这一天的百分之几（0–1）时车开到第几公里：不跟车时整天慢慢起步、慢慢停下，跟车时按播放量 */
export function distanceAt(plan: DayPlan, progress: number, calm: boolean): number {
  const p = Math.min(1, Math.max(0, progress));
  return calm ? easeInOut(p) * plan.total : distanceAtCost(plan.cum, plan.cost, p * (plan.cost[plan.cost.length - 1] ?? 0));
}

/** 反过来：车开到第几公里时这一天画到了百分之几（拖进度条时用）；两个方向都是单调的，二分就行 */
export function progressAt(plan: DayPlan, distance: number, calm: boolean): number {
  if (plan.total <= 0 || distance <= 0) return 0;
  if (distance >= plan.total) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (distanceAt(plan, mid, calm) < distance) lo = mid;
    else hi = mid;
  }
  return hi;
}

/**
 * 进度条上的一段：开头讲怎么看地图、某天的开场、开车去下一站、在某一站讲解、一天开完拉远看、结尾。
 * ms 是一倍速下大概多久（念的部分按阅读时间估，实际朗读快慢不一样，进度条只是大致的位置）
 */
export type TourSegment =
  | { kind: "intro"; ms: number }
  | { kind: "day"; day: number; ms: number }
  /** 从第 from 公里开到第 to 公里，到的是第 stop 站（stop 等于站数时是开完最后一段） */
  | { kind: "drive"; day: number; stop: number; from: number; to: number; ms: number }
  | { kind: "stop"; day: number; stop: number; ms: number }
  | { kind: "end"; day: number; ms: number }
  | { kind: "outro"; ms: number };

export interface TimelineTiming {
  narrated: boolean;
  calm: boolean;
  /** 每天开场镜头飞多久、一天开完停多久、到站停多久、结尾停多久 */
  fly: number;
  hold: number;
  arrive: number;
  finale: number;
  /** 念这几句大概多久 */
  speech: (lines: string[]) => number;
  intro?: string[];
  outro?: string[];
}

/** 整段动画分成哪几段：和 park-map.tsx 的帧循环一样，到站停的只有离起点 50 米以上的站和讲解版里有讲解词的站 */
export function tourTimeline(days: TourDay[], plans: DayPlan[], timing: TimelineTiming): TourSegment[] {
  const out: TourSegment[] = [];
  if (timing.narrated && timing.intro?.length) out.push({ kind: "intro", ms: Math.max(1500, timing.speech(timing.intro)) });
  days.forEach((day, d) => {
    const plan = plans[d];
    const drive = (from: number, to: number) => Math.round(plan.dayMs * (progressAt(plan, to, timing.calm) - progressAt(plan, from, timing.calm)));
    out.push({ kind: "day", day: d, ms: Math.max(timing.fly, timing.narrated ? timing.speech(day.narration ?? []) : 0) });
    let from = 0;
    day.stops.forEach((stop, k) => {
      const at = plan.stopKm[k] ?? 0;
      const talk = timing.narrated && stop.narration;
      if (at <= 0.05 && !talk) return;
      if (at - from > 0.01) out.push({ kind: "drive", day: d, stop: k, from, to: at, ms: drive(from, at) });
      out.push({ kind: "stop", day: d, stop: k, ms: talk ? timing.speech(stop.narration!.speech) + 600 : timing.arrive });
      from = Math.max(from, at);
    });
    if (plan.total - from > 0.01) out.push({ kind: "drive", day: d, stop: day.stops.length, from, to: plan.total, ms: drive(from, plan.total) });
    out.push({ kind: "end", day: d, ms: timing.hold });
  });
  out.push({ kind: "outro", ms: Math.max(timing.finale, timing.narrated ? timing.speech(timing.outro ?? []) : 0) });
  return out;
}

/** 每一段从第几毫秒开始，最后一个是总长 */
export function segmentStarts(timeline: TourSegment[]): number[] {
  const starts = [0];
  for (const segment of timeline) starts.push(starts[starts.length - 1] + segment.ms);
  return starts;
}

/** 动画现在在哪：帧循环里的状态换成进度条上的第几段 */
export type TourWhere =
  | { kind: "intro" }
  | { kind: "day"; day: number }
  | { kind: "stop"; day: number; stop: number }
  | { kind: "drive"; day: number; distance: number }
  | { kind: "end"; day: number }
  | { kind: "outro" };

/** 在第几段，找不到是 -1（比如起点那一站不停，没有它自己的一段） */
export function segmentOf(timeline: TourSegment[], where: TourWhere): number {
  return timeline.findIndex((segment) => {
    if (segment.kind !== where.kind && !(where.kind === "drive" && segment.kind === "end")) return false;
    if (segment.kind === "intro" || segment.kind === "outro") return true;
    if (!("day" in where) || segment.day !== where.day) return false;
    if (segment.kind === "stop") return where.kind === "stop" && segment.stop === where.stop;
    // 开车：第一段终点还没到的；都过了（开完最后一站以后的零头）就算这一天的结尾
    if (segment.kind === "drive") return where.kind === "drive" && where.distance < segment.to - 1e-6;
    return true;
  });
}

/** 点进度条的第几毫秒跳到哪：开车的段跳到点的位置，其他的段（讲解、开场）从这一段开头讲起 */
export function seekTarget(timeline: TourSegment[], starts: number[], ms: number): { segment: number; fraction: number } {
  const total = starts[starts.length - 1] ?? 0;
  const at = Math.min(Math.max(0, ms), Math.max(0, total - 1));
  let segment = 0;
  while (segment < timeline.length - 1 && starts[segment + 1] <= at) segment += 1;
  const item = timeline[segment];
  const fraction = item?.kind === "drive" && item.ms > 0 ? (at - starts[segment]) / item.ms : 0;
  return { segment, fraction };
}

/** 上一段、下一段（键盘左右键、按钮）：只停在开场、各站、结尾；当前这段已经讲了两秒以上，“上一段”先回到这段开头 */
export function chapterStep(timeline: TourSegment[], starts: number[], ms: number, direction: 1 | -1): number {
  const chapters = timeline.flatMap((segment, index) => (segment.kind === "drive" || segment.kind === "end" ? [] : [index]));
  if (chapters.length === 0) return 0;
  const current = [...chapters].reverse().find((index) => starts[index] <= ms) ?? chapters[0];
  const position = chapters.indexOf(current);
  if (direction === 1) return chapters[Math.min(chapters.length - 1, position + 1)];
  if (ms - starts[current] > 2000) return current;
  return chapters[Math.max(0, position - 1)];
}

/** 倍速的几档 */
export const TOUR_SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/** 进度条旁边的时间：一倍速下的毫秒数按倍速换成“3:05” */
export function clockText(ms: number, speed: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000 / speed));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
