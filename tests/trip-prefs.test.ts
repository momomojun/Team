// 软要求（TripRequest.prefs）：每个旋钮都让引擎照着排，软要求评测的判分（scripts/soft-check-lib.mjs）判得出来
import assert from "node:assert/strict";
import { test } from "node:test";
import type { TripRequest } from "../src/lib/copilot/contract";
import { planTrip } from "../src/lib/copilot/plan-tool";
import { checkSoft } from "../scripts/soft-check-lib.mjs";

const REFERENCE = { referenceDate: "2026-11-21" };
const plan = (request: Omit<TripRequest, "contract">) => planTrip({ contract: "trip-request/v1", ...request }, REFERENCE);
const ok = (result: ReturnType<typeof plan>, checks: object[]) => checkSoft(result, checks).map((check: { ok: boolean }) => check.ok);

test("休息日：那天不排景点、接着住前一晚的地方，别的天照常", () => {
  const request = { parks: ["yose"], startDate: "2027-06-10", days: 5, origin: { airport: "FAT" } };
  const checks = [{ kind: "rest_days", min: 1, middle: true }, { kind: "rest_day_on", day: 3 }];
  assert.deepEqual(ok(plan(request), checks), [false, false]);
  const result = plan({ ...request, prefs: { restDays: [3] } });
  assert.deepEqual(ok(result, checks), [true, true]);
  assert.equal(result.days[2].lodging?.id, result.days[1].lodging?.id);
  assert.equal(result.days[2].date, "2027-06-12");
  assert.ok(result.days.filter((day) => day.stops.length > 0).length === 4);
});

test("每天开车上限：怎样都得开的路以外不超；不设的时候黄石会有一天超", () => {
  const request = { parks: ["yell"], startDate: "2027-07-05", days: 4, origin: { airport: "BZN" } };
  const checks = [{ kind: "max_drive_per_day", minutes: 180 }];
  assert.deepEqual(ok(plan(request), checks), [false]);
  assert.deepEqual(ok(plan({ ...request, prefs: { maxDrivePerDay: 180 } }), checks), [true]);
});

test("几点以后出门、几点前回住处", () => {
  const late = plan({ parks: ["grca"], startDate: "2027-09-15", days: 3, origin: { airport: "LAS" }, prefs: { departNotBefore: "09:00" } });
  assert.deepEqual(ok(late, [{ kind: "depart_not_before", time: "09:00" }]), [true]);
  const back = plan({ parks: ["glac"], startDate: "2027-08-01", days: 4, origin: { airport: "FCA" }, prefs: { returnBy: "17:00" } });
  assert.deepEqual(ok(back, [{ kind: "return_by", time: "17:00" }]), [true]);
});

test("每天最多几站、徒步和单站时长上限、不去某个片区", () => {
  const stops = plan({ parks: ["romo"], startDate: "2027-06-20", days: 3, origin: { airport: "DEN" }, prefs: { maxStopsPerDay: 2 } });
  assert.deepEqual(ok(stops, [{ kind: "max_stops_per_day", count: 2 }]), [true]);
  const hikes = plan({ parks: ["grsm"], startDate: "2027-10-18", days: 3, origin: { airport: "TYS" }, prefs: { maxHikeMin: 60 } });
  assert.deepEqual(ok(hikes, [{ kind: "max_hike_min", minutes: 60 }]), [true]);
  const bus = plan({ parks: ["dena"], startDate: "2027-07-15", days: 3, origin: { airport: "ANC" }, prefs: { maxStopMin: 240 } });
  assert.deepEqual(ok(bus, [{ kind: "max_stop_minutes", minutes: 240 }]), [true]);
  const cedar = ["seki-kings-canyon", "seki-zumwalt-meadow", "seki-roaring-river-falls", "seki-mist-falls"];
  const area = plan({ parks: ["seki"], startDate: "2027-06-14", days: 3, origin: { airport: "FAT" }, prefs: { excludeAreas: ["seki/cedar-grove"] } });
  assert.deepEqual(ok(area, [{ kind: "exclude", ids: cedar }]), [true]);
});

test("避开危险：带 3 岁孩子去夏威夷火山，不排悬崖、地热的", () => {
  const result = plan({
    parks: ["havo"],
    startDate: "2027-03-20",
    days: 3,
    origin: { airport: "ITO" },
    party: { youngestKid: 3 },
    prefs: { avoidHazards: ["dropoff", "thermal"] },
  });
  assert.deepEqual(ok(result, [{ kind: "no_hazards", hazards: ["dropoff", "thermal"] }, { kind: "party_fit", party: { youngestKid: 3 } }]), [true, true]);
});

