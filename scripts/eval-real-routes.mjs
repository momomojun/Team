// 拿真人走过的行程评测行程引擎（scripts/real-routes-lib.mjs 里写了比什么、怎么比）。
// 用法：npm run eval:routes              终端里看汇总
//       npm run eval:routes -- --md out.md --json out.json   另外写报告和逐条结果
import { writeFileSync } from "node:fs";
import { evaluateRealRoutes } from "./real-routes-lib.mjs";

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};

const { summary, results, lines } = evaluateRealRoutes();
const md = arg("--md");
const json = arg("--json");
if (md) writeFileSync(md, lines.join("\n"));
if (json) writeFileSync(json, `${JSON.stringify({ summary, results }, null, 2)}\n`);
console.log(lines.slice(0, 22).join("\n"));
console.log(`SUMMARY=${JSON.stringify({ routes: summary.routes, recall: Number(summary.recall.toFixed(3)), famousRecall: summary.famousRecall === null ? null : Number(summary.famousRecall.toFixed(3)) })}`);
