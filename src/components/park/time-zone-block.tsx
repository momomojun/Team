import { timeNotesFor } from "@/data/time-notes";
import type { Locale } from "@/i18n/config";
import { localize } from "@/i18n/convert";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";
import { utcOffset } from "@/lib/time-zone";

const utc = (minutes: number) => {
  const hours = minutes / 60;
  return `${hours < 0 ? "-" : "+"}${Math.abs(hours)}`;
};

/**
 * 公园页的“时区”：叫什么时间、调不调夏令时（按明年的规则，2026 年起艾伯塔、BC 不再调），
 * 以及这座公园时区的坑（time-notes.ts）
 */
export function TimeZoneBlock({
  park,
  timeZone,
  locale,
  dict,
}: {
  park: string;
  timeZone: string;
  locale: Locale;
  dict: Pick<Dictionary, "park" | "units">;
}) {
  const t = dict.park;
  const year = new Date().getFullYear() + 1;
  const winter = utcOffset(timeZone, `${year}-01-15`);
  const summer = utcOffset(timeZone, `${year}-07-15`);
  const rule =
    winter === summer ? fill(t.timeFixed, { o: utc(winter) }) : fill(t.timeDst, { summer: utc(summer), winter: utc(winter) });
  const notes = timeNotesFor(park);
  const local = notes.find((note) => note.zoneZh)?.zoneZh;
  return (
    <div>
      <p className="eyebrow text-mute">{t.timeTitle}</p>
      <p className="mt-4 text-sm leading-7 text-ink-soft">
        {fill(t.timeLine, { zone: local ? localize(local, locale) : (dict.units.zones[timeZone] ?? timeZone), rule })}
      </p>
      {notes.map((note) => (
        <div key={note.noteZh} className="mt-3 text-sm leading-7 text-ink-soft">
          <p>{localize(note.noteZh, locale)}</p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-mute">
            {note.sources.map((source, i) => (
              <a key={source} href={source} target="_blank" rel="noreferrer" className="link-line">
                {t.timeSource}
                {note.sources.length > 1 ? ` ${i + 1}` : ""}
              </a>
            ))}
          </p>
        </div>
      ))}
    </div>
  );
}
