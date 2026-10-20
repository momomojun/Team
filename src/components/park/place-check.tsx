"use client";

import { savePlaceCheck, usePlaceChecks, type CheckStatus } from "@/lib/place-checks";

export interface CheckText {
  works: string;
  broken: string;
  missing: string;
  onDevice: string;
}

const ORDER: CheckStatus[] = ["works", "broken", "missing"];

const selected: Record<CheckStatus, string> = {
  works: "text-pine-700",
  broken: "text-clay-700",
  missing: "text-ink",
};

/** 能用 / 坏了 / 找不到。只记在这台设备上 */
export function PlaceCheckButtons({ id, text }: { id: string; text: CheckText }) {
  const store = usePlaceChecks();
  const current = store[id];
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
      {ORDER.map((status) => {
        const on = current?.status === status;
        return (
          <button
            key={status}
            type="button"
            aria-pressed={on}
            title={text.onDevice}
            onClick={() => savePlaceCheck(id, status)}
            className={`text-xs ${on ? `font-medium ${selected[status]}` : "text-mute hover:text-ink"}`}
          >
            {text[status]}
          </button>
        );
      })}
    </div>
  );
}
