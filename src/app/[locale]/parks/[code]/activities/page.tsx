import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActivitiesSection } from "@/components/park/activities-section";
import { RoadsSection } from "@/components/park/roads-section";
import { VisitsSection } from "@/components/park/visits-section";
import { attractionHref, loadParkPage, parkContainer } from "@/lib/park-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/parks/[code]/activities">): Promise<Metadata> {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) return {};
  return { title: `${view.t.nav.activities} · ${view.title}` };
}

export default async function ActivitiesPage({ params }: PageProps<"/[locale]/parks/[code]/activities">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view || !view.hasSeasonInfo) notFound();
  const { parkActivities, attractions, parkClosures, parkRoads, visits, dict } = view;
  const hrefFor = (id: string) => attractionHref(locale, code, id);

  return (
    <div className={`${parkContainer} py-20 lg:py-28`}>
      <p className="eyebrow mb-12 text-mute">{dict.park.activities.eyebrow}</p>
      <ActivitiesSection
        activities={parkActivities}
        attractions={attractions}
        closures={parkClosures}
        dict={dict}
        hrefFor={hrefFor}
      />
      {visits && <VisitsSection visits={visits} locale={view.locale} dict={dict} />}
      {parkRoads.length > 0 && <RoadsSection roads={parkRoads} attractions={attractions} dict={dict} hrefFor={hrefFor} />}
    </div>
  );
}
