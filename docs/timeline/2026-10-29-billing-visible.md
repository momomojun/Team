# 10-29：后台的计费看得到之前测过的数据（分支 `fix/billing-visible`）

- 为什么做：仓库主人在后台的“计费（所有模型）”里看到“还没有调用”，问之前测过的数据去哪了。10-28 跑的 DeepSeek、Nemotron、本机评测一共 411 次调用都记了，但评测是在 git worktree（`.claude/worktrees/referee`）里跑的，账记在 worktree 的 `copilot/runs/usage`；后台、`stats` 读的是主目录那一份，所以看不到。线上（Vercel）没有 Copilot 服务，本机那一份本来就读不到。
- 改了什么：
  - `copilot/nps_copilot/ledger.py`：在 worktree 里跑时，账默认记到主目录的 `copilot/runs/usage`（主目录不在就还记在自己这里；设了 `COPILOT_LEDGER`、`COPILOT_RUNS` 照旧），加了测试。已经记在 worktree 里的 411 行拷到了主目录（`copilot/runs/usage` 不进仓库）。
  - 后台计费没数据时说清楚为什么：Copilot 服务没开就写“读不到本机的总账，开着 Copilot 服务再看”，不再笼统地说“还没有调用”。
  - 架构图里“CI 回放 7 组评测”改成 8 组（10-28 加了 held-out v2）。
- 10-28 以前的调用（10-20 的 Gemini 单句评测等）那时还没有总账，没有记录。
- 同一天仓库主人又说“花费不要写零，按你的预估去算”，并给了 DeepSeek 后台的截图（268 次、251,497 token、¥0.13）：
  - token 和我们的总账一模一样（输入 239,312 + 输出 12,185），钱差了 4 倍多：原来按高峰价、不算缓存命中，折成 $0.081。改成按 DeepSeek 官网的人民币价（`DEEPSEEK_CNY`，空闲时段每百万 token 命中 ¥0.02、未命中 ¥1、输出 ¥4，北京时间工作日 9–12、14–18 点贵一倍），按每次调用的时间判断时段：这批是北京时间周四 12:23 打的，算出 ¥0.1325（$0.019），对上了。
  - 花费都改成估算（`monitor.estimate_cost`）：免费档按它付费档的标价，本机按电费（250 瓦 × 调用时间，每度 $0.17），没有付费版的 OpenRouter 免费模型按 Nemotron 付费版的价；后台计费另列“实际付出去的钱”，免费的写“免费”，不写 $0。10-28 那 411 次估下来：DeepSeek $0.019、本机 $0.019、Nemotron $0.009、dots $0.004。
