import { airports } from "../../data/airports";
import { attractions, type AttractionWithPhoto } from "../../data/attractions";
import { campgrounds } from "../../data/campgrounds";
import { lodgingOptions } from "../../data/lodging";
import { parks } from "../../data/parks";
import { airbnbUrl } from "../airbnb";
import { addDays, nominalDate } from "../dates";
import { closedKind, generateTrip, type GuideSkipped, type LiveClosures } from "../generate-trip";
import { buildTimeline, buildTransferTimeline, NOMINAL_SUN, type LodgingPoint, type PlanStop, type SunWindow } from "../planner";
import { formatClock, minutesOfDay, sunTimes } from "../sun";
import { fitFor, type Party } from "../suitability";
import { zoneOf } from "../time-zone";
import { airportMinutes, gatewayNode, travelMinutes } from "../travel";
import { reachable } from "../trip-parks";
import type { Trip, TripLodging } from "../trip-store";
import {
  SKIP_REASONS,
  TRIP_RESULT_CONTRACT,
  validateTripRequest,
  type Place,
  type TripRequest,
  type ValidationIssue,
} from "./contract";
import { liveFromClosures, type ExtractedClosure, type ExtractedClosures } from "./live";

/**
 * plan_trip 工具：拿 TripRequest 调网站同一个自动生成攻略（generate-trip.ts）和时间线（planner.ts），
 * 返回 TripResult。不联网、不用浏览器，结果只取决于输入、referenceDate 和仓库里的数据，同样的输入每次一样。
 *
 * 和行程页的区别（写进结果的 assumptions，Writer 要照实说）：
 * - 行程页从机场到各景点的车程是浏览器里现查 OSRM；这里用预先算好的“机场 → 公园定位点”加“定位点 → 景点”，
 *   任意地点（不是常用机场）按直线距离估算
 * - 不联网读 NPS 实时公告：调用方查好传 live，或者传 Copilot 提取好的关闭清单 closures（近期出发、清单是新的才用）
 */
export const ENGINE = { name: "nps-guide-planner", version: "1" };

export class TripRequestError extends Error {
  readonly issues: ValidationIssue[];
  constructor(issues: ValidationIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
    this.name = "TripRequestError";
    this.issues = issues;
  }
}

export interface PlanOptions {
  /** 今天是哪天（只给了月份时按它算最近的那个月）；评测时固定住，结果才能复现 */
  referenceDate: string;
  /** NPS 实时公告里说关了的景点（调用方查好传进来） */
  live?: LiveClosures;
  /** Copilot 读 NPS 公告提取出的临时关闭（python -m nps_copilot alerts 写的 closures-latest.json） */
  closures?: ExtractedClosures;
}

const parkByCode = new Map(parks.map((park) => [park.code, park]));
const nearbyOf = (code: string) => parkByCode.get(code)?.nearby ?? [];
const stopById = new Map(attractions.map((stop) => [stop.id, stop]));
const stayOptions = [...lodgingOptions, ...campgrounds];
const lodgingById = new Map(stayOptions.map((option) => [option.id, option]));

/** 机场 / 地点 → 生成攻略要的出发地、回程地；常用机场带上预先算好的到各景点的车程 */
function endpoint(place: Place, role: "origin" | "destination", stops: PlanStop[]) {
  if ("airport" in place) {
    const airport = airports[place.airport];
    const minutes: Record<string, number> = {};
    for (const stop of stops) {
      const toPark = airportMinutes(place.airport, stop.park);
      if (toPark !== null) minutes[stop.id] = toPark + travelMinutes(gatewayNode(stop.park), stop.id);
    }
    return {
      kind: "custom" as const,
      id: `custom-${role}-${place.airport}`,
      name: `${airport.nameZh}（${place.airport}）`,
      lat: airport.lat,
      lon: airport.lon,
      minutes,
      endpoint: role,
    };
  }
  // 没有预先算好的车程：planner 的 lodgingLeg 按直线距离估算
  return { kind: "custom" as const, id: `custom-${role}-place`, name: place.name, lat: place.lat, lon: place.lon, minutes: {}, endpoint: role };
}

function sunFor(date: string, stop: { park: string; timeZone?: string }): SunWindow {
  const park = parkByCode.get(stop.park);
  const zone = zoneOf(stop);
  if (!park || !zone) return NOMINAL_SUN;
  const sun = sunTimes(date, park.gateway.lat, park.gateway.lon);
  return sun.kind === "normal"
    ? { sunrise: minutesOfDay(sun.sunrise, zone), sunset: minutesOfDay(sun.sunset, zone), zone }
    : { ...NOMINAL_SUN, zone };
}

