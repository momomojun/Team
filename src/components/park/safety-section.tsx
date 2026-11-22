import Link from "next/link";
import type { Hazard } from "@/data/attractions/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";
import type { SafetyCard } from "@/lib/safety";

type SafetyText = Dictionary["safety"];

/** 一种危险：这里具体在哪、实际多常见、怎么防、遇到了怎么办（点开）、官方通报的事件、来源 */
export function SafetyHazardCard({ card, t, parkLinks }: { card: SafetyCard; t: SafetyText; parkLinks?: { code: string; name: string; href: string }[] }) {
  return (
    <article id={`hazard-${card.id}`} className="scroll-mt-28 border border-line bg-paper p-6 md:p-7">
      <h3 className="font-serif text-[21px] leading-snug">{card.title}</h3>
      {card.here && <p className="mt-3 text-[15px] leading-7 text-ink">{card.here}</p>}
      <p className="mt-3 text-[14px] leading-7 text-ink-soft">{card.what}</p>
      {card.prevent.length > 0 && (
        <div className="mt-5">
          <p className="text-[12px] tracking-[0.1em] text-clay-600">{t.prevent}</p>
          <ul className="mt-2 space-y-1.5 text-[14px] leading-7">
            {card.prevent.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span aria-hidden className="mt-[0.8em] h-px w-3 shrink-0 bg-clay-500" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {card.ifHappens.length > 0 && (
        <details className="mt-5 border-t border-line pt-4">
          <summary className="cursor-pointer text-[13px] tracking-[0.06em] text-clay-600 marker:text-clay-500">{t.ifHappens}</summary>
          <ul className="mt-3 space-y-1.5 text-[14px] leading-7">
            {card.ifHappens.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span aria-hidden className="mt-[0.8em] h-px w-3 shrink-0 bg-clay-500" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {card.incidents.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[12px] tracking-[0.1em] text-mute">{t.incidents}</p>
          <ul className="mt-2 space-y-2 text-[13px] leading-6 text-ink-soft">
            {card.incidents.map((incident) => (
              <li key={`${incident.date}-${incident.url}`}>
                <span className="mr-2 tabular-nums text-mute">{incident.date}</span>
                {incident.summary}{" "}
                <a href={incident.url} target="_blank" rel="noreferrer" className="link-line whitespace-nowrap text-[12px]">
                  {incident.news ? t.newsReport : t.officialReport}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {parkLinks && parkLinks.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[12px] tracking-[0.1em] text-mute">{t.whichParks}</p>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-[13px]">
            {parkLinks.map((park) => (
              <Link key={park.code} href={park.href} className="link-line">
                {park.name}
              </Link>
            ))}
          </p>
        </div>
      )}
      <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mute">
        <span>{t.sources}</span>
        {card.sources.map((source) => (
          <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="link-line">
            {source.title}
          </a>
        ))}
      </p>
    </article>
  );
}

/** 公园页的“安全”：这座公园要注意的危险，再按景点列出标了危险的（同行适合度里的） */
export function SafetySection({
  cards,
  groups,
  hazardLabels,
  t,
  official,
  generalHref,
  hrefFor,
  checked,
}: {
  cards: SafetyCard[];
  groups: { hazard: Hazard; stops: { id: string; name: string; note?: string }[] }[];
  hazardLabels: Record<Hazard, string>;
  t: SafetyText;
  official?: string;
  generalHref: string;
  hrefFor: (id: string) => string;
  checked: string;
}) {
  return (
    <div>
      <div className="mb-12 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h2 className="section-title">{t.parkTitle}</h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-soft">{t.parkIntro}</p>
        </div>
        <div className="space-y-2 self-end border-l border-clay-600 pl-5 text-[13px] leading-6 lg:col-span-4">
          {official && (
            <p>
              <a href={official} target="_blank" rel="noreferrer" className="link-line">
                {t.official}
              </a>
            </p>
          )}
          <p>
            <Link href={generalHref} className="link-line">
              {t.general}
            </Link>
          </p>
          <p className="text-mute">{fill(t.checked, { date: checked })}</p>
        </div>
      </div>

      {cards.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <SafetyHazardCard key={card.id} card={card} t={t} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-soft">{t.noneListed}</p>
      )}

      {groups.length > 0 && (
        <section className="mt-20">
          <h2 className="section-title">{t.stopsTitle}</h2>
          <p className="mt-5 mb-8 max-w-2xl text-sm leading-7 text-ink-soft">{t.stopsIntro}</p>
          <div className="grid gap-x-10 gap-y-10 lg:grid-cols-2">
            {groups.map((group) => (
              <div key={group.hazard}>
                <p className="border-b border-line pb-2 font-serif text-[17px]">
                  {hazardLabels[group.hazard]}
                  <span className="ml-2 text-[12px] text-mute">{fill(t.stopsCount, { n: group.stops.length })}</span>
                </p>
                <ul className="divide-y divide-line">
                  {group.stops.map((stop) => (
                    <li key={stop.id} className="py-3">
                      <a href={hrefFor(stop.id)} className="font-serif text-[15px] hover:text-clay-600">
                        {stop.name}
                      </a>
                      {stop.note && <p className="mt-1 text-[13px] leading-6 text-ink-soft">{stop.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
