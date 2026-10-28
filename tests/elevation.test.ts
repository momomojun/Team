import assert from "node:assert/strict";
import { test } from "node:test";
import { cumulative } from "../src/components/map/route-tour";
import { profiles } from "../src/data/attractions/elevation.generated";
import { trails } from "../src/data/attractions/trails.generated";
import { climb, elevationAt, smoothElevations, totalClimb, trailGpx } from "../src/lib/elevation";

test("海拔剖面：中位数去掉高程模型的尖刺，阈值以下的小起伏不算爬升", () => {
  // 一路平缓上坡，中间一个点落到崖顶（多出 80 米）
  const raw = [100, 102, 104, 106, 186, 110, 112, 114, 116];
  const smooth = smoothElevations(raw);
  assert.ok(Math.max(...smooth) < 120, "尖刺应该被去掉");
  assert.equal(climb(smooth).gain, 16);
  assert.equal(climb(smooth).loss, 0);
  // 1 米上下的抖动不算
  assert.deepEqual(climb([100, 101, 100, 101, 100, 101]), { gain: 0, loss: 0 });
  // 往返原路回来：回程的爬升就是去程的下降
  assert.equal(totalClimb({ gain: 300, loss: 40 }, false), 340);
  assert.equal(totalClimb({ gain: 300, loss: 40 }, true), 300);
});

test("海拔剖面：取样点之间按直线插值，最后一段可能比取样间隔短", () => {
  const profile = { step: 100, meters: 250, ele: [1000, 1010, 1030, 1040], gain: 40, loss: 0, min: 1000, max: 1040 };
  const ele = profile.ele;
  assert.equal(elevationAt(profile, 0, ele), 1000);
  assert.equal(elevationAt(profile, 50, ele), 1005);
  assert.equal(elevationAt(profile, 225, ele), 1035);
  assert.equal(elevationAt(profile, 999, ele), 1040);
});

test("GPX：每个路线点都有海拔，名字里的特殊字符转义，写明 OpenStreetMap 的授权", () => {
  const path: [number, number][] = [
    [-112.95, 37.25],
    [-112.951, 37.251],
    [-112.952, 37.252],
  ];
  const gpx = trailGpx({
    name: "Angels Landing & <Scout>",
    path,
    profile: { step: 100, meters: 280, ele: [1300, 1350, 1400], gain: 100, loss: 0, min: 1300, max: 1400 },
    note: "单程，原路返回",
  });
  assert.equal((gpx.match(/<trkpt /g) ?? []).length, 3);
  assert.equal((gpx.match(/<ele>/g) ?? []).length, 3);
  assert.match(gpx, /Angels Landing &amp; &lt;Scout&gt;/);
  assert.match(gpx, /opendatacommons\.org\/licenses\/odbl/);
  assert.match(gpx, /<trkpt lat="37\.250000" lon="-112\.950000"><ele>1300\.0<\/ele>/);
  // 终点的海拔落在剖面的终点
  assert.match(gpx, /<trkpt lat="37\.252000" lon="-112\.952000"><ele>1400\.0<\/ele>/);
  // 没有海拔时只写路线
  assert.doesNotMatch(trailGpx({ name: "x", path }), /<ele>/);
});

test("海拔数据：每条步道都有，长度和地图上画的路线对得上，海拔在合理范围", () => {
  for (const [id, trail] of Object.entries(trails)) {
    const profile = profiles[id];
    assert.ok(profile, `${id} 没有海拔剖面（npm run data:elevation）`);
    assert.ok(profile.ele.length >= 2, id);
    // 剖面是沿着存下来的路线（简化过的点）量的，和 trail.km（Valhalla 算路线时的长度）不一定一样
    const drawn = cumulative(trail.path).at(-1)! * 1000;
    if (drawn < 200) continue;
    assert.ok(Math.abs(profile.meters / drawn - 1) < 0.05, `${id}：剖面 ${profile.meters} 米，路线 ${Math.round(drawn)} 米`);
    // 死亡谷的恶水盆地在海平面以下 86 米；北美最高的步道也不到 4,500 米
    assert.ok(profile.min > -100 && profile.max < 4500, `${id}：${profile.min}–${profile.max} 米`);
  }
});
