import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActivitiesView } from "@/components/activities/activities-view";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// 默认显示这个月的，页面每天重新生成一次
export const revalidate = 86400;

export async function generateMetadata({ params }: PageProps<"/[locale]/activities">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).activities.title };
}

/** 公园里的活动：默认这个月，上面的月份点进 /activities/月份 */
export default async function ActivitiesPage({ params }: PageProps<"/[locale]/activities">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <ActivitiesView locale={locale} month={new Date().getMonth() + 1} />;
}
