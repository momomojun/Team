import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CelebritySpots } from "@/components/routes/celebrity-spots";
import { CreatorRoutes } from "@/components/routes/creator-routes";
import { RoutesTabs } from "@/components/routes/routes-tabs";
import { attractions } from "@/data/attractions";
import { celebrityShots } from "@/data/celebrities";
import { filmSpots } from "@/data/film-spots";
import { creatorRoutes, creatorsUpdated, type CreatorRoute } from "@/data/creators";
import { parks } from "@/data/parks";
import { hasLocale, type Locale } from "@/i18n/config";
import { localizeCelebrity, localizeFilm } from "@/i18n/content";
import { localize } from "@/i18n/convert";
import { getDictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";
import { headerPhoto } from "@/components/site/header-photo";
import { PageHeader } from "@/components/site/page-header";

export async function generateMetadata({ params }: PageProps<"/[locale]/routes">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).routes.title };
}

/** 博主内容用简体转述，繁体页面转换；视频标题是博主原文，不动 */
function localizeRoute(route: CreatorRoute, locale: Locale): CreatorRoute {
  if (locale === "zh-Hans") return route;
  const t = (text: string) => localize(text, locale);
  return {
    ...route,
    // 频道名：英文版用拼音或意译（带英文的只留英文），繁体保持博主自己的写法
    creator: locale === "en" ? t(route.creator) : route.creator,
    summary: t(route.summary),
    origin: route.origin && t(route.origin),
    visited: route.visited && t(route.visited),
    route: route.route?.map((day) => ({ label: t(day.label), stops: day.stops.map((stop) => (/^[a-z]{4}-/.test(stop) ? stop : t(stop))) })),
    notes: route.notes?.map((note) => ({ ...note, text: t(note.text) })),
    tips: route.tips?.map(t),
  };
}

export default async function RoutesPage({ params }: PageProps<"/[locale]/routes">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.routes;

  // 路线里用到的景点：名字和所在公园
  const used = new Set(creatorRoutes.flatMap((route) => [...(route.route?.flatMap((day) => day.stops) ?? []), ...(route.notes?.map((n) => n.stop) ?? [])]));
  const stopNames = Object.fromEntries(
    attractions.filter((a) => used.has(a.id)).map((a) => [a.id, { nameZh: localize(a.nameZh, locale), park: a.park }]),
  );
  const routeParks = parks
    .filter((park) => creatorRoutes.some((route) => route.parks.includes(park.code)))
    .map((park) => ({ code: park.code, nameZh: localize(park.nameZh, locale) }));

  // 明星同款：新发的在前；公园按网站的公园顺序
  const shots = celebrityShots.map((shot) => localizeCelebrity(shot, locale)).sort((a, b) => b.date.localeCompare(a.date));
  const films = filmSpots.map((shot) => localizeFilm(shot, locale)).sort((a, b) => b.year - a.year);
  const parksWith = (list: { park: string }[]) =>
    parks.filter((park) => list.some((item) => item.park === park.code)).map((park) => ({ code: park.code, nameZh: localize(park.nameZh, locale) }));
  const stopsOf = (list: { attraction?: string }[]) =>
    Object.fromEntries(attractions.filter((a) => list.some((item) => item.attraction === a.id)).map((a) => [a.id, localize(a.nameZh, locale)]));

  return (
    <div className="mx-auto max-w-[1600px] px-5 pt-14 pb-28 sm:px-10">
      <PageHeader eyebrow={t.eyebrow} title={t.title} intro={t.intro} photo={headerPhoto("mova-forrest-gump-point", locale)} />
      <div className="mt-10">
        <RoutesTabs
          label={t.tabsLabel}
          tabs={[
            {
              id: "creators",
              label: t.tabs.creators,
              count: creatorRoutes.length,
              panel: (
                <CreatorRoutes
                  routes={creatorRoutes.map((route) => localizeRoute(route, locale))}
                  parks={routeParks}
                  stopNames={stopNames}
                  locale={locale}
                  text={{ ...t, colon: dict.units.colon }}
                />
              ),
            },
            {
              id: "celebs",
              label: t.tabs.celebs,
              count: shots.length,
              panel: <CelebritySpots kind="celebs" shots={shots} parks={parksWith(shots)} stopNames={stopsOf(shots)} locale={locale} text={dict} />,
            },
            ...(films.length > 0
              ? [
                  {
                    id: "films",
                    label: t.tabs.films,
                    count: films.length,
                    panel: <CelebritySpots kind="films" shots={films} parks={parksWith(films)} stopNames={stopsOf(films)} locale={locale} text={dict} />,
                  },
                ]
              : []),
          ]}
        />
      </div>
      <p className="mt-16 text-[11px] leading-5 text-mute">{fill(t.source, { date: creatorsUpdated })}</p>
    </div>
  );
}
