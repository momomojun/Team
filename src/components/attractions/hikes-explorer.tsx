"use client";

import { useMemo, useRef, useState } from "react";
import { CommonsImage } from "@/components/commons-image";
import { IconArrowRight } from "@/components/icons";
import type { Imagery } from "@/components/map/sources";
import { ParkMap, type MapPoint, type MapTrail } from "@/components/map/park-map";
import { AddToTripButton } from "@/components/trip/add-to-trip-button";
import type { AttractionWithPhoto } from "@/data/attractions";
import { alltrailsSearchUrl } from "@/data/alltrails";
import { fill, otherName } from "@/i18n/format";
import { AttractionMeta, AttractionTags, linkButton, PopularityBadge, type AttractionText } from "./attraction-card";

type Difficulty = "easy" | "moderate" | "hard";
type Length = "short" | "medium" | "long";
type Sort = "rank" | "short" | "easy";
type Filter = "all" | Difficulty | Length | "kids" | "seniors";

const DIFFICULTY_ORDER: Record<Difficulty, number> = { easy: 0, moderate: 1, hard: 2 };
const DIFFICULTY_COLORS: Record<Difficulty, string> = { easy: "#5f7a4a", moderate: "#b8862b", hard: "#a04c2e" };
/** 来回不到 3 英里（约 5 公里）算短，8 英里（约 13 公里）以上算长 */
const lengthOf = (miles: number | undefined): Length | null =>
  miles === undefined ? null : miles < 3 ? "short" : miles <= 8 ? "medium" : "long";

const FILTERS: Record<Exclude<Filter, "all">, (a: AttractionWithPhoto) => boolean> = {
  easy: (a) => a.hike?.difficulty === "easy",
  moderate: (a) => a.hike?.difficulty === "moderate",
  hard: (a) => a.hike?.difficulty === "hard",
  short: (a) => lengthOf(a.hike?.distanceMi) === "short",
  medium: (a) => lengthOf(a.hike?.distanceMi) === "medium",
  long: (a) => lengthOf(a.hike?.distanceMi) === "long",
  // 6 岁左右的孩子能自己走、官方没有年龄限制
  kids: (a) => a.family !== undefined && a.family.kidsFromAge <= 6 && a.family.minAge === undefined,
  seniors: (a) => a.family?.seniors === "ok",
};

export interface HikesText extends AttractionText {
  hikes: {
    sortRank: string;
    sortShort: string;
    sortEasy: string;
    all: string;
    lengths: Record<Length, string>;
    kids: string;
    seniors: string;
    empty: string;
    alltrails: string;
    alltrailsHint: string;
    details: string;
  };
}

/**
 * 公园页的“徒步”：这座公园所有带徒步数据的景点，左边地图画出全部步道（按难度上色），右边一条一条列出来——
 * 来回多远、爬升多少、要走多久、难度、开放月份、要不要许可证、带孩子老人行不行，附 AllTrails 链接（看别人的评价、实时路况）。
 * 鼠标停在一条上，地图上那条步道亮起来；点名字地图飞过去
 */
