// 多 agent 协作的评测（copilot/eval/cases/soft-v1.jsonl）：排出来的行程有没有做到用户的软要求，用代码逐条判。
// 判法尽量站在用户那边、又不苛求做不到的：每天开车上限不算“从机场开到住处、换公园”这种怎样都得开的路（再给 45 分钟，和引擎一样），
// “几点前回住处”不算最后一天（那天是开去机场）。copilot/eval/soft.py 调它（scripts/soft-check.mjs），不联网、不调模型。
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
const dayStops = (day) => day.stops.filter((stop) => stop.slot !== "night");

/** 每天怎样都得开的路（前一晚住处直接开到当晚住处），按和行程页一样的算法 */
function transfers(result) {
  try {
    return dayInputs(result).map(({ context }) =>
      context.from && context.to && context.from.id !== context.to.id
        ? (buildTransferTimeline(context, attractions.filter((a) => result.request.parks.includes(a.park)))?.driveMin ?? 0)
        : 0,
    );
  } catch {
    return result.days.map(() => 0);
  }
}

const CHECKS = {
  rest_days: (result, { min, middle }) => {
    const days = result.days.filter((day, i) => (!middle || (i > 0 && i < result.days.length - 1)) && day.stops.length === 0);
    return [days.length >= min, `空着的天 ${days.map((day) => day.day).join("、") || "没有"}`];
  },
  rest_day_on: (result, { day }) => [result.days[day - 1]?.stops.length === 0, `第 ${day} 天 ${result.days[day - 1]?.stops.length ?? "?"} 站`],
  max_drive_per_day: (result, { minutes: limit }) => {
    const base = transfers(result);
    const over = result.days.filter((day, i) => day.driveMin > Math.max(limit, base[i] + DRIVE_GRACE_MIN));
    return [over.length === 0, over.map((day) => `第 ${day.day} 天开 ${day.driveMin} 分钟（怎样都得开 ${base[day.day - 1]}）`).join("；") || "都没超"];
  },
  max_lodgings: (result, { count }) => {
    const ids = new Set(result.days.slice(0, -1).map((day) => day.lodging?.id).filter(Boolean));
    return [ids.size <= count, `住处 ${ids.size} 家：${[...ids].join("、")}`];
  },
  depart_not_before: (result, { time }) => {
    const early = result.days.filter((day) => day.stops.length > 0 && day.departAt && minutes(day.departAt) < minutes(time));
    return [early.length === 0, early.map((day) => `第 ${day.day} 天 ${day.departAt} 出门`).join("；") || "都没早于"];
  },
  no_consecutive_early: (result, { before }) => {
    const early = result.days.map((day) => Boolean(day.departAt && minutes(day.departAt) < minutes(before)));
    const pair = early.findIndex((value, i) => value && early[i + 1]);
    return [pair < 0, pair < 0 ? `早出门的天：${early.flatMap((v, i) => (v ? [i + 1] : [])).join("、") || "没有"}` : `第 ${pair + 1}、${pair + 2} 天连着早起`];
  },
  return_by: (result, { time }) => {
    const late = result.days.slice(0, -1).filter((day) => day.returnAt && minutes(day.returnAt) > minutes(time));
    return [late.length === 0, late.map((day) => `第 ${day.day} 天 ${day.returnAt} 回`).join("；") || "都按时回"];
  },
  day_return_by: (result, { day, time }) => {
    const target = day === "last" ? result.days.at(-1) : result.days[day - 1];
    return [Boolean(target?.returnAt) && minutes(target.returnAt) <= minutes(time), `第 ${target?.day} 天 ${target?.returnAt ?? "?"} 到`];
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
    return [wrong.length === 0, wrong.length ? `第 ${wrong.join("、")} 天不对` : `第 ${days.join("、")} 天都在 ${park}`];
  },
  max_stops_per_day: (result, { count }) => {
    const over = result.days.filter((day) => dayStops(day).length > count);
    return [over.length === 0, over.map((day) => `第 ${day.day} 天 ${dayStops(day).length} 站`).join("；") || "都没超"];
  },
  day_max_stops: (result, { day, count }) => [dayStops(result.days[day - 1] ?? { stops: [] }).length <= count, `第 ${day} 天 ${dayStops(result.days[day - 1] ?? { stops: [] }).length} 站`],
  party_fit: (result, { party }) => {
    const bad = result.days.flatMap((day) => day.stops).filter((stop) => fitFor(party, byId.get(stop.id)?.family).level === "no");
    return [bad.length === 0, bad.map((stop) => stop.id).join("、") || "都适合"];
  },
  has_slot: (result, { slot, min }) => {
    const hits = result.days.flatMap((day) => day.stops).filter((stop) => stop.slot === slot);
    return [hits.length >= min, `${slot} ${hits.length} 站`];
  },
  slot_each_day: (result, { slot }) => {
    const missing = result.days.filter((day) => !day.stops.some((stop) => stop.slot === slot));
    return [missing.length === 0, missing.length ? `第 ${missing.map((day) => day.day).join("、")} 天没有` : "每天都有"];
  },
  include: (result, { ids }) => {
    const planned = new Set(result.days.flatMap((day) => day.stops.map((stop) => stop.id)));
    const missing = ids.filter((id) => !planned.has(id));
    return [missing.length === 0, missing.join("、") || "都排了"];
  },
  exclude: (result, { ids }) => {
    const planned = new Set(result.days.flatMap((day) => day.stops.map((stop) => stop.id)));
    const present = ids.filter((id) => planned.has(id));
    return [present.length === 0, present.join("、") || "都没排"];
  },
  max_areas_per_day: (result, { count }) => {
    const over = result.days.filter((day) => new Set(dayStops(day).map((stop) => areaOf(stop.id))).size > count);
    return [over.length === 0, over.map((day) => `第 ${day.day} 天 ${[...new Set(dayStops(day).map((stop) => areaOf(stop.id)))].join("、")}`).join("；") || "每天一个片区"];
  },
  day_single_area: (result, { day }) => {
    const areas = new Set(dayStops(result.days[day - 1] ?? { stops: [] }).map((stop) => areaOf(stop.id)));
    return [areas.size === 1, `第 ${day} 天 ${[...areas].join("、") || "没有景点"}`];
  },
  hikes_per_day: (result, { min }) => {
    const short = result.days.filter((day) => day.stops.filter((stop) => isHike(stop.id)).length < min);
    return [short.length === 0, short.length ? `第 ${short.map((day) => day.day).join("、")} 天没有徒步` : "每天都有"];
  },
  max_hike_min: (result, { minutes: limit }) => {
    const long = result.days.flatMap((day) => day.stops).filter((stop) => isHike(stop.id) && (byId.get(stop.id)?.durationMin ?? 0) > limit);
    return [long.length === 0, long.map((stop) => `${stop.id} ${byId.get(stop.id)?.durationMin} 分钟`).join("、") || "都没超"];
  },
  max_stop_minutes: (result, { minutes: limit }) => {
    const long = result.days.flatMap((day) => day.stops).filter((stop) => (byId.get(stop.id)?.durationMin ?? 0) > limit);
    return [long.length === 0, long.map((stop) => `${stop.id} ${byId.get(stop.id)?.durationMin} 分钟`).join("、") || "都没超"];
  },
  no_hazards: (result, { hazards }) => {
    const bad = result.days.flatMap((day) => day.stops).filter((stop) => byId.get(stop.id)?.family?.hazards?.some((h) => hazards.includes(h)));
    return [bad.length === 0, bad.map((stop) => stop.id).join("、") || "没有"];
  },
  no_shuttle_stops: (result) => {
    const bad = result.days.flatMap((day) => day.stops).filter((stop) => stop.shuttle);
    return [bad.length === 0, bad.map((stop) => `${stop.id}（${stop.shuttle}）`).join("、") || "没有要坐班车的"];
  },
  road_day: (result, { road }) => {
    const ids = new Set([...(roadById.get(road)?.attractions ?? []), ...(roadById.get(road)?.afterRoad ?? [])]);
    const days = result.days.filter((day) => day.stops.some((stop) => ids.has(stop.id)));
    return [days.length > 0, days.length ? `第 ${days.map((day) => day.day).join("、")} 天走这条路` : "没排这条路上的景点"];
  },
};

/** 一道题的检查：checks 每条 → { kind, ok, detail }；没排出行程（result 是空的）全算没做到 */
export function checkSoft(result, checks) {
  return checks.map((check) => {
    const run = CHECKS[check.kind];
    if (!run) return { kind: check.kind, ok: false, detail: "没有这种检查" };
    if (!result?.days) return { kind: check.kind, ok: false, detail: "没排出行程" };
    const [ok, detail] = run(result, check);
    return { kind: check.kind, ok: Boolean(ok), detail };
  });
}

export const CHECK_KINDS = Object.keys(CHECKS);
