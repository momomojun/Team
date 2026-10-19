// Copilot 回答问题用的资料：把网站的数据（景点、住宿、公园、特别活动、临时关闭）整理成一条条短文，写到 copilot/contracts/knowledge.jsonl。
// Copilot 先在这里查到相关的几条，再让模型只根据这几条回答（查不到就说不知道）。
// 由 npm run copilot:contracts 一起生成（数据改了要重跑）；tests/copilot-plan.test.ts 检查文件和数据一致。
import { activities } from "../src/data/activities.ts";
import { attractions } from "../src/data/attractions/index.ts";
import { tempClosures as closures } from "../src/data/closures.ts";
import { lodgingOptions } from "../src/data/lodging.ts";
import { nationalParks } from "../src/data/national-parks.ts";
import { airports } from "../src/data/airports.ts";
import { parks } from "../src/data/parks.ts";
import { suitability } from "../src/data/suitability/index.ts";
import { getDictionary } from "../src/i18n/dictionaries.ts";
import { airportMinutes, travelMinutes } from "../src/lib/travel.ts";

const DIFFICULTY = { easy: "轻松", moderate: "中等", hard: "难" };

const months = (list) => {
  const sorted = [...list].sort((a, b) => a - b);
  const contiguous = sorted.every((m, i) => i === 0 || m === sorted[i - 1] + 1);
  return contiguous && sorted.length > 1 ? `${sorted[0]}–${sorted.at(-1)} 月` : sorted.map((m) => `${m} 月`).join("、");
};
const minutes = (value) => {
  const rounded = value >= 60 ? Math.round(value / 10) * 10 : Math.round(value / 5) * 5;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return h ? `约 ${h} 小时${m ? ` ${m} 分` : ""}` : `约 ${m} 分钟`;
};
// 中英文名一样的（“El Portal”）不写两遍
const label = (zh, en) => (zh === en ? zh : `${zh}（${en}）`);
const sentence = (text) => (text && !/[。！？]$/.test(text) ? `${text}。` : text ?? "");

