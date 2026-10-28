// 拿开源的车辆路径优化器 VROOM（https://github.com/VROOM-Project/vroom）当裁判：
// 引擎排出来的每条行程，景点不变、每晚住哪不变，让 VROOM 重新决定每个景点放在哪一天、每天按什么顺序走，看能少开多少车。
// 这是“分天”这一步的裁判（同一天之内的顺序，plan-quality-lib.mjs 已经逐一试过所有顺序）。
//
// 怎么交给 VROOM（一天当成一辆车：从前一晚住处出发、回当晚住处）：
//   - 车程矩阵用网站同一套车程（planner 的 lodgingLeg、estimatedLeg，班车季按坐班车算），停留时间用景点的停留
//   - 引擎卡在日出、日落、星空的景点，在 VROOM 里也只能在那一天的日出、日落、天黑以后（不让它为了少开车丢掉日出日落）
//   - 写了入场时间的（洞穴、公园大门）按入场时间；有固定班次的游船、导览团留在引擎排的那天（班次 VROOM 管不了）
//   - 一个景点只能放在同一座公园的日子里；每天的时间不比引擎那天短，也不超过这个节奏一天的上限（DAY_LIMIT）
// VROOM 不懂的规则（停车场几点停满、末班车、天黑还在徒步……）由我们自己再查一遍：VROOM 的排法按网站的规则重新排时间线，
// “去不了、赶不上、太满”比引擎多的另外列出来。所以 VROOM 少开的车是“分天这一步还能省多少”的上限，不是一定能省。
//
// 命令行入口 scripts/eval-referee.mjs（npm run eval:referee），要先装 VROOM 的 Python 包：python -m pip install pyvroom
import { attractions } from "../src/data/attractions/index.ts";
import { DAY_LIMIT } from "../src/lib/generate-trip.ts";
import { buildTimeline, entryWindow, estimatedLeg, lodgingLeg } from "../src/lib/planner.ts";
import { dayInputs, planTrip } from "../src/lib/copilot/plan-tool.ts";
import { tourScheduleOf } from "../src/lib/tours.ts";
import { REFERENCE_DATE, requests } from "./plan-quality-lib.mjs";

const byId = new Map(attractions.map((a) => [a.id, a]));
const DAY = 24 * 60;
/** 一天最早几点出发（引擎赶日出时更早，按引擎那天的出发时间） */
const DAY_START = 8 * 60;
const LATE_RETURN = 22 * 60;
const HARD = new Set(["afterHours", "missDeparture", "noService", "lastShuttle", "offTime", "dark", "missSunset", "tempClosed", "farTransfer", "parkingFull"]);

