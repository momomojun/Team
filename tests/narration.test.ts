import assert from "node:assert/strict";
import test from "node:test";
import { getDictionary } from "../src/i18n/dictionaries";
import { readingMs, sentences, stopNarration, type StopFacts } from "../src/lib/narration";

const zh = getDictionary("zh-Hans");
const en = getDictionary("en");

const glacierPoint = (overrides: Partial<StopFacts> = {}): StopFacts => ({
  index: 3,
  name: "冰川点",
  summary: "海拔约 2,199 米，站在山谷上方俯瞰全景，半穹顶就在正对面。",
  tips: ["从山谷开车约 1 小时", "日落前后车位紧张，早点到"],
  stayMin: 45,
  bestTime: ["sunset"],
  hazards: ["dropoff"],
  hazardText: zh.attraction.family.hazards,
  arrive: "19:44",
  stay: "45 分钟",
  ...overrides,
});

test("讲解：每一站四行（看点、怎么玩、什么时候、注意），全是数据里有的话", () => {
  const out = stopNarration(glacierPoint({ parkingFull: true, next: { drive: "1 小时 10 分钟", name: "Wawona" } }), zh.plan.tour.narration, false);
  assert.equal(out.title, "第 3 站 · 冰川点");
  assert.deepEqual(out.lines.map((line) => line.label), ["看点", "怎么玩", "什么时候", "注意"]);
  assert.equal(out.lines[0].text, "海拔约 2,199 米，站在山谷上方俯瞰全景，半穹顶就在正对面");
  assert.equal(out.lines[1].text, "在这里停 45 分钟；从山谷开车约 1 小时");
  assert.equal(out.lines[2].text, "19:44 到，日落前后最好看");
  assert.equal(out.lines[3].text, "悬崖边没有护栏；旺季停车场一早就满，尽量早到");
  assert.deepEqual(out.speech, [
    "第 3 站，冰川点。",
    "海拔约 2,199 米，站在山谷上方俯瞰全景，半穹顶就在正对面。",
    "在这里停 45 分钟。",
    "19:44 到，日落前后最好看。",
    "要注意：悬崖边没有护栏；旺季停车场一早就满，尽量早到。",
    "接下来开车约 1 小时 10 分钟，去Wawona。",
  ]);
});

test("讲解：步道写来回多远、爬升多少；没有要注意的就不出那一行", () => {
  const hike = stopNarration(
    glacierPoint({ name: "雾径", hazards: [], bestTime: undefined, arrive: undefined, tips: undefined, hike: { distanceMi: 3, gainFt: 1000, difficulty: "hard" } }),
    zh.plan.tour.narration,
    false,
  );
  assert.equal(hike.lines[1].text, "步道来回约 4.8 公里、爬升约 300 米，比较累；在这里停 45 分钟");
  assert.deepEqual(hike.lines.map((line) => line.label), ["看点", "怎么玩"]);
  const english = stopNarration(
    glacierPoint({ name: "Mist Trail", summary: "Two big waterfalls.", hazards: [], hike: { distanceMi: 3, gainFt: 1000, difficulty: "hard" }, hazardText: en.attraction.family.hazards, stay: "45 min", tips: undefined }),
    en.plan.tour.narration,
    true,
  );
  assert.equal(english.title, "Stop 3 · Mist Trail");
  assert.equal(english.lines[1].text, "The trail is about 3.0 miles round trip with 1000 ft of climbing, strenuous. Plan on 45 min here");
  assert.ok(english.speech.every((line) => line.endsWith(".")));
});

test("字幕：一句一句拆开，太长的在逗号处再拆；没声音时按阅读速度显示", () => {
  assert.deepEqual(sentences("第 3 站，冰川点。站在山谷上方。"), ["第 3 站，冰川点。", "站在山谷上方。"]);
  const long = "海拔约 2,199 米，站在山谷上方俯瞰全景，半穹顶就在正对面，还能看到弗纳尔和内华达瀑布，日落的时候整面花岗岩都是金色的。";
  assert.ok(sentences(long).length > 1 && sentences(long).every((part) => part.length <= 46));
  assert.equal(readingMs("好"), 1800);
  assert.ok(readingMs("海拔约 2,199 米，站在山谷上方俯瞰全景，半穹顶就在正对面。") > 5000);
});
