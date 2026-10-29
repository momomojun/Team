import { fill } from "@/i18n/format";
import type { Gear } from "./clothing";
import type { PlannerText } from "./types";
import { conditionOf, fahrenheit, type DayWeather } from "./weather";

// 天气和穿衣建议的纯文字（不带图标）：行程卡片上那一行、路线动画旁边的天气卡片、讲解版念的都用这里的

/** 负温度用减号（−），不用连字符 */
export const degrees = (value: number) => (value < 0 ? `−${Math.abs(value)}` : String(value));

/** 一行天气的纯文字（路线动画旁边的天气卡片用，和 WeatherLine 写的一样） */
export function weatherSummary(weather: DayWeather, text: PlannerText): string {
  const t = text.plan.weather;
  if (weather.kind === "forecast") {
    const { day } = weather;
    const line = fill(t.forecast, {
      condition: t.conditions[conditionOf(day.code)],
      low: degrees(day.low),
      high: degrees(day.high),
      lowF: degrees(fahrenheit(day.low)),
      highF: degrees(fahrenheit(day.high)),
    });
    return day.rainChance !== null && day.rainChance >= 20 ? `${line} · ${fill(t.rainChance, { p: day.rainChance })}` : line;
  }
  const { climate, month } = weather;
  const low = Math.round(climate.low);
  const high = Math.round(climate.high);
  const line = fill(t.climate, { m: month, low: degrees(low), high: degrees(high), lowF: degrees(fahrenheit(low)), highF: degrees(fahrenheit(high)) });
  return climate.wetDays >= 1 ? `${line} · ${fill(t.wetDays, { n: Math.round(climate.wetDays) })}` : line;
}

/** 穿衣、雨具建议的字：穿衣是“长袖加一件薄外套；早晚冷，多带一件外套”，雨具是“带伞” */
export function gearText(gear: Gear, text: PlannerText): { wear: string; rain: string } {
  const g = text.plan.weather.gear;
  const wear = [g.wear[gear.wear], gear.layer ? g.layer : null, gear.sun ? g.sun : null].filter((part) => part !== null).join(text.units.clauseSep);
  return { wear, rain: g.rain[gear.rain] };
}

/** 讲解版每天开头念的天气和穿衣（念出来的不写 °、括号里的华氏度） */
export function weatherSpeech(weather: DayWeather, gear: Gear, text: PlannerText): string[] {
  const g = text.plan.weather.gear;
  const { high, low } = weather.kind === "forecast" ? weather.day : weather.climate;
  const temps = { low: Math.round(low), high: Math.round(high), lowF: fahrenheit(Math.round(low)), highF: fahrenheit(Math.round(high)) };
  const first =
    weather.kind === "forecast"
      ? fill(g.speakForecast, { ...temps, condition: text.plan.weather.conditions[conditionOf(weather.day.code)] })
      : fill(g.speakClimate, temps);
  const { wear, rain } = gearText(gear, text);
  return [first, fill(g.speakGear, { wear, rain })];
}
