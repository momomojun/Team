import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { evaluateRealRoutes } from "../scripts/real-routes-lib.mjs";

const baseline = JSON.parse(readFileSync(new URL("./fixtures/real-routes/baseline.json", import.meta.url), "utf8"));
const SLACK = 0.02;

test("对照真实行程：真人去过的景点、有名的景点覆盖不比基线低，真人行程按我们的规则排“去不了”的不变多", () => {
  const { summary } = evaluateRealRoutes();
  const famous = summary.famousRecall ?? 0;
  assert.ok(summary.recall >= baseline.recall - SLACK, `覆盖 ${summary.recall.toFixed(3)} 低于基线 ${baseline.recall}（npm run eval:routes 看哪些景点不排了）`);
  assert.ok(famous >= baseline.famousRecall - SLACK, `有名景点覆盖 ${famous.toFixed(3)} 低于基线 ${baseline.famousRecall}`);
  assert.ok(summary.realRoutesWithHard <= baseline.realRoutesWithHard, `真人行程有“去不了、赶不上”的 ${summary.realRoutesWithHard} 条，基线 ${baseline.realRoutesWithHard} 条`);
});
