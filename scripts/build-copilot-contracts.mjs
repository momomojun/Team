// Copilot 的契约文件：把 src/lib/copilot/contract.ts 里的 JSON Schema 和公园、机场目录写到 copilot/contracts/，
// 给 Python 服务（Intake 认公园名、机场）和评测用。tests/copilot-plan.test.ts 检查这些文件和代码一致，
// 改了契约、公园或机场以后跑一次：npm run copilot:contracts
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import * as OpenCC from "opencc-js";
import { airports } from "../src/data/airports.ts";
import { parks } from "../src/data/parks.ts";
import { localize } from "../src/i18n/convert.ts";
import { tripRequestSchema, tripResultSchema } from "../src/lib/copilot/contract.ts";

const OUT = new URL("../copilot/contracts/", import.meta.url);
mkdirSync(OUT, { recursive: true });
const write = (name, value) => writeFileSync(new URL(name, OUT), `${JSON.stringify(value, null, 2)}\n`);

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
      timeZone: park.timeZone,
      airports: park.airports,
      nearby: (park.nearby ?? []).filter((code) => parks.some((other) => other.code === code)),
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
  return { parks: parkList, airports: airportList };
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
  const { parks: parkList, airports: airportList } = catalog();
  write("parks.json", parkList);
  write("airports.json", airportList);
  const map = hantToHans();
  write("hant-to-hans.json", map);
  console.log(`写好了：2 个 schema、${parkList.length} 座公园、${airportList.length} 个机场、${Object.keys(map).length} 个繁简对照字`);
}
