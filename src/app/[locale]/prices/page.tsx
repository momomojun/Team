import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PriceCenter } from "@/components/prices/price-center";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { loadPricesPage } from "@/lib/prices-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/prices">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).prices.nav.flights };
}

export default async function FlightsPage({ params }: PageProps<"/[locale]/prices">) {
  const { locale } = await params;
  const view = loadPricesPage(locale);
  if (!view) notFound();

  return <PriceCenter section="flights" locale={view.locale} airports={view.airports} parks={view.parks} text={view.text} />;
}
