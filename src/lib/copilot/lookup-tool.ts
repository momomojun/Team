import { airports } from "../../data/airports";
import { attractions, type AttractionWithPhoto } from "../../data/attractions";
import type { AttractionKind } from "../../data/attractions/types";
import { campgrounds } from "../../data/campgrounds";
import { lodgingOptions } from "../../data/lodging";
import { parks } from "../../data/parks";
import { closureOn } from "../closures";
import { popularRank } from "../popularity";
import { seasonalRoads, type SeasonalRoad } from "../../data/roads";
import { roadDecides, roadFor, roadStatus } from "../roads";
import { fitFor, type Party } from "../suitability";
import { departuresOn, runsOn, tourScheduleOf } from "../tours";
import { airportMinutes, gatewayNode, NO_ROAD_MIN, travelMinutes } from "../travel";
import { bookingRules } from "../../data/bookings";
import { manualFees, parkingTags } from "../../data/fees-manual";
import { feesUpdated, parkFees } from "../../data/fees.generated";
import { bookingsForTrip, openingState } from "../booking";
import { crowdLevel, crowdRatios } from "../crowd";
import { rankSeasons, type ParkWindow } from "../season-score";
import { parkSeason, type ParkSeason } from "../seasons";
import { formatClock, minutesOfDay, sunTimes } from "../sun";
import { zoneOf } from "../time-zone";
import { parkVisits } from "../visits";
import { NONRESIDENT_PASS, RESIDENT_PASS, SURCHARGE } from "../../components/plan/budget";

/**
 * Copilot 的查询工具（计划书的 is_open、drive_time、search_attractions；10-21 仓库主人要的“单独的查询工具”）。
 * 和 plan_trip 一样不联网、不用模型，只按网站的数据算：同样的输入每次结果一样。Copilot 问答时先调它拿到确定的答案，
 * 再让模型用大白话说出来（模型说的数字、时间要在这里的结果里出现过）。
 *
 * - is_open：某个景点某一天能不能去（临时关闭、季节性山路往年这一天通没通、开放月份、游船导览的班次、许可证）
 * - drive_time：两个地方之间开车多久（景点、住处、公园、常用机场，都用预先算好的车程表）
 * - search：按条件找景点（公园、类型、步道长度和难度、同行的人、不用抽签、这几天开着）
 * - season_rank：按季节比公园（“什么时候去”页的打分，lib/season-score.ts）
 * - fees：门票、年卡、非居民附加费
 * - sun_times：某天日出日落几点（当地时间）
 * - booking：某天去要提前订什么、哪天开订（data/bookings.ts）
 * - crowd：每个月人多不多（NPS 游客人次）
 * 后五个是 11-13 为 search agent 加的：模型自己选工具、填参数，一句话可以查好几样
 */

export type LookupRequest =
  /** attraction：景点 id；问的是季节性山路本身（“Tioga Road 1 月开吗”）时给 text（原话），按路名认 */
  | { tool: "is_open"; attraction?: string; text?: string; date: string }
  | { tool: "drive_time"; from: string; to: string }
  | {
      tool: "search";
      parks: string[];
      kinds?: AttractionKind[];
      /** 步道来回最长几英里 */
      maxMiles?: number;
      difficulty?: ("easy" | "moderate" | "hard")[];
      party?: Party;
      /** 不要要预约、抽签的 */
      noPermit?: boolean;
      /** 这一天（或这个月）开着的 */
      date?: string;
      month?: number;
      limit?: number;
    }
  /** month（整个月）或 start（出发那天起十天，和“什么时候去”页一样）选一个；parks 给了就只比这几座 */
  | { tool: "season_rank"; month?: number; start?: string; parks?: string[]; today?: string; limit?: number }
  | { tool: "fees"; park: string }
  /** park 或 attraction 选一个 */
  | { tool: "sun_times"; park?: string; attraction?: string; date: string }
  /** 那天去 park（或其中的 attraction、住 lodging）要提前订什么；today 用来算还有几天开订 */
  | { tool: "booking"; park: string; date: string; attraction?: string; lodging?: string; today?: string }
  /** month 不给就列 12 个月 */
  | { tool: "crowd"; park: string; month?: number };

