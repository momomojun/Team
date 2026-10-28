import assert from "node:assert/strict";
import { test } from "node:test";
import { campgrounds } from "../src/data/campgrounds";
import { lodgingOptions } from "../src/data/lodging";
import { lodgingSeasons } from "../src/data/lodging-seasons";
import { planTrip } from "../src/lib/copilot/plan-tool";
import { inSeason, lodgingOpenOn } from "../src/lib/lodging-season";

const MD = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

test("营业季节：夏季一段、跨年的冬季一段，两头都算", () => {
  const season = { open: [{ from: "05-15", to: "10-04" }, { from: "12-15", to: "03-01" }], year: 2026, source: "x", checked: "2026-10-18" };
  assert.ok(inSeason(season, "2026-05-15") && inSeason(season, "2026-10-04"));
  assert.ok(!inSeason(season, "2026-10-05") && !inSeason(season, "2026-05-14"));
  assert.ok(inSeason(season, "2026-12-31") && inSeason(season, "2027-01-10") && inSeason(season, "2027-03-01"));
  assert.ok(!inSeason(season, "2027-03-02"));
});

test("临时关闭：公布了重开日期的按日期，没公布的核对后 90 天内当关着", () => {
  // 大峡谷南缘 2026 年 8 月山洪后：Village 的几家关到 11 月 19 日，Yavapai 没公布重开日期（10-18 核对）
  assert.ok(!lodgingOpenOn("grca-stay-village", "2026-10-20") && lodgingOpenOn("grca-stay-village", "2026-11-20"));
  assert.ok(!lodgingOpenOn("grca-stay-yavapai", "2027-01-10") && lodgingOpenOn("grca-stay-yavapai", "2027-02-01"));
  assert.ok(lodgingOpenOn("grca-stay-village", "2027-10-20"));
});

test("没有日期、全年营业、自定义住处都当能住", () => {
  assert.ok(lodgingOpenOn("mora-stay-paradise-inn", null));
  assert.ok(lodgingOpenOn("arch-stay-moab", "2026-01-15"));
  assert.ok(lodgingOpenOn("custom-123", "2026-01-15"));
});

test("季节数据：住处或营地都存在，日期格式对，有来源和核对日期", () => {
  const ids = new Set([...lodgingOptions, ...campgrounds].map((option) => option.id));
  for (const [id, season] of Object.entries(lodgingSeasons)) {
    assert.ok(ids.has(id), `${id} 不在 lodging.ts / campgrounds.ts 里`);
    assert.ok((season.open?.length ?? 0) + (season.closed?.length ?? 0) > 0, id);
    for (const { from, to } of season.open ?? []) assert.ok(MD.test(from) && MD.test(to), `${id} ${from}–${to}`);
    for (const { from, to } of season.closed ?? []) assert.ok(DATE.test(from) && (to === null || DATE.test(to)), `${id} ${from}–${to}`);
    assert.match(season.source, /^https:\/\//, id);
    assert.match(season.checked, /^\d{4}-\d{2}-\d{2}$/, id);
  }
});

test("自动生成攻略不住这晚不营业的地方：10 月下旬的雷尼尔山不住天堂旅馆，7 月照样能住", () => {
  const base = { contract: "trip-request/v1", parks: ["mora"], days: 5, origin: { airport: "SEA" }, pace: "packed" } as const;
  const october = planTrip({ ...base, startDate: "2026-10-20" }, { referenceDate: "2026-10-18" });
  const nights = october.days.flatMap((day) => (day.lodging?.kind === "option" ? [day.lodging.id] : []));
  assert.ok(nights.length > 0);
  for (const [i, day] of october.days.entries()) {
    if (day.lodging?.kind === "option") assert.ok(lodgingOpenOn(day.lodging.id, day.date), `第 ${i + 1} 晚 ${day.lodging.id}`);
  }
  assert.ok(!nights.includes("mora-stay-paradise-inn"));
  const july = planTrip({ ...base, startDate: "2027-07-10" }, { referenceDate: "2026-10-18" });
  assert.ok(july.days.some((day) => day.lodging?.kind === "option" && day.lodging.id === "mora-stay-paradise-inn"));
});
