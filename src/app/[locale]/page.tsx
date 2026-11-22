import Link from "next/link";
import { notFound } from "next/navigation";
import { CommonsImage } from "@/components/commons-image";
import { ActivityCard } from "@/components/activities/activity-card";
import { ContinueTrip } from "@/components/home/continue-trip";
import { FilmTile, type FilmCard } from "@/components/home/film-reel";
import { Hero, type HeroSlide } from "@/components/home/hero";
import { HeroSearch } from "@/components/home/hero-search";
import { Rail } from "@/components/home/rail";
import { Spotlight } from "@/components/home/spotlight";
import { SectionTitle } from "@/components/site/section-title";
import { attractions } from "@/data/attractions";
import { creatorRoutes } from "@/data/creators";
import { filmSpots } from "@/data/film-spots";
import { isSite, parks, regionOrder, type Park } from "@/data/parks";
import { hasLocale } from "@/i18n/config";
import { localizePark } from "@/i18n/content";
import { localize } from "@/i18n/convert";
import { getDictionary } from "@/i18n/dictionaries";
import { fill, formatMonths } from "@/i18n/format";
import { activityCards } from "@/lib/activity-cards";
import { byParkPopularity } from "@/lib/park-popularity";

// “当月精选”按当前月份计算，页面每天重新生成一次
export const revalidate = 86400;

/** 和 Wabunka 一样的版心：最宽 1216px */
const container = "mx-auto max-w-[1216px] px-5 sm:px-10";
const CLOSING_PHOTO = "yose-glacier-point";
/** 首屏轮流的公园：挑最有代表性的风景（按评论数排，圣路易斯拱门这种城里的会排到前面） */
const HERO_PARKS = ["yose", "grca", "yell", "zion", "glac", "grte", "arch", "dena"];
const goldButton =
  "inline-flex h-12 min-w-72 items-center justify-center bg-gold px-8 font-serif text-[16px] text-on-gold transition-colors duration-300 hover:bg-gold-deep";

const photoOf = (id: string) => attractions.find((attraction) => attraction.id === id)?.photo;
/** Commons 缩略图换成 1920 宽，做全屏大图 */
const large = (url: string) => url.replace("/960px-", "/1920px-");

const heroOf = (park: Pick<Park, "hero">) => photoOf(park.hero);

