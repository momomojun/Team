import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HikesExplorer } from "@/components/attractions/hikes-explorer";
import { IconArrowRight } from "@/components/icons";
import { alltrailsParkUrls } from "@/data/alltrails";
import { fill } from "@/i18n/format";
import { loadParkPage, parkContainer, parkPath } from "@/lib/park-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/parks/[code]/hikes">): Promise<Metadata> {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) return {};
  return { title: `${view.t.nav.hikes} · ${view.title}` };
}

/** 徒步路线：这座公园所有带徒步数据的景点，地图上画出步道，附 AllTrails 链接（10-22 仓库主人要的） */
export default async function HikesPage({ params }: PageProps<"/[locale]/parks/[code]/hikes">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) notFound();
  const { park, attractions, canada, dict, t } = view;
  const hikes = attractions.filter((a) => a.hike);
  if (hikes.length === 0) notFound();
  const parkPages = alltrailsParkUrls(park.code);
  const parkPageNames = park.code === "seki" ? ["Sequoia", "Kings Canyon"] : [];

  return (
    <div className={`${parkContainer} py-20 lg:py-28`}>
      <div className="mb-12 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow text-mute">{t.hikes.eyebrow}</p>
          <h2 className="mt-5 font-serif text-[clamp(2rem,3.5vw,3.2rem)] leading-tight">{fill(t.hikes.title, { n: hikes.length })}</h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-soft">{t.hikes.intro}</p>
        </div>
        {parkPages.length > 0 && (
          <div className="self-end border-l border-clay-600 pl-5 text-sm leading-7 lg:col-span-5">
            <p className="eyebrow text-clay-700">AllTrails</p>
            <ul className="mt-2 space-y-1">
              {parkPages.map((url, i) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noreferrer" className="link-line inline-flex items-center gap-1.5">
                    {parkPageNames[i] ? fill(t.hikes.alltrailsPartPage, { name: parkPageNames[i] }) : t.hikes.alltrailsPark}
                    <IconArrowRight className="-rotate-45 text-xs" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-6 text-mute">{t.hikes.alltrailsNote}</p>
          </div>
        )}
      </div>
      <HikesExplorer
        hikes={hikes}
        parkNameEn={park.nameEn}
        attractionsHref={parkPath(locale, code, "attractions")}
        imagery={canada ? "eox" : "usgs"}
        text={{
          attraction: dict.attraction,
          kinds: dict.kinds,
          difficulty: dict.difficulty,
          timeOfDay: dict.timeOfDay,
          units: dict.units,
          trip: dict.trip,
          map: dict.map,
          hikes: t.hikes.list,
        }}
      />
    </div>
  );
}
