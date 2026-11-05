// 每周 scrum 周报的草稿：把这一周的时间线（docs/timeline/）、合并的 PR（按谁提的）和还没完成的目标整理成一份 Markdown，
// 写到 docs/scrum/<日期>.md。草稿里“下周计划”“卡住的”要人自己填。
//
//   npm run scrum                      # 最近 7 天
//   npm run scrum -- 2026-11-05        # 从这天起的 7 天
//
// 合并的 PR 用 gh（GitHub CLI）查，没装或没登录就跳过那一节
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const day = (date) => date.toISOString().slice(0, 10);
const start = process.argv[2] ? new Date(`${process.argv[2]}T00:00:00`) : new Date(Date.now() - 6 * 86_400_000);
const end = new Date(start.getTime() + 6 * 86_400_000);
const [from, to] = [day(start), day(end)];

// 时间线：文件名以日期开头，第一行是标题，“为什么做”那一行说缘由
const timeline = readdirSync(join(ROOT, "docs/timeline"))
  .filter((name) => /^\d{4}-\d{2}-\d{2}/.test(name) && name.slice(0, 10) >= from && name.slice(0, 10) <= to)
  .sort()
  .map((name) => {
    const text = readFileSync(join(ROOT, "docs/timeline", name), "utf8");
    const title = (text.match(/^#\s+(.+)$/m)?.[1] ?? name).replace(/（分支[^）]*）/, "").trim();
    const why = text.match(/^-\s*为什么做：(.+)$/m)?.[1]?.trim();
    return `- **${title}**${why ? `：${why}` : ""}（[${name}](../timeline/${name})）`;
  });

let prs = null;
try {
  const json = execFileSync(
    "gh",
    ["pr", "list", "--state", "merged", "--search", `merged:${from}..${to}`, "--limit", "100", "--json", "number,title,author,mergedAt"],
    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  prs = JSON.parse(json);
} catch {
  // 没装 gh 或没登录
}

const byAuthor = new Map();
for (const pr of prs ?? []) {
  const who = pr.author?.login ?? "?";
  byAuthor.set(who, [...(byAuthor.get(who) ?? []), pr]);
}

// GOALS.md 最上面“还没完成的”里没打勾的
const goals = readFileSync(join(ROOT, "docs/GOALS.md"), "utf8");
const open = goals
  .slice(0, goals.indexOf("## 完整清单"))
  .split("\n")
  .filter((line) => line.startsWith("- [ ]"))
  .slice(0, 12)
  .map((line) => line.replace(/\s*（[^）]*）\s*$/, "").slice(0, 160));

const out = [
  `# Scrum ${from} – ${to}`,
  "",
  "自动整理的草稿（`npm run scrum`）：“做了什么”“谁做了什么”来自时间线和合并的 PR，“下周计划”“卡住的”要自己填。",
  "",
  "## 这周做了什么 / Done this week",
  "",
  ...(timeline.length ? timeline : ["- （这周没有时间线记录）"]),
  "",
  "## 谁做了什么 / Who did what",
  "",
  ...(prs === null
    ? ["- （没查到：要装 GitHub CLI 并登录 `gh auth login`）"]
    : prs.length
      ? [...byAuthor].map(([who, list]) => `- **${who}**：${list.map((pr) => `#${pr.number} ${pr.title.split(" / ")[0]}`).join("；")}`)
      : ["- （这周没有合并的 PR）"]),
  "",
  "## 下周计划 / Next week",
  "",
  "- [ ] ",
  "",
  "## 卡住的、要老师或组员帮忙的 / Blockers",
  "",
  "- ",
  "",
  "## 还没完成的目标（GOALS.md 最上面的前 12 条） / Open goals",
  "",
  ...open,
  "",
].join("\n");

const dir = join(ROOT, "docs/scrum");
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
const file = join(dir, `${from}.md`);
writeFileSync(file, out);
console.log(`写好了：docs/scrum/${from}.md（时间线 ${timeline.length} 条、合并的 PR ${prs?.length ?? "没查到"} 个）`);
