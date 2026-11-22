import type { ReactNode } from "react";
import { CommonsImage } from "@/components/commons-image";

export interface HeaderPhoto {
  /** Commons 缩略图地址（1920 宽） */
  src: string;
  /** Commons 文件页，署名链接到这里 */
  href: string;
  /** “照片：作者 · 授权” */
  credit: string;
  /** 照片拍的是哪里 */
  caption: string;
}

/**
 * 内页的页头（照着 Wabunka 的目的地页）：整屏宽的照片慢慢平移，左下是小标签、大标题和说明，右下是照片署名；
 * 页头压在照片上是透明的（site-header.tsx 的 overHero）。没有照片时退回深色底。
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  photo,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  photo?: HeaderPhoto;
  /** 标题下面的其他内容，比如数字 */
  children?: ReactNode;
}) {
  return (
    // 所在的容器有左右内边距：用负边距撑满整个屏幕宽（body 设了 overflow-x: clip，不会出横向滚动条）
    <header data-header-tone="dark" className="relative mx-[calc(50%-50vw)] flex min-h-[440px] overflow-hidden bg-night text-white h-[64svh] print:h-auto print:min-h-0 print:bg-transparent print:text-ink">
      {photo && (
        <CommonsImage src={photo.src} alt="" fill priority sizes="100vw" className="animate-drift object-cover print:hidden" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/35 print:hidden" />
      <div className="relative mx-auto flex w-full max-w-[1296px] flex-col justify-end px-5 pb-12 sm:px-10 md:pb-14">
        <p className="hero-fade text-[13px] tracking-[0.08em] text-white/80 print:text-mute">{eyebrow}</p>
        {/* 中文标题只在标点处换行，不会剩一个字在下一行 */}
        <h1 className="mt-4 max-w-4xl overflow-hidden pb-1 font-serif text-[clamp(2.1rem,4.4vw,3.6rem)] leading-[1.18] font-normal text-balance [word-break:keep-all]">
          <span className="hero-rise block">{title}</span>
        </h1>
        {intro && <div className="hero-fade mt-5 max-w-2xl text-[15px] leading-8 text-white/85 print:text-ink-soft">{intro}</div>}
        {children}
      </div>
      {photo && (
        <a
          href={photo.href}
          target="_blank"
          rel="noreferrer"
          className="absolute right-5 bottom-3 z-10 hidden text-[10px] text-white/55 hover:text-white sm:right-10 sm:block print:hidden"
        >
          {photo.caption} · {photo.credit}
        </a>
      )}
    </header>
  );
}
