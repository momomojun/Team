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

  const hero = (
    <section className="relative h-[88svh] min-h-[620px] overflow-hidden bg-ink text-white">
      {heroPhoto && (
        <ViewTransition name={`park-photo-${park.code}`} share="park-morph" default="none">
          <div className="absolute inset-0">
            <CommonsImage
              src={heroPhoto.url.replace("/960px-", "/1920px-")}
              alt=""
              fill
              priority
              sizes="100vw"
              className="animate-kenburns object-cover"
            />
          </div>
        </ViewTransition>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
      <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-5 pb-10 sm:px-10 lg:pb-14">
        <nav className="eyebrow flex items-center gap-3 text-white/70">
          <Link href={`/${locale}${site ? "#places" : "#parks"}`} className="hover:text-white">
            {site ? dict.common.sites : dict.common.allParks}
          </Link>
          <span className="text-white/40">/</span>
          <span>{dict.regions[park.region]}</span>
        </nav>
        <h1 className="mt-7 font-serif text-[clamp(3.2rem,9vw,8rem)] leading-none font-normal tracking-[0.04em]">{park.nameZh}</h1>
        <p className="eyebrow mt-6 text-white/80">
          {fullNameEn(park)} · {park.stateEn}
          {canada && " · Canada"}
        </p>
        <p className="mt-6 max-w-xl font-serif text-xl text-white/85 sm:text-2xl">{park.tagline}</p>
        <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-white/25 pt-6 md:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="eyebrow mt-2 text-white/55">{label}</dt>
              <dd className="font-serif text-lg sm:text-xl">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {heroPhoto && (
        <a
          href={heroPhoto.page}
          target="_blank"
          rel="noreferrer"
          className="absolute right-5 bottom-3 z-10 text-[10px] text-white/45 hover:text-white/80 sm:right-10"
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
        ...(parkCreators.length > 0 ? [{ id: "creators", label: t.nav.creators, href: `/${locale}/routes?park=${code}` }] : []),
        { id: "guides", label: t.nav.guides, href: parkPath(locale, code, "guides") },
        ...(parkCelebs.length > 0 ? [{ id: "celebs", label: t.nav.celebs, href: `/${locale}/routes?park=${code}#celebs` }] : []),
        ...(parkFilms.length > 0 ? [{ id: "films", label: t.nav.films, href: `/${locale}/routes?park=${code}#films` }] : []),
        { id: "live", label: t.nav.live, href: parkPath(locale, code, "live") },
      ]}
      actions={
        <Link
          href={`/${locale}/plan?park=${park.code}`}
          className="inline-flex items-center gap-2 bg-ink px-4 py-2 text-xs tracking-[0.12em] text-paper transition-colors hover:bg-clay-700"
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
