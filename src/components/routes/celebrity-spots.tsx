"use client";

import Link from "next/link";
import { useState } from "react";
import { CelebrityShotItem } from "@/components/attractions/celebrity-shots";
import type { CelebrityShot } from "@/data/celebrities";
import type { Dictionary } from "@/i18n/dictionaries";

/** 博主路线页的“明星同款”：全部明星同款按公园筛选，每条链到公园页上的那个景点（对不上景点的链到公园页的明星同款一节） */
export function CelebritySpots({
  shots,
  parks,
  stopNames,
  locale,
  text,
}: {
  shots: CelebrityShot[];
  /** 有明星同款的公园：代码 → 名字 */
  parks: { code: string; nameZh: string }[];
  /** 景点 id → 名字 */
  stopNames: Record<string, string>;
  locale: string;
  text: Pick<Dictionary, "attraction" | "routes" | "units">;
}) {
  const t = text.routes;
  const [park, setPark] = useState<string | null>(null);
  const visible = shots.filter((shot) => !park || shot.park === park);
  const parkName = (code: string) => parks.find((p) => p.code === code)?.nameZh ?? code;
  const chip = (active: boolean) =>
    `border px-3 py-1.5 text-xs transition-colors ${active ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink hover:border-ink"}`;

  return (
    <div>
      <p className="max-w-3xl text-sm leading-7 text-ink-soft">{t.celebsIntro}</p>
      <p className="eyebrow mt-8 text-mute">{t.filter}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={chip(park === null)} onClick={() => setPark(null)}>
          {t.all} <span className="tabular-nums opacity-70">{shots.length}</span>
        </button>
        {parks.map((p) => (
          <button key={p.code} type="button" className={chip(park === p.code)} onClick={() => setPark(p.code)}>
            {p.nameZh} <span className="tabular-nums opacity-70">{shots.filter((shot) => shot.park === p.code).length}</span>
          </button>
        ))}
      </div>
      <ul className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
        {visible.map((shot) => (
          <li key={shot.id} className="border-t border-ink pt-4">
            <Link
              href={`/${locale}/parks/${shot.park}#${shot.attraction ? `attraction-${shot.attraction}` : "celebs"}`}
              className="eyebrow mb-2 block text-mute hover:text-clay-700"
            >
              {parkName(shot.park)}
              {shot.attraction && stopNames[shot.attraction] ? ` · ${stopNames[shot.attraction]}` : ""}
            </Link>
            <CelebrityShotItem shot={shot} text={text} />
          </li>
        ))}
      </ul>
    </div>
  );
}
