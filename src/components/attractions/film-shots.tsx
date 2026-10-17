import { CreditedPhoto } from "@/components/credited-photo";
import type { FilmSpot } from "@/data/film-spots";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";

type FilmText = Pick<Dictionary, "attraction" | "units">;

/**
 * 一条电影同款：取景地照片（署名作者和授权），片名、年份、是电影还是剧、主创，拍的是哪场戏、怎么拍同款、安全提醒、来源。
 * compact：行程里展开的景点详情，只留场景和拍法；ownPhotoOnly：景点卡片上已经有这个景点的图集，只显示专门挑的照片
 */
export function FilmShotItem({
  shot,
  text,
  compact = false,
  ownPhotoOnly = false,
}: {
  shot: FilmSpot;
  text: FilmText;
  compact?: boolean;
  ownPhotoOnly?: boolean;
}) {
  const t = text.attraction;
  const photo = ownPhotoOnly && !shot.photoFile ? undefined : shot.photo;
  return (
    <div className="text-sm leading-6">
      {photo && (
        <CreditedPhoto
          photo={photo}
          alt={`${shot.titleEn} · ${shot.placeZh}`}
          creditTemplate={t.photoCredit}
          sizes="(min-width: 768px) 40vw, 100vw"
          className={`mb-3 ${compact ? "aspect-[16/9]" : "aspect-[3/2]"}`}
        />
      )}
      <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-mute">
        <span className="font-serif text-base text-ink">{shot.titleZh}</span>
        {shot.titleEn !== shot.titleZh && <span className="italic">{shot.titleEn}</span>}
        <span>
          · {shot.year} · {t.filmKinds[shot.kind]}
          {shot.creditsZh && ` · ${shot.creditsZh}`}
        </span>
        {shot.sources.map((source, i) => (
          <a key={source} href={source} target="_blank" rel="noreferrer" className="hover:text-clay-700">
            {t.filmSource}
            {shot.sources.length > 1 ? ` ${i + 1}` : ""}
          </a>
        ))}
      </p>
      {!shot.attraction && <p className="mt-1 text-xs text-mute">{shot.placeZh}</p>}
      <p className="mt-2 text-ink-soft">{shot.sceneZh}</p>
      <p className="mt-2 text-ink-soft">
        <span className="text-ink">
          {t.filmHowTo}
          {text.units.colon}
        </span>
        {shot.howToZh}
      </p>
      {!compact && shot.tipsZh.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-ink-soft marker:text-line">
          {shot.tipsZh.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
      {shot.noteZh && <p className="mt-2 text-xs text-mute">{shot.noteZh}</p>}
    </div>
  );
}

/** 景点卡片里的“电影同款”：景点自己有图集，只显示专门为电影挑的照片 */
export function FilmShots({ shots, text, compact = false }: { shots?: FilmSpot[]; text: FilmText; compact?: boolean }) {
  if (!shots?.length) return null;
  return (
    <div className={compact ? "border-t border-line pt-3" : "border-t border-line pt-4"}>
      <p className="text-xs tracking-[0.1em] text-mute">{fill(text.attraction.filmTitle, { n: shots.length })}</p>
      <ul className="mt-3 space-y-5">
        {shots.map((shot) => (
          <li key={shot.id}>
            <FilmShotItem shot={shot} text={text} compact={compact} ownPhotoOnly />
          </li>
        ))}
      </ul>
    </div>
  );
}
