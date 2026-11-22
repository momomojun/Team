import { attractions } from "@/data/attractions";
import type { Hazard } from "@/data/attractions/types";
import { parkSafetyPages, safetyHazards, type SafetyHazard } from "@/data/safety";
import type { Locale } from "@/i18n/config";
import { localize } from "@/i18n/convert";

/** 页面上显示的一条危险：按语言选好了字（繁体由简体转换） */
export interface SafetyCard {
  id: string;
  title: string;
  what: string;
  prevent: string[];
  ifHappens: string[];
  /** 这座公园具体在哪、为什么（公园页才有） */
  here?: string;
  incidents: { date: string; park: string; summary: string; url: string; news?: boolean }[];
  sources: { title: string; url: string }[];
  /** 官方资料提到有这种危险的公园 */
  parks: string[];
}

const text = (zh: string, en: string, locale: Locale) => (locale === "en" ? en : localize(zh, locale));

export function safetyCard(hazard: SafetyHazard, locale: Locale, park?: string): SafetyCard {
  const here = park ? hazard.parks[park] : undefined;
  return {
    id: hazard.id,
    title: text(hazard.titleZh, hazard.titleEn, locale),
    what: text(hazard.whatZh, hazard.whatEn, locale),
    prevent: locale === "en" ? hazard.preventEn : hazard.preventZh.map((line) => localize(line, locale)),
    ifHappens: locale === "en" ? hazard.ifEn : hazard.ifZh.map((line) => localize(line, locale)),
    ...(here ? { here: text(here.zh, here.en, locale) } : {}),
    incidents: hazard.incidents
      .filter((incident) => !park || incident.park === park)
      .map((incident) => ({ date: incident.date, park: incident.park, summary: text(incident.summaryZh, incident.summaryEn, locale), url: incident.url, news: incident.news })),
    sources: hazard.sources,
    parks: Object.keys(hazard.parks),
  };
}

/** 全部危险（/safety 页） */
export function allSafetyCards(locale: Locale): SafetyCard[] {
  return safetyHazards.map((hazard) => safetyCard(hazard, locale));
}

/** 这座公园官方资料提到的危险（公园页的“安全”） */
export function parkSafetyCards(park: string, locale: Locale): SafetyCard[] {
  return safetyHazards.filter((hazard) => hazard.parks[park]).map((hazard) => safetyCard(hazard, locale, park));
}

export const officialSafetyPage = (park: string): string | undefined => parkSafetyPages[park];

/** 景点上标的危险（同行适合度里整理的，src/data/suitability/）：按危险分组，列出这座公园哪些景点有、为什么 */
export function attractionHazards(park: string): { hazard: Hazard; stops: { id: string; nameZh: string; note?: string }[] }[] {
  const groups = new Map<Hazard, { id: string; nameZh: string; note?: string }[]>();
  for (const attraction of attractions) {
    if (attraction.park !== park) continue;
    for (const hazard of attraction.family?.hazards ?? []) {
      groups.set(hazard, [...(groups.get(hazard) ?? []), { id: attraction.id, nameZh: attraction.nameZh, note: attraction.family?.noteZh }]);
    }
  }
  const ORDER: Hazard[] = ["dropoff", "scramble", "flashFlood", "water", "thermal", "heat", "altitude", "wildlife", "remote", "motion"];
  return ORDER.filter((hazard) => groups.has(hazard)).map((hazard) => ({ hazard, stops: groups.get(hazard)! }));
}
