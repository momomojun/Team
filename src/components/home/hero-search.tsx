"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { IconArrowRight } from "@/components/icons";

export interface SearchPark {
  code: string;
  href: string;
  nameZh: string;
  nameEn: string;
}

/** 首屏的白色搜索框：打公园名字就列出对得上的公园；打的是一句话（“6 月带爸妈去黄石玩 5 天”），就拿这句话去行程页让 Copilot 排 */
export function HeroSearch({
  parks,
  planHref,
  text,
}: {
  parks: SearchPark[];
  planHref: string;
  text: { label: string; placeholder: string; plan: string; go: string };
}) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const q = query.trim();
  const matches = useMemo(() => {
    if (!q) return [];
    const lower = q.toLowerCase();
    return parks
      .filter((park) => park.nameZh.includes(q) || park.nameEn.toLowerCase().includes(lower) || park.code === lower || q.includes(park.nameZh))
      .slice(0, 5);
  }, [parks, q]);
  // 像一句话（有数字、比较长）就把“排行程”放第一个，只是公园名就把公园放前面
  const sentence = /\d/.test(q) || q.length > 12 || matches.length === 0;
  const options = q
    ? sentence
      ? [{ kind: "plan" as const }, ...matches.map((park) => ({ kind: "park" as const, park }))]
      : [...matches.map((park) => ({ kind: "park" as const, park })), { kind: "plan" as const }]
    : [];

  const choose = (i: number) => {
    const option = options[i];
    if (!option) return;
    if (option.kind === "park") router.push(option.park.href);
    else router.push(`${planHref}?q=${encodeURIComponent(q)}#plan-copilot`);
  };

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        choose(active);
      }}
      className="relative text-left"
    >
      <label className="flex h-14 items-center gap-3 bg-white pr-2 pl-5 text-[#1a150e]">
        <span className="sr-only">{text.label}</span>
        <svg aria-hidden viewBox="0 0 20 20" className="size-[18px] shrink-0 text-[#a48953]" fill="none" stroke="currentColor" strokeWidth={1.4}>
          <circle cx="8.5" cy="8.5" r="6" />
          <path d="m13 13 5 5" />
        </svg>
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => Math.min(options.length - 1, i + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            } else if (event.key === "Escape") setOpen(false);
          }}
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={text.placeholder}
          className="min-w-0 flex-1 bg-transparent font-serif text-[15px] placeholder:text-[#8a8278] focus:outline-none"
        />
        <button type="submit" aria-label={text.go} disabled={!q} className="grid size-10 shrink-0 place-items-center text-[#a48953] transition-colors hover:text-[#1a150e] disabled:opacity-40">
          <IconArrowRight />
        </button>
      </label>
      {open && options.length > 0 && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-20 border-t border-[#e2dcd2] bg-white py-1 text-[#1a150e] shadow-[0_24px_40px_-24px_rgb(0_0_0/0.5)]">
          {options.map((option, i) => (
            <li
              key={option.kind === "park" ? option.park.code : "plan"}
              role="option"
              aria-selected={i === active}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(i);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline gap-3 px-5 py-2.5 font-serif text-[15px] ${i === active ? "bg-[#f4f1ed]" : ""}`}
            >
              {option.kind === "park" ? (
                <>
                  <span>{option.park.nameZh}</span>
                  <span className="text-[12px] text-[#6b645b]">{option.park.nameEn}</span>
                </>
              ) : (
                <>
                  <span className="shrink-0 text-[#826b3d]">{text.plan}</span>
                  <span className="truncate text-[13px] text-[#6b645b]">{q}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
