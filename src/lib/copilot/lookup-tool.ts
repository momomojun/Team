import { airports } from "../../data/airports";
import { attractions, type AttractionWithPhoto } from "../../data/attractions";
import type { AttractionKind } from "../../data/attractions/types";
import { campgrounds } from "../../data/campgrounds";
import { lodgingOptions } from "../../data/lodging";
import { parks } from "../../data/parks";
import { closureOn } from "../closures";
import { seasonalRoads, type SeasonalRoad } from "../../data/roads";
import { roadDecides, roadFor, roadStatus } from "../roads";
import { fitFor, type Party } from "../suitability";
import { departuresOn, runsOn, tourScheduleOf } from "../tours";
import { airportMinutes, gatewayNode, NO_ROAD_MIN, travelMinutes } from "../travel";

/**
 * Copilot 的查询工具（计划书的 is_open、drive_time、search_attractions；10-21 仓库主人要的“单独的查询工具”）。
 * 和 plan_trip 一样不联网、不用模型，只按网站的数据算：同样的输入每次结果一样。Copilot 问答时先调它拿到确定的答案，
 * 再让模型用大白话说出来（模型说的数字、时间要在这里的结果里出现过）。
 *
 * - is_open：某个景点某一天能不能去（临时关闭、季节性山路往年这一天通没通、开放月份、游船导览的班次、许可证）
 * - drive_time：两个地方之间开车多久（景点、住处、公园、常用机场，都用预先算好的车程表）
 * - search：按条件找景点（公园、类型、步道长度和难度、同行的人、不用抽签、这几天开着）
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
    };

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

/** 按条件找景点，必去的、园内热度高的排前面 */
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
    .sort((a, b) => Number(Boolean(b.stop.mustSee)) - Number(Boolean(a.stop.mustSee)) || (a.stop.hotRank ?? 99) - (b.stop.hotRank ?? 99));
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

export function lookup(request: LookupRequest) {
  if (request.tool === "is_open") return isOpen(request.attraction, request.date, request.text);
  if (request.tool === "drive_time") return driveTime(request.from, request.to);
  return searchAttractions(request);
}
