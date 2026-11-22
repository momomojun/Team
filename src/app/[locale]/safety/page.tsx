import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SafetyHazardCard } from "@/components/park/safety-section";
import { headerPhoto } from "@/components/site/header-photo";
import { PageHeader } from "@/components/site/page-header";
import { parks } from "@/data/parks";
import { SAFETY_CHECKED, SAFETY_MORTALITY } from "@/data/safety";
import { hasLocale } from "@/i18n/config";
import { localizePark } from "@/i18n/content";
import { localize } from "@/i18n/convert";
import { getDictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";
import { allSafetyCards } from "@/lib/safety";

const container = "mx-auto max-w-[1216px]";

export async function generateMetadata({ params }: PageProps<"/[locale]/safety">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).safety.title };
}

/** 全站的“安全”（GOALS O63）：每种危险一张卡片，写官方资料提到的公园，点进公园页的“安全” */
export default async function SafetyOverviewPage({ params }: PageProps<"/[locale]/safety">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.safety;
  const cards = allSafetyCards(locale);
  const parkName = new Map(parks.map((park) => [park.code, localizePark(park, locale).nameZh]));

  return (
    <div className="px-5 pb-24 sm:px-10">
      <PageHeader eyebrow={t.eyebrow} title={t.title} intro={t.intro} photo={headerPhoto("yell-grand-prismatic", locale)} />

      <nav aria-label={t.jump} className={`${container} no-scrollbar mt-8 flex gap-x-6 overflow-x-auto border-b border-line pb-3 font-serif text-[14px] whitespace-nowrap text-ink-soft`}>
        {cards.map((card) => (
          <a key={card.id} href={`#hazard-${card.id}`} className="nav-line shrink-0 hover:text-ink">
            {card.title}
          </a>
        ))}
      </nav>
      <p className={`${container} mt-5 text-[13px] text-mute`}>{fill(t.checked, { date: SAFETY_CHECKED })}</p>

      {/* 先说清楚实际有多常见：NPS 的死亡记录 */}
      <section className={`${container} mt-12 border-l-2 border-clay-500 pl-5`}>
        <p className="max-w-3xl text-[15px] leading-8">{locale === "en" ? SAFETY_MORTALITY.en : localize(SAFETY_MORTALITY.zh, locale)}</p>
        <p className="mt-2 flex flex-wrap gap-x-4 text-[11px] text-mute">
          {SAFETY_MORTALITY.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="link-line">
              {source.title}
            </a>
          ))}
        </p>
      </section>

      <div className={`${container} mt-12 grid gap-6 md:grid-cols-2`}>
        {cards.map((card) => (
          <SafetyHazardCard
            key={card.id}
            card={card}
            t={t}
            parkLinks={card.parks
              .filter((code) => parkName.has(code))
              .map((code) => ({ code, name: parkName.get(code)!, href: `/${locale}/parks/${code}/safety` }))}
          />
        ))}
      </div>
    </div>
  );
}
