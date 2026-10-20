import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HonorsSection } from "@/components/rankings/honors-sections";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { loadRankingsPage } from "@/lib/rankings-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/rankings/honors">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).rankings.nav.honors };
}

export default async function HonorsPage({ params }: PageProps<"/[locale]/rankings/honors">) {
  const { locale } = await params;
  const view = loadRankingsPage(locale);
  if (!view || !view.hasHonors) notFound();
  const { dict, t, text, worldHeritage, darkSky, names, checked } = view;

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-10 lg:py-24">
      <p className="eyebrow text-mute">{t.honors.eyebrow}</p>
      <h2 className="mt-5 font-serif text-[clamp(2rem,3.5vw,3.2rem)] leading-tight">{t.honors.title}</h2>
      <div className="mt-12">
        <HonorsSection
          units={dict.units}
          heritage={Object.fromEntries(Object.entries(worldHeritage).map(([code, site]) => [code, { ...site, nameZh: text(site.nameZh) }]))}
          darkSky={darkSky}
          names={names}
          locale={locale}
          text={t}
          checked={checked}
        />
      </div>
    </div>
  );
}