const clock = (minutes: number | undefined) => (minutes === undefined ? null : formatClock(minutes));

export function planTrip(input: unknown, options: PlanOptions) {
  const issues = validateTripRequest(input);
  const request = input as TripRequest;
  if (issues.length === 0) {
    // 一段一段连得起来就行（常一起玩的，或者开车一天能到）：死亡谷 + 红杉与国王峡谷、锡安 + 布莱斯 + 羚羊峡谷 + 马蹄湾 + 大峡谷
    const reached = new Set(reachable(request.parks, nearbyOf));
    request.parks.forEach((code, i) => {
      if (!reached.has(code)) {
        issues.push({ path: `/parks/${i}`, message: `${code} 离 ${request.parks.filter((c) => reached.has(c)).join(", ")} 太远，开车一天到不了，排不进同一趟` });
      }
    });
  }
  // 点名要去、不去的景点和指定的住处都要是这几座公园的
  const known = new Set(attractions.filter((a) => request.parks.includes(a.park)).map((a) => a.id));
  for (const key of ["include", "exclude"] as const) {
    (request[key] ?? []).forEach((id, i) => {
      if (!known.has(id)) issues.push({ path: `/${key}/${i}`, message: `${id} 不是 ${request.parks.join(", ")} 的景点` });
    });
  }
  const stays = new Set(stayOptions.filter((option) => request.parks.includes(option.park)).map((option) => option.id));
  (request.lodging ?? []).forEach(({ night, id }, i) => {
    if (!stays.has(id)) issues.push({ path: `/lodging/${i}/id`, message: `${id} 不是 ${request.parks.join(", ")} 的推荐住宿` });
    if (night >= request.days) issues.push({ path: `/lodging/${i}/night`, message: `${request.days} 天的行程只有 ${request.days - 1} 晚在外面住` });
  });
  const main = issues.length === 0 ? parkByCode.get(request.parks[0]) : undefined;
  if (issues.length > 0 || !main) throw new TripRequestError(issues);

  const normalized: TripRequest = {
    ...request,
    destination: request.destination ?? request.origin,
    pace: request.pace ?? "normal",
    lodgingPref: request.lodgingPref ?? "any",
  };
  const month = normalized.startDate ? Number(normalized.startDate.slice(5, 7)) : normalized.month!;
  const reference = new Date(`${options.referenceDate}T12:00:00Z`);
  const firstDate = normalized.startDate || nominalDate(month, reference);
  const dateFor = (day: number) => addDays(firstDate, day);
  const assumptions: string[] = [];
  if (!normalized.startDate) assumptions.push(`month-only: 只给了月份，日出日落、班次、临时关闭按 ${firstDate} 起算`);
  for (const place of [normalized.origin, normalized.destination!]) {
    assumptions.push(
      "airport" in place
        ? `drive-times: ${place.airport} 到各景点按预先算好的“机场 → 公园定位点 → 景点”车程，行程页会现查 OSRM，可能差几十分钟`
        : `drive-times: ${place.name} 不是常用机场，到各景点的车程按直线距离估算`,
    );
  }
  let live = options.live;
  let byAlert = new Map<string, ExtractedClosure>();
  let maybeAlert = new Map<string, ExtractedClosure>();
  if (!live && options.closures) {
    const from = liveFromClosures(options.closures, normalized.startDate, normalized.days, options.referenceDate, normalized.parks);
    live = from.live;
    byAlert = from.byStop;
    maybeAlert = from.maybe;
    assumptions.push(
      from.status === "used"
        ? `live-alerts: 按 ${options.closures.fetched} 的 NPS 公告：标题里写着关了的不排，只有模型读出来的照排、提醒确认`
        : `no-live-alerts(${from.status}): ${LIVE_NOTES[from.status]}，只按仓库里整理的临时关闭`,
    );
  } else if (!live) assumptions.push("no-live-alerts: 没有读 NPS 实时公告，只按仓库里整理的临时关闭");

  const stops = attractions.filter((a) => normalized.parks.includes(a.park));
  const lodging = stayOptions
    .filter((option) => normalized.parks.includes(option.park))
    .map((option) => ({
      id: option.id,
      lat: option.lat,
      lon: option.lon,
      inPark: option.inPark,
      rental: option.rental,
      airbnb: option.airbnb,
      camp: option.camp,
    }));
  const origin = endpoint(normalized.origin, "origin", stops);
  const destination = endpoint(normalized.destination!, "destination", stops);
  const { trip, guide } = generateTrip(
    {
      parks: normalized.parks,
      month,
      startDate: normalized.startDate ?? "",
      days: normalized.days,
      origin,
      destination,
      pace: normalized.pace!,
      lodgingPref: normalized.lodgingPref!,
      party: normalized.party,
      include: normalized.include,
      exclude: normalized.exclude,
      nights: Object.fromEntries((normalized.lodging ?? []).map(({ night, id }) => [night, id])),
    },
    {
      stops,
      lodging,
      // 生成时和行程页一样，日出日落按主公园、主公园的时区算
      sunFor: (day) => sunFor(dateFor(day), { park: main.code }),
      dateFor,
      zoneFor: (code) => zoneOf({ park: code }),
      live,
    },
  );

  return {
    contract: TRIP_RESULT_CONTRACT,
    engine: ENGINE,
    request: normalized,
    referenceDate: options.referenceDate,
    days: describeDays(trip, dateFor, Boolean(normalized.startDate), { origin, destination }, normalized.party, maybeAlert),
    // 公告让它去不了的（不是季节、施工这些原因）附上是哪条公告
    skipped: describeSkipped(guide.skipped, (id) => {
      const closure = byAlert.get(id);
      const stop = stopById.get(id);
      if (!closure || !stop || !normalized.startDate) return undefined;
      const dates = Array.from({ length: normalized.days }, (_, day) => dateFor(day));
      return closedKind(stop, month, dates, dates, live) === "alert" ? closure : undefined;
    }),
    assumptions: [...new Set(assumptions)],
    // 网站行程页能直接用的行程（每天的景点、每晚住处、攻略说明）：对话框排出行程后原样放进行程页，
    // 页面上看到的就是 Copilot 说的那一份。Python 那边不读它
    trip,
  };
}

