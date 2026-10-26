"use client";

import { useMemo, useRef, useState } from "react";
import { IconArrowRight } from "@/components/icons";
import { ParkMap, type MapPoint, type MapText } from "@/components/map/park-map";
import type { Imagery } from "@/components/map/sources";
import { PlaceCheckButtons, type CheckText } from "@/components/park/place-check";
import type { TeslaStation } from "@/data/tesla.generated";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, formatDuration, type UnitText } from "@/i18n/format";
import { nlrCheckKey, pointCheckKey } from "@/lib/place-check-keys";

type TeslaText = Dictionary["park"]["tesla"];
type Filter = "all" | "supercharger" | "destination";

/** 页面上要显示的一个站：名字、旁边的住处和景点已经按语言换好 */
export interface TeslaRow extends TeslaStation {
  key: string;
  /** 推荐住宿的名字（目的地充电就在这几家） */
  lodgingNames?: string[];
  /** 旁边景点的名字 */
  nearName?: string;
}

export interface TeslaLodgingRow {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** 最近的超充（stations 里的 key）和开车分钟 */
  station?: string;
  minutes?: number;
  /** 住处本身有 Tesla 目的地充电 */
  destination: boolean;
}

// 超充用砂岩红（网站的强调色），目的地充电用赭黄，住处、定位点是叠加的小点
const SUPER_COLOR = "#a04c2e";
const DEST_COLOR = "#b8862b";
const LODGING_COLOR = "#6b6459";
const GATEWAY_COLOR = "#1c1b18";
/** 数据整理那天往前一年内开的算新开 */
const NEW_DAYS = 365;

const days = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000;

