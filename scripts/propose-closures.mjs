// 每晚读完 NPS 公告以后，按模型提取的关闭清单提议改 src/data/closures.ts（10-20 仓库主人定的“模型提议、人来批”）：
//   node --import ./tests/register.mjs scripts/propose-closures.mjs <closures-latest.json> [--known <以前 issue 的正文.txt>] [--check <check:closures 的 JSON>] [--out proposal.md]
// 只提议标题里写着景点的关闭（strict：规则也找到的，和行程页按公告不排的规则一样；模型也读了的话表里写“模型 + 规则”）、还没过重开日期、数据里还没有的；
// 季节性山路上的（下雪封了 Trail Ridge Road）、以前的 issue 里报过的公告不提议。直接改 closures.ts 和英文表，
// 工作流把改动推到 bot/closures-<日期> 分支，issue 里给一个开 PR 的链接：仓库主人看过、改好说明再合并。
// 打印 CHANGES=<条数>。
import { readFileSync, writeFileSync } from "node:fs";
import { tempClosures } from "../src/data/closures.ts";
import { seasonalRoads } from "../src/data/roads.ts";
import { attractions } from "./load-data.mjs";

const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const extracted = JSON.parse(readFileSync(args[0], "utf8"));
const known = option("--known") ? readFileSync(option("--known"), "utf8") : "";
const check = option("--check") ? JSON.parse(readFileSync(option("--check"), "utf8")) : null;
const out = option("--out") ?? "proposal.md";
// 本机的日期（工作流里设了 TZ=America/Los_Angeles）
const today = new Date().toLocaleDateString("en-CA");

const names = new Map(attractions.map((a) => [a.id, a.nameZh]));
const covered = new Set(
  tempClosures.filter((closure) => !closure.reopen || closure.reopen > today).flatMap((closure) => closure.attractions),
);
const onRoads = new Set(seasonalRoads.flatMap((road) => [...road.attractions, ...(road.afterRoad ?? [])]));

const proposals = [];
for (const closure of extracted.closures ?? []) {
  if (known.includes(`<!-- alert:${closure.alert} -->`)) continue;
  if (closure.reopen && closure.reopen <= today) continue;
  if (/\bseasonal\b/i.test(closure.title ?? "")) continue;
  const ids = (closure.strict ?? []).filter((id) => names.has(id) && !covered.has(id) && !onRoads.has(id));
  if (ids.length === 0) continue;
  ids.forEach((id) => covered.add(id));
  proposals.push({ ...closure, ids });
}

const reasonZh = (closure) => `NPS 公告：${closure.title}（每晚读公告自动提议，机器读取；合并前改成中文说明、写上替代办法）`;
const reasonEn = (closure) => `NPS alert: ${closure.title} (proposed automatically from the nightly alert read; check the original alert before you go)`;

if (proposals.length > 0) {
  // closures.ts：加在数组最后（最后一行是 “];”）
  const path = new URL("../src/data/closures.ts", import.meta.url);
  const source = readFileSync(path, "utf8");
  const end = source.lastIndexOf("];");
  const entries = proposals
    .map((closure) =>
      [
        "  {",
        `    // ${today} 每晚读公告自动提议（公告 ${closure.alert}）：核对公告原文，把 reasonZh 改成中文说明再合并`,
        `    attractions: ${JSON.stringify(closure.ids)},`,
        `    from: ${JSON.stringify(closure.from ?? today)},`,
        `    reopen: ${JSON.stringify(closure.reopen ?? null)},`,
        `    reasonZh: ${JSON.stringify(reasonZh(closure))},`,
        `    source: ${JSON.stringify(closure.url ?? `https://www.nps.gov/${closure.park}/planyourvisit/conditions.htm`)},`,
        `    checked: ${JSON.stringify(today)},`,
        "  },",
      ].join("\n"),
    )
    .join("\n");
  writeFileSync(path, `${source.slice(0, end)}${entries}\n${source.slice(end)}`);

  // 英文表（conditions 组）：新的中文说明要有英文，不然英文版的测试过不了
  const enPath = new URL("../src/i18n/en/content/conditions.ts", import.meta.url);
  const enSource = readFileSync(enPath, "utf8");
  const open = enSource.indexOf("{");
  const close = enSource.lastIndexOf("}");
  const table = JSON.parse(enSource.slice(open, close + 1));
  for (const closure of proposals) table[reasonZh(closure)] = reasonEn(closure);
  writeFileSync(enPath, `${enSource.slice(0, open)}${JSON.stringify(table, null, 2)}${enSource.slice(close + 1)}`);
}

const lines = [`## 提议改 \`src/data/closures.ts\`（${today}）`, ""];
if (proposals.length === 0) {
  lines.push("模型读出来的关闭里没有要新加的（都已经在数据里、是季节性山路，或者以前报过）。");
} else {
  lines.push(
    `公告标题里写着景点（规则认）、数据里还没有的关闭 ${proposals.length} 条，已经写进分支里的 \`closures.ts\`（说明先用公告标题，合并前改成中文、写上替代办法）：`,
    "",
    "| 公园 | 公告 | 景点 | 起 | 重开 | 谁读出来的 |",
    "|---|---|---|---|---|---|",
    ...proposals.map(
      (c) =>
        `| ${c.park} | ${c.url ? `[${c.title.replace(/\|/g, "/")}](${c.url})` : c.title} | ${c.ids.map((id) => names.get(id) ?? id).join("、")} | ${c.from ?? "—"} | ${c.reopen ?? "没写"} | ${(c.found_by ?? []).map((who) => (who === "model" ? "模型" : "规则")).join(" + ") || "—"} |`,
    ),
  );
}
if (check) {
  const show = (ids) => ids.map((id) => names.get(id) ?? id).join("、");
  if (check.stale?.length) {
    lines.push("", "数据里还关着、公告里找不到的（可能已经重开，打开来源看一眼，开了就从 closures.ts 删掉）：", "");
    for (const item of check.stale) lines.push(`- ${show(item.attractions)}（${item.from} 起，${item.checked} 核对）：${item.source}`);
  }
  if (check.reopened?.length) {
    lines.push("", "预计重开的日子已经过了的（可以从 closures.ts 删掉）：", "");
    for (const item of check.reopened) lines.push(`- ${show(item.attractions)}（${item.reopen} 重开）`);
  }
}
writeFileSync(out, `${lines.join("\n")}\n`);
console.log(`CHANGES=${proposals.length}`);
