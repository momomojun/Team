import assert from "node:assert/strict";
import { test } from "node:test";
import { parkingTagCost, parkingTags } from "../src/data/fees-manual";

test("停车证按天数取最便宜的组合：大烟山日证 $5、周证 $15、年证 $40", () => {
  const tag = parkingTags.grsm;
  assert.equal(parkingTagCost(tag, 1), 5);
  assert.equal(parkingTagCost(tag, 2), 10);
  assert.equal(parkingTagCost(tag, 4), 15, "4 天买一张周证比 4 张日证便宜");
  assert.equal(parkingTagCost(tag, 8), 20, "一张周证加一张日证");
  assert.equal(parkingTagCost(tag, 60), 40, "待很久就买年证");
});
