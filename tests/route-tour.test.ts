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
  chapterStep,
  clockText,
  distanceAt,
  driveDistance,
  locate,
  planDay,
  sentenceAt,
  slotStarts,
  progressAt,
  seekTarget,
  segmentStarts,
  tourTimeline,
  type TourDay,
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

// 讲解版的进度条：一天三站（起点住处、中间一站、当晚住处），中间那站和住处有讲解词
const tourDay: TourDay = {
  day: 0,
  color: "#a04c2e",
  title: "第 1 天",
  path,
  narration: ["第 1 天，今天去一个地方。"],
  stops: [
    { id: "start", lon: -119.6, lat: 37.7, label: "起点", caption: "" },
    { id: "mid", lon: -119.5, lat: 37.7, label: "中间", caption: "", narration: { title: "第 1 站 · 中间", lines: [], speech: ["看点。", "怎么玩。"] } },
    { id: "end", lon: -119.5, lat: 37.8, label: "住处", caption: "", lodging: true, narration: { title: "住处", lines: [], speech: ["今晚住这里。"] } },
  ],
};
const timing = {
  narrated: true,
  calm: false,
  fly: 2200,
  hold: 1600,
  arrive: 900,
  finale: 2200,
  speech: (lines: string[]) => lines.length * 1000,
  intro: ["开头。"],
  outro: ["结尾。"],
};

test("进度条的各段：开头、开场、开车、讲解、开车、住处、一天的结尾、结尾；开车的两段加起来就是这一天画线的时间", () => {
  const plan = planDay(tourDay, 1, false);
  const timeline = tourTimeline([tourDay], [plan], timing);
  assert.deepEqual(
    timeline.map((segment) => segment.kind),
    ["intro", "day", "drive", "stop", "drive", "stop", "end", "outro"],
    "起点那一站不停、没有讲解词，不单独成段",
  );
  const drives = timeline.filter((segment) => segment.kind === "drive");
  assert.ok(Math.abs(drives.reduce((sum, segment) => sum + segment.ms, 0) - plan.dayMs) <= 2);
  assert.equal(timeline[3].ms, 2600, "讲两句加停 0.6 秒");
  const starts = segmentStarts(timeline);
  assert.equal(starts.length, timeline.length + 1);
  assert.equal(starts.at(-1), timeline.reduce((sum, segment) => sum + segment.ms, 0));
  // 不是讲解版：没有开头，到站只停一下
  const plain = tourTimeline([tourDay], [plan], { ...timing, narrated: false });
  assert.equal(plain[0].kind, "day");
  assert.equal(plain.find((segment) => segment.kind === "stop")?.ms, 900);
});

test("开到第几公里和画到百分之几互相换算得回来（跟车和不跟车都是）", () => {
  for (const calm of [false, true]) {
    const plan = planDay(tourDay, 1, calm);
    for (const progress of [0.1, 0.37, 0.8]) {
      const distance = distanceAt(plan, progress, calm);
      assert.ok(Math.abs(progressAt(plan, distance, calm) - progress) < 1e-3);
    }
    assert.equal(progressAt(plan, 0, calm), 0);
    assert.equal(progressAt(plan, plan.total + 1, calm), 1);
  }
});

test("点进度条跳到哪；上一段、下一段只停在开场、各站、结尾", () => {
  const plan = planDay(tourDay, 1, false);
  const timeline = tourTimeline([tourDay], [plan], timing);
  const starts = segmentStarts(timeline);
  // 点在开车那段的正中间：跳到那段的一半；点在讲解那段的中间：从这一站开头讲
  const drive = seekTarget(timeline, starts, starts[2] + timeline[2].ms / 2);
  assert.equal(drive.segment, 2);
  assert.ok(Math.abs(drive.fraction - 0.5) < 1e-9);
  assert.deepEqual(seekTarget(timeline, starts, starts[3] + 100), { segment: 3, fraction: 0 });
  assert.equal(seekTarget(timeline, starts, starts.at(-1)! + 1000).segment, 7, "拖到最后是结尾");
  assert.equal(chapterStep(timeline, starts, starts[2] + 10, 1), 3, "开车途中按“下一段”到下一站");
  assert.equal(chapterStep(timeline, starts, starts[3] + 2500, -1), 3, "这一站讲了两秒以上，“上一段”先回到这一站开头");
  assert.equal(chapterStep(timeline, starts, starts[3] + 500, -1), 1, "刚开始讲，“上一段”回到这一天的开场");
  assert.equal(chapterStep(timeline, starts, starts.at(-1)!, 1), 7, "已经到结尾了就停在结尾");
});

test("进度条旁边的时间按倍速换算", () => {
  assert.equal(clockText(65_000, 1), "1:05");
  assert.equal(clockText(65_000, 2), "0:33");
  assert.equal(clockText(0, 1.5), "0:00");
});

test("一个钟说了算：第几毫秒在第几段、进了多少；开车那段走到一半车开到哪；讲解从哪一句接着念", () => {
  const plan = planDay(tourDay, 1, false);
  const timeline = tourTimeline([tourDay], [plan], timing);
  const starts = segmentStarts(timeline);
  assert.deepEqual(locate(starts, 0), { segment: 0, offset: 0 });
  assert.deepEqual(locate(starts, starts[3] + 250), { segment: 3, offset: 250 });
  assert.deepEqual(locate(starts, starts[2]), { segment: 2, offset: 0 }, "正好在两段交界时算后一段的开头");
  assert.equal(locate(starts, starts.at(-1)! + 5000).segment, timeline.length - 1, "拖过了最后算在最后一段");
  assert.equal(locate(starts, -100).offset, 0);
  // 开车的段：开头在起点、末尾到站，中间按播放量（进站前减速），一直往前走
  const drive = timeline[2] as Extract<(typeof timeline)[number], { kind: "drive" }>;
  assert.equal(driveDistance(plan, drive, 0, false), drive.from);
  assert.ok(Math.abs(driveDistance(plan, drive, 1, false) - drive.to) < 1e-6);
  let last = -1;
  for (const f of [0.1, 0.3, 0.5, 0.7, 0.9]) {
    const d = driveDistance(plan, drive, f, false);
    assert.ok(d > last && d < drive.to);
    last = d;
  }
  // 三句话各念 1、2、1.5 秒：从 0、1、3 秒开始；第 2.5 秒跳进来从第二句念
  const slots = slotStarts([1000, 2000, 1500]);
  assert.deepEqual(slots, [0, 1000, 3000]);
  assert.equal(sentenceAt(slots, 0), 0);
  assert.equal(sentenceAt(slots, 2500), 1);
  assert.equal(sentenceAt(slots, 9999), 2);
});
