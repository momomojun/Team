// Copilot 查询工具的命令行入口（src/lib/copilot/lookup-tool.ts）：读一个 LookupRequest（JSON 文件，或者 - 表示从标准输入读），
// 把结果打到标准输出。不联网，同样的输入每次结果一样。
// 用法：echo '{"tool":"is_open","attraction":"yose-tioga-road","date":"2027-01-15"}' | npm run --silent copilot:lookup -- -
import { readFileSync } from "node:fs";
import { lookup } from "../src/lib/copilot/lookup-tool.ts";

const file = process.argv[2] ?? "-";
const request = JSON.parse(readFileSync(file === "-" ? 0 : file, "utf8"));
const requests = Array.isArray(request) ? request : [request];
const results = requests.map((item) => lookup(item));
process.stdout.write(`${JSON.stringify(Array.isArray(request) ? results : results[0], null, 2)}\n`);