export interface OpenFact {
  kind: "closure" | "road" | "season" | "tour" | "permit" | "hours";
  /** 这一条说的是能去、去不了，还是要注意 */
  /** unlikely：按往年估、多半去不了（往年这一天通车的不到一半） */
  effect: "open" | "closed" | "unlikely" | "maybe" | "note";
  zh: string;
  en: string;
  source?: string;
}

const stopById = new Map(attractions.map((stop) => [stop.id, stop]));
const parkByCode = new Map(parks.map((park) => [park.code, park]));
const stayById = new Map([...lodgingOptions, ...campgrounds].map((option) => [option.id, option]));

const md = (monthDay: string) => `${Number(monthDay.slice(0, 2))} 月 ${Number(monthDay.slice(3, 5))} 日`;
const mdEn = (monthDay: string) =>
  `${["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."][Number(monthDay.slice(0, 2)) - 1]} ${Number(monthDay.slice(3, 5))}`;
const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

function brief(stop: AttractionWithPhoto) {
  return { id: stop.id, park: stop.park, nameZh: stop.nameZh, nameEn: stop.nameEn, kind: stop.kind };
}

// 路名的常见叫法：路名里括号前后两半、去掉“高山段”“山口段”，再加几个常说的
const ROAD_ALIASES: Record<string, string[]> = {
  "yose-tioga-road": ["泰奥加", "蒂奥加"],
  "glac-logan-pass": ["向阳大道", "Going-to-the-Sun"],
  "lavo-park-highway": ["拉森公园公路", "89 号公路"],
  "romo-trail-ridge-road": ["Trail Ridge"],
};

function roadNames(road: SeasonalRoad): string[] {
  const parts = [road.nameEn, road.nameZh].flatMap((name) => name.split(/[（）()]/)).map((part) => part.trim());
  const trimmed = parts.map((part) => part.replace(/(高山段|山口段|进园段)$/, "").replace(/, .*$/, "").trim());
  return [...new Set([...parts, ...trimmed, ...(ROAD_ALIASES[road.id] ?? [])])].filter((name) => name.length >= 3);
}

/** 原话里说到的季节性山路（按最长的叫法认）；空格不算（“120号公路”“120 号公路”一样） */
export function roadInText(text: string): SeasonalRoad | undefined {
  const squash = (value: string) => value.toLowerCase().replace(/\s+/g, "");
  const lower = squash(text);
  let best: { road: SeasonalRoad; length: number } | undefined;
  for (const road of seasonalRoads) {
    for (const name of roadNames(road)) {
      if (lower.includes(squash(name)) && (!best || name.length > best.length)) best = { road, length: name.length };
    }
  }
  return best?.road;
}

