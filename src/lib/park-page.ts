import { activities } from "@/data/activities";
import { getParkAttractions } from "@/data/attractions";
import { bookingRules } from "@/data/bookings";
import { celebrityShots } from "@/data/celebrities";
import { tempClosures } from "@/data/closures";
import { creatorRoutes, type CreatorRoute } from "@/data/creators";
import { filmSpots } from "@/data/film-spots";
import { lodgingOptions } from "@/data/lodging";
import { fullNameEn, getPark, isSite } from "@/data/parks";
import type { RoadYear } from "@/data/roads";
import { shuttleSystems } from "@/data/shuttles";
import { hasLocale, type Locale } from "@/i18n/config";
import { localizeActivity, localizeAttraction, localizeCelebrity, localizeFilm, localizePark } from "@/i18n/content";
import { localize } from "@/i18n/convert";
import { getDictionary } from "@/i18n/dictionaries";
import { fill, formatCount, formatMonths, formatWeekdays, otherName } from "@/i18n/format";
import { byPopularity } from "@/lib/popularity";
import { roadsOf } from "@/lib/roads";
import { parkVisits } from "@/lib/visits";

export const parkContainer = "mx-auto max-w-[1600px] px-5 sm:px-10";

export function parkPath(locale: string, code: string, section?: string) {
  const base = `/${locale}/parks/${code}`;
  return section ? `${base}/${section}` : base;
}

export function attractionHref(locale: string, code: string, id: string) {
  return `${parkPath(locale, code, "attractions")}#attraction-${id}`;
}

