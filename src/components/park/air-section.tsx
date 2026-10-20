import { Section } from "@/components/section";
import type { Park } from "@/data/parks";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";
import { getAirCurrent } from "@/lib/air";
import { aqiCategory } from "@/lib/air-types";
import { settle } from "@/lib/settle";

export async function AirSection({ park, dict }: { park: Park; dict: Dictionary }) {
  const t = dict.park.air;
  const result = await settle(getAirCurrent(park.gateway));
  const air = result.ok ? result.data : null;
  const category = air ? aqiCategory(air.pm25Aqi) : null;
  const note =
    category === "good" ? t.good : category === "moderate" ? t.moderate : category ? t.smoke : null;

  return (
    <Section title={t.title} source={t.source}>
      {air && category ? (
        <div>
          <p className="font-serif text-5xl leading-none tabular-nums">{air.pm25Aqi}</p>
          <p className="mt-3 text-sm">{fill(t.aqi, { n: air.pm25Aqi, category: t.categories[category] })}</p>
          <p className="mt-1 text-xs text-mute">{fill(t.pm, { n: air.pm25 })}</p>
          {note && (
            <p className={`mt-4 max-w-xl text-sm leading-7 ${category === "good" ? "text-ink-soft" : "text-clay-800"}`}>
              {note}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-mute">{t.unavailable}</p>
      )}
    </Section>
  );
}