function roadFacts(road: SeasonalRoad, date: string): OpenFact[] {
  const status = roadStatus(road, date);
  if (!status) {
    return [{ kind: "road", effect: "maybe", zh: `${road.nameZh}的历年开关记录不够，说不准，出发前看 NPS 路况`, en: `Not enough history for ${road.nameEn}; check NPS road status.`, source: road.source }];
  }
  if (status.kind === "open") {
    return [{ kind: "road", effect: "open", zh: `${road.nameZh}这一年 ${md(status.opened)} 已经通车`, en: `${road.nameEn} opened on ${mdEn(status.opened)} that year.`, source: road.source }];
  }
  if (status.kind === "notYet") {
    return [{ kind: "road", effect: "closed", zh: `${road.nameZh}这一年要到 ${md(status.opened)} 才通车`, en: `${road.nameEn} doesn't open until ${mdEn(status.opened)} that year.`, source: road.source }];
  }
  if (status.kind === "closed") {
    return [{ kind: "road", effect: "closed", zh: `${road.nameZh}这一年 ${md(status.closed)} 已经封路`, en: `${road.nameEn} closed for the season on ${mdEn(status.closed)} that year.`, source: road.source }];
  }
  const share = status.open / status.known;
  // 两头先通的路段：春天的“往年开通日期”是同一天（这一段一般通车的日子），说成一句话
  const early = status.phase === "opening" && road.endSections && status.earliest === road.endSections.opens;
  const range = early
    ? `，路两头这一段春天比全线早通车，一般 ${md(road.endSections!.opens)}前后就能开进来`
    : status.earliest && status.latest
    ? status.phase === "opening"
      ? `，往年最早 ${md(status.earliest)}、最晚 ${md(status.latest)}通车`
      : `，往年最早 ${md(status.earliest)}、最晚 ${md(status.latest)}封路`
    : "";
  return [{
    kind: "road",
    effect: share >= 0.8 ? "open" : share >= 0.5 ? "maybe" : "unlikely",
    zh: `${road.nameZh}：有记录的 ${status.known} 年里，有 ${status.open} 年这一天是通车的${range}`,
    en: `${road.nameEn}: open on this date in ${status.open} of ${status.known} recorded years.`,
    source: road.source,
  }];
}

const verdictOf = (facts: OpenFact[]) =>
  facts.some((fact) => fact.effect === "closed")
    ? "closed"
    : facts.some((fact) => fact.effect === "unlikely")
      ? "unlikely"
      : facts.some((fact) => fact.effect === "maybe")
        ? "maybe"
        : "open";

/** 某个景点（或者原话里说到的季节性山路）date 这天能不能去：一条条列出依据，最后给一个结论 */
export function isOpen(id: string | undefined, date: string, text?: string) {
  const stop = id ? stopById.get(id) : undefined;
  if (!stop) {
    const named = text ? roadInText(text) : undefined;
    if (!named) return { tool: "is_open" as const, error: "unknown_attraction", attraction: id ?? null };
    const facts = roadFacts(named, date);
    return { tool: "is_open" as const, road: { id: named.id, park: named.park, nameZh: named.nameZh, nameEn: named.nameEn }, date, verdict: verdictOf(facts), facts };
  }
  const facts: OpenFact[] = [];
  const month = Number(date.slice(5, 7));
  const closure = closureOn(stop.id, date);
  if (closure) {
    facts.push({
      kind: "closure",
      effect: closure.certain ? "closed" : "maybe",
      zh: `临时关闭（${closure.closure.from} 起${closure.closure.reopen ? `，${closure.closure.reopen} 重开` : "，没公布重开日期"}）：${closure.closure.reasonZh}`,
      en: `Temporarily closed from ${closure.closure.from}${closure.closure.reopen ? ` until ${closure.closure.reopen}` : ", no reopening date announced"}.`,
      source: closure.closure.source,
    });
  }
  const road = roadFor(stop.id);
  const status = road ? roadStatus(road, date) : null;
  if (road) facts.push(...roadFacts(road, date));
  // 开放月份：路通了就能去的景点按路况算，不再看月份
  const roadOnly = road && status && roadDecides(road, stop.id);
  if (stop.openMonths !== undefined && !roadOnly) {
    if (stop.openMonths.length === 0) {
      facts.push({ kind: "season", effect: "closed", zh: `目前整年关闭：${stop.closedNote ?? ""}`.trim(), en: "Closed all year for now." });
    } else if (!stop.openMonths.includes(month)) {
      facts.push({ kind: "season", effect: "closed", zh: `一般只在 ${stop.openMonths.join("、")} 月开放${stop.closedNote ? `：${stop.closedNote}` : ""}`, en: `Usually open only in months ${stop.openMonths.join(", ")}.` });
    } else {
      facts.push({ kind: "season", effect: "open", zh: `${month} 月在一般的开放季节里`, en: `Month ${month} is within its usual season.` });
    }
  }
  if (tourScheduleOf(stop.id)) {
    const runs = runsOn(stop.id, date, true);
    const departures = departuresOn(stop.id, date);
    facts.push({
      kind: "tour",
      effect: runs ? "open" : "closed",
      zh: runs && departures?.times.length ? `这天有班次：${departures.times.map(clock).join("、")}（提前 ${departures.checkIn} 分钟到）` : "这天没有班次",
      en: runs && departures?.times.length ? `Departures that day: ${departures.times.map(clock).join(", ")}.` : "No departures that day.",
    });
  }
  const hours = stop.hours?.find((window) => !window.months || window.months.includes(month));
  if (hours) {
    facts.push({
      kind: "hours",
      effect: "note",
      zh: `开放时间 ${hours.open}${hours.lastEntry ? `，最晚 ${hours.lastEntry} 入场` : ""}${hours.close ? `，${hours.close} 前出来` : ""}`,
      en: `Hours: from ${hours.open}${hours.lastEntry ? `, last entry ${hours.lastEntry}` : ""}${hours.close ? `, out by ${hours.close}` : ""}.`,
    });
  }
  if (stop.permit) {
    facts.push({ kind: "permit", effect: "note", zh: `${stop.lottery ? "要抽签：" : "要预约："}${stop.permit}`, en: stop.lottery ? "Requires a lottery permit." : "Requires a reservation or permit." });
  }
  return { tool: "is_open" as const, attraction: brief(stop), date, verdict: verdictOf(facts), facts };
}

