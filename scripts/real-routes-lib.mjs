// 拿真人走过的行程评测行程引擎：博主路线里按天排的（src/data/creators.ts）和 NPS 官方推荐行程（tests/fixtures/real-routes/nps-itineraries.json）。
// 每一条按同样的公园、天数、月份（博主说了哪个月就用哪个月，没说就挑这些景点大都开着的月份），从第一座公园的定位点出发、回到最后一座的，让引擎自己排一遍，比：
//   1. 覆盖：真人去了的景点，引擎排进去了几成；有名的（必去，或者园内热度前 5）漏了哪些、为什么漏（要许可证、关着、没时间、太远……）
//   2. 节奏：每天几站、一天之内景点之间开多久车，引擎和真人差多少
//   3. 反过来：真人的行程按我们的规则排，有没有“关着、赶不上班次、过了入场时间”——真人去过的地方我们说去不了，要么规则太严，要么数据错了
// 不联网、不调模型，同样的输入每次结果一样（REFERENCE_DATE 固定）。
// 命令行入口是 scripts/eval-real-routes.mjs（npm run eval:routes），tests/real-routes.test.ts 拿它当门禁。
import { existsSync, readFileSync } from "node:fs";
import { attractions } from "../src/data/attractions/index.ts";
import { creatorRoutes } from "../src/data/creators.ts";
import { parks } from "../src/data/parks.ts";
import { closedKind } from "../src/lib/generate-trip.ts";
import { describeGivenTrip, planTrip } from "../src/lib/copilot/plan-tool.ts";
import { reachable } from "../src/lib/trip-parks.ts";

export const REFERENCE_DATE = "2026-10-27";
const NPS_FILE = new URL(
  "../tests/fixtures/real-routes/nps-itineraries.json",
  import.meta.url,
);
/** 真人行程在我们规则下的“去不了、赶不上”（和 Copilot 的 critic.py 的 HARD 一样，去掉跟同行的人、公告有关的） */
const HARD = new Set([
  "tempClosed",
  "afterHours",
  "missDeparture",
  "noService",
  "lastShuttle",
  "farTransfer",
]);

const byId = new Map(attractions.map((a) => [a.id, a]));
const parkByCode = new Map(parks.map((p) => [p.code, p]));
const nearbyOf = (code) => parkByCode.get(code)?.nearby ?? [];

/** 真人行程的来源：博主路线（按天排的）和 NPS 官方推荐行程 */
function realRoutes() {
  const routes = creatorRoutes
    .filter((r) => r.byDay && r.route?.length)
    .map((r) => ({
      id: r.id,
      source: "creator",
      title: r.title,
      url: r.url,
      parks: r.parks,
      visited: r.visited,
      kind: "route",
      days: r.route.map((d) => d.stops),
    }));
  if (existsSync(NPS_FILE)) {
    for (const r of JSON.parse(readFileSync(NPS_FILE, "utf8"))) {
      routes.push({
        id: r.id,
        source: "nps",
        title: r.title,
        url: r.source,
        parks: r.parks ?? [r.park],
        visited: r.season,
        // route：按顺序走一整天或几天；short：一两个小时、半天的短线；options：几个任选的点，没有先后
        kind: r.kind ?? "route",
        days: r.days.map((d) => d.stops),
      });
    }
  }
  return routes;
}

/** 去的月份：说了几月就用几月，说了季节按季节，都没说就挑这些景点开着最多的月份（一样多挑 7 月附近的） */
function monthOf(visited, stops) {
  const text = visited ?? "";
  const number = text.match(/(\d{1,2})\s*月/);
  if (number) return Number(number[1]);
  const english = text.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i,
  );
  if (english)
    return (
      [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ].indexOf(english[1].toLowerCase()) + 1
    );
  if (/春|spring/i.test(text)) return 4;
  if (/夏|暑假|summer/i.test(text)) return 7;
  if (/秋|红叶|fall|autumn/i.test(text)) return 10;
  if (/冬|雪季|winter/i.test(text)) return 1;
  const open = (m) =>
    stops.filter((s) => !s.openMonths || s.openMonths.includes(m)).length;
  return [7, 8, 6, 9, 5, 10, 4, 11, 3, 12, 2, 1].reduce(
    (best, m) => (open(m) > open(best) ? m : best),
    7,
  );
}

