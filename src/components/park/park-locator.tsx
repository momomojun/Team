import Link from "next/link";
import { airports } from "@/data/airports";
import { alaskaMap, caribbeanMap, eastMap, hawaiiMap, samoaMap, westMap, type MapView } from "@/data/map.generated";
import { parks, type Park } from "@/data/parks";
import { fill, formatDuration, type UnitText } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries";
import { localize } from "@/i18n/convert";
import type { Locale } from "@/i18n/config";
import { airportMinutes, parkDriveMinutes } from "@/lib/travel";
import { linked } from "@/lib/trip-parks";

const VIEWS: MapView[] = [westMap, eastMap, alaskaMap, hawaiiMap, caribbeanMap, samoaMap];
const parkAt = (park: Park) => park.mapAt ?? park.gateway;
const nearbyOf = (code: string) => parks.find((park) => park.code === code)?.nearby ?? [];

/**
 * 地图上没有的点（机场）放在哪：用这张图上离它最近的几座公园（图上的位置和经纬度都知道）拟合一个局部的线性变换。
 * 等积圆锥投影在几百公里的范围里很接近线性，误差在一两个像素
 */
function projector(view: MapView, near: { lat: number; lon: number }) {
  const known = parks
    .filter((park) => view.parks[park.code])
    .map((park) => ({ at: parkAt(park), xy: view.parks[park.code] }))
    .sort((a, b) => Math.hypot(a.at.lat - near.lat, a.at.lon - near.lon) - Math.hypot(b.at.lat - near.lat, b.at.lon - near.lon))
    .slice(0, 8);
  if (known.length < 3) return null;
  // 最小二乘：x = a·lon + b·lat + c（y 同理），解 3×3 的正规方程
  const solve = (pick: (xy: [number, number]) => number) => {
    const m = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const v = [0, 0, 0];
    for (const { at, xy } of known) {
      const row = [at.lon, at.lat, 1];
      for (let i = 0; i < 3; i++) {
        v[i] += row[i] * pick(xy);
        for (let j = 0; j < 3; j++) m[i][j] += row[i] * row[j];
      }
    }
    // 高斯消元
    for (let i = 0; i < 3; i++) {
      const p = m[i][i] || 1e-9;
      for (let k = i + 1; k < 3; k++) {
        const f = m[k][i] / p;
        for (let j = i; j < 3; j++) m[k][j] -= f * m[i][j];
        v[k] -= f * v[i];
      }
    }
    const x = [0, 0, 0];
    for (let i = 2; i >= 0; i--) {
      x[i] = (v[i] - m[i].slice(i + 1).reduce((sum, value, j) => sum + value * x[i + 1 + j], 0)) / (m[i][i] || 1e-9);
    }
    return x;
  };
  const ax = solve((xy) => xy[0]);
  const ay = solve((xy) => xy[1]);
  return (lat: number, lon: number): [number, number] => [ax[0] * lon + ax[1] * lat + ax[2], ay[0] * lon + ay[1] * lat + ay[2]];
}

/**
 * 概览里的“在哪里”：首页线描地图的那一块，拉近到这座公园。公园是砂岩红的大圆点，常用机场是方块（写开车多久），
 * 开车一天能一起玩的公园是小圆点；旁边列出机场的车程和顺路的公园（点了去那座公园的页面）
 */
