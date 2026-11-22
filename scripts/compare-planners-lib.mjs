// 排行程这条路的三组对照（计划书 §8 目标 4，GOALS P35）：
//   A 只靠模型：把用户的条件交给通用模型，让它直接排每天去哪（不给任何资料）；
//   B 模型 + 检索：同样的条件，再把这几座公园的景点资料（名字、开放月份、停留多久、要不要抽签、适不适合同行的人）交给它；
//   C 完整系统：同样的条件交给我们的行程引擎（plan_trip）。
// 三组排出来的行程用同一套规则打分：对不上景点库的（编的或者不在要去的公园）、重复、那个月去不了、要抽签、
// 时间排不开（按网站的时间线：过了入场时间、赶不上班次、摸黑徒步……）、一天太满、不适合同行的人、
// 没照用户说的做（天数、点名要去 / 不去、节奏的每天站数）。三组都不排住处，时间线按同样的办法排，才公平。
// 模型那边在 copilot/eval/planners.py（调模型、录音、回放），这里只出题、给引擎排、打分。不联网、不调模型。
import { attractions } from "../src/data/attractions/index.ts";
import { parks } from "../src/data/parks.ts";
import { airports } from "../src/data/airports.ts";
import { closedKind, MAX_STOPS } from "../src/lib/generate-trip.ts";
import { describeGivenTrip, planTrip } from "../src/lib/copilot/plan-tool.ts";
import { fitFor } from "../src/lib/suitability.ts";
import { requests, REFERENCE_DATE } from "./plan-quality-lib.mjs";

const byId = new Map(attractions.map((a) => [a.id, a]));
const parkByCode = new Map(parks.map((p) => [p.code, p]));
const airportByCode = new Map(Object.entries(airports));
/** 时间线上的提醒里算“时间排不开”的 */
const TIMING = new Set(["afterHours", "missDeparture", "noService", "lastShuttle", "offTime", "dark", "missSunset", "farTransfer"]);
const PACE_ZH = { leisurely: "悠闲", relaxed: "轻松", normal: "适中", packed: "紧凑" };

/** 从行程质量评测那 110 条请求里均匀挑 n 条（单座公园、两座公园都有） */
export function compareCases(n = 30) {
  const all = requests();
  const step = all.length / n;
  return Array.from({ length: n }, (_, i) => all[Math.floor(i * step)]).map(({ id, request }) => ({
    id,
    request,
    prompt: describeRequest(request),
    catalog: catalogFor(request),
  }));
}

function partyZh(party) {
  if (!party) return "成年人";
  if (party.youngestKid !== undefined) return `带孩子，最小的 ${party.youngestKid} 岁`;
  if (party.seniors) return "带老人（体力一般）";
  if (party.wheelchair) return "有人坐轮椅";
  return "成年人";
}

/** 用户的条件写成一句话（A、B 两组给模型看的） */
export function describeRequest(request) {
  const names = request.parks.map((code) => `${parkByCode.get(code).nameZh}（${parkByCode.get(code).nameEn}）`).join("、");
  const from = airportByCode.get(request.origin.airport);
  const to = request.destination ? airportByCode.get(request.destination.airport) : from;
  const stopName = (id) => `${byId.get(id).nameZh}（${byId.get(id).nameEn}）`;
  return [
    `去${names}玩 ${request.days} 天，${request.month} 月去（具体日期没定）。`,
    `从${from.nameZh}（${from.code}）落地，${to === from ? "同一个机场回" : `从${to.nameZh}（${to.code}）回`}，自驾。`,
    `节奏：${PACE_ZH[request.pace ?? "normal"]}。同行：${partyZh(request.party)}。`,
    ...(request.include?.length ? [`一定要去：${request.include.map(stopName).join("、")}。`] : []),
    ...(request.exclude?.length ? [`不想去：${request.exclude.map(stopName).join("、")}。`] : []),
  ].join("");
}

