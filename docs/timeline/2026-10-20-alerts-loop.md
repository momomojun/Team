# 10-20：每晚读公告的闭环——抽查、提议、发布（分支 `feature/alerts-loop`）

- 为什么做：每晚已经能抓公告、让模型提取关闭、开 issue，但模型的结果只放在 issue 和附件里，网站还是只认手写的 `closures.ts`，模型变差了也没人知道。仓库主人问“开 issue 有什么用”，听完说照建议做，选了“模型提议、人来批”，不直接取代 `closures.ts`。
- 抽查：每晚读完再让同一串模型读 26 条标好答案的公告，分数掉到门槛（类型 80%、景点 F1 0.5）以下开 `alerts-quality` issue。每晚多约 26 次调用（OpenRouter 免费额度，用完换到 GPT-4.1 mini，约一美分），仓库变量 `ALERTS_CANARY=0` 可以关。
- 提议：标题里写着景点、`closures.ts` 还没有的关闭写进分支 `bot/closures-<日期>`，issue 里给开 PR 的链接。GitHub 不让工作流自己开 PR，机器人开的 PR 也不跑 CI，所以由人点链接开。用 10-19 的旧提取试了一下，提议了 1 条（Schoodic 山路的公告被规则对到了 Schoodic 角，其实不是同一处），正好说明要人看。
- 发布：当晚的关闭清单推到 `data/alerts-live` 分支，网站行程页按它排两周内出发的行程（起止日期碰不到的照排，模型和规则都认的不排）。
- 细节见 [COPILOT.md](../COPILOT.md)。
