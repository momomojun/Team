import { activities } from "@/data/activities";
import { attractions } from "@/data/attractions";
import { parks, type Park } from "@/data/parks";
import type { Locale } from "@/i18n/config";
import { localizeActivity, localizePark } from "@/i18n/content";
import { attractionHref, parkPath } from "@/lib/park-page";
import { parkWeight } from "@/lib/park-popularity";

/** 一年里只有四个月以内能参加的算“限时”：错过了要等明年 */
export const LIMITED_MONTHS = 4;

/** 活动页的月份：1–12，或者 "all"（全年都有的） */
export type ActivityMonth = number | "all";

export const ACTIVITY_MONTHS: ActivityMonth[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, "all"];

export function parseActivityMonth(value: string): ActivityMonth | undefined {
  if (value === "all") return "all";
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined;
}

export interface ActivityCardData {
  /** 页面里的锚点（#activity-…） */
  id: string;
  park: string;
  parkName: string;
  region: Park["region"];
  nameZh: string;
  nameEn: string;
  months?: number[];
  limited: boolean;
  summary: string;
  booking?: string;
  status?: string;
  url?: string;
  /** 这座公园的“活动与开放”分页 */
  parkHref: string;
  /** 对应的景点（收录了才有） */
  attraction?: string;
  attractionHref?: string;
  /** 景点的照片，没有就用公园首图 */
  image?: string;
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * 某个月能参加的活动（"all" 是全年都有的），限时的排前面，同样限时的按公园热门程度排。
 * 活动数据见 src/data/activities.ts，公园页的“活动与开放”也用它
 */
export function activityCards(locale: Locale, month: ActivityMonth): ActivityCardData[] {
  const byCode = new Map(parks.map((park) => [park.code, park]));
  return activities
    .filter((activity) => (month === "all" ? !activity.months : activity.months?.includes(month)))
    .flatMap((raw) => {
      const park = byCode.get(raw.park);
      if (!park) return [];
      const activity = localizeActivity(raw, locale);
      const attraction = raw.attraction ? attractions.find((a) => a.id === raw.attraction) : undefined;
      const image = attraction?.photo?.url ?? attractions.find((a) => a.id === park.hero)?.photo?.url;
      return [
        {
          id: `${raw.park}-${slug(raw.nameEn)}`,
          park: park.code,
          parkName: localizePark(park, locale).nameZh,
          region: park.region,
          nameZh: activity.nameZh,
          nameEn: activity.nameEn,
          months: activity.months,
          limited: Boolean(activity.months && activity.months.length <= LIMITED_MONTHS),
          summary: activity.summary,
          booking: activity.booking,
          status: activity.status,
          url: activity.url,
          parkHref: parkPath(locale, park.code, "activities"),
          attraction: attraction?.id,
          attractionHref: attraction ? attractionHref(locale, park.code, attraction.id) : undefined,
          image,
        },
      ];
    })
    .sort((a, b) => Number(b.limited) - Number(a.limited) || parkWeight(b.park) - parkWeight(a.park));
}
