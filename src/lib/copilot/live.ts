import { LIVE_ALERT_DAYS, type ParkAlert } from "../alert-match";
import { addDays } from "../dates";
import type { LiveClosures } from "../generate-trip";

/**
 * Copilot 读 NPS 公告提取出的临时关闭（python -m nps_copilot alerts 写的 closures-latest.json）→ 生成攻略要的 LiveClosures。
 * 和行程页读实时公告一样只管近期出发的（今天起两周内）：公告只说现在的情况。另外：
 * - 公告快照要是新的：比“今天”晚（评测固定了以前的日期）或者早了 LIVE_STALE_DAYS 天以上都不用，免得拿旧消息排行程；
 * - 公告写了起止日期的，这趟一天都碰不到的不算（11 月 20 日重开、11 月 25 日才出发）；碰到了就整趟都当关着；
 * - 只有规则也找到的（strict：公告标题里写着这个景点，和行程页按公告不排的规则一样）才不排；只有模型找到的照排、
 *   提醒出发前确认——10-19 的评测里只有模型找到的景点 10 个对 4 个（Biscuit Basin 的公告被说成老忠实泉关了），
 *   直接不排会白白少去热门景点。模型准了以后（新一版提示词）再放宽
 */
export interface ExtractedClosure {
  alert: string;
  park: string;
  attractions: string[];
  from: string | null;
  reopen: string | null;
  title: string;
  url?: string | null;
  evidence?: string;
  found_by?: string[];
  /** 规则也找到的景点（公告标题里写着）；没有这个字段的（手写的清单）全部当 strict */
  strict?: string[];
}

export interface ExtractedClosures {
  fetched: string;
  /** 每座公园的公告是哪天读的（每晚整份读、聊天时只现读要去的几座）；旧格式没有，按 fetched 算 */
  parks?: Record<string, string>;
  closures: ExtractedClosure[];
}

export const LIVE_STALE_DAYS = 3;

export type LiveStatus = "used" | "month-only" | "too-far" | "stale" | "future";

export interface LiveFromClosures {
  status: LiveStatus;
  live?: LiveClosures;
  /** 景点 id → 让它关掉的那条公告（不排） */
  byStop: Map<string, ExtractedClosure>;
  /** 景点 id → 可能让它关掉的那条公告（只有模型找到的：照排、提醒） */
  maybe: Map<string, ExtractedClosure>;
}

export function liveFromClosures(
  file: ExtractedClosures,
  startDate: string | undefined,
  days: number,
  referenceDate: string,
  parks: string[] = [],
): LiveFromClosures {
  const byStop = new Map<string, ExtractedClosure>();
  const maybe = new Map<string, ExtractedClosure>();
  if (!startDate) return { status: "month-only", byStop, maybe };
  const until = addDays(referenceDate, LIVE_ALERT_DAYS);
  if (startDate > until) return { status: "too-far", byStop, maybe };
  // 要去的公园里最旧的那一份算（有公园没读过就按整份的 fetched）
  const dates = parks.length > 0 && file.parks ? parks.map((code) => file.parks?.[code] ?? file.fetched) : [file.fetched];
  const fetched = dates.reduce((a, b) => (a < b ? a : b));
  if (dates.some((date) => date > referenceDate)) return { status: "future", byStop, maybe };
  if (fetched < addDays(referenceDate, -LIVE_STALE_DAYS)) return { status: "stale", byStop, maybe };
  const last = addDays(startDate, days - 1);
  for (const closure of file.closures) {
    if (parks.length > 0 && !parks.includes(closure.park)) continue;
    if (closure.reopen && closure.reopen <= startDate) continue;
    if (closure.from && closure.from > last) continue;
    const strict = new Set(closure.strict ?? closure.attractions);
    for (const id of closure.attractions) {
      if (strict.has(id)) {
        if (!byStop.has(id)) byStop.set(id, closure);
      } else if (!maybe.has(id)) maybe.set(id, closure);
    }
  }
  for (const id of byStop.keys()) maybe.delete(id);
  return { status: "used", live: { ids: new Set(byStop.keys()), until }, byStop, maybe };
}

/**
 * 行程页（不经过 Copilot 的“自动生成攻略”）也用上每晚模型读公告的结果（/api/alerts 的 extracted，来自 data/alerts-live 分支）：
 * byStop 是按公告标题对到的关闭（closedByAlerts）。模型读出了起止日期、这趟一天都碰不到的（11 月 20 日重开、11 月 25 日才出发）
 * 从里面去掉；模型和规则都认、标题匹配漏掉的加上。只有模型找到的不动（照排），和 Copilot 一样。快照旧了、没读到就原样返回
 */
export function withExtracted(
  byStop: Map<string, ParkAlert>,
  extracted: ExtractedClosures | undefined,
  startDate: string,
  days: number,
  referenceDate: string,
  parks: string[],
): Map<string, ParkAlert> {
  if (!extracted) return byStop;
  const from = liveFromClosures(extracted, startDate, days, referenceDate, parks);
  if (from.status !== "used") return byStop;
  const result = new Map(byStop);
  const last = addDays(startDate, days - 1);
  for (const closure of extracted.closures) {
    const outside = (closure.reopen && closure.reopen <= startDate) || (closure.from && closure.from > last);
    if (!outside) continue;
    for (const [id, alert] of result) if (alert.id === closure.alert) result.delete(id);
  }
  for (const [id, closure] of from.byStop) {
    if (result.has(id)) continue;
    result.set(id, {
      id: closure.alert,
      park: closure.park,
      title: closure.title,
      category: "Park Closure",
      url: closure.url ?? "",
      description: closure.evidence ?? "",
      updated: extracted.fetched,
    });
  }
  return result;
}
