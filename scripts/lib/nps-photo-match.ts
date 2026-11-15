const WEAK = new Set(
  "the a an of and at on in to trail trails loop tour tours overlook center visitor visitors point drive road area park national state historic site view views walk river lake creek beach bay".split(" "),
);

const plain = (text: string) => text.toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export function nameKeys(stop: { nameEn: string }) {
  const phrase = plain(stop.nameEn.replace(/\(.*?\)/g, " "));
  // 游客中心不能退化成公园名；Washburn Point 也不能只匹配 Washburn。
  const strong = /\bvisitor(?:s)?\b/.test(phrase) ? []
    : phrase.split(" ").filter((word) => word.length >= 3 && !WEAK.has(word));
  return { phrase, strong };
}

export function names(text: string, keys: ReturnType<typeof nameKeys>) {
  const hay = ` ${plain(text)} `;
  if (keys.phrase && hay.includes(` ${keys.phrase} `)) return true;
  return keys.strong.length >= 2 && keys.strong.every((word) => hay.includes(` ${word} `));
}

export function meters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180;
  const h = Math.sin((b.lat - a.lat) * rad / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lon - a.lon) * rad / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

export function matchesPlace(
  stop: { nameEn: string; lat: number; lon: number; start?: { lat: number; lon: number } },
  place: { title: string; latitude?: string | null; longitude?: string | null },
) {
  const at = { lat: Number(place.latitude), lon: Number(place.longitude) };
  const located = (place.latitude ?? "").trim() !== "" && (place.longitude ?? "").trim() !== ""
    && Number.isFinite(at.lat) && Number.isFinite(at.lon)
    && Math.abs(at.lat) <= 90 && Math.abs(at.lon) <= 180;
  const distance = located ? Math.min(meters(stop, at), stop.start ? meters(stop.start, at) : Infinity) : Infinity;
  // 同名但相距很远的地点不能仅凭名称通过；步道可按出发点核对。
  return distance <= 150 || ((!located || distance <= 5000) && names(place.title, nameKeys(stop)));
}
