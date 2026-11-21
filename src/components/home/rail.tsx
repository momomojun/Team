"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

/**
 * 横着排的一行卡片（照着 Wabunka 的精选、目的地）：手指、触控板直接横着滑，宽屏上两边有翻页按钮；
 * 每次翻一屏，停在卡片的边上（scroll-snap）。滑到头的那边按钮变淡。
 */
export function Rail({ children, label, previous, next }: { children: ReactNode; label: string; previous: string; next: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const page = (direction: number) => {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const button = "grid size-9 place-items-center border border-current/30 transition-[opacity,background-color,color] duration-300 hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30";
  return (
    <div>
      <div
        ref={track}
        role="region"
        aria-label={label}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-2 overflow-x-auto px-5 sm:-mx-10 sm:scroll-px-10 sm:px-10 md:mx-0 md:scroll-px-0 md:px-0"
      >
        {children}
      </div>
      {!(edge.start && edge.end) && (
        <div className="mt-6 hidden justify-center gap-2 md:flex">
          <button type="button" aria-label={previous} disabled={edge.start} onClick={() => page(-1)} className={button}>
            <IconChevronLeft />
          </button>
          <button type="button" aria-label={next} disabled={edge.end} onClick={() => page(1)} className={button}>
            <IconChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
