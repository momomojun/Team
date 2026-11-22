import assert from "node:assert/strict";
import { test } from "node:test";
import { activities } from "../src/data/activities";
import { parks } from "../src/data/parks";
import { ACTIVITY_MONTHS, activityCards, LIMITED_MONTHS, parseActivityMonth } from "../src/lib/activity-cards";
import { parkWeight } from "../src/lib/park-popularity";

test("活动页每个月都有活动，锚点不重复，每个活动都能对上公园", () => {
  const codes = new Set(parks.map((park) => park.code));
  assert.deepEqual(activities.filter((a) => !codes.has(a.park)).map((a) => a.nameEn), []);
  for (const month of ACTIVITY_MONTHS) {
    const cards = activityCards("zh-Hans", month);
    assert.ok(cards.length > 0, `${month} 月没有活动`);
    assert.equal(new Set(cards.map((card) => card.id)).size, cards.length, `${month} 月有重复的锚点`);
    assert.ok(cards.every((card) => card.image), `${month} 月有活动没有照片`);
  }
  // 1–12 月加上“全年”正好是全部活动
  const total = new Set(ACTIVITY_MONTHS.flatMap((month) => activityCards("zh-Hans", month).map((card) => card.id)));
  assert.equal(total.size, activities.length);
});

test("限时的排在前面，同样限时的按公园热门程度排", () => {
  const cards = activityCards("zh-Hans", 7);
  const firstOpen = cards.findIndex((card) => !card.limited);
  assert.ok(firstOpen > 0 && cards.slice(firstOpen).every((card) => !card.limited));
  assert.ok(cards.every((card) => card.limited === Boolean(card.months && card.months.length <= LIMITED_MONTHS)));
  const limited = cards.slice(0, firstOpen);
  for (let i = 1; i < limited.length; i++) assert.ok(parkWeight(limited[i - 1].park) >= parkWeight(limited[i].park));
});

test("月份参数只认 1–12 和 all", () => {
  assert.equal(parseActivityMonth("7"), 7);
  assert.equal(parseActivityMonth("all"), "all");
  for (const bad of ["0", "13", "1.5", "july", ""]) assert.equal(parseActivityMonth(bad), undefined);
});
