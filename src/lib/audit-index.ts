/**
 * 按官方资料逐条核对的记录（docs/archive/audit/<日期>/<文件>.md）→ 每座公园、每个景点最后一次核对是哪天。
 * 文件名是公园代码的（zion.md）算这座公园核对过；正文里出现的景点 id 算这个景点核对过（改了的、核对过没问题的都写 id）。
 * scripts/build-audit-index.mjs 用它生成 src/data/audit-index.generated.ts，tests/freshness.test.ts 检查生成的是不是最新的。
 * 这个文件不引用别的模块（脚本直接用 Node 读）
 */
export interface AuditFile {
  /** 目录名，YYYY-MM-DD */
  date: string;
  /** 文件名，不带 .md */
  name: string;
  text: string;
}

export interface AuditIndex {
  parks: Record<string, string>;
  attractions: Record<string, string>;
}

const later = (a: string | undefined, b: string) => (a && a > b ? a : b);

/**
 * 不是按官方资料核对我们数据的记录：和 AllTrails 的对照、明星同款的调研、收集 NPS 官方推荐行程和拿它们评测引擎的报告，出现了景点 id 也不算核对过
 */
export const NOT_AUDIT = /^(hikes-vs-alltrails|celebrities-|nps-itineraries|real-routes-eval)/;

export function auditIndex(files: AuditFile[], parkCodes: string[], attractionIds: string[]): AuditIndex {
  const parks: Record<string, string> = {};
  const attractions: Record<string, string> = {};
  const codes = new Set(parkCodes);
  const ids = new Set(attractionIds);
  // 景点 id 都是“公园代码-小写字母、数字、连字符”
  const ID = /\b([a-z]{4})-[a-z0-9]+(?:-[a-z0-9]+)*\b/g;
  for (const file of files) {
    if (NOT_AUDIT.test(file.name)) continue;
    if (codes.has(file.name)) parks[file.name] = later(parks[file.name], file.date);
    for (const match of file.text.matchAll(ID)) {
      const id = match[0];
      if (!ids.has(id)) continue;
      attractions[id] = later(attractions[id], file.date);
      parks[match[1]] = later(parks[match[1]], file.date);
    }
  }
  const sorted = (record: Record<string, string>) => Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
  return { parks: sorted(parks), attractions: sorted(attractions) };
}
