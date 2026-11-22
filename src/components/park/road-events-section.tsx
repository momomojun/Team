import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";
import { getRoadEvents } from "@/lib/alerts-live";

/**
 * 公园页“实时信息”：NPS 道路事件（WZDx，每晚抓一次，scripts/road-events-lib.mjs）。只有发这份数据的 6 座公园有。
 * “封到哪天”没核实的多半是占位的（Tioga Road 写到 2028 年），只写“重开日期没公布”；对到了景点的写出来（行程里这些景点不排）
 */
export async function RoadEventsSection({
  park,
  dict,
  names,
  hrefFor,
}: {
  park: string;
  dict: Dictionary;
  names: Map<string, string>;
  hrefFor: (id: string) => string;
}) {
  const t = dict.park.roadEvents;
  const data = await getRoadEvents(park);
  if (!data || data.events.length === 0) return null;
  const md = (date: string) => ({ m: Number(date.slice(5, 7)), d: Number(date.slice(8, 10)) });
  return (
    <div>
      <h3 className="font-serif text-2xl">{t.title}</h3>
      <p className="mt-2 text-xs leading-6 text-mute">{fill(t.hint, { date: data.fetched })}</p>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {data.events.map((event) => (
          <li key={event.key} className="space-y-1.5 py-4">
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-serif text-lg">{event.roadNames.join(" · ")}</span>
              <span className="border border-line px-1.5 text-[11px] text-ink-soft">
                {event.impact === "all-lanes-closed" ? t.closed : t.partly}
              </span>
            </p>
            <p className="text-xs text-ink-soft">
              {event.from ? fill(t.since, md(event.from)) : ""}
              {event.untilVerified && event.until ? `${dict.units.listSep}${fill(t.until, md(event.until))}` : `${dict.units.listSep}${t.unknownEnd}`}
            </p>
            {event.description && <p className="text-sm leading-7 text-ink-soft">{event.description}</p>}
            {event.attractions.length > 0 && event.impact === "all-lanes-closed" && (
              <p className="text-xs leading-6 text-clay-700">
                {t.affects}
                {event.attractions.map((id, i) => (
                  <span key={id}>
                    {i > 0 && dict.units.listSep}
                    <Link href={hrefFor(id)} className="link-line">
                      {names.get(id) ?? id}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-mute">
        <a href="https://developer.nps.gov/api/v1/roadevents" target="_blank" rel="noreferrer" className="link-line">
          {t.source}
        </a>
      </p>
    </div>
  );
}
