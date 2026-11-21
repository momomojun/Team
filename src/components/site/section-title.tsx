import Link from "next/link";
import type { ReactNode } from "react";
import { IconChevronRight } from "@/components/icons";

/**
 * 区块标题（照着 Wabunka）：金色的衬线字，后面一条细金线一直拉到右边；有 href 时标题本身是链接，后面带个小箭头。
 * 金色跟着主题走：深色区块里亮一点，浅色内页里深一点（clay-600）。
 */
export function SectionTitle({
  children,
  href,
  hint,
  as: Tag = "h2",
  id,
}: {
  children: ReactNode;
  href?: string;
  /** 标题下面的一行说明 */
  hint?: ReactNode;
  as?: "h1" | "h2" | "h3";
  id?: string;
}) {
  const label = href ? (
    <Link href={href} className="group inline-flex items-center gap-2 transition-colors duration-300 hover:text-clay-700">
      {children}
      <IconChevronRight className="text-[0.55em] transition-transform duration-500 ease-(--ease-soft) group-hover:translate-x-1" />
    </Link>
  ) : (
    children
  );
  return (
    <div className="mb-6 md:mb-8">
      <Tag id={id} className="flex scroll-mt-28 items-center gap-4 font-serif text-[22px] leading-tight tracking-[0.03em] text-clay-600 md:text-[30px]">
        <span className="shrink-0">{label}</span>
        <span aria-hidden className="h-px flex-1 bg-clay-500/70 [transform:scaleY(0.5)]" />
      </Tag>
      {hint && <p className="mt-3 max-w-3xl text-[14px] leading-7 text-ink-soft md:text-[15px]">{hint}</p>}
    </div>
  );
}
