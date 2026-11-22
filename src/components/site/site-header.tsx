"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { MobileMenu, ParksMenu, type MenuRegion, type MenuText } from "@/components/site/park-menu";
import { TripNavLink } from "@/components/trip/trip-nav-link";
import type { Locale } from "@/i18n/config";

/** 换页以后页面内容变了、但不一定滚动：派这个事件让页头重新看一眼下面是深色还是浅色 */
const RECHECK = "site-header-recheck";

function subscribe(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  window.addEventListener("resize", callback);
  window.addEventListener(RECHECK, callback);
  return () => {
    window.removeEventListener("scroll", callback);
    window.removeEventListener("resize", callback);
    window.removeEventListener(RECHECK, callback);
  };
}

/**
 * 页头下面那一段是深色还是浅色：深色的区块（.theme-dark，或者写了 data-header-tone="dark" 的大图页头、页脚）上页头变成深色半透明，
 * 浅色的上面是白底。像 Apple 的页头那样跟着内容走，首页从深色滚到米色那一段，页头也跟着换（11-21 仓库主人觉得深色页面上一条白页头太突兀）
 */
function toneUnder(): "dark" | "light" {
  for (const element of document.elementsFromPoint(window.innerWidth / 2, 72)) {
    if (element.closest("header.site-header")) continue;
    const zone = element.closest<HTMLElement>("[data-header-tone], .theme-dark, .theme-light");
    if (!zone) return "light";
    return (zone.dataset.headerTone ?? (zone.classList.contains("theme-dark") ? "dark" : "light")) === "dark" ? "dark" : "light";
  }
  return "light";
}

/** "top"：还在页面顶上（大图页面上页头透明）；否则是下面那一段的深浅 */
const headerState = () => `${window.scrollY > 24 ? "scrolled" : "top"}-${toneUnder()}`;

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
  // 顶上是整屏宽大图的页面（首页、全部公园、公园概览、什么时候去、活动、灵感、榜单、价格）：页头先透明压在图上，往下滚再变成实底。
  // 公园的分页（景点、徒步……）没有大图
  const segments = pathname.split("/").filter(Boolean);
  const overHero =
    segments.length === 1 ||
    (segments[1] === "parks" && segments.length <= 3) ||
    ["when", "activities", "routes", "rankings", "prices"].includes(segments[1] ?? "");
  const state = useSyncExternalStore(subscribe, headerState, () => "top-light");
  const scrolled = state.startsWith("scrolled");
  const solid = !overHero || scrolled || menuOpen;
  // 公园菜单展开时是白色的面板，页头跟着用白底
  const dark = solid && !menuOpen && state.endsWith("dark");

  // 换页以后等新页面画出来再看一眼
  useEffect(() => {
    const frame = requestAnimationFrame(() => window.dispatchEvent(new Event(RECHECK)));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <>
      <header
        // 换页过渡时页头固定不动（globals.css 的 site-header）
        style={{ viewTransitionName: "site-header" }}
        className={`site-header fixed inset-x-0 top-0 z-50 transition-[background-color,color,border-color] duration-500 ease-(--ease-soft) print:hidden ${
          dark
            ? "border-b border-white/10 bg-night/85 text-white backdrop-blur-md"
            : solid
              ? "border-b border-line bg-paper text-ink"
              : "border-b border-transparent bg-gradient-to-b from-black/30 to-transparent text-white"
        }`}
      >
        {/* 11-21 改版第二批，照着 Wabunka：左边站名、紧跟着 5 项导航（公园、什么时候去、活动、灵感、榜单），右边账号、简繁、菜单和金色的“开始规划”（带景点数）。
            压在大图上时透明、白字；往下滚或者在内页，深色区块上是深色半透明、浅色区块上是白底墨字 */}
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-6 px-5 whitespace-nowrap sm:px-10">
          <div className="flex items-center gap-10 xl:gap-12">
            <Link href={`/${locale}`} className="font-serif text-xl tracking-[0.12em] sm:text-[26px]">
              {wordmark}
            </Link>
            <nav className="hidden items-center gap-7 font-serif text-[15px] tracking-[0.04em] lg:flex xl:gap-9">
              <ParksMenu locale={locale} regions={regions} text={text} onOpenChange={setMenuOpen} />
              <NavLink href={`/${locale}/when`} label={text.when} active={pathname === `/${locale}/when`} />
              <NavLink
                href={`/${locale}/activities`}
                label={text.activities}
                active={pathname === `/${locale}/activities` || pathname.startsWith(`/${locale}/activities/`)}
              />
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
