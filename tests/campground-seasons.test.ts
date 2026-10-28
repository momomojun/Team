import assert from "node:assert/strict";
import { test } from "node:test";
import { campgrounds } from "../src/data/campgrounds";
import { lodgingSeasons } from "../src/data/lodging-seasons";
import { planTrip } from "../src/lib/copilot/plan-tool";
import { lodgingOpenOn } from "../src/lib/lodging-season";

const campIds = new Set(campgrounds.map((camp) => camp.id));

test("季节数据里的营地 key 都在 campgrounds.ts 里", () => {
  for (const id of Object.keys(lodgingSeasons)) {
    if (!id.includes("-camp-")) continue;
    assert.ok(campIds.has(id), `${id} 不在 campgrounds.ts 里`);
  }
});

test("1 月选露营：不排进关门的夏季营地；都关了就排营业的酒店", () => {
  const cases = [
    { park: "crla", closed: "crla-camp-mazama-village" },
    { park: "mora", closed: "mora-camp-cougar-rock" },
    { park: "romo", closed: "romo-camp-rocky-mountain-national-park-glacier-basin" },
    { park: "yell", closed: "yell-camp-slough-creek" },
  ] as const;

  for (const { park, closed } of cases) {
    assert.ok(!lodgingOpenOn(closed, "2027-01-15"), `${closed} 1 月应关门`);
    const trip = planTrip(
      {
        contract: "trip-request/v1",
        parks: [park],
        days: 3,
        startDate: "2027-01-12",
        lodgingPref: "camp",
        origin: { airport: "SEA" },
        pace: "packed",
      },
      { referenceDate: "2026-10-26" },
    );
    const nights = trip.days.flatMap((day) => (day.lodging?.kind === "option" ? [day.lodging.id] : []));
    assert.ok(nights.length > 0, `${park} 应有住处`);
    assert.ok(!nights.includes(closed), `${park} 1 月不应排 ${closed}，实际 ${nights.join(",")}`);
    for (const [i, day] of trip.days.entries()) {
      if (day.lodging?.kind === "option") {
        assert.ok(lodgingOpenOn(day.lodging.id, day.date), `${park} 第 ${i + 1} 晚 ${day.lodging.id} 应营业`);
      }
    }
  }

  // 拉森 Southwest 全年开（含冬天步行营位），1 月露营应还能排营地
  assert.ok(lodgingOpenOn("lavo-camp-southwest", "2027-01-15"));
  const lavo = planTrip(
    {
      contract: "trip-request/v1",
      parks: ["lavo"],
      days: 3,
      startDate: "2027-01-12",
      lodgingPref: "camp",
      origin: { airport: "SFO" },
      pace: "packed",
    },
    { referenceDate: "2026-10-26" },
  );
  assert.ok(
    lavo.days.some((day) => day.lodging?.kind === "option" && campIds.has(day.lodging.id)),
    "拉森 1 月露营应能排全年营地",
  );
});

test("7 月选露营：照样排营地", () => {
  for (const park of ["crla", "mora", "romo", "yell"] as const) {
    const trip = planTrip(
      {
        contract: "trip-request/v1",
        parks: [park],
        days: 3,
        startDate: "2027-07-10",
        lodgingPref: "camp",
        origin: { airport: "SEA" },
        pace: "packed",
      },
      { referenceDate: "2026-10-26" },
    );
    assert.ok(
      trip.days.some((day) => day.lodging?.kind === "option" && campIds.has(day.lodging.id)),
      `${park} 7 月应排营地`,
    );
  }
});
