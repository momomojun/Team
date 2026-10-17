import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { attractions } from "../src/data/attractions";
import {
  tripRequestSchema,
  tripResultSchema,
  validateSchema,
  validateTripRequest,
  type TripRequest,
} from "../src/lib/copilot/contract";
import { planTrip, TripRequestError } from "../src/lib/copilot/plan-tool";
import { catalog } from "../scripts/build-copilot-contracts.mjs";

const contractFile = (name: string) => JSON.parse(readFileSync(new URL(`../copilot/contracts/${name}`, import.meta.url), "utf8"));
const REFERENCE = { referenceDate: "2026-10-16" };
const base: TripRequest = { contract: "trip-request/v1", parks: ["yose"], startDate: "2027-06-01", days: 4, origin: { airport: "FAT" } };
const paths = (request: unknown) => validateTripRequest(request).map((issue) => issue.path);

test("copilot/contracts 里的 schema、公园和机场目录和代码一致（改了就跑 npm run copilot:contracts）", () => {
  assert.deepEqual(contractFile("trip-request.v1.schema.json"), JSON.parse(JSON.stringify(tripRequestSchema)));
  assert.deepEqual(contractFile("trip-result.v1.schema.json"), JSON.parse(JSON.stringify(tripResultSchema)));
  const { parks, airports } = catalog();
  assert.deepEqual(contractFile("parks.json"), parks);
  assert.deepEqual(contractFile("airports.json"), airports);
});

test("样例请求都符合契约", () => {
  for (const name of ["yose-4d-fat.json", "zion-page-month-las.json"]) {
    assert.deepEqual(validateTripRequest(contractFile(`examples/${name}`)), [], name);
  }
});

test("不合格的请求：指出哪个字段、为什么", () => {
  assert.deepEqual(paths({ ...base, startDate: undefined }), ["/"], "startDate 和 month 都没有");
  assert.ok(paths({ ...base, parks: ["xxxx"] }).includes("/parks/0"));
  assert.ok(paths({ ...base, parks: [] }).includes("/parks"));
  assert.ok(paths({ ...base, days: 15 }).includes("/days"));
  assert.ok(paths({ ...base, days: 2.5 }).includes("/days"));
  assert.ok(paths({ ...base, startDate: "2027-02-30" }).includes("/startDate"), "没有 2 月 30 日");
  assert.ok(paths({ ...base, month: 7 }).includes("/month"), "月份和日期对不上");
  assert.ok(paths({ ...base, origin: { airport: "XXX" } }).includes("/origin"));
  assert.ok(paths({ ...base, origin: { name: "盐湖城", lat: 140, lon: -111 } }).includes("/origin"));
  assert.ok(paths({ ...base, pace: "fast" }).includes("/pace"));
  assert.ok(paths({ ...base, party: { seniors: "yes" } }).includes("/party/seniors"));
  assert.ok(paths({ ...base, budget: 1000 }).includes("/budget"), "契约里没有的字段不收");
  assert.ok(paths({ ...base, provenance: { parks: { source: "guess" } } }).includes("/provenance/parks/source"));
  assert.ok(paths({ ...base, contract: "trip-request/v0" }).includes("/contract"));
});

test("顺路一起玩的公园要在主公园的 nearby 里", () => {
  assert.throws(() => planTrip({ ...base, parks: ["yose", "arch"] }, REFERENCE), (error: unknown) => {
    assert.ok(error instanceof TripRequestError);
    assert.equal(error.issues[0].path, "/parks/1");
    return true;
  });
});

test("优胜美地 4 天（弗雷斯诺进出）：天数、景点、住处、输出格式都对，同样的输入两次结果一样", () => {
  const result = planTrip(base, REFERENCE);
  assert.deepEqual(validateSchema(result, tripResultSchema as never), []);
  assert.equal(result.days.length, 4);
  assert.deepEqual(result.days.map((day) => day.date), ["2027-06-01", "2027-06-02", "2027-06-03", "2027-06-04"]);
  const ids = new Set(attractions.map((a) => a.id));
  for (const day of result.days) {
    assert.ok(day.stops.length > 0, `第 ${day.day} 天没有景点`);
    for (const stop of day.stops) assert.ok(ids.has(stop.id) && stop.park === "yose", stop.id);
    assert.equal(day.timeZone, "America/Los_Angeles");
  }
  // 最后一晚回到弗雷斯诺机场，前几晚住推荐住宿
  assert.equal(result.days.at(-1)!.lodging?.kind, "endpoint");
  assert.ok(result.days.slice(0, -1).every((day) => day.lodging?.kind === "option"));
  // 默认值补齐并写回 request，Writer 能说明“节奏按适中”
  assert.equal(result.request.pace, "normal");
  assert.deepEqual(result.request.destination, { airport: "FAT" });
  assert.deepEqual(planTrip(base, REFERENCE), result);
});

test("只给月份：按 referenceDate 算最近的那个月，写进 assumptions", () => {
  const result = planTrip({ ...base, startDate: undefined, month: 3 }, REFERENCE);
  assert.equal(result.days[0].date, "2027-03-15");
  assert.equal(result.days[0].dateIsExact, false);
  assert.ok(result.assumptions.some((line) => line.startsWith("month-only")));
});

test("跨时区的一天：别的时区的景点另给当地时间（夏天佩吉到纪念碑谷、西奥多·罗斯福南北两区）", () => {
  const plusHour = (clock: string) => {
    const minutes = Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3)) + 60;
    return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  };
  const summer = { ...base, startDate: "2027-07-14", days: 2 };
  const page = planTrip({ ...summer, parks: ["ante", "mova"], origin: { airport: "LAS" } }, REFERENCE).days[0];
  assert.equal(page.timeZone, "America/Phoenix");
  const valley = page.stops.filter((stop) => stop.park === "mova");
  assert.ok(valley.length > 0, "第一天应该从佩吉开到纪念碑谷");
  for (const stop of valley) {
    assert.equal(stop.timeZone, "America/Denver");
    assert.equal(stop.localStart, plusHour(stop.start), `${stop.id} 纳瓦霍时间比亚利桑那时间快 1 小时`);
  }
  const roosevelt = planTrip({ ...summer, parks: ["thro"], origin: { airport: "BIS" } }, REFERENCE);
  const north = roosevelt.days.flatMap((day) => day.stops).filter((stop) => stop.timeZone === "America/Chicago");
  assert.ok(north.length > 0, "两天里应该有一天去 North Unit");
  for (const stop of north) assert.equal(stop.localStart, plusHour(stop.start));
});

test("坐轮椅：去不了的景点不排，列在 skipped 里", () => {
  const result = planTrip({ ...base, party: { wheelchair: true } }, REFERENCE);
  const unsuitable = result.skipped.filter((item) => item.reason === "unsuitable").map((item) => item.id);
  assert.ok(unsuitable.length > 0);
  const planned = new Set(result.days.flatMap((day) => day.stops.map((stop) => stop.id)));
  assert.ok(unsuitable.every((id) => !planned.has(id)));
});
