import type { Park } from "@/data/parks";
import { climateYears } from "@/data/climate.generated";
import { localize } from "@/i18n/convert";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";
import { crowdLevel, crowdRatios, type CrowdLevel } from "@/lib/crowd";
import { parkSeason } from "@/lib/seasons";

const CROWD_DOTS: Record<CrowdLevel, number> = { quiet: 1, moderate: 2, busy: 3, peak: 4 };

/**
 * 概览里的“一年里”：12 个月排成一行，一眼比出什么时候去最好——最适合的月份、往年同期的最高最低气温（竖条从最低画到最高）、
 * 能去的景点占几成、人多不多（四个点）、下雨下雪的天数、这个月的特别活动。数据和“什么时候去”页一样（seasons.ts）
 */
export function ParkYear({ park, locale, dict }: { park: Park; locale: string; dict: Dictionary }) {
  const season = parkSeason(park);
  const t = dict.park.year;
  const units = dict.units;
  const en = locale === "en";
  const climates = season.months.map((month) => month.climate);
  const hasClimate = climates.every(Boolean);
  const lows = climates.map((c) => c?.low ?? 0);
  const highs = climates.map((c) => c?.high ?? 0);
  const floor = Math.min(...lows);
  const ceiling = Math.max(...highs);
  const span = Math.max(ceiling - floor, 1);
  const ratios = season.daily ? crowdRatios(season.daily) : null;
  const degrees = (c: number) => fill(units.degrees, { c: Math.round(c), f: Math.round((c * 9) / 5 + 32) });
  const label = (m: number) => {
    const text = fill(units.month, { m });
    return en ? text.slice(0, 3) : text;
  };
  const events = season.months.flatMap((month, i) => month.events.map((name) => ({ month: i + 1, name: localize(name, locale as Locale) })));
  // 同一个活动跨好几个月的，只列一次，写开头那个月
  const firstEvents = events.filter((event, i) => events.findIndex((other) => other.name === event.name) === i);

  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-10 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-mute">{t.eyebrow}</p>
            <h2 className="mt-5 font-serif text-[clamp(1.9rem,3vw,2.8rem)] leading-tight">{t.title}</h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-ink-soft">{localize(park.seasonNote, locale as Locale)}</p>
        </div>

        <div className="no-scrollbar -mx-5 mt-12 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[760px] table-fixed border-collapse text-center text-xs">
            <colgroup>
              <col className="w-28" />
              {season.months.map((_, i) => (
                <col key={i} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="sr-only">
                  {t.month}
                </th>
                {season.months.map((month, i) => (
                  <th key={i} scope="col" className={`border-b pb-3 font-normal ${month.best ? "border-clay-600 text-ink" : "border-line text-mute"}`}>
                    <span className="block font-serif text-base tabular-nums lining-nums">{label(i + 1)}</span>
                    <span className={`mt-1 block text-[10px] tracking-[0.12em] ${month.best ? "text-clay-700" : "invisible"}`}>{t.best}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hasClimate && (
                <tr>
                  <th scope="row" className="py-4 pr-3 text-left align-middle font-normal text-mute">
                    {t.temp}
                  </th>
                  {climates.map((c, i) => (
                    <td key={i} className="py-4 align-top">
                      <span className="block tabular-nums text-ink">{degrees(c!.high)}</span>
                      <span className="relative mx-auto my-1.5 block h-20 w-1.5 bg-line/50">
                        <span
                          className={`absolute inset-x-0 rounded-full ${c!.high >= 35 ? "bg-clay-700" : c!.high <= 8 ? "bg-[#5b7a99]" : "bg-clay-400"}`}
                          style={{ bottom: `${((c!.low - floor) / span) * 100}%`, top: `${((ceiling - c!.high) / span) * 100}%` }}
                        />
                      </span>
                      <span className="block tabular-nums text-mute">{degrees(c!.low)}</span>
                    </td>
                  ))}
                </tr>
              )}
              <tr className="border-t border-line">
                <th scope="row" className="py-4 pr-3 text-left font-normal text-mute">
                  {t.open}
                </th>
                {season.months.map((month, i) => (
                  <td key={i} className="py-4">
                    <span className="mx-auto block h-1.5 w-[70%] bg-line/60">
                      <span className="block h-full bg-[#5f7a4a]" style={{ width: `${Math.round(month.open * 100)}%` }} />
                    </span>
                    <span className="mt-1.5 block tabular-nums text-ink-soft">{Math.round(month.open * 100)}%</span>
                  </td>
                ))}
              </tr>
              {ratios && (
                <tr className="border-t border-line">
                  <th scope="row" className="py-4 pr-3 text-left font-normal text-mute">
                    {t.crowd}
                  </th>
                  {ratios.map((ratio, i) => {
                    const level = crowdLevel(ratio);
                    return (
                      <td key={i} className="py-4" title={dict.park.year.crowdLevels[level]}>
                        <span className="inline-flex gap-0.5" aria-label={dict.park.year.crowdLevels[level]}>
                          {[1, 2, 3, 4].map((dot) => (
                            <span key={dot} className={`size-1.5 rounded-full ${dot <= CROWD_DOTS[level] ? "bg-ink" : "bg-line"}`} />
                          ))}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              )}
              {hasClimate && (
                <tr className="border-t border-line">
                  <th scope="row" className="py-4 pr-3 text-left font-normal text-mute">
                    {t.wet}
                  </th>
                  {climates.map((c, i) => (
                    <td key={i} className="py-4 tabular-nums text-ink-soft">
                      {Math.round(c!.wetDays)}
                      {c!.snowDays >= 1 && <span className="block text-[10px] text-[#5b7a99]">{fill(t.snow, { n: Math.round(c!.snowDays) })}</span>}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {firstEvents.length > 0 && (
            <div className="lg:col-span-7">
              <p className="eyebrow text-mute">{t.events}</p>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
                {firstEvents.slice(0, 10).map((event) => (
                  <li key={event.name}>
                    <span className="mr-2 font-serif text-clay-700 tabular-nums lining-nums">{label(event.month)}</span>
                    {event.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className={`text-[11px] leading-5 text-mute ${firstEvents.length > 0 ? "lg:col-span-5" : "lg:col-span-12"}`}>
            {fill(t.note, { years: climateYears })}
          </p>
        </div>
      </div>
    </section>
  );
}
