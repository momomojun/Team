// 给行程引擎排出的行程打分，照着两套公开的旅行规划评测：
//   - TravelPlanner（Xie et al., ICML 2024）：分“常识约束”（景点不重复、开着、时间排得开、每晚有住处……）和
//     “用户的硬约束”（几天、点名要去 / 不去的、节奏、同行的人），每条行程逐条检查；
//     micro 通过率 = 通过的检查 / 全部检查，macro 通过率 = 全部通过的行程 / 全部行程，最终通过率 = 两类都全过的行程
//   - TripCraft（Chaudhuri et al., ACL 2025）：不只看过不过，按 0–1 的连续分打：时间（看日出的在日出、看日落的在日落、
//     要早去的停车场赶在停满前）、空间（同一天这几个景点，换个顺序能不能少开车、又不多出“去不了、赶不上”）、
//     顺序（同一片区的景点挨着去，几座公园不来回跳）、同行的人（每站适不适合）
// 请求是固定的一组（每座公园一条，再加一些常一起玩的两座公园），月份、天数、节奏、同行的人轮着来，
// 出发、回程都是这座公园的常用机场。不联网、不调模型，同样的输入每次结果一样（REFERENCE_DATE 固定）。
// 命令行入口 scripts/eval-plan-quality.mjs（npm run eval:quality），tests/plan-quality.test.ts 拿它当门禁。
import { attractions } from "../src/data/attractions/index.ts";
import { parks } from "../src/data/parks.ts";
import { closedKind, MAX_HIKE_MIN, MAX_STOPS } from "../src/lib/generate-trip.ts";
import { popularRank } from "../src/lib/popularity.ts";
import { buildTimeline, parkingOn } from "../src/lib/planner.ts";
import { dayInputs, planTrip } from "../src/lib/copilot/plan-tool.ts";
import { fitFor } from "../src/lib/suitability.ts";
import { reachable } from "../src/lib/trip-parks.ts";

export const REFERENCE_DATE = "2026-10-27";

const byId = new Map(attractions.map((a) => [a.id, a]));
const parkByCode = new Map(parks.map((p) => [p.code, p]));
const stopsOf = (code) => attractions.filter((a) => a.park === code);

const MONTHS = [7, 10, 5, 8, 6, 9];
const PACES = ["normal", "relaxed", "packed", "leisurely"];
const PARTIES = [undefined, { youngestKid: 4 }, { seniors: true }, undefined, { wheelchair: true }];
/** 景点的“去不了、赶不上”（时间线上的提醒里算违反约束的） */
const TIMING = ["afterHours", "missDeparture", "noService", "lastShuttle", "offTime", "dark", "missSunset"];
/** 换顺序比车程时：这几种提醒不能比引擎排的多 */
const HARD_WARNINGS = new Set([...TIMING, "tempClosed", "farTransfer", "parkingFull"]);
/** 一天最多几站才逐一试所有顺序（7! = 5040 种） */
const MAX_PERMUTE = 7;

/** 必去的在前，再按园内名次（徒步按 AllTrails 的，lib/popularity.ts） */
const famousFirst = (a, b) => Number(Boolean(b.mustSee)) - Number(Boolean(a.mustSee)) || (popularRank(a) ?? 99) - (popularRank(b) ?? 99);
/** 这个月能去、不用抽签、适合同行的人：点名要去的从这里挑（点了去不了的，引擎本来就不排，不算引擎的错） */
const pickable = (stop, month, party) =>
  !stop.lottery && closedKind(stop, month, [], []) === null && fitFor(party, stop.family).level !== "no" && stop.kind !== "visitor";

/** 固定的一组请求：每座公园一条；有常一起玩的公园的，另加一条两座公园的 */
export function requests() {
  const out = [];
  const usable = parks.filter((p) => stopsOf(p.code).length >= 3 && p.airports?.length);
  usable.forEach((park, i) => {
    const month = MONTHS[i % MONTHS.length];
    const party = PARTIES[i % PARTIES.length];
    const candidates = stopsOf(park.code)
      .filter((s) => pickable(s, month, party))
      .sort(famousFirst);
    out.push({
      id: park.code,
      request: {
        contract: "trip-request/v1",
        parks: [park.code],
        month,
        days: 2 + (i % 3),
        origin: { airport: park.airports[0] },
        pace: PACES[i % PACES.length],
        ...(party ? { party } : {}),
        // 每两条点名一个要去的（不是热度第一，第一引擎本来就排）、每三条点名一个不去的
        ...(i % 2 === 0 && candidates[2] ? { include: [candidates[2].id] } : {}),
        ...(i % 3 === 0 && candidates[0] ? { exclude: [candidates[0].id] } : {}),
      },
    });
  });
  const seen = new Set();
  usable.forEach((park, i) => {
    const other = (park.nearby ?? []).find((code) => parkByCode.get(code)?.airports?.length && stopsOf(code).length >= 3);
    if (!other) return;
    const key = [park.code, other].sort().join("+");
    if (seen.has(key) || reachable([park.code, other], (code) => parkByCode.get(code)?.nearby ?? []).length < 2) return;
    seen.add(key);
    out.push({
      id: key,
      request: {
        contract: "trip-request/v1",
        parks: [park.code, other],
        month: i % 2 ? 9 : 7,
        days: 5,
        origin: { airport: park.airports[0] },
        destination: { airport: parkByCode.get(other).airports[0] },
        pace: i % 2 ? "relaxed" : "normal",
      },
    });
  });
  return out;
}