export function HikesExplorer({
  hikes,
  parkNameEn,
  attractionsHref,
  imagery,
  text,
}: {
  hikes: AttractionWithPhoto[];
  parkNameEn: string;
  /** 景点页的地址（详情跳过去：#attraction-id） */
  attractionsHref: string;
  imagery?: Imagery;
  text: HikesText;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("rank");
  const mapRef = useRef<HTMLDivElement>(null);
  const t = text.hikes;
  const hover = (id: string | null) => {
    if (id === null || window.matchMedia("(hover: hover) and (pointer: fine)").matches) setHoverId(id);
  };

  const visible = useMemo(() => {
    const list = hikes.filter((a) => filter === "all" || FILTERS[filter](a));
    return [...list].sort((a, b) =>
      sort === "short"
        ? (a.hike?.distanceMi ?? 99) - (b.hike?.distanceMi ?? 99)
        : sort === "easy"
          ? DIFFICULTY_ORDER[a.hike!.difficulty] - DIFFICULTY_ORDER[b.hike!.difficulty] || (a.hike?.gainFt ?? 0) - (b.hike?.gainFt ?? 0)
          : (a.hotRank ?? Infinity) - (b.hotRank ?? Infinity) || (b.google?.reviews ?? 0) - (a.google?.reviews ?? 0),
    );
  }, [hikes, filter, sort]);

  const points = useMemo<MapPoint[]>(
    () =>
      visible.map((a) => {
        const start = a.trailLine?.path[0];
        return {
          id: a.id,
          lat: start ? start[1] : a.lat,
          lon: start ? start[0] : a.lon,
          label: a.nameZh,
          sublabel: a.nameEn,
          color: DIFFICULTY_COLORS[a.hike!.difficulty],
        };
      }),
    [visible],
  );
  const trails = useMemo<MapTrail[]>(() => visible.flatMap((a) => (a.trailLine ? [{ id: a.id, path: a.trailLine.path }] : [])), [visible]);

  const select = (id: string) => {
    setSelectedId(id);
    setFocusTick((tick) => tick + 1);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  const selectFromMap = (id: string) => {
    setSelectedId(id);
    if (window.matchMedia("(min-width: 1024px)").matches) {
      document.getElementById(`hike-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const filterClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 pb-1 text-[13px] transition-colors ${
      active ? "border-b border-ink text-ink" : "border-b border-transparent text-mute hover:text-ink"
    }`;
  const count = (key: Exclude<Filter, "all">) => hikes.filter(FILTERS[key]).length;
  const filterGroups: { key: Exclude<Filter, "all">; label: string; dot?: string }[][] = [
    (["easy", "moderate", "hard"] as const).map((key) => ({ key, label: text.difficulty[key], dot: DIFFICULTY_COLORS[key] })),
    (["short", "medium", "long"] as const).map((key) => ({ key, label: t.lengths[key] })),
    [
      { key: "kids", label: t.kids },
      { key: "seniors", label: t.seniors },
    ],
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <div ref={mapRef} className="scroll-mt-32 lg:sticky lg:top-32">
          <ParkMap
            imagery={imagery}
            points={points}
            trails={trails}
            highlightTrailId={hoverId ?? selectedId}
            selectedId={selectedId}
            hoverId={hoverId}
            focusTick={focusTick}
            onSelect={selectFromMap}
            text={text.map}
            className="h-[26rem] lg:h-[calc(100vh-8rem)]"
          />
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="space-y-4 border-t border-ink pt-5">
          <div className="flex items-center gap-5">
            {(["rank", "short", "easy"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setSort(mode)} className={filterClass(sort === mode)}>
                {mode === "rank" ? t.sortRank : mode === "short" ? t.sortShort : t.sortEasy}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <button type="button" className={filterClass(filter === "all")} onClick={() => setFilter("all")}>
                {t.all}
                <span className="text-[11px] tabular-nums opacity-70">{hikes.length}</span>
              </button>
              {filterGroups.flat().map(({ key, label, dot }) =>
                count(key) > 0 ? (
                  <button key={key} type="button" className={filterClass(filter === key)} onClick={() => setFilter(key)}>
                    {dot && <span className="size-1.5 rounded-full" style={{ backgroundColor: dot }} />}
                    {label}
                    <span className="text-[11px] tabular-nums opacity-70">{count(key)}</span>
                  </button>
                ) : null,
              )}
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="mt-10 text-sm text-mute">{t.empty}</p>
        ) : (
          <ol className="mt-8 border-t border-line">
            {visible.map((a, i) => {
              const f = text.attraction.family;
              const fit = a.family;
              // 带孩子、老人：建议几岁以上、官方年龄下限、老人行不行、有什么危险，一行小字
              const familyLine = fit
                ? [
                    fit.kidsFromAge === 0 ? f.babies : fill(f.kidsFrom, { age: fit.kidsFromAge }),
                    fit.minAge !== undefined ? fill(f.minAge, { age: fit.minAge }) : null,
                    fit.seniorsSerious ? f.seniorsSerious : f.seniors[fit.seniors],
                    ...(fit.hazards ?? []).map((hazard) => f.hazards[hazard]),
                  ]
                    .filter(Boolean)
                    .join(text.units.listSep)
                : null;
              const careful = Boolean(fit && (fit.seniors !== "ok" || fit.hazards?.length || fit.minAge !== undefined));
              const picked = a.id === selectedId;
              return (
                <li
                  key={a.id}
                  id={`hike-${a.id}`}
                  onMouseEnter={() => hover(a.id)}
                  onMouseLeave={() => hover(null)}
                  className={`scroll-mt-40 border-b border-line py-6 transition-colors ${picked ? "bg-paper-deep/60" : ""}`}
                >
                  <div className="flex gap-4">
                    {a.photo && (
                      <button type="button" onClick={() => select(a.id)} className="relative h-24 w-20 shrink-0 overflow-hidden bg-paper-deep" aria-label={text.attraction.showOnMap}>
                        <CommonsImage src={a.photo.url} alt="" fill sizes="80px" className="object-cover" />
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <span className="font-serif text-sm text-mute tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                        <h3 className="min-w-0 font-serif text-xl leading-tight">
                          <button type="button" onClick={() => select(a.id)} title={text.attraction.showOnMap} className="text-left transition-colors hover:text-clay-700">
                            {a.nameZh}
                          </button>
                        </h3>
                      </div>
                      <p className="eyebrow mt-1 truncate text-mute">{otherName(a.nameZh, a.nameEn)}</p>
                      <div className="mt-3 space-y-2">
                        <AttractionMeta attraction={a} text={text} />
                        <PopularityBadge attraction={a} text={text} />
                        <AttractionTags attraction={a} text={text} />
                        {familyLine && <p className={`text-xs leading-6 ${careful ? "text-clay-700" : "text-ink-soft"}`}>{familyLine}</p>}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <a className={`${linkButton} inline-flex items-center gap-1`} href={alltrailsSearchUrl(a.nameEn, parkNameEn)} target="_blank" rel="noreferrer" title={t.alltrailsHint}>
                          {t.alltrails} <IconArrowRight className="-rotate-45 text-[10px]" />
                        </a>
                        <a className={linkButton} href={`${attractionsHref}#attraction-${a.id}`}>
                          {t.details}
                        </a>
                        <AddToTripButton id={a.id} text={text.trip} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
