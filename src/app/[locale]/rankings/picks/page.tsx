import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PicksSection } from "@/components/rankings/honors-sections";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { loadRankingsPage } from "@/lib/rankings-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/rankings/picks">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).rankings.nav.picks };
}

export default async function PicksPage({ params }: PageProps<"/[locale]/rankings/picks">) {
  const { locale } = await params;
  const view = loadRankingsPage(locale);
  if (!view || !view.hasPicks) notFound();
  const { dict, t, text, mediaPicks, usNews, names, checked } = view;

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-10 lg:py-24">
      <p className="eyebrow text-mute">{t.picks.eyebrow}</p>
      <h2 className="mt-5 font-serif text-[clamp(2rem,3.5vw,3.2rem)] leading-tight">{t.picks.title}</h2>
      <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-soft">{t.picks.intro}</p>
      <div className="mt-12">
        <PicksSection
          units={dict.units}
          picks={mediaPicks.map((pick) => ({ ...pick, reasonZh: text(pick.reasonZh) }))}
          usNews={usNews}
          names={names}
          locale={locale}
          text={t}
          checked={checked}
        />
      </div>
    </div>
  );
}
