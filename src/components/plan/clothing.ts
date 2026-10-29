import { conditionOf, type DayWeather } from "./weather";

// 穿衣和雨具建议（10-28 仓库主人：行程里给出穿什么、要不要带伞）：按这一天的预报（16 天内）或往年同期（更远、只定了月份），
// 再看这天去什么：要徒步的下雨天带防水外套（步道上撑伞不方便），看日出、看星空的早晚多穿一层

/** 穿几层：按最高气温分（°C） */
export type Wear = "hot" | "warm" | "mild" | "cool" | "cold" | "frigid";
/** 雨具：带伞、带把折叠伞以防万一、带防水外套、雷雨（带雨衣，别撑伞）、下雪（防水的鞋和外套）、不用带 */
export type RainGear = "umbrella" | "maybe" | "jacket" | "storm" | "snow" | "none";

export interface Gear {
  wear: Wear;
  /** 早晚比白天冷很多（温差大，或者要赶日出、看星空）：多带一件外套 */
  layer: boolean;
  /** 热、晒：戴帽子、涂防晒 */
  sun: boolean;
  rain: RainGear;
}

/** 这天去的地方：有没有徒步、要不要赶日出、晚上要不要在外面（看星空、看完日落再走） */
export interface GearDay {
  hike: boolean;
  early: boolean;
  late: boolean;
}

const WEAR_FROM: [Wear, number][] = [
  ["hot", 30],
  ["warm", 22],
  ["mild", 14],
  ["cool", 6],
  ["cold", -2],
];
/** 最高气温到这么多度就按这一档穿（从热往冷找，都不到是 frigid） */
export function wearFor(high: number): Wear {
  return WEAR_FROM.find(([, from]) => high >= from)?.[0] ?? "frigid";
}

/** 白天和早晚差这么多度（°C）以上，早晚另外多穿一层 */
const SWING = 12;
/** 要赶日出、晚上在外面时，最低气温不到这么多度就多穿一层 */
const CHILLY = 10;
/** 风大到这么多（公里 / 小时）伞不好用，改带防水外套 */
const WINDY_KMH = 40;
/** 降水概率（%）：到这么多带伞，到 MAYBE 带把折叠伞以防万一 */
const RAIN_LIKELY = 60;
const RAIN_MAYBE = 30;

export function gearFor(weather: DayWeather, day: GearDay): Gear {
  const { high, low } = weather.kind === "forecast" ? weather.day : weather.climate;
  const wear = wearFor(high);
  const cold = wear === "cold" || wear === "frigid";
  const layer = !cold && (high - low >= SWING || ((day.early || day.late) && low <= CHILLY));
  const sun = wear === "hot";
  // 下雨的时候要徒步、或者风大：伞不好用，带防水外套
  const wet: RainGear = day.hike || (weather.kind === "forecast" && weather.day.windKmh >= WINDY_KMH) ? "jacket" : "umbrella";
  let rain: RainGear = "none";
  if (weather.kind === "forecast") {
    const condition = conditionOf(weather.day.code);
    const chance = weather.day.rainChance ?? 0;
    if (condition === "thunder") rain = "storm";
    else if (condition === "snow" || weather.day.snowCm >= 1) rain = "snow";
    else if (chance >= RAIN_LIKELY || condition === "rain" || condition === "showers") rain = wet;
    else if (chance >= RAIN_MAYBE || condition === "drizzle") rain = "maybe";
  } else {
    // 往年同期：一个月里有几天下雨（日降水 ≥ 1 毫米），换成随便哪天下雨的机会
    const chance = weather.climate.wetDays / 30;
    if (weather.climate.snowDays >= 4) rain = "snow";
    else if (chance >= 0.4) rain = wet;
    else if (chance >= 0.2) rain = "maybe";
  }
  return { wear, layer, sun, rain };
}

/** 从一天的行程看：有没有徒步、要不要赶日出、晚上在不在外面（日落以后才看的、看星空的） */
export function gearDayOf(view: { rows: { stop: { kind: string } }[]; timeline: { entries: { slot: string }[] } }): GearDay {
  return {
    hike: view.rows.some(({ stop }) => stop.kind === "hike"),
    early: view.timeline.entries.some((entry) => entry.slot === "sunrise"),
    late: view.timeline.entries.some((entry) => entry.slot === "sunset" || entry.slot === "night"),
  };
}
