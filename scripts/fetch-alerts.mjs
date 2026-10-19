// 把 NPS 所有公园现在的公告存成一份快照（JSON），给 Copilot 提取临时关闭、评测、每晚对比新公告用。
//   npm run alerts:fetch                      写到 copilot/data/alerts/latest.json
//   OUT=copilot/eval/alerts/snapshot.json npm run alerts:fetch
// .env.local 里填了 DATA_GOV_API_KEY 就用，没填用 DEMO_KEY（一次 6 个请求，DEMO_KEY 也够）。key 只用在请求里，不写进文件。
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { npsCodeOf } from "../src/data/parks.ts";
import { parks, sleep, USER_AGENT } from "./load-data.mjs";

const ENV_FILE = new URL("../.env.local", import.meta.url);
if (existsSync(ENV_FILE)) process.loadEnvFile(fileURLToPath(ENV_FILE));
const API_KEY = process.env.DATA_GOV_API_KEY || "DEMO_KEY";
const OUT = new URL(`../${process.env.OUT || "copilot/data/alerts/latest.json"}`, import.meta.url);

// 网站的公园代码 → 查 NPS 公告的代码（加拿大的公园、大多数园外名胜查不到）
const codes = new Map(parks.flatMap((park) => (npsCodeOf(park) ? [[park.code, npsCodeOf(park)]] : [])));
const alerts = [];
const failed = [];
const batch = [...codes.entries()];
for (let i = 0; i < batch.length; i += 10) {
  const part = batch.slice(i, i + 10);
  const url = `https://developer.nps.gov/api/v1/alerts?parkCode=${part.map(([, nps]) => nps).join(",")}&limit=500&api_key=${API_KEY}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } }).catch(() => null);
  if (!res?.ok) {
    failed.push(...part.map(([code]) => code));
    continue;
  }
  const data = await res.json();
  for (const alert of data.data ?? []) {
    for (const [code, nps] of part) {
      if (nps === alert.parkCode) {
        alerts.push({
          id: alert.id,
          park: code,
          category: alert.category,
          title: alert.title.trim(),
          description: (alert.description ?? "").trim(),
          url: alert.url,
          updated: alert.lastIndexedDate,
        });
      }
    }
  }
  await sleep(500);
}
alerts.sort((a, b) => a.park.localeCompare(b.park) || a.id.localeCompare(b.id));
mkdirSync(dirname(fileURLToPath(OUT)), { recursive: true });
const fetched = new Date().toLocaleDateString("en-CA");
writeFileSync(OUT, `${JSON.stringify({ fetched, failed, alerts }, null, 1)}\n`);
console.log(`${fetched}：${alerts.length} 条公告${failed.length ? `，没查到：${failed.join(", ")}` : ""}`);