interface Point {
  kind: "attraction" | "lodging" | "park" | "airport";
  id: string;
  park?: string;
  nameZh: string;
  nameEn: string;
}

/** 景点、住处 id，公园代码，机场代码 → 车程表里的点 */
function pointOf(id: string): Point | null {
  const stop = stopById.get(id);
  if (stop) return { kind: "attraction", id, park: stop.park, nameZh: stop.nameZh, nameEn: stop.nameEn };
  const stay = stayById.get(id);
  if (stay) return { kind: "lodging", id, park: stay.park, nameZh: stay.nameZh, nameEn: stay.nameEn };
  const park = parkByCode.get(id);
  if (park) return { kind: "park", id: gatewayNode(id), park: id, nameZh: `${park.nameZh}（${park.gateway.nameZh}）`, nameEn: park.nameEn };
  const airport = airports[id];
  if (airport) return { kind: "airport", id, nameZh: `${airport.nameZh}（${id}）`, nameEn: `${id}` };
  return null;
}

/** 两个地方之间开车多少分钟（车程表；机场先开到公园定位点再算） */
export function driveTime(fromId: string, toId: string) {
  const from = pointOf(fromId);
  const to = pointOf(toId);
  if (!from || !to) return { tool: "drive_time" as const, error: "unknown_place", from: fromId, to: toId };
  let minutes: number | null;
  let via = "table";
  if (from.kind === "airport" || to.kind === "airport") {
    const [airport, other] = from.kind === "airport" ? [from, to] : [to, from];
    if (other.kind === "airport" || !other.park) return { tool: "drive_time" as const, error: "two_airports", from: fromId, to: toId };
    const toPark = airportMinutes(airport.id, other.park);
    minutes = toPark === null ? null : toPark + (other.kind === "park" ? 0 : travelMinutes(gatewayNode(other.park), other.id));
    via = "airport";
  } else {
    minutes = travelMinutes(from.id, to.id);
  }
  const noRoad = minutes === null || minutes >= NO_ROAD_MIN;
  return {
    tool: "drive_time" as const,
    from: { kind: from.kind, id: fromId, nameZh: from.nameZh, nameEn: from.nameEn },
    to: { kind: to.kind, id: toId, nameZh: to.nameZh, nameEn: to.nameEn },
    minutes: noRoad ? null : minutes,
    via,
    noRoad,
  };
}

