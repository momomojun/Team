// 拿我们的徒步数据（距离、爬升、难度、建议停留）和对上的 AllTrails 步道比，相差大的列出来，人工看是我们写错了、
// 还是对上的不是同一条路线（比如我们写的是到某个观景点就回头，AllTrails 那条是一路走到山顶）。只读、不改数据。
// 用法：npm run check:hikes            → 打印摘要
//       npm run check:hikes -- --md    → 再写一份 Markdown 报告到 docs/archive/audit/<今天>/hikes-vs-alltrails.md
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { attractions } from "./load-data.mjs";

const raw = JSON.parse(readFileSync(new URL("./data/alltrails-parks.json", import.meta.url), "utf8"));
const bySlug = new Map(raw.map((trail) => [trail.slug, trail]));
const { alltrailsPlaces } = await import("../src/data/attractions/alltrails.generated.ts");

/** AllTrails 上这条要走多久的粗估：平地每小时 2 英里，每爬 1000 英尺多 1 小时（Naismith 规则的常见写法） */
export const walkMinutes = (miles, gainFt) => Math.round((miles / 2) * 60 + (gainFt / 1000) * 60);
const DIFFICULTY = { easy: 0, moderate: 1, hard: 2 };

const rows = [];
/** 对上的多半不是同一条路线：距离差 3.5 倍以上，或者爬升差 4 倍以上（而且差 1000 英尺以上）。行程引擎挑步道时不拿它的 AllTrails 热度 */
const doubtful = [];
let compared = 0;
for (const a of attractions) {
  if (!a.hike) continue;
  const place = alltrailsPlaces[a.id];
  const trail = place && bySlug.get(place.slug);
  if (!trail) continue;
  compared++;
  const problems = [];
  const ours = a.hike.distanceMi;
  const lengthRatio = ours && trail.lengthMi ? ours / trail.lengthMi : 1;
  const gainRatio = a.hike.gainFt && trail.gainFt ? Math.max(a.hike.gainFt, trail.gainFt) / Math.max(1, Math.min(a.hike.gainFt, trail.gainFt)) : 1;
  if (lengthRatio > 3.5 || lengthRatio < 1 / 3.5 || (gainRatio > 4 && Math.abs((a.hike.gainFt ?? 0) - trail.gainFt) > 1000)) doubtful.push(a.id);
  if (ours && trail.lengthMi) {
    const ratio = ours / trail.lengthMi;
    if (ratio > 1.5 || ratio < 0.67) problems.push(`距离：我们 ${ours} 英里，AllTrails ${trail.lengthMi} 英里`);
  }
  const gain = a.hike.gainFt;
  if (gain !== undefined && trail.gainFt) {
    if (Math.abs(gain - trail.gainFt) > 500 && (gain / trail.gainFt > 2 || gain / trail.gainFt < 0.5)) {
      problems.push(`爬升：我们 ${gain} 英尺，AllTrails ${trail.gainFt} 英尺`);
    }
  }
  if (Math.abs(DIFFICULTY[a.hike.difficulty] - DIFFICULTY[trail.difficulty]) === 2) {
    problems.push(`难度：我们 ${a.hike.difficulty}，AllTrails ${trail.difficulty}`);
  }
  // 建议停留含拍照、休息，比纯走路长一些正常；短于纯走路的一半、或者长了三倍以上才算可疑
  const estimate = walkMinutes(trail.lengthMi, trail.gainFt);
  if (estimate >= 30 && (a.durationMin < estimate * 0.5 || a.durationMin > estimate * 3)) {
    problems.push(`停留：我们 ${a.durationMin} 分钟，按 AllTrails 的长度和爬升走路约 ${estimate} 分钟`);
  }
  if (problems.length) rows.push({ id: a.id, park: a.park, nameZh: a.nameZh, nameEn: a.nameEn, trail: trail.name, slug: trail.slug, problems, doubtful: doubtful.includes(a.id) });
}

writeFileSync(
  new URL("../src/data/attractions/alltrails-doubtful.generated.ts", import.meta.url),
  [
    "// 由 scripts/check-hikes.mjs 生成，请勿手改：对上的 AllTrails 步道多半不是同一条路线（距离或爬升差好几倍）的徒步景点。",
    "// 行程引擎挑步道时不拿这些的 AllTrails 热度（generate-trip.ts 的 trailRanks）。重跑：npm run check:hikes",
    `export const alltrailsDoubtful: string[] = ${JSON.stringify(doubtful.sort(), null, 2)};`,
    "",
  ].join("\n"),
);

console.log(`徒步 ${attractions.filter((a) => a.hike).length} 条，对上 AllTrails 的 ${compared} 条，相差大的 ${rows.length} 条，其中多半对错了路线的 ${doubtful.length} 条`);
for (const row of rows) console.log(`- ${row.doubtful ? "【多半对错】" : ""}${row.id}（${row.nameZh} ↔ ${row.trail}）：${row.problems.join("；")}`);

if (process.argv.includes("--md")) {
  const day = new Date().toISOString().slice(0, 10);
  const dir = new URL(`../docs/archive/audit/${day}/`, import.meta.url);
  mkdirSync(dir, { recursive: true });
  const lines = [
    `# 徒步数据和 AllTrails 对照（${day}）`,
    "",
    `由 \`npm run check:hikes -- --md\` 生成。我们的徒步 ${attractions.filter((a) => a.hike).length} 条，对上 AllTrails 的 ${compared} 条，下面 ${rows.length} 条相差大，要人工看：可能是我们写错了，也可能对上的不是同一条路线。标了“多半对错”的 ${doubtful.length} 条距离或爬升差好几倍，行程引擎不拿它们的 AllTrails 热度。`,
    "",
    "| 景点 | AllTrails 步道 | 相差 |",
    "|---|---|---|",
    ...rows.map((row) => `| ${row.doubtful ? "**多半对错** " : ""}\`${row.id}\` ${row.nameZh} | [${row.trail}](https://www.alltrails.com/trail/${row.slug}) | ${row.problems.join("<br>")} |`),
    "",
  ];
  writeFileSync(new URL("hikes-vs-alltrails.md", dir), lines.join("\n"));
  console.log(`写好了 docs/archive/audit/${day}/hikes-vs-alltrails.md`);
}
