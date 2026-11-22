// 软要求判分：排出来的行程有没有做到用户的软要求，用代码逐条判。多 agent 协作里两处用它：
// 审查 agent 每一轮先用它找没做到的（copilot/nps_copilot/team.py 经 scripts/soft-check.mjs 调），
// 评测（copilot/eval/cases/soft-v1.jsonl）按它打分。不联网、不调模型。
// 判法站在用户那边、又不苛求做不到的：每天开车上限不算“从机场开到住处、换公园”这种怎样都得开的路（再给 45 分钟，和引擎一样），
// “几点前回住处”不算最后一天（那天是开去机场，另有 day_return_by）。
// 每条返回 { kind, ok, detail（给人看的中文）, facts（没做到的天、景点、分钟数，Writer 按它写中英文的取舍说明） }
import { attractions } from "../src/data/attractions/index.ts";
import { seasonalRoads } from "../src/data/roads.ts";
import { dayInputs } from "../src/lib/copilot/plan-tool.ts";
import { buildTransferTimeline } from "../src/lib/planner.ts";
import { fitFor } from "../src/lib/suitability.ts";

const byId = new Map(attractions.map((a) => [a.id, a]));
const roadById = new Map(seasonalRoads.map((road) => [road.id, road]));
/** 怎样都得开的路以外，每天开车上限再放宽多少分钟（和 generate-trip.ts 的 DRIVE_GRACE_MIN 一样） */
const DRIVE_GRACE_MIN = 45;

const minutes = (clock) => {
  if (!clock) return null;
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
};
const isHike = (id) => byId.get(id)?.kind === "hike" || byId.get(id)?.hike !== undefined;
const areaOf = (id) => `${byId.get(id)?.park}/${byId.get(id)?.area ?? id}`;
const dayStops = (day) => (day?.stops ?? []).filter((stop) => stop.slot !== "night");
const allStops = (result) => result.days.flatMap((day) => day.stops);
const dayList = (days) => days.map((day) => day.day).join("、");

/** 每天怎样都得开的路（前一晚住处直接开到当晚住处），按和行程页一样的算法 */
function transfers(result) {
  try {
    const near = attractions.filter((a) => result.request.parks.includes(a.park));
    return dayInputs(result).map(({ context }) =>
      context.from && context.to && context.from.id !== context.to.id ? (buildTransferTimeline(context, near)?.driveMin ?? 0) : 0,
    );
  } catch {
    return result.days.map(() => 0);
  }
}

