import assert from "node:assert/strict";
import { test } from "node:test";
import { lodgingOptions } from "../src/data/lodging";
import { parks } from "../src/data/parks";
import { teslaChargers } from "../src/data/tesla.generated";

const codes = new Set(parks.map((p) => p.code));
const lodgingIds = new Set(lodgingOptions.map((l) => l.id));

test("Tesla 充电：公园代码、住宿 id 都对得上，超充按车程排、在前面", () => {
  for (const [code, park] of Object.entries(teslaChargers)) {
    assert.ok(codes.has(code), `没有这座公园：${code}`);
    const kinds = park.stations.map((s) => s.kind);
    const firstDestination = kinds.indexOf("destination");
    if (firstDestination >= 0) assert.ok(!kinds.slice(firstDestination).includes("supercharger"), `${code}：超充要排在目的地充电前面`);
    const drives = park.stations.filter((s) => s.kind === "supercharger").map((s) => s.drive ?? Infinity);
    assert.deepEqual(drives, [...drives].sort((a, b) => a - b), `${code}：超充按车程从近到远`);
    for (const s of park.stations) {
      assert.ok(s.sources.length > 0, `${code}：${s.name} 没有来源`);
      assert.ok(s.miles <= park.radius + 1, `${code}：${s.name} 在查的半径外面`);
      for (const id of s.lodging ?? []) assert.ok(lodgingIds.has(id), `${code}：没有这家住宿 ${id}`);
    }
    for (const [id, index, minutes] of park.lodgingNearest) {
      assert.ok(lodgingIds.has(id), `${code}：没有这家住宿 ${id}`);
      assert.equal(park.stations[index]?.kind, "supercharger", `${code}：${id} 最近的超充下标不对`);
      assert.ok(minutes >= 0);
    }
  }
});

test("Tesla 充电：一个站只有 OSM 一边有的，不会顶着 NLR 的站号", () => {
  for (const park of Object.values(teslaChargers)) {
    for (const s of park.stations) {
      if (s.sources.includes("nlr")) assert.ok(s.nlr, `${s.name} 写着 NLR 却没有站号`);
      else assert.equal(s.nlr, undefined);
      if (s.sources.includes("osm")) assert.ok(s.osm?.id);
    }
  }
});
