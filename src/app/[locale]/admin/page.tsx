import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { hasLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "en" ? "Copilot dashboard" : "Copilot 后台", robots: { index: false, follow: false } };
}

/**
 * 后台：Copilot 跑得怎么样（模型调用架构图、服务开没开、用的哪几个模型、排出行程的比例、出错、耗时、每个模型的调用和花费、最近几轮），
 * 每晚读 NPS 公告的情况。给仓库主人、组员和老师看的，不放进导航。/en/admin 是英文版（10-22，给老师看），
 * 字写在组件里，不进网站的翻译表；繁体页面也显示简体。数据经 /api/copilot/admin 从 Copilot 服务和 GitHub 取
 */
export default async function AdminPage({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <AdminDashboard lang={locale === "en" ? "en" : "zh"} />;
}
