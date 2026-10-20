# 项目现状和记录 / Project Status and Log

做到哪了、下一步做什么、有哪些事等仓库主人决定、做过哪些决定和为什么，以及按时间的完整记录。**怎么做事**见 [GUIDE.md](GUIDE.md)。

**English summary.** This repository (`momomojun/Team`) is the CSYE 7374 (LLMOps, Fall 2026) team project of Jun Zhai, Tianyue Chen and Huiling Fu. It builds on **NPS Guide**, a Chinese-language U.S. national park trip planner that Jun Zhai built before the course (copied from `momomojun/NPS-guide` at commit `4590c45`, without history). The course work adds **NPS Guide Copilot**, an LLM layer that understands trip requests, answers questions from the site's own data and explains plans while the deterministic engine does the planning, plus the LLMOps pipeline around it. As of 2026-10-18: contracts and the `plan_trip` tool; the Python Copilot on a local Qwen3.5 4B with three replay eval gates in CI (dev 25/25, regression 37/40, regional wording 17/17); multi-turn conversation fixes and grounded Q&A (retrieval over 1,687 knowledge entries); Docker images, a tag-driven release workflow to GHCR (`copilot-v0.2.0`, `copilot-v0.2.1`), versioned prompts, rollback demos and run-log monitoring. Every requirement and promise, with what's still open, is tracked in [GOALS.md](GOALS.md). Next: let the model orchestrate tools, multi-turn evals, live NPS alerts, and a chat panel on the website.

## 现状（2026-10-19）

| 部分 | 状态 |
|---|---|
| 网站 NPS Guide | 能用：52 座美国国家公园、加拿大 3 座、4 处园外名胜，871 个景点；英文版、同行适合度、时区、住处营业季节，59 座全部按官方资料核对过。部署在 Vercel（https://team-peach-five.vercel.app ，不设访问密码） |
| 阶段 1：契约和工具 | 完成（PR #4）：`TripRequest` / `TripResult` v1、`plan_trip` 工具、59 座公园和 86 个机场的目录。单独的查询工具（某天开没开、车程、搜景点）没做，这些信息在 `TripResult` 的 `warnings`、`skipped` 里 |
| 阶段 2：Python Copilot | 完成（PR #5）：Intake → plan_trip → Critic → Writer，Provider 可换，JSONL 日志；默认本机 Qwen3.5 4B。10-18 两次试用后修了多轮对话（PR #12、#14）：相对日期、改了什么、不重印行程、排好以后和排出以前都能提问（在网站资料里查了再答，RAG）。10-18 加了**调度员**：模型看最近的对话、条件和行程，决定这句话要改条件、提问、加减景点、指定某晚住处还是重新开始（可以几件一起），代码去做、去核对；多轮对话评测 20/20，没见过的第一次 14/15（关掉调度员是 6/15）。Writer 还没有逐句附来源 |
| 阶段 3：CI/CD | 完成（PR #6）：5 项 PR 检查（3 项必需）、Docker 镜像、`release.yml` 发版流程、提示词版本和回滚、监控（命令行统计，没接 MLflow）、Ollama 一键启动。10-18 发了 [`copilot-v0.2.0`](https://github.com/momomojun/Team/releases/tag/copilot-v0.2.0) 和 [`copilot-v0.2.1`](https://github.com/momomojun/Team/releases/tag/copilot-v0.2.1)，镜像在 GHCR 公开可拉；提示词回滚、换镜像回滚都演示过 |
| 阶段 4：评测和对照实验 | 进行中：单句 25、复杂情况 40、各地写法 17 组，多轮对话 20 组和 15 组，五组都当回归门禁（25/25、37/40、17/17、20/20、15/15）；做了第一个对照（调度员开 / 关）；还缺更多没见过的样例（目标约 150 条）、其他对照实验 |
| 读 NPS 实时公告 | 进行中（PR #21 和这次）：模型读公告提取关闭（类型 76%、日期 16/24，规则是 58%、0），Copilot 排两周内出发的行程时不排公告说关了的景点；GitHub 每晚抓公告、新的关闭开 issue。模型提取还要在本机跑，网站行程页还是关键词规则 |
| 阶段 5：接进网站 | 进行中：行程页的对话框做了（10-19，本机开着 Copilot 服务时出现，排出的行程直接放进行程页，可以接着改）；路线动画、Copilot 的线上部署没做 |
| 仓库 | `main` 受保护（必须走 PR、3 项检查通过）；合并后自动删除分支；协作者 JadenChen10（Tianyue Chen）、huilingfu95-source（Huiling Fu） |
| 目标清单 | 所有要求和承诺做到哪、还差什么：[GOALS.md](GOALS.md) |

