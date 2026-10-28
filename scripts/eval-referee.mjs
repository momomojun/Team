// VROOM 当裁判（scripts/referee-lib.mjs 里写了比什么、怎么比）。
// 要先装：python -m pip install pyvroom（约 2 MB，numpy、pandas 已经有的话不用另外下）
// 用法：npm run eval:referee              终端里看汇总
//       npm run eval:referee -- --md out.md --json out.json   另外写报告和逐条结果
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProblems, compare } from "./referee-lib.mjs";

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};

const problems = buildProblems();
const dir = mkdtempSync(join(tmpdir(), "vroom-"));
const input = join(dir, "problems.json");
const output = join(dir, "solutions.json");
// meta（每天的上下文、请求）是我们自己回来比的时候用的，不交给 VROOM
writeFileSync(input, JSON.stringify(problems, (key, value) => (key === "meta" ? undefined : value)));
const python = process.env.PYTHON ?? "python";
const run = spawnSync(python, [fileURLToPath(new URL("./vroom-referee.py", import.meta.url)), input, output], {
  stdio: ["ignore", "inherit", "inherit"],
});
if (run.status !== 0) {
  rmSync(dir, { recursive: true, force: true });
  console.error(`VROOM 没跑起来（${python} 退出码 ${run.status}）。先装：python -m pip install pyvroom`);
  process.exit(1);
}
const solutions = JSON.parse(readFileSync(output, "utf8"));
rmSync(dir, { recursive: true, force: true });

const { summary, results, lines } = compare(problems, solutions);
const md = arg("--md");
const json = arg("--json");
if (md) writeFileSync(md, lines.join("\n"));
if (json) writeFileSync(json, `${JSON.stringify({ summary, results }, null, 2)}\n`);
console.log(lines.join("\n"));
console.log(`SUMMARY=${JSON.stringify(summary)}`);
