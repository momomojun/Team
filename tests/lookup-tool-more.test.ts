import assert from "node:assert/strict";
import { test } from "node:test";
import { parks } from "../src/data/parks";
import { booking, crowd, fees, lookup, seasonRank, sunTimesAt } from "../src/lib/copilot/lookup-tool";
import { combine, rankSeasons, windowOf } from "../src/lib/season-score";
import { parkSeason } from "../src/lib/seasons";

// 11-13 给 search agent 加的五个查询：按季节比公园、门票、日出日落、要提前订什么、人多不多

test("season_rank：11 月最适合的是沙漠和南边的公园，黄石、冰川不太合适；和“什么时候去”页的打分一样", () => {
  const november = seasonRank({ tool: "season_rank", month: 11, today: "2026-11-13", limit: 20 });
  assert.ok("great" in november && november.great && november.poor);
  const great = november.great.map((row) => row.code);
  for (const code of ["deva", "jotr", "zion"]) assert.ok(great.includes(code), code);
  for (const code of ["yell", "glac"]) assert.ok(november.poor.some((row) => row.code === code), code);
  // 分档和页面用的是同一个函数
  const seasons = parks.map((park) => parkSeason(park, "2026-11-13"));
  const { weights } = windowOf({ month: 11 });
  const deva = combine(seasons.find((park) => park.code === "deva")!, weights, null);
  assert.equal(november.great.find((row) => row.code === "deva")?.score, Math.round(deva.score * 10) / 10);
  // 和页面一样不算园外名胜：三档加起来 66 座
  const national = seasons.filter((park) => parks.find((p) => p.code === park.code)?.kind !== "site");
  assert.equal(november.counts.great, rankSeasons(national, { month: 11 }).filter((row) => row.verdict === "great").length);
  assert.equal(november.counts.great + november.counts.ok + november.counts.poor, national.length);
  assert.ok(!november.poor.some((row) => row.code === "ante"));
});

test("season_rank：只比给的几座，带气温和去不了的必去景点；不给月份也不给日期返回错误", () => {
  const january = seasonRank({ tool: "season_rank", month: 1, parks: ["yose", "zion"], today: "2026-11-13" });
  assert.ok("compared" in january && january.compared);
  assert.deepEqual(january.compared.map((row) => row.code).sort(), ["yose", "zion"]);
  const yose = january.compared.find((row) => row.code === "yose")!;
  assert.equal(yose.verdict, "poor");
  assert.ok(yose.closedMustSee.includes("冰川点"));
  assert.equal(typeof yose.climate?.highC, "number");
  assert.equal(seasonRank({ tool: "season_rank" }).error, "need_month_or_start");
});

test("season_rank：按出发那天起十天算，跨月的两个月都算进去", () => {
  const { weights, dates } = windowOf({ start: "2026-11-27" });
  assert.equal(dates?.length, 10);
  assert.deepEqual([...weights.entries()], [[11, 4], [12, 6]]);
  const ranked = lookup({ tool: "season_rank", start: "2026-11-27", today: "2026-11-13" });
  assert.ok("window" in ranked && ranked.window && "from" in ranked.window);
});

test("fees：美国的有年卡和非居民附加费，加拿大按天收加元、年卡不能用，不认识的公园返回错误", () => {
  const zion = fees("zion");
  assert.equal(zion.vehicle, 35);
  assert.equal(zion.nonresidentSurchargeUsd, 100);
  assert.equal(zion.passes?.nonresidentUsd, 250);
  const banff = fees("banf");
  assert.equal(banff.currency, "CAD");
  assert.equal(banff.perDay, true);
  assert.equal(banff.passes, undefined);
  assert.equal(fees("grsm").parkingTag?.day, 5);
  assert.equal(fees("nope").error, "unknown_park");
});

test("sun_times：按景点的时区写当地时间；夏天北边日落晚", () => {
  const zion = sunTimesAt({ tool: "sun_times", attraction: "zion-canyon-overlook", date: "2026-11-20" });
  assert.equal(zion.timeZone, "America/Denver");
  assert.match(zion.sunrise ?? "", /^07:\d\d$/);
  assert.match(zion.sunset ?? "", /^17:\d\d$/);
  const glacier = sunTimesAt({ tool: "sun_times", park: "glac", date: "2027-06-21" });
  assert.ok((glacier.sunset ?? "") >= "21:00");
  assert.equal(sunTimesAt({ tool: "sun_times", attraction: "nope", date: "2027-06-21" }).error, "unknown_place");
});

test("booking：4 月去锡安要抽天使降临，给了 today 算出还有几天开始申请", () => {
  const zion = booking({ tool: "booking", park: "zion", date: "2027-04-10", today: "2026-11-13" });
  assert.ok("items" in zion && zion.items);
  const angels = zion.items.find((item) => item.id === "zion-angels-landing-permit");
  assert.ok(angels);
  assert.equal(angels.openings[0].state?.state, "upcoming");
  // 只问一个景点时，只列这个景点的和整个公园都要的
  const only = booking({ tool: "booking", park: "zion", date: "2027-04-10", attraction: "zion-angels-landing" });
  assert.ok("items" in only && only.items?.every((item) => item.for.length === 0 || item.for.includes("天使降临")));
});

test("crowd：黄石 7 月最挤、11 月最冷清；加拿大的没有按月的数字", () => {
  const yell = crowd("yell");
  assert.ok("months" in yell);
  assert.equal(yell.busiestMonth, 7);
  assert.equal(yell.quietestMonth, 11);
  assert.equal(yell.months?.length, 12);
  const july = crowd("yell", 7);
  assert.ok("months" in july);
  assert.equal(july.months?.[0].level, "peak");
  const banff = crowd("banf");
  assert.ok(!("months" in banff) || banff.months === undefined);
  assert.equal(crowd("nope").error, "unknown_park");
});
