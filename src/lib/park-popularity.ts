import { attractions } from "@/data/attractions";

/** 公园的热门程度：各景点的 Google 评论数加起来（游客中心、园外景点不算，和园内热度排名一样）。首页、全部公园、活动页排先后用 */
const popularity = new Map<string, number>();
for (const attraction of attractions) {
  if (!attraction.google || attraction.kind === "visitor" || attraction.outsidePark) continue;
  popularity.set(attraction.park, (popularity.get(attraction.park) ?? 0) + attraction.google.reviews);
}

export const parkWeight = (code: string) => popularity.get(code) ?? 0;
export const byParkPopularity = (a: { code: string }, b: { code: string }) => parkWeight(b.code) - parkWeight(a.code);
