import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActivitiesView } from "@/components/activities/activities-view";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";
import { ACTIVITY_MONTHS, parseActivityMonth } from "@/lib/activity-cards";

export const dynamicParams = false;

export function generateStaticParams() {
  return ACTIVITY_MONTHS.map((month) => ({ month: String(month) }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/activities/[month]">): Promise<Metadata> {
  const { locale, month: raw } = await params;
  const month = parseActivityMonth(raw);
  if (!hasLocale(locale) || !month) return {};
  const t = getDictionary(locale).activities;
  return { title: month === "all" ? t.allYearTitle : fill(t.monthTitle, { month }) };
}

/** 某个月的活动（all 是全年都有的） */
export default async function ActivitiesMonthPage({ params }: PageProps<"/[locale]/activities/[month]">) {
  const { locale, month: raw } = await params;
  const month = parseActivityMonth(raw);
  if (!hasLocale(locale) || !month) notFound();
  return <ActivitiesView locale={locale} month={month} />;
}
