import { darkSky, honorsChecked, mediaPicks, usNewsBest, worldHeritage } from "@/data/honors";
import { canadianParks, nationalParks, pendingPark } from "@/data/national-parks";
import { canadaSourceUrl, systemVisits, visitsLastYear } from "@/data/visits.generated";
import { hasLocale } from "@/i18n/config";
import { localize } from "@/i18n/convert";
import { getDictionary } from "@/i18n/dictionaries";
import { fill, formatBig } from "@/i18n/format";
import { parkVisits, visitRanking } from "@/lib/visits";

/** 榜单各页共用的统计、名单和文案 */
export function loadRankingsPage(locale: string) {
  if (!hasLocale(locale)) return null;
  const dict = getDictionary(locale);
  const t = dict.rankings;
  const text = (value: string) => localize(value, locale);

  const ranking = visitRanking();
  const total = nationalParks.length;
  const oursUnits = nationalParks.filter((park) => park.page).length;
  const parksVisits = ranking.reduce((sum, park) => sum + park.visits, 0);
  const first = nationalParks[0];
  const latest = nationalParks.at(-1)!;
  const dateOf = (iso: string) =>
    fill(t.timeline.date, { y: iso.slice(0, 4), m: Number(iso.slice(5, 7)), d: Number(iso.slice(8, 10)) });

  const stats: [string, string, string][] = [
    [t.stats.parks, fill(t.stats.parksValue, { n: total }), fill(t.stats.parksNote, { n: oursUnits })],
    [t.stats.first, fill(t.stats.year, { year: first.established.slice(0, 4) }), fill(t.stats.firstNote, { name: text(first.nameZh) })],
    [t.stats.latest, fill(t.stats.year, { year: latest.established.slice(0, 4) }), fill(t.stats.latestNote, { name: text(latest.nameZh) })],
    [
      fill(t.stats.visits, { year: visitsLastYear }),
      formatBig(parksVisits, dict.units),
      fill(t.stats.visitsNote, {
        n: total,
        total: formatBig(systemVisits, dict.units),
        share: Math.round((parksVisits / systemVisits) * 100),
      }),
    ],
  ];

  const canada = canadianParks.map((park) => ({ ...park, visits: parkVisits(park.code) }));
  const names = Object.fromEntries([
    ...nationalParks.map((park) => [park.code, { nameZh: text(park.nameZh), ...(park.page ? { page: park.page } : {}) }]),
    ...canadianParks.map((park) => [park.code, { nameZh: text(park.nameZh), page: park.code }]),
  ]);
  const best = usNewsBest;
  const usNews = best && {
    ...best,
    parks: nationalParks.map((park) => park.code).filter((code) => best.parks.includes(code)),
  };
  const hasPicks = mediaPicks.length > 0 || usNews !== undefined;
  const hasHonors = Object.keys(worldHeritage).length > 0 || Object.keys(darkSky).length > 0;

  return {
    locale,
    dict,
    t,
    text,
    total,
    oursUnits,
    latest,
    dateOf,
    stats,
    ranking,
    canada,
    names,
    usNews,
    checked: dateOf(honorsChecked),
    hasPicks,
    hasHonors,
    pendingPark,
    canadaSourceUrl,
    visitsLastYear,
    nationalParks,
    canadianParks,
    mediaPicks,
    worldHeritage,
    darkSky,
  };
}
