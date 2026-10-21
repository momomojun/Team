"use client";

import { useEffect, useRef } from "react";
import { commonsSrc } from "@/components/commons-image";

export interface MontagePhoto {
  url: string;
  credit: string;
}

/** 每张照片放多久（一倍速，毫秒）：按这一站要念多久平分，太快看不清、太慢就闷 */
const SLIDE_MIN = 4200;
const SLIDE_MAX = 7000;
/** 下一张淡入用多久 */
const FADE = 1400;
/** 从地图上这一站的位置圆形展开、收回去 */
const OPEN = 950;
const CLOSE = 750;
const EASE = "cubic-bezier(0.7, 0, 0.2, 1)";

/** 每张照片怎么动：从哪个缩放、位置慢慢推到哪（推近、拉远、左右上下平移轮着来，不会连着两张一样） */
const MOVES = [
  { s: [1.04, 1.18], x: [-1.5, 1.5], y: [1, -1] },
  { s: [1.18, 1.05], x: [1.5, -1], y: [-0.5, 0.8] },
  { s: [1.06, 1.16], x: [1.2, -1.6], y: [-1, 0.6] },
  { s: [1.16, 1.04], x: [-1.2, 0.8], y: [1.2, -0.4] },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** 全屏要的照片宽度（取 Commons 的标准缩略图宽度，最大 1920） */
function screenWidth() {
  if (typeof window === "undefined") return 1280;
  return Math.min(1920, Math.round(window.innerWidth * Math.min(2, window.devicePixelRatio || 1)));
}

/** 提前下载：到站时照片已经在缓存里，展开的时候不会是一片空白 */
export function preloadPhotos(photos: MontagePhoto[] | undefined, count = photos?.length ?? 0) {
  if (typeof window === "undefined" || !photos) return;
  const width = screenWidth();
  for (const photo of photos.slice(0, count)) {
    const image = new Image();
    image.decoding = "async";
    image.src = commonsSrc(photo.url, width);
  }
}

/**
 * 讲解版到站的画面：照片从地图上这一站的位置圆形展开、铺满全屏，几张轮流放，每张慢慢推近或平移（Ken Burns），交叉淡入；
 * 上面一排细条是第几张，右上是第几站和站名（手机上站名在下面的卡片里，这里不重复）。讲完 leaving 变成 true，
 * 收回到地图上车所在的那一点，车接着开。暂停、倍速跟着讲解走；系统设了“减少动画”的只淡入淡出、不推镜头、不展开。
 */
export function StopMontage({
  photos,
  origin,
  number,
  title,
  caption,
  color,
  durationMs,
  paused,
  speed,
  leaving,
}: {
  photos: MontagePhoto[];
  /** 这一站在地图上的位置（相对地图容器的像素） */
  origin?: { x: number; y: number };
  /** 大号数字：第几站、第几天；片头不写 */
  number?: number;
  title: string;
  caption?: string;
  color: string;
  /** 这一站大概要念多久（一倍速） */
  durationMs: number;
  paused: boolean;
  speed: number;
  leaving: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
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

  // 展开、收回：clip-path 的圆从这一站的位置长大到盖住整个屏幕
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { width, height } = root.getBoundingClientRect();
    const x = origin?.x ?? width / 2;
    const y = origin?.y ?? height / 2;
    const far = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    const shut = `circle(0px at ${x}px ${y}px)`;
    const open = `circle(${Math.ceil(far)}px at ${x}px ${y}px)`;
    const frames = calm ? [{ opacity: 0 }, { opacity: 1 }] : [{ clipPath: shut }, { clipPath: open }];
    let animation: Animation | null = null;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      animation = root.animate(leaving ? [...frames].reverse() : frames, {
        duration: (leaving ? CLOSE : OPEN) / live.current.speed,
        easing: EASE,
        fill: "both",
      });
    };
    if (leaving) run();
    else {
      // 第一张照片解码好了再展开，不然展开的是一片黑；网慢的最多等 1.5 秒
      root.style.clipPath = calm ? "none" : shut;
      if (calm) root.style.opacity = "0";
      const first = slideRefs.current[0];
      const ready = first ? first.decode().catch(() => undefined) : Promise.resolve();
      Promise.race([ready, new Promise((resolve) => setTimeout(resolve, 1500))]).then(run);
    }
    return () => {
      cancelled = true;
      animation?.cancel();
    };
  }, [leaving, origin?.x, origin?.y]);

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

  const width = screenWidth();
  return (
    <div
      ref={rootRef}
      data-montage=""
      className="pointer-events-none absolute inset-0 z-[15] overflow-hidden bg-ink"
      // 一开始收着，第一张照片好了再展开（见上面的 effect）
      style={{ clipPath: "circle(0px at 50% 50%)" }}
      aria-hidden="true"
    >
      {photos.map((photo, index) => (
        // 不用 next/image：要按帧改 transform、提前下载同一张，自己挑好缩略图宽度更直接
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={photo.url}
          ref={(element) => {
            slideRefs.current[index] = element;
          }}
          src={commonsSrc(photo.url, width)}
          alt=""
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          style={{ opacity: index === 0 ? 1 : 0 }}
        />
      ))}
      {/* 上面压一点暗，字和细条才看得清；下面给字幕和控制条留一点暗 */}
      <div className="absolute inset-x-0 top-0 z-[3] h-1/3 bg-gradient-to-b from-ink/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-[3] h-1/3 bg-gradient-to-t from-ink/55 to-transparent" />
      {count > 1 && (
        <div className="absolute top-3 right-4 left-4 z-[4] flex gap-1.5 sm:left-[26rem]">
          {photos.map((photo, index) => (
            <span key={photo.url} className="h-[2px] flex-1 overflow-hidden bg-paper/30">
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
      <div className="absolute top-8 right-6 z-[4] hidden max-w-[34rem] text-right text-paper sm:block">
        {number !== undefined && (
          <p className="font-serif text-[5.5rem] leading-[0.8] tracking-tight lining-nums opacity-90" style={{ textShadow: "0 2px 24px rgb(0 0 0 / 0.35)" }}>
            {String(number).padStart(2, "0")}
          </p>
        )}
        <p className="mt-3 font-serif text-[2.6rem] leading-[1.05]" style={{ textShadow: "0 2px 18px rgb(0 0 0 / 0.45)" }}>
          {title}
        </p>
        {caption && (
          <p className="mt-3 inline-block border-r-[3px] pr-3 text-[13px] tracking-[0.12em] text-paper/90 lining-nums" style={{ borderColor: color }}>
            {caption}
          </p>
        )}
      </div>
      <span ref={creditRef} className="absolute right-4 bottom-[7.5rem] z-[4] max-w-[60%] truncate text-[10px] text-paper/75 sm:bottom-24" />
    </div>
  );
}
