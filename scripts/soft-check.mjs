// 软要求评测的判分（scripts/soft-check-lib.mjs）：从标准输入读 [{id, result, checks}]，打出 [{id, checks: [{kind, ok, detail}]}]
import { checkSoft } from "./soft-check-lib.mjs";

let input = "";
for await (const chunk of process.stdin) input += chunk;
process.stdout.write(JSON.stringify(JSON.parse(input).map(({ id, result, checks }) => ({ id, checks: checkSoft(result, checks) }))));
