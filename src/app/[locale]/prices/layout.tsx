import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PricesHashRedirect } from "@/components/prices/prices-hash-redirect";
import { SectionNav } from "@/components/site/section-nav";
import { headerPhoto } from "@/components/site/header-photo";
import { PageHeader } from "@/components/site/page-header";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: LayoutProps<"/[locale]/prices">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = getDictionary(locale);
  // 字符串标题会把上一级的标题模板清掉，子页面就少了站点名
  return { title: { default: dict.prices.title, template: `%s · ${dict.site.name}` } };
}

export default async function PricesLayout({ children, params }: LayoutProps<"/[locale]/prices">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = getDictionary(locale).prices;
  const base = `/${locale}/prices`;

  return (
    <div className="mx-auto max-w-[1600px] px-5 pt-14 pb-28 sm:px-10">
      <PricesHashRedirect />
      <PageHeader eyebrow={t.eyebrow} title={t.title} intro={t.intro} photo={headerPhoto("glac-going-to-the-sun-road", locale)} />
      <div className="mt-10">
        <SectionNav
          label={t.nav.label}
          inset
          items={[
            { id: "flights", label: t.nav.flights, href: base },
            { id: "car", label: t.nav.car, href: `${base}/car` },
            { id: "gas", label: t.nav.gas, href: `${base}/gas` },
          ]}
        />
      </div>
      <div className="mt-10">{children}</div>
      <p className="mt-16 text-[11px] leading-5 text-mute">{t.source}</p>
    </div>
  );
}
