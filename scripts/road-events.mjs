// NPS 道路事件（WZDx）的命令行，说明见 scripts/road-events-lib.mjs：
//   npm run roads:events                     抓一次，写 copilot/data/alerts/road-events-latest.json（和公告关闭清单同样的格式，多 events、unmapped）
//   node … scripts/road-events.mjs history <road-events-latest.json> <road-history.json>
//                                            每晚接着记：每条季节性山路这一季哪天开始封、哪天发现又通了（.github/workflows/alerts-nightly.yml 调）
//   npm run roads:sync                       把 data/alerts-live 分支上记的 road-history.json 换成往年日期，写 scripts/data/road-observed.json，
//                                            再跑 npm run data:roads 就并进季节性山路的往年数据（官方表里已有的年份不覆盖）
// .env.local 里有 DATA_GOV_API_KEY 就用，没有用 DEMO_KEY（一次请求）。key 只放在请求里，不写进文件。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { USER_AGENT } from "./load-data.mjs";
import { historyToYears, summarizeFeed, toClosures, updateHistory } from "./road-events-lib.mjs";

const ENV_FILE = new URL("../.env.local", import.meta.url);
if (existsSync(ENV_FILE)) process.loadEnvFile(fileURLToPath(ENV_FILE));
const HISTORY_URL =
  process.env.ROAD_HISTORY_URL ?? "https://raw.githubusercontent.com/momomojun/Team/data/alerts-live/road-history.json";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
const write = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 1)}\n`);
};

const [command = "fetch", ...args] = process.argv.slice(2);

if (command === "fetch") {
  const out = fileURLToPath(new URL(`../${args[0] ?? "copilot/data/alerts/road-events-latest.json"}`, import.meta.url));
  const key = process.env.DATA_GOV_API_KEY || "DEMO_KEY";
  let feed = null;
  for (const wait of [0, 5000, 20000]) {
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    const res = await fetch(`https://developer.nps.gov/api/v1/roadevents?limit=1000&api_key=${key}`, { headers: { "User-Agent": USER_AGENT } }).catch(() => null);
    if (res?.ok) {
      feed = await res.json();
      break;
    }
    console.error(`道路事件接口：${res ? res.status : "连不上"}`);
  }
  if (!feed) process.exit(1);
  const fetched = today();
  const events = summarizeFeed(feed);
  const unmapped = events.filter((event) => event.unmapped.length > 0).map((event) => ({ park: event.park, roads: event.unmapped, from: event.from, description: event.description }));
  write(out, { ...toClosures(events, fetched), source: "https://developer.nps.gov/api/v1/roadevents", events, unmapped });
  console.log(`${fetched}：${events.length} 件（${feed.features?.length ?? 0} 段），对到景点的 ${events.filter((e) => e.attractions.length).length} 件，路名没对上的 ${unmapped.length} 件 → ${out}`);
} else if (command === "history") {
  const [latestPath, historyPath] = args;
  const latest = JSON.parse(readFileSync(latestPath, "utf8"));
  const history = existsSync(historyPath) ? JSON.parse(readFileSync(historyPath, "utf8")) : {};
  write(historyPath, updateHistory(history, latest.events ?? [], latest.fetched ?? today()));
  console.log(`记下了 ${latest.fetched}：${Object.keys(updateHistory(history, latest.events ?? [], latest.fetched ?? today())).length} 条路`);
} else if (command === "sync") {
  const res = await fetch(HISTORY_URL, { headers: { "User-Agent": USER_AGENT } }).catch(() => null);
  if (!res?.ok) {
    console.error(`读不到 ${HISTORY_URL}（${res?.status ?? "连不上"}）：每晚的 workflow 还没记过，或者断网`);
    process.exit(1);
  }
  const years = historyToYears(await res.json());
  write(fileURLToPath(new URL("./data/road-observed.json", import.meta.url)), years);
  console.log(`往年日期（按每晚记下的）：${Object.entries(years).map(([road, list]) => `${road} ${list.length} 年`).join("，") || "还没有"}`);
} else {
  console.error("用法：road-events.mjs fetch [输出] | history <latest> <history> | sync");
  process.exit(1);
}
