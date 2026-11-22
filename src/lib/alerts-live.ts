import "server-only";
import { mergeExtracted, type ExtractedClosures } from "./copilot/live";
import { fetchJson } from "./fetch-json";

/**
 * 每晚模型读 NPS 公告提取的关闭清单（.github/workflows/alerts-nightly.yml 推到 data/alerts-live 分支的 closures-latest.json）。
 * 仓库是公开的，直接读 raw 文件，一小时取一次；读不到（分支还没有、断网）就当没有，行程页照旧按公告标题判断
 */
export const ALERTS_LIVE_URL =
  process.env.ALERTS_LIVE_URL ?? "https://raw.githubusercontent.com/momomojun/Team/data/alerts-live/closures-latest.json";
/** 每晚抓的 NPS 道路事件（WZDx），转成同样格式的关闭清单（scripts/road-events.mjs），events 是原样合并好的事件 */
export const ROAD_EVENTS_URL =
  process.env.ROAD_EVENTS_URL ?? "https://raw.githubusercontent.com/momomojun/Team/data/alerts-live/road-events-latest.json";

export interface RoadEvent {
  key: string;
  park: string;
  roadNames: string[];
  from: string | null;
  until: string | null;
  untilVerified: boolean;
  impact: string | null;
  description: string;
  roads: string[];
  attractions: string[];
}

const readFile = <T>(url: string) => fetchJson<T>(url, { revalidate: 60 * 60 }).catch(() => undefined);

/** 这座公园现在的道路事件（公园页“实时信息”列出来）；读不到就是空的 */
export async function getRoadEvents(park: string): Promise<{ fetched: string; events: RoadEvent[] } | undefined> {
  const file = await readFile<{ fetched: string; events?: RoadEvent[] }>(ROAD_EVENTS_URL);
  return file ? { fetched: file.fetched, events: (file.events ?? []).filter((event) => event.park === park) } : undefined;
}

export async function getExtractedClosures(parks: string[]): Promise<ExtractedClosures | undefined> {
  try {
    const [alerts, roads] = await Promise.all([readFile<ExtractedClosures>(ALERTS_LIVE_URL), readFile<ExtractedClosures>(ROAD_EVENTS_URL)]);
    const file = mergeExtracted(alerts, roads);
    if (!file) return undefined;
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
