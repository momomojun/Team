// 行程质量评测（npm run eval:quality）和 VROOM 裁判（npm run eval:referee）10-28 查出来、修好的几条：
// 用评测同一组请求里的那几条，断言修好的样子，免得以后改引擎又回去
import assert from "node:assert/strict";
import { test } from "node:test";
import { REFERENCE_DATE, requests } from "../scripts/plan-quality-lib.mjs";
import { planTrip } from "../src/lib/copilot/plan-tool";

const plan = (id: string) => {
  const found = requests().find((item: { id: string }) => item.id === id);
  assert.ok(found, `评测请求里没有 ${id}`);
  return planTrip(found.request, { referenceDate: REFERENCE_DATE });
};
const minutes = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
const overloaded = (result: ReturnType<typeof planTrip>) => result.days.filter((day) => day.warnings.includes("overloaded")).map((day) => day.day);

test("点名要去的看星空：看完晚点回住处不算太晚，不再说“没时间”（奇里卡瓦）", () => {
  const result = plan("chir");
  const day = result.days.find((d) => d.stops.some((stop) => stop.id === "chir-night-sky"));
  assert.ok(day, "Massai Point 看星空应该排进去");
  assert.equal(day.stops.at(-1)?.id, "chir-night-sky", "看星空是那天最后一站");
});

test("跨时区的两座公园：按当天去的公园的时区排，航海家 Kettle Falls 游船赶得上 10 点那班", () => {
  const result = plan("isro+voya");
  const kettle = result.days.flatMap((day) => day.stops).find((stop) => stop.id === "voya-kettle-falls");
  assert.ok(kettle, "Kettle Falls 应该在行程里");
  assert.ok(!kettle.warnings.includes("missDeparture"), `Kettle Falls ${kettle.start} 到，赶不上船`);
  // 皇家岛的渡轮一日游不排在刚落地那天（第二天空着）
  assert.ok(!result.days[0].stops.some((stop) => stop.id === "isro-rock-harbor-day-trip"));
  assert.deepEqual(overloaded(result), []);
});

test("一整天的巴士、小飞机不排在开很远过去的那天；换公园那天不塞到天黑", () => {
  const denali = plan("dena+kefj");
  assert.ok(
    denali.days.some((day) => day.day > 1 && day.stops.some((stop) => stop.id === "dena-bus")),
    "德纳里公园路巴士换到第 2 天，不是去掉",
  );
  for (const id of ["dena+kefj", "katm+lacl", "grsm+shen"]) assert.deepEqual(overloaded(plan(id)), [], `${id} 有太满的天`);
});

test("三个入口园内不通的公园不两天都从同一个住处往同一边跑（大沼泽地，VROOM 当裁判查出来的）", () => {
  const result = plan("ever");
  const drive = result.days.reduce((sum, day) => sum + day.driveMin, 0);
  // 修之前三天一共开 972 分钟（两晚都住东边的 Homestead，第 1、2 天都开去西边的 Tamiami Trail 和 Gulf Coast）
  assert.ok(drive < 850, `三天开车 ${drive} 分钟`);
});

test("只写了下午最好的景点挪到下午能去的那天（黄石大棱镜温泉观景台）", () => {
  const overlook = plan("yell")
    .days.flatMap((day) => day.stops)
    .find((stop) => stop.id === "yell-grand-prismatic-overlook");
  assert.ok(overlook);
  assert.ok(minutes(overlook.start) >= 12 * 60, `大棱镜温泉观景台 ${overlook.start} 到`);
});