/** 按条件找景点，必去的、园内热度高的排前面（徒步的热度看 AllTrails，lib/popularity.ts） */
export function searchAttractions(request: Extract<LookupRequest, { tool: "search" }>) {
  const month = request.month ?? (request.date ? Number(request.date.slice(5, 7)) : undefined);
  const hits = attractions
    .filter((stop) => request.parks.includes(stop.park))
    .filter((stop) => !request.kinds?.length || request.kinds.includes(stop.kind))
    .filter((stop) => request.maxMiles === undefined || (stop.hike?.distanceMi !== undefined && stop.hike.distanceMi <= request.maxMiles))
    .filter((stop) => !request.difficulty?.length || (stop.hike && request.difficulty.includes(stop.hike.difficulty)))
    .filter((stop) => !request.noPermit || !stop.permit)
    .map((stop) => ({ stop, fit: fitFor(request.party, stop.family) }))
    .filter(({ fit }) => fit.level !== "no")
    .filter(({ stop }) => {
      if (request.date) return !["closed", "unlikely"].includes(isOpen(stop.id, request.date).verdict ?? "open");
      if (month !== undefined) return stop.openMonths === undefined || stop.openMonths.includes(month);
      return true;
    })
    .sort((a, b) => Number(Boolean(b.stop.mustSee)) - Number(Boolean(a.stop.mustSee)) || (popularRank(a.stop) ?? 99) - (popularRank(b.stop) ?? 99));
  const limit = request.limit ?? 8;
  return {
    tool: "search" as const,
    total: hits.length,
    results: hits.slice(0, limit).map(({ stop, fit }) => ({
      ...brief(stop),
      hike: stop.hike ? { miles: stop.hike.distanceMi, gainFt: stop.hike.gainFt, difficulty: stop.hike.difficulty } : undefined,
      minutes: stop.durationMin,
      permit: stop.permit ? (stop.lottery ? "lottery" : "reservation") : undefined,
      mustSee: Boolean(stop.mustSee),
      caution: fit.level === "caution",
    })),
  };
}

const round = (value: number, digits = 0) => Math.round(value * 10 ** digits) / 10 ** digits;
const seasonsByToday = new Map<string, ParkSeason[]>();

/** 所有公园每个月的情况（parkSeason 要把全部景点过一遍，同一个 today 只算一次） */
function seasonsOn(today: string | undefined): ParkSeason[] {
  const key = today ?? "";
  if (!seasonsByToday.has(key)) seasonsByToday.set(key, parks.map((park) => parkSeason(park, today)));
  return seasonsByToday.get(key)!;
}

function seasonRow(item: ParkWindow) {
  const park = parkByCode.get(item.park.code);
  const climate = item.climate;
  return {
    code: item.park.code,
    nameZh: item.park.nameZh,
    nameEn: item.park.nameEn,
    site: park?.kind === "site",
    country: park?.country ?? "US",
    verdict: item.verdict,
    score: round(item.score, 1),
    inBestMonths: item.best,
    bestMonths: item.park.bestMonths,
    openShare: round(item.open, 2),
    closedMustSee: item.closedMustSee,
    climate: climate
      ? {
          highC: round(climate.high),
          hottestC: round(climate.hottest),
          lowC: round(climate.low),
          wetDays: round(climate.wetDays),
          snowDays: round(climate.snowDays),
        }
      : undefined,
    events: item.events,
    roads: item.roads.map((road) => ({ road: item.park.roadNames[road.road] ?? road.road, date: road.date, chance: round(road.chance, 2) })),
    crowd: item.crowd ? { level: item.crowd.level, perDay: Math.round(item.crowd.perDay) } : undefined,
  };
}