/** 每种检查：(result, 参数) → [ok, detail, facts] */
const CHECKS = {
  rest_days: (result, { min, middle }) => {
    const days = result.days.filter((day, i) => (!middle || (i > 0 && i < result.days.length - 1)) && day.stops.length === 0);
    return [days.length >= (min ?? 1), `空着的天：${dayList(days) || "没有"}`, { rest: days.map((day) => day.day) }];
  },
  rest_day_on: (result, { day }) => {
    const count = result.days[day - 1]?.stops.length;
    return [count === 0, `第 ${day} 天 ${count ?? "?"} 站`, { day, stops: count ?? null }];
  },
  max_drive_per_day: (result, { minutes: limit }) => {
    const base = transfers(result);
    const over = result.days.filter((day, i) => day.driveMin > Math.max(limit, base[i] + DRIVE_GRACE_MIN));
    return [
      over.length === 0,
      over.map((day) => `第 ${day.day} 天开 ${day.driveMin} 分钟（怎样都得开 ${base[day.day - 1]}）`).join("；") || "都没超",
      { days: over.map((day) => ({ day: day.day, minutes: day.driveMin, base: base[day.day - 1] })) },
    ];
  },
  max_lodgings: (result, { count }) => {
    const ids = [...new Set(result.days.slice(0, -1).map((day) => day.lodging?.id).filter(Boolean))];
    return [ids.length <= count, `住处 ${ids.length} 家：${ids.join("、")}`, { lodgings: ids }];
  },
  depart_not_before: (result, { time }) => {
    const early = result.days.filter((day) => day.stops.length > 0 && day.departAt && minutes(day.departAt) < minutes(time));
    return [early.length === 0, early.map((day) => `第 ${day.day} 天 ${day.departAt} 出门`).join("；") || "都没早于", { days: early.map((day) => ({ day: day.day, time: day.departAt })) }];
  },
  no_consecutive_early: (result, { before }) => {
    const early = result.days.map((day) => Boolean(day.departAt && minutes(day.departAt) < minutes(before)));
    const pair = early.findIndex((value, i) => value && early[i + 1]);
    return [
      pair < 0,
      pair < 0 ? `早出门的天：${early.flatMap((v, i) => (v ? [i + 1] : [])).join("、") || "没有"}` : `第 ${pair + 1}、${pair + 2} 天连着早起`,
      { days: pair < 0 ? [] : [{ day: pair + 1, time: result.days[pair].departAt }, { day: pair + 2, time: result.days[pair + 1].departAt }] },
    ];
  },
  return_by: (result, { time }) => {
    const late = result.days.slice(0, -1).filter((day) => day.returnAt && minutes(day.returnAt) > minutes(time));
    return [late.length === 0, late.map((day) => `第 ${day.day} 天 ${day.returnAt} 回`).join("；") || "都按时回", { days: late.map((day) => ({ day: day.day, time: day.returnAt })) }];
  },
  day_return_by: (result, { day, time }) => {
    const target = day === "last" ? result.days.at(-1) : result.days[day - 1];
    const ok = Boolean(target?.returnAt) && minutes(target.returnAt) <= minutes(time);
    return [ok, `第 ${target?.day} 天 ${target?.returnAt ?? "?"} 到`, { days: ok ? [] : [{ day: target?.day, time: target?.returnAt ?? null }] }];
  },
  park_days: (result, { park, days }) => {
    const wrong = days.filter((d) => {
      const day = result.days[d - 1];
      if (!day) return true;
      const foreign = day.stops.some((stop) => stop.park !== park);
      const mine = day.stops.some((stop) => stop.park === park);
      // 中间的天（不是整趟的第一天、最后一天）要有这座公园的景点
      return foreign || (!mine && d > 1 && d < result.days.length);
    });
    return [wrong.length === 0, wrong.length ? `第 ${wrong.join("、")} 天不对` : `第 ${days.join("、")} 天都在 ${park}`, { days: wrong.map((day) => ({ day })) }];
  },
  max_stops_per_day: (result, { count }) => {
    const over = result.days.filter((day) => dayStops(day).length > count);
    return [over.length === 0, over.map((day) => `第 ${day.day} 天 ${dayStops(day).length} 站`).join("；") || "都没超", { days: over.map((day) => ({ day: day.day, stops: dayStops(day).length })) }];
  },
  day_max_stops: (result, { day, count }) => {
    const stops = dayStops(result.days[day - 1]).length;
    return [stops <= count, `第 ${day} 天 ${stops} 站`, { days: stops <= count ? [] : [{ day, stops }] }];
  },
  party_fit: (result, { party }) => {
    const bad = allStops(result).filter((stop) => fitFor(party, byId.get(stop.id)?.family).level === "no");
    return [bad.length === 0, bad.map((stop) => stop.id).join("、") || "都适合", { ids: bad.map((stop) => stop.id) }];
  },
  has_slot: (result, { slot, min }) => {
    const hits = allStops(result).filter((stop) => stop.slot === slot);
    return [hits.length >= (min ?? 1), `${slot} ${hits.length} 站`, { count: hits.length }];
  },
  slot_each_day: (result, { slot }) => {
    const missing = result.days.filter((day) => !day.stops.some((stop) => stop.slot === slot));
    return [missing.length === 0, missing.length ? `第 ${dayList(missing)} 天没有` : "每天都有", { days: missing.map((day) => ({ day: day.day })) }];
  },
  include: (result, { ids }) => {
    const planned = new Set(allStops(result).map((stop) => stop.id));
    const missing = ids.filter((id) => !planned.has(id));
    return [missing.length === 0, missing.join("、") || "都排了", { ids: missing }];
  },
  exclude: (result, { ids }) => {
    const planned = new Set(allStops(result).map((stop) => stop.id));
    const present = ids.filter((id) => planned.has(id));
    return [present.length === 0, present.join("、") || "都没排", { ids: present }];
  },
  exclude_area: (result, { area }) => {
    const present = allStops(result).filter((stop) => areaOf(stop.id) === area);
    return [present.length === 0, present.map((stop) => stop.id).join("、") || "都没排", { ids: present.map((stop) => stop.id) }];
  },
  max_areas_per_day: (result, { count }) => {
    const areas = (day) => [...new Set(dayStops(day).map((stop) => areaOf(stop.id)))];
    const over = result.days.filter((day) => areas(day).length > count);
    return [over.length === 0, over.map((day) => `第 ${day.day} 天 ${areas(day).join("、")}`).join("；") || "每天一个片区", { days: over.map((day) => ({ day: day.day, areas: areas(day).length })) }];
  },
  day_single_area: (result, { day }) => {
    const areas = new Set(dayStops(result.days[day - 1]).map((stop) => areaOf(stop.id)));
    return [areas.size === 1, `第 ${day} 天 ${[...areas].join("、") || "没有景点"}`, { days: areas.size === 1 ? [] : [{ day, areas: areas.size }] }];
  },
  hikes_per_day: (result, { min }) => {
    const short = result.days.filter((day) => day.stops.filter((stop) => isHike(stop.id)).length < (min ?? 1));
    return [short.length === 0, short.length ? `第 ${dayList(short)} 天没有徒步` : "每天都有", { days: short.map((day) => ({ day: day.day })) }];
  },
  max_hike_min: (result, { minutes: limit }) => {
    const long = allStops(result).filter((stop) => isHike(stop.id) && (byId.get(stop.id)?.durationMin ?? 0) > limit);
    return [long.length === 0, long.map((stop) => `${stop.id} ${byId.get(stop.id)?.durationMin} 分钟`).join("、") || "都没超", { ids: long.map((stop) => stop.id) }];
  },
  max_stop_minutes: (result, { minutes: limit }) => {
    const long = allStops(result).filter((stop) => (byId.get(stop.id)?.durationMin ?? 0) > limit);
    return [long.length === 0, long.map((stop) => `${stop.id} ${byId.get(stop.id)?.durationMin} 分钟`).join("、") || "都没超", { ids: long.map((stop) => stop.id) }];
  },
  no_hazards: (result, { hazards }) => {
    const bad = allStops(result).filter((stop) => byId.get(stop.id)?.family?.hazards?.some((h) => hazards.includes(h)));
    return [bad.length === 0, bad.map((stop) => stop.id).join("、") || "没有", { ids: bad.map((stop) => stop.id) }];
  },
  no_shuttle_stops: (result) => {
    const bad = allStops(result).filter((stop) => stop.shuttle);
    return [bad.length === 0, bad.map((stop) => `${stop.id}（${stop.shuttle}）`).join("、") || "没有要坐班车的", { ids: bad.map((stop) => stop.id) }];
  },
  road_day: (result, { road }) => {
    const ids = new Set([...(roadById.get(road)?.attractions ?? []), ...(roadById.get(road)?.afterRoad ?? [])]);
    const days = result.days.filter((day) => day.stops.some((stop) => ids.has(stop.id)));
    return [days.length > 0, days.length ? `第 ${dayList(days)} 天走这条路` : "没排这条路上的景点", { days: days.map((day) => ({ day: day.day })) }];
  },
};

/** 一组检查：checks 每条 → { kind, ok, detail, facts }；没排出行程（result 是空的）全算没做到 */
export function checkSoft(result, checks) {
  return checks.map((check) => {
    const run = CHECKS[check.kind];
    if (!run) return { kind: check.kind, ok: false, detail: "没有这种检查", facts: {} };
    if (!result?.days) return { kind: check.kind, ok: false, detail: "没排出行程", facts: {} };
    const [ok, detail, facts] = run(result, check);
    return { kind: check.kind, ok: Boolean(ok), detail, facts: facts ?? {} };
  });
}

export const CHECK_KINDS = Object.keys(CHECKS);
