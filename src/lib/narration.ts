// 路线讲解（10-20 仓库主人要的：让一个不懂地图、不懂国家公园的人也能看懂有什么好玩、风景好在哪、怎么玩、要注意什么）。
// 讲解词全部从网站已有的数据拼出来（景点的看点、提示、停留时间、步道、最佳时间、许可证、危险标注、这天的时间线），
// 不让模型现编，所以不会编造、不花额度。这里是不碰页面的拼字，地图上怎么播见 components/map/park-map.tsx

import type { Hazard, TimeOfDay } from "../data/attractions/types";
// 和界面文案同一个 fill：汉字紧挨着英文地名时补空格（“去Wawona” → “去 Wawona”）
import { fill } from "../i18n/format";

export interface NarrationText {
  /** 每一站四行的小标题：看点、怎么玩、什么时候、注意 */
  see: string;
  how: string;
  when: string;
  watch: string;
  /** “第 3 站 · 冰川点” */
  stopTitle: string;
  /** 步道：“步道来回约 {km} 公里、爬升约 {m} 米，{level}”（英文用 {mi}、{ft}） */
  hike: string;
  levels: Record<"easy" | "moderate" | "hard", string>;
  /** “在这里停 {stay}” */
  stay: string;
  /** “{time} 到” */
  arrive: string;
  best: Record<TimeOfDay, string>;
  permit: string;
  parking: string;
  closed: string;
  /** “接下来开车约 {drive}，去{name}” */
  next: string;
  /** 念出来的句子：“第 3 站，冰川点” “要注意：{list}” */
  speakStop: string;
  speakWatch: string;
  /** 列表的分隔（“、” / “, ”）和句号（“。” / “.”） */
  listSep: string;
  period: string;
}

export interface NarrationLine {
  label: string;
  text: string;
}

export interface StopNarration {
  title: string;
  lines: NarrationLine[];
  /** 要念的句子，一句一句念、一句一句出字幕 */
  speech: string[];
}

export interface StopFacts {
  index: number;
  name: string;
  summary: string;
  tips?: string[];
  stayMin: number;
  hike?: { distanceMi?: number; gainFt?: number; difficulty: "easy" | "moderate" | "hard" };
  bestTime?: TimeOfDay[];
  permit?: string;
  hazards?: Hazard[];
  hazardText: Record<Hazard, string>;
  /** 几点到（已经按当地时间写好的字），不知道就不说 */
  arrive?: string;
  /** 这一站停多久（已经写好的字，比如“45 分钟”） */
  stay: string;
  parkingFull?: boolean;
  tempClosed?: boolean;
  /** 下一段要开很久（一小时以上）：念完这一站顺便说一句 */
  next?: { drive: string; name: string };
}

/** 去掉结尾的句号，好接在别的句子里 */
const bare = (text: string) => text.trim().replace(/[。.!！；;，,]+$/u, "");

export function stopNarration(facts: StopFacts, t: NarrationText, english: boolean): StopNarration {
  const title = fill(t.stopTitle, { n: facts.index, name: facts.name });
  const see = bare(facts.summary);
  const how: string[] = [];
  if (facts.hike?.distanceMi) {
    how.push(
      fill(t.hike, {
        km: (facts.hike.distanceMi * 1.609).toFixed(1),
        mi: facts.hike.distanceMi.toFixed(1),
        m: Math.round(((facts.hike.gainFt ?? 0) * 0.3048) / 10) * 10,
        ft: Math.round((facts.hike.gainFt ?? 0) / 10) * 10,
        level: t.levels[facts.hike.difficulty],
      }),
    );
  }
  how.push(fill(t.stay, { stay: facts.stay }));
  // 第一条提示通常是“怎么去、在哪停车”这种实用的话
  const tip = facts.tips?.[0] ? bare(facts.tips[0]) : "";
  const when = [facts.arrive ? fill(t.arrive, { time: facts.arrive }) : "", ...(facts.bestTime ?? []).slice(0, 1).map((slot) => t.best[slot])]
    .filter(Boolean)
    .join(english ? "; " : "，");
  const watch = [
    ...(facts.hazards ?? []).slice(0, 2).map((hazard) => facts.hazardText[hazard]),
    ...(facts.permit ? [fill(t.permit, { permit: bare(facts.permit) })] : []),
    ...(facts.parkingFull ? [t.parking] : []),
    ...(facts.tempClosed ? [t.closed] : []),
  ];
  const lines: NarrationLine[] = [
    { label: t.see, text: see },
    { label: t.how, text: [...how, tip].filter(Boolean).join(english ? ". " : "；") },
    ...(when ? [{ label: t.when, text: when }] : []),
    ...(watch.length ? [{ label: t.watch, text: watch.join(t.listSep) }] : []),
  ];
  const speech = [
    fill(t.speakStop, { n: facts.index, name: facts.name }),
    see,
    [...how].join(english ? ", " : "，"),
    ...(when ? [when] : []),
    ...(watch.length ? [fill(t.speakWatch, { list: watch.join(t.listSep) })] : []),
    ...(facts.next ? [fill(t.next, { drive: facts.next.drive, name: facts.next.name })] : []),
  ].map((sentence) => bare(sentence) + t.period);
  return { title, lines, speech };
}

/** 一段话拆成一句一句（念一句、字幕换一句）；太长的句子在逗号处再拆，免得字幕一次出两行以上 */
export function sentences(text: string, max = 46): string[] {
  const out: string[] = [];
  for (const part of text.split(/(?<=[。！？!?])\s*|(?<=\.)\s+/u)) {
    const sentence = part.trim();
    if (!sentence) continue;
    if (sentence.length <= max) {
      out.push(sentence);
      continue;
    }
    let current = "";
    for (const piece of sentence.split(/(?<=[，,；;])/u)) {
      if (current && (current + piece).length > max) {
        out.push(current.trim());
        current = "";
      }
      current += piece;
    }
    if (current.trim()) out.push(current.trim());
  }
  return out;
}

/** 没有朗读（浏览器不支持、关了声音）时一句话显示多久（毫秒）：中文每秒约 4.5 个字，英文每秒约 2.6 个词，至少 1.8 秒 */
export function readingMs(sentence: string): number {
  const han = (sentence.match(/[㐀-鿿]/gu) ?? []).length;
  const words = sentence.replace(/[㐀-鿿]/gu, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1800, Math.round((han / 4.5 + words / 2.6) * 1000) + 400);
}
