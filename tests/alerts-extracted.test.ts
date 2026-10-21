import assert from "node:assert/strict";
import { test } from "node:test";
import type { ParkAlert } from "../src/lib/alert-match";
import { withExtracted, type ExtractedClosures } from "../src/lib/copilot/live";

const alert = (id: string, title: string): ParkAlert => ({
  id,
  park: "yose",
  title,
  category: "Park Closure",
  url: "https://www.nps.gov/yose/planyourvisit/conditions.htm",
  description: "",
  updated: "2026-10-20 00:00:00.0",
});

const file = (closures: ExtractedClosures["closures"]): ExtractedClosures => ({ fetched: "2026-10-20", parks: { yose: "2026-10-20" }, closures });

test("行程页用上每晚模型读公告的结果：标题对到但这趟碰不到的去掉，模型和规则都认的补上，只有模型找到的不动", () => {
  const byStop = new Map([["yose-mist-trail", alert("A1", "Mist Trail Closed")]]);
  const extracted = file([
    // 模型读出 10 月 24 日就重开：10 月 26 日出发的行程照排
    { alert: "A1", park: "yose", attractions: ["yose-mist-trail"], from: "2026-10-01", reopen: "2026-10-24", title: "Mist Trail Closed", strict: ["yose-mist-trail"] },
    // 标题没对上、模型和规则都认的：加上
    { alert: "A2", park: "yose", attractions: ["yose-glacier-point"], from: null, reopen: null, title: "Glacier Point Road closed", strict: ["yose-glacier-point"] },
    // 只有模型找到的：不动
    { alert: "A3", park: "yose", attractions: ["yose-taft-point"], from: null, reopen: null, title: "Road work", strict: [] },
  ]);
  const result = withExtracted(byStop, extracted, "2026-10-26", 3, "2026-10-21", ["yose"]);
  assert.deepEqual([...result.keys()].sort(), ["yose-glacier-point"]);
  assert.equal(result.get("yose-glacier-point")?.title, "Glacier Point Road closed");
  // 原来的 Map 不改
  assert.ok(byStop.has("yose-mist-trail"));
});

test("模型读的结果旧了、没有、或者行程太远：照旧只按公告标题", () => {
  const byStop = new Map([["yose-mist-trail", alert("A1", "Mist Trail Closed")]]);
  const extracted = file([{ alert: "A1", park: "yose", attractions: ["yose-mist-trail"], from: null, reopen: "2026-10-24", title: "Mist Trail Closed" }]);
  assert.equal(withExtracted(byStop, undefined, "2026-10-26", 3, "2026-10-21", ["yose"]), byStop);
  // 快照是 10 天前的
  const stale = { ...extracted, fetched: "2026-10-10", parks: { yose: "2026-10-10" } };
  assert.equal(withExtracted(byStop, stale, "2026-10-26", 3, "2026-10-21", ["yose"]), byStop);
  // 一个月以后出发：公告管不了
  assert.equal(withExtracted(byStop, extracted, "2026-11-30", 3, "2026-10-21", ["yose"]), byStop);
});
