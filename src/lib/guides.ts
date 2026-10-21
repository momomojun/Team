/** 公园页「更多攻略」里的一条 YouTube 视频：只留标题和链接，不存文稿 */
export interface GuideVideo {
  id: string;
  title: string;
  channel: string;
  /** YYYY-MM-DD */
  published: string;
  url: string;
}

export const guideTopics = ["route", "spots", "food"] as const;
export type GuideTopic = (typeof guideTopics)[number];

export interface GuidesResponse {
  configured: boolean;
  groups: { topic: GuideTopic; videos: GuideVideo[] }[];
  /** quota：今天的搜索额度用完了；unavailable：别的失败 */
  error?: "quota" | "unavailable";
}

/** 园外名胜不要加上 National Park，搜出来的会是别的公园 */
export function guideQuery(nameEn: string, nationalPark: boolean, topic: GuideTopic): string {
  const place = nationalPark && !/National Park/.test(nameEn) ? `${nameEn} National Park` : nameEn;
  if (topic === "route") return `${place} itinerary`;
  if (topic === "spots") return `${place} photo spots viewpoints`;
  return `${place} restaurants where to eat`;
}
