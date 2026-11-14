import assert from "node:assert/strict";
import test from "node:test";
import { attractions } from "../src/data/attractions/index";
import { nameKeys, names, matchesPlace } from "../scripts/lib/nps-photo-match";

test("手选封面必须与实际图集首图一致，图集内没有重复图片", () => {
  for (const a of attractions) {
    if (a.photoFile) {
      const file = decodeURIComponent(a.photo?.page.split("File:")[1] ?? "").replaceAll("_", " ");
      assert.equal(file, a.photoFile.replaceAll("_", " "), a.id);
    }
    assert.equal(new Set(a.gallery.map((p) => p.url)).size, a.gallery.length, a.id);
  }
});

test("已确认的异地图片和未标注历史照片不再展示", () => {
  for (const [id, forbidden] of [
    ["yose-washburn-point", "wawona-grey-barn"],
    ["noca-visitor-center", "north-cascades-lodge-at-stehekin"],
    ["noca-visitor-center", "rainbow-falls-north-cascades"],
    ["yose-glacier-point", "Glacier-Point-Hotel-Snowshoe"],
    ["seki-big-trees-trail", "Pfeiffer_Big_Sur"],
  ]) {
    const a = attractions.find((a) => a.id === id)!;
    assert.ok(a.gallery.length > 0, id);
    assert.ok(a.gallery.every((p) => !p.page.includes(forbidden)), `${id}: ${forbidden}`);
  }
});

test("NPS 名称匹配不能只凭公园名或单个姓氏", () => {
  const visitor = nameKeys({ nameEn: "North Cascades Visitor Center" });
  assert.equal(names("North Cascades Lodge at Stehekin", visitor), false);
  assert.equal(names("Rainbow Falls, North Cascades", visitor), false);
  assert.equal(names("North Cascades Visitor Center exterior", visitor), true);
  assert.equal(names("Wawona Grey Barn (Washburn Barn)", nameKeys({ nameEn: "Washburn Point" })), false);
  assert.equal(names("Washburn Point panorama", nameKeys({ nameEn: "Washburn Point" })), true);
  assert.equal(names("Trail through the Big Trees", nameKeys({ nameEn: "Big Trees Trail" })), true);
});

test("NPS 同名异地照片被拒绝，近处与步道出发点照片仍可匹配", () => {
  const stop = { nameEn: "Washburn Point", lat: 37.72, lon: -119.57 };
  assert.equal(matchesPlace(stop, { title: "Washburn Point", latitude: "38.72", longitude: "-119.57" }), false);
  assert.equal(matchesPlace(stop, { title: "Overlook", latitude: "37.72", longitude: "-119.57" }), true);
  assert.equal(matchesPlace({ ...stop, start: { lat: 38.72, lon: -119.57 } }, { title: "Trailhead", latitude: "38.72", longitude: "-119.57" }), true);
  assert.equal(matchesPlace(stop, { title: "Washburn Point", latitude: "", longitude: "" }), true);
  assert.equal(matchesPlace(stop, { title: "Wawona Grey Barn", latitude: "", longitude: "" }), false);
  assert.equal(matchesPlace(stop, { title: "Washburn Point", latitude: null }), true);
  assert.equal(matchesPlace(stop, { title: "Unrelated", latitude: "NaN", longitude: "-119.57" }), false);
});
