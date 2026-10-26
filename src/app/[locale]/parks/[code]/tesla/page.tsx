import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TeslaExplorer, type TeslaLodgingRow, type TeslaRow } from "@/components/park/tesla-explorer";
import { lodgingOptions } from "@/data/lodging";
import { seasonalRoads } from "@/data/roads";
import { teslaChargers, teslaUpdated } from "@/data/tesla.generated";
import { localizeLodging } from "@/i18n/content";
import { fill, formatDuration } from "@/i18n/format";
import { loadParkPage, parkContainer } from "@/lib/park-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/parks/[code]/tesla">): Promise<Metadata> {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) return {};
  return { title: `${view.t.nav.tesla} · ${view.title}` };
}

/** Tesla 充电：超充和目的地充电（NLR 和 OSM 对着看，scripts/build-tesla.mjs 生成） */
export default async function TeslaPage({ params }: PageProps<"/[locale]/parks/[code]/tesla">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  const data = teslaChargers[code];
  if (!view || !data) notFound();
  const { park, attractions, canada, dict, t } = view;
  const lang = view.locale;
  const tt = t.tesla;

  const lodgingList = lodgingOptions.filter((l) => l.park === park.code && !l.camp).map((l) => localizeLodging(l, lang));
  const lodgingName = new Map(lodgingList.map((l) => [l.id, l.nameZh]));
  const sightName = new Map(attractions.map((a) => [a.id, a.nameZh]));

  const stations: TeslaRow[] = data.stations.map((s, i) => ({
    ...s,
    key: `${s.kind[0]}${i}`,
    ...(s.lodging ? { lodgingNames: s.lodging.map((id) => lodgingName.get(id)).filter((n): n is string => Boolean(n)) } : {}),
    ...(s.near && sightName.get(s.near) ? { nearName: sightName.get(s.near) } : {}),
  }));
  const withDestination = new Set(data.stations.flatMap((s) => s.lodging ?? []));
  const nearest = new Map(data.lodgingNearest.map(([id, index, minutes]) => [id, { index, minutes }]));
  const lodgings: TeslaLodgingRow[] = lodgingList.map((l) => {
    const n = nearest.get(l.id);
    return {
      id: l.id,
      name: l.nameZh,
      lat: l.lat,
      lon: l.lon,
      ...(n ? { station: stations[n.index]?.key, minutes: n.minutes } : {}),
      destination: withDestination.has(l.id),
    };
  });

  const superchargers = stations.filter((s) => s.kind === "supercharger");
  const first = superchargers.find((s) => s.status === "open" && s.drive != null);
  const stats: [string, string][] = [
    [tt.stats.superchargers, String(superchargers.length)],
    [tt.stats.stalls, String(superchargers.reduce((sum, s) => sum + (s.stalls ?? 0), 0))],
    [tt.stats.destinations, String(stations.length - superchargers.length)],
  ];

  return (
    <div className={`${parkContainer} py-20 lg:py-28`}>
      <div className="mb-12 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow text-mute">{tt.eyebrow}</p>
          <h2 className="mt-5 font-serif text-[clamp(2rem,3.5vw,3.2rem)] leading-tight">{tt.title}</h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-soft">{tt.intro}</p>
          {!data.osm && <p className="mt-4 max-w-2xl border-l border-clay-600 pl-4 text-sm leading-7 text-clay-800">{tt.noOsm}</p>}
        </div>
        <dl className="grid grid-cols-3 gap-x-4 gap-y-6 self-end sm:gap-x-6 border-l border-clay-600 pl-5 lg:col-span-5">
          {stats.map(([label, value]) => (
            // 数字在上、说明在下；手机上说明会折行，数字按顶端对齐
            <div key={label} className="flex min-w-0 flex-col-reverse justify-end">
              <dt className="mt-1 text-xs leading-5 text-mute">{label}</dt>
              <dd className="font-serif text-3xl tabular-nums">{value}</dd>
            </div>
          ))}
          <div className="col-span-3 flex flex-col-reverse">
            <dt className="mt-1 text-xs leading-5 text-mute">{fill(tt.stats.nearest, { gateway: park.gateway.nameZh })}</dt>
            <dd className="font-serif text-lg leading-snug">
              {first
                ? fill(tt.nearestValue, {
                    name: first.name || first.city || "Tesla Supercharger",
                    d: formatDuration(first.drive ?? 0, dict.units),
                  })
                : fill(tt.nearestNone, { radius: data.radius })}
            </dd>
          </div>
        </dl>
      </div>

      {stations.length === 0 ? (
        <p className="text-sm text-mute">{fill(tt.empty, { radius: data.radius })}</p>
      ) : (
        <TeslaExplorer
          stations={stations}
          lodgings={lodgings}
          gateway={{ name: park.gateway.nameZh, lat: park.gateway.lat, lon: park.gateway.lon }}
          updated={teslaUpdated}
          seasonalRoads={seasonalRoads.some((road) => road.park === park.code)}
          imagery={canada ? "eox" : "usgs"}
          text={{ tesla: tt, map: dict.map, units: dict.units, check: t.chargers.check }}
        />
      )}

      <section className="mt-16 grid gap-10 border-t border-ink pt-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h3 className="font-serif text-2xl">{tt.howTitle}</h3>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-ink-soft">
            {tt.how.map((line) => (
              <li key={line} className="border-l border-line pl-4">
                {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs leading-6 text-mute lg:col-span-5">{fill(tt.dataNote, { date: teslaUpdated })}</p>
      </section>
    </div>
  );
}
