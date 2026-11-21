import type { ReactNode } from "react";

/** 公园页的信息区块：金色衬线标题后面一条细金线（和首页的区块标题一样），下面小字写数据来源 */
export function Section({
  title,
  source,
  children,
}: {
  title: string;
  source?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <header>
        <h3 className="flex items-center gap-4 font-serif text-[22px] leading-tight tracking-[0.03em] text-clay-600 md:text-[26px]">
          <span className="shrink-0">{title}</span>
          <span aria-hidden className="h-px flex-1 bg-clay-500/70 [transform:scaleY(0.5)]" />
        </h3>
        {source && <p className="mt-2 text-xs text-mute">{source}</p>}
      </header>
      <div className="pt-6">{children}</div>
    </section>
  );
}

export function SectionSkeleton({ title }: { title: string }) {
  return (
    <Section title={title}>
      <div className="space-y-3" aria-busy="true">
        <div className="h-3 w-2/3 animate-pulse bg-ink/10" />
        <div className="h-3 w-1/2 animate-pulse bg-ink/10" />
        <div className="h-3 w-3/5 animate-pulse bg-ink/10" />
      </div>
    </Section>
  );
}
