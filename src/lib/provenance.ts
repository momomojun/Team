import type { AttractionWithPhoto } from "../data/attractions";
import { googleSnapshotDate } from "../data/attractions/google";
import { auditDates } from "../data/audit-index.generated";
import { bookingRules } from "../data/bookings";
import { tempClosures } from "../data/closures";
import { parkingChecked, parkingRules } from "../data/parking";
import { seasonalRoads } from "../data/roads";
import { shuttleSystems } from "../data/shuttles";
import { tourSchedules } from "../data/tours";
import { staleness, type Staleness } from "./staleness";

/**
 * 行程里每一站的“资料出处”：这一站的信息各是从哪来的、哪天核对的，让用户自己判断信不信、出发前该再看哪一页。
 * 过期的规则和 npm run check:freshness 一样（staleness.ts）。只引用浏览器里本来就有的数据（排行程也要用）
 */
export type SourceKind = "audit" | "official" | "closure" | "shuttle" | "tour" | "booking" | "parking" | "road" | "family" | "rating" | "drive";

export interface SourceItem {
  kind: SourceKind;
  url?: string;
  /** 核对的日期 YYYY-MM-DD */
  date?: string;
  /** 时刻表是哪一年的 */
  year?: number;
  /** 逐园核对：这个景点自己有记录（false 是只有这座公园的核对记录） */
  exact?: boolean;
  stale: Staleness | null;
}

const AUDIT_URL = "https://github.com/momomojun/Team/tree/main/docs/archive/audit";

export function stopSources(stop: AttractionWithPhoto, options: { officialUrl?: string; today: string }): SourceItem[] {
  const items: Omit<SourceItem, "stale">[] = [];
  const own = auditDates.attractions[stop.id];
  const parkDate = auditDates.parks[stop.park];
  if (own || parkDate) items.push({ kind: "audit", date: own ?? parkDate, exact: Boolean(own), url: `${AUDIT_URL}/${own ?? parkDate}` });
  if (options.officialUrl) items.push({ kind: "official", url: options.officialUrl });
  for (const c of tempClosures) if (c.attractions.includes(stop.id)) items.push({ kind: "closure", url: c.source, date: c.checked });
  for (const s of shuttleSystems) {
    if (s.stops.some((x) => x.attractions.includes(stop.id))) items.push({ kind: "shuttle", url: s.source, date: s.checked, year: s.scheduleYear });
  }
  const tour = tourSchedules.find((t) => t.id === stop.id);
  if (tour) items.push({ kind: "tour", url: tour.sources[0], year: tour.scheduleYear });
  for (const b of bookingRules) if (b.targets.includes(stop.id)) items.push({ kind: "booking", url: b.source, date: b.verified });
  const parking = parkingRules[stop.id];
  if (parking) items.push({ kind: "parking", url: parking.source, date: parkingChecked });
  for (const r of seasonalRoads) {
    if (r.attractions.includes(stop.id) || r.afterRoad?.includes(stop.id)) items.push({ kind: "road", url: r.source, date: r.checked });
  }
  if (stop.family?.source) items.push({ kind: "family", url: stop.family.source });
  if (stop.google) items.push({ kind: "rating", date: googleSnapshotDate });
  items.push({ kind: "drive" });
  return items.map((item) => ({ ...item, stale: staleness(item, options.today) }));
}
