"use client";

import { useState } from "react";
import { CommonsImage } from "@/components/commons-image";

export interface FilmCard {
  id: string;
  title: string;
  year: number;
  place: string;
  /** 取景地实景照片（Commons） */
  image: string;
  youtube: string;
  start?: number;
  trailer: boolean;
}

/**
 * 电影里的国家公园（照着 Wabunka 的“Japan Through Film”）：一张取景地照片当封面，中间一个播放圈；
 * 点了才换成 YouTube（nocookie）的播放器，不点不向 YouTube 发任何请求。封面悬停时慢慢放大、压暗一点。
 */
export function FilmTile({ film, text }: { film: FilmCard; text: { play: string; trailer: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <figure className="w-[82vw] shrink-0 snap-start sm:w-[60vw] md:w-[calc((100%-0.5rem)/2)] lg:w-[calc((100%-1rem)/3)]">
      <div className="relative aspect-video overflow-hidden bg-night">
        {open ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${film.youtube}?autoplay=1&rel=0${film.start ? `&start=${film.start}` : ""}`}
            title={film.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="group absolute inset-0 text-white">
            <CommonsImage
              src={film.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 82vw"
              className="object-cover brightness-[0.8] transition-[scale,filter] duration-700 ease-(--ease-soft) group-hover:scale-[1.04] group-hover:brightness-[0.62]"
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full border border-white/70 bg-black/25 backdrop-blur-[2px] transition-[transform,border-color] duration-300 group-hover:scale-110 group-hover:border-gold">
                <span aria-hidden className="ml-1 size-0 border-y-[9px] border-l-[15px] border-y-transparent border-l-white" />
              </span>
            </span>
            <span className="sr-only">{text.play}</span>
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pt-10 pb-4 text-left">
              <span className="block font-serif text-[19px] leading-snug">
                {film.title} <span className="text-white/70">({film.year})</span>
              </span>
              {film.trailer && <span className="mt-1 block text-[11px] text-white/70">{text.trailer}</span>}
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3 text-[13px] leading-6 text-ink-soft">{film.place}</figcaption>
    </figure>
  );
}
