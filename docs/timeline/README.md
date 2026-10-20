# 时间线 / Timeline

每次改动（一个 PR）写一个文件，记仓库主人提了什么、定了什么、做了什么。**不要往别人的文件里加，也不要再往 `PROJECT.md` 末尾加**：两个 PR 同时往一个地方写，合并时一定冲突。

**English summary.** One file per change (per PR), named `YYYY-MM-DD-short-slug.md` with the California date, so two open PRs never edit the same lines. Entries before Oct 20 are in `2026-10-11-to-10-19.md`.

## 怎么写

- 文件名：`YYYY-MM-DD-几个英文词.md`，日期按加州时间（比如 `2026-10-20-gemini-single-sentence.md`）；同一天同一件事分几个 PR 的，可以写进同一个文件。
- 内容照着下面这样，几行就够，细节放链接（成绩在 [RESULTS.md](../../copilot/eval/RESULTS.md)，技术细节在 DEVELOPMENT.md、COPILOT.md）：

```markdown
# 10-20：一句话说做了什么（分支 `feature/xxx`，PR #nn）

- 为什么做：仓库主人说了什么、发现了什么问题。
- 做了什么、结果怎么样；没做完的、要仓库主人决定的。
```

- 同时还要改的照旧：对应的技术文档、[PROJECT.md](../PROJECT.md) 的“现状”（有变化才改）、[GOALS.md](../GOALS.md) 里那一条的状态。
