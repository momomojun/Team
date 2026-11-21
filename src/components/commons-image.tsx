"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";
import { useCallback, useState, type Ref, type RefCallback } from "react";

/** Wikimedia 的标准缩略图宽度：这些宽度 CDN 上多半已经有现成的，别的宽度要现生成、还可能被限流 */
const WIDTHS = [120, 250, 330, 500, 960, 1280, 1920];
const THUMB = /\/(\d+)px-([^/]+)$/;

/**
 * 按浏览器需要的宽度换成最接近的标准缩略图（不超过传进来的那张的宽度），
 * 直接从 Commons 的 CDN 加载。不经过 Next 的图片优化：优化服务要先把原图下载到本机再压缩，
 * 首次打开一张大图要好几秒，还常常超时。
 */
function commonsLoader({ src, width }: ImageLoaderProps): string {
  const match = src.match(THUMB);
  // 本身就是原图（原图比缩略图还小）
  if (!match) return src;
  const wanted = WIDTHS.find((w) => w >= width) ?? WIDTHS[WIDTHS.length - 1];
  return src.replace(THUMB, `/${Math.min(wanted, Number(match[1]))}px-${match[2]}`);
}

/** 不经过 next/image 时（自己写 img、提前下载）要的那张：width 宽的标准缩略图；不是 Commons 的照片原样返回 */
export function commonsSrc(src: string, width: number): string {
  return commonsLoader({ src, width, quality: undefined });
}

/** 照片下载好了：加 data-loaded，globals.css 的 fade-img 让它淡出来 */
function markLoaded(image: HTMLImageElement | null) {
  if (image && image.complete && image.naturalWidth > 0) image.dataset.loaded = "1";
}

/**
 * Wikimedia Commons 照片：按尺寸挑标准缩略图；万一这个宽度的缩略图加载失败，退回传进来的那张。
 * 下载好了才淡出来（Wabunka 那样，照片不会一块一块往下画）；React 接手前就从缓存里加载好了的，挂上时直接显示。
 */
export function CommonsImage({ alt, onError, onLoad, src, ref, className, ...props }: ImageProps & { ref?: Ref<HTMLImageElement> }) {
  const [fallback, setFallback] = useState(false);
  const attach: RefCallback<HTMLImageElement> = useCallback(
    (image) => {
      markLoaded(image);
      if (typeof ref === "function") ref(image);
      else if (ref) ref.current = image;
    },
    [ref],
  );
  return (
    <Image
      alt={alt}
      {...props}
      ref={attach}
      src={src}
      className={`fade-img ${className ?? ""}`}
      loader={fallback ? undefined : commonsLoader}
      unoptimized={fallback}
      onLoad={(event) => {
        event.currentTarget.dataset.loaded = "1";
        onLoad?.(event);
      }}
      onError={(event) => {
        // 退回原图还是失败：也别一直藏着
        if (fallback) event.currentTarget.dataset.loaded = "1";
        else setFallback(true);
        onError?.(event);
      }}
    />
  );
}
