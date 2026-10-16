import { clock12 } from "@/lib/sun";

const HAN = /[\u3400-\u9fff\uf900-\ufaff]/;
const LATIN = /[A-Za-z0-9]/;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONS = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
const ordinalSuffix = (n: number) => (n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th"));
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * 英文模板的两种写法（中文模板用不到）：
 * {n|day|days} 按 n 是不是 1 选单数或复数的词（只出词，数字另写 {n}）；
 * {m:month} 把月份数字写成英文月份名（{m:mon} 是缩写），{d:weekday} 把 0–6 写成星期几，
 * {d:ordinal} 写成 1st、2nd、15th，{date:date} 把“2026-12-01”写成 December 1, 2026（不是这种格式的照原样）
 */
function englishForms(template: string, values: Record<string, string | number>): string {
  if (HAN.test(template)) return template;
  return template
    .replace(/\{(\w+)\|([^|{}]*)\|([^{}]*)\}/g, (match, key: string, one: string, many: string) =>
      key in values ? (Number(values[key]) === 1 ? one : many) : match,
    )
    .replace(/\{(\w+):(month|mon|weekday|ordinal|date)\}/g, (match, key: string, form: string) => {
      if (!(key in values)) return match;
      if (form === "date") {
        const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(values[key]));
        return iso ? `${MONTHS[Number(iso[2]) - 1]} ${Number(iso[3])}, ${iso[1]}` : String(values[key]);
      }
      const n = Number(values[key]);
      if (form === "ordinal") return `${n}${ordinalSuffix(n)}`;
      return form === "weekday" ? (WEEKDAYS[n] ?? match) : ((form === "month" ? MONTHS : MONS)[n - 1] ?? match);
    });
}

/**
 * 把 "更新于 {date}" 这类模板里的占位符替换成实际值。
 * 汉字紧挨着的值以英文字母、数字开头或结尾时补一个空格，和手写的“近 20 年”一样
 * （“要走{road}” + “Stevens Canyon Road” → “要走 Stevens Canyon Road”）；以后加日语界面要另外处理
 */
export function fill(template: string, values: Record<string, string | number>): string {
  const english = !HAN.test(template);
  return englishForms(template, values).replace(/\{(\w+)\}/g, (match, key: string, offset: number) => {
    if (!(key in values)) return match;
    let value = String(values[key]);
    // 英文模板里填进来的“17:30”这种时间（数据里存的开门、停满时间）写成 12 小时制
    const time = english ? /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value) : null;
    if (time) value = clock12(Number(time[1]), Number(time[2]));
    // “8 a.m.”后面紧跟句号时只留一个点
    if (english && value.endsWith(".") && template[offset + match.length] === ".") value = value.slice(0, -1);
    if (value === "") return value;
    if (HAN.test(template[offset - 1] ?? "") && LATIN.test(value[0])) value = ` ${value}`;
    if (HAN.test(template[offset + match.length] ?? "") && LATIN.test(value.at(-1)!)) value = `${value} `;
    return value;
  });
}

/** 机器翻译出来的中文：汉字和英文字母、数字之间补空格，去掉全角括号里多出来的空格（“白河（ White River ）”） */
export function tidyChinese(text: string): string {
  return text
    .replace(/（\s+/g, "（")
    .replace(/\s+）/g, "）")
    .replace(/\s*([，。；：、！？])\s*/g, "$1")
    .replace(/([\u3400-\u9fff\uf900-\ufaff])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([\u3400-\u9fff\uf900-\ufaff])/g, "$1 $2")
    .replace(/ {2,}/g, " ");
}

export interface UnitText {
  minutes: string;
  hours: string;
  hoursMinutes: string;
  months: string;
  month: string;
  allYear: string;
  km: string;
  meters: string;
  /** 几项并列时的分隔：中文“、”，英文“, ” */
  listSep: string;
  colon: string;
  comma: string;
  clauseSep: string;
  sentenceSep: string;
  paren: string;
}

/** 分钟数 → "约 1 小时 30 分" 里的时长部分，按 5 分钟取整 */
export function formatDuration(minutes: number, units: UnitText): string {
  const rounded = Math.max(5, Math.round(minutes / 5) * 5);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return fill(units.minutes, { m });
  return m === 0 ? fill(units.hours, { h }) : fill(units.hoursMinutes, { h, m });
}

/** [6,7,8,9,10] → "6–10 月"；跨年的 [11,12,1,2,3] → "11–3 月" */
export function formatMonths(months: number[], units: UnitText): string {
  const set = new Set(months);
  if (set.size >= 12) return units.allYear;
  const next = (m: number) => (m % 12) + 1;
  const prev = (m: number) => ((m + 10) % 12) + 1;
  const runs: string[] = [];
  for (let m = 1; m <= 12; m++) {
    if (!set.has(m) || set.has(prev(m))) continue;
    let end = m;
    while (set.has(next(end))) end = next(end);
    runs.push(end === m ? fill(units.month, { m }) : fill(units.months, { from: m, to: end }));
  }
  return runs.join(units.listSep);
}

export function formatKm(miles: number, units: UnitText): string {
  return fill(units.km, { km: (miles * 1.609).toFixed(1), mi: miles });
}

/** 每周哪几天（0 是周日）：“周三”“周三、周六”，英文“Wednesday” */
export function formatWeekdays(weekdays: number[], units: { weekdays: string[]; listSep: string }): string {
  return weekdays.map((day) => units.weekdays[day]).join(units.listSep);
}

/** 名字旁边附的英文名：英文版里主名已经是英文、两个一样时不再重复，返回空字符串 */
export function otherName(primary: string, english: string): string {
  return primary.trim().toLowerCase() === english.trim().toLowerCase() ? "" : english;
}

/** 几项并列、最后一项前加“和”：“A、B和C”，英文“A, B, and C”（两项是“A and B”） */
export function joinAnd(items: string[], and: string, units: Pick<UnitText, "listSep">): string {
  if (items.length < 2) return items.join("");
  const serial = items.length > 2 && units.listSep === ", " ? "," : "";
  return `${items.slice(0, -1).join(units.listSep)}${serial}${and}${items.at(-1)}`;
}

/** 几项并列：中文用顿号，英文用逗号 */
export function joinList(items: string[], units: Pick<UnitText, "listSep">): string {
  return items.join(units.listSep);
}

/** 12130 → "12,130"；固定用英文分隔，服务端和浏览器输出一致 */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * 人次这类大数：3.23 亿、1153 万、47 万、3.2 万、2 万（不写“2.0 万”）；一万以下照常写（4,243）。
 * 英文（numberStyle 是 western）：323 million、11.5 million、470,000 这样按百万写
 */
export function formatBig(n: number, units: { wan: string; yi: string; numberStyle?: string }): string {
  if (units.numberStyle === "western") {
    if (n >= 1e6) return fill(units.yi, { n: Number((n / 1e6).toFixed(n >= 1e7 ? 1 : 2)) });
    return formatCount(n >= 1e4 ? Math.round(n / 1000) * 1000 : Math.round(n));
  }
  if (n >= 1e8) return fill(units.yi, { n: Number((n / 1e8).toFixed(2)) });
  if (n >= 1e5) return fill(units.wan, { n: Math.round(n / 1e4) });
  if (n >= 1e4) return fill(units.wan, { n: Number((n / 1e4).toFixed(1)) });
  return formatCount(Math.round(n));
}

export function formatMeters(feet: number, units: UnitText): string {
  return fill(units.meters, { m: Math.round((feet * 0.3048) / 10) * 10, ft: formatCount(Math.round(feet / 10) * 10) });
}
