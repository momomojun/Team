import { seasonalRoads } from "../data/roads";
import { crowdOf } from "./crowd";
import { addDays } from "./dates";
import { bestRoadDay, ROAD_LIKELY, roadStatus, type RoadStatus } from "./roads";
import type { MonthClimateSummary, ParkMonth, ParkSeason } from "./seasons";

// “什么时候去”的打分（原来写在 components/when/season-guide.tsx 里，11-13 挪出来，让 Copilot 的 season_rank 工具也用同一套）

export type Verdict = "great" | "ok" | "poor";

/** 一趟大概玩十天：看出发日起这十天落在哪几个月，按天数加权 */
export const WINDOW_DAYS = 10;

/**
 * 一个月的分数：最佳季节 +2，能去的景点比例 ×3，天气舒服（白天 15°C 以上）+1，太热（看最热的片区）、太冷、雨雪多扣分，
 * 特别活动每个 +0.4（最多 3 个）
 */
export function monthScore(month: ParkMonth): number {
  let score = (month.best ? 2 : 0) + 3 * month.open + Math.min(month.events.length, 3) * 0.4;
  const climate = month.climate;
  if (climate) {
    if (climate.hottest >= 38) score -= 2.5;
    else if (climate.hottest >= 33) score -= 1;
    else if (climate.high >= 15) score += 1;
    else if (climate.high < 5) score -= 1.5;
    if (climate.snowDays >= 8) score -= 1;
    else if (climate.snowDays >= 4) score -= 0.5;
    if (climate.wetDays >= 15) score -= 1;
    else if (climate.wetDays >= 10) score -= 0.5;
  }
  return score;
}

export const verdictOf = (score: number): Verdict => (score >= 5.2 ? "great" : score >= 3 ? "ok" : "poor");

/** 季节性道路往年这几天的情况（把握很大的不列） */
export interface RoadReason {
  road: string;
  date: string;
  status: RoadStatus;
  chance: number;
}

/** 往年这几天十有八九都通车的路，不用特别说 */
const ROAD_SURE = 0.9;

export interface ParkWindow {
  park: ParkSeason;
  score: number;
  verdict: Verdict;
  /** 这几天里各月合在一起 */
  best: boolean;
  open: number;
  closedMustSee: string[];
  climate?: MonthClimateSummary;
  events: string[];
  roads: RoadReason[];
  /** 这几天人多不多（加拿大的公园没有按月的数字） */
  crowd: ReturnType<typeof crowdOf>;
}

/**
 * 这几天（dates，只选了月份时没有）合起来的情况。选了具体日期时，季节性道路通了就能去的景点按往年这几天里
 * 把握最大的一天算（和自动生成攻略一样），不按开放月份：能去的比例、去不了的必去景点和分数都跟着改
 */
export function combine(park: ParkSeason, weights: Map<number, number>, dates: string[] | null): ParkWindow {
  const total = [...weights.values()].reduce((a, b) => a + b, 0);
  const entries = [...weights.entries()].map(([month, weight]) => ({
    month,
    info: park.months[month - 1],
    share: weight / total,
  }));
  let roadShift = 0;
  const openByRoad = new Set<string>();
  const closedByRoad = new Set<string>();
  const roads: RoadReason[] = [];
  for (const id of dates ? [...new Set(park.roadStops.map((stop) => stop.road))] : []) {
    const road = seasonalRoads.find((candidate) => candidate.id === id);
    const best = road && dates ? bestRoadDay(road, dates) : null;
    const status = road && best ? roadStatus(road, best.date) : null;
    if (!best || !status) continue;
    const open = best.chance >= ROAD_LIKELY;
    for (const stop of park.roadStops.filter((candidate) => candidate.road === id)) {
      const byMonth = entries.reduce(
        (sum, { month, share }) => sum + (!stop.openMonths || stop.openMonths.includes(month) ? share : 0),
        0,
      );
      roadShift += (stop.weight * ((open ? 1 : 0) - byMonth)) / Math.max(park.totalWeight, 1);
      if (stop.mustSee) (open ? openByRoad : closedByRoad).add(stop.mustSee);
    }
    if (best.chance < ROAD_SURE) roads.push({ road: id, date: best.date, status, chance: best.chance });
  }
  // 分数里能去的景点比例是 ×3
  const score = entries.reduce((sum, { info, share }) => sum + monthScore(info) * share, 0) + 3 * roadShift;
  const climates = entries.filter(({ info }) => info.climate);
  const weighted = (pick: (c: MonthClimateSummary) => number) =>
    climates.reduce((sum, { info, share }) => sum + pick(info.climate!) * share, 0) /
    climates.reduce((sum, { share }) => sum + share, 0);
  return {
    park,
    score,
    verdict: verdictOf(score),
    best: entries.every(({ info }) => info.best),
    open: entries.reduce((sum, { info, share }) => sum + info.open * share, 0) + roadShift,
    closedMustSee: [
      ...new Set([
        ...entries.flatMap(({ info }) => info.closedMustSee).filter((name) => !openByRoad.has(name)),
        ...closedByRoad,
      ]),
    ],
    climate: climates.length
      ? {
          high: weighted((c) => c.high),
          hottest: weighted((c) => c.hottest),
          low: weighted((c) => c.low),
          wetDays: weighted((c) => c.wetDays),
          snowDays: weighted((c) => c.snowDays),
        }
      : undefined,
    // 活动的月份要覆盖这几天的一半以上才算（9 月底出发时，9 月才有的活动不算）
    events: [...new Set(entries.flatMap(({ info }) => info.events))].filter(
      (event) => entries.reduce((sum, { info, share }) => sum + (info.events.includes(event) ? share : 0), 0) > 0.5,
    ),
    roads,
    crowd: crowdOf(park.daily, weights),
  };
}

/** 出发那天起 WINDOW_DAYS 天各在哪个月（按天数加权）和这几天的日期；只给月份时整个月算一份，没有具体日期 */
export function windowOf(pick: { month: number } | { start: string }): { weights: Map<number, number>; dates: string[] | null } {
  const weights = new Map<number, number>();
  if ("month" in pick) {
    weights.set(pick.month, 1);
    return { weights, dates: null };
  }
  const dates = Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(pick.start, i));
  for (const date of dates) {
    const month = Number(date.slice(5, 7));
    weights.set(month, (weights.get(month) ?? 0) + 1);
  }
  return { weights, dates };
}

/** 所有公园按这几天（或这个月）的分数从高到低排 */
export function rankSeasons(parks: ParkSeason[], pick: { month: number } | { start: string }): ParkWindow[] {
  const { weights, dates } = windowOf(pick);
  return parks.map((park) => combine(park, weights, dates)).sort((a, b) => b.score - a.score);
}