test("按天的要求：哪几天去哪座公园、某天只待一个片区、某天最多几站、最后一天几点前到机场", () => {
  const split = plan({
    parks: ["grte", "yell"],
    startDate: "2027-07-10",
    days: 6,
    origin: { airport: "JAC" },
    prefs: { parkDays: [{ park: "grte", days: [1, 2] }, { park: "yell", days: [3, 4, 5, 6] }] },
  });
  assert.deepEqual(ok(split, [{ kind: "park_days", park: "grte", days: [1, 2] }, { kind: "park_days", park: "yell", days: [3, 4, 5, 6] }]), [true, true]);
  const area = plan({ parks: ["yell"], startDate: "2027-06-28", days: 5, origin: { airport: "BZN" }, prefs: { dayAreas: [{ day: 3, area: "yell/geyser-basins" }] } });
  assert.deepEqual(ok(area, [{ kind: "day_single_area", day: 3 }]), [true]);
  const landing = plan({ parks: ["arch"], startDate: "2027-05-03", days: 3, origin: { airport: "SLC" }, prefs: { dayMaxStops: [{ day: 1, count: 1 }] } });
  assert.deepEqual(ok(landing, [{ kind: "day_max_stops", day: 1, count: 1 }]), [true]);
  const flight = plan({ parks: ["mora"], startDate: "2027-07-22", days: 3, origin: { airport: "SEA" }, prefs: { lastDayBy: "12:00" } });
  assert.deepEqual(ok(flight, [{ kind: "day_return_by", day: "last", time: "12:00" }]), [true]);
});

test("一天只去一个片区：片区比天数多时先挑片区，再整片分到各天（奥林匹克 4 天，必去的分在 5 个片区）", () => {
  const request = { parks: ["olym"], startDate: "2027-08-12", days: 4, origin: { airport: "SEA" } };
  const checks = [{ kind: "max_areas_per_day", count: 1 }];
  assert.deepEqual(ok(plan(request), checks), [false]);
  const result = plan({ ...request, prefs: { maxAreasPerDay: 1 } });
  assert.deepEqual(ok(result, checks), [true]);
  assert.ok(result.days.every((day) => day.stops.length > 0));
  // 没挑上的片区里的必去写进“按你说的要求没排”
  assert.ok(result.skipped.some((item) => item.reason === "prefs"));
});

test("至少一次日出、看星空，一定要走的山路，不坐班车，点名要去的抽签项目照排并提醒", () => {
  const sunrise = plan({ parks: ["yose"], startDate: "2027-05-12", days: 4, origin: { airport: "FAT" }, prefs: { minSlots: { sunrise: 1 } } });
  assert.deepEqual(ok(sunrise, [{ kind: "has_slot", slot: "sunrise", min: 1 }]), [true]);
  const stars = plan({ parks: ["jotr"], startDate: "2027-04-06", days: 2, origin: { airport: "PSP" }, prefs: { minSlots: { night: 1 } } });
  assert.deepEqual(ok(stars, [{ kind: "has_slot", slot: "night", min: 1 }]), [true]);
  const road = plan({ parks: ["glac"], startDate: "2027-07-02", days: 3, origin: { airport: "FCA" }, prefs: { roads: ["glac-logan-pass"] } });
  assert.deepEqual(ok(road, [{ kind: "road_day", road: "glac-logan-pass" }]), [true]);
  const zion = { parks: ["zion"], startDate: "2027-07-01", days: 3, origin: { airport: "LAS" } };
  assert.deepEqual(ok(plan(zion), [{ kind: "no_shuttle_stops" }]), [false]);
  const noBus = plan({ ...zion, prefs: { avoidShuttle: true } });
  assert.deepEqual(ok(noBus, [{ kind: "no_shuttle_stops" }]), [true]);
  assert.ok(noBus.skipped.some((item) => item.reason === "prefs"));
  const angels = plan({ ...zion, startDate: "2027-06-02", include: ["zion-angels-landing"] });
  const stop = angels.days.flatMap((day) => day.stops).find((item) => item.id === "zion-angels-landing");
  assert.ok(stop?.warnings.includes("lottery"));
});

test("判分：没排出行程全算没做到，不认识的检查算没做到", () => {
  assert.deepEqual(checkSoft(null, [{ kind: "max_lodgings", count: 1 }]), [{ kind: "max_lodgings", ok: false, detail: "没排出行程", facts: {} }]);
  assert.equal(checkSoft({ days: [] }, [{ kind: "nope" }])[0].ok, false);
});
