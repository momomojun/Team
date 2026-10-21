// OSRM 对个别砂石路估得太慢，进出这些景点的车程按这里减掉的分钟数修正。
// 车程表（scripts/build-travel.mjs）和浏览器里现查的车程（自定义住处、自动生成攻略的出发地）都用这张表。
export const routeFixes: Record<string, number> = {
  // Cascade River Road 约 37 公里（后半段砂石路），OSRM 按约 13 km/h 算要 174 分钟，实际约 1 小时 20 分
  "noca-cascade-pass": 90,
  // 马蹄峡谷西缘步道口：最后约 50 公里是平整的砂石路，OSRM 从 Green River 算要 573 分钟，实际约 1 小时 40 分
  "cany-horseshoe-canyon": 473,
  // Grand Wash 土路尽头（卡西迪拱门步道口）：从游客中心约 8 公里，OSRM 算 38 分钟，实际约 15–20 分钟
  "care-cassidy-arch": 20,
  // 鲍曼湖：从 West Glacier 经 Camas Road 和砂石路 Outside North Fork Road，OSRM 算约 2 小时 50 分，实际约 1.5–2 小时
  "glac-bowman-lake": 60,
  // 奇里卡瓦山上的几个步道口（见下面的 routeAt）：OSRM 只算到 Bonita Canyon Drive 缺的那段路口（离游客中心约 0.5 英里），
  // 再往上约 5–6 英里盘山路，实际从游客中心开上去 15–20 分钟、到 Natural Bridge 约 8 分钟，负数是加上这么多分钟
  "chir-natural-bridge": -6,
  "chir-massai-point": -15,
  "chir-echo-canyon-loop": -14,
  "chir-heart-of-rocks": -14,
  "chir-sugarloaf": -13,
  "chir-night-sky": -15,
};

/**
 * OSRM 的路网缺了一段路、会把出发点吸到别处的景点：算车程时改用这里的点（导航照旧用景点的 start），再按上面的 routeFixes 补上缺的那段。
 * 奇里卡瓦：OSRM 里的 Bonita Canyon Drive 只到游客中心往上约 0.5 英里，山上的停车场会被吸到 30 英里外公园东边的土路上
 */
const CHIR_ROAD_END = { lat: 32.0121, lon: -109.3541 };
export const routeAt: Record<string, { lat: number; lon: number }> = {
  "chir-natural-bridge": CHIR_ROAD_END,
  "chir-massai-point": CHIR_ROAD_END,
  "chir-echo-canyon-loop": CHIR_ROAD_END,
  "chir-heart-of-rocks": CHIR_ROAD_END,
  "chir-sugarloaf": CHIR_ROAD_END,
  "chir-night-sky": CHIR_ROAD_END,
};

/** 同一条缺了的路上的几个点之间：OSRM 算出来是 0，按这里的分钟数算（山上几个停车场之间开几分钟） */
const SAME_ROAD: { stops: string[]; minutes: number }[] = [
  {
    stops: ["chir-natural-bridge", "chir-massai-point", "chir-echo-canyon-loop", "chir-heart-of-rocks", "chir-sugarloaf", "chir-night-sky"],
    minutes: 8,
  },
];

/** 修正后的车程：不低于 5 分钟 */
export function fixedMinutes(minutes: number, ...stopIds: string[]): number {
  const road = stopIds.length === 2 ? SAME_ROAD.find((group) => stopIds.every((id) => group.stops.includes(id))) : undefined;
  if (road) return road.minutes;
  const fix = stopIds.reduce((sum, id) => sum + (routeFixes[id] ?? 0), 0);
  return fix ? Math.max(5, minutes - fix) : minutes;
}
