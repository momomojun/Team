import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

// 英文版内容（src/i18n/en/content/）：按批写，写完一批把 DONE_BATCH 加一，这一批以前的组都要写完。
// 第 1 批：每座公园的景点和同行适合度、公园介绍、封路班车游船停车场、机场门票等；第 2 批：住宿、特别活动、预约规则；第 3 批：博主路线、明星同款、榜单
const DONE_BATCH = 0;
const batchOf = (id: string) =>
  ["lodging", "activities", "bookings"].includes(id) ? 2 : ["creators", "celebrities", "rankings"].includes(id) ? 3 : 1;

const HAN = /[㐀-鿿]/;
const dir = new URL("../src/i18n/en/content/", import.meta.url);
const groups = readdirSync(dir)
  .filter((name) => name.endsWith(".ts") && name !== "index.ts")
  .map((name) => {
    const id = name.replace(/\.ts$/, "");
    const text = readFileSync(new URL(name, dir), "utf8");
    return { id, entries: Object.entries(JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1))) as [string, string][] };
  });

test("英文内容文件都是合法的 JSON，英文里没有混进汉字", () => {
  for (const { id, entries } of groups) {
    const han = entries.filter(([, en]) => HAN.test(en)).map(([zh]) => zh.slice(0, 20));
    assert.deepEqual(han, [], id);
  }
});

test("已经写完的批次没有漏写的条目", () => {
  for (const { id, entries } of groups.filter((group) => batchOf(group.id) <= DONE_BATCH)) {
    assert.deepEqual(entries.filter(([, en]) => en === "").map(([zh]) => zh.slice(0, 20)), [], id);
  }
});