const minutes = (clock) => {
  if (!clock) return null;
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
};

/** 这个时段合不合：日出前后一个半小时、上午 12 点前、下午 12 点到日落、日落前后一小时（或者卡上了日落、星空）、天黑以后 */
function fitsTime(time, entry, sunrise, sunset) {
  const start = minutes(entry.start);
  if (time === "sunrise") return entry.slot === "sunrise" || Math.abs(start - sunrise) <= 90;
  if (time === "morning") return start < 12 * 60;
  if (time === "afternoon") return start >= 12 * 60 && start < sunset;
  if (time === "sunset") return entry.slot === "sunset" || entry.slot === "night" || Math.abs(minutes(entry.end) - sunset) <= 60;
  return entry.slot === "night" || start >= sunset;
}

/**
 * 这一站的时间合不合（TripCraft 的“时间”分）：写了最佳时段的，在其中一个时段里就算合（kind 是写的时段，几个的用“/”连起来）；
 * 停车场一早就满的，赶在停满前到才算合。都没有的不算
 */
function timeChecks(stop, entry, day) {
  const sunrise = minutes(day.sunrise) ?? 390;
  const sunset = minutes(day.sunset) ?? 1110;
  const wants = stop.bestTime ?? [];
  const checks = [];
  if (wants.length > 0) checks.push({ kind: wants.join("/"), ok: wants.some((time) => fitsTime(time, entry, sunrise, sunset)) });
  if (entry.warnings.includes("parkingFull") || parkingOn(stop, day.date)) checks.push({ kind: "parking", ok: !entry.warnings.includes("parkingFull") });
  return checks;
}

/** Heap 算法：一个数组的所有排列 */
function* permutations(items) {
  const a = [...items];
  const c = new Array(a.length).fill(0);
  yield [...a];
  let i = 0;
  while (i < a.length) {
    if (c[i] < i) {
      const j = i % 2 === 0 ? 0 : c[i];
      [a[j], a[i]] = [a[i], a[j]];
      yield [...a];
      c[i] += 1;
      i = 0;
    } else {
      c[i] = 0;
      i += 1;
    }
  }
}

const hardCount = (timeline) =>
  timeline.entries.reduce((n, entry) => n + entry.warnings.filter((w) => HARD_WARNINGS.has(w)).length, 0) +
  (timeline.overloaded ? 1 : 0) +
  (timeline.lateReturn ? 1 : 0);
/** 卡上了日出、日落、星空的站数：换顺序不能把这些丢掉（引擎为了赶日出日落会特意多开一点车） */
const golden = (timeline) => timeline.entries.filter((entry) => entry.slot !== "any").length;
const dayDrive = (timeline) => timeline.entries.reduce((sum, entry) => sum + entry.driveMin, 0) + timeline.returnDriveMin;

/**
 * 同一天的这几个景点，换个顺序最少开多久车（TripCraft 的“空间”分，相当于一个只管当天顺序的精确裁判）：
 * 每一种顺序都按网站同样的规则排时间线（住处、班车、开门时间、日出日落都算），“去不了、赶不上、太满”不比引擎排的多、
 * 卡上日出日落星空的站不比引擎排的少的里面，取开车最少的。引擎排顺序时为了别等开门、上午去该上午去的会多开一点车，所以不一定是 1
 */
export function bestOrder({ stops, context }) {
  const engine = buildTimeline(stops, context);
  const engineDrive = dayDrive(engine);
  if (stops.length < 2 || stops.length > MAX_PERMUTE) return { engineDrive, bestDrive: engineDrive, checked: stops.length < 2 };
  const limit = hardCount(engine);
  const slots = golden(engine);
  let bestDrive = engineDrive;
  let best = stops;
  for (const order of permutations(stops)) {
    const timeline = buildTimeline(order, context);
    const drive = dayDrive(timeline);
    if (drive < bestDrive && hardCount(timeline) <= limit && golden(timeline) >= slots) {
      bestDrive = drive;
      best = order;
    }
  }
  return { engineDrive, bestDrive, checked: true, best: best.map((s) => s.id) };
}

