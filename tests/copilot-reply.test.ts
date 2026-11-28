// Copilot 回复拆成块（对话框按块排版）：Writer 模板写的每天一行拆成出发、各站、住处；对不上的照原样当段落
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDay, replyBlocks } from "../src/lib/copilot/reply-blocks";

test("中文的一天：出发、各站、晚上住哪", () => {
  const day = parseDay("第 2 天（2026-11-11，锡安）：08:00 从 Springdale 出发（开车 25 分钟） → 08:30 锡安游客中心、09:10 天使降临（当地 10:10）；晚上住 Springdale");
  assert.deepEqual(day, {
    kind: "day",
    title: "第 2 天",
    detail: "2026-11-11，锡安",
    leave: { time: "08:00", from: "Springdale", drive: "25 分钟" },
    stops: [
      { time: "08:30", name: "锡安游客中心" },
      { time: "09:10", name: "天使降临", local: "10:10" },
    ],
    stay: "Springdale",
  });
});

test("英文的一天、最后一天开回机场、路上的一天", () => {
  const day = parseDay("Day 3 (2026-11-12): leave Springdale at 08:00 → 09:00 Canyon Overlook, 11:30 Kolob Canyons; drive back to Las Vegas (2 h 40 min, arriving 15:10)");
  assert.equal(day?.leave?.from, "Springdale");
  assert.equal(day?.leave?.time, "08:00");
  assert.deepEqual(day?.stops.map((stop) => stop.name), ["Canyon Overlook", "Kolob Canyons"]);
  assert.equal(day?.end, "drive back to Las Vegas (2 h 40 min, arriving 15:10)");
  assert.equal(parseDay("第 4 天（2026-11-13）：路上 / 休息；晚上住 Kanab")?.rest, "路上 / 休息");
});

test("对不上的照原样当段落，列表和小标题分开", () => {
  const blocks = replyBlocks("锡安 3 天，从 11 月 10 日开始，节奏轻松。\n第 1 天：随便逛逛\n要注意：\n- 第 2 天 天使降临 要抽签\n- 第 3 天 回程很长");
  assert.deepEqual(
    blocks.map((block) => block.kind),
    ["para", "para", "heading", "list"],
  );
  const list = blocks.at(-1);
  assert.ok(list?.kind === "list" && list.items.length === 2);
});

test("11-27 本机 35B 排的锡安 + 布莱斯 5 天：5 天都拆出来，没排进去的拆成列表", () => {
  const text = [
    "锡安、布莱斯峡谷 5 天，从 2026-11 开始，节奏轻松。",
    "第 1 天（2026-11-15，锡安）：08:00 从拉斯维加斯机场（LAS）出发（开车约 3 小时 40 分） → 11:39 族长庭院、12:40 河滨步道、17:07 峡谷交汇桥；晚上住锡安酒店",
    "第 5 天（2026-11-19，布莱斯峡谷）：06:40 从布莱斯峡谷酒店出发 → 06:52 日出点、07:49 苔藓洞；最后开回拉斯维加斯机场（LAS），开车约 4 小时 40 分，13:24 到",
    "没排进去的：天使降临（要抽签的许可证）；守望者步道（这几天不开放）；窄缝（太难或太长） 等 9 处",
  ].join("\n");
  const blocks = replyBlocks(text);
  assert.deepEqual(blocks.map((block) => block.kind), ["para", "day", "day", "heading", "list"]);
  const first = blocks[1];
  assert.ok(first.kind === "day" && first.leave?.from === "拉斯维加斯机场（LAS）" && first.leave.drive === "约 3 小时 40 分" && first.stay === "锡安酒店");
  const last = blocks[2];
  assert.ok(last.kind === "day" && last.end?.startsWith("最后开回拉斯维加斯机场") && last.stops.length === 2);
  const skipped = blocks[4];
  assert.ok(skipped.kind === "list" && skipped.items.length === 3);
});
