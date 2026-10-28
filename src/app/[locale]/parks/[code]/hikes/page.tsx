import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HikesExplorer } from "@/components/attractions/hikes-explorer";
import { IconArrowRight } from "@/components/icons";
import { alltrailsParkCounts, alltrailsParkTop } from "@/data/attractions";
import { alltrailsParkUrls } from "@/data/alltrails";
import { profiles } from "@/data/attractions/elevation.generated";
import { fill, formatCount } from "@/i18n/format";
import { hikeRows } from "@/lib/hike-rows";
import { loadParkPage, parkContainer, parkPath } from "@/lib/park-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/parks/[code]/hikes">): Promise<Metadata> {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) return {};
  return { title: `${view.t.nav.hikes} · ${view.title}` };
}

/** 徒步步道专页：与“景点”完全独立，直接基于 AllTrails 国家公园步道数据集展示热门 Trail */
export default async function HikesPage({ params }: PageProps<"/[locale]/parks/[code]/hikes">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) notFound();
  const { park, attractions, canada, dict, t } = view;
  const hikes = attractions.filter((a) => a.hike);
  const topTrails = alltrailsParkTop[park.code] ?? [];
  if (hikes.length === 0 && topTrails.length === 0) notFound();
  const totalTrails = alltrailsParkCounts[park.code] ?? topTrails.length;
  // AllTrails 榜单 + 网站收录、榜单里没有的徒步（lib/hike-rows.ts，和下面的列表一样）
  const displayCount = hikeRows(hikes, topTrails).length;
  const parkPages = alltrailsParkUrls(park.code);
  const parkPageNames = park.code === "seki" ? ["Sequoia", "Kings Canyon"] : [];

  return (
    <div className={`${parkContainer} py-20 lg:py-28`}>
      <div className="mb-12 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow text-mute">{t.hikes.eyebrow}</p>
          <h2 className="mt-5 font-serif text-[clamp(2rem,3.5vw,3.2rem)] leading-tight">
            {fill(t.hikes.title, { n: displayCount })}
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-soft">
            {totalTrails > displayCount
              ? `${fill(t.hikes.list.topSubtitle, { total: formatCount(totalTrails) })} `
              : ""}
            {t.hikes.intro}
          </p>
        </div>
        {parkPages.length > 0 && (
          <div className="self-end border-l border-clay-600 pl-5 text-sm leading-7 lg:col-span-5">
            <p className="eyebrow text-clay-700">AllTrails Dataset</p>
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
        park={park.code}
        anchors={attractions.map((a) => ({ id: a.id, area: a.area, lat: a.lat, lon: a.lon, ...(a.start ? { start: { lat: a.start.lat, lon: a.start.lon } } : {}) }))}
        hikes={hikes}
        topTrails={topTrails}
        totalTrails={totalTrails}
        parkNameEn={park.nameEn}
        attractionsHref={parkPath(locale, code, "attractions")}
        imagery={canada ? "eox" : "usgs"}
        // 这座公园有路线的步道的海拔剖面（每条一百多个数，整座公园几 KB）
        profiles={Object.fromEntries(hikes.filter((a) => profiles[a.id]).map((a) => [a.id, profiles[a.id]]))}
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
