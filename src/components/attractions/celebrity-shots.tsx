import { CreditedPhoto } from "@/components/credited-photo";
import type { CelebrityShot } from "@/data/celebrities";
import type { Photo } from "@/data/attractions/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, otherName } from "@/i18n/format";
import { MediaEmbed } from "@/components/media-embed";

/** YouTube 链接 → 视频 id（watch?v=、youtu.be/、shorts/） */
const youtubeId = (url: string) => url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1];

type CelebText = Pick<Dictionary, "attraction" | "units">;

/** 发帖日期：2026-08-10 → 2026.08.10，只知道月份的 2026-05 → 2026.05 */
const dateText = (date: string) => date.replaceAll("-", ".");

/**
 * 一条明星同款：谁、哪天发的、链接（原帖，没有就本人主页）和报道，照片里怎么拍的、怎么拍同款、安全提醒。
 * compact：行程里展开的景点详情，只留拍法和链接
 */
export function CelebrityShotItem({
  shot,
  text,
  compact = false,
  photo,
}: {
  shot: CelebrityShot;
  text: CelebText;
  compact?: boolean;
  photo?: Photo;
}) {
  const t = text.attraction;
  const link = shot.postUrl ?? shot.profileUrl;
  return (
    <div className="text-sm leading-6">
      {photo && !compact && (
        <CreditedPhoto
          photo={photo}
          alt={`${shot.nameZh} · ${shot.placeZh}`}
          creditTemplate={t.photoCredit}
          sizes="(min-width: 768px) 40vw, 100vw"
          className="mb-3 aspect-[3/2]"
        />
      )}
      <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-mute">
        <span className="font-serif text-base text-ink">{shot.nameZh}</span>
        {otherName(shot.nameZh, shot.nameEn) && <span className="text-ink-soft">{shot.nameEn}</span>}
        {shot.group && <span>{shot.group}</span>}
        <span>· {dateText(shot.date)}</span>
        {link && (
          <a href={link} target="_blank" rel="noreferrer" className="link-line text-clay-700">
            {shot.postUrl ? t.celebPost : t.celebProfile} · {t.celebPlatforms[shot.platform] ?? shot.platform}
          </a>
        )}
        {shot.sources.map((source, i) => (
          <a key={source} href={source} target="_blank" rel="noreferrer" className="hover:text-clay-700">
            {t.celebSource}
            {shot.sources.length > 1 ? ` ${i + 1}` : ""}
          </a>
        ))}
      </p>
      {shot.whoZh && <p className="mt-1 text-xs text-mute">{shot.whoZh}</p>}
      {!shot.attraction && <p className="mt-1 text-xs text-mute">{shot.placeZh}</p>}
      <p className="mt-2 text-ink-soft">{shot.shotZh}</p>
      {!compact && shot.postUrl && shot.platform === "instagram" && (
        <MediaEmbed
          kind="instagram"
          src={shot.postUrl}
          title={`${shot.nameEn} · Instagram`}
          label={t.embedPost}
          note={fill(t.embedNote, { platform: "Instagram", channel: shot.nameEn })}
          hide={t.embedHide}
        />
      )}
      {/* 明星官方频道上的旅行视频：和电影同款一样，点了才用 youtube-nocookie 的嵌入播放 */}
      {!compact && shot.postUrl && shot.platform === "youtube" && youtubeId(shot.postUrl) && (
        <MediaEmbed
          kind="youtube"
          src={youtubeId(shot.postUrl)!}
          title={`${shot.nameEn} · YouTube`}
          label={t.embedPost}
          note={fill(t.embedNote, { platform: "YouTube", channel: shot.nameEn })}
          hide={t.embedHide}
        />
      )}
      {!compact && (
        <>
          <p className="mt-2 text-ink-soft">
            <span className="text-ink">{t.celebHowTo}
              {text.units.colon}
            </span>
            {shot.howToZh}
          </p>
          {shot.tipsZh.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-ink-soft marker:text-line">
              {shot.tipsZh.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          )}
        </>
      )}
      {shot.noteZh && <p className="mt-2 text-xs text-mute">{shot.noteZh}</p>}
    </div>
  );
}

/** 景点卡片里的“明星同款” */
export function CelebrityShots({ shots, text, compact = false }: { shots?: CelebrityShot[]; text: CelebText; compact?: boolean }) {
  if (!shots?.length) return null;
  return (
    <div className={compact ? "border-t border-line pt-3" : "border-t border-line pt-4"}>
      <p className="text-xs tracking-[0.1em] text-mute">{text.attraction.celebTitle}</p>
      <ul className="mt-3 space-y-5">
        {shots.map((shot) => (
          <li key={shot.id}>
            <CelebrityShotItem shot={shot} text={text} compact={compact} />
          </li>
        ))}
      </ul>
    </div>
  );
}