export function knowledge() {
  const parkById = new Map(parks.map((park) => [park.code, park]));
  const regions = getDictionary("zh-Hans").regions;
  const docs = [];

  for (const park of parks) {
    const areas = Object.entries(park.areas ?? {}).map(([, name]) => name).join("、");
    docs.push({
      id: `park:${park.code}`,
      type: "park",
      park: park.code,
      title: park.nameZh,
      names: [...new Set([park.nameZh, park.nameEn])],
      text: [
        `${park.nameZh}（${park.nameEn}，${park.stateEn}）：${park.tagline}。`,
        sentence(park.intro),
        park.bestMonths?.length ? `最适合去的月份：${months(park.bestMonths)}。` : "",
        sentence(park.seasonNote),
        areas ? `片区：${areas}。` : "",
        `常用机场：${park.airports.join("、")}。`,
        `所在片区：${regions[park.region]}。`,
      ].join(""),
    });
  }

  // 片区：“西雅图附近有哪几座国家公园”“介绍一下西雅图周边”。park 是空的：不管行程是哪座公园都查得到
  for (const [region, area] of Object.entries(regions)) {
    const members = parks.filter((park) => park.region === region);
    if (!members.length) continue;
    const base = area.endsWith("周边") ? area.slice(0, -2) : null;
    docs.push({
      id: `region:${region}`,
      type: "region",
      park: "",
      members: members.map((park) => park.code),
      title: area,
      names: [...new Set([area, ...(base ? [`${base}附近`, `${base}一带`] : [])])],
      text: [
        `${area}（网站上的片区）一共 ${members.length} 处：`,
        members.map((park) => `${label(park.nameZh, park.nameEn)}，${park.stateEn}，${park.tagline}${park.bestMonths?.length ? `，最适合 ${months(park.bestMonths)}` : ""}`).join("；") + "。",
        ...members.filter((park) => park.nearby?.length).map((park) => `${park.nameZh}常和${park.nearby.map((code) => parkById.get(code)?.nameZh ?? code).join("、")}一起玩。`),
      ].join(""),
    });
  }

  // 机场、城市：“波特兰附近有什么国家公园”。开车 6 小时以内的，按车程排；park 是空的，问题里说了城市、机场才用
  for (const airport of Object.values(airports)) {
    const near = parks
      .map((park) => ({ park, minutes: airportMinutes(airport.code, park.code) }))
      .filter(({ minutes: m }) => m !== null && Number.isFinite(m) && m <= 360)
      .sort((a, b) => a.minutes - b.minutes);
    if (!near.length) continue;
    const cities = airport.city.split(" / ").flatMap((city) => [city, city.replace(/（.*）$/, "")]);
    docs.push({
      id: `airport:${airport.code}`,
      type: "airport",
      park: "",
      // 标题带上城市全名：两个波特兰（俄勒冈、缅因）要分得清
      title: `${airport.city}（${airport.code}）附近的国家公园`,
      names: [...new Set([...cities, ...cities.map((city) => `${city}附近`), airport.nameZh, airport.code])],
      text:
        `从${airport.nameZh}（${airport.code}，${airport.city}）开车 6 小时以内能到的国家公园和名胜（按车程排）：` +
        near.map(({ park, minutes: m }) => `${park.nameZh}${minutes(m)}（${park.tagline}）`).join("，") + "。",
    });
  }

  // 州：“华盛顿州有哪些国家公园”。按美国 63 座国家公园算，网站没收录的也列出来
  const byState = new Map();
  for (const park of nationalParks) {
    for (const state of park.statesZh.split("、")) byState.set(state, [...(byState.get(state) ?? []), park]);
  }
  for (const [state, members] of byState) {
    const full = state.endsWith("州") || state === "加州" ? state : `${state}州`;
    docs.push({
      id: `state:${state}`,
      type: "state",
      park: "",
      members: [...new Set(members.map((park) => park.page).filter(Boolean))],
      title: `${full}的国家公园`,
      names: [...new Set([full, state === "加州" ? "加利福尼亚州" : full.replace(/州$/, "")])],
      text: `${full}有 ${members.length} 座国家公园（美国一共 63 座）：` +
        members.map((park) => `${park.nameZh}（${park.nameEn}，${park.established.slice(0, 4)} 年成为国家公园${park.page ? "" : "，网站还没收录"}）`).join("、") + "。",
    });
  }

  const mustSee = new Map();
  for (const a of attractions) {
    if (a.mustSee) mustSee.set(a.park, [...(mustSee.get(a.park) ?? []), a]);
    const park = parkById.get(a.park);
    const fit = suitability[a.id];
    const parts = [
      `${label(a.nameZh, a.nameEn)}，在${park?.nameZh ?? a.park}${park?.areas?.[a.area] ? `的${park.areas[a.area]}` : ""}。`,
      sentence(a.summary),
      `一般停留${minutes(a.durationMin)}。`,
    ];
    if (a.hike) {
      const km = a.hike.distanceMi ? `${a.hike.distanceMi} 英里（约 ${Math.round(a.hike.distanceMi * 1.609 * 10) / 10} 公里）` : "";
      const gain = a.hike.gainFt ? `，爬升约 ${a.hike.gainFt} 英尺（约 ${Math.round(a.hike.gainFt * 0.3048)} 米）` : "";
      if (km) parts.push(`步道${a.hike.loop ? "一圈" : "往返"} ${km}${gain}，难度${DIFFICULTY[a.hike.difficulty]}。`);
    }
    if (a.openMonths && a.openMonths.length < 12) {
      parts.push(a.openMonths.length ? `开放（出现）的月份：${months(a.openMonths)}。` : "目前关闭，没有公布重开时间。");
    }
    if (a.closedNote) parts.push(sentence(a.closedNote));
    if (a.permit) parts.push(`许可、预约：${sentence(a.permit)}`);
    if (a.hours?.length) parts.push(`开放时间：${a.hours.map((h) => [h.open, h.lastEntry && `最晚 ${h.lastEntry} 进`, h.close && `${h.close} 关`].filter(Boolean).join("，")).join("；")}。`);
    if (a.tips?.length) parts.push(`提示：${a.tips.map(sentence).join("")}`);
    if (fit?.noteZh) parts.push(`带小孩、老人：${sentence(fit.noteZh)}`);
    docs.push({ id: a.id, type: "attraction", park: a.park, title: a.nameZh, names: [...new Set([a.nameZh, a.nameEn])], text: parts.join("") });
  }

  for (const option of lodgingOptions) {
    const park = parkById.get(option.park);
    // 到这座公园的必去景点开多久：回答“住这里离园区多远”
    const drives = (mustSee.get(option.park) ?? [])
      .map((a) => ({ a, minutes: travelMinutes(option.id, a.id) }))
      .filter(({ minutes: m }) => Number.isFinite(m) && m < 600)
      .sort((x, y) => x.minutes - y.minutes)
      .slice(0, 5);
    docs.push({
      id: option.id,
      type: "lodging",
      park: option.park,
      title: option.nameZh,
      names: [...new Set([option.nameZh, option.nameEn])],
      text: [
        `${label(option.nameZh, option.nameEn)}：${park?.nameZh ?? option.park}${option.inPark ? "园内" : "园外"}的${option.rental ? "民宿区（Airbnb 等整套房子集中的地方）" : "住处"}。`,
        sentence(option.note),
        drives.length ? `开车到：${drives.map(({ a, minutes: m }) => `${a.nameZh}${minutes(m)}`).join("，")}。` : "",
      ].join(""),
    });
  }

  for (const activity of activities) {
    docs.push({
      id: `activity:${activity.park}:${activity.nameEn}`,
      type: "activity",
      park: activity.park,
      title: activity.nameZh,
      names: [...new Set([activity.nameZh, activity.nameEn])],
      text: [
        `${label(activity.nameZh, activity.nameEn)}：${activity.months?.length ? `${months(activity.months)}。` : "全年。"}`,
        sentence(activity.summary),
        activity.booking ? `怎么参加：${sentence(activity.booking)}` : "",
        activity.status ? `今年的情况：${sentence(activity.status)}` : "",
      ].join(""),
    });
  }

  const byId = new Map(attractions.map((a) => [a.id, a]));
  for (const [i, closure] of closures.entries()) {
    const names = closure.attractions.map((id) => byId.get(id)?.nameZh ?? id);
    docs.push({
      id: `closure:${i}:${closure.attractions[0]}`,
      type: "closure",
      park: closure.attractions[0].split("-")[0],
      title: `${names.join("、")}临时关闭`,
      names,
      text: `${names.join("、")}：${closure.from} 起临时关闭${closure.reopen ? `，预计 ${closure.reopen} 重开` : "，没有公布重开时间"}。${sentence(closure.reasonZh)}（${closure.checked} 核对）`,
    });
  }
  return docs;
}
