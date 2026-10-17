import { parkZones } from "../data/park-zones";

/**
 * 景点的时区。一般就是公园的时区（parks.ts 的 timeZone）；园内有一块用别的时区的，在景点上写 timeZone
 * （西奥多·罗斯福 North Unit 是中部时间，公园按 South Unit 写山地时间；贾斯珀旁边 BC 省的罗布森山）
 */
export function zoneOf(stop: { park: string; timeZone?: string }): string | undefined {
  return stop.timeZone ?? parkZones[stop.park];
}

/**
 * 时区数据库 2026c 才有的规则：BC 省 2026 年 3 月 8 日以后不再拨回（全年 UTC-7），艾伯塔 2026 年 11 月 1 日以后
 * 全年 UTC-6。Node 24 自带 2025b，很多手机、浏览器的数据也还没更新，会把冬天的班夫、贾斯珀算成 UTC-7，这里补上
 */
const PERMANENT: Record<string, { from: number; offset: number }> = {
  // 2026-11-01 凌晨 2 点（当地 UTC-6）不再拨回
  "America/Edmonton": { from: Date.UTC(2026, 10, 1, 8), offset: -6 * 60 },
  // 2026-03-08 拨快以后不再拨回
  "America/Vancouver": { from: Date.UTC(2026, 2, 8, 10), offset: -7 * 60 },
};

const formatters = new Map<string, Intl.DateTimeFormat>();

/** 某个时刻这个时区比 UTC 快多少分钟 */
export function offsetAt(zone: string, at: Date): number {
  const fixed = PERMANENT[zone];
  if (fixed && at.getTime() >= fixed.from) return fixed.offset;
  let format = formatters.get(zone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" });
    formatters.set(zone, format);
  }
  const name = format.formatToParts(at).find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name);
  return match ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] ?? 0)) : 0;
}

const offsets = new Map<string, number>();

/** 这一天这个时区比 UTC 快多少分钟（按当地中午算，夏令时都在凌晨切换，不影响白天） */
export function utcOffset(zone: string, date: string): number {
  const key = `${zone}|${date}`;
  const known = offsets.get(key);
  if (known !== undefined) return known;
  // 美洲的中午大约是 UTC 18–22 点，取 UTC 20 点，当地还是同一天
  const minutes = offsetAt(zone, new Date(`${date}T20:00:00Z`));
  offsets.set(key, minutes);
  return minutes;
}

/**
 * 当地时间比这一天行程用的时间快多少分钟：一天的时间线按 dayZone（一般是当天第一站的时区）算，
 * 别的时区的景点写的开门、班次、停车场时间都是当地时间，要先减去这个数。不知道日期、时区一样的都是 0
 */
export function zoneShift(zone: string | undefined, dayZone: string | undefined, date: string | null | undefined): number {
  if (!zone || !dayZone || zone === dayZone || !date) return 0;
  return utcOffset(zone, date) - utcOffset(dayZone, date);
}
