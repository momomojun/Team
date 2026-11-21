"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { MobileMenu, ParksMenu, type MenuRegion, type MenuText } from "@/components/site/park-menu";
import { TripNavLink } from "@/components/trip/trip-nav-link";
import type { Locale } from "@/i18n/config";

function subscribe(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

const isScrolled = () => window.scrollY > 24;

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`nav-line ${active ? "is-active" : ""}`}>
      {label}
    </Link>
  );
}

export function SiteHeader({
  locale,
  wordmark,
  regions,
  text,
}: {
  locale: Locale;
  wordmark: string;
  /** 页头菜单里按片区列出的公园 */
  regions: MenuRegion[];
  text: MenuText;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // 顶上是整屏宽大图的页面（首页、全部公园、公园概览、什么时候去、灵感、榜单、价格）：页头先透明压在图上，往下滚再变成白底。
  // 公园的分页（景点、徒步……）没有大图
  const segments = pathname.split("/").filter(Boolean);
  const overHero =
    segments.length === 1 ||
    (segments[1] === "parks" && segments.length <= 3) ||
    ["when", "routes", "rankings", "prices"].includes(segments[1] ?? "");
  const scrolled = useSyncExternalStore(subscribe, isScrolled, () => false);
  const solid = !overHero || scrolled || menuOpen;

  return (
    <>
      <header
        // 换页过渡时页头固定不动（globals.css 的 site-header）
        style={{ viewTransitionName: "site-header" }}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,color,border-color] duration-300 ease-(--ease-soft) print:hidden ${
          solid
            ? "border-b border-line bg-paper text-ink"
            : "border-b border-transparent bg-gradient-to-b from-black/30 to-transparent text-white"
        }`}
      >
        {/* 11-21 改版第二批，照着 Wabunka：左边站名、紧跟着 4 项导航（公园、什么时候去、灵感、榜单），右边账号、简繁、菜单和金色的“开始规划”（带景点数）。
            压在大图上时透明、白字；往下滚或者在内页，变成白底墨字 */}
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-6 px-5 whitespace-nowrap sm:px-10">
          <div className="flex items-center gap-10 xl:gap-12">
            <Link href={`/${locale}`} className="font-serif text-xl tracking-[0.12em] sm:text-[26px]">
              {wordmark}
            </Link>
            <nav className="hidden items-center gap-7 font-serif text-[15px] tracking-[0.04em] lg:flex xl:gap-9">
              <ParksMenu locale={locale} regions={regions} text={text} onOpenChange={setMenuOpen} />
              <NavLink href={`/${locale}/when`} label={text.when} active={pathname === `/${locale}/when`} />
              <NavLink href={`/${locale}/routes`} label={text.routes} active={pathname === `/${locale}/routes`} />
              <NavLink
                href={`/${locale}/rankings`}
                label={text.rankings}
                active={pathname === `/${locale}/rankings` || pathname.startsWith(`/${locale}/rankings/`)}
              />
            </nav>
          </div>

          <div className="flex items-center justify-end gap-5 text-[13px] tracking-[0.06em] sm:gap-6">
            <span className="hidden sm:inline lg:hidden">
              <TripNavLink href={`/${locale}/plan`} label={text.plan} />
            </span>
            <span className="hidden lg:inline">
              <NavLink href={`/${locale}/account`} label={text.account} active={pathname === `/${locale}/account`} />
            </span>
            <LocaleSwitcher current={locale} />
            <MobileMenu locale={locale} wordmark={wordmark} regions={regions} text={text} />
            <TripNavLink
              href={`/${locale}/plan`}
              label={text.start}
              className={`hidden h-10 items-center gap-1.5 px-5 font-serif text-[15px] tracking-[0.04em] transition-colors duration-300 md:inline-flex ${
                solid ? "bg-gold text-on-gold hover:bg-gold-deep" : "border border-white/60 hover:bg-white hover:text-[#1a150e]"
              }`}
            />
          </div>
        </div>
      </header>
      {/* 没有大图的页面，内容从页头下方开始 */}
      {!overHero && <div aria-hidden className="h-16" />}
    </>
  );
}
