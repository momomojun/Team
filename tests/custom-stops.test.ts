import assert from "node:assert/strict";
import { test } from "node:test";
import { attractions } from "../src/data/attractions";
import { alltrailsParkTop } from "../src/data/attractions/alltrails.generated";
import { customStopAttraction, customStopId, hikeMinutes, isCustomStop, makeCustomStop } from "../src/lib/custom-stops";
import { travelMinutes } from "../src/lib/travel";
import { normalizeTrip } from "../src/lib/trip-store";

const zion = attractions.filter((a) => a.park === "zion");
const anchors = zion.map((a) => ({ id: a.id, area: a.area, lat: a.lat, lon: a.lon, start: a.start }));
// 锡安热门榜里网站没收录的一条（比如 The Subway、Kolob 那边的步道）
const outside = alltrailsParkTop.zion.find((trail) => !trail.attractionId)!;
const units = { km: "{km} km ({mi} mi)", meters: "gain {m} m" } as Parameters<typeof customStopAttraction>[2];

test("走路时间：每小时 2 英里、每爬 1000 英尺多 1 小时，加 15 分钟，按 15 分钟取整，至少半小时", () => {
  assert.equal(hikeMinutes(2, 0), 75);
  assert.equal(hikeMinutes(4, 1000), 195);
  assert.equal(hikeMinutes(0.3, 0), 30);
});

test("网站没收录的步道：借最近的已收录景点算车程，编号以公园代码开头", () => {
  assert.ok(outside, "锡安热门榜里应该有网站没收录的步道");
  const stop = makeCustomStop("zion", outside, anchors);
  assert.equal(stop.id, customStopId("zion", outside.slug));
  assert.match(stop.id, /^zion-at-[a-z0-9-]+$/);
  assert.ok(zion.some((a) => a.id === stop.anchor));
  assert.ok(isCustomStop(stop));
  assert.ok(stop.durationMin >= 30);

  const shown = customStopAttraction(stop, { summary: "{rating} {reviews} {length} {gain}", tip: "tip" }, units);
  assert.equal(shown.kind, "hike");
  assert.equal(shown.hike?.distanceMi, outside.lengthMi);
  // 登记以后，到别的景点的车程 = 借用的景点到那里的车程 + 从借用的景点开过去的分钟数
  const other = zion.find((a) => a.id !== stop.anchor)!;
  assert.equal(travelMinutes(stop.id, other.id), travelMinutes(stop.anchor, other.id) + stop.anchorMin);
  assert.equal(travelMinutes(other.id, stop.id), travelMinutes(other.id, stop.anchor) + stop.anchorMin);
});

test("分享、导入的行程：自定义步道字段对的留着，不对的丢掉", () => {
  const stop = makeCustomStop("zion", outside, anchors);
  const trip = normalizeTrip({
    days: [[{ id: stop.id, status: "planned" }]],
    pool: [],
    nights: [],
    customStops: { [stop.id]: stop, "zion-at-bad": { ...stop, id: "zion-at-bad", lat: "x" }, wrong: { ...stop } },
  });
  assert.deepEqual(Object.keys(trip?.customStops ?? {}), [stop.id]);
});
