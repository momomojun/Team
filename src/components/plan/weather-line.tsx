import type { ComponentType, SVGProps } from "react";
import {
  IconCloud,
  IconCloudSun,
  IconFog,
  IconRain,
  IconSnow,
  IconSun,
  IconThunder,
} from "@/components/icons";
import { fill } from "@/i18n/format";
import type { PlannerText } from "./types";
import type { Gear } from "./clothing";
import { degrees, gearText } from "./weather-text";
import { climateWarnings, conditionOf, fahrenheit, forecastWarnings, type Condition, type DayWeather } from "./weather";


const ICONS: Record<Condition, ComponentType<SVGProps<SVGSVGElement>>> = {
  clear: IconSun,
  partly: IconCloudSun,
  cloudy: IconCloud,
  fog: IconFog,
  drizzle: IconRain,
  rain: IconRain,
  showers: IconRain,
  snow: IconSnow,
  thunder: IconThunder,
};

/** 一行天气：预报是“晴 · 3–18°C（37–64°F）· 降水 20%”，往年同期是“往年 10 月 −2–16°C · 约 4 天有雨雪” */
export function WeatherLine({ weather, text }: { weather: DayWeather; text: PlannerText }) {
  const t = text.plan.weather;
  if (weather.kind === "forecast") {
    const { day } = weather;
    const condition = conditionOf(day.code);
    const Icon = ICONS[condition];
    return (
      <span className="inline-flex items-center gap-1.5" title={t.forecastSource}>
        <Icon className="text-sm" />
        {fill(t.forecast, {
          condition: t.conditions[condition],
          low: degrees(day.low),
          high: degrees(day.high),
          lowF: degrees(fahrenheit(day.low)),
          highF: degrees(fahrenheit(day.high)),
        })}
        {day.rainChance !== null && day.rainChance >= 20 && <span>· {fill(t.rainChance, { p: day.rainChance })}</span>}
      </span>
    );
  }
  const { climate, month } = weather;
  const low = Math.round(climate.low);
  const high = Math.round(climate.high);
  return (
    <span className="inline-flex items-center gap-1.5" title={t.climateSource}>
      <IconCloudSun className="text-sm" />
      {fill(t.climate, {
        m: month,
        low: degrees(low),
        high: degrees(high),
        lowF: degrees(fahrenheit(low)),
        highF: degrees(fahrenheit(high)),
      })}
      {climate.wetDays >= 1 && <span>· {fill(t.wetDays, { n: Math.round(climate.wetDays) })}</span>}
    </span>
  );
}

/** 这天天气要提醒的事：预报 / 往年同期的高温、雷暴、下雪……，再加上 NWS 的气象预警 */
export function weatherNotes(weather: DayWeather, text: PlannerText): string[] {
  const t = text.plan.weather;
  if (weather.kind === "forecast") {
    const notes = forecastWarnings(weather.day).map((warning) => fill(t.warnings[warning], { low: degrees(weather.day.low), lowF: degrees(fahrenheit(weather.day.low)) }));
    if (weather.air && weather.air.pm25Aqi >= 101) {
      notes.push(fill(t.warnings.smoke, { n: weather.air.pm25Aqi }));
    }
    for (const alert of weather.alerts) {
      const name = t.nwsEvents[alert.event];
      notes.push(fill(t.nws, { event: name && name !== alert.event ? `${name}${fill(text.units.paren, { x: alert.event })}` : alert.event }));
    }
    return notes;
  }
  return climateWarnings(weather.climate).map((warning) =>
    fill(t.climateWarnings[warning], {
      low: degrees(Math.round(weather.climate.low)),
      lowF: degrees(fahrenheit(weather.climate.low)),
      n: Math.round(weather.climate.wetDays),
    }),
  );
}

/** 穿衣、雨具一行（行程每天的卡片上，天气下面） */
export function GearLine({ gear, text }: { gear: Gear; text: PlannerText }) {
  const g = text.plan.weather.gear;
  const { wear, rain } = gearText(gear, text);
  return (
    <span className="lining-nums">
      <span className="text-mute">{g.wearLabel}</span> {wear}
      <span className="mx-1.5 text-ink/25">·</span>
      <span className="text-mute">{g.rainLabel}</span> {rain}
    </span>
  );
}
