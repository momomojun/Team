import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AttractionsExplorer } from "@/components/attractions/attractions-explorer";
import { fill } from "@/i18n/format";
import { loadParkPage, parkContainer } from "@/lib/park-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/parks/[code]/attractions">): Promise<Metadata> {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) return {};
  return { title: `${view.t.nav.attractions} · ${view.title}` };
}

export default async function AttractionsPage({ params }: PageProps<"/[locale]/parks/[code]/attractions">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) notFound();
  const { park, attractions, canada, dict, t } = view;

  return (
    <div className={`${parkContainer} py-20 lg:py-28`}>
      <div className="mb-12">
        <h2 className="section-title">
          {fill(t.attractionsTitle, { n: attractions.length })}
        </h2>
      </div>
      <AttractionsExplorer
        attractions={attractions}
        areas={park.areas}
        parkNameEn={park.nameEn}
        imagery={canada ? "eox" : "usgs"}
        routesHref={`/${locale}/routes?park=${park.code}`}
        text={{
          attraction: dict.attraction,
          kinds: dict.kinds,
          difficulty: dict.difficulty,
          timeOfDay: dict.timeOfDay,
          units: dict.units,
          trip: dict.trip,
          map: dict.map,
        }}
      />
    </div>
  );
}
