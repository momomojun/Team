import assert from "node:assert/strict";
import { test } from "node:test";
import { tilesAlongPath, tileUrl } from "../src/lib/offline-maps";

test("播放路线前提前下载的瓦片：路线上每个点那一块和四周一圈，重复的只算一次", () => {
  // 优胜美地谷里往东走 10 公里，第 10 级的瓦片约 30 公里宽：都在同一块附近
  const path: [number, number][] = [
    [-119.7, 37.72],
    [-119.65, 37.72],
    [-119.6, 37.73],
  ];
  const near = tilesAlongPath(path, () => [10], 0);
  assert.ok(near.length >= 1 && near.length <= 2);
  assert.ok(near.every((tile) => tile.startsWith("10/")));
  const around = tilesAlongPath(path, () => [10], 1);
  assert.ok(around.length >= 9 && around.length <= 12, `${around.length}`);
  assert.equal(new Set(around).size, around.length);
  // 每个点要两级：两级都有
  const levels = new Set(tilesAlongPath(path, () => [12, 10], 0).map((tile) => tile.split("/")[0]));
  assert.deepEqual([...levels].sort(), ["10", "12"]);
  assert.equal(tileUrl("https://t.example/{z}/{x}/{y}.png", "10/171/395"), "https://t.example/10/171/395.png");
});
