// Copilot 的契约文件：把 src/lib/copilot/contract.ts 里的 JSON Schema 和公园、机场目录写到 copilot/contracts/，
// 给 Python 服务（Intake 认公园名、机场）和评测用。tests/copilot-plan.test.ts 检查这些文件和代码一致，
// 改了契约、公园或机场以后跑一次：npm run copilot:contracts
import { writeFileSync, mkdirSync } from "node:fs";
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

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  write("trip-request.v1.schema.json", tripRequestSchema);
  write("trip-result.v1.schema.json", tripResultSchema);
  const { parks: parkList, airports: airportList } = catalog();
  write("parks.json", parkList);
  write("airports.json", airportList);
  console.log(`写好了：2 个 schema、${parkList.length} 座公园、${airportList.length} 个机场`);
}
