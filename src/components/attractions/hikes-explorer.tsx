"use client";

import { useMemo, useRef, useState } from "react";
import { CommonsImage } from "@/components/commons-image";
import { IconArrowRight, IconTrail } from "@/components/icons";
import type { Imagery } from "@/components/map/sources";
import { ParkMap, type MapPoint, type MapTrail } from "@/components/map/park-map";
import { AddToTripButton } from "@/components/trip/add-to-trip-button";
import type { AllTrailsParkTrail, AttractionWithPhoto } from "@/data/attractions";
import { alltrailsPhotoUrl, alltrailsTrailUrl } from "@/data/alltrails";
import { fill, formatCount, formatKm, formatMeters } from "@/i18n/format";
import { linkButton, type AttractionText } from "./attraction-card";

type Difficulty = "easy" | "moderate" | "hard";
type Length = "short" | "medium" | "long";
type RouteType = "loop" | "out" | "point";
type Sort = "rank" | "short" | "easy";
type Filter = "all" | Difficulty | Length | RouteType;

const DIFFICULTY_ORDER: Record<Difficulty, number> = { easy: 0, moderate: 1, hard: 2 };
const DIFFICULTY_COLORS: Record<Difficulty, string> = { easy: "#5f7a4a", moderate: "#b8862b", hard: "#a04c2e" };
/** 来回不到 3 英里（约 5 公里）算短，8 英里（约 13 公里）以上算长 */
const lengthOf = (miles: number | undefined): Length | null =>
  miles === undefined || miles <= 0 ? null : miles < 3 ? "short" : miles <= 8 ? "medium" : "long";

const FEATURE_LABELS_ZH: Record<string, string> = {
  views: "绝佳视野",
  waterfall: "瀑布",
  lake: "湖泊",
  river: "溪流河谷",
  forest: "森林",
  wildflowers: "野花",
  wildlife: "野生动物",
  kids: "适合儿童",
  ada: "轮椅无障碍",
  "dogs-leash": "可牵绳带狗",
  "dogs-no": "禁带宠物",
};

const FEATURE_LABELS_EN: Record<string, string> = {
  views: "Views",
  waterfall: "Waterfall",
  lake: "Lake",
  river: "River",
  forest: "Forest",
  wildflowers: "Wildflowers",
  wildlife: "Wildlife",
  kids: "Kid friendly",
  ada: "Wheelchair friendly",
  "dogs-leash": "Dogs on leash",
  "dogs-no": "No dogs",
};

const FILTERS: Record<Exclude<Filter, "all">, (t: AllTrailsParkTrail) => boolean> = {
  easy: (t) => t.difficulty === "easy",
  moderate: (t) => t.difficulty === "moderate",
  hard: (t) => t.difficulty === "hard",
  short: (t) => lengthOf(t.lengthMi) === "short",
  medium: (t) => lengthOf(t.lengthMi) === "medium",
  long: (t) => lengthOf(t.lengthMi) === "long",
  loop: (t) => t.routeType === "loop",
  out: (t) => t.routeType === "out",
  point: (t) => t.routeType === "point",
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
    topEyebrow: string;
    topTitle: string;
    topSubtitle: string;
    topPopularity: string;
    topReviews: string;
    topRouteTypes: Record<"out" | "loop" | "point", string>;
    topUsage: Record<1 | 2 | 3 | 4, string>;
    topInGuide: string;
    topOpenAlltrails: string;
  };
}

/**
 * 公园页的纯 AllTrails 徒步（Trails）界面，与“景点（Sights）”完全独立：
 * 直接基于 AllTrails 国家公园步道数据集展示该公园的热门 Trail，按 AllTrails 综合热度（popularity）与评价数排名，
 * 标注全程距离、累计爬升、难度分级、路线形态（环线 / 往返 / 点对点）、客流强度、步道标签，并直达 AllTrails 详情页。
 */
