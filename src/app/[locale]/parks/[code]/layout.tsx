import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { CommonsImage } from "@/components/commons-image";
import { fullNameEn } from "@/data/parks";
import { ParkChrome } from "@/components/park/park-chrome";
import { SectionNav } from "@/components/site/section-nav";
import { fill } from "@/i18n/format";
import { loadParkPage, parkPath } from "@/lib/park-page";
import { teslaChargers } from "@/data/tesla.generated";
import { attractionHazards, parkSafetyCards } from "@/lib/safety";

export async function generateMetadata({ params }: PageProps<"/[locale]/parks/[code]">): Promise<Metadata> {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) return {};
  return { title: { default: view.title, template: `%s · ${view.dict.site.name}` } };
}

export default async function ParkLayout({ children, params }: LayoutProps<"/[locale]/parks/[code]">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) notFound();
  const { park, dict, t, heroPhoto, facts, site, canada, hasSeasonInfo, hasBookings, parkCreators, parkCelebs, parkFilms } = view;
  const overview = parkPath(locale, code);
  const hasHikes = view.attractions.some((a) => a.hike);
  const hasTesla = (teslaChargers[code]?.stations.length ?? 0) > 0;
  // 安全：官方资料提到了危险，或者有景点标了危险（同行适合度）
  const hasSafety = parkSafetyCards(code, view.locale).length > 0 || attractionHazards(code).length > 0;

  // 照着 Wabunka 的目的地页：全屏大图慢慢平移，左下是名字和一句话，底下一条半透明的白条写几项基本情况，右边金色按钮
  const hero = (
    <section data-header-tone="dark" className="relative overflow-hidden bg-night text-white">
      {/* 手机上底下那条基本情况放在照片下面（压在照片上会挡住名字），宽屏上压在照片底部 */}
      <div className="relative h-[78svh] min-h-[520px] md:h-[100svh] md:min-h-[640px]">
        {heroPhoto && (
          <ViewTransition name={`park-photo-${park.code}`} share="park-morph" default="none">
            <div className="absolute inset-0">
              <CommonsImage
                src={heroPhoto.url.replace("/960px-", "/1920px-")}
                alt=""
                fill
                priority
                sizes="100vw"
                className="animate-drift object-cover"
              />
            </div>
          </ViewTransition>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1216px] flex-col justify-end px-5 pb-10 sm:px-10 md:pb-32">
          <nav className="hero-fade flex items-center gap-3 text-[13px] tracking-[0.06em] text-white/75">
            <Link href={`/${locale}/parks${site ? "#places" : ""}`} className="nav-line hover:text-white">
              {site ? dict.common.sites : dict.common.allParks}
            </Link>
            <span className="text-white/40">/</span>
            <span>{dict.regions[park.region]}</span>
          </nav>
          <h1 className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2 font-serif font-normal">
            <span className="text-[clamp(2.6rem,6vw,4.6rem)] leading-none tracking-[0.04em]">{park.nameZh}</span>
            <span className="text-[clamp(1rem,1.6vw,1.35rem)] tracking-[0.06em] text-white/80">
              {fullNameEn(park)}
              {canada && " · Canada"}
            </span>
          </h1>
          <p className="hero-fade mt-5 max-w-2xl font-serif text-lg leading-8 text-white/85">{park.tagline}</p>
        </div>
      </div>
      <div className="z-10 bg-white text-[#1a150e] md:absolute md:inset-x-0 md:bottom-0 md:bg-white/88 md:backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1216px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 sm:px-10">
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
            {facts.map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2">
                <dt className="text-[#6b645b]">{label}</dt>
                <dd className="font-serif text-[15px]">{value}</dd>
              </div>
            ))}
          </dl>
          <Link
            href={`/${locale}/plan?park=${park.code}`}
            className="inline-flex h-12 min-w-56 items-center justify-center bg-gold px-6 font-serif text-[16px] text-on-gold transition-colors duration-300 hover:bg-gold-deep"
          >
            {t.nav.generate}
          </Link>
        </div>
      </div>
      {heroPhoto && (
        <a
          href={heroPhoto.page}
          target="_blank"
          rel="noreferrer"
          className="absolute top-20 right-5 z-10 text-[10px] text-white/50 hover:text-white/80 sm:right-10"
        >
          {fill(dict.attraction.photoCredit, { author: heroPhoto.author, license: heroPhoto.license })}
        </a>
      )}
    </section>
  );

  const nav = (
    <SectionNav
      label={t.nav.label}
      items={[
        { id: "overview", label: t.nav.overview, href: overview },
        ...(hasSeasonInfo ? [{ id: "activities", label: t.nav.activities, href: parkPath(locale, code, "activities") }] : []),
        ...(hasBookings ? [{ id: "bookings", label: t.nav.bookings, href: parkPath(locale, code, "bookings") }] : []),
        { id: "attractions", label: t.nav.attractions, href: parkPath(locale, code, "attractions") },
        ...(hasHikes ? [{ id: "hikes", label: t.nav.hikes, href: parkPath(locale, code, "hikes") }] : []),
        ...(hasTesla ? [{ id: "tesla", label: t.nav.tesla, href: parkPath(locale, code, "tesla") }] : []),
        ...(hasSafety ? [{ id: "safety", label: t.nav.safety, href: parkPath(locale, code, "safety") }] : []),
        ...(parkCreators.length > 0 ? [{ id: "creators", label: t.nav.creators, href: `/${locale}/routes?park=${code}` }] : []),
        { id: "guides", label: t.nav.guides, href: parkPath(locale, code, "guides") },
        ...(parkCelebs.length > 0 ? [{ id: "celebs", label: t.nav.celebs, href: `/${locale}/routes?park=${code}#celebs` }] : []),
        ...(parkFilms.length > 0 ? [{ id: "films", label: t.nav.films, href: `/${locale}/routes?park=${code}#films` }] : []),
        { id: "live", label: t.nav.live, href: parkPath(locale, code, "live") },
      ]}
      actions={
        <Link
          href={`/${locale}/plan?park=${park.code}`}
          className="inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs tracking-[0.12em] text-on-gold transition-colors hover:bg-gold-deep"
        >
          {t.nav.generate}
        </Link>
      }
    />
  );

  return (
    <ParkChrome overviewPath={overview} hero={hero} nav={nav}>
      {children}
    </ParkChrome>
  );
}
