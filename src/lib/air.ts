import "server-only";
import type { AirCurrent, AirDay } from "./air-types";
import { fetchJson } from "./fetch-json";

// 空气质量：Open-Meteo（哥白尼 CAMS，不要 key）。美国官方当前数值是 AirNow，这里没接那把 key。
const AIR = "https://air-quality-api.open-meteo.com/v1/air-quality";

interface AirRow {
  current?: { us_aqi_pm2_5?: number | null; pm2_5?: number | null };
  hourly?: {
    time: string[];
    us_aqi_pm2_5: (number | null)[];
    pm2_5: (number | null)[];
  };
}

function dailyMax(row: AirRow | undefined): AirDay[] | null {
  const hourly = row?.hourly;
  if (!hourly) return null;
  const byDate = new Map<string, AirDay>();
  hourly.time.forEach((stamp, index) => {
    const aqi = hourly.us_aqi_pm2_5[index];
    if (typeof aqi !== "number") return;
    const date = stamp.slice(0, 10);
    const pm = hourly.pm2_5[index];
    const prev = byDate.get(date);
    if (prev && aqi <= prev.pm25Aqi) return;
    byDate.set(date, {
      date,
      pm25Aqi: Math.round(aqi),
      pm25: typeof pm === "number" ? Math.round(pm) : (prev?.pm25 ?? 0),
    });
  });
  const days = [...byDate.values()];
  return days.length > 0 ? days : null;
}

function currentOf(row: AirRow | undefined): AirCurrent | null {
  const current = row?.current;
  const aqi = current?.us_aqi_pm2_5;
  if (!current || typeof aqi !== "number") return null;
  const pm = current.pm2_5;
  return { pm25Aqi: Math.round(aqi), pm25: typeof pm === "number" ? Math.round(pm) : 0 };
}

async function fetchAir(points: { lat: number; lon: number }[]): Promise<AirRow[]> {
  const params = new URLSearchParams({
    latitude: points.map((point) => point.lat.toFixed(3)).join(","),
    longitude: points.map((point) => point.lon.toFixed(3)).join(","),
    current: "us_aqi_pm2_5,pm2_5",
    hourly: "us_aqi_pm2_5,pm2_5",
    timezone: "auto",
    forecast_days: "5",
  });
  const data = await fetchJson<AirRow | AirRow[]>(`${AIR}?${params}`, { revalidate: 60 * 60 });
  return Array.isArray(data) ? data : [data];
}

/** 每个地点未来几天、按天的 PM2.5 最高指数。查不到的是 null */
export async function getAirDays(points: { lat: number; lon: number }[]): Promise<(AirDay[] | null)[]> {
  if (points.length === 0) return [];
  const rows = await fetchAir(points);
  return points.map((_, index) => dailyMax(rows[index]));
}

/** 公园门口现在的 PM2.5。查不到是 null */
export async function getAirCurrent(point: { lat: number; lon: number }): Promise<AirCurrent | null> {
  const rows = await fetchAir([point]);
  return currentOf(rows[0]);
}
