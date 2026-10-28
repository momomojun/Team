/**
 * 数据的“保质期”：手工整理的数据（临时关闭、住处营业季节、班车、班次、预约规则、停车场、季节性山路、逐园核对）都记着哪天核对的，
 * 超过这么多天没核对、或者写的是去年的时刻表的，算过期：npm run check:freshness 列出来（每月一次的 GitHub 定时任务开 issue），
 * 行程里每一站的“资料出处”（provenance.ts）标“超过半年没核对”。这个文件不引用别的模块，浏览器里用也不会带上一大堆数据
 */
export const STALE_DAYS = 183;

/** old：超过 STALE_DAYS 天没核对；pastYear：写的是今年以前的时刻表、营业季节 */
export type Staleness = "old" | "pastYear";

const DAY_MS = 86_400_000;
export const daysBetween = (from: string, to: string) => Math.floor((Date.parse(to) - Date.parse(from)) / DAY_MS);

export function staleness(fact: { date?: string; year?: number }, today: string, days = STALE_DAYS): Staleness | null {
  if (fact.year !== undefined && fact.year < Number(today.slice(0, 4))) return "pastYear";
  if (fact.date && daysBetween(fact.date, today) > days) return "old";
  return null;
}
