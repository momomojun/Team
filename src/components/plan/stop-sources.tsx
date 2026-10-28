"use client";

import { useMemo } from "react";
import { IconArrowRight } from "@/components/icons";
import type { AttractionWithPhoto } from "@/data/attractions";
import { fill } from "@/i18n/format";
import { stopSources } from "@/lib/provenance";
import type { PlannerText } from "./types";

type SourceText = PlannerText["attraction"]["sources"];

/** 行程里点开一站：这一站的信息各是从哪来的、哪天核对的；过期的标出来，出发前再去官网看一眼 */
export function StopSources({ stop, officialUrl, text }: { stop: AttractionWithPhoto; officialUrl?: string; text: SourceText }) {
  const items = useMemo(() => stopSources(stop, { officialUrl, today: new Date().toLocaleDateString("sv") }), [stop, officialUrl]);
  const staleCount = items.filter((item) => item.stale).length;

  return (
    <details className="group border-t border-line pt-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs tracking-[0.1em] text-mute hover:text-ink">
        <span>{text.title}</span>
        {staleCount > 0 && <span className="tracking-normal text-clay-700">{fill(text.staleCount, { n: staleCount })}</span>}
        <span className="ml-auto transition-transform group-open:rotate-90">›</span>
      </summary>
      <p className="mt-2 text-xs leading-5 text-mute">{text.hint}</p>
      <ul className="mt-2 space-y-2 text-sm leading-6">
        {items.map((item, i) => {
          const name = item.kind === "audit" && !item.exact ? text.kinds.auditPark : text.kinds[item.kind];
          const when = [item.date && fill(text.checked, { date: item.date }), item.year && fill(text.year, { year: item.year })]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={`${item.kind}-${i}`} className="border-l border-line pl-3">
              <span className="text-ink-soft">{name}</span>
              {(when || item.url) && (
                <span className="ml-2 inline-flex flex-wrap items-center gap-x-2 text-xs text-mute">
                  {when}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer" className="link-line inline-flex items-center gap-1 text-ink">
                      {item.kind === "audit" ? text.record : text.open}
                      <IconArrowRight className="-rotate-45 text-[10px]" />
                    </a>
                  )}
                </span>
              )}
              {item.stale && (
                <p className="text-xs text-clay-700">{fill(text.stale[item.stale], { year: item.year ?? "" })}</p>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
