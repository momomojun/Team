"use client";

import Link from "next/link";
import { IconArrowRight } from "@/components/icons";
import { fill } from "@/i18n/format";
import { tripIds, useTrip } from "@/lib/trip-store";

/** 已经有行程时，首页最后“开始规划”那张卡片里显示“继续你的行程” */
export function ContinueTrip({
  href,
  parkNames,
  locale,
  text,
}: {
  href: string;
  /** 公园代码 → 名称 */
  parkNames: Record<string, string>;
  locale: string;
  text: { continueTitle: string; continueSummary: string; continueStart: string; continueMonth: string; continueCta: string };
}) {
  const trip = useTrip();
  const ids = tripIds(trip);
  if (ids.length === 0) return null;

  // 景点 id 统一以公园代码开头
  const parks = [...new Set(ids.map((id) => id.split("-")[0]))].map((code) => parkNames[code] ?? code);
  const start = trip.startDate
    ? new Intl.DateTimeFormat(locale === "zh-Hant" ? "zh-TW" : locale === "en" ? "en-US" : "zh-CN", {
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${trip.startDate}T00:00:00Z`))
    : null;
  // 只定了月份（自动生成攻略时常见）
  const when = start ? fill(text.continueStart, { date: start }) : trip.month ? fill(text.continueMonth, { m: trip.month }) : null;

  return (
    <Link href={href} className="group mt-8 block w-full max-w-xs border-t border-line pt-5 text-left text-ink">
      <p className="text-[12px] tracking-[0.1em] text-mute">{text.continueTitle}</p>
      <p className="mt-2 font-serif text-lg leading-snug">{parks.join(" · ")}</p>
      <p className="mt-1 text-[13px] text-ink-soft">
        {fill(text.continueSummary, { n: ids.length, days: trip.dayCount })}
        {when && ` · ${when}`}
      </p>
      <p className="mt-3 inline-flex items-center gap-2 text-[13px] text-clay-600">
        {text.continueCta}
        <IconArrowRight className="transition-transform duration-500 group-hover:translate-x-1" />
      </p>
    </Link>
  );
}