/** 一天里同一片区的景点挨不挨着（TripCraft 的“顺序”分）：片区换了几次，和最少要换几次比 */
function contiguity(labels) {
  if (labels.length < 2) return null;
  const distinct = new Set(labels).size;
  let changes = 0;
  for (let i = 1; i < labels.length; i++) if (labels[i] !== labels[i - 1]) changes += 1;
  return distinct / (changes + 1);
}

/** 评测一条行程：TravelPlanner 的逐条检查和 TripCraft 的连续分 */
export function scorePlan(request, plan) {
  const days = plan.days;
  const stops = days.flatMap((day) => day.stops.map((entry) => ({ entry, day, stop: byId.get(entry.id) })));
  const ids = stops.map((s) => s.entry.id);
  const planned = new Set(ids);
  const month = request.month;
  const include = request.include ?? [];
  const exact = Boolean(request.startDate);
  const fail = (list) => list.filter(Boolean);

  const commonsense = {
    // 同一个景点不去两次
    noRepeat: fail(ids.filter((id, i) => ids.indexOf(id) !== i)),
    // 景点都在要去的公园里
    inParks: fail(stops.filter((s) => !request.parks.includes(s.stop.park)).map((s) => s.entry.id)),
    // 那天开着：开放月份、季节性山路、游船班次、临时关闭
    open: fail(
      stops
        .filter(
          (s) =>
            s.entry.warnings.includes("tempClosed") ||
            closedKind(s.stop, month, exact ? [s.day.date] : [], exact ? [s.day.date] : []) !== null,
        )
        .map((s) => s.entry.id),
    ),
    // 时间排得开：没过入场时间、赶得上班次和末班车、没摸黑徒步、日落体验赶上了日落
    timing: fail(stops.flatMap((s) => s.entry.warnings.filter((w) => TIMING.includes(w)).map((w) => `${s.entry.id} ${w}`))),
    // 每天不超时、不太晚回住处、没有一段开十几个小时的；最后一站是看星空的晚上，晚回是看星空本来就要的，不算
    dayLoad: fail([
      ...days.flatMap((d) =>
        d.warnings.filter((w) => !(w === "lateReturn" && d.stops.at(-1)?.slot === "night")).map((w) => `第 ${d.day} 天 ${w}`),
      ),
      ...stops.filter((s) => s.entry.warnings.includes("farTransfer")).map((s) => `${s.entry.id} farTransfer`),
    ]),
    // 每晚都有住处，最后一天回到回程地
    lodging: fail([
      ...days.slice(0, -1).filter((d) => !d.lodging).map((d) => `第 ${d.day} 晚没住处`),
      ...(days.at(-1)?.lodging?.kind === "endpoint" ? [] : ["最后一天没回到回程地"]),
    ]),
    // 要抽签的不自动排（点名要去的除外）
    permit: fail(stops.filter((s) => s.stop.lottery && !include.includes(s.entry.id)).map((s) => s.entry.id)),
  };
  const nightOnly = (entry) => entry.slot === "night";
  const hard = {
    days: days.length === request.days ? [] : [`排了 ${days.length} 天`],
    include: include.filter((id) => !planned.has(id)),
    exclude: (request.exclude ?? []).filter((id) => planned.has(id)),
    // 节奏：悠闲一天最多四站；轻松、悠闲不排困难徒步；每档的最长徒步（点名要去的除外）
    pace: fail([
      ...days
        .filter((d) => d.stops.filter((e) => !nightOnly(e)).length > (MAX_STOPS[request.pace] ?? Infinity))
        .map((d) => `第 ${d.day} 天 ${d.stops.length} 站`),
      ...stops
        .filter(
          (s) =>
            s.stop.kind === "hike" &&
            !include.includes(s.entry.id) &&
            (s.stop.durationMin > MAX_HIKE_MIN[request.pace] ||
              ((request.pace === "relaxed" || request.pace === "leisurely") && s.stop.hike?.difficulty === "hard")),
        )
        .map((s) => s.entry.id),
    ]),
    // 同行的人：不适合的不排（只是要注意的照排）
    party: fail(stops.filter((s) => fitFor(request.party, s.stop.family).level === "no").map((s) => s.entry.id)),
  };

  // ---- TripCraft 的连续分 ----
  const times = stops.flatMap((s) => timeChecks(s.stop, s.entry, s.day).map((check) => ({ ...check, id: s.entry.id })));
  const inputs = dayInputs(plan);
  const spatialDays = inputs.map((input) => bestOrder(input));
  const engineDrive = spatialDays.reduce((a, d) => a + d.engineDrive, 0);
  const bestDrive = spatialDays.reduce((a, d) => a + d.bestDrive, 0);
  const areaScores = days
    .map((d) => contiguity(d.stops.map((e) => `${byId.get(e.id).park}/${byId.get(e.id).area ?? ""}`)))
    .filter((x) => x !== null);
  const parkOrder = days.map((d) => d.stops[0] && byId.get(d.stops[0].id).park).filter(Boolean);
  const parkScore = request.parks.length > 1 ? contiguity(parkOrder) : null;
  const fits = request.party ? stops.map((s) => fitFor(request.party, s.stop.family).level) : [];
  const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);

  return {
    commonsense,
    hard,
    scores: {
      temporal: times.length ? times.filter((check) => check.ok).length / times.length : null,
      spatial: engineDrive > 0 ? bestDrive / engineDrive : 1,
      ordering: mean([...areaScores, ...(parkScore === null ? [] : [parkScore])]),
      persona: fits.length ? mean(fits.map((level) => (level === "ok" ? 1 : level === "caution" ? 0.5 : 0))) : null,
    },
    times,
    spatialDays: spatialDays.map((d, i) => ({ day: i + 1, ...d })),
    stops: ids.length,
  };
}

