import { gallery } from "./attractions/gallery";
import type { Photo } from "./attractions/types";
import { filmShots, type FilmShot } from "./films";
import { filmPhotos } from "./films-photos.generated";

/** 电影同款加上取景地照片：专门挑的 photoFile 优先，没有就用对应景点图集的第一张 */
export type FilmSpot = FilmShot & { photo?: Photo };

export const filmSpots: FilmSpot[] = filmShots.map((shot) => ({
  ...shot,
  photo: (shot.photoFile && filmPhotos[shot.photoFile]) || (shot.attraction ? gallery[shot.attraction]?.[0] : undefined),
}));
