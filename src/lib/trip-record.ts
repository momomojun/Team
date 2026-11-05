import { isCustomStop, type CustomStop } from "./custom-stops";
import type { GuideInfo } from "./generate-trip";

export type ItemStatus = "planned" | "done" | "skipped";

export interface TripItem {
  id: string;
  status: ItemStatus;
  /** “今天”模式里点“到了”“走了”的时间（毫秒时间戳），用来学这个人实际在景点停多久 */
  arrivedAt?: number;
  leftAt?: number;
}

/** 推荐住宿只存 id（名字随语言切换）；自定义住处存名字、坐标和查好的车程 */
export type TripLodging =
  | { kind: "option"; id: string }
  | {
      kind: "custom";
      id: string;
      name: string;
      lat: number;
      lon: number;
      /** 到各景点的车程（分钟），查不到时为空，按直线估算 */
      minutes: Record<string, number>;
      /** 自动生成攻略时的出发地 / 回程地（机场、城市），不是住处 */
      endpoint?: "origin" | "destination";
    };

export interface Trip {
  version: 2;
  /** 形如 "2026-10-05"；空字符串表示还没定 */
  startDate: string;
  /** 只定了月份、没定具体日期时的月份（1–12），日出日落和季节提示按这个月算 */
  month?: number;
  dayCount: number;
  days: TripItem[][];
  /** 已加入但还没排进哪一天的景点 */
  pool: string[];
  /** 长度为 dayCount + 1：nights[0] 是第 1 天出发前住的地方，nights[d] 是第 d 天晚上住的地方 */
  nights: (TripLodging | null)[];
  /** 自动生成攻略时记下的说明（哪些景点没排进去、为什么） */
  guide?: GuideInfo;
  /** 网站没收录、从徒步页加进来的 AllTrails 步道（custom-stops.ts）：id → 排行程要用的资料。days、pool 里照样只存 id */
  customStops?: Record<string, CustomStop>;
}

export const MAX_DAYS = 14;

export function fitNights(nights: (TripLodging | null)[] | undefined, dayCount: number) {
  const fitted = (nights ?? []).slice(0, dayCount + 1);
  while (fitted.length < dayCount + 1) fitted.push(null);
  return fitted;
}

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isString = (value: unknown): value is string => typeof value === "string";

/** 检查一晚的住处：分享链接、导入的文件都是外来数据，字段不对的当作没定 */
function normalizeLodging(value: unknown): TripLodging | null {
  if (!value || typeof value !== "object") return null;
  const night = value as Record<string, unknown>;
  if (night.kind === "option" && isString(night.id)) return { kind: "option", id: night.id };
  if (night.kind === "custom" && isString(night.id) && isString(night.name) && isNumber(night.lat) && isNumber(night.lon)) {
    const minutes = Object.fromEntries(
      Object.entries(night.minutes && typeof night.minutes === "object" ? night.minutes : {}).filter(([, m]) => isNumber(m)),
    ) as Record<string, number>;
    const endpoint = night.endpoint === "origin" || night.endpoint === "destination" ? night.endpoint : undefined;
    return { kind: "custom", id: night.id, name: night.name, lat: night.lat, lon: night.lon, minutes, ...(endpoint ? { endpoint } : {}) };
  }
  return null;
}

/** 分享、导入来的行程里的自定义步道：字段不对的丢掉 */
function customStopsOf(value: unknown): { customStops?: Record<string, CustomStop> } {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>).filter(
    (entry): entry is [string, CustomStop] => isCustomStop(entry[1]) && entry[1].id === entry[0],
  );
  return entries.length ? { customStops: Object.fromEntries(entries) } : {};
}

/** 把外来的行程数据（分享链接、导入的文件）整理成合法的行程；不像行程就返回 null */
export function normalizeTrip(value: unknown): Trip | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.days) || !Array.isArray(raw.pool)) return null;
  const days = raw.days.slice(0, MAX_DAYS).map((day) =>
    (Array.isArray(day) ? day : []).flatMap((item): TripItem[] => {
      const entry = item as Record<string, unknown> | null;
      if (!entry || !isString(entry.id)) return [];
      const status: ItemStatus = entry.status === "done" || entry.status === "skipped" ? entry.status : "planned";
      return [
        {
          id: entry.id,
          status,
          ...(isNumber(entry.arrivedAt) ? { arrivedAt: entry.arrivedAt } : {}),
          ...(isNumber(entry.leftAt) ? { leftAt: entry.leftAt } : {}),
        },
      ];
    }),
  );
  if (days.length === 0) days.push([]);
  const nights = Array.isArray(raw.nights) ? raw.nights.map(normalizeLodging) : [];
  const startDate = isString(raw.startDate) && /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate) ? raw.startDate : "";
  const month = isNumber(raw.month) && raw.month >= 1 && raw.month <= 12 ? raw.month : undefined;
  return {
    version: 2,
    startDate,
    ...(month && !startDate ? { month } : {}),
    dayCount: days.length,
    days,
    pool: raw.pool.filter(isString),
    nights: fitNights(nights, days.length),
    ...(raw.guide && typeof raw.guide === "object" ? { guide: raw.guide as Trip["guide"] } : {}),
    ...customStopsOf(raw.customStops),
  };
}
