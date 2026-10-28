// 行程质量评测（scripts/plan-quality-lib.mjs 里写了比什么、怎么比）。
// 用法：npm run eval:quality              终端里看汇总
//       npm run eval:quality -- --md out.md --json out.json   另外写报告和逐条结果
import { writeFileSync } from "node:fs";
import { evaluatePlanQuality } from "./plan-quality-lib.mjs";

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};

const { summary, results, lines } = evaluatePlanQuality();
const md = arg("--md");
const json = arg("--json");
if (md) writeFileSync(md, lines.join("\n"));
if (json) writeFileSync(json, `${JSON.stringify({ summary, results }, null, 2)}\n`);
console.log(lines.join("\n"));
console.log(`SUMMARY=${JSON.stringify(summary)}`);
