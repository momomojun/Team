// 数据保质期检查：手工整理的数据里，超过半年没核对的、写着去年时刻表的，列出来提醒重查（src/lib/freshness.ts）。
// 用法：npm run check:freshness                  在终端里列出来
//       npm run check:freshness -- --md out.md    另外写一份 Markdown（每月一次的 GitHub 定时任务用它开 issue）
//       npm run check:freshness -- --days 90      换成 90 天
//       npm run check:freshness -- --today 2027-03-01   假装今天是这天（看看几个月以后会过期多少）
// 过期的条数打在最后一行 STALE=<条数>；不会因为过期而失败（重查要人去官网看，CI 不该因为日子到了就红）
import { writeFileSync } from "node:fs";
import { datedFacts, STALE_DAYS, staleFacts, unauditedCounts } from "../src/lib/freshness.ts";

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const today = arg("--today") ?? new Date().toLocaleDateString("sv");
const days = Number(arg("--days") ?? STALE_DAYS);
const out = arg("--md");

const AREAS = {
  closure: { zh: "临时关闭", file: "src/data/closures.ts", field: "checked" },
  lodgingSeason: { zh: "住处营业季节", file: "src/data/lodging-seasons.ts", field: "checked / year" },
  shuttle: { zh: "班车", file: "src/data/shuttles.ts", field: "checked / scheduleYear" },
  tour: { zh: "游船、导览团班次", file: "src/data/tours.ts", field: "scheduleYear" },
  booking: { zh: "预约规则", file: "src/data/bookings.ts", field: "verified" },
  parking: { zh: "停车场几点停满", file: "src/data/parking.ts", field: "parkingChecked" },
  road: { zh: "季节性山路", file: "scripts/build-roads.mjs（npm run data:roads）", field: "roadsChecked" },
  audit: { zh: "逐园核对（docs/archive/audit）", file: "docs/archive/audit/<日期>/<公园>.md，再跑 npm run data:audit-index", field: "目录日期" },
  google: { zh: "Google 评分快照", file: "src/data/attractions/google.ts", field: "googleSnapshotDate" },
};

const facts = datedFacts();
const stale = staleFacts(facts, today, days);
const why = (f) => (f.reason === "pastYear" ? `写的是 ${f.year} 年的` : `${f.age} 天没核对（${f.date}）`);

const lines = [
  `# 数据保质期 ${today}`,
  "",
  `${facts.length} 条手工整理的数据里，${stale.length} 条超过 ${days} 天没核对、或者写的是去年的时刻表 / 营业季节。去官网核对以后改核对日期（改了内容的同时改中英文）。`,
  "",
];
for (const [area, meta] of Object.entries(AREAS)) {
  const rows = stale.filter((f) => f.area === area);
  if (rows.length === 0) continue;
  lines.push(`## ${meta.zh}（${rows.length} 条）`, "", `改 \`${meta.file}\` 的 ${meta.field}。`, "");
  lines.push("| 公园 | 哪一条 | 为什么 | 来源 |", "|---|---|---|---|");
  for (const f of rows.sort((a, b) => (a.park ?? "").localeCompare(b.park ?? "") || a.label.localeCompare(b.label))) {
    lines.push(`| ${f.park ?? "—"} | ${f.label.replace(/\|/g, "/")} | ${why(f)} | ${f.source ? `[链接](${f.source})` : "—"} |`);
  }
  lines.push("");
}
const unaudited = Object.entries(unauditedCounts()).sort(([, a], [, b]) => b - a);
const total = unaudited.reduce((sum, [, n]) => sum + n, 0);
lines.push(
  "## 还没有逐条核对记录的景点",
  "",
  `${total} 个（不算过期，只是还没按官方资料逐条核对过）：${unaudited.map(([park, n]) => `${park} ${n}`).join("、")}`,
  "",
);

const text = lines.join("\n");
if (out) writeFileSync(out, text);
console.log(text);
console.log(`STALE=${stale.length}`);