/** 按季节比公园：分最适合 / 可以去 / 不太合适三档（分数 5.2、3 分界，和“什么时候去”页一样） */
export function seasonRank(request: Extract<LookupRequest, { tool: "season_rank" }>) {
  const pick = request.start ? { start: request.start } : request.month ? { month: request.month } : null;
  if (!pick) return { tool: "season_rank" as const, error: "need_month_or_start" };
  // 和“什么时候去”页一样只比国家公园；点名比较时园外名胜（羚羊峡谷、马蹄湾……）也算
  const pool = seasonsOn(request.today).filter((park) =>
    request.parks?.length ? request.parks.includes(park.code) : parkByCode.get(park.code)?.kind !== "site",
  );
  const ranked = rankSeasons(pool, pick);
  const window = "start" in pick ? { from: pick.start, days: 10 } : { month: pick.month };
  if (request.parks?.length) return { tool: "season_rank" as const, window, compared: ranked.map(seasonRow) };
  const limit = request.limit ?? 10;
  const names = (items: ParkWindow[]) => items.map((item) => ({ code: item.park.code, nameZh: item.park.nameZh, nameEn: item.park.nameEn }));
  const great = ranked.filter((item) => item.verdict === "great");
  const ok = ranked.filter((item) => item.verdict === "ok");
  const poor = ranked.filter((item) => item.verdict === "poor");
  return {
    tool: "season_rank" as const,
    window,
    counts: { great: great.length, ok: ok.length, poor: poor.length },
    great: great.slice(0, limit).map(seasonRow),
    moreGreat: names(great.slice(limit)),
    ok: names(ok),
    poor: names(poor),
  };
}

/** 门票：一辆车 / 每人；美国 NPS 的公园另说年卡和 2026 年起的非居民附加费 */
export function fees(code: string) {
  const park = parkByCode.get(code);
  if (!park) return { tool: "fees" as const, error: "unknown_park", park: code };
  const nps = parkFees[code];
  const manual = manualFees[code];
  const tag = parkingTags[code];
  const npsPark = park.kind !== "site" && park.country !== "CA";
  return {
    tool: "fees" as const,
    park: { code, nameZh: park.nameZh, nameEn: park.nameEn },
    currency: manual?.currency ?? "USD",
    vehicle: nps?.vehicle ?? manual?.vehicle,
    perPerson: nps?.perPerson ?? manual?.perPerson,
    motorcycle: nps?.motorcycle,
    perDay: manual?.perDay ?? false,
    noteZh: nps?.note ?? manual?.note,
    parkingTag: tag ? { day: tag.day, week: tag.week, year: tag.year } : undefined,
    // 国家公园年卡只在美国 NPS 管的公园能用；园外名胜、加拿大的不行
    passes: npsPark ? { residentUsd: RESIDENT_PASS, nonresidentUsd: NONRESIDENT_PASS } : undefined,
    /** 16 岁以上的非美国居民每人；同车有人持有效年卡整车免收 */
    nonresidentSurchargeUsd: park.nonresidentSurcharge ? SURCHARGE : 0,
    checked: manual?.checked ?? feesUpdated,
    source: manual?.source ?? `https://www.nps.gov/${code}/planyourvisit/fees.htm`,
  };
}

/** 日出日落（当地时间，误差一两分钟）：景点按景点的位置和时区，公园按门户小镇 */
export function sunTimesAt(request: Extract<LookupRequest, { tool: "sun_times" }>) {
  const stop = request.attraction ? stopById.get(request.attraction) : undefined;
  const park = parkByCode.get(stop?.park ?? request.park ?? "");
  if (!park || (request.attraction && !stop)) {
    return { tool: "sun_times" as const, error: "unknown_place", park: request.park, attraction: request.attraction };
  }
  const point = stop ? { lat: stop.lat, lon: stop.lon } : park.gateway;
  const zone = (stop ? zoneOf(stop) : undefined) ?? park.timeZone;
  const sun = sunTimes(request.date, point.lat, point.lon);
  const place = stop ? brief(stop) : { code: park.code, nameZh: park.nameZh, nameEn: park.nameEn, gatewayZh: park.gateway.nameZh };
  if (sun.kind !== "normal") return { tool: "sun_times" as const, place, date: request.date, timeZone: zone, polar: sun.kind };
  return {
    tool: "sun_times" as const,
    place,
    date: request.date,
    timeZone: zone,
    sunrise: formatClock(minutesOfDay(sun.sunrise, zone)),
    sunset: formatClock(minutesOfDay(sun.sunset, zone)),
  };
}

