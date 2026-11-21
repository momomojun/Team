import Link from "next/link";
import { notFound } from "next/navigation";
import { ParkLocator } from "@/components/park/park-locator";
import { ParkProfile } from "@/components/park/park-profile";
import { ParkYear } from "@/components/park/park-year";
import { TimeZoneBlock } from "@/components/park/time-zone-block";
import { CommonsImage } from "@/components/commons-image";
import { SectionTitle } from "@/components/site/section-title";
import { fill, otherName } from "@/i18n/format";
import { attractionHref, loadParkPage, parkContainer, parkPath } from "@/lib/park-page";

/** 字典里的标题是“Overview · 公园特色”这样中英两段：金色标题只要后面一段 */
const plainTitle = (title: string) => title.split(" · ").pop() ?? title;

export default async function ParkOverviewPage({ params }: PageProps<"/[locale]/parks/[code]">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) notFound();
  const { park, dict, t, attractions, highlights, canada, visits } = view;

  return (
    <>
      {/* 照着 Wabunka 的详情页：左边金色标题和正文，右边一栏基本情况 */}
      <section className={`${parkContainer} grid gap-14 py-16 lg:grid-cols-12 lg:gap-20 lg:py-24`}>
        <div className="lg:col-span-8">
          <SectionTitle>{plainTitle(t.introTitle)}</SectionTitle>
          <p className="max-w-3xl font-serif text-[17px] leading-[2.1] text-ink md:text-[18px]">{park.intro}</p>
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
        <aside className="space-y-10 lg:col-span-4 lg:border-l lg:border-line lg:pl-10">
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
        <section className={`${parkContainer} pb-20 lg:pb-28`}>
          <SectionTitle href={parkPath(locale, code, "attractions")} hint={fill(t.highlightsAll, { n: attractions.length })}>
            {t.highlightsTitle}
          </SectionTitle>
          <ol className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 sm:-mx-10 sm:px-10 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
            {highlights.map((a, i) => (
              <li key={a.id} className="w-[64vw] shrink-0 snap-start sm:w-[36vw] lg:w-auto">
                <Link href={attractionHref(locale, code, a.id)} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-paper-deep">
                    <CommonsImage
                      src={a.photo!.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 18vw, (min-width: 640px) 36vw, 64vw"
                      className="object-cover transition-[scale] duration-700 ease-(--ease-soft) group-hover:scale-[1.04]"
                    />
                  </div>
                  {/* 数字是园内热度的名次 */}
                  <p className="mt-4 flex items-baseline gap-2.5">
                    <span className="font-serif text-[13px] text-clay-600 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-serif text-[18px] transition-colors duration-300 group-hover:text-clay-600">{a.nameZh}</span>
                  </p>
                  <p className="mt-1 text-[12px] tracking-[0.04em] text-mute">{otherName(a.nameZh, a.nameEn)}</p>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <ParkLocator park={park} locale={view.locale} dict={dict} />
      <ParkYear park={park} locale={view.locale} dict={dict} />
    </>
  );
}
