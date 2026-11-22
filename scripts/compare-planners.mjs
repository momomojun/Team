// 排行程三组对照的命令行（copilot/eval/planners.py 调它；不联网、不调模型）：
//   node … scripts/compare-planners.mjs cases 30   出题：30 条请求、给模型的那句话、B 组的景点资料（JSON）
//   node … scripts/compare-planners.mjs engine 30  C 组：引擎排、打分、每条用了多久（JSON）
//   node … scripts/compare-planners.mjs score      从标准输入读 [{id, request, days: [[名字…]…]}]，按同样的规则打分（JSON）
import { compareCases, engineRuns, scoreTrip } from "./compare-planners-lib.mjs";

const [command, n = "30"] = process.argv.slice(2);
const out = (value) => process.stdout.write(JSON.stringify(value));

if (command === "cases") out(compareCases(Number(n)));
else if (command === "engine") out(engineRuns(compareCases(Number(n))));
else if (command === "score") {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  out(JSON.parse(input).map(({ id, request, days }) => ({ id, score: scoreTrip(request, days, { names: true }) })));
} else {
  console.error("用法：compare-planners.mjs cases|engine [条数] | score < trips.json");
  process.exit(1);
}
