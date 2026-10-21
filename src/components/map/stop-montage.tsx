"use client";

import { useEffect, useRef } from "react";
import { commonsSrc } from "@/components/commons-image";

export interface MontagePhoto {
  url: string;
  credit: string;
}

/** 每张照片放多久（一倍速，毫秒）：按这一段要念多久平分，太快看不清、太慢就闷 */
const SLIDE_MIN = 4200;
const SLIDE_MAX = 7000;
/** 下一张淡入用多久 */
const FADE = 1400;
/** 照片窗要的缩略图宽度：卡片最宽约 34rem，按两倍屏取 Commons 的标准宽度 */
const PHOTO_WIDTH = 1280;

/** 每张照片怎么动：从哪个缩放、位置慢慢推到哪（推近、拉远、左右上下平移轮着来，不会连着两张一样） */
const MOVES = [
  { s: [1.04, 1.16], x: [-1.5, 1.5], y: [1, -1] },
  { s: [1.16, 1.05], x: [1.5, -1], y: [-0.5, 0.8] },
  { s: [1.06, 1.15], x: [1.2, -1.6], y: [-1, 0.6] },
  { s: [1.15, 1.04], x: [-1.2, 0.8], y: [1.2, -0.4] },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** 提前下载：卡片出来时照片已经在缓存里，不会先空一下 */
export function preloadPhotos(photos: MontagePhoto[] | undefined, count = photos?.length ?? 0) {
  if (typeof window === "undefined" || !photos) return;
  for (const photo of photos.slice(0, count)) {
    const image = new Image();
    image.decoding = "async";
    image.src = commonsSrc(photo.url, PHOTO_WIDTH);
  }
}

/**
 * 讲解卡片顶上的照片窗：几张照片轮流放，每张慢慢推近或平移（Ken Burns），交叉淡入；上面一排细条是第几张，
 * 左下压着这一站（这一天）的片名：一行小字（第几站、几点到、停多久）和大号站名。地图留在卡片外面，路线一直看得见。
 * 暂停、倍速跟着讲解走；系统设了“减少动画”的只淡入淡出、不推镜头。
 */
export function PhotoReel({
  photos,
  eyebrow,
  title,
  color,
  durationMs,
  paused,
  speed,
}: {
  photos: MontagePhoto[];
  /** 片名上面那行小字 */
  eyebrow?: string;
  title: string;
  color: string;
  /** 这一段大概要念多久（一倍速） */
  durationMs: number;
  paused: boolean;
  speed: number;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const slideRefs = useRef<(HTMLImageElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const creditRef = useRef<HTMLSpanElement>(null);
  const live = useRef({ paused, speed });
  useEffect(() => {
    live.current = { paused, speed };
  }, [paused, speed]);
  const count = photos.length;
  // 外面每次重新渲染（换一句字幕）都会给一个新的数组，按网址认是不是同一组照片，免得轮播从头再来
  const photoKey = photos.map((photo) => photo.url).join("|");
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  const slideMs = Math.min(SLIDE_MAX, Math.max(SLIDE_MIN, durationMs / Math.max(1, count)));

  // 第一张解码好了再淡出来，不会先闪一下空的灰框；网慢的最多等 1.2 秒
  useEffect(() => {
    const root = rootRef.current;
    const first = slideRefs.current[0];
    if (!root) return;
    let cancelled = false;
    const ready = first ? first.decode().catch(() => undefined) : Promise.resolve();
    Promise.race([ready, new Promise((resolve) => setTimeout(resolve, 1200))]).then(() => {
      if (!cancelled) root.dataset.ready = "";
    });
    return () => {
      cancelled = true;
    };
  }, [photoKey]);

  // 换照片、推镜头、上面的细条：每帧按自己的钟算（暂停时钟不走，倍速时走得快），直接改样式、不经过 React
  useEffect(() => {
    if (count === 0) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let elapsed = 0;
    let last = performance.now();
    let raf = 0;
    let shownCredit = -1;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = now - last;
      last = now;
      if (!live.current.paused) elapsed += dt * live.current.speed;
      const step = Math.floor(elapsed / slideMs);
      const current = step % count;
      const previous = step > 0 ? (step - 1) % count : -1;
      const into = elapsed - step * slideMs;
      slideRefs.current.forEach((image, index) => {
        if (!image) return;
        const isCurrent = index === current;
        const isPrevious = index === previous && into < FADE && previous !== current;
        if (!isCurrent && !isPrevious) {
          image.style.opacity = "0";
          return;
        }
        // 上一张接着动完淡出的这一段，所以每张动的时间是放的时间加淡入的时间
        const local = isCurrent ? into : slideMs + into;
        const t = ease(Math.min(1, local / (slideMs + FADE)));
        const move = MOVES[(isCurrent ? step : step - 1) % MOVES.length];
        image.style.zIndex = isCurrent ? "2" : "1";
        image.style.opacity = isCurrent ? String(step === 0 ? 1 : Math.min(1, into / FADE)) : "1";
        image.style.transform = calm
          ? "none"
          : `scale(${lerp(move.s[0], move.s[1], t)}) translate(${lerp(move.x[0], move.x[1], t)}%, ${lerp(move.y[0], move.y[1], t)}%)`;
      });
      barRefs.current.forEach((bar, index) => {
        if (!bar) return;
        bar.style.transform = `scaleX(${index === current ? Math.min(1, into / slideMs) : index < current ? 1 : 0})`;
      });
      if (creditRef.current && shownCredit !== current) {
        shownCredit = current;
        creditRef.current.textContent = photosRef.current[current]?.credit ?? "";
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count, photoKey, slideMs]);

  return (
    <figure ref={rootRef} data-reel="" className="tour-reel relative aspect-[2/1] w-full overflow-hidden bg-ink sm:aspect-[16/10]">
      {photos.map((photo, index) => (
        // 不用 next/image：要按帧改 transform、提前下载同一张，自己挑好缩略图宽度更直接
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={photo.url}
          ref={(element) => {
            slideRefs.current[index] = element;
          }}
          src={commonsSrc(photo.url, PHOTO_WIDTH)}
          alt=""
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          style={{ opacity: index === 0 ? 1 : 0 }}
        />
      ))}
      {/* 下面压暗一点，片名才看得清；上面一点点，给细条 */}
      <div className="absolute inset-0 z-[3] bg-[linear-gradient(to_top,rgb(28_27_24/0.78)_0%,rgb(28_27_24/0.25)_42%,transparent_62%,transparent_86%,rgb(28_27_24/0.3)_100%)]" />
      {count > 1 && (
        <div className="absolute top-2.5 right-3 left-3 z-[4] flex gap-1">
          {photos.map((photo, index) => (
            <span key={photo.url} className="h-[2px] flex-1 overflow-hidden bg-paper/35">
              <span
                ref={(element) => {
                  barRefs.current[index] = element;
                }}
                className="block h-full origin-left bg-paper"
                style={{ transform: "scaleX(0)" }}
              />
            </span>
          ))}
        </div>
      )}
      <figcaption className="absolute right-4 bottom-3.5 left-5 z-[4] text-paper">
        {eyebrow && (
          <p className="tour-reel-line flex items-center gap-2 text-[11px] tracking-[0.16em] text-paper/85 lining-nums">
            <span className="inline-block h-px w-6 shrink-0" style={{ backgroundColor: color }} />
            {eyebrow}
          </p>
        )}
        <p className="tour-reel-title mt-1.5 max-w-[85%] font-serif text-[1.6rem] leading-[1.08] lining-nums sm:text-[2.1rem]">{title}</p>
      </figcaption>
      <span ref={creditRef} className="absolute top-5 right-3 z-[4] max-w-[55%] truncate text-right text-[9px] text-paper/70" />
    </figure>
  );
}
