// Copilot 的契约文件：把 src/lib/copilot/contract.ts 里的 JSON Schema 和公园、机场目录写到 copilot/contracts/，
// 给 Python 服务（Intake 认公园名、机场）和评测用。tests/copilot-plan.test.ts 检查这些文件和代码一致，
// 改了契约、公园或机场以后跑一次：npm run copilot:contracts
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import * as OpenCC from "opencc-js";
import { airports } from "../src/data/airports.ts";
import { npsCodeOf, parks } from "../src/data/parks.ts";
import { attractions } from "../src/data/attractions/index.ts";
import { knowledge } from "./build-copilot-knowledge.mjs";
import { localize } from "../src/i18n/convert.ts";
import { airportMinutes } from "../src/lib/travel.ts";
import { linked } from "../src/lib/trip-parks.ts";
import { tripRequestSchema, tripResultSchema } from "../src/lib/copilot/contract.ts";

const OUT = new URL("../copilot/contracts/", import.meta.url);
mkdirSync(OUT, { recursive: true });
const write = (name, value) => writeFileSync(new URL(name, OUT), `${JSON.stringify(value, null, 2)}\n`);

const nearbyOf = (code) => parks.find((park) => park.code === code)?.nearby ?? [];

export function catalog() {
  const parkList = parks.map((park) => {
    const hant = localize(park.nameZh, "zh-Hant");
    const shortEn = park.nameEn.replace(/\s+(National Park|National Park and Preserve|National Parks)$/i, "");
    return {
      code: park.code,
      nameZh: park.nameZh,
      nameEn: park.nameEn,
      kind: park.kind === "site" ? "site" : "park",
      country: park.country ?? "US",
      // 查 NPS 公告用的代码（加拿大的公园、大多数园外名胜没有：null）；Copilot 聊天时现抓公告用
      nps: npsCodeOf(park) ?? null,
      timeZone: park.timeZone,
      airports: park.airports,
      // 常用机场开到公园定位点要几分钟（Copilot 提醒“从这个机场过去太远、这几个近”时用）
      airportMinutes: Object.fromEntries(
        park.airports.flatMap((code) => {
          const minutes = airportMinutes(code, park.code);
          return minutes === null ? [] : [[code, Math.round(minutes)]];
        }),
      ),
      nearby: (park.nearby ?? []).filter((code) => parks.some((other) => other.code === code)),
      // 能排进同一趟的：常一起玩的，或者开车一天能到（trip-parks.ts 的 linked；Intake 判断几座公园能不能一起排）
      linked: parks.filter((other) => other.code !== park.code && linked(park.code, other.code, nearbyOf)).map((other) => other.code),
      // Intake 认公园名用：简体、繁体、英文全名和去掉 National Park 的短名，都按小写比较
      aliases: [...new Set([park.nameZh, hant, park.nameEn, shortEn, park.code])],
    };
  });
  const airportList = Object.values(airports).map((airport) => ({
    code: airport.code,
    nameZh: airport.nameZh,
    city: airport.city,
    lat: airport.lat,
    lon: airport.lon,
  }));
  // 景点：Copilot 读 NPS 公告、判断关了哪个景点时，让模型从这座公园的景点里选（id、中英文名、片区）
  const attractionList = attractions.map((a) => ({
    id: a.id,
    park: a.park,
    nameEn: a.nameEn,
    nameZh: a.nameZh,
    area: a.area,
    areaZh: parks.find((park) => park.code === a.park)?.areas?.[a.area] ?? "",
  }));
  return { parks: parkList, airports: airportList, attractions: attractionList };
}

/**
 * 繁体 → 简体的单字对照，给 Python 的 Intake 先把繁体输入转成简体再认公园、机场、关键词（不在 Python 里装 OpenCC）。
 * 只收用得到的字：公园和机场的名字、Intake 代码和提示词里出现的汉字
 */
export function hantToHans() {
  // 台湾、香港和 OpenCC 标准繁体的写法都收（“線 / 綫”“裡 / 裏”“著 / 着”）：各地用户打字不一样
  const toTraditional = ["tw", "hk", "t"].map((to) => OpenCC.Converter({ from: "cn", to }));
  const toSimplified = ["tw", "hk", "t"].map((from) => OpenCC.Converter({ from, to: "cn" }));
  const { parks: parkList, airports: airportList } = catalog();
  const texts = [
    ...parkList.flatMap((park) => [park.nameZh, ...park.aliases]),
    ...airportList.flatMap((airport) => [airport.nameZh, airport.city]),
    // 回答问题用的资料：繁体提问也要认得出景点、住处的名字
    ...knowledge().flatMap((doc) => [...doc.names, doc.text]),
  ];
  for (const dir of ["../copilot/nps_copilot/", "../copilot/nps_copilot/prompts/", "../copilot/nps_copilot/data/"]) {
    const url = new URL(dir, import.meta.url);
    for (const name of readdirSync(url).filter((file) => /\.(py|txt|json)$/.test(file)).sort()) {
      texts.push(readFileSync(new URL(name, url), "utf8"));
    }
  }
  const chars = [...new Set(texts.join("").match(/[一-鿿]/g) ?? [])].sort();
  const map = {};
  for (const char of chars) {
    // 简体字 → 各地繁体写法；各地名表里本来就是繁体的字 → 简体
    for (const convert of toTraditional) {
      const traditional = convert(char);
      if (traditional !== char && [...traditional].length === 1 && !(traditional in map)) map[traditional] = char;
    }
    // 本身就是简体字的不再转（OpenCC 把“么”当成“幺”的繁体，“什么”会变成“什幺”）
    if (toTraditional.some((convert) => convert(char) !== char)) continue;
    for (const convert of toSimplified) {
      const simplified = convert(char);
      if (simplified !== char && [...simplified].length === 1 && !(char in map)) map[char] = simplified;
    }
  }
  return Object.fromEntries(Object.entries(map).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  write("trip-request.v1.schema.json", tripRequestSchema);
  write("trip-result.v1.schema.json", tripResultSchema);
  const { parks: parkList, airports: airportList, attractions: attractionList } = catalog();
  write("parks.json", parkList);
  write("airports.json", airportList);
  write("attractions.json", attractionList);
  const docs = knowledge();
  writeFileSync(new URL("knowledge.jsonl", OUT), docs.map((doc) => JSON.stringify(doc)).join("\n") + "\n");
  const map = hantToHans();
  write("hant-to-hans.json", map);
  console.log(`写好了：2 个 schema、${parkList.length} 座公园、${airportList.length} 个机场、${docs.length} 条资料、${Object.keys(map).length} 个繁简对照字`);
}
