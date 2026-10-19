import { lodgingSeasons, type LodgingSeason } from "../data/lodging-seasons";
import { addDays } from "./dates";

/** 没公布重开日期的临时关闭：核对后这么多天内当关着（和 closures.ts 一样） */
const UNKNOWN_REOPEN_DAYS = 90;

/** 这家住处的营业季节和临时关闭；全年营业的、自定义住处是 undefined */
export const seasonOf = (id: string | undefined): LodgingSeason | undefined => (id ? lodgingSeasons[id] : undefined);

/** 某个晚上（入住日期 YYYY-MM-DD）在不在营业季里；没写营业季的（全年营业）都在 */
export function inSeason(season: LodgingSeason, date: string): boolean {
  if (!season.open) return true;
  const day = date.slice(5, 10);
  return season.open.some(({ from, to }) => (from <= to ? from <= day && day <= to : day >= from || day <= to));
}

/** 某个晚上赶上的临时关闭（没有就是 undefined） */
export const closureOn = (season: LodgingSeason, date: string) =>
  (season.closed ?? []).find(({ from, to }) => from <= date && date <= (to ?? addDays(season.checked, UNKNOWN_REOPEN_DAYS)));

export const closedOn = (season: LodgingSeason, date: string): boolean => closureOn(season, date) !== undefined;

/** 这晚能不能住：没有日期、没有季节数据的都当能住 */
export const lodgingOpenOn = (id: string | undefined, date: string | null | undefined): boolean => {
  const season = seasonOf(id);
  return !season || !date || (inSeason(season, date) && !closedOn(season, date));
};