export type TripResult = ReturnType<typeof planTrip>;

/**
 * 把一个现成的行程（博主、NPS 官方推荐的真实行程）按网站的规则排时间线，看在我们的规则下有没有“去不了、赶不上”。
 * 评测用（scripts/eval-real-routes.mjs）：只定了月份，住处不知道（每天从第一站开始算），出发地、回程地按第一座公园的常用机场
 */
export function describeGivenTrip(trip: Trip, options: { parks: string[]; month: number; referenceDate: string }) {
  const firstDate = nominalDate(options.month, new Date(`${options.referenceDate}T12:00:00Z`));
  const stops = attractions.filter((a) => options.parks.includes(a.park));
  const airport = parkByCode.get(options.parks[0])?.airports[0];
  const place = airport ? { airport } : { name: "", lat: 0, lon: 0 };
  return describeDays(
    trip,
    (day) => addDays(firstDate, day),
    false,
    { origin: endpoint(place, "origin", stops), destination: endpoint(place, "destination", stops) },
    undefined,
    new Map(),
  );
}

function alertInfo(alert: ExtractedClosure) {
  return { title: alert.title, ...(alert.url ? { url: alert.url } : {}), ...(alert.reopen ? { reopen: alert.reopen } : {}) };
}

const LIVE_NOTES = {
  used: "",
  "month-only": "只定了月份，公告只说现在的情况，管不到",
  "too-far": "出发日期不在今天起两周内，公告只说现在的情况，管不到",
  stale: "公告提取结果太旧了（重新 npm run alerts:fetch、python -m nps_copilot alerts）",
  future: "公告提取结果比“今天”还晚（评测固定了以前的日期），不用",
} as const;

