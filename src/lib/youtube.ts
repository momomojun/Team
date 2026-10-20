import "server-only";
import { ApiError } from "./fetch-json";
import type { GuideVideo } from "./guides";

interface YouTubeSearch {
  error?: { errors?: { reason?: string }[] };
  items?: {
    id?: { videoId?: string };
    snippet?: { title?: string; channelTitle?: string; publishedAt?: string };
  }[];
}

/** 搜索结果缓存 7 天。search.list 一次扣 100 配额，一座公园三个分类就是 300 */
const REVALIDATE = 7 * 24 * 60 * 60;

export function youtubeConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

export async function searchYouTube(query: string): Promise<GuideVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: "4",
    q: query,
    relevanceLanguage: "zh",
    key,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
    next: { revalidate: REVALIDATE },
  });
  const data = (await res.json()) as YouTubeSearch;
  if (!res.ok) {
    const reason = data.error?.errors?.[0]?.reason;
    throw new ApiError(reason === "quotaExceeded" ? 429 : res.status, "https://www.googleapis.com/youtube/v3/search");
  }
  return (data.items ?? []).flatMap((item) => {
    const id = item.id?.videoId;
    const title = item.snippet?.title;
    if (!id || !title) return [];
    return [
      {
        id,
        title: decodeHtml(title),
        channel: decodeHtml(item.snippet?.channelTitle ?? ""),
        published: (item.snippet?.publishedAt ?? "").slice(0, 10),
        url: `https://www.youtube.com/watch?v=${id}`,
      },
    ];
  });
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}
