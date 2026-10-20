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

按时间记录仓库主人提了什么、定了什么、做了什么。新的记在最后。

### 10-11 到 10-13：课程和计划书

- 用户问过的关键问题和结论：NPS Guide 本身不是 LLM 项目，要打分的 LLMOps 部分基本都要新写；NPS Guide 适合当底座（真实、会变的数据，加上能客观判对错的检查逻辑）；加入 LLM 可行，但不要用 LLM 替换现有算法。
- 写了计划书（见上面“课程和团队”），用户在 Word 里手动改过。

### 10-15 到 10-16：仓库、部署、协作

- GitHub 仓库 `momomojun/Team`，公开，只复制文件、不带历史。本地目录 `D:\LLM\Team`，从 `D:\WebWorkplace\Team` 搬过来。
- 每个功能开一个分支、提 PR，由队友 review 后合并；推送前先问用户；所有 commit、PR 和描述写中英双语（10-16 起）。
- Vercel 项目叫 team，`main` 自动部署。
- 另一个助手负责本地模型实验（见上面“早期本地模型实验的评估”）。

### PR #1：同行适合度（带小孩、老人、轮椅）

- 用户提出：排行程时要考虑家庭、小朋友、老人能不能去，有没有危险。
- 数据 `src/data/suitability/`，覆盖全部 871 个景点（建议年龄、官方年龄下限、婴儿车、轮椅、老人、危险类型、说明和来源）；逻辑 `src/lib/suitability.ts`：生成攻略时选“同行的人”，不适合的不排、写明原因，要注意的照排、在行程里提醒；公园页可以按适合度筛选。
- 先按徒步数据生成草稿，再由 6 个助手按各公园 NPS 无障碍页面逐个核对，任务说明 [archive/agent-briefs/01](archive/agent-briefs/01-family-suitability-labels.md)。留给用户决定的两件事见上面“等仓库主人决定的事”。

### PR #2：英文版

- 用户要求：课程展示需要英文版，按英语母语的写法写，不要纯翻译。规则：分三批做；英制单位；签证提醒改成通用写法，NPS 公告显示原文，亚洲超市叫 Asian markets；博主频道名带英文的只留英文，纯中文的用拼音。
- 实现：界面文案 `src/i18n/en/dictionary.ts`，数据内容 `src/i18n/en/content/<组>.ts`；`npm run i18n:en` 生成待写的条目，`tests/i18n-en.test.ts` 检查漏写；模板支持单复数、月份名、序数、ISO 日期、12 小时制。写法见 [ENGLISH.md](ENGLISH.md)，任务说明 [archive/agent-briefs/02](archive/agent-briefs/02-english-ui-dictionary.md)、[03](archive/agent-briefs/03-english-content.md)。
- 顺带改的中文：《星球大战》的 Jawa 改译为“爪哇人”；野牛的安全距离改为 25 码；大烟山麋鹿当时改成 50 码，10-16 按 NPS elk.htm（2026-07-21 更新：25 码）改回 25 码；两个波特兰机场分开命名。

### 明星同款、电影同款

- 路线页三栏：博主路线 / 明星同款 / 电影同款。电影同款第一版 27 处（`src/data/films.ts`，任务说明 [archive/agent-briefs/04](archive/agent-briefs/04-film-locations.md)）：要有可靠来源、只收在公园或景点里拍的、不剧透、不转载剧照。
- 10-16 用户要求：电影多收出名的并配图（Commons 上允许转载的取景地实景照片，`photoFile`，`npm run data:film-photos`，任务说明 [06](archive/agent-briefs/06-film-locations-v2.md)）；明星多收大牌、帖子链接逐条核对（不登录 Instagram、X，用公开 embed 和 oEmbed 接口核对，任务说明 [07](archive/agent-briefs/07-celebrity-spots-v2.md)）；明星名字带英文名和一句“是谁”（`whoZh`）。
- 结果：电影 27 → 51 条，都有专门挑的 Commons 实景照片，查过没收的片子写在 `films.ts` 开头；明星 11 → 19 条（肯达尔·詹娜、比伯夫妇、布莱恩·克兰斯顿、入江陵介、渡部香生子、麦莉·赛勒斯……），原有带链接的 6 条用公开 embed 页核对过都对。没到目标数量：搜索额度用完、华语明星一条没找到。新条目英文的任务说明 [09](archive/agent-briefs/09-english-films-celebrities.md)。

