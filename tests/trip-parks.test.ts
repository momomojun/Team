import assert from "node:assert/strict";
import { test } from "node:test";
import { parks } from "../src/data/parks";
import { MAX_TRIP_PARKS, oneTrip, reachable } from "../src/lib/trip-parks";

const nearbyOf = (code: string) => parks.find((park) => park.code === code)?.nearby ?? [];

test("长的多公园行程：一段一段开车一天能连起来就算一趟", () => {
  assert.ok(oneTrip(["deva", "seki"], nearbyOf)); // 死亡谷 → 红杉约 6 小时，不在 nearby 里
  assert.ok(oneTrip(["zion", "brca", "ante", "hsbd", "grca"], nearbyOf));
  assert.ok(oneTrip(["deva", "seki", "yose", "zion", "brca", "grca"], nearbyOf));
  assert.ok(!oneTrip(["zion", "acad"], nearbyOf));
  assert.deepEqual(reachable(["zion", "acad", "brca"], nearbyOf), ["zion", "brca"]);
  assert.equal(MAX_TRIP_PARKS, 6);
});