/** B 组的资料：这几座公园的景点，一行一个（和网站、Copilot 用的是同一份数据） */
export function catalogFor(request) {
  return attractions
    .filter((a) => request.parks.includes(a.park) && a.kind !== "visitor")
    .map((a) => {
      const fit = fitFor(request.party, a.family);
      const hours = a.hours?.find((h) => !h.months || h.months.includes(request.month));
      return [
        `${a.nameZh}（${a.nameEn}）`,
        `片区 ${parkByCode.get(a.park).areas?.[a.area] ?? a.area}`,
        `开放月份 ${a.openMonths ? (a.openMonths.length ? a.openMonths.join("/") : "目前关闭") : "全年"}`,
        `停留约 ${a.durationMin} 分钟`,
        ...(a.lottery ? ["要抽签或许可证"] : []),
        ...(hours ? [`开放 ${hours.open}，${hours.lastEntry ? `最晚入场 ${hours.lastEntry}` : `关门 ${hours.close ?? "-"}`}`] : []),
        ...(a.bestTime?.length ? [`最好的时间 ${a.bestTime.join("/")}`] : []),
        ...(request.party ? [`同行的人：${fit.level === "no" ? "不适合" : fit.level === "caution" ? "要注意" : "可以"}`] : []),
      ].join("；");
    })
    .join("\n");
}

const normalize = (text) =>
  String(text)
    .toLowerCase()
    .normalize("NFKC")
    .replace(/national park|国家公园|trailhead|trail|步道|观景点|viewpoint|overlook|[\s·・()（）'’".,，、:：\-–—]/g, "");

/** 英文名里的词（去掉 trail、lake、overlook 这类通用词）；在景点库里出现不超过 3 次的算“少见词” */
const GENERIC = new Set("the of and a at in on to trail trails national park point overlook overlooks viewpoint visitor center lake lakes canyon loop drive road scenic area historic district walk hike".split(" "));
const wordsOf = (text) => String(text).toLowerCase().match(/[a-z]+/g)?.filter((w) => w.length >= 3 && !GENERIC.has(w)) ?? [];
const wordCount = new Map();
for (const a of attractions) for (const w of new Set(wordsOf(a.nameEn))) wordCount.set(w, (wordCount.get(w) ?? 0) + 1);
/** 英文名按词对：重合的词里要有少见词，重合的占短的那个名字的三分之二、长的四分之一以上（“Mariposa Grove of Giant Sequoias”对 Mariposa Grove，“Dream Lake”对 Nymph, Dream & Emerald Lakes） */
function wordMatch(englishParts, list) {
  let best = null;
  for (const part of englishParts) {
    const mine = new Set(wordsOf(part));
    if (mine.size === 0) continue;
    for (const stop of list) {
      const theirs = new Set(wordsOf(stop.nameEn));
      const shared = [...mine].filter((w) => theirs.has(w));
      if (!shared.some((w) => (wordCount.get(w) ?? 0) <= 3)) continue;
      const small = Math.min(mine.size, theirs.size);
      const large = Math.max(mine.size, theirs.size);
      if (shared.length / small < 0.66 || shared.length / large < 0.25) continue;
      const score = shared.length / large;
      if (score > (best?.score ?? 0)) best = { stop, score };
    }
  }
  return best?.stop;
}

/**
 * 模型写的景点名对到景点库：要去的公园里先找一样的名字，再找包含关系（短的至少是长的六成，免得“Castle Crest”对到恶地的 Castle Trail）；
 * 别的公园只认名字完全一样的（排到了别的公园，算错）。对不上的不一定是编的：很多是真的地方、我们没收录（梦湖、朗斯峰），单独数，不算违规
 */
export function matchName(name, parkCodes) {
  const raw = String(name);
  const parts = [raw, ...[...raw.matchAll(/[（(]([^）)]+)[）)]/g)].map((m) => m[1]), raw.replace(/[（(][^）)]*[）)]/g, "")];
  const keys = [...new Set(parts.map(normalize).filter((key) => key.length >= 2))];
  const scope = (list, fuzzy) => {
    let best = null;
    for (const stop of list) {
      const names = [stop.nameZh, stop.nameEn].map(normalize).filter((n) => n.length >= 2);
      for (const key of keys) {
        for (const candidate of names) {
          const short = Math.min(key.length, candidate.length);
          const close = short >= 3 && short / Math.max(key.length, candidate.length) >= 0.6 && (candidate.includes(key) || key.includes(candidate));
          const score = key === candidate ? 100 : fuzzy && close ? short : 0;
          if (score > (best?.score ?? 0)) best = { stop, score };
        }
      }
    }
    return best?.stop;
  };
  const here = attractions.filter((a) => parkCodes.includes(a.park));
  const inParks = scope(here, true) ?? wordMatch(parts, here);
  if (inParks) return { id: inParks.id, inParks: true };
  const elsewhere = scope(attractions.filter((a) => !parkCodes.includes(a.park)), false);
  return elsewhere ? { id: elsewhere.id, inParks: false } : null;
}

