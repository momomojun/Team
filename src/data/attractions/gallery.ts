// 景点照片：Wikimedia Commons 的（gallery.generated.ts，按授权署名）在前，NPS 官方的公有领域照片（gallery-nps.generated.ts）补在后面；
// Commons 一张都没有的景点，NPS 的照片就是主图
import type { Photo } from "./types";
import { gallery as commons } from "./gallery.generated";
import { npsGallery } from "./gallery-nps.generated";

const MAX = 8;

export const gallery: Record<string, Photo[]> = Object.fromEntries(
  [...new Set([...Object.keys(commons), ...Object.keys(npsGallery)])].map((id) => [
    id,
    [...(commons[id] ?? []), ...(npsGallery[id] ?? [])].slice(0, MAX),
  ]),
);
