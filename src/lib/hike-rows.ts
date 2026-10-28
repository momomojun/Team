import type { AllTrailsParkTrail, AttractionWithPhoto } from "../data/attractions";

/**
 * 徒步页列表里的一行：AllTrails 榜单上的步道，或者网站收录、榜单里没有的徒步。
 * 评分、评价数、热度只来自 AllTrails，没有就不写（不拿 Google 补，也不编一个默认值）
 */
export interface HikeRow extends Omit<AllTrailsParkTrail, "slug" | "rating" | "reviews" | "popularity"> {
  /** 列表、地图上的 id：榜单上的用 AllTrails slug，自己收录的用景点 id */
  key: string;
  /** 对上的 AllTrails 步道；没有的链接改成搜索 */
  slug?: string;
  rating?: number;
  reviews?: number;
  popularity?: number;
  /** 榜单上原来的那条（网站没收录的，加进行程时整条存进去） */
  source?: AllTrailsParkTrail;
}

type Hike = Pick<AttractionWithPhoto, "id" | "kind" | "nameEn" | "lat" | "lon" | "start" | "hike" | "alltrails">;

/**
 * AllTrails 榜单（对错路线的已经在 attractions/index.ts 去掉了和景点的对应）+ 网站收录、榜单里没有的徒步。
 * 后面这些的距离、爬升、难度、环线按我们自己的数据；对上了 AllTrails 的带它的评分和热度，没对上、对错路线的不带。
 * 榜单里有的公园只补 kind 是 hike 的（瀑布、洞穴导览这些带徒步数据的景点不算步道）；没有榜单的（羚羊峡谷）带徒步数据的都列
 */
export function hikeRows(hikes: Hike[], topTrails: AllTrailsParkTrail[]): HikeRow[] {
  const listed: HikeRow[] = topTrails.map((trail) => ({ ...trail, key: trail.slug, source: trail }));
  const inList = new Set(topTrails.map((trail) => trail.attractionId).filter(Boolean));
  const own: HikeRow[] = hikes
    .filter((a) => a.hike && !inList.has(a.id) && (topTrails.length === 0 || a.kind === "hike"))
    .map((a) => ({
      key: a.id,
      name: a.alltrails?.name ?? a.nameEn,
      slug: a.alltrails?.slug,
      rating: a.alltrails?.rating,
      reviews: a.alltrails?.reviews,
      popularity: a.alltrails?.popularity,
      usage: a.alltrails?.usage,
      photo: a.alltrails?.photo,
      lat: a.start?.lat ?? a.lat,
      lon: a.start?.lon ?? a.lon,
      lengthMi: a.hike!.distanceMi ?? 0,
      gainFt: a.hike!.gainFt ?? 0,
      difficulty: a.hike!.difficulty,
      routeType: a.hike!.loop ? "loop" : "out",
      attractionId: a.id,
    }));
  return [...listed, ...own];
}