/** 公园各分页共用的数据。纯内存整理，布局和页面各调一次 */
export function loadParkPage(locale: string, code: string) {
  if (!hasLocale(locale)) return null;
  const source = getPark(code);
  if (!source) return null;
  const park = localizePark(source, locale);
  const dict = getDictionary(locale);
  const t = dict.park;
  const attractions = getParkAttractions(park.code).map((a) => localizeAttraction(a, locale));
  const heroPhoto = attractions.find((a) => a.id === park.hero)?.photo;
  const parkActivities = activities.filter((a) => a.park === park.code).map((a) => localizeActivity(a, locale));
  const parkRoads = roadsOf(park.code).map((road) => ({
    ...road,
    nameZh: localize(road.nameZh, locale),
    noteZh: localize(road.noteZh, locale),
    years: road.years.map(([year, open, close, skip]): RoadYear =>
      skip ? [year, open, close, localize(skip, locale)] : [year, open, close],
    ),
  }));
  const visits = parkVisits(park.code);
  const highlights = attractions
    .filter((a) => a.photo && a.kind !== "visitor" && a.id !== park.hero)
    .map((a, i) => ({ a, i }))
    .sort(
      // 和景点页“按热度”一样：景点看 Google、步道看 AllTrails，名次交替（lib/popularity.ts）
      (x, y) => byPopularity(x.a, y.a) || x.i - y.i,
    )
    .slice(0, 5)
    .map(({ a }) => a);
  const today = new Date().toISOString().slice(0, 10);
  const parkClosures = tempClosures
    .filter((closure) => closure.attractions.some((id) => attractions.some((a) => a.id === id)))
    .filter((closure) => !closure.reopen || closure.reopen > today)
    .map((closure) => ({
      ids: closure.attractions.filter((id) => attractions.some((a) => a.id === id)),
      reason: localize(closure.reasonZh, locale),
      reopen: closure.reopen,
      checked: closure.checked,
      ...(closure.weekdays ? { weekdays: formatWeekdays(closure.weekdays, dict.units), from: closure.from } : {}),
    }));
  const hasSeasonInfo =
    parkActivities.length > 0 ||
    attractions.some((a) => a.openMonths) ||
    parkClosures.length > 0 ||
    parkRoads.length > 0 ||
    visits !== null;
  const targetName = (id: string) =>
    attractions.find((a) => a.id === id)?.nameZh ?? localize(lodgingOptions.find((l) => l.id === id)?.nameZh ?? id, locale);
  const parkBookings = bookingRules
    .filter((rule) => rule.park === park.code)
    .map((rule) => ({
      ...rule,
      titleZh: localize(rule.titleZh, locale),
      noteZh: localize(rule.noteZh, locale),
      ...(rule.places?.length
        ? { places: [...rule.targets.map(targetName), ...rule.places.map((place) => localize(place, locale))] }
        : {}),
    }));
  const parkShuttles = shuttleSystems
    .filter((system) => system.park === park.code)
    .map((system) => ({
      ...system,
      nameZh: localize(system.nameZh, locale),
      offSeasonZh: system.offSeasonZh && localize(system.offSeasonZh, locale),
      noteZh: system.noteZh && localize(system.noteZh, locale),
      hub: {
        ...system.hub,
        nameZh: localize(system.hub.nameZh, locale),
        parkingZh: system.hub.parkingZh && localize(system.hub.parkingZh, locale),
      },
    }));
  const parkParking = attractions
    .filter((a) => a.parking)
    .reduce<{ id: string; nameZh: string; rule: NonNullable<(typeof attractions)[number]["parking"]> }[]>((rows, a) => {
      const same = rows.find((row) => a.parking!.lot && row.rule.lot === a.parking!.lot);
      if (same) same.nameZh += `${dict.units.listSep}${a.nameZh}`;
      else rows.push({ id: a.id, nameZh: a.nameZh, rule: a.parking! });
      return rows;
    }, []);
  const hasBookings = parkBookings.length > 0 || parkShuttles.length > 0 || parkParking.length > 0;
  const site = isSite(park);
  const canada = park.country === "CA";
  const facts: [string, string][] = [
    [t.bestSeason, formatMonths(park.bestMonths, dict.units)],
    [t.airports, park.airports.join(" · ")],
    site || canada ? [t.agency, park.agency ?? ""] : [t.surcharge, park.nonresidentSurcharge ? t.surchargeValue : t.noSurcharge],
    [t.highlights, fill(t.highlightsValue, { n: attractions.length })],
  ];
  const parkCelebs = celebrityShots
    .filter((shot) => shot.park === park.code)
    .map((shot) => localizeCelebrity(shot, locale))
    .sort((a, b) => Number(!a.attraction) - Number(!b.attraction) || b.date.localeCompare(a.date));
  const parkFilms = filmSpots
    .filter((shot) => shot.park === park.code)
    .map((shot) => localizeFilm(shot, locale))
    .sort((a, b) => Number(!a.attraction) - Number(!b.attraction) || b.year - a.year);
  const parkCreators = creatorRoutes
    .filter((route) => route.parks.includes(park.code))
    .sort((a, b) => b.views - a.views);
  const byDetail = [
    ...parkCreators.filter((route) => route.basis !== "metadata"),
    ...parkCreators.filter((route) => route.basis === "metadata"),
  ];
  const firstOfLanguage = byDetail.filter(
    (route, i) => byDetail.findIndex((r) => r.language === route.language) === i && route.basis !== "metadata",
  );
  const featuredCreators = [
    ...firstOfLanguage.filter((route) => route.language === "zh"),
    ...firstOfLanguage.filter((route) => route.language !== "zh"),
    ...byDetail.filter((route) => !firstOfLanguage.includes(route)),
  ].slice(0, 4);
  const r = dict.routes;
  const viewsText = (route: CreatorRoute) => {
    const article = route.format === "article";
    return route.views >= 10000
      ? fill(article ? r.readsWan : r.viewsWan, { n: (route.views / 10000).toFixed(1), full: formatCount(route.views) })
      : fill(article ? r.reads : r.views, { n: route.views });
  };
  const localizedName = localize(source.nameZh, locale);
  const englishTitle = fullNameEn(source);
  const title = otherName(localizedName, source.nameEn) ? `${localizedName} ${source.nameEn}` : englishTitle;

  return {
    locale: locale as Locale,
    code,
    park,
    dict,
    t,
    r,
    attractions,
    heroPhoto,
    parkActivities,
    parkRoads,
    visits,
    highlights,
    parkClosures,
    hasSeasonInfo,
    parkBookings,
    parkShuttles,
    parkParking,
    hasBookings,
    site,
    canada,
    facts,
    parkCelebs,
    parkFilms,
    parkCreators,
    featuredCreators,
    viewsText,
    title,
  };
}