/** 逐天的时间线：和行程页一样，早上从前一晚住处出发、晚上回当晚住处，按当天第一站的时区 */
function describeDays(
  trip: Trip,
  dateFor: (day: number) => string,
  exact: boolean,
  endpoints: Record<"origin" | "destination", LodgingPoint & { name: string }>,
  party: Party | undefined,
  maybeAlert: Map<string, ExtractedClosure>,
) {
  const resolve = (
    night: TripLodging | null | undefined,
  ): (LodgingPoint & { nameZh: string; nameEn: string; kind: "option" | "endpoint"; rental?: boolean; airbnb?: string }) | undefined => {
    if (!night) return undefined;
    if (night.kind === "custom") {
      const point = night.id.startsWith("custom-origin") ? endpoints.origin : endpoints.destination;
      return { ...point, nameZh: point.name, nameEn: point.name, kind: "endpoint" };
    }
    const option = lodgingById.get(night.id);
    return option && { id: option.id, lat: option.lat, lon: option.lon, nameZh: option.nameZh, nameEn: option.nameEn, kind: "option", ...(option.rental ? { rental: true } : {}), ...(option.airbnb ? { airbnb: option.airbnb } : {}) };
  };
  let previous: PlanStop | undefined;
  return trip.days.map((items, d) => {
    const dayStops = items.map((item) => stopById.get(item.id)).filter((stop): stop is AttractionWithPhoto => Boolean(stop));
    const date = dateFor(d);
    const from = resolve(trip.nights[d]);
    const to = resolve(trip.nights[d + 1]);
    const first = dayStops[0] ?? previous;
    const sun = first ? sunFor(date, first) : NOMINAL_SUN;
    const context = { sun, from, to, previous, date };
    const nextPark = trip.days.slice(d + 1).flat().map((item) => stopById.get(item.id)?.park).find(Boolean);
    const near = new Set([previous?.park, nextPark].filter(Boolean));
    const timeline =
      (dayStops.length === 0 && buildTransferTimeline(context, attractions.filter((a) => near.has(a.park)))) ||
      buildTimeline(dayStops, context);
    previous = dayStops.at(-1) ?? previous;
    return {
      day: d + 1,
      date,
      dateIsExact: exact,
      parks: [...new Set(dayStops.map((stop) => stop.park))],
      timeZone: sun.zone ?? null,
      sunrise: sun === NOMINAL_SUN ? null : clock(sun.sunrise),
      sunset: sun === NOMINAL_SUN ? null : clock(sun.sunset),
      departAt: clock(timeline.departAt),
      returnAt: clock(timeline.returnAt),
      returnDriveMin: Math.round(timeline.returnDriveMin),
      driveMin: Math.round(timeline.driveMin),
      activeMin: Math.round(timeline.activeMin),
      warnings: [...(timeline.overloaded ? ["overloaded" as const] : []), ...(timeline.lateReturn ? ["lateReturn" as const] : [])],
      lodging: to
        ? {
            id: to.id,
            nameZh: to.nameZh,
            nameEn: to.nameEn,
            kind: to.kind,
            ...(to.rental ? { rental: true } : {}),
            // 民宿区：按这一晚的日期搜 Airbnb（只定了月份的不带日期）
            ...(to.airbnb ? { airbnbUrl: airbnbUrl(to.airbnb, exact ? date : null, exact ? dateFor(d + 1) : null) } : {}),
          }
        : null,
      stops: timeline.entries.map((entry, k) => {
        const stop = dayStops[k];
        return {
          id: stop.id,
          park: stop.park,
          nameZh: stop.nameZh,
          nameEn: stop.nameEn,
          kind: stop.kind,
          start: formatClock(entry.start),
          end: formatClock(entry.end),
          ...(entry.zoneShift ? { localStart: formatClock(entry.start + entry.zoneShift), timeZone: zoneOf(stop)! } : {}),
          driveMin: Math.round(entry.driveMin),
          waitMin: Math.round(entry.waitMin),
          slot: entry.slot,
          ...(entry.shuttle ? { shuttle: entry.shuttle.line } : {}),
          warnings: [
            ...entry.warnings,
            ...(fitFor(party, stop.family).serious ? (["familySerious"] as const) : []),
            ...(maybeAlert.has(stop.id) ? (["alertMaybeClosed"] as const) : []),
          ],
          ...(maybeAlert.has(stop.id) ? { alert: alertInfo(maybeAlert.get(stop.id)!) } : {}),
        };
      }),
    };
  });
}

function describeSkipped(skipped: GuideSkipped, alertFor: (id: string) => ExtractedClosure | undefined) {
  return SKIP_REASONS.flatMap((reason) =>
    (skipped[reason] ?? []).flatMap((id) => {
      const stop = stopById.get(id);
      if (!stop) return [];
      // 季节性关闭的：一年里哪几个月开，和为什么不开的第一句（“火瀑只在 2 月中下旬……出现”），Writer 照着说，别说得像是过几天就开
      const months = stop.openMonths ?? [];
      const seasonal = reason === "closed" && months.length > 0 && months.length < 12;
      const alert = reason === "closed" ? alertFor(id) : undefined;
      const note = reason === "closed" && !alert ? stop.closedNote?.split(/[，；。]/)[0] : undefined;
      return [
        {
          id,
          park: stop.park,
          nameZh: stop.nameZh,
          nameEn: stop.nameEn,
          reason,
          ...(seasonal ? { openMonths: months } : {}),
          ...(note ? { noteZh: note } : {}),
          ...(alert ? { alert: alertInfo(alert) } : {}),
        },
      ];
    }),
  );
}
