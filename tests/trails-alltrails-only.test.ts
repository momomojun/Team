import assert from "node:assert/strict";
import test from "node:test";
import { alltrailsAttractionUrl, alltrailsTrailUrl } from "@/data/alltrails";
import { alltrailsDoubtful } from "@/data/attractions/alltrails-doubtful.generated";
import { alltrailsParkTop, attractions, getParkAttractions } from "@/data/attractions";
import { googlePlaces } from "@/data/attractions/google";
import { hikeRows } from "@/lib/hike-rows";
import { byPopularity, popularRank } from "@/lib/popularity";
import { stopSources } from "@/lib/provenance";

const byId = new Map(attractions.map((a) => [a.id, a]));
const doubtful = new Set(alltrailsDoubtful);

test("步道只看 AllTrails：徒步不挂 Google 的评分、评论数和名次，别的景点照旧", () => {
  const hikes = attractions.filter((a) => a.kind === "hike");
  assert.ok(hikes.length > 300);
  for (const a of hikes) {
    assert.equal(a.google, undefined, `${a.id} 不挂 Google 数据`);
    assert.equal(a.hotRank, undefined, `${a.id} 没有 Google 热度名次`);
    assert.equal(popularRank(a), a.hikeRank, `${a.id} 的热度名次是 AllTrails 的`);
  }
  // 雾径在 Google 上原来排第 16，按 AllTrails 是优胜美地第 1 条步道
  assert.equal(byId.get("yose-mist-trail")?.hikeRank, 1);
  // 非徒步的 Google 快照照旧，园内名次只在非徒步之间排、从 1 连着往下
  const sights = attractions.filter((a) => a.kind !== "hike" && googlePlaces[a.id]);
  assert.ok(sights.every((a) => a.google === googlePlaces[a.id]));
  for (const park of new Set(attractions.map((a) => a.park))) {
    const ranks = getParkAttractions(park)
      .map((a) => a.hotRank)
      .filter((rank): rank is number => rank !== undefined)
      .sort((a, b) => a - b);
    assert.deepEqual(ranks, ranks.map((_, i) => i + 1), `${park} 的 Google 名次连续`);
  }
});

test("对错路线的 AllTrails 步道不挂：不显示它的评分、距离，链接改成搜索，徒步页按我们自己的数据列", () => {
  const tanque = byId.get("sagu-tanque-verde-ridge")!;
  assert.ok(doubtful.has(tanque.id));
  assert.equal(tanque.alltrails, undefined);
  assert.equal(tanque.hikeRank, undefined);
  assert.ok(!alltrailsAttractionUrl(tanque, "Saguaro National Park").startsWith("https://www.alltrails.com/trail/"));

  // 徒步页的 AllTrails 榜单不再把那条 5.3 英里的路线当成我们的观景点步道
  for (const list of Object.values(alltrailsParkTop)) {
    for (const trail of list) assert.ok(!trail.attractionId || !doubtful.has(trail.attractionId), `${trail.slug} 不对应对错路线的景点`);
  }
  const sagu = getParkAttractions("sagu");
  const rows = hikeRows(sagu.filter((a) => a.hike), alltrailsParkTop.sagu ?? []);
  const own = rows.find((row) => row.attractionId === tanque.id)!;
  assert.ok(own, "我们的 Tanque Verde 观景点步道还在徒步页上");
  assert.equal(own.lengthMi, tanque.hike!.distanceMi);
  assert.equal(own.gainFt, tanque.hike!.gainFt);
  assert.equal(own.rating, undefined);
  assert.equal(own.popularity, undefined);
  assert.equal(own.slug, undefined);
  assert.equal(new Set(rows.map((row) => row.key)).size, rows.length, "每行的 key 不重复");
  // 对上了的步道照样直达 AllTrails
  const mist = byId.get("yose-mist-trail")!;
  assert.equal(alltrailsAttractionUrl(mist, "Yosemite National Park"), alltrailsTrailUrl(mist.alltrails!.slug));
});

test("按热度排：景点和步道各自的名次交替，徒步的资料出处是 AllTrails", () => {
  const zion = getParkAttractions("zion").sort(byPopularity);
  const top = zion.slice(0, 4).map((a) => [a.kind === "hike", popularRank(a)]);
  assert.deepEqual(top, [
    [false, 1],
    [true, 1],
    [false, 2],
    [true, 2],
  ]);
  const sources = stopSources(byId.get("yose-mist-trail")!, { today: "2026-10-28" }).map((s) => s.kind);
  assert.ok(sources.includes("alltrails"));
  assert.ok(!sources.includes("rating"));
  assert.ok(stopSources(byId.get("yose-tunnel-view")!, { today: "2026-10-28" }).some((s) => s.kind === "rating"));
});
