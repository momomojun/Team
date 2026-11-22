import Link from "next/link";
import { CommonsImage } from "@/components/commons-image";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatMonths, otherName } from "@/i18n/format";
import type { ActivityCardData } from "@/lib/activity-cards";

/**
 * 一个活动（照着 Wabunka 的体验卡片）：照片、金色的公园名、衬线字的活动名、哪几个月；限时的照片上一块金色角标。
 * 首页用简短的（`href` 指向活动页里这一条），活动页用完整的：今年的特殊情况、怎么参加（点开看）、景点和官方页面
 */
export function ActivityCard({
  card,
  dict,
  href,
  sizes,
  anchor,
}: {
  card: ActivityCardData;
  dict: Dictionary;
  /** 简短版：整张卡片点进去的地址 */
  href?: string;
  sizes: string;
  /** 活动页里给这一条加锚点（同一条在“最值得的”里再出现一次时不加） */
  anchor?: boolean;
}) {
  const t = dict.activities;
  const months = card.months ? formatMonths(card.months, dict.units) : dict.units.allYear;
  const photo = (
    <div className="relative aspect-[3/2] overflow-hidden bg-paper-deep">
      {card.image && (
        <CommonsImage
          src={card.image}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-[scale] duration-700 ease-(--ease-soft) group-hover:scale-[1.04]"
        />
      )}
      {card.limited && <span className="absolute top-3 left-3 bg-gold px-2 py-0.5 text-[11px] tracking-[0.08em] text-on-gold">{t.limited}</span>}
    </div>
  );
  const heading = (
    <>
      <p className="mt-4 flex items-center gap-3 text-[11px] tracking-[0.14em] text-clay-600">
        {card.parkName}
        <span aria-hidden className="h-px w-8 bg-clay-500" />
      </p>
      <h3 className="mt-2 font-serif text-[18px] leading-snug transition-colors duration-300 group-hover:text-clay-600">{card.nameZh}</h3>
      <p className="mt-1 text-[12px] tracking-[0.04em] text-mute">
        {[otherName(card.nameZh, card.nameEn), months].filter(Boolean).join(" · ")}
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group block">
        {photo}
        {heading}
        <p className="mt-3 line-clamp-3 text-[14px] leading-7 text-ink-soft">{card.summary}</p>
      </Link>
    );
  }

  return (
    <article id={anchor ? `activity-${card.id}` : undefined} className="group scroll-mt-24">
      <a href={card.attractionHref ?? card.parkHref} className="block">
        {photo}
        {heading}
      </a>
      <p className="mt-3 text-[14px] leading-7 text-ink-soft">{card.summary}</p>
      {card.status && <p className="mt-2 text-[13px] leading-6 text-alert">{card.status}</p>}
      {card.booking && (
        <details className="mt-3 border-t border-line pt-3 text-[13px]">
          <summary className="cursor-pointer tracking-[0.04em] text-clay-600 marker:text-clay-500">{t.howTo}</summary>
          <p className="mt-2 leading-6 text-ink-soft">{card.booking}</p>
        </details>
      )}
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] tracking-[0.06em]">
        {card.attractionHref && (
          <a href={card.attractionHref} className="link-line">
            {t.seeAttraction}
          </a>
        )}
        <a href={card.parkHref} className="link-line">
          {t.parkActivities}
        </a>
        {card.url && (
          <a href={card.url} target="_blank" rel="noreferrer" className="link-line">
            {t.official}
          </a>
        )}
      </p>
    </article>
  );
}
