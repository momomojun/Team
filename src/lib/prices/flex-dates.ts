import { addDays } from "@/lib/dates";
import type { FlightQuery } from "./types";

/** 一次灵活日期查询的上限：自用抓取要排队，SerpApi 也按次计额度 */
export const FLEX_MAX_QUERIES = 6;

/** 0 是周日。按 UTC 日历日，避免时区把日期挤到前一天 */
function weekday(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/**
 * 在出发窗口里抽几天。周二、周三通常更便宜，够选的时候只用这两天；
 * 不够再退回窗口里的所有天。
 */
export function flexDepartures(start: string, spanDays: number, count = 3): string[] {
  const span = Math.min(Math.max(Math.round(spanDays), 1), 21);
  const days = Array.from({ length: span }, (_, i) => addDays(start, i));
  const midweek = days.filter((date) => {
    const day = weekday(date);
    return day === 2 || day === 3;
  });
  const pool = midweek.length >= count ? midweek : days;
  if (pool.length <= count) return pool;
  const step = (pool.length - 1) / (count - 1);
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    const date = pool[Math.round(i * step)];
    if (!picked.includes(date)) picked.push(date);
  }
  return picked;
}

/** 往返组合：出发日 × 第几天回来。天数多就少抽几个出发日，总数不超过 FLEX_MAX_QUERIES */
export function flexTripQueries(
  from: string,
  to: string,
  start: string,
  spanDays: number,
  nights: number[],
  adults: number,
): FlightQuery[] {
  const lengths = [...new Set(nights.filter((n) => n >= 2 && n <= 21))].sort((a, b) => a - b).slice(0, 3);
  if (!from || !to || from === to || lengths.length === 0) return [];
  const departures = flexDepartures(start, spanDays, lengths.length > 2 ? 2 : 3);
  const queries: FlightQuery[] = [];
  for (const date of departures) {
    for (const length of lengths) {
      if (queries.length >= FLEX_MAX_QUERIES) return queries;
      queries.push({
        legs: [
          { from, to, date },
          { from: to, to: from, date: addDays(date, length) },
        ],
        adults,
      });
    }
  }
  return queries;
}
