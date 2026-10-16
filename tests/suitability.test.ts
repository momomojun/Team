import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { attractions } from "../src/data/attractions";
import { suitability } from "../src/data/suitability";
import type { Suitability } from "../src/data/attractions/types";
import { fitFor } from "../src/lib/suitability";

const HAZARDS = ["dropoff", "scramble", "thermal", "flashFlood", "water", "heat", "altitude", "wildlife", "remote", "motion"];
const dir = new URL("../src/data/suitability/", import.meta.url);
const parkFiles = readdirSync(dir).filter((name) => name.endsWith(".ts") && name !== "index.ts");

test("每个景点都标了同行适合度，没有多出来的 id", () => {
  const ids = new Set(attractions.map((a) => a.id));
  assert.deepEqual(attractions.filter((a) => !suitability[a.id]).map((a) => a.id), []);
  assert.deepEqual(Object.keys(suitability).filter((id) => !ids.has(id)), []);
});

test("每个公园文件只放这个公园的景点", () => {
  for (const name of parkFiles) {
    const park = name.replace(/\.ts$/, "");
    const ids = [...readFileSync(new URL(name, dir), "utf8").matchAll(/^  "([^"]+)": \{/gm)].map((m) => m[1]);
    const others = ids.filter((id) => attractions.find((a) => a.id === id)?.park !== park);
    assert.deepEqual(others, [], name);
  }
});

test("字段取值合法，有危险或不适合的都写了说明", () => {
  for (const [id, s] of Object.entries(suitability)) {
    assert.ok(Number.isInteger(s.kidsFromAge) && s.kidsFromAge >= 0 && s.kidsFromAge <= 18, id);
    if (s.minAge !== undefined) assert.ok(s.kidsFromAge >= s.minAge, `${id}: kidsFromAge 不能小于官方年龄下限`);
    assert.ok(["yes", "partial", "no"].includes(s.stroller), id);
    assert.ok(["yes", "assisted", "partial", "no"].includes(s.wheelchair), id);
    assert.ok(["ok", "caution", "no"].includes(s.seniors), id);
    for (const hazard of s.hazards ?? []) assert.ok(HAZARDS.includes(hazard), `${id}: ${hazard}`);
    assert.equal(new Set(s.hazards).size, s.hazards?.length ?? 0, `${id}: 危险重复`);
    const needsNote = (s.hazards?.length ?? 0) > 0 || s.seniors !== "ok" || s.kidsFromAge >= 6 || s.minAge !== undefined;
    if (needsNote) assert.ok(s.noteZh && s.noteZh.length >= 10, `${id}: 要写 noteZh`);
    if (s.source) assert.match(s.source, /^https:\/\//, id);
  }
});

test("草稿都已经逐个核对过", () => {
  const drafts = parkFiles.filter((name) => readFileSync(new URL(name, dir), "utf8").includes("DRAFT"));
  assert.deepEqual(drafts, []);
});

const angels: Suitability = { kidsFromAge: 12, stroller: "no", wheelchair: "no", seniors: "no", hazards: ["dropoff", "scramble"], noteZh: "x" };
const riverside: Suitability = { kidsFromAge: 0, stroller: "yes", wheelchair: "assisted", seniors: "ok" };
const cave: Suitability = { kidsFromAge: 12, minAge: 12, stroller: "no", wheelchair: "no", seniors: "caution", hazards: ["scramble"] };

test("没有同行的人就都合适", () => {
  assert.deepEqual(fitFor(undefined, angels), { level: "ok", reasons: [], blocking: [] });
  assert.deepEqual(fitFor({}, angels), { level: "ok", reasons: [], blocking: [] });
});

test("孩子不到建议年龄、官方年龄下限不排", () => {
  assert.equal(fitFor({ youngestKid: 8 }, angels).level, "no");
  assert.equal(fitFor({ youngestKid: 13 }, angels).level, "caution");
  assert.deepEqual(fitFor({ youngestKid: 8, seniors: true }, { ...angels, seniors: "caution" }).blocking, [{ kind: "kidsAge", age: 12 }]);
  assert.deepEqual(fitFor({ youngestKid: 10 }, cave).reasons[0], { kind: "minAge", age: 12 });
  assert.equal(fitFor({ youngestKid: 2 }, riverside).level, "ok");
});

test("婴儿车推不了只提醒，轮椅去不了不排、要协助的提醒", () => {
  assert.equal(fitFor({ stroller: true }, { ...riverside, stroller: "no" }).level, "caution");
  assert.equal(fitFor({ wheelchair: true }, riverside).level, "caution");
  assert.equal(fitFor({ wheelchair: true }, angels).level, "no");
});

test("老人：不建议的不排，量力而行的提醒，体力相关的危险也提醒", () => {
  assert.equal(fitFor({ seniors: true }, angels).level, "no");
  assert.equal(fitFor({ seniors: true }, { ...riverside, seniors: "caution" }).level, "caution");
  assert.deepEqual(fitFor({ seniors: true }, { ...riverside, hazards: ["altitude", "dropoff"] }).reasons, [
    { kind: "hazard", hazard: "altitude", who: "seniors" },
  ]);
});
