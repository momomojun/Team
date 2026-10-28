import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { attractions } from "../src/data/attractions";
import { auditDates } from "../src/data/audit-index.generated";
import { parks } from "../src/data/parks";
import { auditIndex } from "../src/lib/audit-index";
import { datedFacts, staleFacts } from "../src/lib/freshness";
import { staleness } from "../src/lib/staleness";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

test("保质期：每条手工数据的核对日期格式对、不在将来", () => {
  const today = new Date().toLocaleDateString("sv");
  for (const fact of datedFacts()) {
    if (fact.date === undefined) continue;
    assert.match(fact.date, DATE, `${fact.area} ${fact.id} 的日期 ${fact.date} 格式不对`);
    assert.ok(fact.date <= today, `${fact.area} ${fact.id} 的核对日期 ${fact.date} 在将来`);
  }
});

test("保质期：超过半年没核对、写着去年的时刻表都算过期", () => {
  assert.equal(staleness({ date: "2026-10-01" }, "2027-03-01"), null);
  assert.equal(staleness({ date: "2026-10-01" }, "2027-05-01"), "old");
  assert.equal(staleness({ date: "2026-10-01", year: 2026 }, "2027-01-02"), "pastYear");
  // 一年以后，2026 年的时刻表都过期了
  const later = staleFacts(datedFacts(), "2027-10-01");
  assert.ok(later.some((f) => f.area === "tour" && f.reason === "pastYear"));
});

test("核对记录的索引是最新的（docs/archive/audit 新加了记录要跑 npm run data:audit-index）", () => {
  const root = new URL("../docs/archive/audit/", import.meta.url);
  const files = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && DATE.test(entry.name))
    .flatMap((dir) =>
      readdirSync(new URL(`${dir.name}/`, root))
        .filter((file) => file.endsWith(".md"))
        .map((file) => ({ date: dir.name, name: file.slice(0, -3), text: readFileSync(new URL(`${dir.name}/${file}`, root), "utf8") })),
    );
  const index = auditIndex(
    files,
    parks.map((p) => p.code),
    attractions.map((a) => a.id),
  );
  assert.deepEqual(auditDates, index);
});
