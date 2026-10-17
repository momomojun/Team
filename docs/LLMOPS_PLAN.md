# LLMOps 现状评估和下一步计划 / LLMOps Review and Roadmap

更新：2026-10-16。写给接手的组员和 AI 助手：先读这一份，再看 [LLMOPS_WORK_LOG.md](LLMOPS_WORK_LOG.md)（另一个助手的实验记录）和 [experiments/](../experiments/README.md)。

## English summary

- **What exists**: a careful local-model experiment track (Ollama, Qwen3 4B and Qwen3.5 4B on an RTX 2070 8 GB). It covers the Intake step only: turning a Chinese trip request into structured conditions. The model extracts verbatim spans; deterministic code validates them, asks follow-up questions, and owns the dialogue state. Results: V2 single-turn pipeline 28/32 (Qwen3 4B) vs. 27/32 (Qwen3.5 4B); V3 multi-turn 17/18 vs. 18/18. Each run comes with frozen manifests, hashes, held-out cases, and every failure kept.
- **What's good**: honest claims, clean separation between what the LLM does and what code does, reproducible runs, and no cloud dependency.
- **What's missing for the course**: there is no CI/CD at all (no GitHub Actions). The Copilot is not connected to the trip engine or the website. There is no tool calling and no Retriever, Critic, or Writer. The test sets are small and written by the same author, the Python intake schema doesn't match the site's `WizardInput`, and three known state-machine bugs are still open.
- **Next**: (1) freeze a shared `TripRequest` contract that matches `WizardInput`, and expose the TypeScript engine as a `plan_trip` tool; (2) build a minimal FastAPI Copilot: Intake → `plan_trip` → deterministic Critic → evidence-grounded Writer, with an Ollama provider and a replay provider; (3) add GitHub Actions: lint/types/tests, Python unit tests, and an offline replay eval gate on every PR, plus a Docker image; (4) grow the golden set to about 150 bilingual cases, version prompts, and log runs (MLflow or JSONL); (5) add a chat panel on the plan page; (6) run ablations (single agent vs. multi-role, with and without Critic) for the final report.

## 1. 另一个助手做了什么

都在 `experiments/local-model-validation/`，网站代码没有动。模型权重、Ollama 便携包在本机，`.gitignore` 排除了，脚本、样本、原始结果都提交了。

| 版本 | 做了什么 | 结果 |
|---|---|---|
| V1 | Qwen3 4B（Q4_K_M，temperature 0，JSON Schema 约束）一次性把中文需求提成结构化条件，16 条样本 | 5/16 完全对。格式都对，但会补出没说的天数、日期、公园 |
| V2 | 模型只摘原文片段（公园、日期、天数、出发地、节奏、老人），代码校验、补全、判断要不要追问；另写 16 条新样本，跑之前冻结 | 原 16 条 15/16，新 16 条 13/16；中位延迟约 1.3 秒 |
| V3 | 多轮对话：没说年份时问“是不是 2026 年”、日期已过就问是不是明年；节奏用“轻松玩 / 适中 / 多看一些”这类说法；步行、早起、换酒店分开记 | 18 组对话 17/18；另外用 3 个探索性检查复现出 3 个代码状态机的 bug，还没修 |
| 模型对照 | 同样的 prompt、代码、样本，Qwen3 4B 对 Qwen3.5 4B | V2 合计 28/32 对 27/32，V3 17/18 对 18/18，各有进退，没有全面胜出的 |

**做得好的地方**

- 实验很规范：每轮冻结 prompt、代码、样本的 hash，失败样本全部保留，不在同一批样本上反复调 prompt 来刷分，结论写得很克制（“不是盲测”“不代表模型通用能力”）。
- 职责划分是对的：模型只做它擅长的（理解自然语言、摘出条件），日期计算、缺失检查、追问都交给代码。这和我们定的原则一致：LLM 负责理解和解释，不代替行程引擎。
- 全部本地运行，固定了模型 digest 和参数，换一台机器能复测。

**要改的地方**

