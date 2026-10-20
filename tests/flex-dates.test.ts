import assert from "node:assert/strict";
import { test } from "node:test";
import { flexDepartures, flexTripQueries, FLEX_MAX_QUERIES } from "../src/lib/prices/flex-dates";
import { poorSignal } from "../src/lib/signal-notes";

test("灵活日期优先抽周二周三，组合不超过 6 个", () => {
  // 2026-11-16 是周一，往后 14 天里周二周三够选
  const departures = flexDepartures("2026-11-16", 14, 3);
  assert.equal(departures.length, 3);
  for (const date of departures) {
    const [year, month, day] = date.split("-").map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    assert.ok(weekday === 2 || weekday === 3, date);
  }
  const queries = flexTripQueries("BOS", "SLC", "2026-11-16", 14, [5, 7, 10], 2);
  assert.ok(queries.length <= FLEX_MAX_QUERIES);
  assert.ok(queries.length >= 4);
  assert.equal(queries[0].legs[1].date > queries[0].legs[0].date, true);
  assert.equal(flexTripQueries("BOS", "BOS", "2026-11-16", 14, [7], 1).length, 0);
});

test("信号说明只认否定句", () => {
  assert.equal(poorSignal("园内几乎没有手机信号，游客中心有免费 Wi-Fi"), true);
  assert.equal(poorSignal("这里是园里少数手机信号较好的地方"), false);
  assert.equal(poorSignal("Teton Glacier、珍妮湖、信号山都在这条路上。"), false);
  assert.equal(poorSignal("There's almost no cell service in the park."), true);
  assert.equal(poorSignal("Cell service is good at the visitor center."), false);
});
