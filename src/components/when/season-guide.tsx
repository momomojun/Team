"use client";

import Link from "next/link";
import { useState } from "react";
import { CommonsImage } from "@/components/commons-image";
import { IconArrowRight } from "@/components/icons";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, formatBig, formatMonths } from "@/i18n/format";
import { addDays } from "@/lib/dates";
import { recordYears, ROAD_LIKELY } from "@/lib/roads";
import { combine, WINDOW_DAYS, type ParkWindow, type Verdict } from "@/lib/season-score";
import type { ParkSeason } from "@/lib/seasons";
import { useToday } from "@/lib/use-json";

type Reason = { text: string; good: boolean };

export type SeasonText = Dictionary["when"] & { units: Dictionary["units"] };

const degrees = (value: number) => {
  const rounded = Math.round(value);
  return rounded < 0 ? `−${Math.abs(rounded)}` : String(rounded);
};
/** 摄氏度 → 华氏度（英文版用） */
const degreesF = (celsius: number) => degrees((celsius * 9) / 5 + 32);

function reasonsOf(item: ParkWindow, text: SeasonText): Reason[] {
  const t = text.reasons;
  const reasons: Reason[] = [];
  reasons.push(
    item.best
      ? { text: t.best, good: true }
      : { text: fill(t.notBest, { months: formatMonths(item.park.bestMonths, text.units) }), good: false },
  );
  const names = (list: string[]) => (list.length > 3 ? fill(t.andMore, { names: list.slice(0, 3).join(text.units.listSep), n: list.length }) : list.join(text.units.listSep));
  if (item.closedMustSee.length === 0) reasons.push({ text: item.open >= 0.9 ? t.allOpen : t.mustSeeOpen, good: true });
  else if (item.open >= 0.6) reasons.push({ text: fill(t.someClosed, { names: names(item.closedMustSee) }), good: false });
  else reasons.push({ text: fill(t.mostClosed, { names: names(item.closedMustSee) }), good: false });
  const day = (md: string) => fill(text.dayLabel, { m: Number(md.slice(0, 2)), d: Number(md.slice(3, 5)) });
  for (const { road, date, status, chance } of item.roads) {
    const values = { road: item.park.roadNames[road] ?? road, date: day(date.slice(5, 10)), year: date.slice(0, 4) };
    const reason =
      status.kind === "odds"
        ? fill(status.phase === "opening" ? t.roadOpening : t.roadClosing, {
            ...values,
            years: recordYears(status.known, t),
            k: status.open,
          })
        : status.kind === "notYet"
          ? fill(t.roadNotYet, { ...values, opened: day(status.opened) })
          : status.kind === "closed"
            ? fill(t.roadClosed, { ...values, closed: day(status.closed) })
            : null;
    if (reason) reasons.push({ text: reason, good: chance >= ROAD_LIKELY });
  }
  const climate = item.climate;
  if (climate) {
    if (climate.hottest >= 33) reasons.push({ text: fill(t.hot, { high: degrees(climate.hottest), highF: degreesF(climate.hottest) }), good: false });
    else if (climate.high < 5) reasons.push({ text: fill(t.cold, { high: degrees(climate.high), highF: degreesF(climate.high) }), good: false });
    else if (climate.high >= 15) reasons.push({ text: t.comfortable, good: true });
    else reasons.push({ text: fill(t.cool, { low: degrees(climate.low), lowF: degreesF(climate.low) }), good: false });
    if (climate.snowDays >= 4) reasons.push({ text: fill(t.snowy, { n: Math.round(climate.snowDays) }), good: false });
    else if (climate.wetDays >= 10) reasons.push({ text: fill(t.rainy, { n: Math.round(climate.wetDays) }), good: false });
  }
  if (item.events.length) reasons.push({ text: fill(t.events, { names: item.events.slice(0, 3).join(text.units.listSep) }), good: true });
  const crowd = item.crowd;
  if (crowd) {
    // 往下取整：0.79 是“人比较多”，不能说成“8 成”（八成以上算最挤）
    const p = Math.floor(crowd.ratio * 10);
    const n = formatBig(crowd.perDay, text.units);
    if (crowd.level === "peak") reasons.push({ text: fill(t.crowdPeak, { n }), good: false });
    else if (crowd.level === "busy") reasons.push({ text: fill(t.crowdBusy, { p, pct: p * 10 }), good: false });
    else if (crowd.level === "moderate") reasons.push({ text: fill(t.crowdModerate, { p, pct: p * 10 }), good: true });
    else reasons.push({ text: t.crowdQuiet, good: true });
  }
  return reasons;
}

