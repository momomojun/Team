"use client";

import type { GuidesResponse } from "@/lib/guides";
import { useJson } from "@/lib/use-json";

export function GuidesSection({
  parkCode,
  text,
}: {
  parkCode: string;
  text: {
    eyebrow: string;
    title: string;
    intro: string;
    source: string;
    topics: { route: string; spots: string; food: string };
    empty: string;
    missingKey: string;
    unavailable: string;
    quota: string;
  };
}) {
  const data = useJson<GuidesResponse>(`/api/guides/${parkCode}`);

  return (
    <>
        <p className="eyebrow text-mute">{text.eyebrow}</p>
        <h2 className="mt-5 font-serif text-[clamp(2rem,3.5vw,3.2rem)] leading-tight">{text.title}</h2>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-soft">{text.intro}</p>

        {data === undefined ? (
          <div className="mt-12 space-y-3" aria-busy="true">
            <div className="h-3 w-2/3 animate-pulse bg-ink/10" />
            <div className="h-3 w-1/2 animate-pulse bg-ink/10" />
            <div className="h-3 w-3/5 animate-pulse bg-ink/10" />
          </div>
        ) : data === null ? (
          <p className="mt-10 border-l border-clay-600 pl-5 text-sm leading-7 text-ink-soft">{text.unavailable}</p>
        ) : !data.configured ? (
          <p className="mt-10 max-w-3xl border-l border-mute pl-5 text-sm leading-7 text-ink-soft">{text.missingKey}</p>
        ) : data.error ? (
          <p className="mt-10 border-l border-clay-600 pl-5 text-sm leading-7 text-ink-soft">
            {data.error === "quota" ? text.quota : text.unavailable}
          </p>
        ) : (
          <div className="mt-12 grid gap-x-12 gap-y-14 lg:grid-cols-3">
            {data.groups.map((group) => (
              <div key={group.topic}>
                <h3 className="border-t border-ink pt-4 font-serif text-2xl">{text.topics[group.topic]}</h3>
                {group.videos.length === 0 ? (
                  <p className="mt-4 text-sm text-mute">{text.empty}</p>
                ) : (
                  <ul className="mt-6 space-y-6">
                    {group.videos.map((video) => (
                      <li key={video.id}>
                        <a href={video.url} target="_blank" rel="noreferrer" className="block font-serif text-lg leading-snug hover:text-clay-700">
                          {video.title}
                        </a>
                        <p className="mt-1.5 text-xs text-mute">
                          {video.channel}
                          {video.published ? ` · ${video.published}` : ""} · {text.source}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
    </>
  );
}
