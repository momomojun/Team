"use client";

import { useMemo, useRef } from "react";
import { cumulative, pointAt } from "@/components/map/route-tour";
import type { TrailProfile } from "@/data/attractions/elevation.generated";
import { fill, formatCount, type UnitText } from "@/i18n/format";
import { elevationAt, sampleMeters, smoothElevations } from "@/lib/elevation";

const WIDTH = 300;
const HEIGHT = 56;
/** 海拔差不到这么多米的步道，纵轴也按这么多米画：平路不画成过山车 */
const MIN_RANGE = 60;

export interface ProfileText {
  profile: string;
  profileOneWay: string;
  profileRange: string;
  profileAt: string;
}

/**
 * 一条步道的海拔剖面（高程模型取样，见 scripts/build-elevation.mjs）：横轴是离起点多远，纵轴是海拔。
 * 鼠标（或手指）在上面移动时显示这里多高，并通过 onCursor 告诉地图走到了哪（不经过 React，地图那边直接挪一个小圆点）
 */
export function ElevationProfile({
  profile,
  path,
  loop,
  units,
  text,
  onCursor,
}: {
  profile: TrailProfile;
  path: [number, number][];
  loop: boolean;
  /** system：metric 按米、imperial 按英尺（字典里的 units.system） */
  units: UnitText & { system?: string };
  text: ProfileText;
  onCursor?: (at: [number, number] | null) => void;
}) {
  const ele = useMemo(() => smoothElevations(profile.ele), [profile.ele]);
  const cum = useMemo(() => cumulative(path), [path]);
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);

  const low = Math.min(...ele);
  const high = Math.max(...ele);
  const range = Math.max(high - low, MIN_RANGE);
  const base = low - (range - (high - low)) / 2;
  const x = (meters: number) => (meters / profile.meters) * WIDTH;
  const y = (e: number) => HEIGHT - 2 - ((e - base) / range) * (HEIGHT - 6);
  const line = ele.map((e, i) => `${i === 0 ? "M" : "L"}${x(sampleMeters(profile, i)).toFixed(1)},${y(e).toFixed(1)}`).join("");
  const area = `${line}L${WIDTH},${HEIGHT}L0,${HEIGHT}Z`;
  // 英里也保留一位小数（formatKm 原样写进模板，数据里的英里本来就只有一位）
  const km = (meters: number) => fill(units.km, { km: (meters / 1000).toFixed(1), mi: (meters / 1609.34).toFixed(1) });
  // 海拔：中文按米（到个位），英文按英尺（到十位）
  const height = (meters: number) => formatCount(units.system === "metric" ? Math.round(meters) : Math.round(meters / 0.3048 / 10) * 10);

  const move = (clientX: number) => {
    const root = rootRef.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    const meters = fraction * profile.meters;
    if (lineRef.current) {
      lineRef.current.style.transform = `translateX(${fraction * box.width}px)`;
      lineRef.current.style.opacity = "1";
    }
    if (readoutRef.current) readoutRef.current.textContent = fill(text.profileAt, { km: km(meters), m: height(elevationAt(profile, meters, ele)) });
    // 剖面的长度是 Valhalla 量的，路线按球面近似量：按比例对齐
    onCursor?.(pointAt(path, cum, fraction * cum[cum.length - 1]));
  };
  const leave = () => {
    if (lineRef.current) lineRef.current.style.opacity = "0";
    if (readoutRef.current) readoutRef.current.textContent = "";
    onCursor?.(null);
  };

  return (
    <figure className="mt-1">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 text-[11px] text-mute">
        <span>
          {text.profile} · {fill(text.profileRange, { min: height(low), max: height(high) })}
          {!loop && ` · ${text.profileOneWay}`}
        </span>
        <span ref={readoutRef} aria-live="polite" className="tabular-nums text-ink-soft" />
      </figcaption>
      <div
        ref={rootRef}
        className="relative mt-1.5 h-14 cursor-crosshair touch-pan-y"
        onPointerMove={(event) => move(event.clientX)}
        onPointerDown={(event) => move(event.clientX)}
        onPointerLeave={leave}
        onPointerCancel={leave}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="size-full" aria-hidden>
          <path d={area} fill="var(--color-paper-deep)" />
          <path d={line} fill="none" stroke="var(--color-clay-600)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </svg>
        <div ref={lineRef} className="pointer-events-none absolute inset-y-0 left-0 w-px bg-ink opacity-0 transition-opacity" />
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-mute">
        <span>0</span>
        <span>{km(profile.meters)}</span>
      </div>
    </figure>
  );
}
