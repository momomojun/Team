import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { evaluatePlanQuality } from "../scripts/plan-quality-lib.mjs";

const baseline = JSON.parse(readFileSync(new URL("./fixtures/plan-quality/baseline.json", import.meta.url), "utf8"));
const SLACK = 0.02;

test("行程质量（TravelPlanner 式逐条检查、TripCraft 式连续分）不比基线差", () => {
  const { summary } = evaluatePlanQuality();
  const hint = "（npm run eval:quality 看哪条行程、哪一项没过）";
  assert.equal(summary.deliveryRate, 1, `有请求没排出行程${hint}`);
  assert.equal(summary.failCounts["hard.party"], 0, `排了同行的人不适合的景点${hint}`);
  assert.equal(summary.failCounts["hard.exclude"], 0, `排了点名不去的景点${hint}`);
  for (const key of ["finalPassRate", "commonsenseMacro", "hardMacro", "temporal", "ordering"] as const) {
    const value = summary[key] ?? 0;
    assert.ok(value >= baseline[key] - SLACK, `${key} ${value.toFixed(3)} 低于基线 ${baseline[key]}${hint}`);
  }
  // 空间分接近 1，差一点就是真的多开了车
  const spatial = summary.spatial ?? 0;
  assert.ok(spatial >= baseline.spatial - 0.005, `spatial ${spatial.toFixed(4)} 低于基线 ${baseline.spatial}${hint}`);
});
