import { airports } from "@/data/airports";
import { parks } from "@/data/parks";
import { hasLocale } from "@/i18n/config";
import { localize } from "@/i18n/convert";
import { getDictionary } from "@/i18n/dictionaries";
import { parkState } from "@/lib/prices/fuel";

/** 机票、租车、油价三页共用的文案和机场、公园列表 */
export function loadPricesPage(locale: string) {
  if (!hasLocale(locale)) return null;
  const dict = getDictionary(locale);
  const t = dict.prices;
  return {
    locale,
    t,
    airports: Object.fromEntries(
      Object.entries(airports).map(([code, airport]) => [
        code,
        { ...airport, nameZh: localize(airport.nameZh, locale), city: localize(airport.city, locale) },
      ]),
    ),
    parks: parks.map((park) => ({
      code: park.code,
      nameZh: localize(park.nameZh, locale),
      airports: park.airports,
      state: parkState[park.code],
    })),
    text: { ...t, units: dict.units, states: dict.plan.budget.states },
  };
}
