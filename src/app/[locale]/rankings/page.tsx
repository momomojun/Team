import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VisitsRanking } from "@/components/rankings/visits-ranking";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fill, formatBig, otherName } from "@/i18n/format";
import { loadRankingsPage } from "@/lib/rankings-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/rankings">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).rankings.nav.visits };
}

export default async function VisitsPage({ params }: PageProps<"/[locale]/rankings">) {
  const { locale } = await params;
  const view = loadRankingsPage(locale);
  if (!view) notFound();
  const { dict, t, text, ranking, canada, canadaSourceUrl, visitsLastYear } = view;
  const canadaYear = canada[0].visits?.lastYear ?? 0;

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-10 lg:py-24">
      <p className="eyebrow text-mute">{t.visits.eyebrow}</p>
      <h2 className="mt-5 font-serif text-[clamp(2rem,3.5vw,3.2rem)] leading-tight">{t.visits.title}</h2>
      <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-soft">{fill(t.visits.intro, { year: visitsLastYear })}</p>
      <div className="mt-10">
        <VisitsRanking
          rows={ranking.map((park) => ({
            code: park.code,
            nameZh: text(park.nameZh),
            nameEn: park.nameEn,
            statesZh: text(park.statesZh),
            visits: park.visits,
            previous: park.previous,
            areaKm2: park.areaKm2,
            ...(park.page ? { page: park.page } : {}),
          }))}
          year={visitsLastYear}
          locale={locale}
          text={{ ...t.visits, units: dict.units }}
        />
      </div>
      <p className="mt-8 max-w-4xl text-[11px] leading-5 text-mute">{t.visits.note}</p>
      <a href="https://irma.nps.gov/Stats/" target="_blank" rel="noreferrer" className="link-line mt-3 inline-block text-xs tracking-[0.1em]">
        {t.visits.source}
      </a>
      <div className="mt-16 max-w-3xl">
        <h3 className="font-serif text-2xl">{t.visits.canadaTitle}</h3>
        <p className="mt-2 text-xs leading-6 text-mute">
          {fill(t.visits.canadaIntro, { year: canadaYear, next: String(canadaYear + 1).slice(2) })}
        </p>
        <ul className="mt-4 border-t border-ink">
          {canada
            .filter((park) => park.visits)
            .sort((a, b) => b.visits!.latest - a.visits!.latest)
            .map((park) => (
              <li key={park.code} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5">
                <Link href={`/${locale}/parks/${park.code}`} className="font-serif text-base hover:text-clay-700">
                  {text(park.nameZh)}
                  <span className="ml-2 font-sans text-[10px] tracking-[0.12em] text-mute uppercase">{otherName(park.nameZh, park.nameEn)}</span>
                </Link>
                <span className="text-sm tabular-nums">{formatBig(park.visits!.latest, dict.units)}</span>
              </li>
            ))}
        </ul>
        <p className="mt-3 text-[11px] leading-5 text-mute">{t.visits.canadaNote}</p>
        <a href={canadaSourceUrl} target="_blank" rel="noreferrer" className="link-line mt-3 inline-block text-xs tracking-[0.1em]">
          {t.visits.canadaSource}
        </a>
      </div>
    </div>
  );
}
