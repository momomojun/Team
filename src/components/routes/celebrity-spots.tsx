"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { CelebrityShotItem } from "@/components/attractions/celebrity-shots";
import { FilmShotItem } from "@/components/attractions/film-shots";
import type { CelebrityShot } from "@/data/celebrities";
import type { FilmSpot } from "@/data/film-spots";
import type { Dictionary } from "@/i18n/dictionaries";

const noSubscribe = () => () => {};
const useParkParam = () =>
  useSyncExternalStore(noSubscribe, () => new URLSearchParams(window.location.search).get("park"), () => null);

/**
 * 博主路线页的“明星同款”“电影同款”：按公园筛选。
 * 从公园页过来时网址带 ?park=，直接选中这座公园。有景点的链到景点页。
 */
export function CelebritySpots({
  kind,
  shots,
  parks,
  stopNames,
  locale,
  text,
}: {
  kind: "celebs" | "films";
  shots: (CelebrityShot | FilmSpot)[];
  /** 有明星同款的公园：代码 → 名字 */
  parks: { code: string; nameZh: string }[];
  /** 景点 id → 名字 */
  stopNames: Record<string, string>;
  locale: string;
  text: Pick<Dictionary, "attraction" | "routes" | "units">;
}) {
  const t = text.routes;
  const requested = useParkParam();
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const park = picked === undefined ? requested : picked;
  const visible = shots.filter((shot) => !park || shot.park === park);
  const parkName = (code: string) => parks.find((p) => p.code === code)?.nameZh ?? code;
  const chip = (active: boolean) =>
    `border px-3 py-1.5 text-xs transition-colors ${active ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink hover:border-ink"}`;

  return (
    <div>
      <p className="max-w-3xl text-sm leading-7 text-ink-soft">{kind === "films" ? t.filmsIntro : t.celebsIntro}</p>
      <p className="eyebrow mt-8 text-mute">{t.filter}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={chip(park === null)} onClick={() => setPicked(null)}>
          {t.all} <span className="tabular-nums opacity-70">{shots.length}</span>
        </button>
        {parks.map((p) => (
          <button key={p.code} type="button" className={chip(park === p.code)} onClick={() => setPicked(p.code)}>
            {p.nameZh} <span className="tabular-nums opacity-70">{shots.filter((shot) => shot.park === p.code).length}</span>
          </button>
        ))}
      </div>
      <ul className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
        {visible.map((shot) => (
          <li key={shot.id} className="border-t border-ink pt-4">
            <Link
              href={
                shot.attraction
                  ? `/${locale}/parks/${shot.park}/attractions#attraction-${shot.attraction}`
                  : `/${locale}/parks/${shot.park}`
              }
              className="eyebrow mb-2 block text-mute hover:text-clay-700"
            >
              {parkName(shot.park)}
              {shot.attraction && stopNames[shot.attraction] ? ` · ${stopNames[shot.attraction]}` : ""}
            </Link>
            {"titleEn" in shot ? <FilmShotItem shot={shot} text={text} /> : <CelebrityShotItem shot={shot} text={text} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