export function TeslaExplorer({
  stations,
  lodgings,
  gateway,
  updated,
  seasonalRoads,
  imagery,
  text,
}: {
  stations: TeslaRow[];
  lodgings: TeslaLodgingRow[];
  gateway: { name: string; lat: number; lon: number };
  updated: string;
  seasonalRoads: boolean;
  imagery: Imagery;
  text: { tesla: TeslaText; map: MapText; units: UnitText; check: CheckText };
}) {
  const t = text.tesla;
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => stations.filter((s) => filter === "all" || s.kind === filter), [stations, filter]);
  const byKey = useMemo(() => new Map(stations.map((s) => [s.key, s])), [stations]);
  const label = (s: TeslaStation) => s.name || s.city || (s.kind === "supercharger" ? "Tesla Supercharger" : "Tesla Destination");

  const points = useMemo<MapPoint[]>(
    () =>
      visible.map((s) => ({
        id: s.key,
        lat: s.lat,
        lon: s.lon,
        label: label(s),
        sublabel:
          s.kind === "supercharger"
            ? s.drive != null
              ? fill(t.drive, { d: formatDuration(s.drive, text.units) })
              : t.noRoad
            : s.lodgingNames?.join(text.units.listSep),
        color: s.kind === "supercharger" ? SUPER_COLOR : DEST_COLOR,
        ...(s.kind === "supercharger" && s.stalls ? { badge: String(s.stalls) } : {}),
        ...(s.kind === "destination" ? { small: true } : {}),
      })),
    [visible, t, text.units],
  );
  const extras = useMemo<MapPoint[]>(
    () => [
      { id: "gateway", lat: gateway.lat, lon: gateway.lon, label: gateway.name, color: GATEWAY_COLOR },
      ...lodgings.map((l) => ({ id: `lodging-${l.id}`, lat: l.lat, lon: l.lon, label: l.name, color: LODGING_COLOR })),
    ],
    [gateway, lodgings],
  );

  const hover = (key: string | null) => {
    if (key === null || window.matchMedia("(hover: hover) and (pointer: fine)").matches) setHovered(key);
  };
  const select = (key: string) => {
    setSelected(key);
    setFocusTick((tick) => tick + 1);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  const selectFromMap = (key: string) => {
    setSelected(key);
    if (window.matchMedia("(min-width: 1024px)").matches) {
      document.getElementById(`tesla-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const filterClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 pb-1 text-[13px] transition-colors ${
      active ? "border-b border-ink text-ink" : "border-b border-transparent text-mute hover:text-ink"
    }`;
  const count = (kind: Exclude<Filter, "all">) => stations.filter((s) => s.kind === kind).length;

  const tags = (s: TeslaStation) => {
    const list: { text: string; tone: "warn" | "good" | "plain" }[] = [];
    if (s.status === "down") list.push({ text: t.tags.down, tone: "warn" });
    if (s.status === "planned")
      list.push({ text: s.expected ? fill(t.tags.plannedDate, { date: s.expected }) : t.tags.planned, tone: "warn" });
    if (s.status === "open" && s.opened && days(s.opened, updated) <= NEW_DAYS)
      list.push({ text: fill(t.tags.newSite, { date: s.opened }), tone: "good" });
    if (s.allHours) list.push({ text: t.tags.allHours, tone: "plain" });
    if (s.guests) list.push({ text: t.tags.guests, tone: "plain" });
    if (s.teslaOnly) list.push({ text: t.tags.teslaOnly, tone: "plain" });
    if (s.confirmed && days(s.confirmed, updated) > 365) list.push({ text: t.tags.stale, tone: "warn" });
    return list;
  };

  const sourceLine = (s: TeslaStation) => {
    const parts: { text: string; warn: boolean }[] = [];
    if (s.sources.length === 2) parts.push({ text: t.sources.both, warn: false });
    // OSM 上标了目的地充电的很少，目的地充电只在 NLR 不算什么，不写
    else if (s.sources[0] === "nlr") {
      if (s.kind === "supercharger") parts.push({ text: t.sources.nlrOnly, warn: false });
    }
    else parts.push({ text: t.sources.osmOnly, warn: true });
    // 目的地充电 OSM 上常只标了一部分桩，只比超充的
    if (s.kind === "supercharger" && s.osm?.stalls && s.stalls && s.osm.stalls !== s.stalls) parts.push({ text: fill(t.sources.stallsDiffer, { n: s.osm.stalls }), warn: true });
    if (s.confirmed) parts.push({ text: fill(t.sources.confirmed, { date: s.confirmed }), warn: false });
    return parts;
  };

  const specs = (s: TeslaStation) =>
    s.kind === "supercharger"
      ? s.stalls
        ? fill(s.kw ? t.stallsKw : t.stalls, { n: s.stalls, kw: s.kw ?? 0 })
        : null
      : s.stalls
        ? fill(s.kw ? t.portsKw : t.ports, { n: s.stalls, kw: s.kw ?? 0 })
        : null;

  const toneClass = { warn: "text-clay-700", good: "text-pine-700", plain: "text-ink-soft" };

  const superList = visible.filter((s) => s.kind === "supercharger");
  const destList = visible.filter((s) => s.kind === "destination");

  const renderRow = (s: TeslaRow, index: number) => {
    const picked = s.key === selected;
    const place = [s.city, s.state].filter(Boolean).join(", ");
    const meta = [
      s.kind === "supercharger" ? (s.drive != null ? fill(t.drive, { d: formatDuration(s.drive, text.units) }) : t.noRoad) : null,
      // 就在定位点旁的（班夫游客中心）不写“直线 0 英里”
      s.miles >= 0.2 ? fill(t.miles, { mi: s.miles }) : null,
      specs(s),
    ].filter((item): item is string => Boolean(item));
    return (
      <li
        key={s.key}
        id={`tesla-${s.key}`}
        onMouseEnter={() => hover(s.key)}
        onMouseLeave={() => hover(null)}
        className={`scroll-mt-40 border-b border-line py-5 transition-colors ${picked ? "bg-paper-deep/60" : ""}`}
      >
        <div className="flex gap-4">
          <span
            className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] text-paper tabular-nums"
            style={{ backgroundColor: s.kind === "supercharger" ? SUPER_COLOR : DEST_COLOR }}
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <button type="button" onClick={() => select(s.key)} className="text-left font-serif text-lg leading-snug hover:text-clay-700">
              {label(s)}
            </button>
            {place && place !== label(s) && <p className="text-xs text-mute">{place}</p>}
            <p className="mt-1.5 text-sm text-ink-soft">{meta.join(" · ")}</p>
            {s.lodgingNames && (
              <p className="mt-1 text-sm text-pine-700">{fill(t.atLodging, { names: s.lodgingNames.join(text.units.listSep) })}</p>
            )}
            {s.nearName && <p className="mt-1 text-sm text-ink-soft">{fill(t.nearSight, { name: s.nearName })}</p>}
            {tags(s).length > 0 && (
              <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {tags(s).map((tag) => (
                  <span key={tag.text} className={toneClass[tag.tone]}>
                    {tag.text}
                  </span>
                ))}
              </p>
            )}
            <p className="mt-1.5 text-xs leading-5 text-mute">
              {sourceLine(s).map((part, i) => (
                <span key={part.text} className={part.warn ? "text-clay-700" : ""}>
                  {i > 0 && " · "}
                  {part.text}
                </span>
              ))}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`}
                target="_blank"
                rel="noreferrer"
                className="link-line inline-flex items-center gap-1"
              >
                {t.navigate}
                <IconArrowRight className="-rotate-45 text-[10px]" />
              </a>
              {s.kind === "supercharger" && (
                <a
                  href={`https://supercharge.info/map?center=${s.lat},${s.lon}&zoom=14`}
                  target="_blank"
                  rel="noreferrer"
                  title={t.communityHint}
                  className="link-line inline-flex items-center gap-1"
                >
                  {t.community}
                  <IconArrowRight className="-rotate-45 text-[10px]" />
                </a>
              )}
            </div>
            <PlaceCheckButtons id={s.nlr ? nlrCheckKey(s.nlr) : pointCheckKey(s.lat, s.lon)} text={text.check} />
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-16">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <div ref={mapRef} className="scroll-mt-32 lg:sticky lg:top-32">
            <ParkMap
              imagery={imagery}
              points={points}
              extras={extras}
              extrasLegend={[
                { color: GATEWAY_COLOR, label: t.legend.gateway },
                { color: LODGING_COLOR, label: t.legend.lodging },
              ]}
              legend={[
                { color: SUPER_COLOR, label: t.legend.supercharger },
                { color: DEST_COLOR, label: t.legend.destination },
              ]}
              selectedId={selected}
              hoverId={hovered}
              focusTick={focusTick}
              onSelect={selectFromMap}
              fitKey={filter}
              text={text.map}
              className="h-[26rem] lg:h-[calc(100vh-8rem)]"
            />
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-ink pt-5">
            {(["all", "supercharger", "destination"] as const).map((key) => (
              <button key={key} type="button" className={filterClass(filter === key)} onClick={() => setFilter(key)}>
                {key !== "all" && (
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: key === "supercharger" ? SUPER_COLOR : DEST_COLOR }} />
                )}
                {t.filters[key]}
                <span className="text-[11px] tabular-nums opacity-70">{key === "all" ? stations.length : count(key)}</span>
              </button>
            ))}
          </div>

          {superList.length > 0 && (
            <section className="mt-8">
              <h3 className="font-serif text-2xl">{t.superTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-mute">{fill(t.superIntro, { gateway: gateway.name })}</p>
              <ol className="mt-4 border-t border-line">{superList.map(renderRow)}</ol>
            </section>
          )}
          {destList.length > 0 && (
            <section className="mt-10">
              <h3 className="font-serif text-2xl">{t.destTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-mute">{t.destIntro}</p>
              <ol className="mt-4 border-t border-line">{destList.map(renderRow)}</ol>
            </section>
          )}
        </div>
      </div>

      {lodgings.length > 0 && (
        <section className="border-t border-ink pt-6">
          <h3 className="font-serif text-2xl">{t.lodgingTitle}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-mute">{t.lodgingIntro}</p>
          <ul className="mt-5 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {lodgings.map((l) => {
              const station = l.station ? byKey.get(l.station) : undefined;
              return (
                <li key={l.id} className="border-b border-line py-3 text-sm">
                  <p className="font-medium">{l.name}</p>
                  {station && l.minutes != null && (
                    <button type="button" onClick={() => select(station.key)} className="mt-0.5 text-left text-ink-soft hover:text-clay-700">
                      {fill(t.lodgingRow, { station: label(station), d: formatDuration(l.minutes, text.units) })}
                    </button>
                  )}
                  {l.destination && <p className="mt-0.5 text-pine-700">{t.hasDestination}</p>}
                </li>
              );
            })}
          </ul>
          {seasonalRoads && <p className="mt-4 max-w-3xl text-xs leading-6 text-mute">{t.seasonalNote}</p>}
        </section>
      )}
    </div>
  );
}
