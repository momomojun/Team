import "server-only";
import type { ExtractedClosures } from "./copilot/live";
import { fetchJson } from "./fetch-json";

/**
 * 每晚模型读 NPS 公告提取的关闭清单（.github/workflows/alerts-nightly.yml 推到 data/alerts-live 分支的 closures-latest.json）。
 * 仓库是公开的，直接读 raw 文件，一小时取一次；读不到（分支还没有、断网）就当没有，行程页照旧按公告标题判断
 */
export const ALERTS_LIVE_URL =
  process.env.ALERTS_LIVE_URL ?? "https://raw.githubusercontent.com/momomojun/Team/data/alerts-live/closures-latest.json";

export async function getExtractedClosures(parks: string[]): Promise<ExtractedClosures | undefined> {
  try {
    const file = await fetchJson<ExtractedClosures>(ALERTS_LIVE_URL, { revalidate: 60 * 60 });
    const wanted = new Set(parks);
    return {
      fetched: file.fetched,
      ...(file.parks ? { parks: Object.fromEntries(Object.entries(file.parks).filter(([code]) => wanted.has(code))) } : {}),
      closures: (file.closures ?? []).filter((closure) => wanted.has(closure.park)),
    };
  } catch {
    return undefined;
  }
}
