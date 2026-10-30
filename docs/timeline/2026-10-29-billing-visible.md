# 10-29：后台的计费看得到之前测过的数据（分支 `fix/billing-visible`）

- 为什么做：仓库主人在后台的“计费（所有模型）”里看到“还没有调用”，问之前测过的数据去哪了。10-28 跑的 DeepSeek、Nemotron、本机评测一共 411 次调用都记了，但评测是在 git worktree（`.claude/worktrees/referee`）里跑的，账记在 worktree 的 `copilot/runs/usage`；后台、`stats` 读的是主目录那一份，所以看不到。线上（Vercel）没有 Copilot 服务，本机那一份本来就读不到。
- 改了什么：
  - `copilot/nps_copilot/ledger.py`：在 worktree 里跑时，账默认记到主目录的 `copilot/runs/usage`（主目录不在就还记在自己这里；设了 `COPILOT_LEDGER`、`COPILOT_RUNS` 照旧），加了测试。已经记在 worktree 里的 411 行拷到了主目录（`copilot/runs/usage` 不进仓库）。
  - 后台计费没数据时说清楚为什么：Copilot 服务没开就写“读不到本机的总账，开着 Copilot 服务再看”，不再笼统地说“还没有调用”。
  - 架构图里“CI 回放 7 组评测”改成 8 组（10-28 加了 held-out v2）。
- 10-28 以前的调用（10-20 的 Gemini 单句评测等）那时还没有总账，没有记录。