## 等仓库主人决定的事

- **每天核对封路的定时任务改查这个仓库**：现在还在查旧目录 `D:\WebWorkplace\NPS-guide` 的旧数据；改的是本机的定时任务设置，要仓库主人同意。
- **旧仓库 `momomojun/NPS-guide` 和 nps-guide.vercel.app**：停在 10-16，下线、改成跳转到新网址，还是保留。
- **组员分工**：Tianyue Chen、Huiling Fu 各负责什么（比如评测样例和对照实验、网站对话框、部署）。
- 演示时 Copilot 放在哪（见下一步第 3 条）。

## 下一步

所有要求和承诺的完成情况、还没完成的完整清单见 [GOALS.md](GOALS.md)；这里只写接下来按什么顺序做。

按 10-18 商量的顺序（课程时间：10 月 29 日那周交 proposal，11 月 5 日起每周 scrum，12 月 10 日项目演示）。仓库主人 10-18 试用后，先把对话修好，再做别的：

1. **把对话修好**（第一、二批和调度员改造都做完了，见时间线）：第一批（相对日期、出发和回程说清楚、改了什么、季节性关闭的说法）、第二批（**能回答问题**：排好以后的提问从网站自己的资料里查了再答，查不到说不知道，对应课上的 RAG）已经做完，两次试用发现的问题也修了；还没做好的：一句话里既改条件又提问时只答查得到的部分、“紧凑的话要几天”资料里没有（见 [RESULTS.md](../copilot/eval/RESULTS.md)）。第三批把真实的多轮对话写成评测（先写期望再跑），每个 PR 都过。
2. **读 NPS 实时公告、自动提取关闭信息**（10-19 提取、评测、接进 Copilot 排行程、每晚抓公告都做了；还差：攒几天新公告当没见过的数据、标答案、改 `alerts_v2`，模型提取每晚自动跑，网站行程页也用上）：每天抓 NPS 公告，本机模型判断哪个景点关了、从哪天到哪天，排行程时用上，取代手动维护的 `closures.ts`；已经人工核对过的 `closures.ts` 当标准答案算准确率。对应计划书标题里的 fast-changing data 和监控、漂移。
3. **网站行程页加对话面板**（10-19 对话框做了，演示先按“笔记本上同时开网站和 Copilot”做，没开 Copilot 时不显示；路线动画还没做）：用户用自然语言说需求 → Copilot 追问、确认 → 生成行程（就是现在“自动生成攻略”的结果）→ 用户可以继续说“第二天轻松一点”“换成住 Jackson”；没有 Copilot 时页面照旧能用。要先定 Copilot 放在哪：演示时在笔记本上同时开网站和 Copilot（不花钱），还是租带显卡的服务器。
   - **路线动画**（10-19 做了第一版：自动播、只播变了的天、暂停跳过、减少动画不自动播；导出短视频以后再说）：**第一次排出行程、改了行程的时候**自动播一段，之后看行程还是文字、卡片和静态地图（仓库主人 10-18 说的：动画是帮人第一眼看懂，不是拿来研究行程的）。第一次：镜头沿真实开车路线一天天走，每站亮起来标几点到、停多久，路上标开多久，日落那站天色变暗，晚上落在住处；全程十几二十秒。改了以后：只播变了的部分（换了的住处、加的减的挪了的景点、新的路线），几秒。播完停在静态地图上，可以重播、暂停、拖到某一站；系统设了“减少动画”的不自动播。用网站现有的 MapLibre 地图、每天的真实路线和行程的时间，不用新数据。导出成短视频分享以后再说。
