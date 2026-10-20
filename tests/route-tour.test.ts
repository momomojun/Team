import assert from "node:assert/strict";
import { test } from "node:test";
import { changedDays, cumulative, drawMs, easeInOut, fade, flyMs, km, overallProgress, sliceTo, stopDistances } from "../src/components/map/route-tour";

// 一条往东、再往北的折线：大约 0.1 度经度 + 0.1 度纬度
const path: [number, number][] = [
  [-119.6, 37.7],
  [-119.55, 37.7],
  [-119.5, 37.7],
  [-119.5, 37.75],
  [-119.5, 37.8],
];

test("距离和画到一半时线画到哪、车头在哪", () => {
  assert.ok(Math.abs(km([-119.6, 37.7], [-119.5, 37.7]) - 8.8) < 0.2, "0.1 度经度在北纬 37.7 度约 8.8 公里");
  const cum = cumulative(path);
  const total = cum.at(-1)!;
  const half = sliceTo(path, cum, total / 2);
  assert.ok(half.line.length >= 3 && half.line.length <= 4);
  assert.deepEqual(half.line.at(-1), half.head);
  assert.deepEqual(sliceTo(path, cum, total + 5).line, path, "画满了就是整条");
  assert.deepEqual(sliceTo(path, cum, 0).head, path[0]);
});

test("各站在路线上的位置按顺序往后找；同一条路来回时回程的那站不算到去程上", () => {
  const there = [...path, ...[...path].reverse().slice(1)];
  const cum = cumulative(there);
  const [first, turn, back] = stopDistances(there, cum, [
    { lon: -119.55, lat: 37.7 },
    { lon: -119.5, lat: 37.8 },
    { lon: -119.55, lat: 37.7 },
  ]);
  assert.ok(first < turn && turn < back, "回程经过同一个点时排在折返点后面");
  assert.ok(Math.abs(back - (cum.at(-1)! - first)) < 0.01);
});

test("一天画多久：整段控制在二十秒上下，天数少的每天也不会太长", () => {
  assert.equal(drawMs(1), 2800);
  assert.ok(drawMs(7) * 7 <= 12100);
  assert.equal(drawMs(14), 1500);
  assert.ok(flyMs(10) < flyMs(3));
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  assert.ok(Math.abs(easeInOut(0.5) - 0.5) < 1e-9);
  assert.equal(overallProgress(1, 4, 0.5), 0.375);
  assert.equal(overallProgress(3, 4, 2), 1);
  assert.equal(fade("#a04c2e", 0.35), "rgba(160,76,46,0.35)");
  assert.equal(fade("red", 0.5), "red");
});

test("改了行程只播变了的那几天；天数变了全部播", () => {
  assert.deepEqual(changedDays(null, ["a|x", "b|y"]), [0, 1]);
  assert.deepEqual(changedDays(["a|x", "b|y", "c|z"], ["a|x", "b,d|y", "c|w"]), [1, 2]);
  assert.deepEqual(changedDays(["a|x", "b|y"], ["a|x", "b|y"]), []);
  assert.deepEqual(changedDays(["a|x"], ["a|x", "b|y"]), [0, 1]);
});