const minutes = (clock) => {
  if (!clock) return null;
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
};
const RAD = Math.PI / 180;
/** 两处住处之间（只在 VROOM 把一天排空时用到）：直线距离 × 1.35 的绕路系数，平均时速 55 公里，和 planner 估自定义住处一样 */
function lodgingToLodging(a, b) {
  if (a.id === b.id) return 0;
  const h = Math.sin(((b.lat - a.lat) * RAD) / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(((b.lon - a.lon) * RAD) / 2) ** 2;
  return Math.round(((2 * 6371 * Math.asin(Math.sqrt(h)) * 1.35) / 55) * 60) + 10;
}

const hardCount = (timeline) =>
  timeline.entries.reduce((n, entry) => n + entry.warnings.filter((w) => HARD.has(w)).length, 0) +
  (timeline.overloaded ? 1 : 0) +
  (timeline.lateReturn ? 1 : 0);

/** 一条行程交给 VROOM 的问题（JSON，scripts/vroom-referee.py 读），和我们自己算车程要用的东西 */
export function buildProblem(id, request, plan) {
  const inputs = dayInputs(plan);
  const days = plan.days;
  const date = days[0].date;
  // 地点：每天的出发、回去的住处（去重），再加上所有景点
  const lodgings = [];
  const lodgingIndex = new Map();
  const addLodging = (point) => {
    if (!lodgingIndex.has(point.id)) {
      lodgingIndex.set(point.id, lodgings.length);
      lodgings.push(point);
    }
    return lodgingIndex.get(point.id);
  };
  const vehicles = inputs.map((input, d) => ({ d, from: addLodging(input.context.from), to: addLodging(input.context.to) }));
  const stopIds = inputs.flatMap((input) => input.stops.map((s) => s.id));
  const stops = stopIds.map((sid) => byId.get(sid));
  const n = lodgings.length + stops.length;
  const at = (i) => (i < lodgings.length ? { lodging: lodgings[i] } : { stop: stops[i - lodgings.length] });
  const matrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 0;
      const a = at(i);
      const b = at(j);
      if (a.lodging && b.lodging) return lodgingToLodging(a.lodging, b.lodging);
      if (a.lodging) return lodgingLeg(a.lodging, b.stop, "out");
      if (b.lodging) return lodgingLeg(b.lodging, a.stop, "back");
      return estimatedLeg(a.stop, b.stop, date).minutes;
    }),
  );
  const stopIndex = (sid) => lodgings.length + stopIds.indexOf(sid);

  // 引擎那天每一站的时段（日出、日落、星空）
  const engineDay = new Map();
  const slotOf = new Map();
  days.forEach((day, d) => day.stops.forEach((entry) => (engineDay.set(entry.id, d), slotOf.set(entry.id, entry.slot))));
  const parksOfDay = days.map((day, d) => new Set([...day.stops.map((e) => byId.get(e.id).park), ...(inputs[d].stops.length ? [] : day.parks)]));
  const limit = DAY_LIMIT[request.pace ?? "normal"];

  const vehicleRows = vehicles.map(({ d, from, to }) => {
    const day = days[d];
    const depart = Math.min(DAY_START, minutes(day.departAt) ?? DAY_START);
    const back = Math.max(minutes(day.returnAt) ?? 0, Math.min(LATE_RETURN, depart + limit));
    return { id: d + 1, start: from, end: to, window: [d * DAY + depart, d * DAY + back] };
  });
  const jobs = stops.map((stop) => {
    const sid = stop.id;
    const home = engineDay.get(sid);
    const park = stop.park;
    // 能放在哪几天：同一座公园的日子；有固定班次的留在引擎排的那天
    const allowed = tourScheduleOf(sid)
      ? [home]
      : days.map((_, d) => d).filter((d) => parksOfDay[d].has(park) || d === home);
    const slot = slotOf.get(sid);
    const windows = allowed.map((d) => {
      const sunrise = minutes(days[d].sunrise) ?? 390;
      const sunset = minutes(days[d].sunset) ?? 1110;
      const entry = entryWindow(stop, days[d].date);
      let [from, to] = [0, DAY - 1];
      if (slot === "sunrise") [from, to] = [sunrise - 60, sunrise + 30];
      else if (slot === "sunset") [from, to] = [sunset - stop.durationMin - 60, sunset];
      else if (slot === "night") [from, to] = [sunset + 30, sunset + 240];
      if (entry) {
        from = Math.max(from, entry.open);
        to = Math.min(to, entry.lastEntry ?? (entry.close !== undefined ? entry.close - stop.durationMin : to));
      }
      return [d * DAY + from, d * DAY + Math.max(from, to)];
    });
    return { id: stopIndex(sid), location: stopIndex(sid), service: stop.durationMin, windows, allowed: allowed.map((d) => d + 1) };
  });
  return {
    id,
    // 都按分钟交给 VROOM（它只要求是整数）
    matrix,
    vehicles: vehicleRows,
    jobs,
    // 下面的不交给 VROOM，回来以后我们自己用
    meta: { stopIds, lodgingCount: lodgings.length, inputs, request },
  };
}

