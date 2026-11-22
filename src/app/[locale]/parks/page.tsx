import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommonsImage } from "@/components/commons-image";
import { WestMap } from "@/components/home/west-map";
import { headerPhoto } from "@/components/site/header-photo";
import { PageHeader } from "@/components/site/page-header";
import { SectionTitle } from "@/components/site/section-title";
import { attractions } from "@/data/attractions";
import { alaskaMap, caribbeanMap, eastMap, hawaiiMap, samoaMap, westMap } from "@/data/map.generated";
import { isSite, parks, regionOrder } from "@/data/parks";
import { hasLocale } from "@/i18n/config";
import { localizePark } from "@/i18n/content";
import { localize } from "@/i18n/convert";
import { getDictionary } from "@/i18n/dictionaries";
import { fill, formatMonths, otherName } from "@/i18n/format";
import { parkWeight } from "@/lib/park-popularity";

// “当季”按当前月份标，页面每天重新生成一次
export const revalidate = 86400;

const container = "mx-auto max-w-[1216px]";

export async function generateMetadata({ params }: PageProps<"/[locale]/parks">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const t = getDictionary(locale).home;
  return { title: fill(t.parksTitle, { n: parks.filter((park) => !isSite(park)).length }) };
}

/** 地图上名字挤在一起时热门的公园先摆 */
const weight = parkWeight;
const photoOf = (id: string) => attractions.find((attraction) => attraction.id === id)?.photo;

/**
 * 全部公园（照着 Wabunka 的列表页：白底、照片卡片三列）：按片区一段一段排，每段一个金色标题；
 * 最后是园外名胜和线描地图。首页“按地区找”的格子跳到这里对应的片区（#region-片区）。
 */
export default async function ParksPage({ params }: PageProps<"/[locale]/parks">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.home;
  const month = new Date().getMonth() + 1;
  const local = parks.map((park) => localizePark(park, locale));
  const national = local.filter((park) => !isSite(park));
  const sites = local.filter(isSite);
  const count = (code: string) => attractions.filter((a) => a.park === code).length;
  const groups = regionOrder
    .map((region) => ({ id: region as string, label: dict.regions[region], parks: national.filter((park) => park.region === region) }))
    .filter((group) => group.parks.length > 0);
  const insetLabel = (en: string, name: string) => (locale === "en" ? en : `${en} · ${name}`);
  const cityNames = Object.fromEntries(
    [...westMap.cities, ...eastMap.cities, ...alaskaMap.cities, ...hawaiiMap.cities, ...caribbeanMap.cities, ...samoaMap.cities].map((city) => [city.id, localize(city.nameZh, locale)]),
  );

  const card = (park: (typeof local)[number]) => {
    const photo = photoOf(park.hero);
    const inSeason = park.bestMonths.includes(month);
    return (
      <li key={park.code}>
        <Link href={`/${locale}/parks/${park.code}`} className="group block">
          <div className="relative aspect-[3/2] overflow-hidden bg-paper-deep">
            {photo && (
              <CommonsImage
                src={photo.url}
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-[scale] duration-700 ease-(--ease-soft) group-hover:scale-[1.03]"
              />
            )}
            {inSeason && <span className="absolute top-3 left-3 bg-gold px-2 py-0.5 text-[11px] tracking-[0.08em] text-on-gold">{t.inSeason}</span>}
          </div>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-3">
            <span className="font-serif text-[19px] transition-colors duration-300 group-hover:text-clay-600">{park.nameZh}</span>
            <span className="text-[12px] tracking-[0.06em] text-mute">{otherName(park.nameZh, park.nameEn)}</span>
          </p>
          <p className="mt-1.5 text-[14px] leading-6 text-ink-soft">{park.tagline}</p>
          <p className="mt-2 flex flex-wrap gap-x-2 text-[12px] text-mute">
            <span>{park.stateEn}</span>
            <span aria-hidden>|</span>
            <span>{fill(t.bestMonths, { months: formatMonths(park.bestMonths, dict.units) })}</span>
            <span aria-hidden>|</span>
            <span>{fill(t.attractions, { n: count(park.code) })}</span>
          </p>
          {park.agency && <p className="mt-2 text-[12px] leading-5 text-mute">{park.agency}</p>}
        </Link>
      </li>
    );
  };

  return (
    <div className="px-5 pb-24 sm:px-10">
      <PageHeader eyebrow={dict.nav.parks} title={fill(t.parksTitle, { n: national.length })} intro={t.parksHint} photo={headerPhoto("grca-mather-point", locale) ?? headerPhoto("yose-tunnel-view", locale)} />

      {/* 片区跳转：横着一排，窄屏可以滑 */}
      <nav aria-label={t.regionsTitle} className={`${container} no-scrollbar mt-8 flex gap-x-6 overflow-x-auto border-b border-line pb-3 font-serif text-[14px] whitespace-nowrap text-ink-soft`}>
        {groups.map((group) => (
          <a key={group.id} href={`#region-${group.id}`} className="nav-line shrink-0 hover:text-ink">
            {group.label}
          </a>
        ))}
        {sites.length > 0 && (
          <a href="#places" className="nav-line shrink-0 hover:text-ink">
            {dict.nav.sites}
          </a>
        )}
      </nav>

      <div className={`${container} mt-14 space-y-20`}>
        {groups.map((group) => (
          <section key={group.id} className="cv-auto [--cv-h:700px]">
            <SectionTitle id={`region-${group.id}`} hint={fill(t.regionParks, { n: group.parks.length })}>
              {group.label}
            </SectionTitle>
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{group.parks.map(card)}</ul>
          </section>
        ))}

        {sites.length > 0 && (
          <section className="cv-auto [--cv-h:700px]">
            <SectionTitle id="places" hint={t.sitesHint}>
              {t.sitesTitle}
            </SectionTitle>
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">{sites.map(card)}</ul>
          </section>
        )}

        <section className="cv-auto [--cv-h:1100px]">
          <SectionTitle hint={t.mapText}>{t.mapTitle}</SectionTitle>
          <WestMap
            parks={[...national]
              .sort((a, b) => weight(b.code) - weight(a.code))
              .map((park) => ({ code: park.code, href: `/${locale}/parks/${park.code}`, nameZh: park.nameZh, nameEn: park.nameEn, weight: weight(park.code) }))}
            cityNames={cityNames}
            eastLabel={insetLabel("Eastern US", t.mapEast)}
            alaskaLabel={insetLabel("Alaska", dict.regions.alaska)}
            hawaiiLabel={insetLabel("Hawaiʻi", dict.regions.hawaii)}
            caribbeanLabel={insetLabel("U.S. Virgin Islands", dict.regions.caribbean)}
            samoaLabel={insetLabel("American Samoa", dict.regions.samoa)}
          />
        </section>
      </div>
    </div>
  );
}