1. **还只是 Intake 一步**。计划书里的五个角色（Intake、Retriever、Planner、Critic、Writer）只做了第一个，模型的输出没有进入行程引擎，网站上也看不到。
2. **没有 CI/CD**。老师明确要求“简化的 CI/CD：自动测试、版本管理、部署”，这是目前最大的缺口。Python 的单元测试只在本机手动跑。
3. **和网站的数据结构没对齐**。Intake 的字段（parks、dates、duration、origin、seniors、preferences）和网站自动生成攻略的输入 `WizardInput`（`src/components/plan/trip-wizard.tsx`：parks、month、startDate、days、origin、destination、pace、lodgingPref、party）不一样；`party` 里还有最小孩子年龄、婴儿车、轮椅。不对齐，以后接起来要再改一遍。
4. **只支持 3 座公园**（`v2/intake.py` 的 `PARKS`：黄石、大提顿、优胜美地），网站有 59 座。公园别名应该从 `src/data/parks.ts` 生成，不要手写。
5. **样本太少、是同一个作者写的**：单轮 32 条、多轮 18 组。计划书写的是约 150 条中英文 golden set，还要有改口、否定、错别字、英文、混合语言、提示注入这些情况。
6. **已知 bug 没修**（V3 记录的）：
   - 拒绝候选日期后再回答“是的”，会确认被拒绝的那个；
   - 先说“2027 年 12 月”再补“12 月 19 日”，年份会丢；
   - “我选第二种”认不出是选项 2；
   - 严格逐字的证据检查把“6天”和“6 天”当成不一样（应该先统一空白再比）；
   - 模型出错时，追问里会露出 `preferences` 这类内部字段名。
7. **文档太长、太细**。`LLMOPS_WORK_LOG.md` 适合审计，不适合新人上手；本文件就是给新人的入口。

## 2. 下一步：按课程要求分阶段做

原则不变：**LLM 负责理解需求和解释结果，事实和行程由现有的确定性引擎和数据决定**。每一阶段做完都要有能自动跑的测试。

### 阶段 1：契约和工具（2026-10-17 已完成第一版）

**已经做好的**（用法见 [copilot/README.md](../copilot/README.md)）：

- `TripRequest` / `TripResult` v1 契约：JSON Schema 写在 `src/lib/copilot/contract.ts`，`npm run copilot:contracts` 生成到 `copilot/contracts/`，Python 那边直接用；字段和网站 `WizardInput` 一一对应，每个字段可以带来源（用户原话、用户确认、默认、推断）和原文片段。
- `plan_trip` 工具：`src/lib/copilot/plan-tool.ts`，调网站同一个 `generateTrip` 和时间线，按时区换算；命令行 `npm run copilot:plan`，HTTP `POST /api/copilot/plan`。不联网、结果可复现（固定 `referenceDate`）。
- 公园和机场目录 `copilot/contracts/parks.json`（59 座，简繁英名字和别名）、`airports.json`（86 个），Intake 不再手写 3 座公园的别名表。
- 测试 `tests/copilot-plan.test.ts`：契约文件和代码一致、各种不合格请求指出字段、同样输入结果一样、输出符合 TripResult schema、跨时区的一天给当地时间、坐轮椅时去不了的不排。

**还没做的**（挪到阶段 2 跟 Critic 一起做）：单独的查询工具（某天某景点关没关、季节性山路把握、要提前订的、同行适合度、时区提醒）。现在这些信息都已经在 `TripResult` 的 `warnings`、`skipped` 里，Critic 先用这些。

原来的计划：

- **`TripRequest` 契约**：JSON Schema，字段和 `WizardInput` 一一对应，加上每个字段的来源（用户原话、用户确认、默认值）和证据片段。放在 `copilot/contracts/`，TypeScript 和 Python 都从它生成类型（或者至少有测试检查两边一致）。
- **`plan_trip` 工具**：把 `generateTrip` 包成一个不依赖浏览器的入口。`tests/generate-trip.test.ts` 已经演示了怎么在 Node 里构造输入和上下文，照着写一个 `scripts/plan-cli.mjs`（读 `TripRequest` JSON，输出行程、每天的时间线、警告、跳过的景点和原因），再包一个 Next 接口 `POST /api/copilot/plan`。车程表在仓库里，不联网也能跑。
- **其他工具**（都是现有的数据和函数，只是包成接口）：查临时关闭 `closureOn`、季节性山路把握 `openChance`、要提前订的 `bookingsForTrip`、同行适合度 `fitFor`、时区提醒 `time-notes`。
- 公园别名表从 `parks.ts` 生成，覆盖全部 59 座。

