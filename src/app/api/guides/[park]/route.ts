import { getPark } from "@/data/parks";
import { ApiError } from "@/lib/fetch-json";
import { guideQuery, guideTopics, type GuidesResponse } from "@/lib/guides";
import { searchYouTube, youtubeConfigured } from "@/lib/youtube";

/** 一座公园的 YouTube 攻略、打卡点和餐厅视频。没配 key 时 configured 为 false，页面上说明怎么填 */
export async function GET(_request: Request, { params }: { params: Promise<{ park: string }> }) {
  const { park: code } = await params;
  const park = getPark(code);
  if (!park) return Response.json({ error: "not-found" }, { status: 404 });

  if (!youtubeConfigured()) {
    const empty: GuidesResponse = { configured: false, groups: [] };
    return Response.json(empty);
  }

  try {
    const groups = await Promise.all(
      guideTopics.map(async (topic) => ({
        topic,
        videos: await searchYouTube(guideQuery(park.nameEn, park.kind !== "site", topic)),
      })),
    );
    const body: GuidesResponse = { configured: true, groups };
    return Response.json(body);
  } catch (error) {
    const quota = error instanceof ApiError && error.status === 429;
    const body: GuidesResponse = { configured: true, groups: [], error: quota ? "quota" : "unavailable" };
    return Response.json(body);
  }
}
