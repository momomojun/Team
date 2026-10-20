// 对照 Recreation.gov 的国家公园营地搜索和 src/data/campgrounds.ts。
// 名单变了就写 report.md，并在 stdout 打 NEW=条数。没变就 NEW=0，不该每周开 issue。
import { readFileSync, writeFileSync } from "node:fs";

const SEARCH = "https://www.recreation.gov/api/search";
const IGNORE = new Set(
  JSON.parse(readFileSync(new URL("./campground-watch-ignore.json", import.meta.url), "utf8")).facilityIds,
);

function norm(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parkKey(parent) {
  return norm(parent).replace(/national and state parks?/, "").replace(/national parks?/, "").trim();
}

function readFileCamps() {
  const text = readFileSync(new URL("../src/data/campgrounds.ts", import.meta.url), "utf8");
  const camps = [];
  for (const block of text.split(/\n  \{\n/)) {
    const id = block.match(/id: "([^"]+)"/)?.[1];
    const bookUrl = block.match(/bookUrl: "([^"]+)"/)?.[1];
    if (!id || !bookUrl) continue;
    camps.push({ id, facilityId: bookUrl.split("/").pop() });
  }
  return camps;
}

function readParks() {
  const text = readFileSync(new URL("../src/data/parks.ts", import.meta.url), "utf8");
  const keys = new Set();
  for (const name of text.matchAll(/nameEn: "([^"]+)"/g)) keys.add(norm(name[1]));
  return keys;
}

async function searchPage(start) {
  const url = `${SEARCH}?fq=entity_type:campground&fq=org_id:128&size=100&start=${start}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": "nps-guide", Accept: "application/json" } });
    if (response.status === 429 || response.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
      continue;
    }
    if (!response.ok) throw new Error(`Recreation.gov ${response.status}`);
    return response.json();
  }
  throw new Error("Recreation.gov 连续失败");
}

function keep(hit, parks) {
  const name = hit.name ?? "";
  const parent = hit.parent_name ?? "";
  if (!/national park|national and state parks/i.test(parent)) return false;
  if (/backcountry|cabin|wilderness|permit|dump station|clubhouse|group|horse|picnic|equestrian|\bstock\b|corral|shelter/i.test(name)) return false;
  if (hit.latitude == null || hit.longitude == null) return false;
  const key = parkKey(parent);
  for (const nameEn of parks) {
    if (key === nameEn || key.startsWith(`${nameEn} `) || nameEn.startsWith(`${key} `)) return true;
  }
  return false;
}

const fileCamps = readFileCamps();
const parks = readParks();
const seen = new Map();
for (let start = 0; ; start += 100) {
  const page = await searchPage(start);
  const hits = page.results ?? [];
  for (const hit of hits) {
    if (!keep(hit, parks)) continue;
    seen.set(String(hit.entity_id ?? hit.id), hit.name ?? "");
  }
  if (hits.length < 100) break;
}

const fileIds = new Set(fileCamps.map((camp) => camp.facilityId));
const missing = fileCamps.filter((camp) => !seen.has(camp.facilityId));
const extra = [...seen.entries()].filter(([id]) => !fileIds.has(id) && !IGNORE.has(id));
const count = missing.length + extra.length;
const lines = [
  `# Recreation.gov 营地名单 / Campground list`,
  ``,
  `对照日期 ${new Date().toISOString().slice(0, 10)}。文件里 ${fileCamps.length} 个，搜索里对得上的 ${seen.size} 个。`,
  ``,
];
if (missing.length) {
  lines.push(`## 文件里有、搜索里没有`, ``);
  for (const camp of missing) lines.push(`- ${camp.id}（${camp.facilityId}）`);
  lines.push(``);
}
if (extra.length) {
  lines.push(`## 搜索里有、文件里没有`, ``);
  for (const [id, name] of extra) lines.push(`- ${name}（${id}）`);
  lines.push(``);
}
if (!count) lines.push(`没有新的差异。`, ``);
writeFileSync("report.md", `${lines.join("\n")}\n`);
console.log(`NEW=${count}`);
if (count) console.log(lines.join("\n"));
