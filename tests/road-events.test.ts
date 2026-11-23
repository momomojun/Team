import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeExtracted, liveFromClosures } from "../src/lib/copilot/live";
import { historyToYears, localDate, mapRoads, summarizeFeed, toClosures, updateHistory } from "../scripts/road-events-lib.mjs";

const SOURCE = { data_source_id: "s1", organization_name: "Yosemite National Park" };
const OTHER = { data_source_id: "s2", organization_name: "Mojave National Preserve" };
const segment = (names: string[], start: string, end: string, extra = {}) => ({
  type: "Feature",
  geometry: { type: "LineString", coordinates: [] },
  properties: {
    start_date: start,
    end_date: end,
    is_end_date_verified: false,
    vehicle_impact: "all-lanes-closed",
    core_details: { data_source_id: "s1", event_type: "incident", road_names: names, description: "closed for the season" },
    ...extra,
  },
});
const feed = {
  road_event_feed_info: { data_sources: [SOURCE, OTHER] },
  features: [
    segment(["Tioga Road", "Glacier Point Road"], "2026-11-13T07:00:00Z", "2028-01-01T07:59:59Z"),
    segment(["Tioga Road", "Glacier Point Road"], "2026-11-13T07:00:00Z", "2028-01-01T07:59:59Z"),
    segment(["Big Oak Flat Road"], "2026-11-20T16:00:00Z", "2026-11-21T01:00:00Z", { vehicle_impact: "some-lanes-closed" }),
    { ...segment(["Kelbaker Road"], "2026-11-01T00:00:00Z", "2026-12-01T00:00:00Z"), properties: { ...segment([], "", "").properties, core_details: { data_source_id: "s2", road_names: ["Kelbaker Road"] } } },
  ],
};

test("同一件事的几段合成一件，按公园时区换日期，别的单位不收", () => {
  const events = summarizeFeed(feed);
  assert.equal(events.length, 2);
  const tioga = events.find((event) => event.roadNames.includes("Tioga Road"))!;
  assert.equal(tioga.segments, 2);
  // UTC 11 月 13 日早上 7 点是加州 11 月 12 日晚上 11 点
  assert.equal(tioga.from, "2026-11-12");
  assert.equal(localDate("2026-11-13T09:00:00Z", "yose"), "2026-11-13");
  assert.deepEqual(tioga.roads, ["yose-tioga-road", "yose-glacier-point-road"]);
  assert.ok(tioga.attractions.includes("yose-tuolumne-meadows") && tioga.attractions.includes("yose-glacier-point"));
});

test("只认核对过的路名：对不上的记下来，不拿去关景点；半封的不算", () => {
  assert.deepEqual(mapRoads("yose", ["Big Oak Flat Road"]), { roads: [], attractions: [], unmapped: ["Big Oak Flat Road"] });
  // 雷尼尔山冬季封路里的 Paradise Valley Road 只是天堂一带的小环路：不能把天堂关掉
  const mora = mapRoads("mora", ["Paradise Valley Road", "Stevens Canyon Road"]);
  assert.deepEqual(mora.unmapped, ["Paradise Valley Road"]);
  assert.ok(!mora.attractions.some((id) => id.includes("paradise")));
  const closures = toClosures(summarizeFeed(feed), "2026-11-21");
  assert.equal(closures.closures.length, 1);
  // 没核实的“封到哪天”（2028-01-01 这种占位的）不当重开日
  assert.equal(closures.closures[0].reopen, null);
  assert.deepEqual(closures.closures[0].found_by, ["road-events"]);
});

test("道路事件和公告的清单合在一起用：两周内出发的行程不排封着的景点", () => {
  const roads = toClosures(summarizeFeed(feed), "2026-11-21");
  const alerts = { fetched: "2026-11-20", parks: { yose: "2026-11-20" }, closures: [] };
  const merged = mergeExtracted(alerts, roads)!;
  assert.equal(merged.parks!.yose, "2026-11-20");
  const live = liveFromClosures(merged, "2026-11-25", 3, "2026-11-21", ["yose"]);
  assert.equal(live.status, "used");
  assert.ok(live.byStop.has("yose-tuolumne-meadows"));
  assert.equal(mergeExtracted(undefined, roads), roads);
});

test("每晚记下每条路这一季哪天开始封、哪天发现又通了，换成往年日期", () => {
  const events = summarizeFeed(feed);
  let history: Record<string, { closedFrom: string; lastSeen: string; openedSeen: string | null }[]> = updateHistory({}, events, "2026-11-21");
  history = updateHistory(history, events, "2027-05-20");
  assert.deepEqual(history["yose-tioga-road"], [{ closedFrom: "2026-11-12", lastSeen: "2027-05-20", openedSeen: null }]);
  // 第二天条目没了：路通了
  history = updateHistory(history, [], "2027-05-21");
  assert.equal(history["yose-tioga-road"][0].openedSeen, "2027-05-21");
  const years = historyToYears(history) as Record<string, unknown>;
  assert.deepEqual(years["yose-tioga-road"], [[2027, "05-21", null], [2026, null, "11-12"]]);
});
