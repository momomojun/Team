"use client";

import Link from "next/link";
import { useEffect, useState, ViewTransition, type CSSProperties, type ReactNode } from "react";
import { CommonsImage } from "@/components/commons-image";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

export interface HeroSlide {
  code: string;
  href: string;
  nameZh: string;
  nameEn: string;
  /** 1920 宽的大图 */
  image: string;
  credit: string;
  creditHref: string;
}

const SLIDE_MS = 7000;

const order = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * 首屏（照着 Wabunka）：全屏大图一张接一张交叉淡入，每张放大一点、慢慢往左平移；
 * 正中只放站名、一句话和一条白色搜索框（11-21 仓库主人要首屏字再少一点），底下“往下看”一道细线往下流。左下角写这是哪座公园，点了进公园页（照片放大成公园页首图）。
 */
export function Hero({
  slides,
  wordmark,
  text,
  search,
}: {
  slides: HeroSlide[];
  wordmark: string;
  text: { title: string; scroll: string; previous: string; next: string };
  /** 白色搜索框 */
  search: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const count = slides.length;
  const current = slides[index];

  const show = (next: number) => {
    if (next === index) return;
    setPrevious(index);
    setIndex(next);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPrevious(index);
      setIndex((index + 1) % count);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, count]);

  // 只挂载当前、上一张（正在淡出）和下一张（预加载），其余不下载
  const mounted = (i: number) => i === index || i === previous || i === (index + 1) % count;

  return (
    <section className="relative h-[100svh] min-h-[620px] overflow-hidden bg-night text-white">
      {slides.map((slide, i) => (
        <ViewTransition key={slide.code} name={i === index ? `park-photo-${slide.code}` : undefined} share="park-morph" default="none">
          <div className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${i === index ? "opacity-100" : "opacity-0"}`}>
            {mounted(i) && (
              <CommonsImage
                src={slide.image}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className={`object-cover ${i === index || i === previous ? "animate-drift" : ""}`}
                style={{ animationDuration: `${SLIDE_MS + 1600}ms` }}
              />
            )}
          </div>
        </ViewTransition>
      ))}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center">
        <h1 className="overflow-hidden pb-1 font-serif text-[clamp(3rem,8vw,6.2rem)] leading-none font-light tracking-[0.12em]">
          <span className="hero-rise block" style={order(0)}>
            {wordmark}
          </span>
        </h1>
        <p className="hero-fade mt-6 font-serif text-[clamp(1.05rem,1.6vw,1.35rem)] tracking-[0.08em] text-white/95" style={order(0)}>
          {text.title}
        </p>
        <div className="hero-fade mt-12 w-full max-w-xl" style={order(1)}>
          {search}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center pb-5 text-[12px] tracking-[0.1em] text-white/80">
        <span>{text.scroll}</span>
        <span aria-hidden className="mt-2 block h-12 w-px overflow-hidden bg-white/20">
          <span className="scroll-cue block h-full w-full bg-white" />
        </span>
      </div>

      {/* 左下：这是哪座公园、翻页；右下：照片署名 */}
      <div className="absolute bottom-5 left-5 z-10 hidden items-center gap-3 text-[12px] text-white/80 sm:left-10 md:flex">
        <button
          type="button"
          aria-label={text.previous}
          onClick={() => show((index - 1 + count) % count)}
          className="grid size-8 place-items-center border border-white/40 transition-colors duration-300 hover:bg-white hover:text-[#1a150e]"
        >
          <IconChevronLeft />
        </button>
        <button
          type="button"
          aria-label={text.next}
          onClick={() => show((index + 1) % count)}
          className="grid size-8 place-items-center border border-white/40 transition-colors duration-300 hover:bg-white hover:text-[#1a150e]"
        >
          <IconChevronRight />
        </button>
        <Link key={current.code} href={current.href} className="nav-line ml-2 font-serif text-[14px] tracking-[0.04em]" style={{ animation: "fade 1.2s var(--ease-expo) both" }}>
          {current.nameZh}
          <span className="ml-2 text-white/60">{current.nameEn}</span>
        </Link>
      </div>
      <a
        href={current.creditHref}
        target="_blank"
        rel="noreferrer"
        className="absolute right-5 bottom-5 z-10 hidden max-w-xs truncate text-[10px] text-white/50 hover:text-white/80 sm:right-10 md:block"
      >
        {current.credit}
      </a>
    </section>
  );
}
