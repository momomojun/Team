import Link from "next/link";
import { IconChevronRight } from "@/components/icons";
import { googleSnapshotDate } from "@/data/attractions/google";
import { isSite, parks, regionOrder } from "@/data/parks";
import type { Locale } from "@/i18n/config";
import { localizePark } from "@/i18n/content";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";

/** 页脚：站名和页面导航，公园按片区分几栏排（几十座排成一长列太长），最后是数据来源和声明 */
export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.footer;
  const local = parks.map((park) => localizePark(park, locale));
  const groups = [
    ...regionOrder.map((region) => ({
      title: dict.regions[region],
      parks: local.filter((park) => park.region === region && !isSite(park)),
    })),
    { title: dict.nav.sites, parks: local.filter(isSite) },
  ].filter((group) => group.parks.length > 0);
  const pages = [
    { href: `/${locale}/plan`, label: dict.nav.plan },
    { href: `/${locale}/when`, label: dict.nav.when },
    { href: `/${locale}/activities`, label: dict.nav.activities },
    { href: `/${locale}/safety`, label: dict.nav.safety },
    { href: `/${locale}/routes`, label: dict.nav.routes },
    { href: `/${locale}/prices`, label: dict.nav.prices },
    { href: `/${locale}/rankings`, label: dict.nav.rankings },
  ];

  return (
    <footer data-header-tone="dark" className="cv-auto [--cv-h:900px] bg-coal text-white print:hidden">
      {/* 照着 Wabunka：炭灰底，中间是站名，下面一行页面链接；公园按片区分栏排在下面，最后是数据来源和声明 */}
      <div className="mx-auto max-w-[1216px] px-5 pt-20 pb-10 sm:px-10">
        <div className="text-center">
          <Link href={`/${locale}`} className="font-serif text-4xl tracking-[0.12em] sm:text-5xl">
            {dict.site.wordmark}
          </Link>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/60">{t.tagline}</p>
        </div>
        <nav aria-label={t.pagesTitle} className="mt-12">
          <ul className="flex flex-wrap justify-center gap-x-9 gap-y-4 font-serif text-[15px]">
            {pages.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className="nav-line inline-flex items-center gap-2 text-white/85 hover:text-white">
                  {page.label}
                  <IconChevronRight className="text-[10px] text-white/50" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-16 border-t border-white/12 pt-10">
          <div className="columns-2 gap-10 sm:columns-3 lg:columns-5 xl:columns-6">
            {groups.map((group) => (
              <div key={group.title} className="mb-8 break-inside-avoid">
                <p className="text-[11px] tracking-[0.14em] text-white/50">{group.title}</p>
                <ul className="mt-3 space-y-1.5">
                  {group.parks.map((park) => (
                    <li key={park.code}>
                      <Link
                        href={`/${locale}/parks/${park.code}`}
                        title={park.nameEn}
                        className="font-serif text-[14px] text-white/75 transition-colors duration-300 hover:text-gold"
                      >
                        {park.nameZh}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-white/12 pt-8 text-center text-xs leading-6 text-white/50">
          <p className="tracking-[0.14em] text-white/70">{t.dataTitle}</p>
          <p className="mx-auto mt-2 max-w-3xl">
            {t.sources} {fill(t.googleNote, { date: googleSnapshotDate })}
          </p>
          <p className="mt-4">{t.disclaimer}</p>
          <p className="mt-2">© 2026 {dict.site.name}</p>
        </div>
      </div>
    </footer>
  );
}
