import { Section } from "@/components/section";
import type { AttractionWithPhoto } from "@/data/attractions";
import type { Dictionary } from "@/i18n/dictionaries";
import { attractionHref } from "@/lib/park-page";
import { poorSignal } from "@/lib/signal-notes";

export function SignalSection({
  attractions,
  locale,
  code,
  dict,
}: {
  attractions: AttractionWithPhoto[];
  locale: string;
  code: string;
  dict: Dictionary;
}) {
  const t = dict.park.signal;
  const rows = attractions.flatMap((attraction) =>
    (attraction.tips ?? []).filter(poorSignal).map((tip) => ({ id: attraction.id, name: attraction.nameZh, tip })),
  );

  return (
    <Section title={t.title} source={t.source}>
      <p className="max-w-3xl text-sm leading-7 text-ink-soft">{rows.length > 0 ? t.intro : t.empty}</p>
      {rows.length > 0 && (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {rows.map((row) => (
            <li key={`${row.id}-${row.tip}`} className="py-3">
              <a href={attractionHref(locale, code, row.id)} className="link-line text-sm">
                {row.name}
              </a>
              <p className="mt-1 text-sm leading-7 text-ink-soft">{row.tip}</p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
