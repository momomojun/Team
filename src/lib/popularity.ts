/**
 * 园内热度：徒步（kind 是 hike）只看 AllTrails（hikeRank），别的景点看 Google Maps（hotRank），两边各排各的（attractions/index.ts）。
 * 走步道的人在 AllTrails 上打卡、写评价，Google 的评论多给了路边的观景点；徒步的 Google 评分、评论数、名次一律不用。
 * 没对上 AllTrails、或者对上的多半不是同一条路线（alltrails-doubtful）的徒步没有名次，也不拿 Google 补。
 * 这里不引用景点数据，排行程（浏览器里跑）也能用
 */
export interface Ranked {
  kind: string;
  hotRank?: number;
  hikeRank?: number;
  mustSee?: boolean;
  google?: { reviews: number };
}

/** 园内名次：徒步是 AllTrails 步道热度第几，别的景点是 Google 热度第几；没有名次的是 undefined */
export function popularRank(stop: Ranked): number | undefined {
  return stop.kind === "hike" ? stop.hikeRank : stop.hotRank;
}

/**
 * 按热度排：景点和步道各自的名次交替（景点第 1、步道第 1、景点第 2……，同名次景点在前）；
 * 没有名次的（游客中心、园外景点）按 Google 评论数接在后面，都没有的必去在前、游客中心最后
 */
export function byPopularity(a: Ranked, b: Ranked): number {
  return (
    (popularRank(a) ?? Infinity) - (popularRank(b) ?? Infinity) ||
    Number(a.kind === "hike") - Number(b.kind === "hike") ||
    (b.google?.reviews ?? 0) - (a.google?.reviews ?? 0) ||
    Number(Boolean(b.mustSee)) - Number(Boolean(a.mustSee)) ||
    Number(a.kind === "visitor") - Number(b.kind === "visitor")
  );
}
