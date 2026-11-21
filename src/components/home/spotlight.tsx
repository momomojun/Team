"use client";

import Link from "next/link";
import { useState } from "react";
import { CommonsImage } from "@/components/commons-image";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

export interface SpotlightItem {
  text: string;
  meta: string[];
  href: string;
  image: string;
}

/**
 * 一句话排行程的示范（照着 Wabunka 首页的“Experiential Stays”）：底下是同一张照片放大、虚化压暗，
 * 左边一句话、几项条件和金色按钮，右边大照片；左右翻看下一句，照片和文字一起交叉淡入。
 */
export function Spotlight({
  items,
  text,
  allHref,
}: {
  items: SpotlightItem[];
  text: { title: string; hint: string; cta: string; all: string; previous: string; next: string };
  allHref: string;
}) {
  const [index, setIndex] = useState(0);
  const count = items.length;
  const go = (step: number) => setIndex((i) => (i + step + count) % count);

  return (
    <section className="relative overflow-hidden bg-night text-white">
      {items.map((item, i) => (
        <div key={item.href} aria-hidden className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"}`}>
          <CommonsImage src={item.image} alt="" fill sizes="50vw" className="scale-110 object-cover blur-2xl" />
        </div>
      ))}
      <div className="absolute inset-0 bg-night/75" />
      <div className="relative mx-auto grid max-w-[1216px] gap-10 px-5 py-20 sm:px-10 md:grid-cols-[5fr_7fr] md:items-center md:py-24">
        <div>
          <Link href={allHref} className="group inline-flex items-center gap-2 font-serif text-[22px] tracking-[0.03em] text-gold md:text-[26px]">
            {text.title}
            <IconChevronRight className="text-[0.55em] transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
          <p className="mt-3 text-[14px] leading-7 text-white/70">{text.hint}</p>
          <div className="relative mt-10 grid">
            {items.map((item, i) => (
              <div
                key={item.href}
                aria-hidden={i !== index}
                className={`col-start-1 row-start-1 transition-[opacity,translate] duration-700 ease-(--ease-soft) ${i === index ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
              >
                <p className="font-serif text-[clamp(1.5rem,2.4vw,2.1rem)] leading-[1.5] tracking-[0.02em]">“{item.text}”</p>
                <p className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-white/75">
                  {item.meta.map((m, j) => (
                    <span key={m} className="flex items-center gap-3">
                      {j > 0 && <span aria-hidden className="text-white/35">|</span>}
                      {m}
                    </span>
                  ))}
                </p>
                <Link
                  href={item.href}
                  tabIndex={i === index ? undefined : -1}
                  className="mt-9 flex h-12 w-full max-w-sm items-center justify-center bg-gold font-serif text-[16px] text-on-gold transition-colors duration-300 hover:bg-gold-deep"
                >
                  {text.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-2">
            <button type="button" aria-label={text.previous} onClick={() => go(-1)} className="grid size-9 place-items-center border border-white/40 transition-colors duration-300 hover:bg-white hover:text-[#1a150e]">
              <IconChevronLeft />
            </button>
            <button type="button" aria-label={text.next} onClick={() => go(1)} className="grid size-9 place-items-center border border-white/40 transition-colors duration-300 hover:bg-white hover:text-[#1a150e]">
              <IconChevronRight />
            </button>
            <span className="ml-3 font-serif text-[13px] text-white/60 tabular-nums">
              {index + 1} / {count}
            </span>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden">
          {items.map((item, i) => (
            <div key={item.href} className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"}`}>
              <CommonsImage src={item.image} alt="" fill sizes="(min-width: 768px) 58vw, 100vw" className={`object-cover ${i === index ? "animate-drift" : ""}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="relative pb-16 text-center">
        <Link href={allHref} className="inline-flex h-12 min-w-72 items-center justify-center border border-gold px-8 font-serif text-[15px] text-gold transition-colors duration-300 hover:bg-gold hover:text-on-gold">
          {text.all}
        </Link>
      </div>
    </section>
  );
}
