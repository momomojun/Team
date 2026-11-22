import Link from "next/link";
import { ActivityCard } from "@/components/activities/activity-card";
import { headerPhoto } from "@/components/site/header-photo";
import { PageHeader } from "@/components/site/page-header";
import { SectionTitle } from "@/components/site/section-title";
import { regionOrder } from "@/data/parks";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";
import { ACTIVITY_MONTHS, activityCards, type ActivityMonth } from "@/lib/activity-cards";

const container = "mx-auto max-w-[1216px]";
/** 这个月没有带照片的限时活动时，页头用这张 */
const FALLBACK_PHOTO = "yose-horsetail-fall";
const HIGHLIGHTS = 6;

/**
 * 活动页（/activities、/activities/月份）：上面一排月份，先列这个月最值得的（限时的、所在公园最热门的几个），
 * 再按片区列出这个月能参加的全部活动。页头照片用这个月最值得的第一个活动的景点照片，每个月不一样
 */
export function ActivitiesView({ locale, month }: { locale: Locale; month: ActivityMonth }) {
  const dict = getDictionary(locale);
  const t = dict.activities;
  const cards = activityCards(locale, month);
  const limited = cards.filter((card) => card.limited);
  const highlights = month === "all" ? [] : limited.slice(0, HIGHLIGHTS);
  const groups = regionOrder
    .map((region) => ({ id: region as string, label: dict.regions[region], cards: cards.filter((card) => card.region === region) }))
    .filter((group) => group.cards.length > 0);
  const lead = highlights.find((card) => card.attraction && headerPhoto(card.attraction, locale));
  const photo = (lead?.attraction && headerPhoto(lead.attraction, locale)) || headerPhoto(FALLBACK_PHOTO, locale);
  const label = (m: ActivityMonth) => (m === "all" ? dict.units.allYear : fill(dict.units.month, { m }));
  const grid = "grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3";
  const sizes = "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw";

  return (
    <div className="px-5 pb-24 sm:px-10">
      <PageHeader
        eyebrow={dict.nav.activities}
        title={month === "all" ? t.allYearTitle : fill(t.monthTitle, { month })}
        intro={t.intro}
        photo={photo}
      />

      {/* 月份：横着一排，窄屏可以滑 */}
      <nav aria-label={t.monthsLabel} className={`${container} no-scrollbar mt-8 flex gap-x-6 overflow-x-auto border-b border-line pb-3 font-serif text-[15px] whitespace-nowrap text-ink-soft`}>
        {ACTIVITY_MONTHS.map((m) => (
          <Link
            key={m}
            href={`/${locale}/activities/${m}`}
            aria-current={m === month ? "page" : undefined}
            className={`nav-line shrink-0 hover:text-ink ${m === month ? "is-active text-ink" : ""}`}
          >
            {label(m)}
          </Link>
        ))}
      </nav>
      <p className={`${container} mt-5 text-[13px] text-mute`}>
        {month === "all" ? fill(t.countAll, { n: cards.length }) : fill(t.count, { n: cards.length, k: limited.length })}
      </p>

      <div className={`${container} mt-14 space-y-20`}>
        {cards.length === 0 && <p className="text-ink-soft">{t.empty}</p>}

        {highlights.length >= 3 && (
          <section>
            <SectionTitle hint={t.highlightsHint}>{t.highlightsTitle}</SectionTitle>
            <ul className={grid}>
              {highlights.map((card) => (
                <li key={card.id}>
                  <ActivityCard card={card} dict={dict} sizes={sizes} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {groups.map((group) => (
          <section key={group.id} className="cv-auto [--cv-h:900px]">
            <SectionTitle id={`region-${group.id}`} hint={fill(t.regionCount, { n: group.cards.length })}>
              {group.label}
            </SectionTitle>
            <ul className={grid}>
              {group.cards.map((card) => (
                <li key={card.id}>
                  <ActivityCard card={card} dict={dict} sizes={sizes} anchor />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
