import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SafetySection } from "@/components/park/safety-section";
import { SAFETY_CHECKED } from "@/data/safety";
import { localize } from "@/i18n/convert";
import { attractionHref, loadParkPage, parkContainer } from "@/lib/park-page";
import { attractionHazards, officialSafetyPage, parkSafetyCards } from "@/lib/safety";

export async function generateMetadata({ params }: PageProps<"/[locale]/parks/[code]/safety">): Promise<Metadata> {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) return {};
  return { title: `${view.t.nav.safety} · ${view.title}` };
}

/** 公园页的“安全”（GOALS O63）：官方资料里这座公园要注意的危险，加上同行适合度里标了危险的景点 */
export default async function SafetyPage({ params }: PageProps<"/[locale]/parks/[code]/safety">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) notFound();
  const { dict, attractions } = view;
  const lang = view.locale;
  const names = new Map(attractions.map((a) => [a.id, a.nameZh]));
  const groups = attractionHazards(code).map((group) => ({
    hazard: group.hazard,
    stops: group.stops.map((stop) => ({ id: stop.id, name: names.get(stop.id) ?? stop.nameZh, note: stop.note && localize(stop.note, lang) })),
  }));
  const cards = parkSafetyCards(code, lang);
  if (cards.length === 0 && groups.length === 0) notFound();

  return (
    <div className={`${parkContainer} py-20 lg:py-28`}>
      <SafetySection
        cards={cards}
        groups={groups}
        hazardLabels={dict.attraction.family.hazards}
        t={dict.safety}
        official={officialSafetyPage(code)}
        generalHref={`/${locale}/safety`}
        hrefFor={(id) => attractionHref(locale, code, id)}
        checked={SAFETY_CHECKED}
      />
    </div>
  );
}
