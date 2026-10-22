import Link from "next/link";
import { notFound } from "next/navigation";
import { ParkLocator } from "@/components/park/park-locator";
import { ParkProfile } from "@/components/park/park-profile";
import { ParkYear } from "@/components/park/park-year";
import { TimeZoneBlock } from "@/components/park/time-zone-block";
import { IconArrowRight } from "@/components/icons";
import { CommonsImage } from "@/components/commons-image";
import { Reveal } from "@/components/site/reveal";
import { fill, otherName } from "@/i18n/format";
import { attractionHref, loadParkPage, parkContainer, parkPath } from "@/lib/park-page";

export default async function ParkOverviewPage({ params }: PageProps<"/[locale]/parks/[code]">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) notFound();
  const { park, dict, t, attractions, highlights, canada, visits } = view;

  return (
    <>
      <section className={`${parkContainer} grid gap-12 py-24 lg:grid-cols-12 lg:py-32`}>
        <p className="eyebrow text-mute lg:col-span-3">{t.introTitle}</p>
        <div className="lg:col-span-6">
          <Reveal>
            <p className="font-serif text-[clamp(1.3rem,2vw,1.8rem)] leading-[1.85]">{park.intro}</p>
          </Reveal>
          {canada && (
            <div className="mt-10 border-l border-clay-600 pl-5 text-sm leading-7 text-ink-soft">
              <p className="eyebrow text-clay-700">{t.canadaTitle}</p>
              <p className="mt-2">{t.canadaNote}</p>
            </div>
          )}
          {park.nonresidentSurcharge && (
            <div className="mt-10 border-l border-clay-600 pl-5 text-sm leading-7 text-ink-soft">
              <p className="eyebrow text-clay-700">{t.nonresidentTitle}</p>
              <p className="mt-2">{t.nonresidentNote}</p>
              <p className="mt-2">{t.nonresidentWaiver}</p>
              <a
                href="https://www.nps.gov/aboutus/nonresident-fees.htm"
                target="_blank"
                rel="noreferrer"
                className="link-line mt-3 inline-block text-xs text-mute"
              >
                {t.nonresidentSource}
              </a>
            </div>
          )}
        </div>
        <aside className="space-y-10 lg:col-span-3">
          <TimeZoneBlock park={park.code} timeZone={park.timeZone} locale={view.locale} dict={dict} />
          <ParkProfile code={park.code} visits={visits} locale={view.locale} dict={dict} />
          <div>
            <p className="eyebrow text-mute">{t.areasTitle}</p>
            <ul className="mt-4 border-t border-line text-sm">
              {Object.entries(park.areas).map(([key, name]) => (
                <li key={key} className="border-b border-line py-2.5">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      {highlights.length >= 3 && (
        <section className="border-t border-line">
          <div className={`${parkContainer} py-20 lg:py-28`}>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6 lg:mb-14">
              <div>
                <p className="eyebrow text-mute">{t.highlightsEyebrow}</p>
                <h2 className="mt-5 font-serif text-[clamp(1.9rem,3vw,2.8rem)] leading-tight">{t.highlightsTitle}</h2>
              </div>
              <Link href={parkPath(locale, code, "attractions")} className="link-line inline-flex items-center gap-2 text-xs tracking-[0.1em]">
                {fill(t.highlightsAll, { n: attractions.length })} <IconArrowRight />
              </Link>
            </div>
            <ol className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 sm:-mx-10 sm:px-10 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-8 lg:overflow-visible lg:px-0">
              {highlights.map((a, i) => (
                <li key={a.id} className={`w-[64vw] shrink-0 snap-start sm:w-[36vw] lg:w-auto ${i % 2 ? "lg:mt-16" : ""}`}>
                  <Link href={attractionHref(locale, code, a.id)} className="group block">
                    <Reveal image delay={i * 90} className="relative aspect-[3/4] overflow-hidden bg-paper-deep">
                      <CommonsImage
                        src={a.photo!.url}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 18vw, (min-width: 640px) 36vw, 64vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </Reveal>
                    <p className="mt-4 flex items-baseline gap-3">
                      <span className="font-serif text-sm text-clay-600 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-serif text-xl transition-colors duration-500 group-hover:text-clay-700">{a.nameZh}</span>
                    </p>
                    <p className="eyebrow mt-1.5 text-mute">{otherName(a.nameZh, a.nameEn)}</p>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <ParkLocator park={park} locale={view.locale} dict={dict} />
      <ParkYear park={park} locale={view.locale} dict={dict} />
    </>
  );
}