/** 那天去要提前订的：按网站“要提前订的”那一套规则算哪天开订；给了 today 再算现在是什么状态 */
export function booking(request: Extract<LookupRequest, { tool: "booking" }>) {
  const park = parkByCode.get(request.park);
  if (!park) return { tool: "booking" as const, error: "unknown_park", park: request.park };
  const stops = request.attraction
    ? [request.attraction]
    : attractions.filter((stop) => stop.park === request.park).map((stop) => stop.id);
  const items = bookingsForTrip([{ day: 0, date: request.date, parks: [request.park], stops, lodging: request.lodging }], bookingRules);
  return {
    tool: "booking" as const,
    park: { code: park.code, nameZh: park.nameZh, nameEn: park.nameEn },
    date: request.date,
    items: items.map((item) => ({
      id: item.rule.id,
      titleZh: item.rule.titleZh,
      kind: item.rule.kind,
      for: item.rule.targets
        .filter((id) => stops.includes(id) || id === request.lodging)
        .map((id) => stopById.get(id)?.nameZh ?? stayById.get(id)?.nameZh ?? id),
      openings: item.openings.map((opening) => ({
        type: opening.window.type,
        opens: opening.opens,
        time: opening.time,
        tz: opening.tz,
        closes: opening.closes,
        results: opening.results,
        ...(request.today ? { state: openingState(opening, request.today) } : {}),
      })),
      noteZh: item.rule.noteZh,
      url: item.rule.url,
      verified: item.rule.verified,
    })),
  };
}

/** 人多不多：每个月平均每天多少人次、和最挤的月份比是哪一档（加拿大的公园、园外名胜没有按月的数字） */
export function crowd(code: string, month?: number) {
  const park = parkByCode.get(code);
  if (!park) return { tool: "crowd" as const, error: "unknown_park", park: code };
  const base = { tool: "crowd" as const, park: { code, nameZh: park.nameZh, nameEn: park.nameEn } };
  const visits = parkVisits(code);
  if (!visits) return { ...base, error: "no_data" };
  const daily = visits.daily;
  const ratios = daily ? crowdRatios(daily) : undefined;
  const months =
    daily && ratios ? daily.map((perDay, i) => ({ month: i + 1, perDay: Math.round(perDay), level: crowdLevel(ratios[i]) })) : undefined;
  return {
    ...base,
    latestYear: visits.lastYear,
    latestVisits: visits.latest,
    rank: visits.rank,
    months: month && months ? months.filter((row) => row.month === month) : months,
    busiestMonth: months ? months.reduce((a, b) => (b.perDay > a.perDay ? b : a)).month : undefined,
    quietestMonth: months ? months.reduce((a, b) => (b.perDay < a.perDay ? b : a)).month : undefined,
    years: visits.dailyYears,
    source: visits.sourceUrl,
  };
}

export function lookup(request: LookupRequest) {
  if (request.tool === "is_open") return isOpen(request.attraction, request.date, request.text);
  if (request.tool === "drive_time") return driveTime(request.from, request.to);
  if (request.tool === "season_rank") return seasonRank(request);
  if (request.tool === "fees") return fees(request.park);
  if (request.tool === "sun_times") return sunTimesAt(request);
  if (request.tool === "booking") return booking(request);
  if (request.tool === "crowd") return crowd(request.park, request.month);
  return searchAttractions(request);
}