### 阶段 2：最小可用的 Copilot（2026-10-17 已完成第一版）

**已经做好的**（用法见 [copilot/README.md](../copilot/README.md)，评测见 [copilot/eval/RESULTS.md](../copilot/eval/RESULTS.md)）：

- `copilot/nps_copilot/`：Intake（V3 的做法，修好了上面列的 5 个问题，输出 `TripRequest`、认全部 59 座公园和 86 个机场、支持中英文）→ plan_trip（调 Node 命令行或网站接口）→ Critic（代码检查，默认节奏太满时改成轻松再排一次，最多一次）→ Writer（模板；可选模型改写 + 忠实度检查，对不上退回模板）。
- Provider：本机 Ollama（默认 Qwen3.5 4B）、回放、录音、测试脚本、云端（默认关）。每轮写 JSONL 日志。
- pytest 27 个；评测 25 组对话：Qwen3.5 4B 第一次 14/25 → 修完代码 23/25 → 加上天数规则 25/25（其中 2 组靠规则补天数，单独记）；Qwen3 4B 同一版代码 20/25、编造 6 个片段。这 25 组现在是开发集。

原来的计划：

- `copilot/` 目录，Python 3.12 + FastAPI：
  - **Intake**：沿用 V3 的思路（模型摘原文、代码管状态），先修好上面列出的几个 bug，再接新契约；
  - **Planner**：调 `plan_trip`，不让模型自己排行程；
  - **Critic**：先用代码检查硬约束（关闭、许可证抽签、季节性山路、班次、同行适合度、太满、回住处太晚），有问题就带着原因回到 Planner 改一次（限定轮数）；
  - **Writer**：模型只根据工具返回的结构化结果写说明，每句事实带来源（景点 id、关闭条目、NPS 链接），代码检查有没有编造工具结果里没有的日期、价格。
- **Provider 接口**：`OllamaProvider`（默认，本机）、`ReplayProvider`（读录好的模型输出，CI 用）、`CloudProvider`（留接口，默认关，不自动退到云端）。
- 每次调用记日志：prompt 版本、模型 digest、参数、输入、输出、延迟、校验结果（JSONL，后面再接 MLflow）。

### 阶段 3：CI/CD（GitHub Actions 已加，Docker 和回滚还没做）

**已经做好的**：`.github/workflows/ci.yml`，每个 PR 跑网站的 lint、类型检查、测试和 Copilot 的 pytest、回放评测门禁（`copilot/eval/baseline.json`，现在是 25/25），报告作为 artifact 上传。**还没做的**：Docker 镜像、按 tag 发版、回滚演示、提示词版本切换。

原来的计划：

- **`.github/workflows/ci.yml`**，每个 PR 都跑：`npm run lint`、`npx tsc --noEmit`、`npm test`、Python 的 `pytest`（intake、对话状态机、契约一致性）、**离线回放评测**（用 `ReplayProvider` 和录好的模型输出跑 golden set，分数低于主分支就不让合并）。CI 上没有 GPU，不跑真模型。
- **真模型评测**：本机脚本 `copilot/eval/run.py`，或者以后接 self-hosted runner；结果和 prompt、模型版本一起存档，作为“更新模型、改 prompt”的依据。
- **版本管理**：`copilot/prompts/<名字>/v<n>.txt`，文件 hash 写进每条日志；评测报告写明用的是哪个版本。
- **部署**：Copilot 打成 Docker 镜像（GitHub Actions 构建、推到 GHCR，按 git tag 打版本）；网站照旧走 Vercel。回滚演示：把 Copilot 镜像切回上一个 tag，或者 prompt 切回上一版，评测分数恢复。

### 阶段 4：评测集和对照实验（10-17 开始）

**已经做的**：
- 第一批 held-out（40 组复杂情况，冻结后才跑）：第一次 27/40，13 组失败里 11 组是代码问题；修完 37/40，现在当回归门禁用。
- 行程质量检查 `copilot/eval/plan_quality.py`：40 组里排出来的行程没有硬问题。
- Writer 成批评测：29/29 没有编造。

