// 核对记录的索引：每座公园、每个景点最后一次按官方资料核对是哪天（src/lib/audit-index.ts）。
// docs/archive/audit/ 里新加了核对记录以后重新跑：npm run data:audit-index（tests/freshness.test.ts 会提醒忘了跑）
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { auditIndex } from "../src/lib/audit-index.ts";
import { attractions, parks } from "./load-data.mjs";

const AUDIT = new URL("../docs/archive/audit/", import.meta.url);
const OUTPUT = new URL("../src/data/audit-index.generated.ts", import.meta.url);

function readAuditFiles() {
  return readdirSync(AUDIT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name))
    .flatMap((dir) =>
      readdirSync(new URL(`${dir.name}/`, AUDIT))
        .filter((file) => file.endsWith(".md"))
        .map((file) => ({
          date: dir.name,
          name: file.slice(0, -3),
          text: readFileSync(new URL(`${dir.name}/${file}`, AUDIT), "utf8"),
        })),
    );
}

const index = auditIndex(
  readAuditFiles(),
  parks.map((p) => p.code),
  attractions.map((a) => a.id),
);
writeFileSync(
  OUTPUT,
  `// 由 scripts/build-audit-index.mjs 按 docs/archive/audit/ 生成，请勿手改：每座公园、每个景点最后一次按官方资料逐条核对的日期
import type { AuditIndex } from "../lib/audit-index";

export const auditDates: AuditIndex = ${JSON.stringify(index, null, 2)};
`,
);
console.log(`核对记录：${Object.keys(index.parks).length} 座公园、${Object.keys(index.attractions).length} 个景点有核对日期`);