/**
 * 给一条行程打分：days 是每天的景点（id 或者模型写的名字）。返回逐项违规和汇总。
 * 时间线用 describeGivenTrip（和“真人行程按我们的规则排”是同一个函数），三组都不排住处
 */
export function scoreTrip(request, days, { names = false } = {}) {
  const problems = { unknown: [], outside: [], repeat: [], closed: [], permit: [], timing: [], overloaded: [], party: [], days: [], include: [], exclude: [], pace: [] };
  // 每一站：对上的景点 id 和模型原来写的名字
  const matched = days.map((day) =>
    day.flatMap((entry) => {
      if (!names) return [{ id: entry, raw: entry }];
      const match = matchName(entry, request.parks);
      if (!match) return problems.unknown.push(String(entry)), [];
      if (!match.inParks) return problems.outside.push(`${entry} → ${match.id}`), [];
      return [{ id: match.id, raw: normalize(entry) }];
    }),
  );
  const ids = matched.map((day) => day.map((stop) => stop.id));
  const flat = ids.flat();
  // 重复：同一个景点多去了一次：排在不同的两天，或者同一天同一个名字写了两次。同一天两个不同的名字对到景点库里同一条
  // （梦湖、仙女湖都在“Nymph, Dream & Emerald Lakes”里）不算；对不上景点库的另外数，这里不管
  const visits = new Map();
  matched.forEach((day, d) =>
    day.forEach(({ id, raw }) => {
      const seen = visits.get(id) ?? [];
      if (seen.some((v) => v.day !== d || v.raw === raw)) problems.repeat.push(id);
      visits.set(id, [...seen, { day: d, raw }]);
    }),
  );
  const unique = ids.map((day, d) => day.filter((id, i) => !ids.slice(0, d).flat().includes(id) && day.indexOf(id) === i));
  const given = describeGivenTrip(
    { version: 2, startDate: "", dayCount: unique.length, days: unique.map((day) => day.map((id) => ({ id, status: "planned" }))), pool: [], nights: Array(unique.length + 1).fill(null) },
    { parks: request.parks, month: request.month, referenceDate: REFERENCE_DATE },
  );
  const dates = given.map((d) => d.date);
  for (const day of given) {
    for (const entry of day.stops) {
      const stop = byId.get(entry.id);
      if (closedKind(stop, request.month, dates, dates) !== null || entry.warnings.includes("tempClosed")) problems.closed.push(entry.id);
      if (stop.lottery && !(request.include ?? []).includes(entry.id)) problems.permit.push(entry.id);
      for (const warning of entry.warnings) if (TIMING.has(warning)) problems.timing.push(`${entry.id} ${warning}`);
      if (fitFor(request.party, stop.family).level === "no") problems.party.push(entry.id);
    }
    if (day.warnings.includes("overloaded")) problems.overloaded.push(`第 ${day.day} 天`);
    const cap = MAX_STOPS[request.pace ?? "normal"];
    if (cap && day.stops.filter((e) => e.slot !== "night").length > cap) problems.pace.push(`第 ${day.day} 天 ${day.stops.length} 站`);
  }
  if (days.length !== request.days) problems.days.push(`排了 ${days.length} 天`);
  problems.include = (request.include ?? []).filter((id) => !flat.includes(id));
  problems.exclude = (request.exclude ?? []).filter((id) => flat.includes(id));
  // 对不上景点库的单独数（可能是真的地方、我们没收录），不算违规；违规只看对上了的
  const count = Object.entries(problems).reduce((sum, [kind, list]) => sum + (kind === "unknown" ? 0 : list.length), 0);
  return { stops: flat.length + problems.unknown.length + problems.outside.length, matched: flat.length, unmatched: problems.unknown.length, problems, violations: count, clean: count === 0 };
}

/** C 组：行程引擎排、按同样的规则打分；记下每条用了多久 */
export function engineRuns(cases) {
  return cases.map(({ id, request }) => {
    const start = performance.now();
    const plan = planTrip(request, { referenceDate: REFERENCE_DATE });
    const ms = performance.now() - start;
    const days = plan.days.map((day) => day.stops.map((stop) => stop.id));
    return { id, ms, days, score: scoreTrip(request, days) };
  });
}
