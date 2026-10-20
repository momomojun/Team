import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Copilot 后台", robots: { index: false, follow: false } };

/**
 * 后台：Copilot 跑得怎么样（服务开没开、用的哪几个模型、排出行程的比例、出错、耗时、每个模型的调用和花费、最近几轮），
 * 每晚读 NPS 公告的情况。给仓库主人和组员自己看的，不放进导航，只有中文（不进英文翻译表）。
 * 数据经 /api/copilot/admin 从本机的 Copilot 服务和 GitHub 取
 */
export default async function AdminPage({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <AdminDashboard />;
}
