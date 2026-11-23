import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EvalReport } from "@/components/admin/eval-report";
import { hasLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/evals">): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "en" ? "Tests and evals" : "测试和评测", robots: { index: false, follow: false } };
}

/** 后台的“测试和评测”：每一轮测试的成绩和对比（11-22）。和后台一样不放进导航，从后台点进来；数据是静态的 */
export default async function AdminEvalsPage({ params }: PageProps<"/[locale]/admin/evals">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <EvalReport lang={locale === "en" ? "en" : "zh"} locale={locale} />;
}