const famous = (stop) =>
  stop.mustSee || (stop.hotRank !== undefined && stop.hotRank <= 5);
const mean = (values) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
/** 一天之内景点之间开的车：第一站从住处、前一天开过来的不算（真人行程不知道住哪） */
const innerDrive = (day) =>
  day.stops.slice(1).reduce((sum, s) => sum + s.driveMin, 0);
const realDays = (described) => described.filter((d) => d.stops.length > 0);

/** 跑一遍评测：返回汇总、逐条结果和 Markdown 报告的每一行 */
export function evaluateRealRoutes() {
  const results = [];
  for (const route of realRoutes()) {
    const known = route.days.map((day) => [
      ...new Set(day.filter((id) => byId.has(id))),
    ]);
    const ids = [...new Set(known.flat())];
    if (ids.length < 2) {
      results.push({
        ...route,
        status: "skipped",
        note: "认得的景点不到 2 个",
      });
      continue;
    }
    const parkCodes = [
      ...new Set([
        ...route.parks.filter((p) => parkByCode.has(p)),
        ...ids.map((id) => byId.get(id).park),
      ]),
    ];
    // 公园的先后按真人去的顺序
    const order = [...new Set(ids.map((id) => byId.get(id).park))];
    const parksInOrder = [
      ...order,
      ...parkCodes.filter((p) => !order.includes(p)),
    ];
    if (reachable(parksInOrder, nearbyOf).length !== parksInOrder.length) {
      results.push({
        ...route,
        status: "skipped",
        note: `${parksInOrder.join("+")} 排不进同一趟`,
      });
      continue;
    }
    const stops = ids.map((id) => byId.get(id));
    const month = monthOf(route.visited, stops);
    // 从第一座公园的定位点出发、回到最后一座公园的定位点：真人行程（尤其一日游）说的是到了公园以后怎么玩，
    // 按机场进出的话第一天、最后一天要开几个小时车，比不出引擎排得好不好
    const at = (code) =>
      (({ nameZh, lat, lon }) => ({ name: nameZh, lat, lon }))(
        parkByCode.get(code).gateway,
      );
    const request = {
      contract: "trip-request/v1",
      parks: parksInOrder,
      month,
      days: Math.min(14, route.days.length),
      origin: at(parksInOrder[0]),
      destination: at(parksInOrder.at(-1)),
      pace: "normal",
    };
    let plan;
    try {
      plan = planTrip(request, { referenceDate: REFERENCE_DATE });
    } catch (error) {
      results.push({
        ...route,
        status: "skipped",
        note: `引擎拒绝了请求：${error.message}`,
      });
      continue;
    }
    // 同样的请求按“轻松”“悠闲”再排一遍：看真人的节奏更像引擎的哪一档
    const relaxed = realDays(
      planTrip(
        { ...request, pace: "relaxed" },
        { referenceDate: REFERENCE_DATE },
      ).days,
    );
    const leisurely = realDays(
      planTrip(
        { ...request, pace: "leisurely" },
        { referenceDate: REFERENCE_DATE },
      ).days,
    );
    const planned = new Set(plan.days.flatMap((d) => d.stops.map((s) => s.id)));
    const skippedWhy = new Map(plan.skipped.map((s) => [s.id, s.reason]));
    const covered = ids.filter((id) => planned.has(id));
    const missedFamous = ids.filter(
      (id) => famous(byId.get(id)) && !planned.has(id),
    );

    // 反过来：真人的行程按我们的规则排
    const given = describeGivenTrip(
      {
        version: 2,
        startDate: "",
        dayCount: known.length,
        days: known.map((day) => day.map((id) => ({ id, status: "planned" }))),
        pool: [],
        nights: Array(known.length + 1).fill(null),
      },
      { parks: parksInOrder, month, referenceDate: REFERENCE_DATE },
    );
    // 临时关闭（tempClosed）是现在的情况，算在 closedNow 里
    const hard = given.flatMap((d) =>
      d.stops.flatMap((s) =>
        s.warnings
          .filter((w) => HARD.has(w) && w !== "tempClosed")
          .map((w) => ({ id: s.id, warning: w })),
      ),
    );
    // 真人去的那个月，我们的数据说关着：开放月份、季节性山路往年的通车（真人去过，要么数据错了，要么月份猜错了）；
    // 施工、山洪这类临时关闭是现在的情况，真人去的那年还开着，另外列
    const dates = given.map((d) => d.date);
    const kinds = new Map(
      ids.map((id) => [id, closedKind(byId.get(id), month, dates, dates)]),
    );
    // 开放月份是空的（Laurel Falls 修到 2027 年）、临时关闭也是现在的情况
    const longClosed = (id) => byId.get(id).openMonths?.length === 0;
    const closedThen = ids.filter(
      (id) =>
        (kinds.get(id) === "season" || kinds.get(id) === "road") &&
        !longClosed(id),
    );
    const tempClosed = new Set(
      given.flatMap((d) =>
        d.stops
          .filter((s) => s.warnings.includes("tempClosed"))
          .map((s) => s.id),
      ),
    );
    const closedNow = ids.filter(
      (id) =>
        kinds.get(id) === "closure" || longClosed(id) || tempClosed.has(id),
    );

    const engineDays = realDays(plan.days);
    const humanDays = realDays(given);
    results.push({
      id: route.id,
      source: route.source,
      kind: route.kind,
      title: route.title,
      url: route.url,
      parks: parksInOrder,
      month,
      days: request.days,
      status: "ok",
      realStops: ids.length,
      unknownStops: route.days.flat().length - known.flat().length,
      covered: covered.length,
      recall: covered.length / ids.length,
      famous: ids.filter((id) => famous(byId.get(id))).length,
      missedFamous: missedFamous.map((id) => ({
        id,
        name: byId.get(id).nameZh,
        why: skippedWhy.get(id) ?? "notPicked",
      })),
      missed: ids
        .filter((id) => !planned.has(id))
        .map((id) => ({
          id,
          name: byId.get(id).nameZh,
          why: skippedWhy.get(id) ?? "notPicked",
        })),
      engineStops: planned.size,
      extra: [...planned].filter((id) => !ids.includes(id)).length,
      stopsPerDay: {
        real: mean(humanDays.map((d) => d.stops.length)),
        engine: mean(engineDays.map((d) => d.stops.length)),
        relaxed: mean(relaxed.map((d) => d.stops.length)),
        leisurely: mean(leisurely.map((d) => d.stops.length)),
      },
      innerDriveMin: {
        real: mean(humanDays.map(innerDrive)),
        engine: mean(engineDays.map(innerDrive)),
        relaxed: mean(relaxed.map(innerDrive)),
        leisurely: mean(leisurely.map(innerDrive)),
      },
      hard,
      closedThen: closedThen.map((id) => ({
        id,
        name: byId.get(id).nameZh,
        kind: kinds.get(id),
      })),
      closedNow: closedNow.map((id) => ({ id, name: byId.get(id).nameZh })),
    });
  }

  // ---- 汇总 ----

  const ok = results.filter((r) => r.status === "ok");
  const round = (x, digits = 0) => (x === null ? "—" : x.toFixed(digits));
  const pct = (x) => (x === null ? "—" : `${Math.round(x * 100)}%`);
  const sum = (key) => ok.reduce((a, r) => a + r[key], 0);
  const famousTotal = sum("famous");
  const famousMissed = ok.reduce((a, r) => a + r.missedFamous.length, 0);
  const whyCounts = {};
  for (const r of ok)
    for (const m of r.missed) whyCounts[m.why] = (whyCounts[m.why] ?? 0) + 1;
  const WHY = {
    notPicked: "没挑上（时间够，但按热度、顺路没选它）",
    noTime: "排不下（每天的时间不够）",
    permit: "要许可证、抽签",
    closed: "那个月关着",
    tooFar: "离其他景点太远，不专门绕路",
    tooHard: "按普通节奏太累",
    across: "要翻过封着的山路",
    unsuitable: "同行的人不适合",
  };
  const bySource = (source) => ok.filter((r) => r.source === source);
  // 节奏、按我们的规则排只看按顺序走一整天或几天的（短线、任选的点没法比每天几站，也没有先后）
  const full = ok.filter((r) => r.kind === "route");
  const fullBySource = (source) => full.filter((r) => r.source === source);
  const summary = {
    referenceDate: REFERENCE_DATE,
    routes: ok.length,
    skipped: results.length - ok.length,
    recall: sum("covered") / sum("realStops"),
    recallBySource: Object.fromEntries(
      ["creator", "nps"].map((s) => [
        s,
        bySource(s).length
          ? bySource(s).reduce((a, r) => a + r.covered, 0) /
            bySource(s).reduce((a, r) => a + r.realStops, 0)
          : null,
      ]),
    ),
    famousRecall: famousTotal
      ? (famousTotal - famousMissed) / famousTotal
      : null,
    stopsPerDay: {
      real: mean(full.map((r) => r.stopsPerDay.real)),
      engine: mean(full.map((r) => r.stopsPerDay.engine)),
    },
    innerDriveMin: {
      real: mean(full.map((r) => r.innerDriveMin.real)),
      engine: mean(full.map((r) => r.innerDriveMin.engine)),
    },
    pace: Object.fromEntries(
      ["creator", "nps"].map((s) => [
        s,
        {
          stopsReal: mean(fullBySource(s).map((r) => r.stopsPerDay.real)),
          stopsEngine: mean(fullBySource(s).map((r) => r.stopsPerDay.engine)),
          stopsRelaxed: mean(fullBySource(s).map((r) => r.stopsPerDay.relaxed)),
          stopsLeisurely: mean(fullBySource(s).map((r) => r.stopsPerDay.leisurely)),
          driveReal: mean(fullBySource(s).map((r) => r.innerDriveMin.real)),
          driveEngine: mean(fullBySource(s).map((r) => r.innerDriveMin.engine)),
          driveRelaxed: mean(fullBySource(s).map((r) => r.innerDriveMin.relaxed)),
          driveLeisurely: mean(fullBySource(s).map((r) => r.innerDriveMin.leisurely)),
        },
      ]),
    ),
    fullRoutes: full.length,
    realRoutesWithHard: full.filter((r) => r.hard.length > 0).length,
    realStopsClosedThen: ok.reduce((a, r) => a + r.closedThen.length, 0),
    realStopsClosedNow: ok.reduce((a, r) => a + r.closedNow.length, 0),
    missedWhy: whyCounts,
  };

  const lines = [
    `# 行程引擎对照真实行程（${REFERENCE_DATE}）`,
    "",
    `${ok.length} 条真实行程（博主 ${bySource("creator").length} 条、NPS 官方 ${bySource("nps").length} 条），另有 ${summary.skipped} 条跳过（认得的景点太少、公园排不进同一趟）。其中按顺序走一整天或几天的 ${full.length} 条（博主的都是，NPS 的 ${fullBySource("nps").length} 条）；NPS 另有一两个小时、半天的短线和几个任选的点，只算覆盖，节奏和“按我们的规则排”只看整天的。`,
    "",
    "| 指标 | 结果 |",
    "|---|---|",
    `| 真人去了的景点，引擎也排了 | ${pct(summary.recall)}（博主 ${pct(summary.recallBySource.creator)}、NPS ${pct(summary.recallBySource.nps)}） |`,
    `| 其中有名的（必去或园内热度前 5） | ${pct(summary.famousRecall)}（${famousTotal - famousMissed} / ${famousTotal}） |`,
    `| 每天几站：真人 / 引擎“正常” / “轻松” / “悠闲” | 博主 ${round(summary.pace.creator.stopsReal, 1)} / ${round(summary.pace.creator.stopsEngine, 1)} / ${round(summary.pace.creator.stopsRelaxed, 1)} / ${round(summary.pace.creator.stopsLeisurely, 1)}，NPS ${round(summary.pace.nps.stopsReal, 1)} / ${round(summary.pace.nps.stopsEngine, 1)} / ${round(summary.pace.nps.stopsRelaxed, 1)} / ${round(summary.pace.nps.stopsLeisurely, 1)} |`,
    `| 一天之内景点之间开车（分钟）：真人 / “正常” / “轻松” / “悠闲” | 博主 ${round(summary.pace.creator.driveReal)} / ${round(summary.pace.creator.driveEngine)} / ${round(summary.pace.creator.driveRelaxed)} / ${round(summary.pace.creator.driveLeisurely)}，NPS ${round(summary.pace.nps.driveReal)} / ${round(summary.pace.nps.driveEngine)} / ${round(summary.pace.nps.driveRelaxed)} / ${round(summary.pace.nps.driveLeisurely)} |`,
    `| 真人行程按我们的规则排，有“去不了、赶不上”的 | ${summary.realRoutesWithHard} / ${full.length} 条 |`,
    `| 真人去了、我们的数据说那个月关着的景点（开放月份、山路往年通车） | ${summary.realStopsClosedThen} 个 |`,
    `| 真人去了、现在临时关着的景点（施工、山洪，真人去的那年还开着） | ${summary.realStopsClosedNow} 个 |`,
    "",
    "## 引擎没排真人去过的景点，为什么",
    "",
    ...Object.entries(whyCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([why, n]) => `- ${WHY[why] ?? why}：${n} 个`),
    "",
    "## 逐条",
    "",
    "| 行程 | 公园 · 月 · 天 | 覆盖 | 漏了的有名景点 | 每天几站（真人/引擎） | 站间开车（真人/引擎） | 按我们的规则 |",
    "|---|---|---|---|---|---|---|",
    ...ok.map(
      (r) =>
        `| [${r.title.replace(/\|/g, "/").slice(0, 40)}](${r.url}) | ${r.parks.join("+")} · ${r.month} 月 · ${r.days} 天 | ${r.covered}/${r.realStops} | ${
          r.missedFamous
            .map((m) => `${m.name}（${WHY[m.why]?.split("（")[0] ?? m.why}）`)
            .join("、") || "—"
        } | ${round(r.stopsPerDay.real, 1)} / ${round(r.stopsPerDay.engine, 1)} | ${round(r.innerDriveMin.real)} / ${round(r.innerDriveMin.engine)} | ${
          [
            ...r.hard.map((h) => `${byId.get(h.id).nameZh} ${h.warning}`),
            ...r.closedThen.map((c) => `${c.name} 那个月关着`),
            ...r.closedNow.map((c) => `${c.name} 现在临时关着`),
          ].join("、") || "都去得了"
        } |`,
    ),
    "",
    ...(results.length > ok.length
      ? [
          "## 跳过的",
          "",
          ...results
            .filter((r) => r.status !== "ok")
            .map((r) => `- ${r.id}：${r.note}`),
          "",
        ]
      : []),
  ];

  return { summary, results, lines };
}
