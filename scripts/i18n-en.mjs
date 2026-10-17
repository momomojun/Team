// 英文版内容：从数据文件里找出要显示的中文，按组写进 src/i18n/en/content/<组>.ts（中文原文 → 英文）。
// 已经写好的英文保留；中文新加的条目补成空字符串等着写；中文改了或删了、已经用不上的条目列出来（加 PRUNE=1 才删）。
// 用法：npm run i18n:en（ONLY=attractions-zion,parks 只处理这几组）。写法见 docs/ENGLISH.md
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const OUT = new URL("src/i18n/en/content/", ROOT);
const HAN = /[㐀-鿿]/;

const parkCodes = readdirSync(new URL("src/data/suitability/", ROOT))
  .filter((name) => name.endsWith(".ts") && name !== "index.ts")
  .map((name) => name.replace(/\.ts$/, ""))
  .sort();

/**
 * 每组：从哪些数据文件里找、第几批写（tests/i18n-en.test.ts 按批检查有没有写完）、哪些字段不用写
 * （博主视频标题是原文，不翻；图集作者、Google 条目名这类不显示中文的文件不收）
 */
export const GROUPS = [
  ...parkCodes.map((code) => ({
    id: `attractions-${code}`,
    batch: 1,
    files: [`src/data/attractions/${code}.ts`, `src/data/suitability/${code}.ts`],
  })),
  { id: "parks", batch: 1, files: ["src/data/parks.ts"] },
  {
    id: "conditions",
    batch: 1,
    files: ["src/data/closures.ts", "src/data/roads.ts", "src/data/roads.generated.ts", "src/data/shuttles.ts", "src/data/tours.ts", "src/data/parking.ts"],
  },
  {
    id: "places",
    batch: 1,
    files: ["src/data/airports.ts", "src/data/fees-manual.ts", "src/data/fees.generated.ts", "src/data/map.generated.ts", "src/data/services.generated.ts"],
  },
  { id: "lodging", batch: 2, files: ["src/data/lodging.ts"] },
  { id: "activities", batch: 2, files: ["src/data/activities.ts"] },
  { id: "bookings", batch: 2, files: ["src/data/bookings.ts"] },
  { id: "creators", batch: 3, files: ["src/data/creators.ts"], skipKeys: ["title"] },
  { id: "celebrities", batch: 3, files: ["src/data/celebrities.ts"] },
  // 英文版片名直接用 titleEn
  { id: "films", batch: 3, files: ["src/data/films.ts"], skipKeys: ["titleZh"] },
  { id: "rankings", batch: 3, files: ["src/data/honors.ts", "src/data/national-parks.ts"] },
];

/** 一个数据文件里所有带汉字的字符串；同一个对象里有 nameZh 和 nameEn 的，nameZh 的英文先填成 nameEn */
async function stringsOf(file, skipKeys = []) {
  const mod = await import(new URL(file, ROOT).href);
  const found = new Map();
  const seen = new Set();
  const walk = (value, key) => {
    if (typeof value === "string") {
      if (HAN.test(value) && !skipKeys.includes(key) && !found.has(value)) found.set(value, "");
      return;
    }
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (typeof value.nameZh === "string" && typeof value.nameEn === "string" && HAN.test(value.nameZh)) {
      found.set(value.nameZh, found.get(value.nameZh) || value.nameEn);
    }
    if (value instanceof Map) for (const [k, v] of value) walk(v, String(k));
    else for (const [k, v] of Object.entries(value)) walk(v, k);
  };
  for (const value of Object.values(mod)) if (typeof value !== "function") walk(value);
  return found;
}

/** 读已经写好的组文件：中文原文 → 英文 */
function readGroup(id) {
  const file = new URL(`${id}.ts`, OUT);
  if (!existsSync(file)) return new Map();
  const text = readFileSync(file, "utf8");
  const body = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return new Map(Object.entries(JSON.parse(body)));
}

function writeGroup(id, entries) {
  const lines = [...entries].map(([zh, en]) => `  ${JSON.stringify(zh)}: ${JSON.stringify(en)},`);
  // JSON 不许最后一个逗号；文件既是 TypeScript，也要能被这个脚本当 JSON 读回来
  if (lines.length > 0) lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, "");
  writeFileSync(
    new URL(`${id}.ts`, OUT),
    `// ${id} 的英文：中文原文 → 英文，空字符串是还没写的。由 scripts/i18n-en.mjs 生成条目，英文手写（写法见 docs/ENGLISH.md）\n` +
      `export const content: Record<string, string> = {\n${lines.join("\n")}\n};\n`,
  );
}

const only = process.env.ONLY?.split(",");
const owner = new Map();
let missing = 0;
for (const group of GROUPS) {
  const source = new Map();
  for (const file of group.files) {
    for (const [zh, prefill] of await stringsOf(file, group.skipKeys)) {
      // 同一句中文在几组里都有的，只在第一组写
      if (owner.has(zh) && owner.get(zh) !== group.id) continue;
      owner.set(zh, group.id);
      if (!source.has(zh) || (!source.get(zh) && prefill)) source.set(zh, prefill);
    }
  }
  if (only && !only.includes(group.id)) continue;
  const existing = readGroup(group.id);
  const entries = new Map();
  for (const [zh, prefill] of source) entries.set(zh, existing.get(zh) || prefill);
  const stale = [...existing.keys()].filter((zh) => !source.has(zh));
  if (stale.length > 0 && process.env.PRUNE !== "1") for (const zh of stale) entries.set(zh, existing.get(zh));
  writeGroup(group.id, entries);
  const empty = [...entries.values()].filter((en) => en === "").length;
  missing += empty;
  console.log(`${group.id}: ${entries.size} 条，还没写 ${empty} 条${stale.length ? `，用不上的 ${stale.length} 条${process.env.PRUNE === "1" ? "（已删）" : ""}` : ""}`);
}

const ids = GROUPS.map((group) => group.id).filter((id) => existsSync(new URL(`${id}.ts`, OUT)));
const name = (id) => id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
writeFileSync(
  new URL("index.ts", OUT),
  `import "server-only";\n` +
    ids.map((id) => `import { content as ${name(id)} } from "./${id}";`).join("\n") +
    `\n\n// 数据里中文原文 → 英文。每个文件一组（一座公园的景点和同行适合度、公园介绍、封路……），由 scripts/i18n-en.mjs 生成待写的条目\n` +
    `const groups: Record<string, string>[] = [${ids.map(name).join(", ")}];\n\n` +
    `export const englishContent = new Map<string, string>(groups.flatMap((group) => Object.entries(group).filter(([, en]) => en !== "")));\n`,
);
console.log(`共还没写 ${missing} 条`);