/** 跑一遍：返回汇总、逐条结果和 Markdown 报告 */
export function evaluatePlanQuality() {
  const results = [];
  for (const { id, request } of requests()) {
    let plan;
    try {
      plan = planTrip(request, { referenceDate: REFERENCE_DATE });
    } catch (error) {
      results.push({ id, request, delivered: false, error: error.message });
      continue;
    }
    results.push({ id, request, delivered: true, ...scorePlan(request, plan) });
  }

  const delivered = results.filter((r) => r.delivered);
  const groups = { commonsense: Object.keys(delivered[0]?.commonsense ?? {}), hard: Object.keys(delivered[0]?.hard ?? {}) };
  const passes = (r, group) => groups[group].every((key) => r[group][key].length === 0);
  const micro = (group) => {
    const checks = delivered.length * groups[group].length;
    const passed = delivered.reduce((n, r) => n + groups[group].filter((key) => r[group][key].length === 0).length, 0);
    return checks ? passed / checks : null;
  };
  const avg = (key) => {
    const values = delivered.map((r) => r.scores[key]).filter((x) => x !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  const failures = Object.fromEntries(
    ["commonsense", "hard"].flatMap((group) =>
      groups[group].map((key) => [`${group}.${key}`, delivered.filter((r) => r[group][key].length > 0).map((r) => ({ id: r.id, what: r[group][key] }))]),
    ),
  );
  const wasted = delivered
    .flatMap((r) => r.spatialDays.map((d) => ({ id: r.id, day: d.day, minutes: Math.round(d.engineDrive - d.bestDrive), best: d.best })))
    .filter((d) => d.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
  // 时间分按写的时段分开看：只写了“日落”的、日落和日出都行的……各有几成合
  const byTime = {};
  for (const r of delivered)
    for (const check of r.times) {
      const key = check.kind === "parking" ? "parking" : check.kind.includes("/") ? "several" : check.kind;
      byTime[key] ??= { ok: 0, all: 0, misses: [] };
      byTime[key].all += 1;
      if (check.ok) byTime[key].ok += 1;
      else if (byTime[key].misses.length < 4) byTime[key].misses.push(`${r.id} ${check.id}`);
    }
  const summary = {
    referenceDate: REFERENCE_DATE,
    requests: results.length,
    deliveryRate: delivered.length / results.length,
    commonsenseMicro: micro("commonsense"),
    commonsenseMacro: delivered.filter((r) => passes(r, "commonsense")).length / results.length,
    hardMicro: micro("hard"),
    hardMacro: delivered.filter((r) => passes(r, "hard")).length / results.length,
    finalPassRate: delivered.filter((r) => passes(r, "commonsense") && passes(r, "hard")).length / results.length,
    temporal: avg("temporal"),
    spatial: avg("spatial"),
    ordering: avg("ordering"),
    persona: avg("persona"),
    temporalByTime: Object.fromEntries(Object.entries(byTime).map(([key, t]) => [key, Number((t.ok / t.all).toFixed(3))])),
    daysChecked: delivered.reduce((n, r) => n + r.spatialDays.filter((d) => d.checked).length, 0),
    daysWithShorterOrder: wasted.length,
    failCounts: Object.fromEntries(Object.entries(failures).map(([key, list]) => [key, list.length])),
  };

  const pct = (x) => (x === null ? "—" : `${(x * 100).toFixed(1)}%`);
  const TIME_LABEL = {
    sunrise: "只写日出",
    morning: "只写上午",
    afternoon: "只写下午",
    sunset: "只写日落",
    night: "只写晚上",
    several: "写了几个时段（在其中一个就算合）",
    parking: "停车场一早就满（赶在停满前到）",
  };
  const LABEL = {
    "commonsense.noRepeat": "景点不重复",
    "commonsense.inParks": "景点都在要去的公园",
    "commonsense.open": "那天开着",
    "commonsense.timing": "时间排得开（入场时间、班次、日落、天黑）",
    "commonsense.dayLoad": "每天不太满、不太晚回",
    "commonsense.lodging": "每晚有住处、最后回到回程地",
    "commonsense.permit": "不排要抽签的",
    "hard.days": "天数对",
    "hard.include": "点名要去的排了",
    "hard.exclude": "点名不去的没排",
    "hard.pace": "节奏（悠闲最多四站、轻松不排困难徒步、最长徒步）",
    "hard.party": "同行的人不适合的没排",
  };
  const lines = [
    `# 行程质量评测（${REFERENCE_DATE}）`,
    "",
    `${results.length} 条固定的请求（每座公园一条，加 ${results.filter((r) => r.request.parks.length > 1).length} 条两座公园的），月份、天数（2–5 天）、节奏、同行的人轮着来，出发、回程是常用机场。`,
    "",
    "## TravelPlanner 式：逐条检查",
    "",
    "| 指标 | 结果 |",
    "|---|---|",
    `| 排出了行程（Delivery rate） | ${pct(summary.deliveryRate)} |`,
    `| 常识约束 micro / macro | ${pct(summary.commonsenseMicro)} / ${pct(summary.commonsenseMacro)} |`,
    `| 用户硬约束 micro / macro | ${pct(summary.hardMicro)} / ${pct(summary.hardMacro)} |`,
    `| 最终通过率（两类全过） | ${pct(summary.finalPassRate)} |`,
    "",
    "| 检查 | 没过的行程 | 例子 |",
    "|---|---|---|",
    ...Object.entries(failures).map(
      ([key, list]) => `| ${LABEL[key] ?? key} | ${list.length} | ${list.slice(0, 3).map((f) => `${f.id}：${f.what.slice(0, 2).join("、")}`).join("；") || "—"} |`,
    ),
    "",
    "## TripCraft 式：连续分（0–1，越高越好）",
    "",
    "| 分 | 平均 | 怎么算 |",
    "|---|---|---|",
    `| 时间 | ${summary.temporal?.toFixed(3) ?? "—"} | 写了最佳时段的景点在那个时段、停车场早满的赶在停满前到，合的比例 |`,
    `| 空间 | ${summary.spatial?.toFixed(3) ?? "—"} | 同一天的景点换遍所有顺序（不多出“去不了、赶不上、太满”、不丢日出日落）最少开多久 ÷ 引擎排的开多久；${summary.daysChecked} 天里 ${summary.daysWithShorterOrder} 天有更短的顺序 |`,
    `| 顺序 | ${summary.ordering?.toFixed(3) ?? "—"} | 一天里同一片区的景点挨着去、几座公园不来回跳 |`,
    `| 同行的人 | ${summary.persona?.toFixed(3) ?? "—"} | 有同行的人的行程：适合 1 分、要注意 0.5 分、不适合 0 分 |`,
    "",
    "时间分按写的最佳时段分开（一天只有一个日出、一个日落：一座公园好几个看日落的观景点，只有一个能排在日落）：",
    "",
    "| 写的时段 | 合的比例 | 没合的例子 |",
    "|---|---|---|",
    ...Object.entries(byTime)
      .sort(([, a], [, b]) => b.all - a.all)
      .map(([key, t]) => `| ${TIME_LABEL[key] ?? key} | ${pct(t.ok / t.all)}（${t.ok} / ${t.all}） | ${t.misses.join("、") || "—"} |`),
    "",
    "## 换个顺序能少开最多车的几天",
    "",
    ...(wasted.length
      ? wasted.slice(0, 10).map((d) => `- ${d.id} 第 ${d.day} 天：少开 ${d.minutes} 分钟（${d.best.map((id) => byId.get(id).nameZh).join(" → ")}）`)
      : ["- 没有"]),
    "",
  ];
  return { summary, results, lines };
}
