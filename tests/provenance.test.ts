import assert from "node:assert/strict";
import { test } from "node:test";
import { attractions } from "../src/data/attractions";
import { tourSchedules } from "../src/data/tours";
import { stopSources } from "../src/lib/provenance";

const byId = new Map(attractions.map((a) => [a.id, a]));

test("资料出处：班车站列出班车的来源和核对日期，车程永远在最后", () => {
  const sources = stopSources(byId.get("zion-emerald-pools")!, { officialUrl: "https://www.nps.gov/zion/index.htm", today: "2026-10-27" });
  const kinds = sources.map((s) => s.kind);
  assert.ok(kinds.includes("shuttle"));
  assert.ok(kinds.includes("official"));
  assert.equal(kinds.at(-1), "drive");
  assert.ok(sources.every((s) => s.stale === null), "现在都还没过期");
});

test("资料出处：去年的班次、半年没核对的标出来", () => {
  const tour = tourSchedules[0];
  const stop = byId.get(tour.id)!;
  const nextYear = `${tour.scheduleYear + 1}-02-01`;
  const item = stopSources(stop, { today: nextYear }).find((s) => s.kind === "tour");
  assert.equal(item?.stale, "pastYear");
  const audit = stopSources(stop, { today: "2027-12-31" }).find((s) => s.kind === "audit");
  if (audit) assert.equal(audit.stale, "old");
});
