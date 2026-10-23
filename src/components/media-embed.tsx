"use client";

import { useState } from "react";

/**
 * 原帖、片段用平台官方的嵌入播放（Instagram 帖子、YouTube 视频），不下载转存：照片和画面由版权方的平台提供。
 * 点了才加载：不点不会向 Instagram、YouTube 发请求（页面快，也不带第三方 cookie）；YouTube 用 nocookie 域名。
 */
export function MediaEmbed({
  kind,
  src,
  start,
  title,
  label,
  note,
  hide,
}: {
  kind: "instagram" | "youtube";
  /** Instagram：帖子链接（https://www.instagram.com/p/xxx/）；YouTube：视频 id */
  src: string;
  /** YouTube 从第几秒开始 */
  start?: number;
  /** iframe 的标题（读屏用） */
  title: string;
  /** 按钮上的字：“看原帖”“看这场戏” */
  label: string;
  /** 按钮下面的小字：从哪个平台加载 */
  note: string;
  /** 收起 */
  hide: string;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    if (kind === "youtube") {
      return (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative block aspect-video w-full max-w-[480px] overflow-hidden border border-line bg-ink text-left"
          >
            <img
              src={`https://i.ytimg.com/vi/${encodeURIComponent(src)}/hqdefault.jpg`}
              alt={title}
              className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105 group-hover:opacity-100"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/15">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-clay-700/90 text-white shadow-lg transition-transform group-hover:scale-110">
                <span className="ml-0.5 text-base leading-none" aria-hidden>▶</span>
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 text-white">
              <p className="text-xs font-medium leading-tight">{label}</p>
              <p className="mt-0.5 text-[10px] text-white/70">{note}</p>
            </div>
          </button>
        </div>
      );
    }
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 border border-ink/25 px-3 py-1.5 text-xs text-ink transition-colors hover:border-ink"
        >
          <span aria-hidden>▶</span>
          {label}
        </button>
        <p className="mt-1 text-[11px] text-mute">{note}</p>
      </div>
    );
  }
  const url =
    kind === "instagram"
      ? `${src.replace(/\/?$/, "/")}embed/captioned/`
      : `https://www.youtube-nocookie.com/embed/${encodeURIComponent(src)}?rel=0${start ? `&start=${start}` : ""}`;
  return (
    <div className="mt-3">
      <div className={kind === "instagram" ? "max-w-[400px]" : "aspect-video w-full max-w-[640px]"}>
        <iframe
          src={url}
          title={title}
          loading="lazy"
          allow={kind === "youtube" ? "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" : undefined}
          allowFullScreen={kind === "youtube"}
          referrerPolicy="strict-origin-when-cross-origin"
          className={kind === "instagram" ? "h-[640px] w-full border border-line bg-paper" : "h-full w-full border-0"}
        />
      </div>
      <button type="button" onClick={() => setOpen(false)} className="mt-1 text-[11px] text-mute hover:text-clay-700">
        {hide}
      </button>
    </div>
  );
}
