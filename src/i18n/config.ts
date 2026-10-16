// 内容统一用简体撰写，繁体由 OpenCC 自动转换（台湾用语）；英文版按英语母语的写法另写（src/i18n/en/）。以后加 "ja"、"ko"。
export const locales = ["zh-Hans", "zh-Hant", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh-Hans";

export const localeLabels: Record<Locale, string> = {
  "zh-Hans": "简体",
  "zh-Hant": "繁體",
  en: "English",
};

/** Intl 日期、时间格式用的语言 */
export const intlLocale = (locale: Locale) => (locale === "zh-Hant" ? "zh-TW" : locale === "en" ? "en-US" : "zh-CN");

/** 中文界面（简体、繁体）：排版、单位、日期按中文习惯 */
export const isChinese = (locale: Locale) => locale !== "en";

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