/** 一种分天、顺序（每天一串景点 id）按同一个矩阵开多久车；空的一天按住处到住处 */
function driveOf(problem, routes) {
  const { matrix, vehicles, meta } = problem;
  const index = (sid) => meta.lodgingCount + meta.stopIds.indexOf(sid);
  return vehicles.reduce((sum, vehicle, d) => {
    const ids = routes[d] ?? [];
    if (ids.length === 0) return sum + matrix[vehicle.start][vehicle.end];
    let total = matrix[vehicle.start][index(ids[0])] + matrix[index(ids.at(-1))][vehicle.end];
    for (let k = 1; k < ids.length; k++) total += matrix[index(ids[k - 1])][index(ids[k])];
    return sum + total;
  }, 0);
}

/** 按网站的规则把一种分天重新排时间线：“去不了、赶不上、太满”有几个，最累的一天从出发到回住处多久 */
function checkRoutes(problem, routes) {
  let hard = 0;
  let longest = 0;
  problem.meta.inputs.forEach((input, d) => {
    const ids = routes[d] ?? [];
    if (ids.length === 0) return;
    const timeline = buildTimeline(ids.map((sid) => byId.get(sid)), input.context);
    hard += hardCount(timeline);
    longest = Math.max(longest, timeline.activeMin);
  });
  return { hard, longest };
}

/** 固定的一组请求（和 plan-quality-lib 一样）里两天以上、至少 3 个景点的，排好行程、建好 VROOM 的问题 */
export function buildProblems() {
  const out = [];
  for (const { id, request } of requests()) {
    if (request.days < 2) continue;
    const plan = planTrip(request, { referenceDate: REFERENCE_DATE });
    if (plan.days.flatMap((d) => d.stops).length < 3) continue;
    out.push(buildProblem(id, request, plan));
  }
  return out;
}