export function ParkLocator({ park, locale, dict }: { park: Park; locale: string; dict: Dictionary }) {
  const view = VIEWS.find((candidate) => candidate.parks[park.code]);
  if (!view) return null;
  const t = dict.park;
  const units = dict.units as UnitText;
  const en = locale === "en";
  const home = view.parks[park.code];
  const project = projector(view, parkAt(park));

  const flights = park.airports
    .flatMap((code) => {
      const airport = airports[code];
      const minutes = airportMinutes(code, park.code);
      return airport && minutes !== null ? [{ airport, minutes: Math.round(minutes) }] : [];
    })
    .sort((a, b) => a.minutes - b.minutes);
  const combos = parks
    .filter((other) => other.code !== park.code && linked(park.code, other.code, nearbyOf))
    .map((other) => ({ park: other, usual: nearbyOf(park.code).includes(other.code), minutes: parkDriveMinutes(park.code, other.code) }))
    .sort((a, b) => Number(b.usual) - Number(a.usual) || (a.minutes ?? Infinity) - (b.minutes ?? Infinity))
    .slice(0, 8);

  // 画面框住：公园、机场、顺路的公园（最多 4 座），留边；太小的话至少 320 宽，宽高 4:3
  // 地图上只画开车 4.5 小时以内的机场（远的只在旁边的列表里），不然画面被拉得太大、字太小
  const drawn = flights.filter(({ minutes }, i) => i === 0 || minutes <= 270);
  const marks = [
    home,
    ...drawn.flatMap(({ airport }) => (project ? [project(airport.lat, airport.lon)] : [])),
    ...combos.slice(0, 4).flatMap(({ park: other }) => (view.parks[other.code] ? [view.parks[other.code]] : [])),
  ];
  const xs = marks.map(([x]) => x);
  const ys = marks.map(([, y]) => y);
  let width = Math.max(320, Math.max(...xs) - Math.min(...xs) + 120);
  let height = Math.max(240, Math.max(...ys) - Math.min(...ys) + 120);
  if (width / height > 4 / 3) height = (width * 3) / 4;
  else width = (height * 4) / 3;
  width = Math.min(width, view.width);
  height = Math.min(height, view.height);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const x0 = Math.min(Math.max(0, cx - width / 2), view.width - width);
  const y0 = Math.min(Math.max(0, cy - height / 2), view.height - height);
  const k = width / 440; // 字和圆点按画面大小放大，手机上也看得清

  const name = (other: Park) => (en ? other.nameEn.replace(/ National Park.*$/, "") : localize(other.nameZh, locale as Locale));
  const hours = (minutes: number) => fill(t.where.hours, { h: Math.max(1, Math.round(minutes / 30) / 2) });

  // 摆名字：先把所有圆点、方块占住，再按重要程度（公园 → 机场 → 顺路的公园 → 城市）一个个放，
  // 右、左、上、下哪边不碰别的就放哪边，都碰就不写（圆点照样画）
  type Box = [number, number, number, number];
  const taken: Box[] = [];
  const hits = (a: Box) => taken.some((b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]);
  const textWidth = (text: string, size: number) =>
    [...text].reduce((w, ch) => w + (/[⺀-鿿＀-￯]/.test(ch) ? size : size * 0.56), 0);
  const dot = (x: number, y: number, r: number) => taken.push([x - r, y - r, x + r, y + r]);
  const place = (x: number, y: number, r: number, text: string, size: number, first: "right" | "above" = "right") => {
    const w = textWidth(text, size);
    const gap = 2 * k;
    const options = {
      right: { x: x + r + gap, y: y + size * 0.35, anchor: "start" as const, box: [x + r + gap, y - size * 0.6, x + r + gap + w, y + size * 0.45] as Box },
      left: { x: x - r - gap, y: y + size * 0.35, anchor: "end" as const, box: [x - r - gap - w, y - size * 0.6, x - r - gap, y + size * 0.45] as Box },
      above: { x, y: y - r - gap, anchor: "middle" as const, box: [x - w / 2, y - r - gap - size, x + w / 2, y - r - gap] as Box },
      below: { x, y: y + r + gap + size * 0.85, anchor: "middle" as const, box: [x - w / 2, y + r + gap, x + w / 2, y + r + gap + size] as Box },
    };
    const order = first === "above" ? (["above", "right", "left", "below"] as const) : (["right", "left", "above", "below"] as const);
    for (const side of order) {
      const option = options[side];
      const [bx0, by0, bx1, by1] = option.box;
      if (bx0 < x0 || bx1 > x0 + width || by0 < y0 || by1 > y0 + height || hits(option.box)) continue;
      taken.push(option.box);
      return option;
    }
    return null;
  };

  dot(home[0], home[1], 9 * k);
  const flightMarks = project ? drawn.map((flight) => ({ ...flight, at: project(flight.airport.lat, flight.airport.lon) })) : [];
  flightMarks.forEach(({ at }) => dot(at[0], at[1], 3.5 * k));
  const comboMarks = combos.flatMap((combo) => (view.parks[combo.park.code] ? [{ ...combo, at: view.parks[combo.park.code] }] : []));
  comboMarks.forEach(({ at }) => dot(at[0], at[1], 3.5 * k));
  view.cities.forEach((city) => dot(city.x, city.y, 2.8 * k));

  const homeLabel = place(home[0], home[1], 9 * k, name(park), 15 * k, "above");
  const flightLabels = flightMarks.map((mark) => place(mark.at[0], mark.at[1], 3.5 * k, `${mark.airport.code} · ${hours(mark.minutes)}`, 10.5 * k));
  const comboLabels = comboMarks.map((mark) => place(mark.at[0], mark.at[1], 3.5 * k, name(mark.park), 10.5 * k));
  const cityName = (city: MapView["cities"][number]) => (en ? city.nameEn : localize(city.nameZh, locale as Locale));
  const cityLabels = view.cities.map((city) => place(city.x, city.y, 2.8 * k, cityName(city), 9.5 * k));

  return (
    <section className="border-t border-line">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-20 sm:px-10 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-7">
          <p className="eyebrow text-mute">{t.where.eyebrow}</p>
          <h2 className="mt-5 font-serif text-[clamp(1.9rem,3vw,2.8rem)] leading-tight">{t.where.title}</h2>
          <figure className="mt-10 border border-line bg-paper">
            <svg viewBox={`${x0} ${y0} ${width} ${height}`} className="block h-auto w-full" role="img" aria-label={fill(t.where.mapLabel, { park: name(park) })}>
              {view.states.map((state) => (
                <path
                  key={state.name}
                  d={state.d}
                  fill={state.focus ? "var(--color-paper-deep)" : "none"}
                  stroke={state.focus ? "#b8ac97" : "#dcd3c5"}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
              ))}
              {view.labels.map((label) => (
                <text key={label.text} x={label.x} y={label.y} textAnchor="middle" fill="#c2b9ab" fontSize={10 * k} letterSpacing={4 * k} style={{ fontFamily: "var(--font-jost)" }}>
                  {label.text}
                </text>
              ))}
              {/* 常一起玩的公园、机场：从公园连一条线（直线示意，不是开车路线） */}
              {comboMarks.map(({ park: other, usual, at }) =>
                usual ? (
                  <line
                    key={`line-${other.code}`}
                    x1={home[0]}
                    y1={home[1]}
                    x2={at[0]}
                    y2={at[1]}
                    stroke="#a04c2e"
                    strokeOpacity={0.45}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null,
              )}
              {flightMarks.map(({ airport, at }) => (
                <line key={`line-${airport.code}`} x1={home[0]} y1={home[1]} x2={at[0]} y2={at[1]} stroke="#1c1b18" strokeOpacity={0.3} strokeWidth={1} vectorEffect="non-scaling-stroke" />
              ))}
              {view.cities.map((city, i) => {
                const label = cityLabels[i];
                return (
                  <g key={city.id} fill="#8a8377">
                    <circle cx={city.x} cy={city.y} r={2.4 * k} fill="var(--color-paper)" stroke="#8a8377" strokeWidth={0.9 * k} />
                    {label && (
                      <text x={label.x} y={label.y} textAnchor={label.anchor} fontSize={9.5 * k}>
                        {cityName(city)}
                      </text>
                    )}
                  </g>
                );
              })}
              {comboMarks.map(({ park: other, at }, i) => {
                const label = comboLabels[i];
                return (
                  <g key={other.code}>
                    <circle cx={at[0]} cy={at[1]} r={3.2 * k} fill="#5f7a4a" stroke="var(--color-paper)" strokeWidth={1 * k} />
                    {label && (
                      <text x={label.x} y={label.y} textAnchor={label.anchor} fontSize={10.5 * k} fill="#4b5d3c">
                        {name(other)}
                      </text>
                    )}
                  </g>
                );
              })}
              {flightMarks.map(({ airport, minutes, at }, i) => {
                const label = flightLabels[i];
                return (
                  <g key={airport.code}>
                    <rect x={at[0] - 3 * k} y={at[1] - 3 * k} width={6 * k} height={6 * k} fill="#1c1b18" />
                    {label && (
                      <text x={label.x} y={label.y} textAnchor={label.anchor} fontSize={10.5 * k} fill="#1c1b18" style={{ fontFamily: "var(--font-jost)" }}>
                        {airport.code}
                        <tspan fill="#68615a"> · {hours(minutes)}</tspan>
                      </text>
                    )}
                  </g>
                );
              })}
              <circle cx={home[0]} cy={home[1]} r={10 * k} fill="#a04c2e" fillOpacity={0.15} />
              <circle cx={home[0]} cy={home[1]} r={5 * k} fill="#a04c2e" stroke="var(--color-paper)" strokeWidth={1.5 * k} />
              {homeLabel && (
                <text x={homeLabel.x} y={homeLabel.y} textAnchor={homeLabel.anchor} fontSize={15 * k} fill="#1c1b18" style={{ fontFamily: "var(--font-serif)" }}>
                  {name(park)}
                </text>
              )}
            </svg>
            <figcaption className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line px-4 py-3 text-[11px] text-mute">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-clay-600" />
                {t.where.legendPark}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 bg-ink" />
                {t.where.legendAirport}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#5f7a4a]" />
                {t.where.legendCombo}
              </span>
              <span>{t.where.mapNote}</span>
            </figcaption>
          </figure>
        </div>
        <aside className="space-y-12 lg:col-span-5 lg:pt-24">
          {flights.length > 0 && (
            <div>
              <p className="eyebrow text-mute">{t.where.flyTitle}</p>
              <ul className="mt-4 border-t border-line text-sm">
                {flights.map(({ airport, minutes }) => (
                  <li key={airport.code} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                    <span>
                      <span className="font-serif text-lg">{airport.code}</span>
                      <span className="ml-3 text-ink-soft">{localize(en ? airport.city : airport.nameZh, locale as Locale)}</span>
                    </span>
                    <span className="shrink-0 text-xs text-mute tabular-nums">{fill(t.where.drive, { d: formatDuration(minutes, units) })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {combos.length > 0 && (
            <div>
              <p className="eyebrow text-mute">{t.where.comboTitle}</p>
              <ul className="mt-4 border-t border-line text-sm">
                {combos.map(({ park: other, usual, minutes }) => (
                  <li key={other.code} className="border-b border-line">
                    <Link href={`/${locale}/parks/${other.code}`} className="flex items-baseline justify-between gap-4 py-3 transition-colors hover:text-clay-700">
                      <span className="font-serif text-lg">{name(other)}</span>
                      <span className="shrink-0 text-xs text-mute tabular-nums">
                        {usual && <span className="mr-2 text-clay-700">{t.where.usual}</span>}
                        {minutes !== null && fill(t.where.drive, { d: formatDuration(Math.round(minutes), units) })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-6 text-mute">{t.where.comboNote}</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
