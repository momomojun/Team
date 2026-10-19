import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ParkTimeline } from "@/components/rankings/park-timeline";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fill, otherName } from "@/i18n/format";
import { loadRankingsPage } from "@/lib/rankings-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/rankings/timeline">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).rankings.nav.timeline };
}

export default async function TimelinePage({ params }: PageProps<"/[locale]/rankings/timeline">) {
  const { locale } = await params;
  const view = loadRankingsPage(locale);
  if (!view) notFound();
  const { dict, t, text, latest, dateOf, pendingPark, total, nationalParks, canadianParks } = view;

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-10 lg:py-24">
      <p className="eyebrow text-mute">{t.timeline.eyebrow}</p>
      <h2 className="mt-5 font-serif text-[clamp(2rem,3.5vw,3.2rem)] leading-tight">
        {fill(t.timeline.title, { year: latest.established.slice(0, 4), name: text(latest.nameZh) })}
      </h2>
      <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-soft">{t.timeline.intro}</p>
      <div className="mt-12">
        <ParkTimeline
          units={dict.units}
          parks={nationalParks.map((park) => ({
            code: park.code,
            nameZh: text(park.nameZh),
            nameEn: park.nameEn,
            statesZh: text(park.statesZh),
            established: park.established,
            ...(park.page ? { page: park.page } : {}),
          }))}
          locale={locale}
          text={t.timeline}
        />
      </div>
      {pendingPark && (
        <p className="mt-12 max-w-3xl border-l border-clay-600 pl-5 text-sm leading-7 text-ink-soft">
          {fill(t.timeline.pending, {
            n: total + 1,
            name: text(pendingPark.nameZh),
            state: text(pendingPark.statesZh),
            date: dateOf(pendingPark.passed),
          })}
        </p>
      )}
      <div className="mt-16 max-w-3xl">
        <h3 className="font-serif text-2xl">{t.timeline.canadaTitle}</h3>
        <ul className="mt-4 border-t border-ink">
          {canadianParks.map((park) => (
            <li key={park.code} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5">
              <Link href={`/${locale}/parks/${park.code}`} className="font-serif text-base hover:text-clay-700">
                {text(park.nameZh)}
                <span className="ml-2 font-sans text-[10px] tracking-[0.12em] text-mute uppercase">{otherName(park.nameZh, park.nameEn)}</span>
              </Link>
              <span className="text-xs text-mute">
                {dateOf(park.established)} · {text(park.provinceZh)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-5 text-mute">{t.timeline.canadaNote}</p>
      </div>
      <p className="mt-12 text-[11px] leading-5 text-mute">{t.timeline.source}</p>
    </div>
  );
}
