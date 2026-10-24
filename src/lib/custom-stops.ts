import type { AttractionWithPhoto } from "../data/attractions";
import { fill, formatKm, formatMeters, type UnitText } from "../i18n/format";
import { registerTravelProxy } from "./travel";

/**
 * 网站没收录、从徒步页（AllTrails 热门步道）加进行程的步道。存在行程里（Trip.customStops），分享、导入时跟着走；
 * 排行程时当成一个徒步景点：停留按长度和爬升估，车程按同一座公园里离它最近的已收录景点（车程表里有）再补上直线距离
 */
export interface CustomStop {
  id: string;
  source: "alltrails";
  park: string;
  /** 园内片区：离它最近的已收录景点所在的片区 */
  area: string;
  name: string;
  lat: number;
  lon: number;
  lengthMi: number;
  gainFt: number;
  difficulty: "easy" | "moderate" | "hard";
  routeType: "out" | "loop" | "point";
  /** AllTrails 步道路径（拼在 https://www.alltrails.com/trail/ 后） */
  slug: string;
  rating?: number;
  reviews?: number;
  /** 估算的停留（分钟）：走路时间 + 休息拍照 */
  durationMin: number;
  /** 车程借用的已收录景点，和从那里到这条步道起点的分钟数 */
  anchor: string;
  anchorMin: number;
}

/** 走路时间的粗估：平地每小时 2 英里，每爬 1000 英尺多 1 小时（Naismith 规则的常见写法），再加 15 分钟休息、拍照；按 15 分钟取整，至少半小时 */
export function hikeMinutes(lengthMi: number, gainFt: number): number {
  const walk = (lengthMi / 2) * 60 + (gainFt / 1000) * 60 + 15;
  return Math.max(30, Math.round(walk / 15) * 15);
}

/** 从借用的景点开到这条步道起点：直线距离乘 1.35 的绕路系数，园区里的路按每小时 35 公里 */
const DETOUR = 1.35;
const PARK_KMH = 35;

const RAD = Math.PI / 180;
function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const h =
    Math.sin(((b.lat - a.lat) * RAD) / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(((b.lon - a.lon) * RAD) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export const driveMinutesKm = (km: number) => Math.round(((km * DETOUR) / PARK_KMH) * 60);

/** 行程里的编号：公园代码开头（车程、时区都按公园认），后面是 AllTrails 路径的最后一段 */
export function customStopId(park: string, slug: string): string {
  const tail = slug.split("/").pop() ?? slug;
  return `${park}-at-${tail.replace(/[^a-z0-9-]/gi, "").toLowerCase()}`;
}

export interface TrailInput {
  name: string;
  slug: string;
  lat: number;
  lon: number;
  lengthMi: number;
  gainFt: number;
  difficulty: "easy" | "moderate" | "hard";
  routeType: "out" | "loop" | "point";
  rating?: number;
  reviews?: number;
}

/** 把一条 AllTrails 步道做成能加进行程的一站；nearby 是同一座公园里已收录的景点（借车程、片区用），不能是空的 */
export function makeCustomStop(
  park: string,
  trail: TrailInput,
  nearby: { id: string; area: string; lat: number; lon: number; start?: { lat: number; lon: number } }[],
): CustomStop {
  let anchor = nearby[0];
  let best = Infinity;
  for (const stop of nearby) {
    const km = distanceKm(stop.start ?? stop, trail);
    if (km < best) {
      best = km;
      anchor = stop;
    }
  }
  return {
    id: customStopId(park, trail.slug),
    source: "alltrails",
    park,
    area: anchor.area,
    name: trail.name,
    lat: trail.lat,
    lon: trail.lon,
    lengthMi: trail.lengthMi,
    gainFt: trail.gainFt,
    difficulty: trail.difficulty,
    routeType: trail.routeType,
    slug: trail.slug,
    ...(trail.rating !== undefined ? { rating: trail.rating } : {}),
    ...(trail.reviews !== undefined ? { reviews: trail.reviews } : {}),
    durationMin: hikeMinutes(trail.lengthMi, trail.gainFt),
    anchor: anchor.id,
    anchorMin: driveMinutesKm(best),
  };
}

/** 行程里存的东西可能来自分享链接、导入的文件：字段不对的不要 */
export function isCustomStop(value: unknown): value is CustomStop {
  const v = value as Partial<CustomStop> | null;
  return (
    !!v &&
    v.source === "alltrails" &&
    typeof v.id === "string" &&
    typeof v.park === "string" &&
    v.id.startsWith(`${v.park}-at-`) &&
    typeof v.area === "string" &&
    typeof v.name === "string" &&
    [v.lat, v.lon, v.lengthMi, v.gainFt, v.durationMin, v.anchorMin].every((n) => typeof n === "number" && Number.isFinite(n)) &&
    (v.difficulty === "easy" || v.difficulty === "moderate" || v.difficulty === "hard") &&
    (v.routeType === "out" || v.routeType === "loop" || v.routeType === "point") &&
    typeof v.slug === "string" &&
    typeof v.anchor === "string"
  );
}

export interface CustomStopText {
  summary: string;
  tip: string;
}

/**
 * 排行程、显示用：做成一个徒步景点。车程借用 anchor（登记到 travel.ts，排顺序、选住处时按“借用的景点 + 补的分钟”算）。
 * 名字只有 AllTrails 的英文名；开放季节、许可证、带孩子老人行不行网站不知道，简介里写明，让用户自己查
 */
export function customStopAttraction(stop: CustomStop, text: CustomStopText, units: UnitText): AttractionWithPhoto {
  registerTravelProxy(stop.id, stop.anchor, stop.anchorMin, stop);
  return {
    id: stop.id,
    park: stop.park,
    nameZh: stop.name,
    nameEn: stop.name,
    kind: "hike",
    area: stop.area,
    lat: stop.lat,
    lon: stop.lon,
    durationMin: stop.durationMin,
    hike: { distanceMi: stop.lengthMi, gainFt: stop.gainFt, difficulty: stop.difficulty, loop: stop.routeType === "loop" },
    summary: fill(text.summary, {
      rating: stop.rating?.toFixed(1) ?? "—",
      reviews: stop.reviews?.toLocaleString("en-US") ?? "—",
      length: formatKm(stop.lengthMi, units),
      gain: formatMeters(stop.gainFt, units),
    }),
    tips: [text.tip],
    gallery: [],
    alltrails: {
      name: stop.name,
      slug: stop.slug,
      rating: stop.rating ?? 0,
      reviews: stop.reviews ?? 0,
      popularity: 0,
    },
  };
}