4. **评测和对照实验**（11 月底到 12 月初，期末报告要用）：另写一批没看过的样例（holdout-v2），**先提交期望再跑**，逐步扩到约 150 条（中英文和混合；日期冲突；多公园；带小孩、老人、轮椅；改口、否定、错别字；提示注入；要求去关闭、要抽签的景点）；单个模型直接回答 vs 流水线、有 Critic vs 没有、Qwen3.5 4B vs 9B；准备演示脚本和报告。
5. **营地开放季节（交给 Huiling）**：PR #26 加的 149 个营地没有开放季节，冬天选“露营”会排进关门的营地；问题、复现和怎么修写在 [archive/agent-briefs/10-campground-seasons.md](archive/agent-briefs/10-campground-seasons.md)，她的 AI 助手照着做。
6. 网站这边的待办：[archive/audit/2026-10-16/_followups.md](archive/audit/2026-10-16/_followups.md)（北瀑布、奥林匹克、黄石、加州各园的施工延误和次要关闭；大峡谷南缘住宿暂停、红杉营地季节；锡安 2026 年 6 月起取消隧道通行证）；按日期的设施开放、充电桩打卡（[DEVELOPMENT.md](DEVELOPMENT.md#路线图)）。

## 课程和团队

- **课程**：CSYE 7374 Infrastructure & DevOps w/LLMs（LLMOps），老师 Raja Alomari。作业要求在 momomojun 电脑上的 `C:\Users\ZJ\Desktop\CSYE7374_LLMOPS\projecctproposal.pdf`：
  - 做一个端到端的 LLMOps 系统，从 5 个方向里选一个重点：微调、多智能体、API 系统、PromptOps、监控治理；
  - 必须有简化的 CI/CD（自动测试、版本管理、部署）；
  - 先交 1–2 页的 proposal。
- **计划书**：同一目录的 `Project_Proposal_NPS_Guide_Copilot.docx` 和 PDF。标题 *NPS Guide Copilot: An End-to-End LLMOps Pipeline for a Grounded Multi-Agent Assistant over Fast-Changing Data*；按老师模板 1–9 节写，第 3 节讲为什么是 LLMOps 问题（知识过时、悄悄变差、成本不透明；这个领域的错误可以用代码客观判定），第 4 节按生命周期列组件，第 8 节对应老师的 4 个学习目标。
- **团队**（3 人）：Jun Zhai（GitHub momomojun，仓库主人）、Tianyue Chen（JadenChen10，chen.t2@northeastern.edu）、Huiling Fu（huilingfu95-source）。计划书第 2 节的第 3 人还是占位，要写上 Huiling Fu 和分工。
- **仓库主人**：用中文交流，在美国，Next.js 开发者，去过 7 座国家公园；不熟悉 DevOps，解释部署、CI 这些要从头讲、多打比方。

## 做过的决定

### 暂时不修的
- 回归集（holdout-v1）的 3 组失败（H05 期望写的追问类型和现在的不一样、H20 注入里两个天数时模型漏了真正的那个、H38 回程地写在前面时模型没认出来）先放着：规则加多了难维护，等多轮对话的新评测和“能回答问题”做完再看（10-18 仓库主人定的）。门禁仍是“不能比 37/40 差”。

### LLM 的角色

- **LLM 负责听懂需求和解释结果，不替换现有算法**。NPS Guide 的数据和算法是知识库、工具和裁判（检查）。
- Intake 里模型只逐字摘片段，日期计算、缺失检查、追问、对话状态都交给代码；规则补的条件和模型的成绩分开算。
- Critic 只用代码检查，不改用户自己说的条件，最多改一次；Writer 默认用模板，模型改写要过忠实度检查。
- 契约只在 TypeScript 写一处，生成给 Python；改字段升版本号；工具不联网、固定 `referenceDate` 才能复现；和行程页不同的地方写进结果的 `assumptions`。
- 全部本地运行，不自动退到云端。

### 模型

- **默认 Qwen3.5 4B**（`qwen3.5:4b-q4_K_M`），以后一直用它；Qwen3.5 9B 留作对照；Qwen3 4B 删了（会编造片段）。2026-10-17 用户定的。
- 依据（同一版代码、同一套样例，详见 [RESULTS.md](../copilot/eval/RESULTS.md)）：Qwen3.5 4B 开发集 25/25、没有编造、每次约 2.4 秒；9B 也是 25/25，但更常漏公园名（4 组靠规则补）、Writer 慢将近一倍（15.4 s 对 8.7 s）；Qwen3 4B 20/25、编造 6 个片段。
- 早期实验里 Qwen3 4B 和 Qwen3.5 4B 互有胜负（V2 28/32 对 27/32，V3 17/18 对 18/18），当时的结论是“先把系统搭起来，用新的评测集再定”，后来的评测选了 Qwen3.5 4B。
- 等评测集扩到约 150 条（含工具调用和 Writer 忠实度）再比较更多模型（Qwen3 8B、Gemma 4 E2B），可以分角色选；不做微调，除非某类错误换模型、改提示词都解决不了，而且有足够的标注数据。
- 本机：RTX 2070 Max-Q 8 GB、内存约 16 GB，D 盘空间时常不够，下载新模型前先看空间。模型和 Ollama 便携包在 `experiments/local-model-validation/`（`.gitignore` 排除），便携 Ollama 用 11435 端口。

### 评测

- 新样例先写期望、提交，再第一次跑；看过失败再修代码的那一批就不再是没见过的数据，改当回归门禁，下一批另写。
- CI 上没有 GPU，回放录好的模型输出；改了提示词或样例要先在本机用真模型重新录。
- 提示词不改旧文件、出新版本；门禁不过的版本不当默认（intake v2 就是这样被挡下的）。

### 数据和文字

- **事实以英文官方资料为准**（NPS、Parks Canada、运营商官网）；中文是当初转述的，可能有误差，中英文一起改。
- **英文版**（`/en`）按英语母语的写法另写，不是逐句翻译；英制单位、12 小时制。
- **所有提交说明、PR 标题和描述写中英双语**（10-16 起）。
- 网站不设访问密码（10-18 仓库主人定的）。注意：Google 评分快照按 Google 条款不能公开展示，正式公开前要换成 Google Places API 或去掉数字（[DEVELOPMENT.md](DEVELOPMENT.md#注意事项)）。
- **同行适合度：官方允许、但对婴儿或老人风险高的，照排但醒目提醒“请务必慎重考虑”**（10-18 仓库主人定的）：梅萨维德崖居导览背着婴儿去、几条特别累的路线带老人去。不替用户决定，但一定要让用户看到。
- 地名用官方名称：北美最高峰叫**麦金利山 / Mount McKinley**（NPS 2025 年起的写法），公园仍叫德纳里国家公园 / Denali National Park（10-18 仓库主人定的）。
- 不爬小红书；不登录任何网站；不替用户填写密钥或密码；`DATA_GOV_API_KEY` 由用户自己在 Vercel 和 `.env.local` 里设置，不写进任何文件或聊天记录。
- Copilot 认各地中文写法（香港、台湾、新马），名字从维基数据和中文维基生成、可以重跑，不凭记忆手写。

## 早期本地模型实验的评估（10-16）

另一个助手在 `experiments/local-model-validation/` 做了本地模型的 Intake 实验，讨论记录在 [archive/LLMOPS_WORK_LOG.md](archive/LLMOPS_WORK_LOG.md)。

| 版本 | 做了什么 | 结果 |
|---|---|---|
| V1 | Qwen3 4B 一次性把中文需求提成结构化条件，16 条样本 | 5/16 完全对。格式都对，但会补出没说的天数、日期、公园 |
| V2 | 模型只摘原文片段，代码校验、补全、判断要不要追问；另写 16 条新样本，跑之前冻结 | 原 16 条 15/16，新 16 条 13/16；中位延迟约 1.3 秒 |
| V3 | 多轮对话：确认年份、节奏选项、步行和早起分开记 | 18 组 17/18；另外复现出 3 个状态机 bug |
| 模型对照 | 同样的提示词、代码、样本，Qwen3 4B 对 Qwen3.5 4B | 互有胜负 |

- 做得好：实验规范（冻结 hash、失败全留、结论克制）、职责划分对（模型摘、代码算）、全部本地可复测。
- 当时的缺口（后来在阶段 1–3 里补上了）：只做了 Intake、没接行程引擎；没有 CI/CD；字段和网站的 `WizardInput` 没对齐；只认 3 座公园；样本少；几个状态机 bug（拒绝过的候选日期会被确认、年份丢失、认不出“我选第二种”、“6天”和“6 天”不一样、追问里露出内部字段名）。
- 实验目录里的历史版本是冻结的，不要改；新实验另建版本目录。

## 时间线

按时间记录仓库主人提了什么、定了什么、做了什么，在 [timeline/](timeline/)：每次改动（一个 PR）写一个文件，文件名是日期加几个字（`2026-10-20-xxx.md`），按文件名排就是时间顺序。10-19 以前的在 [timeline/2026-10-11-to-10-19.md](timeline/2026-10-11-to-10-19.md)。

为什么一个改动一个文件：以前都往这里的末尾加，同时开着的两个 PR 改的是同一个地方，每次合并都冲突（10-19 一天四次）；各写各的文件就不会撞。