详见 [copilot/eval/RESULTS.md](../copilot/eval/RESULTS.md)。

**还没做**：
- 再写一批没看过的（holdout-v2）；
- 扩到约 150 条；
- 对照实验（单模型直接回答 vs 流水线、有没有 Critic）。

原来的计划：

- golden set 扩到约 150 条：中文、英文、混合；日期（只说月份、没说年份、日期已过、日期和天数冲突）；多公园；带小孩、老人、轮椅；改口、否定、错别字；提示注入；要求去关闭的景点、抽签景点。
- 分开报告：模型提取对不对、代码校验和追问对不对、整个流程对不对、行程有没有违反硬约束、Writer 有没有编造、延迟、显存。
- 对照实验（期末报告要用）：单个模型直接回答 vs. 多角色流水线；有 Critic vs. 没有 Critic；Qwen3 4B vs. Qwen3.5 4B（如果资源允许再加 8B）。
- 固定快照回归（数据不变时分数不能掉）和新事实适应（关闭数据更新后，答案要跟着变）分开测。

### 阶段 5：接进网站（第 4 周以后）

- 行程页加一个对话面板：用户用自然语言说需求 → Copilot 追问、确认 → 生成行程（就是现在“自动生成攻略”的结果）→ 用户可以继续说“第二天轻松一点”“换成住 Jackson”。
- 显示每条说明的来源，模型没有把握时明说。
- 部署后的网站调用本机或自己服务器上的 Copilot；没有 Copilot 时页面照旧能用。

## 3. 模型要不要换？（10-16 的结论）

**现在不换，先把系统搭起来，用新的评测集再定。**

- 目前的分数主要卡在系统上，不是模型：Qwen3 4B 和 Qwen3.5 4B 在同一套任务上互有胜负（28/32 对 27/32、17/18 对 18/18），换模型解决不了“没接行程引擎、没有 CI、状态机有 bug”这些问题。
- 现在的样本只测了“提取条件”这一件事，太少、太单一，用它选模型不可靠。模型差别真正大的地方还没测：调用工具（选对工具、参数填对）、Writer 根据工具结果写说明会不会编造、英文和中英混合的输入。
- 默认先用 **Qwen3.5 4B**（官方支持工具调用、多语言，同样的显存）。Provider 做成可换的，换模型只改配置。2026-10-17 用户决定本机只留 Qwen3.5 4B（默认）和 Qwen3.5 9B（对照），删掉 Qwen3 4B（`qwen3:4b`）。以后对照用 9B；Qwen3 4B 的历史成绩和录音（`copilot/eval/recordings/qwen3_4b.jsonl`）保留，回放不需要模型。
- 等阶段 4 的评测集（约 150 条，含工具调用和 Writer 是否忠实）建好，再比较：Qwen3.5 4B、Qwen3 8B（约 5.2 GB，这台 8 GB 显卡要小上下文、单并发）、跨家族的 Gemma 4 E2B。可以分角色选：Intake 用小模型，Writer 写长段中文说明如果质量不够，再试 8B。
- 不做微调，除非评测显示某类错误换模型、改 prompt 都解决不了，而且有足够的标注数据。
- **10-17 实测了 Qwen3.5 9B**（下载约 6.6 GB，这台显卡能整个装下）：Intake 25/25 但更常漏公园名（4 组靠规则补）、慢 0.8 秒；Writer 和 4B 一样没有编造，景点名多保留一点，但慢将近一倍（15.4 s 对 8.7 s）。结论还是不换，默认 Qwen3.5 4B，9B 留着做对照。详见 [copilot/eval/RESULTS.md](../copilot/eval/RESULTS.md)。

## 4. 接手时注意

- 实验目录里的历史版本（V1、V2、V3、模型对照）是冻结的，不要改；新实验另建版本目录。
- 不要把模型权重、Ollama 便携包提交进 Git（`.gitignore` 已经排除）。
- 本机：RTX 2070 Max-Q 8 GB、内存约 16 GB，D 盘空间时常不够，下载新模型前先看空间。
- 网站这边的规则见 [PROJECT_LOG.md](PROJECT_LOG.md) 第 10 节：提交说明、PR 都要中英双语；英文按官方英文资料写；改中文原文要用 `scripts/rekey-zh.py`。
