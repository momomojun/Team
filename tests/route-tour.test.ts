import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bearingOf,
  changedDays,
  cumulative,
  distanceAtCost,
  drawMs,
  easeInOut,
  fade,
  flyMs,
  followMs,
  followZoom,
  km,
  overallProgress,
  paceCost,
  sliceTo,
  slowness,
  stopDistances,
  turnToward,
} from "../src/components/map/route-tour";

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

test("跟车：进站前慢、长途时快，镜头进站时凑近、长途时拉远", () => {
  // 一条 100 公里的直路，40 公里处有一站
  const cum = Array.from({ length: 101 }, (_, i) => i);
  const stops = [40];
  assert.ok(slowness(40, stops, 100) > 1.1);
  assert.ok(slowness(70, stops, 100) < 0.25);
  const cost = paceCost(cum, stops);
  // 匀速播放：前 10% 的时间走到的路程，比后面长途那段同样 10% 的时间走得少
  const total = cost[cost.length - 1];
  const nearStart = distanceAtCost(cum, cost, total * 0.1);
  const middle = distanceAtCost(cum, cost, total * 0.6) - distanceAtCost(cum, cost, total * 0.5);
  assert.ok(nearStart < middle, `${nearStart} < ${middle}`);
  assert.equal(distanceAtCost(cum, cost, 0), 0);
  assert.equal(distanceAtCost(cum, cost, total * 2), 100);
  assert.ok(followZoom(slowness(40, stops, 100)) > followZoom(slowness(70, stops, 100)) + 2);
  assert.equal(followMs(1, 3), 9000);
  assert.equal(followMs(10000, 3), 18000);
  assert.equal(followMs(10000, 9), 12000);
});

test("跟车：方向和转向走最近的那边", () => {
  assert.ok(Math.abs(bearingOf([-119.6, 37.7], [-119.6, 37.8]) - 0) < 0.5);
  assert.ok(Math.abs(bearingOf([-119.6, 37.7], [-119.5, 37.7]) - 90) < 0.5);
  assert.ok(Math.abs(turnToward(350, 10, 0.5) - 0) < 1e-9);
  assert.ok(Math.abs(turnToward(10, 350, 0.5) - 0) < 1e-9);
  assert.equal(turnToward(90, 180, 1), 180);
});