export function SeasonGuide({ parks, locale, text }: { parks: ParkSeason[]; locale: string; text: SeasonText }) {
  const today = useToday();
  const [picked, setPicked] = useState<string | null>(null);
  const [wholeMonth, setWholeMonth] = useState<number | null>(null);
  const start = picked ?? today;

  // 这几天分别在哪个月
  const weights = new Map<number, number>();
  let label = "";
  if (wholeMonth !== null) {
    weights.set(wholeMonth, 1);
    label = fill(text.monthLabel, { m: wholeMonth });
  } else if (start) {
    const end = addDays(start, WINDOW_DAYS - 1);
    for (let i = 0; i < WINDOW_DAYS; i++) {
      const month = Number(addDays(start, i).slice(5, 7));
      weights.set(month, (weights.get(month) ?? 0) + 1);
    }
    const md = (date: string) => fill(text.dayLabel, { m: Number(date.slice(5, 7)), d: Number(date.slice(8, 10)) });
    label = fill(text.rangeLabel, { from: md(start), to: md(end) });
  }

  // 选了具体日期：这几天的日期（季节性道路按天算）
  const dates = wholeMonth === null && start ? Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(start, i)) : null;
  const results = weights.size ? parks.map((park) => combine(park, weights, dates)).sort((a, b) => b.score - a.score) : [];
  const groups: { verdict: Verdict; items: ParkWindow[] }[] = (["great", "ok", "poor"] as Verdict[]).map((verdict) => ({
    verdict,
    items: results.filter((item) => item.verdict === verdict),
  }));
  const planHref = (code: string) =>
    `/${locale}/plan?park=${code}${wholeMonth === null && start ? `&date=${start}` : ""}`;

  const chip = (active: boolean) =>
    `border px-3 py-1.5 text-xs tabular-nums transition-colors ${
      active ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink hover:border-ink"
    }`;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-10 gap-y-5 border-y border-line py-6">
        <label className="eyebrow text-mute">
          {text.dateField}
          <input
            type="date"
            value={wholeMonth === null ? (start ?? "") : ""}
            onChange={(event) => {
              setPicked(event.target.value || null);
              setWholeMonth(null);
            }}
            className="mt-2 block border-b border-ink/30 bg-transparent py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </label>
        <div>
          <p className="eyebrow text-mute">{text.monthField}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              className={chip(wholeMonth === null && picked === null)}
              onClick={() => {
                setPicked(null);
                setWholeMonth(null);
              }}
            >
              {text.now}
            </button>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <button key={m} type="button" className={chip(wholeMonth === m)} onClick={() => setWholeMonth(m)}>
                {fill(text.monthChip, { m })}
              </button>
            ))}
          </div>
        </div>
      </div>

      {label && (
        <p className="mt-8 font-serif text-[clamp(1.4rem,2.4vw,2rem)]">
          {fill(text.headline, { when: label })}
        </p>
      )}
      <p className="mt-2 text-xs leading-6 text-mute">{text.method}</p>

      {results.length === 0 ? (
        <p className="mt-10 text-sm text-mute">{text.loading}</p>
      ) : (
        <div className="mt-10 space-y-14">
          {groups.map(({ verdict, items }) =>
            items.length === 0 ? null : (
              <section key={verdict}>
                <h2 className="flex items-baseline gap-3 border-t border-ink pt-4">
                  <span className={`font-serif text-2xl ${verdict === "poor" ? "text-mute" : ""}`}>{text.verdicts[verdict]}</span>
                  <span className="text-xs text-mute">{fill(text.count, { n: items.length })}</span>
                </h2>
                <p className="mt-1 text-xs text-mute">{text.verdictHints[verdict]}</p>
                <ul className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <li key={item.park.code} className="group/card flex flex-col">
                      {/* 公园首图；不太合适的公园照片褪成灰色 */}
                      {item.park.photo && (
                        <Link
                          href={`/${locale}/parks/${item.park.code}`}
                          tabIndex={-1}
                          aria-hidden
                          className="relative mb-4 block aspect-[2/1] overflow-hidden bg-paper-deep md:aspect-[16/9]"
                        >
                          <CommonsImage
                            src={item.park.photo}
                            alt=""
                            fill
                            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 46vw, 100vw"
                            className={`object-cover transition-[scale,filter] duration-700 group-hover/card:scale-105 ${
                              item.verdict === "poor" ? "grayscale-[85%] group-hover/card:grayscale-0" : ""
                            }`}
                          />
                        </Link>
                      )}
                      <div className="flex items-baseline justify-between gap-3">
                        <Link href={`/${locale}/parks/${item.park.code}`} className="group">
                          <span className="font-serif text-xl group-hover:text-clay-700">{item.park.nameZh}</span>
                          <span className="ml-2 text-[11px] tracking-[0.14em] text-mute uppercase">{item.park.nameEn}</span>
                        </Link>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">{item.park.tagline}</p>
                      {item.climate && (
                        // 往年同期的天气：三个大数字，读屏读整句
                        <dl
                          className="mt-4 grid grid-cols-3 border-y border-line pt-2 pb-3"
                          aria-label={fill(text.climate, {
                            high: degrees(item.climate.high),
                            low: degrees(item.climate.low),
                            highF: degreesF(item.climate.high),
                            lowF: degreesF(item.climate.low),
                            n: Math.round(item.climate.wetDays),
                          })}
                        >
                          <div className="col-span-3 mb-2 text-[11px] tracking-[0.08em] text-mute" aria-hidden>
                            {text.climateTitle}
                          </div>
                          {[
                            [text.climateHigh, fill(text.units.degrees, { c: degrees(item.climate.high), f: degreesF(item.climate.high) })],
                            [text.climateLow, fill(text.units.degrees, { c: degrees(item.climate.low), f: degreesF(item.climate.low) })],
                            [text.climateWet, fill(text.climateDays, { n: Math.round(item.climate.wetDays) })],
                          ].map(([label, value]) => (
                            <div key={label} className="flex flex-col-reverse" aria-hidden>
                              <dt className="mt-1 text-[11px] tracking-[0.08em] text-mute">{label}</dt>
                              <dd className="font-serif text-2xl leading-none tabular-nums">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <ul className="mt-3 space-y-1 text-xs leading-5">
                        {reasonsOf(item, text).map((reason) => (
                          <li key={reason.text} className={`flex gap-2 ${reason.good ? "text-pine-700" : "text-clay-700"}`}>
                            <span aria-hidden>{reason.good ? "✓" : "×"}</span>
                            <span>{reason.text}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-[11px] leading-5 text-mute">{item.park.seasonNote}</p>
                      {item.verdict !== "poor" && (
                        <Link
                          href={planHref(item.park.code)}
                          className="link-line mt-auto inline-flex w-fit items-center gap-1 pt-4 text-xs tracking-[0.1em]"
                        >
                          {text.plan} <IconArrowRight />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}
      <p className="mt-14 text-[11px] leading-5 text-mute">{text.source}</p>
    </div>
  );
}