### 10-16：按英文官方资料核对事实（59 座全部核完）

- 用户要求：中英文说法不一致时查清楚谁对，英文界面依据英文原始资料。做法：逐座公园对照官方页面，核对距离、爬升、海拔、开放时间、价格、规定、名称和 2026 年的关闭，以官方为准、中英文一起改、每处记下来源。任务说明 [archive/agent-briefs/05](archive/agent-briefs/05-fact-audit.md)，每座公园的记录在 [archive/audit/2026-10-16/](archive/audit/2026-10-16/)，`_followups.md` 是交给主线处理的事项。以后再核对：按同一份任务说明派，记录写进新日期的目录。
- 工具：`scripts/rekey-zh.py`（改中文原文时同步改英文表里的键，先写英文、写中文失败会回滚）、`scripts/check-en.mjs`。
- 重要的改动：冰川湾 Bartlett Lake 步道往返 8 英里；卡特迈、克拉克湖看熊团按 2026 年 10 月官网标价更新；北极之门 Dalton 公路车程按 BLM 改长；恶地离野牛等野生动物至少 100 英尺；新河峡谷下游漂流是 III–V 级；大烟山离麋鹿至少 25 码（之前改成 50 码是错的）；阿卡迪亚 Sand Beach 没有救生员、Seawall Road 10 月 5 日起施工封闭；干龟渡轮 7:30 登船。恶地 Notch 步道：助手说公告写到 2027-01-05，主线重读公告没看到，没采用。
- 新加进 `closures.ts` 的临时关闭：雷尼尔山 Grove of the Patriarchs 停车场、大弯 Grapevine Hills Road、布莱斯 Bryce Connector Trail、大盆地惠勒峰景观道冬季封路、圆顶礁国会峡谷土路；冰川向阳大道 2026 年 10 月 9 日的提前关闭补进了季节性山路数据。
- 查 NPS 公告不用 key：`https://www.nps.gov/<代码>/park-alerts-<代码>.json`，全站 `https://www.nps.gov/nps-alerts.json`。

### 10-16：时区

- 用户提醒：有的公园跨州、跨时区；有的项目按特定地区的时间计时（羚羊峡谷、佩吉）；要提醒手机上的时区可能和实际不符。
- 调研（任务说明 [archive/agent-briefs/08](archive/agent-briefs/08-time-zones.md)，结果 [archive/audit/2026-10-16/timezones.md](archive/audit/2026-10-16/timezones.md)）：59 个公园的 `timeZone` 都对；园内要单独标的是西奥多·罗斯福 North Unit（中部时间）和贾斯珀旁边 BC 省的罗布森山。
- 做了：景点可以单独写时区；排行程按当天第一站的时区写，别的时区的开门、班次、入场、停车场时间先换算（夏天从佩吉去纪念碑谷，Valley Drive 当地 15:30 最晚入场，行程里是 14:30）；行程页写当地时间和时差、第一次去某座公园那天列出时区的坑（`src/data/time-notes.ts`）；公园页加“时区”；艾伯塔、BC 2026 年的全年时间手动补上；贾斯珀到罗布森山“冬季差 2 小时”改正为一年到头差 1 小时。技术细节见 [DEVELOPMENT.md](DEVELOPMENT.md)。

### 10-16：搜索额度和交接规则

