import assert from "node:assert/strict";
import { test } from "node:test";
import { gearFor, wearFor } from "../src/components/plan/clothing";
import type { PlannerText } from "../src/components/plan/types";
import type { DayWeather } from "../src/components/plan/weather";
import { gearText, weatherSpeech, weatherSummary } from "../src/components/plan/weather-text";
import { getDictionary } from "../src/i18n/dictionaries";

const forecast = (high: number, low: number, extra: { code?: number; rainChance?: number; snowCm?: number; windKmh?: number } = {}): DayWeather => ({
  kind: "forecast",
  day: { date: "2026-11-02", code: extra.code ?? 1, high, low, rainChance: extra.rainChance ?? 0, snowCm: extra.snowCm ?? 0, windKmh: extra.windKmh ?? 10 },
  alerts: [],
});
const climate = (high: number, low: number, wetDays: number, snowDays = 0): DayWeather => ({
  kind: "climate",
  month: 7,
  climate: { high, low, wetDays, snowDays, precipMm: 0 },
});
const plain = { hike: false, early: false, late: false };

test("穿几层按最高气温分：热、暖、温和、凉、冷、很冷", () => {
  assert.deepEqual([34, 25, 18, 9, 1, -6].map(wearFor), ["hot", "warm", "mild", "cool", "cold", "frigid"]);
  assert.equal(wearFor(30), "hot");
  assert.equal(wearFor(29.9), "warm");
});

test("早晚多穿一层：温差大，或者要赶日出、看星空而早晚冷；本来就穿羽绒服的不再说", () => {
  // 死亡谷 11 月：白天 24°、早上 9°，温差 15 度
  assert.equal(gearFor(forecast(24, 9), plain).layer, true);
  assert.equal(gearFor(forecast(24, 16), plain).layer, false);
  // 温差不大，但要去看日出、早上只有 8 度
  assert.equal(gearFor(forecast(16, 8), { ...plain, early: true }).layer, true);
  assert.equal(gearFor(forecast(16, 8), plain).layer, false);
  assert.equal(gearFor(forecast(2, -12), plain).layer, false, "已经是“羽绒服”这一档");
  assert.equal(gearFor(forecast(36, 22), plain).sun, true, "热的天戴帽子、涂防晒");
});

test("雨具：雷雨带雨衣别撑伞；很可能下雨带伞，要徒步、风大时改带防水外套；三成以上带把折叠伞；下雪穿防水的鞋", () => {
  assert.equal(gearFor(forecast(20, 10, { code: 95, rainChance: 80 }), plain).rain, "storm");
  assert.equal(gearFor(forecast(20, 10, { code: 61, rainChance: 70 }), plain).rain, "umbrella");
  assert.equal(gearFor(forecast(20, 10, { code: 61, rainChance: 70 }), { ...plain, hike: true }).rain, "jacket");
  assert.equal(gearFor(forecast(20, 10, { code: 3, rainChance: 65, windKmh: 50 }), plain).rain, "jacket");
  assert.equal(gearFor(forecast(20, 10, { code: 3, rainChance: 40 }), plain).rain, "maybe");
  assert.equal(gearFor(forecast(20, 10, { code: 1, rainChance: 10 }), plain).rain, "none");
  assert.equal(gearFor(forecast(-1, -8, { code: 73, snowCm: 4 }), plain).rain, "snow");
});

test("往年同期（16 天以外）：一个月里下雨的天数换成随便哪天下雨的机会", () => {
  // 奥林匹克 11 月：约 20 天有雨
  assert.equal(gearFor(climate(10, 4, 20), plain).rain, "umbrella");
  assert.equal(gearFor(climate(10, 4, 20), { ...plain, hike: true }).rain, "jacket");
  assert.equal(gearFor(climate(30, 15, 8), plain).rain, "maybe");
  assert.equal(gearFor(climate(35, 20, 2), plain).rain, "none");
  assert.equal(gearFor(climate(-2, -12, 10, 8), plain).rain, "snow");
  assert.equal(gearFor(climate(35, 20, 2), plain).wear, "hot");
});

test("写出来、念出来的字：卡片上一行天气，穿衣和雨具；念的不带 °、华氏度（英文版念华氏度）", () => {
  const zh = getDictionary("zh-Hans") as unknown as PlannerText;
  const en = getDictionary("en") as unknown as PlannerText;
  const rainy = forecast(16, 3, { code: 61, rainChance: 70 });
  const gear = gearFor(rainy, plain);
  assert.equal(weatherSummary(rainy, zh), "雨 3° / 16°C（37° / 61°F） · 降水 70%");
  assert.deepEqual(gearText(gear, zh), { wear: "长袖加一件薄外套；早晚冷，多带一件外套", rain: "带伞" });
  assert.deepEqual(weatherSpeech(rainy, gear, zh), ["天气预报：雨，3 到 16 度", "穿衣：长袖加一件薄外套；早晚冷，多带一件外套；雨具：带伞"]);
  const speech = weatherSpeech(rainy, gear, en);
  assert.equal(speech[0], "Forecast: Rain, 37 to 61 degrees");
  assert.ok(speech.every((line) => !/[一-鿿]/u.test(line)), speech.join(" / "));
  assert.equal(gearText(gearFor(climate(-4, -15, 3), plain), zh).wear, "厚羽绒服、保暖内衣，帽子、手套、围巾");
});
