import type { AttractionWithPhoto } from "@/data/attractions";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";
import { fitFor, hasParty, type FitReason, type Party } from "@/lib/suitability";

type FamilyText = Pick<Dictionary, "attraction" | "units">;

/** 一条不适合、要注意的原因，当前语言 */
export function fitReasonText(reason: FitReason, text: FamilyText): string {
  const f = text.attraction.family;
  switch (reason.kind) {
    case "minAge":
      return fill(f.minAge, { age: reason.age });
    case "kidsAge":
      return fill(f.kidsFrom, { age: reason.age });
    case "stroller":
      return f.stroller[reason.value];
    case "wheelchair":
      return f.wheelchair[reason.value];
    case "seniors":
      return f.seniors[reason.value];
    case "hazard":
      return f.hazards[reason.hazard];
  }
}

/** 这群人去这个景点的原因，用“、”连起来；合适就是 null */
export function fitSummary(party: Party | undefined, attraction: AttractionWithPhoto, text: FamilyText): string | null {
  const fit = fitFor(party, attraction.family);
  return fit.reasons.length > 0 ? fit.reasons.map((reason) => fitReasonText(reason, text)).join(text.units.listSep) : null;
}

/** 没排进去的原因：决定不去的那几条，再加上带孩子老人怎么玩的说明 */
export function unsuitableNote(party: Party | undefined, attraction: AttractionWithPhoto, text: FamilyText): string | null {
  const fit = fitFor(party, attraction.family);
  if (fit.blocking.length === 0) return null;
  const reasons = fit.blocking.map((reason) => fitReasonText(reason, text)).join(text.units.listSep);
  return attraction.family?.noteZh ? `${reasons}${text.units.sentenceSep}${attraction.family.noteZh}` : reasons;
}

/** 景点卡片、行程里点开的详情：几岁的孩子能去、婴儿车、轮椅、老人，有什么危险；带了同行的人时先说这次要注意什么 */
export function FamilyFit({
  attraction: a,
  party,
  text,
}: {
  attraction: AttractionWithPhoto;
  party?: Party;
  text: FamilyText;
}) {
  const s = a.family;
  if (!s) return null;
  const f = text.attraction.family;
  const items = [
    s.minAge !== undefined ? fill(f.minAge, { age: s.minAge }) : s.kidsFromAge === 0 ? f.babies : fill(f.kidsFrom, { age: s.kidsFromAge }),
    f.stroller[s.stroller],
    f.wheelchair[s.wheelchair],
    f.seniors[s.seniors],
  ];
  const fit = hasParty(party) ? fitFor(party, s) : null;
  return (
    <div className="border-t border-line pt-3">
      <p className="text-xs tracking-[0.1em] text-mute">{f.title}</p>
      {fit && fit.reasons.length > 0 && (
        <p className={`mt-2 text-sm leading-6 ${fit.level === "no" ? "text-clay-800" : "text-clay-700"}`}>
          {fill(f.yourPartyLine, { reasons: fit.reasons.map((reason) => fitReasonText(reason, text)).join(text.units.listSep) })}
        </p>
      )}
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
        {items.map((item) => (
          <span key={item} className="[&+&]:before:mr-3 [&+&]:before:text-line [&+&]:before:content-['/']">
            {item}
          </span>
        ))}
      </p>
      {s.hazards && s.hazards.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {s.hazards.map((hazard) => (
            <li key={hazard} className="border border-clay-600/40 px-2 py-0.5 text-[11px] leading-5 text-clay-700">
              {f.hazards[hazard]}
            </li>
          ))}
        </ul>
      )}
      {s.noteZh && (
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          {s.noteZh}
          {s.source && (
            <>
              {" "}
              <a href={s.source} target="_blank" rel="noreferrer" className="link-line text-xs text-mute">
                {f.source}
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
