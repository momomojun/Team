/** 某一天的细颗粒物（PM2.5）。山火烟雾抬高的通常是这个数，不是臭氧 */
export interface AirDay {
  /** 当地日期 "2026-10-19" */
  date: string;
  /** 美国空气质量指数，按 PM2.5，这一天的最高值 */
  pm25Aqi: number;
  /** PM2.5，微克 / 立方米，和指数同一小时 */
  pm25: number;
}

export interface AirCurrent {
  pm25Aqi: number;
  pm25: number;
}

export type AqiCategory = "good" | "moderate" | "sensitive" | "unhealthy" | "very" | "hazardous";

/** 美国空气质量指数的六档 */
export function aqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very";
  return "hazardous";
}
