import { parkDriveMinutes } from "./travel";

/**
 * 几座公园能不能排进同一趟：一路串起来，每一段要么是常一起玩的（parks.ts 的 nearby），要么两座公园的定位点之间
 * 开车一天能到（不超过 DAY_DRIVE_MIN）。比如死亡谷 → 红杉与国王峡谷约 6 小时、黄石 → 冰川约 6.5 小时，都算；
 * 锡安 → 优胜美地 9 小时多、要隔着内华达山脉，不算。行程页的“顺路一起玩”和 Copilot 的 plan_trip 都按这个判断
 */
export const DAY_DRIVE_MIN = 7 * 60;
/** 一趟最多几座公园（Copilot 契约的 parks 也按这个） */
export const MAX_TRIP_PARKS = 6;

export type NearbyOf = (code: string) => readonly string[];

/** 这两座公园能直接连起来：常一起玩的，或者开车一天能到 */
export function linked(a: string, b: string, nearbyOf: NearbyOf): boolean {
  if (nearbyOf(a).includes(b) || nearbyOf(b).includes(a)) return true;
  const minutes = parkDriveMinutes(a, b);
  return minutes !== null && minutes <= DAY_DRIVE_MIN;
}

/** 从第一座出发，一段一段连得到的公园（保持原来的顺序）；连不上的不在里面 */
export function reachable(codes: string[], nearbyOf: NearbyOf): string[] {
  if (codes.length === 0) return [];
  const reached = new Set([codes[0]]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const code of codes) {
      if (!reached.has(code) && [...reached].some((other) => linked(other, code, nearbyOf))) {
        reached.add(code);
        grew = true;
      }
    }
  }
  return codes.filter((code) => reached.has(code));
}

/** 这几座公园能不能排进同一趟 */
export function oneTrip(codes: string[], nearbyOf: NearbyOf): boolean {
  return reachable(codes, nearbyOf).length === codes.length;
}

/** 从已经选的这几座里最近的一座开过去要几分钟（定位点之间） */
export function driveFromTrip(code: string, selected: string[]): number | null {
  const minutes = selected.map((other) => parkDriveMinutes(other, code)).filter((m): m is number => m !== null);
  return minutes.length ? Math.min(...minutes) : null;
}