- WebSearch 额度用完：每个会话最多 200 次，主对话和所有子助手共用一个计数，同时开了好几个调研助手所以很快用完。调高：环境变量 `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`（写在 `~/.claude/settings.json` 的 `env` 里，重启 Claude Code 生效）；`/clear` 清零计数；新版本每小时回补约 100 次。用户让加到 500，已经写进 `C:\Users\ZJ\.claude\settings.json`。额度用完后用 WebFetch 直接打开官方页面，能核对已知网址，找不到新资料。
- 用户要求的交接规则写进了 [GUIDE.md](GUIDE.md#8-和-ai-助手claude-code-等一起改)。

### 10-16：LLMOps 现状评估

- 评估了另一个助手的实验（见上面），定了分阶段计划（阶段 1–5，现在的状态见上面“现状”）。

### 10-17：阶段 1（PR #4）

- 用户合并 PR #3 后说“开始第 1 步”。分支 `feature/copilot-plan-tool`。
- 做了：`TripRequest` / `TripResult` v1 契约（`copilot/contracts/`）、`plan_trip` 工具（命令行 `npm run copilot:plan`、HTTP `POST /api/copilot/plan`）、59 座公园和 86 个机场的目录、测试 `tests/copilot-plan.test.ts`。

### 10-17：阶段 2（PR #5）

- 用户说“开始第二步”。分支 `feature/copilot-service`。
- 做了：`copilot/nps_copilot/` Python 包（Intake、plan_trip 客户端、Critic、Writer、Provider、流水线和日志、FastAPI、命令行），pytest，评测 `copilot/eval/`，GitHub Actions `ci.yml`。
- 本机真模型评测：Qwen3.5 4B 第一次 14/25，修了几处代码问题（天数放错字段、孩子年龄、机场回答没对上选项、中文数字年份、“布莱斯”别名）后 23/25，加了只补天数的规则后 25/25（规则补的单独记）。
- 用户问“要不要下载个更好的模型试试”：下载了 Qwen3.5 9B，不比 4B 好、慢将近一倍，不换。顺带：公园名也加进规则补；评测加 `--writer`；Writer 输出上限 512 → 1536。
- 用户要求“测试多种复杂情况”：另写 40 组复杂对话，先冻结再跑。第一次 27/40，13 组失败里 11 组是代码问题（最严重的是回程机场没答清楚时被悄悄丢掉），修完 37/40，改当回归门禁。繁体输入用网站同一套 OpenCC 生成繁简对照表。
- 用户问哪个模型更好：定了 Qwen3.5 4B，删 Qwen3 4B（助手不能替用户永久删除文件，给了命令 `ollama rm qwen3:4b` 让用户自己删）。
- 修 CI：Windows 生成的 `package-lock.json` 缺 Linux 才装的 `@emnapi/runtime`、`@emnapi/core`；CI 里 `npm ci` 不认锁文件时退到 `npm install` 并标警告；类型检查前先 `npx next typegen`。

### 10-17：阶段 3（PR #6）

- 用户合并 PR #5 后问阶段 1、2 到底做了什么、为什么仓库有这么多分支、GitHub 的 4 个检查是干什么的，然后说“那你帮我做第三步”。分支 `feature/copilot-release`。
- 做了：提示词版本、Copilot 版本 0.2.0（日志和 `/health` 记版本、提示词 hash、构建的提交）、监控 `stats`、Docker（`copilot/Dockerfile` 约 485 MB、`.dockerignore`、`docker-compose.yml`、冒烟测试）、CI 的 `docker` job、`release.yml`。
- 回滚演示：intake 提示词 v2 回归集 37 → 39/40、开发集 25 → 24/25，门禁挡住，默认仍是 v1；本机部署 v2、再只用环境变量切回 v1，同一句从追问变成排出行程（[RESULTS.md](../copilot/eval/RESULTS.md)）。
- 本机 8765 端口被用户另一个项目（ski-deals）占着，没动它；compose 加了 `COPILOT_PORT`。
- PR #6 第一次 CI 没过：新加的 Python 文件里有新汉字、繁简对照表没重新生成。
- 用户说第三步“一点都没看懂”，按初学者解释了 Docker、tag、推送、GHCR、拉回来再测、Release。用户又提了三件事：
  1. **繁简对照表不一定对，香港、台湾、新加坡、大马用词不一样**：实测三藩市、卡加利、洛磯山、班芙、賭城、“玩五日”、香港字形都认不出。做了各地叫法表（`copilot/scripts/regional_names.py`）、香港字形、粤语说法、“N日”、英文日期顺序（“8 June 2027”原来会丢掉日子）；另写 17 组各地写法的评测，先提交期望再跑：第一次 14/17，修完 17/17，当回归门禁。
  2. **Docker 为什么连 Ollama、别人没有 Ollama 怎么办**：做了一键启动 `docker-compose.ollama.yml`（官方 Ollama 镜像 0.40.5，第一次自动下载模型）和 `docker-compose.gpu.yml`。实测发现刚启动时第一句话要等模型装进显卡、超时，加了预热步骤、模型留在显卡里 24 小时：之后启动约 3.5 分钟、第一句话 7–11 秒。
  3. **组员想运行和改这个项目要怎么做**：写了上手指南（现在并进了 [GUIDE.md](GUIDE.md)）。
- 用户在 GitHub 上打开了 `main` 的分支保护（必须走 PR、3 项检查通过、不需要别人批准），助手读设置核对过。

### 10-17：文档整理

- 用户觉得文档太散、要维护的太多。原来要靠人维护的有 12 份，同一件事写在三四个地方（“怎么跑 Copilot”写了 4 遍，“做到哪一步”写了 3 遍）。
- 收成：[GUIDE.md](GUIDE.md)（怎么做事）、本文件（现状和记录）、[DEVELOPMENT.md](DEVELOPMENT.md)（网站技术参考）、[COPILOT.md](COPILOT.md)（Copilot 技术参考）、[ENGLISH.md](ENGLISH.md)，加上评测成绩 [RESULTS.md](../copilot/eval/RESULTS.md)。原来的 `ONBOARDING.md`、`copilot/RELEASE.md`、`docs/PROJECT_LOG.md`、`docs/LLMOPS_PLAN.md` 并进去以后删了；核对记录、任务说明和另一个助手的讨论记录移到 [archive/](archive/)。规则：一件事只写一处，别处放链接。

### 10-18：第一次发版、清理分支、麦金利山

- 仓库主人对待决定的事：发版、删分支、网站不设密码、山名改回官方名称 Mount McKinley，所有语言都改；同行适合度那两处没看懂，重新解释了。
- 发版：在 `main`（PR #7 合并后）打 `copilot-v0.2.0`，发版流程一次跑通（测试、三组门禁、构建、冒烟、推 GHCR、拉回再冒烟、建 Release）。镜像是公开的，不登录也能拉。
- 删掉了 7 个已经合并的远程分支和本地分支，打开了“合并后自动删除分支”。
- 山名：按 NPS 官网（首页写 “North America's tallest peak, 20,310' Mount McKinley”），把指山的地方改成麦金利山 / Mount McKinley：中文 7 处、英文 7 处（繁体自动转成麥金利山），公园介绍里加一句“2015–2025 年官方名称是德纳里峰”。公园名、德纳里游客中心、阿拉斯加州立公园的 Denali Viewpoint South 这些不是山名，没改。
- 同行适合度两处：仓库主人选了“照官方，能去，但要强调、请用户务必慎重考虑”。
  - 梅萨维德三个崖居导览：NPS 原话是孩子要能自己爬梯子、婴儿要放进背带、背的大人爬梯子时要站得稳（也要空出双手）；长屋的官方页面没写婴儿，按另两个算，并提醒出发前问公园。3 岁以下由大人背着能去，3 岁到建议年龄之间（背不动、又爬不了梯子）照旧不排。顺带按 NPS 把阳台屋的崖壁改成约 65 英尺。
  - Iceline、伯吉斯页岩、Old Rag、圣米格尔岛：带老人时照排。
  - 怎么强调：新的“请务必慎重考虑”提醒，深红底白字，出现在行程总览“要注意”的最前面、攻略说明（单独一块，列出每处的原因和官方说明）、每天那个景点下面、景点详情；简体、繁体、英文都有，说明文字结尾都是“请务必慎重考虑”。Copilot 的结果里加了 `familySerious`，回复里会在“要注意”下逐个说出来。在浏览器里按“带不到 1 岁的孩子去梅萨维德”实际排过一遍看过。

### 10-18：发 0.2.1、换镜像回滚演示

- 仓库主人问下一步做什么。看了课程大纲：10 月 29 日那周交 proposal，11 月 5 日起每周 scrum，12 月 10 日项目演示（项目占 25%，按每周 scrum 和最后演示打分）。建议的顺序：发 0.2.1 并演示换镜像回滚 → 读 NPS 实时公告、自动提取关闭信息（对应计划书标题里的 fast-changing data 和课上的 RAG）→ 网站上的对话面板 → 没见过的评测集和对照实验、准备演示。仓库主人同意先做第一步。
- 发版：PR #10 把版本改成 0.2.1，合并后打 `copilot-v0.2.1`，发版流程一次跑通。
- 换镜像回滚演示：新脚本 `copilot/scripts/rollback_demo.py`。0.2.1 → 0.2.0 → 0.2.1，每次 `/health` 的版本都对；同一句“带不到 1 岁的宝宝去梅萨维德”，0.2.1 照排崖居导览并提醒“请务必慎重考虑”，0.2.0 把它们列为不适合（当时的数据）。切换 3–21 秒。结果见 [RESULTS.md](../copilot/eval/RESULTS.md)。
- 还要确认：proposal 交了没有、要不要按现在的实际情况改（比如计划书写的 MLflow，现在用的是 JSONL 日志加 `stats`）。

### 10-18：仓库主人试用 Copilot，修第一批

- 仓库主人在终端里用了一次 Copilot（“明天出发去优胜美地玩 3 天”，从安大略机场出发，改住 Airbnb，再问 El Portal 多远、火瀑是不是只有几天），评价“非常的不行”：听不懂“明天”、多问年份、没说要开 6 小时、最后一天写成“住机场”、改条件只会重印行程、不会回答问题、火瀑的说法误导。三组评测都满分却没发现，因为评测只考“一句话摘条件”。
- 定了顺序：先修对话（第一批小毛病 → 第二批能回答问题 → 第三批多轮对话评测），读 NPS 公告和网站对话框往后挪。
- 第一批做完（分支 `fix/copilot-conversation`）：相对日期、年份规则、每天出发和回程、太远时推荐近的机场、Airbnb 链接、季节性关闭的说法、改了什么、条件没变时不重印。详见 [RESULTS.md](../copilot/eval/RESULTS.md)。
- 仓库主人问修法：说明了这次全是改代码（日期换算的规则、把引擎已经算好的车程和资料写进回复、对话里记住上一次的行程），模型和提示词都没动，也没训练；规则的坏处是只认写进去的说法。回归集 3 组失败（H05、H20、H38）仓库主人决定先不修。
- 仓库主人提议把行程做成动画：定了动画只在第一次排出行程、改了行程时自动播（帮人第一眼看懂），之后看行程还是文字和静态地图；和网站对话面板一起做。见上面“下一步”第 3 条。

### 10-18：第二批，能回答问题（分支 `feature/copilot-qa`）

- 网站数据（景点、住处、公园、特别活动、临时关闭）整理成 1639 条短文 `copilot/contracts/knowledge.jsonl`，`npm run copilot:contracts` 一起生成。排好以后的提问：先在这里找 4 条（名字命中 + BM25，不用向量检索），模型只按“行程 + 这 4 条”回答，代码检查数字都对得上，对不上就摘原文，查不到说不知道。新提示词 `qa/v1`。
- 用真模型把仓库主人那段对话再走一遍，El Portal 多远、火瀑哪几天、19 号几点出发都答对了，支付宝说了不知道。顺手修了“冰川点”被当成冰川国家公园、繁简对照表把“么”转成“幺”。详见 [RESULTS.md](../copilot/eval/RESULTS.md)。
- 仓库主人第二次试用（雷尼尔山）后接着修：只回“5”也认、“这些景点好看吗”挑几个说亮点、“新的行程”从头来、“西雅图附近的三个国家公园都玩”换成三座、排出行程前也能提问、资料里加了片区和各州的国家公园。发现住处没有营业季节（10 月下旬还排天堂旅馆），另开任务。

### 10-18：住处的营业季节（分支 `feature/lodging-seasons`）

- 仓库主人第二次试用 Copilot 时发现：10 月 20 日出发的雷尼尔山行程 4 晚都排在天堂旅馆，可它 9 月 30 日就关门了。原因是住处没有营业季节的数据。
- 三个调研助手按官方页面查了 125 家（园内酒店、阿拉斯加和加拿大的夏季旅馆、季节性的门户小镇），56 家是季节性营业的，写进 `src/data/lodging-seasons.ts`；大峡谷南缘两处是山洪后的临时关闭。自动生成攻略（Copilot 也是）不再住这晚不营业的地方，行程页推荐里排到最后、标出来，自己选了的那晚提醒。顺手改了说错的说明：天堂旅馆是 5 月中到 9 月底、John Muir Lodge 冬季关闭、Needles Outpost 到 11 月 20 日。详见 [DEVELOPMENT.md](DEVELOPMENT.md#注意事项)。

### 10-18：补上停车证和租车参考价（分支 `feature/parking-and-car-rates`）

- 核对仓库主人以前的要求时发现：10-16 在旧目录 `D:\WebWorkplace\NPS-guide` 写好的大烟山停车证预算、28 个机场的租车参考价没提交，Team 是从更早的提交复制的，没带上。搬过来，补上英文文案。新景点的 Google 评分那次没查完，还没做。

### 10-18：目标清单

- 仓库主人问“以前的要求都完成了吗”：把 9 月 23 日起所有会话里仓库主人说过的话、课程作业、计划书逐条对照仓库核对，网站 82 条、Copilot 和课程 119 条。仓库主人说核对表要存起来、当目标去完成，写成 [GOALS.md](GOALS.md)：还没完成的列在最前面，做完一条就改状态、打勾。
- 核对时发现的：10-16 在旧目录写好的停车证和租车价没提交（已补，PR #16）；每天的封路核对任务还在查旧目录；计划书和现在的做法有几处不一样，仓库主人定“先不改、把项目做好”。
- 按仓库主人的要求更新本文件过时的地方：“现状”改到 10-18，把原来重复的“LLMOps 分阶段计划”表并进“现状”；补上等决定的事；计划书对应学习目标的是第 8 节；团队是 Jun Zhai、Tianyue Chen（JadenChen10）、Huiling Fu（huilingfu95-source）。

### 10-18：调度员改造（分支 `feature/copilot-dispatcher`）

- 仓库主人觉得模型“只是在识别问题、非常不智能”，定了把模型改成“调度员”。按规矩先写多轮对话评测（conversation-v1，20 组 52 轮，期望先提交），用原来的代码跑出基线 12/20 组、44/52 轮（加减景点、指定住处全不会）。
- 做法：每一轮先让模型看最近的对话、条件和行程，决定做哪几件事（改条件、提问、加减景点、指定住处、重新开始、闲聊），代码去做：名字在资料里对成 id、模型编的地方丢掉、问题交给 QA、条件照旧由 Intake 读；调度员出错就退回原来的规则。行程引擎和契约加了 `include`、`exclude`、`lodging`（用户点名要去、不去的景点和某晚住处）。
- 结果：conversation-v1 20/20、52/52。写完以后另写了没见过的 conversation-v2（15 组 34 轮），第一次跑 14/15、33/34；同一批关掉调度员是 6/15、24/34。修了“那就……”指前面的公园以后 15/15，两组都当 CI 门禁。每轮中位耗时约 3.6 → 4.2 秒（多一次模型调用）。详见 [RESULTS.md](../copilot/eval/RESULTS.md)。
- 仓库主人第三次试用（跑的是还没合并的旧版本，见 RESULTS.md），原话写成 conversation-v3（期望先提交）：调度员版本 3/14 轮。修了 Intake 认不出叫法后卡死、“雷尼尔山呢？”被当成改公园、波特兰附近有哪些公园（资料加了机场、城市附近的公园）、奥林匹亚、“不住酒店”、每天写上在哪座公园、季节对不上时说清楚，之后 13/14；v1 20/20、v2 14/15。每轮中位耗时到了约 6 秒。**以后组员和仓库主人试用最好用合并后的 main**：同一个目录里切分支会让正在跑的对话用到另一版代码。
- **10-19 补发 PR**：#18 合并的时候最后两个提交（第三次试用写成的评测、第三次试用后的修复）还没推上去，没进 main；这次连同“打错字反问”一起再开 PR。仓库主人说“奥林匹亚”是自己打错字、不要当别名，改成像某座公园就反问一句（见 RESULTS.md）。

### 10-19：电影、游戏、动画同款和官方嵌入（分支 `feature/media-embeds`）

- 仓库主人看了网页：游戏、动画的取景地也要放进去；电影同款只有风景图、没有剧照；明星照片是自用和课程展示，放进网页。网站和仓库都是公开的，别人的照片、剧照不下载转存，改成用平台官方的嵌入（Instagram 原帖、YouTube 上片方官方频道的片段和预告片），点了才加载。两个调研助手找了 51 部电影的官方视频（42 部有）、18 条游戏和动画同款（开发商、制作方或主流媒体确认的），英文另一个助手写；规则写进 GUIDE.md，新要求记进 GOALS.md（W75–W77）。

### 10-19：读 NPS 公告提取临时关闭，第一部分（分支 `feature/alert-extraction`）

- 仓库主人定了下一步做“读 NPS 实时公告”（计划书的 fast-changing data）。抓了 2026-10-19 所有公园的公告快照（151 条），模型跑之前标好标准答案（21 条拿不准的标 ambiguous），模型读公告选出关了的景点、读起止日期，代码核对原话、日期、景点。和网站现有的关键词规则比：类型准确率 58% → 76%，日期 0 → 16/24；整段关闭的召回只有一半，模型和规则一起用召回到 80%。详见 RESULTS.md。第二部分：接进排行程、每晚自动抓新公告（新公告就是没见过的测试数据）、漂移测试。

### 10-19：公告关闭接进排行程、每晚抓公告（分支 `feature/alert-closures-in-plan`）

- 第一部分（#21）合并后做第二部分：Copilot 调行程引擎时带上模型提取的关闭清单，两周内出发的行程用上。用真模型跑今天的 151 条公告时发现模型会把 Biscuit Basin 的关闭说成老忠实泉关了；算了一下评测集上只有模型找到的景点 10 个对 4 个，于是分两档：标题里写着的（规则也找到）不排，说明里说“NPS 最新公告说暂时关闭，几月几日重开”；只有模型找到的照排、在“要注意”里提醒出发前确认；清单超过 3 天、比“今天”还晚（评测）、公告日期碰不到这趟的都不用。漂移测试：塞一条“隧道观景点关到 11 月 1 日”的公告，提取以后 10 月 20 日出发的行程就不排它了，11 月 20 日出发的照排。GitHub Actions 每晚抓一次公告，新的关闭公告开 issue；NPS 接口常回 429，抓取加了重试。评测和测试里关掉关闭清单，门禁成绩不变。
- 合并后加了仓库 secret `DATA_GOV_API_KEY`，手动跑了一次：154 条公告全部抓到，和上午的快照比多了 4 条没见过的关闭公告（issue #23）。仓库主人要每晚的检查在加州时间 0 点跑。

### 10-19：网站行程页的对话框（分支 `feature/chat-panel`）

- 仓库主人让每晚的公告检查改在加州时间 0 点跑（#24），然后做下一步：行程页加对话框。浏览器 → 网站的 `/api/copilot/chat` 中转 → 本机的 Copilot 服务；`plan_trip` 的结果里带上网站的 Trip，排出来的行程原样放进行程页（聊天里说的和页面上的是同一份）。试了“6 月带爸妈去优胜美地玩 4 天，从旧金山飞”：问一次节奏，点“轻松玩”就排好放进行程页；接着说“不去冰川点了”“第三晚住 Yosemite Valley Lodge”“换成 9 月去”都改对了。Copilot 没开时对话框不显示。Copilot 放哪还没定，先按本机做。
- 装 FastAPI 时不小心用了 Anaconda 的 pip（这台电脑上 `pip` 和 `python` 不是同一个），升级了 Anaconda 里的 anyio、pydantic 等，已经改回去了（typing-extensions 原来的版本查不到，装的 4.12.2，满足 torch、grpcio、python-docx 的要求）。以后一律用 `python -m pip`。

### 10-19：商业 API 对照（分支 `feature/gemini-provider`）

- 仓库主人问本机 4B 不够用时换 API 值不值、哪个最便宜。算了用量（每句话约 2 千输入 token），便宜一档的 API 一次对话不到 1 美分，钱不是问题；要比的是准不准、快不快。仓库主人申请了 Gemini 的免费 key、拿出手上的 OpenAI key（都写在 `.env.local`，不提交）。加了 `GeminiProvider`、`OpenAIProvider`（按免费档限速、服务忙重试、额度用完报错、模型不认的设置自动换一档，单元测试全用假的网络回复）和退回本机的 `FallbackProvider`。读公告这一项比了 6 个模型：GPT-4.1 mini 最准，Gemini 3.5 Flash Lite 免费、差得不多，本机 4B 第四，GPT-5 nano 最差，Gemma 4 31B 出错太多作废。OpenAI 一共花了约 $0.09。仓库主人提醒别拿 key 随手测试：以后真调用之前先说要调多少次。

### 10-19：审 Huiling 的 PR #26（公园、价格、榜单拆页，营地地图）

- 仓库主人合并了 Huiling 的 #26（78 个文件：公园页拆成六个小页，价格、榜单各自拆页，灵活日期机票、租车保险和取还车、手机信号、山火烟雾、充电桩打卡、YouTube 攻略，营地地图和住宿偏好“露营”，Copilot 也认得“露营”）。#26 是在 #27 之前写的、检查跑在旧代码上，合并后在最新的 main 上重新跑：网站测试 140、Copilot 测试 148、七组门禁都过，读公告接进排行程的代码没被冲掉；23 个新旧页面都能打开、浏览器没报错，英文页没有混进中文，手机宽度不横向滚动；住宿偏好“不限”时不会排进营地；YouTube 搜索结果缓存 7 天。
- 发现的问题：营地没有开放季节，1 月选“露营”会排进火山口湖 Mazama Village、雷尼尔山 Cougar Rock、落基山 Glacier Basin、黄石 Slough Creek 这些夏季营地。仓库主人定了交给 Huiling 修，任务说明写在 [archive/agent-briefs/10-campground-seasons.md](archive/agent-briefs/10-campground-seasons.md)。另外：`price-center.tsx` 有一个没用到的变量（lint 警告）；“更多攻略”要另配 `YOUTUBE_API_KEY`（本机、Vercel 都还没配）；提交说明和 PR 标题只有中文、`PROJECT.md` 没记、一个 PR 做了很多件事，跟她说一声以后照 GUIDE 的约定来。

### 10-19：公告只读新的、聊天时现读（分支 `feature/alerts-incremental`）

- 仓库主人问要不要每晚读公告。150 条里大部分几周都不变，每晚全读是重做同一份作业；定了两个都做：每晚在 GitHub 上用 Gemini（仓库主人加了 secret `GEMINI_API_KEY`）只读新出现、改过的几条（读过的记在 actions/cache 里），issue 里多一列模型找到的景点；聊天时，两周内出发、要去的公园今天还没读过，就当场只读这几座。出错都退回原来的清单或规则，不影响排行程。第一晚缓存是空的，会读一遍全部（约 150 次，Gemini 免费档每天 500 次），之后每晚只有几条到十几条。
- 仓库主人关了 issue #23：4 条里 Boquillas 口岸的公告不到一天就撤了，另外三条是季节性封路和临时的计划烧除，都不用改数据；Boquillas 那条规则漏了（标题和景点名对不上），正好说明要让模型读全文。

### 10-19：路线动画（分支 `feature/route-animation`）

- 仓库主人要赶紧做路线动画。第一版：第一次排出行程（自动生成攻略、Copilot 对话框）和 Copilot 接着改了行程时自动播，改了只播变了的那几天；每天镜头移过去、沿真实开车路线画出来，每到一站弹出几点到、停多久，最后停在当晚住处；看日落、星空的天最后天色变暗；一天两三秒、整段二十秒上下；可以暂停、跳过、点圆点跳到某一天；播完回到静态地图，可以再点“播放路线”。地图看得见了才播，系统设了“减少动画”不自动播。在浏览器里看过自动播、各站的牌子和播完恢复；暂停、跳过、手机宽度那次浏览器窗口在后台、页面不渲染，没来得及看。

### 10-19：雷尼尔山“预约和班车”页太空、组员提议危险模块

- 仓库主人看雷尼尔山的“预约和班车”页觉得“要提前订的”孤零零的：`bookings.ts` 里这座公园只有 1 条（还是“2026 年不用预约”），园内酒店、营地、野外许可的开订规则当初没查到官方写明的就没收；同样只有 1 条的共 9 处。定了：数据助手来补（营地用 Huiling 的营地 id，行程页也会提醒营地哪天开订），页面条目少时空一大块交给 Huiling（写进 [archive/agent-briefs/10-campground-seasons.md](archive/agent-briefs/10-campground-seasons.md)）。
- 组员提议加“国家公园可能遇到的危险”（棕熊等野生动物伤人这类），加进 GOALS 的 O63，之后做。
- 改正：这一天几处时间线写成了“10-20”（UTC 的日期），按加州时间改回 10-19。