export function HikesExplorer({
  hikes,
  topTrails = [],
  imagery,
  text,
}: {
  hikes: AttractionWithPhoto[];
  topTrails?: AllTrailsParkTrail[];
  totalTrails?: number;
  parkNameEn?: string;
  attractionsHref?: string;
  imagery?: Imagery;
  text: HikesText;
}) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hoverSlug, setHoverSlug] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("rank");
  const mapRef = useRef<HTMLDivElement>(null);
  const t = text.hikes;
  const isZh = text.units.km.includes("公");
  const featureLabels = isZh ? FEATURE_LABELS_ZH : FEATURE_LABELS_EN;

  // 若某条 AllTrails 步道刚好在我们已算好的 OSM 步道几何（trailLine）或图集中，复用其路线轨迹与实拍图
  const hikeById = useMemo(() => new Map(hikes.map((a) => [a.id, a])), [hikes]);

  // 组装纯 Trail 数据源：优先使用 AllTrails 公园步道库，若某座荒野公园无独立榜单则从已匹配步道构建
  const allTrailsList = useMemo<AllTrailsParkTrail[]>(() => {
    if (topTrails.length > 0) return topTrails;
    return hikes
      .filter((a) => a.hike)
      .map((a) => ({
        name: a.alltrails?.name ?? a.nameEn,
        slug: a.alltrails?.slug ?? a.id,
        lat: a.start?.lat ?? a.lat,
        lon: a.start?.lon ?? a.lon,
        rating: a.alltrails?.rating ?? 4.5,
        reviews: a.alltrails?.reviews ?? 0,
        popularity: a.alltrails?.popularity ?? 10,
        usage: a.alltrails?.usage,
        photo: a.alltrails?.photo,
        lengthMi: a.hike!.distanceMi ?? 0,
        gainFt: a.hike!.gainFt ?? 0,
        difficulty: a.hike!.difficulty,
        routeType: a.hike!.loop ? "loop" : "out",
        attractionId: a.id,
      }));
  }, [topTrails, hikes]);

  // 记录每条 Trail 在本公园内的 AllTrails 原始热度名次（1, 2, 3...）
  const popularityRankBySlug = useMemo(() => {
    const sorted = [...allTrailsList].sort((a, b) => b.popularity - a.popularity || b.reviews - a.reviews);
    return new Map(sorted.map((item, idx) => [item.slug, idx + 1]));
  }, [allTrailsList]);

  const hover = (slug: string | null) => {
    if (slug === null || window.matchMedia("(hover: hover) and (pointer: fine)").matches) setHoverSlug(slug);
  };

  const visible = useMemo(() => {
    const list = allTrailsList.filter((item) => filter === "all" || FILTERS[filter](item));
    return [...list].sort((a, b) =>
      sort === "short"
        ? (a.lengthMi || 99) - (b.lengthMi || 99) || b.popularity - a.popularity
        : sort === "easy"
          ? DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] || (a.gainFt || 0) - (b.gainFt || 0)
          : b.popularity - a.popularity || b.reviews - a.reviews,
    );
  }, [allTrailsList, filter, sort]);

  const points = useMemo<MapPoint[]>(
    () =>
      visible.map((trail) => {
        const matched = trail.attractionId ? hikeById.get(trail.attractionId) : undefined;
        const start = matched?.trailLine?.path[0];
        const zhTitle = isZh && matched && matched.nameZh !== trail.name ? matched.nameZh : undefined;
        return {
          id: trail.slug,
          lat: start ? start[1] : trail.lat,
          lon: start ? start[0] : trail.lon,
          label: zhTitle ? `${trail.name} (${zhTitle})` : trail.name,
          sublabel: `AllTrails ★${trail.rating.toFixed(1)} · ${formatKm(trail.lengthMi, text.units)}`,
          color: DIFFICULTY_COLORS[trail.difficulty],
        };
      }),
    [visible, hikeById, isZh, text.units],
  );

  const trails = useMemo<MapTrail[]>(
    () =>
      visible.flatMap((trail) => {
        const matched = trail.attractionId ? hikeById.get(trail.attractionId) : undefined;
        return matched?.trailLine ? [{ id: trail.slug, path: matched.trailLine.path }] : [];
      }),
    [visible, hikeById],
  );

  const select = (slug: string) => {
    setSelectedSlug(slug);
    setFocusTick((tick) => tick + 1);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const selectFromMap = (slug: string) => {
    setSelectedSlug(slug);
    if (window.matchMedia("(min-width: 1024px)").matches) {
      document.getElementById(`trail-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const filterClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 pb-1 text-[13px] transition-colors ${
      active ? "border-b border-ink text-ink" : "border-b border-transparent text-mute hover:text-ink"
    }`;
  const count = (key: Exclude<Filter, "all">) => allTrailsList.filter(FILTERS[key]).length;
  const filterGroups: { key: Exclude<Filter, "all">; label: string; dot?: string }[][] = [
    (["easy", "moderate", "hard"] as const).map((key) => ({ key, label: text.difficulty[key], dot: DIFFICULTY_COLORS[key] })),
    (["short", "medium", "long"] as const).map((key) => ({ key, label: t.lengths[key] })),
    (["loop", "out", "point"] as const).map((key) => ({ key, label: t.topRouteTypes[key] })),
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <div ref={mapRef} className="scroll-mt-32 lg:sticky lg:top-32">
          <ParkMap
            imagery={imagery}
            points={points}
            trails={trails}
            highlightTrailId={hoverSlug ?? selectedSlug}
            selectedId={selectedSlug}
            hoverId={hoverSlug}
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
                <span className="text-[11px] tabular-nums opacity-70">{allTrailsList.length}</span>
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
            {visible.map((trail, i) => {
              const matched = trail.attractionId ? hikeById.get(trail.attractionId) : undefined;
              const picked = trail.slug === selectedSlug;
              const rank = popularityRankBySlug.get(trail.slug) ?? i + 1;
              const zhSubtitle = isZh && matched && matched.nameZh !== trail.name ? matched.nameZh : null;

              const trailSpecs = [
                trail.lengthMi > 0 ? formatKm(trail.lengthMi, text.units) : null,
                t.topRouteTypes[trail.routeType],
                trail.gainFt > 0 ? formatMeters(trail.gainFt, text.units) : null,
                trail.usage ? t.topUsage[trail.usage] : null,
              ].filter((item): item is string => Boolean(item));

              const featureTags = (trail.features ?? [])
                .map((f) => featureLabels[f])
                .filter((label): label is string => Boolean(label));
              const photoSrc = alltrailsPhotoUrl(trail.photo, 320, 320) ?? matched?.photo?.url;

              return (
                <li
                  key={trail.slug}
                  id={`trail-${trail.slug}`}
                  onMouseEnter={() => hover(trail.slug)}
                  onMouseLeave={() => hover(null)}
                  className={`scroll-mt-40 border-b border-line py-6 transition-colors ${picked ? "bg-paper-deep/60" : ""}`}
                >
                  <div className="flex gap-4">
                    {photoSrc && (
                      <button
                        type="button"
                        onClick={() => select(trail.slug)}
                        className="relative h-24 w-20 shrink-0 overflow-hidden bg-paper-deep"
                        aria-label={text.attraction.showOnMap}
                      >
                        <CommonsImage src={photoSrc} alt="" fill sizes="80px" className="object-cover" />
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <span className="font-serif text-sm text-clay-700 tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="min-w-0 font-serif text-xl leading-tight">
                          <button
                            type="button"
                            onClick={() => select(trail.slug)}
                            title={text.attraction.showOnMap}
                            className="text-left transition-colors hover:text-clay-700"
                          >
                            {trail.name}
                          </button>
                        </h3>
                      </div>
                      {zhSubtitle && <p className="mt-1 text-xs text-ink-soft">{zhSubtitle}</p>}

                      <div className="mt-3 space-y-2.5">
                        {/* AllTrails 专属热度排名 + 综合热度分 + 星级评分与打卡评价数 */}
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
                          <span className="font-medium text-clay-700">
                            {fill(text.attraction.hikeRank, { n: rank })}
                          </span>
                          <span className="text-clay-700">
                            {fill(t.topPopularity, { score: trail.popularity.toFixed(1) })}
                          </span>
                          <span className="text-mute">
                            {fill(text.attraction.alltrailsRating, {
                              rating: trail.rating.toFixed(1),
                              reviews: formatCount(trail.reviews),
                            })}
                          </span>
                        </div>

                        {/* 纯 Trail 参数：难度 + 里程 + 环线/往返/点对点 + 爬升 + 客流强度 */}
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: DIFFICULTY_COLORS[trail.difficulty] }}
                            />
                            {text.difficulty[trail.difficulty]}
                          </span>
                          {trailSpecs.map((spec) => (
                            <span key={spec} className="before:mr-3 before:text-line before:content-['/']">
                              {spec}
                            </span>
                          ))}
                        </p>

                        {/* AllTrails 步道特征标签（瀑布、视野、森林、适合儿童、禁带宠物等） */}
                        {featureTags.length > 0 && (
                          <ul className="flex flex-wrap gap-1.5">
                            {featureTags.map((label) => (
                              <li
                                key={label}
                                className="border border-line px-2 py-0.5 text-[11px] leading-5 text-ink-soft"
                              >
                                {label}
                              </li>
                            ))}
                          </ul>
                        )}

                        {matched?.trailLine && (
                          <p className="inline-flex items-center gap-1.5 text-xs text-clay-700">
                            <IconTrail className="text-sm" />
                            {isZh ? "地图已绘制完整步道轨迹" : "Full trail geometry mapped"}
                          </p>
                        )}
                      </div>

                      <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <a
                          className={`${linkButton} inline-flex items-center gap-1`}
                          href={alltrailsTrailUrl(trail.slug)}
                          target="_blank"
                          rel="noreferrer"
                          title={t.alltrailsHint}
                        >
                          {t.alltrails} <IconArrowRight className="-rotate-45 text-[10px]" />
                        </a>
                        <button type="button" onClick={() => select(trail.slug)} className={linkButton}>
                          {text.attraction.showOnMap}
                        </button>
                        <a
                          className={linkButton}
                          href={`https://www.google.com/maps/dir/?api=1&destination=${trail.lat},${trail.lon}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {text.attraction.navigate}
                        </a>
                        {matched && <AddToTripButton id={matched.id} text={text.trip} />}
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
