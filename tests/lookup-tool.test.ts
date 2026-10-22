import assert from "node:assert/strict";
import { test } from "node:test";
import { driveTime, isOpen, lookup, roadInText, searchAttractions } from "../src/lib/copilot/lookup-tool";
import { travelMinutes } from "../src/lib/travel";

test("is_open：季节性山路按往年通车的年数，冬天多半去不了、盛夏开着", () => {
  const winter = isOpen(undefined, "2027-01-15", "Tioga Road 1 月开吗");
  assert.equal(winter.verdict, "unlikely");
  assert.match(winter.facts[0].zh, /有 0 年这一天是通车的/);
  assert.equal(isOpen(undefined, "2027-08-01", "Tioga Road").verdict, "open");
  // 叫法：120 号公路、“泰奥加”都认，有没有空格都一样
  assert.equal(roadInText("120号公路")?.id, "yose-tioga-road");
  assert.equal(roadInText("泰奥加路几月通")?.id, "yose-tioga-road");
});

test("is_open：临时关闭、开放月份、班次各算一条依据，关了的优先", () => {
  const lipan = isOpen("grca-lipan-point", "2026-11-01");
  assert.equal(lipan.verdict, "closed");
  assert.ok(lipan.facts.some((fact) => fact.kind === "closure"));
  assert.equal(isOpen("grca-lipan-point", "2027-03-01").verdict, "open");
  const boat = isOpen("glac-many-glacier-boat", "2027-07-15");
  assert.ok(boat.facts?.some((fact) => fact.kind === "tour" && fact.effect === "open" && fact.zh.includes("08:30")));
  assert.equal(isOpen("glac-many-glacier-boat", "2027-01-15").verdict, "closed");
});

test("is_open：不认识的景点、也没说到山路的，返回错误而不是瞎猜", () => {
  assert.equal(isOpen("nope", "2027-01-15").error, "unknown_attraction");
  assert.equal(isOpen(undefined, "2027-01-15", "那个地方开吗").error, "unknown_attraction");
});

test("drive_time：景点、住处之间直接查车程表；机场先开到公园再算", () => {
  const stay = driveTime("yose-stay-el-portal", "yose-tunnel-view");
  assert.equal(stay.minutes, travelMinutes("yose-stay-el-portal", "yose-tunnel-view"));
  const airport = driveTime("FAT", "yose-tunnel-view");
  assert.equal(airport.via, "airport");
  assert.ok(airport.minutes && airport.minutes > 120 && airport.minutes < 240);
  assert.equal(driveTime("FAT", "LAS").error, "two_airports");
  assert.equal(driveTime("nope", "yose").error, "unknown_place");
});

test("drive_time：不通公路的两点（夏威夷和本土）是 null，不报一个 12 小时的假数字", () => {
  const result = driveTime("havo-uekahuna", "yose-tunnel-view");
  assert.ok(!("error" in result));
  assert.equal("minutes" in result && result.minutes, null);
  assert.equal("noRoad" in result && result.noRoad, true);
});

test("search：按类型、不要许可、带 5 岁孩子能去筛，必去的排前面", () => {
  const result = searchAttractions({ tool: "search", parks: ["zion"], kinds: ["hike"], noPermit: true, party: { youngestKid: 5 }, limit: 5 });
  assert.ok(result.total > 0);
  for (const stop of result.results) {
    assert.equal(stop.kind, "hike");
    assert.equal(stop.permit, undefined);
  }
  // 天使降临要抽签，不在里面
  assert.ok(!result.results.some((stop) => stop.id === "zion-angels-landing"));
  const must = result.results.findIndex((stop) => !stop.mustSee);
  assert.ok(must === -1 || result.results.slice(must).every((stop) => !stop.mustSee));
});

test("search：给了日期的，那天去不了的不列", () => {
  const winter = lookup({ tool: "search", parks: ["yose"], date: "2027-01-15", limit: 50 });
  assert.ok("results" in winter && !winter.results.some((stop) => stop.id === "yose-tioga-road"));
});
