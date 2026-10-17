// plan_trip 工具的命令行入口：读一个 TripRequest（JSON 文件，或者 - 表示从标准输入读），把 TripResult 打到标准输出。
// 不联网，同样的输入和 REFERENCE_DATE 每次结果一样。Copilot 的 Python 服务、评测脚本都可以直接调它。
// 用法：npm run copilot:plan -- copilot/contracts/examples/yose-4d-fat.json
//       REFERENCE_DATE=2026-10-16 npm run copilot:plan -- request.json
// 请求不合格时退出码是 2，标准输出是 {"error": "invalid_request", "issues": [...]}
import { readFileSync } from "node:fs";
import { planTrip, TripRequestError } from "../src/lib/copilot/plan-tool.ts";

const file = process.argv[2];
if (!file) {
  console.error("用法：npm run copilot:plan -- <request.json | ->");
  process.exit(1);
}
const request = JSON.parse(readFileSync(file === "-" ? 0 : file, "utf8"));
const referenceDate = process.env.REFERENCE_DATE ?? new Date().toISOString().slice(0, 10);
try {
  process.stdout.write(`${JSON.stringify(planTrip(request, { referenceDate }), null, 2)}\n`);
} catch (error) {
  if (!(error instanceof TripRequestError)) throw error;
  process.stdout.write(`${JSON.stringify({ error: "invalid_request", issues: error.issues }, null, 2)}\n`);
  process.exitCode = 2;
}
