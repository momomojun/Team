import assert from "node:assert/strict";
import { test } from "node:test";
import { parks } from "../src/data/parks";
import { parkSafetyPages, SAFETY_CHECKED, safetyHazards } from "../src/data/safety";
import { attractionHazards, parkSafetyCards } from "../src/lib/safety";

const codes = new Set(parks.map((park) => park.code));
const official = /^https:\/\/(www\.nps\.gov|parks\.canada\.ca|www\.weather\.gov|www\.cdc\.gov|www\.usgs\.gov|myfwc\.com|www\.blm\.gov|navajonationparks\.org)/;

test("每种危险中英文都写全了、条数对得上，公园代码都存在，都有来源", () => {
  assert.equal(new Set(safetyHazards.map((h) => h.id)).size, safetyHazards.length);
  for (const hazard of safetyHazards) {
    for (const key of ["titleZh", "titleEn", "whatZh", "whatEn"] as const) assert.ok(hazard[key].trim(), `${hazard.id} ${key} 空着`);
    assert.equal(hazard.preventZh.length, hazard.preventEn.length, `${hazard.id} 怎么防中英文条数不一样`);
    assert.equal(hazard.ifZh.length, hazard.ifEn.length, `${hazard.id} 遇到了怎么办中英文条数不一样`);
    assert.ok(hazard.preventZh.length > 0, `${hazard.id} 没写怎么防`);
    assert.ok(hazard.sources.length > 0, `${hazard.id} 没有来源`);
    for (const [code, note] of Object.entries(hazard.parks)) {
      assert.ok(codes.has(code), `${hazard.id} 的公园 ${code} 不存在`);
      assert.ok(note.zh.trim() && note.en.trim(), `${hazard.id} ${code} 的说明缺中文或英文`);
      assert.doesNotMatch(note.en, /[一-鿿]/, `${hazard.id} ${code} 英文里混了汉字`);
    }
    assert.doesNotMatch([hazard.titleEn, hazard.whatEn, ...hazard.preventEn, ...hazard.ifEn].join(" "), /[一-鿿]/, `${hazard.id} 英文里混了汉字`);
  }
});

test("事件有日期、公园和链接，官方通报的链接是官方网站；日期不晚于核对的那天", () => {
  for (const hazard of safetyHazards) {
    for (const incident of hazard.incidents) {
      assert.match(incident.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(incident.date <= SAFETY_CHECKED, `${incident.date} 在核对日期以后`);
      assert.ok(codes.has(incident.park));
      if (!incident.news) assert.match(incident.url, official, `${hazard.id} ${incident.date} 不是官方链接却没标新闻`);
    }
  }
});

test("每座公园都有官方安全页面（或行前须知）的链接；公园页的“安全”至少有一样内容", () => {
  for (const code of codes) {
    assert.match(parkSafetyPages[code] ?? "", /^https:\/\//, `${code} 没有官方安全页面`);
  }
  assert.ok(parkSafetyCards("yell", "zh-Hans").some((card) => card.id === "bison" && card.here));
  assert.ok(attractionHazards("zion").some((group) => group.hazard === "flashFlood"));
});