/** 照片格子：悬停时照片慢慢放大一点、压暗一点，名字在底部居中（Wabunka 的入口、拼贴格子都是这样） */
function PhotoTile({ href, image, sizes, label, sub, className = "" }: { href: string; image?: string; sizes: string; label: string; sub?: string; className?: string }) {
  return (
    <Link href={href} className={`group relative block overflow-hidden bg-night text-white ${className}`}>
      {image && (
        <CommonsImage
          src={image}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-[scale,filter] duration-700 ease-(--ease-soft) group-hover:scale-[1.04] group-hover:brightness-90"
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
      <span className="absolute inset-x-3 bottom-4 text-center">
        <span className="block font-serif text-[16px] tracking-[0.04em] md:text-[18px]">{label}</span>
        {sub && <span className="mt-1 block text-[12px] text-white/75">{sub}</span>}
      </span>
    </Link>
  );
}

/** 英文名横排、中文名竖排，中间两段细竖线（Wabunka 的目的地格子：Tokyo | 東京） */
function NamePlate({ en, zh, large: big }: { en: string; zh: string; large?: boolean }) {
  return (
    <>
      <span className={`font-serif tracking-[0.05em] ${big ? "text-[clamp(1.6rem,3vw,2.4rem)]" : "text-[18px] md:text-[22px]"}`}>{en}</span>
      <span aria-hidden className={`w-px bg-white/80 ${big ? "my-3 h-6" : "my-2.5 h-5"}`} />
      <span className={`vertical font-serif tracking-[0.3em] ${big ? "text-[15px]" : "text-[13px]"}`}>{zh}</span>
      <span aria-hidden className={`w-px bg-white/80 ${big ? "mt-3 h-6" : "mt-2.5 h-5"}`} />
    </>
  );
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.home;
  const base = `/${locale}`;
  const planHref = `${base}/plan`;
  const parkHref = (code: string) => `${base}/parks/${code}`;

  const localParks = parks.filter((park) => !isSite(park)).map((park) => localizePark(park, locale));
  const ranked = [...localParks].sort(byParkPopularity);
  const credit = (photo: { author: string; license: string }) => fill(t.photoCredit, photo);
  const month = new Date().getMonth() + 1;
  // 竖排的中文名：繁体页面用繁体，英文页面也写中文（像 Wabunka 给英文读者写的日文）
  const verticalName = (park: Park) => (locale === "zh-Hant" ? park.nameZh : (parks.find((p) => p.code === park.code)?.nameZh ?? park.nameZh));

  // 首屏：8 座最有代表性的公园轮流
  const slides: HeroSlide[] = HERO_PARKS.flatMap((code) => localParks.filter((park) => park.code === code)).flatMap((park) => {
    const photo = heroOf(park);
    return photo
      ? [{ code: park.code, href: parkHref(park.code), nameZh: park.nameZh, nameEn: park.nameEn, image: large(photo.url), credit: credit(photo), creditHref: photo.page }]
      : [];
  });

  // 五个入口（Wabunka 的 Destinations / Journeys / Stays…）
  const parkPhoto = (code: string) => {
    const park = parks.find((p) => p.code === code);
    return park ? heroOf(park)?.url : undefined;
  };
  const categories = [
    { href: `${base}/parks`, label: t.categories.parks, image: parkPhoto("grca") },
    { href: `${base}/when`, label: t.categories.when, image: parkPhoto("glac") },
    { href: `${planHref}#plan-copilot`, label: t.categories.plan, image: parkPhoto("arch") },
    { href: `${base}/routes`, label: t.categories.routes, image: parkPhoto("zion") },
    { href: `${base}/rankings`, label: t.categories.rankings, image: parkPhoto("yell") },
  ];

  // 当月精选：这个月正好的公园里最热门的几座（不够三座就用热门的）
  const inSeason = ranked.filter((park) => park.bestMonths.includes(month));
  const picks = (inSeason.length >= 3 ? inSeason : ranked).slice(0, 8);
  const attractionCount = (code: string) => attractions.filter((a) => a.park === code).length;

  // 热门目的地：两张大的，下面一排横着滑的小的
  const featured = ranked.slice(0, 2);
  const moreFeatured = ranked.slice(2, 12);

  // 按地区：每个片区一格，照片用片区里最热门的公园
  const regions = regionOrder
    .map((region) => {
      const inRegion = ranked.filter((park) => park.region === region);
      return { id: region as string, label: dict.regions[region], count: inRegion.length, image: inRegion[0] ? heroOf(inRegion[0])?.url : undefined };
    })
    .filter((region) => region.count > 0);

  // 博主路线：播放量最高的几条，照片用路线第一站（对不上景点就用公园首图）
  const routes = [...creatorRoutes]
    .sort((a, b) => b.views - a.views)
    .slice(0, 7)
    .map((route) => {
      const firstStop = route.route?.flatMap((day) => day.stops).find((id) => attractions.some((a) => a.id === id));
      const park = parks.find((p) => p.code === route.parks[0]);
      const photo = (firstStop ? photoOf(firstStop) : undefined) ?? (park ? heroOf(park) : undefined);
      const parkNames = route.parks.flatMap((code) => localParks.filter((p) => p.code === code).map((p) => p.nameZh)).slice(0, 2);
      return { id: route.id, title: route.title, creator: route.creator, image: photo?.url, meta: [...parkNames, ...(route.days ? [fill(t.routeDays, { n: route.days })] : [])] };
    });

  // 电影：有官方视频、有取景地照片的，片段排在预告片前面
  const films: FilmCard[] = filmSpots
    .flatMap((film) => (film.video && film.photo ? [{ ...film, video: film.video, photo: film.photo }] : []))
    .sort((a, b) => Number(b.video.type === "clip") - Number(a.video.type === "clip"))
    .slice(0, 9)
    .map((film) => ({
      id: film.id,
      title: locale === "en" ? film.titleEn : localize(film.titleZh, locale),
      year: film.year,
      place: localize(film.placeZh, locale),
      image: film.photo.url,
      youtube: film.video.youtube,
      start: film.video.start,
      trailer: film.video.type === "trailer",
    }));

  const spots = t.spots.map((spot) => {
    const park = parks.find((p) => p.code === spot.park);
    const photo = park ? heroOf(park) : undefined;
    return { text: spot.text, meta: spot.meta, href: `${planHref}?q=${encodeURIComponent(spot.text)}#plan-copilot`, image: photo ? large(photo.url) : "" };
  });

  const stats = [
    { value: localParks.length, label: t.stats.parks },
    { value: attractions.filter((a) => localParks.some((park) => park.code === a.park)).length, label: t.stats.attractions },
    { value: attractions.filter((a) => a.trailLine).length, label: t.stats.trails },
    { value: creatorRoutes.length, label: t.stats.routes },
  ];
  const closingPhoto = photoOf(CLOSING_PHOTO);
  // 这个月的活动：限时的、所在公园热门的排前面
  const monthActivities = activityCards(locale, month);

  return (
    <div className="theme-dark">
      <Hero
        slides={slides}
        wordmark={dict.site.wordmark}
        text={{ title: t.heroTitle, scroll: t.scroll, previous: t.previous, next: t.next }}
        search={
          <HeroSearch
            parks={parks.map((park) => localizePark(park, locale)).map((park) => ({ code: park.code, href: parkHref(park.code), nameZh: park.nameZh, nameEn: park.nameEn }))}
            planHref={planHref}
            text={{ label: t.searchLabel, placeholder: t.searchPlaceholder, plan: t.searchPlan, go: t.searchGo }}
          />
        }
      />

      {/* 五个入口 + 当月精选 */}
      <section className="pt-16 pb-20 md:pt-20">
        <div className={container}>
          <ul className="no-scrollbar -mx-5 flex snap-x gap-2 overflow-x-auto px-5 sm:-mx-10 sm:px-10 md:mx-0 md:grid md:grid-cols-5 md:px-0">
            {categories.map((category) => (
              <li key={category.href} className="w-[42vw] shrink-0 snap-start sm:w-[30vw] md:w-auto">
                <PhotoTile href={category.href} image={category.image} label={category.label} sizes="(min-width: 768px) 20vw, 42vw" className="aspect-[2/3]" />
              </li>
            ))}
          </ul>

          <div className="mt-20">
            <SectionTitle href={`${base}/when`}>{fill(t.pickTitle, { month })}</SectionTitle>
            <Rail label={fill(t.pickTitle, { month })} previous={t.previous} next={t.next}>
              {picks.map((park) => {
                const photo = heroOf(park);
                return (
                  <Link key={park.code} href={parkHref(park.code)} className="group w-[78vw] shrink-0 snap-start sm:w-[46vw] md:w-[calc((100%-0.5rem)/2)]">
                    <div className="relative aspect-[3/2] overflow-hidden bg-paper-deep">
                      {photo && (
                        <CommonsImage
                          src={photo.url}
                          alt=""
                          fill
                          sizes="(min-width: 768px) 50vw, 78vw"
                          className="object-cover transition-[scale] duration-700 ease-(--ease-soft) group-hover:scale-[1.03]"
                        />
                      )}
                    </div>
                    <p className="mt-4 flex items-center gap-3 text-[11px] tracking-[0.14em] text-clay-600">
                      {dict.regions[park.region]}
                      <span aria-hidden className="h-px w-8 bg-clay-500" />
                    </p>
                    <h3 className="mt-2 font-serif text-[18px] leading-snug transition-colors duration-300 group-hover:text-clay-700 md:text-[20px]">
                      {park.nameZh}
                      <span className="text-ink-soft"> · {park.tagline}</span>
                    </h3>
                    <p className="mt-2 flex flex-wrap gap-x-2 text-[13px] text-mute">
                      <span>{park.stateEn}</span>
                      <span aria-hidden>|</span>
                      <span>{fill(t.bestMonths, { months: formatMonths(park.bestMonths, dict.units) })}</span>
                      <span aria-hidden>|</span>
                      <span>{fill(t.attractions, { n: attractionCount(park.code) })}</span>
                    </p>
                  </Link>
                );
              })}
            </Rail>
          </div>
        </div>
      </section>

      {/* 热门目的地：两张大图，下面一排横着滑的小图 */}
      <section className="pb-20">
        <div className={container}>
          <SectionTitle href={`${base}/parks`}>{t.featuredTitle}</SectionTitle>
        </div>
        <div className="mx-auto grid max-w-[1600px] gap-1 md:grid-cols-2">
          {featured.map((park) => {
            const photo = heroOf(park);
            return (
              <Link key={park.code} href={parkHref(park.code)} className="group relative block aspect-[16/10] overflow-hidden bg-night text-white md:aspect-[4/3] xl:aspect-[16/11]">
                {photo && (
                  <CommonsImage
                    src={large(photo.url)}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-[scale] duration-[1200ms] ease-(--ease-soft) group-hover:scale-[1.04]"
                  />
                )}
                <span className="absolute inset-0 bg-black/35 transition-colors duration-700 group-hover:bg-black/25" />
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                  <NamePlate en={park.nameEn} zh={verticalName(park)} large />
                </span>
              </Link>
            );
          })}
        </div>
        <ul className="no-scrollbar mx-auto mt-1 flex max-w-[1600px] snap-x gap-1 overflow-x-auto">
          {moreFeatured.map((park) => {
            const photo = heroOf(park);
            return (
              <li key={park.code} className="w-[46vw] shrink-0 snap-start sm:w-[30vw] lg:w-[calc((100%-0.75rem)/4)]">
                <Link href={parkHref(park.code)} className="group relative block aspect-[4/5] overflow-hidden bg-night text-white">
                  {photo && (
                    <CommonsImage
                      src={photo.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, 46vw"
                      className="object-cover transition-[scale] duration-[1200ms] ease-(--ease-soft) group-hover:scale-[1.05]"
                    />
                  )}
                  <span className="absolute inset-0 bg-black/30" />
                  <span className="absolute inset-x-0 top-10 flex flex-col items-center px-3 text-center">
                    <NamePlate en={park.nameEn} zh={verticalName(park)} />
                  </span>
                  <span className="absolute right-4 bottom-4 text-[12px] text-white/85">{t.featuredMore}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-12 text-center">
          <Link href={`${base}/parks`} className={goldButton}>
            {fill(t.featuredAll, { n: localParks.length })}
          </Link>
        </div>
      </section>

      <Spotlight
        items={spots}
        allHref={`${planHref}#plan-copilot`}
        text={{ title: t.spotTitle, hint: t.spotHint, cta: t.spotCta, all: t.spotAll, previous: t.previous, next: t.next }}
      />

      {/* 按地区：照片拼贴，第一格大、中间一格宽（20 个片区正好铺满 6 列 4 行） */}
      <section className="pt-20 pb-20">
        <div className={container}>
          <SectionTitle href={`${base}/parks`}>{t.regionsTitle}</SectionTitle>
        </div>
        <ul className="mx-auto grid max-w-[1600px] grid-flow-dense auto-rows-[38vw] grid-cols-2 gap-1 sm:auto-rows-[26vw] sm:grid-cols-3 lg:auto-rows-[13vw] lg:grid-cols-6 2xl:auto-rows-[210px]">
          {regions.map((region, i) => (
            <li key={region.id} className={i === 0 ? "col-span-2 row-span-2" : i === 9 ? "col-span-2" : ""}>
              <PhotoTile
                href={`${base}/parks#region-${region.id}`}
                image={region.image}
                label={region.label}
                sub={fill(t.regionParks, { n: region.count })}
                sizes={i === 0 || i === 9 ? "(min-width: 1024px) 34vw, 100vw" : "(min-width: 1024px) 17vw, 50vw"}
                className="size-full"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* 博主同款路线：一大六小的拼贴 */}
      <section className="pb-24">
        <div className={container}>
          <SectionTitle href={`${base}/routes`}>
            {t.routesTitle}
          </SectionTitle>
          <ul className="grid auto-rows-[52vw] grid-cols-2 gap-1 sm:auto-rows-[30vw] md:auto-rows-[210px] md:grid-cols-4">
            {routes.map((route, i) => (
              <li key={route.id} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                <Link href={`${base}/routes`} className="group relative block size-full overflow-hidden bg-night text-white">
                  {route.image && (
                    <CommonsImage
                      src={route.image}
                      alt=""
                      fill
                      sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                      className="object-cover transition-[scale] duration-700 ease-(--ease-soft) group-hover:scale-[1.04]"
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <span className="absolute inset-x-4 bottom-4">
                    <span className="block text-[11px] tracking-[0.06em] text-white/75">{route.creator}</span>
                    <span className={`mt-1 line-clamp-2 block font-serif leading-snug ${i === 0 ? "text-[20px] md:text-[24px]" : "text-[15px]"}`}>{route.title}</span>
                    {route.meta.length > 0 && <span className="mt-1 block text-[11px] text-white/70">{route.meta.join(" | ")}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-12 text-center">
            <Link href={`${base}/routes`} className={goldButton}>
              {fill(t.routesAll, { n: creatorRoutes.length })}
            </Link>
          </div>
        </div>
      </section>

      {/* 从这里起是米色的下半页（照着 Wabunka：上半页深色看风景，下半页米色是能去做的事和资料，只换一次）：
          这个月的活动（Wabunka 的“Available Today”）、资料从哪来、电影里的国家公园 */}
      <div className="theme-light">
        {monthActivities.length > 0 && (
          <section className="pt-20 md:pt-24">
            <div className={container}>
              <SectionTitle href={`${base}/activities/${month}`}>{fill(t.activitiesTitle, { month })}</SectionTitle>
              <Rail label={fill(t.activitiesTitle, { month })} previous={t.previous} next={t.next}>
                {monthActivities.slice(0, 8).map((card) => (
                  <div key={card.id} className="w-[72vw] shrink-0 snap-start sm:w-[40vw] md:w-[calc((100%-1rem)/3)] lg:w-[calc((100%-1.5rem)/4)]">
                    <ActivityCard card={card} dict={dict} href={`${base}/activities/${month}#activity-${card.id}`} sizes="(min-width: 1024px) 300px, (min-width: 768px) 33vw, 72vw" />
                  </div>
                ))}
              </Rail>
              <div className="mt-12 text-center">
                <Link href={`${base}/activities/${month}`} className={goldButton}>
                  {fill(t.activitiesAll, { month, n: monthActivities.length })}
                </Link>
              </div>
            </div>
          </section>
        )}

        <section id="about" className={`${container} grid scroll-mt-16 gap-12 py-20 md:py-24 lg:grid-cols-[5fr_7fr]`}>
          <div>
            <h2 className="font-serif text-[26px] leading-snug text-clay-600 md:text-[32px]">{t.dataTitle}</h2>
            <p className="mt-6 max-w-md text-[15px] leading-8 text-ink-soft">{t.dataText}</p>
            <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-7">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse border-t border-line pt-4">
                  <dt className="mt-1 text-[13px] text-mute">{stat.label}</dt>
                  <dd className="font-serif text-[34px] leading-none">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ul className="grid content-start gap-px bg-line sm:grid-cols-2">
            {t.sources.map((source) => (
              <li key={source.name} className="bg-paper p-6">
                <p className="font-serif text-[17px]">{source.name}</p>
                <p className="mt-2 text-[13px] leading-6 text-ink-soft">{source.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {films.length > 0 && (
          <section className="pb-20 md:pb-24">
            <div className={container}>
              <SectionTitle href={`${base}/routes#films`}>
                {t.filmTitle}
              </SectionTitle>
              <Rail label={t.filmTitle} previous={t.previous} next={t.next}>
                {films.map((film) => (
                  <FilmTile key={film.id} film={film} text={{ play: t.filmPlay, trailer: t.filmTrailer }} />
                ))}
              </Rail>
            </div>
          </section>
        )}
      </div>

      {/* 收尾：一张大图上两张白卡片（Wabunka 的“联系我们 / 订阅”） */}
      <section className="relative overflow-hidden bg-night py-20 md:py-28">
        {closingPhoto && <CommonsImage src={large(closingPhoto.url)} alt="" fill sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-black/35" />
        <div className={`${container} relative grid gap-4 md:grid-cols-2`}>
          <div className="theme-light flex flex-col items-center bg-paper px-8 py-10 text-center">
            <h2 className="font-serif text-[22px]">{t.closingPlanTitle}</h2>
            <p className="mt-3 max-w-sm text-[14px] leading-7 text-ink-soft">{t.closingPlanText}</p>
            <Link
              href={planHref}
              className="mt-7 inline-flex h-11 min-w-56 items-center justify-center border border-clay-500 px-6 font-serif text-[15px] text-clay-600 transition-colors duration-300 hover:bg-gold hover:text-on-gold"
            >
              {t.closingPlanCta}
            </Link>
            <ContinueTrip href={planHref} parkNames={Object.fromEntries(localParks.map((park) => [park.code, park.nameZh]))} locale={locale} text={t} />
          </div>
          <div className="theme-light flex flex-col items-center bg-paper px-8 py-10 text-center">
            <h2 className="font-serif text-[22px]">{t.appTitle}</h2>
            <p className="mt-3 max-w-sm text-[14px] leading-7 text-ink-soft">{t.appText}</p>
          </div>
        </div>
        {closingPhoto && (
          <a href={closingPhoto.page} target="_blank" rel="noreferrer" className="absolute right-5 bottom-3 text-[10px] text-white/50 hover:text-white/80 sm:right-10">
            {credit(closingPhoto)}
          </a>
        )}
      </section>
    </div>
  );
}
