import assert from "node:assert/strict";
import { test } from "node:test";
import { attractions } from "../src/data/attractions";
import { parkZones } from "../src/data/park-zones";
import { parks } from "../src/data/parks";
import { buildTimeline, type PlanStop } from "../src/lib/planner";
import { utcOffset, zoneOf, zoneShift } from "../src/lib/time-zone";

const stop = (id: string): PlanStop => {
  const found = attractions.find((a) => a.id === id);
  assert.ok(found, `没有这个景点：${id}`);
  return found;
};

test("park-zones.ts 和 parks.ts 的 timeZone 一致", () => {
  assert.deepEqual(parkZones, Object.fromEntries(parks.map((park) => [park.code, park.timeZone])));
});

test("景点单独写的时区都是能用的 IANA 名称，而且和公园的不一样", () => {
  for (const a of attractions.filter((a) => a.timeZone)) {
    assert.doesNotThrow(() => new Intl.DateTimeFormat("en-US", { timeZone: a.timeZone }), a.id);
    assert.notEqual(a.timeZone, parkZones[a.park], `${a.id} 的时区和公园一样，不用单独写`);
  }
});

test("亚利桑那不调夏令时：夏天比纳瓦霍保留地（纪念碑谷）慢 1 小时，冬天一样", () => {
  assert.equal(utcOffset("America/Phoenix", "2026-07-15"), -7 * 60);
  assert.equal(utcOffset("America/Denver", "2026-07-15"), -6 * 60);
  assert.equal(zoneShift(zoneOf(stop("mova-valley-drive")), "America/Phoenix", "2026-07-15"), 60);
  assert.equal(zoneShift(zoneOf(stop("mova-valley-drive")), "America/Phoenix", "2026-01-15"), 0);
  // 不知道日期、时区一样的不换算
  assert.equal(zoneShift("America/Denver", "America/Phoenix", null), 0);
  assert.equal(zoneShift("America/Denver", "America/Denver", "2026-07-15"), 0);
});

test("西奥多·罗斯福 North Unit 全年比 South Unit 快 1 小时；罗布森山全年比贾斯珀慢 1 小时", () => {
  const north = zoneOf(stop("thro-oxbow-overlook"));
  const south = zoneOf(stop("thro-south-unit-vc"));
  assert.equal(north, "America/Chicago");
  for (const date of ["2026-01-15", "2026-07-15"]) {
    assert.equal(zoneShift(north, south, date), 60, date);
    // BC 省 2026 年 3 月起全年 UTC-7，艾伯塔 11 月起全年 UTC-6：时区数据新旧都是差 1 小时
    assert.equal(zoneShift(zoneOf(stop("jasp-mount-robson")), zoneOf(stop("jasp-maligne-lake")), date), -60, date);
  }
});

test("同一天从佩吉去纪念碑谷：纪念碑谷的入场时间按纳瓦霍时间，夏天换算成亚利桑那时间要早 1 小时", () => {
  // Valley Drive 最晚 15:30（纳瓦霍时间）进；在羚羊峡谷待得久，快下午三点（亚利桑那时间）才到
  const page = { ...stop("ante-upper-antelope-canyon"), durationMin: 250 };
  const valley = { ...stop("mova-valley-drive"), hours: [{ open: "08:00", lastEntry: "15:30" }] };
  const day = (date: string) =>
    buildTimeline([page, valley], {
      sun: { sunrise: 6 * 60, sunset: 19 * 60 + 30, zone: "America/Phoenix" },
      date,
    });
  const summer = day("2026-07-15").entries[1];
  assert.equal(summer.zoneShift, 60);
  assert.ok(summer.start > 14 * 60 + 30 && summer.start < 15 * 60 + 30, `夏天 ${summer.start} 分钟到`);
  assert.ok(summer.warnings.includes("afterHours"), "夏天当地已经过了最晚入场");
  const winter = day("2026-01-15").entries[1];
  assert.equal(winter.zoneShift, undefined);
  assert.ok(!winter.warnings.includes("afterHours"), "冬天两边一样，还来得及");
});

test("艾伯塔 2026 年 11 月起、BC 省 3 月起不再调钟：时区数据旧也按新规则算", () => {
  assert.equal(utcOffset("America/Edmonton", "2026-07-15"), -6 * 60);
  assert.equal(utcOffset("America/Edmonton", "2026-12-15"), -6 * 60);
  assert.equal(utcOffset("America/Edmonton", "2026-01-15"), -7 * 60);
  assert.equal(utcOffset("America/Vancouver", "2026-12-15"), -7 * 60);
  assert.equal(utcOffset("America/Vancouver", "2026-01-15"), -8 * 60);
});