/** VROOM 的解（每辆车的景点顺序、没排上的）和引擎的比 */
export function compare(problems, solutions) {
  const results = problems.map((problem) => {
    const solution = solutions[problem.id];
    const engineRoutes = problem.meta.inputs.map((input) => input.stops.map((s) => s.id));
    const engineDrive = driveOf(problem, engineRoutes);
    if (!solution) return { id: problem.id, solved: false, engineDrive };
    const toId = (job) => problem.meta.stopIds[job - problem.meta.lodgingCount];
    const vroomRoutes = problem.vehicles.map((vehicle) => (solution.routes[vehicle.id] ?? []).map(toId));
    const moved = problem.meta.stopIds.filter((sid) => {
      const was = engineRoutes.findIndex((ids) => ids.includes(sid));
      const now = vroomRoutes.findIndex((ids) => ids.includes(sid));
      return now >= 0 && now !== was;
    });
    const engineCheck = checkRoutes(problem, engineRoutes);
    const vroomCheck = checkRoutes(problem, vroomRoutes);
    return {
      id: problem.id,
      solved: true,
      engineDrive,
      vroomDrive: driveOf(problem, vroomRoutes),
      unassigned: solution.unassigned.map(toId),
      moved,
      engineHard: engineCheck.hard,
      vroomHard: vroomCheck.hard,
      engineLongest: engineCheck.longest,
      vroomLongest: vroomCheck.longest,
      vroomRoutes,
      engineRoutes,
    };
  });
  const solved = results.filter((r) => r.solved);
  // 只有 VROOM 也排上了全部景点、又不比引擎多“去不了、赶不上”的，少开的车才算数
  const clean = solved.filter((r) => r.unassigned.length === 0 && r.vroomHard <= r.engineHard);
  const sum = (list, key) => list.reduce((a, r) => a + r[key], 0);
  // VROOM 只管总共少开车，不管每天匀不匀（可能把四天的景点塞进一天）；引擎有意让最累的一天别太累。
  // 最累的一天不比引擎长（差 15 分钟以内）还能少开的，才是分天这一步真的能改进的
  const balanced = clean.filter((r) => r.vroomLongest <= r.engineLongest + 15);
  const summary = {
    trips: results.length,
    solved: solved.length,
    clean: clean.length,
    engineDrive: sum(clean, "engineDrive"),
    vroomDrive: sum(clean, "vroomDrive"),
    saving: sum(clean, "engineDrive") ? 1 - sum(clean, "vroomDrive") / sum(clean, "engineDrive") : null,
    tripsSaving30: clean.filter((r) => r.engineDrive - r.vroomDrive >= 30).length,
    balanced: balanced.length,
    balancedEngineDrive: sum(balanced, "engineDrive"),
    balancedVroomDrive: sum(balanced, "vroomDrive"),
    balancedSaving30: balanced.filter((r) => r.engineDrive - r.vroomDrive >= 30).length,
    vroomWorse: clean.filter((r) => r.vroomDrive > r.engineDrive).length,
    vroomUnassigned: solved.filter((r) => r.unassigned.length > 0).length,
    vroomMoreHard: solved.filter((r) => r.vroomHard > r.engineHard).length,
  };
  const name = (sid) => byId.get(sid)?.nameZh ?? sid;
  const top = balanced
    .map((r) => ({ ...r, saved: r.engineDrive - r.vroomDrive }))
    .filter((r) => r.saved > 0)
    .sort((a, b) => b.saved - a.saved);
  const pct = (x) => (x === null ? "—" : `${(x * 100).toFixed(1)}%`);
  const lines = [
    `# VROOM 当裁判：分天这一步还能少开多少车（${REFERENCE_DATE}）`,
    "",
    `${results.length} 条两天以上的行程（和行程质量评测同一组请求），景点、每晚住处不变，让 VROOM 重新分天、排顺序。`,
    "",
    "| 指标 | 结果 |",
    "|---|---|",
    `| VROOM 解出来的 | ${solved.length} / ${results.length} |`,
    `| VROOM 全排上、按我们的规则也不多出“去不了、赶不上”的 | ${clean.length} 条 |`,
    `| 这些行程一共开车：引擎 / VROOM | ${Math.round(summary.engineDrive)} / ${Math.round(summary.vroomDrive)} 分钟（VROOM 少 ${pct(summary.saving)}） |`,
    `| VROOM 能少开 30 分钟以上的行程 | ${summary.tripsSaving30} 条（VROOM 反而多开的 ${summary.vroomWorse} 条：它是启发式算法，不保证最优） |`,
    `| 其中最累的一天也不比引擎长的 | ${summary.balanced} 条：引擎 / VROOM ${Math.round(summary.balancedEngineDrive)} / ${Math.round(summary.balancedVroomDrive)} 分钟，少开 30 分钟以上的 ${summary.balancedSaving30} 条 |`,
    `| VROOM 有景点没排上（时间窗、一天的时长放不下） | ${summary.vroomUnassigned} 条 |`,
    `| VROOM 的排法按我们的规则多出“去不了、赶不上、太满” | ${summary.vroomMoreHard} 条（停车场、末班车这些 VROOM 不懂） |`,
    "",
    "## VROOM 少开车最多的几条（最累的一天不比引擎长、也不多出“去不了、赶不上”的）",
    "",
    ...(top.length
      ? top.slice(0, 10).flatMap((r) => [
          `- **${r.id}**：少开 ${Math.round(r.saved)} 分钟（${Math.round(r.engineDrive)} → ${Math.round(r.vroomDrive)}；最累的一天 ${Math.round(r.engineLongest)} → ${Math.round(r.vroomLongest)} 分钟），挪了 ${r.moved.length} 个景点：${r.moved.map(name).join("、") || "只换了顺序"}`,
          ...r.vroomRoutes.map((ids, d) => `  - 第 ${d + 1} 天 引擎：${r.engineRoutes[d].map(name).join(" → ") || "（空）"}；VROOM：${ids.map(name).join(" → ") || "（空）"}`),
        ])
      : ["- 没有"]),
    "",
  ];
  return { summary, results, lines };
}
