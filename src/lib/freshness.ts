import { attractions } from "../data/attractions";
import { googleSnapshotDate } from "../data/attractions/google";
import { auditDates } from "../data/audit-index.generated";
import { bookingRules } from "../data/bookings";
import { tempClosures } from "../data/closures";
import { lodgingSeasons } from "../data/lodging-seasons";
import { parkingChecked, parkingRules } from "../data/parking";
import { seasonalRoads } from "../data/roads";
import { shuttleSystems } from "../data/shuttles";
import { tourSchedules } from "../data/tours";
import { daysBetween, STALE_DAYS, staleness, type Staleness } from "./staleness";

export { STALE_DAYS } from "./staleness";

/** 手工整理的数据一条一行，带着核对日期（npm run check:freshness 列出过期的，见 staleness.ts） */

export type FactArea = "closure" | "lodgingSeason" | "shuttle" | "tour" | "booking" | "parking" | "road" | "audit" | "google";

export interface DatedFact {
  area: FactArea;
  /** 这条数据的 id（景点、住处、班车线、预约规则……） */
  id: string;
  /** 给人看的名字 */
  label: string;
  park?: string;
  /** 核对的日期 YYYY-MM-DD */
  date?: string;
  /** 时刻表、营业季节是哪一年的 */
  year?: number;
  source?: string;
}

export interface StaleFact extends DatedFact {
  reason: Staleness;
  /** 多少天没核对 */
  age?: number;
}

const nameOf = new Map(attractions.map((a) => [a.id, a.nameZh]));
const label = (ids: string[]) => ids.map((id) => nameOf.get(id) ?? id).join("、");
const parkOf = (id: string) => id.split("-")[0];

/** 所有带核对日期的手工数据，一条一行 */
export function datedFacts(): DatedFact[] {
  const facts: DatedFact[] = [];
  for (const c of tempClosures) {
    facts.push({ area: "closure", id: c.attractions.join(","), label: label(c.attractions), park: parkOf(c.attractions[0]), date: c.checked, source: c.source });
  }
  for (const [id, s] of Object.entries(lodgingSeasons)) {
    facts.push({ area: "lodgingSeason", id, label: id, park: parkOf(id), date: s.checked, year: s.year, source: s.source });
  }
  for (const s of shuttleSystems) {
    facts.push({ area: "shuttle", id: s.id, label: s.nameZh, park: s.park, date: s.checked, year: s.scheduleYear, source: s.source });
  }
  for (const t of tourSchedules) {
    facts.push({ area: "tour", id: t.id, label: label([t.id]), park: parkOf(t.id), year: t.scheduleYear, source: t.sources[0] });
  }
  for (const b of bookingRules) {
    facts.push({ area: "booking", id: b.id, label: b.titleZh, park: b.park, date: b.verified, source: b.source });
  }
  // 停车场：同一个停车场的几个景点一条规则，按停车场列一次
  const lots = new Map<string, { ids: string[]; source: string }>();
  for (const [id, rule] of Object.entries(parkingRules)) {
    // 没写停车场名字的按景点算
    const key = rule.lot ?? id;
    const lot = lots.get(key) ?? { ids: [], source: rule.source };
    lot.ids.push(id);
    lots.set(key, lot);
  }
  for (const [lot, { ids, source }] of lots) {
    facts.push({ area: "parking", id: ids.join(","), label: lot, park: parkOf(ids[0]), date: parkingChecked, source });
  }
  for (const r of seasonalRoads) facts.push({ area: "road", id: r.id, label: r.nameZh, park: r.park, date: r.checked, source: r.source });
  for (const [park, date] of Object.entries(auditDates.parks)) facts.push({ area: "audit", id: park, label: park, park, date });
  facts.push({ area: "google", id: "google", label: "Google Maps 评分快照", date: googleSnapshotDate });
  return facts;
}

export function staleFacts(facts: DatedFact[], today: string, days = STALE_DAYS): StaleFact[] {
  return facts.flatMap((fact) => {
    const reason = staleness(fact, today, days);
    return reason ? [{ ...fact, reason, ...(fact.date ? { age: daysBetween(fact.date, today) } : {}) }] : [];
  });
}

/** 没有逐条核对记录的景点（按公园数）：不算过期，报告里另外列一行 */
export function unauditedCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of attractions) if (!auditDates.attractions[a.id]) counts[a.park] = (counts[a.park] ?? 0) + 1;
  return counts;
}
