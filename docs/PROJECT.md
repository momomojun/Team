# 项目现状和记录 / Project Status and Log

做到哪了、下一步做什么、有哪些事等仓库主人决定、做过哪些决定和为什么，以及按时间的完整记录。**怎么做事**见 [GUIDE.md](GUIDE.md)。

**English summary.** This repository (`momomojun/Team`) is the CSYE 7374 (LLMOps, Fall 2026) team project of Jun Zhai, Tianyue Chen and Huiling Fu. It builds on **NPS Guide**, a Chinese-language U.S. national park trip planner that Jun Zhai built before the course (copied from `momomojun/NPS-guide` at commit `4590c45`, without history). The course work adds **NPS Guide Copilot**, an LLM layer that understands trip requests, answers questions from the site's own data and explains plans while the deterministic engine does the planning, plus the LLMOps pipeline around it. As of 2026-11-23: the site covers all 64 U.S. national parks (987 sights) and is live on Vercel; the Copilot runs on Modal (staging and production) behind the trip page's chat box, with a dispatcher, a search agent for questions, and a planning agent plus review agent that negotiate soft wishes with the engine (on by default; soft-wish eval: dispatcher 7/30, multi-agent 27–29/30; 20 control cases with nothing invented); free cloud models first with fallbacks, local Qwen3.5 35B-A3B as the last resort; ten replay eval gates on every PR; data, prompt and code versions on every answer; tag-driven releases up to `copilot-v0.7.0`. Every requirement and promise, with what's still open, is tracked in [GOALS.md](GOALS.md). Next: the Dec 10 demo, the final report and weekly scrums.

## 现状（2026-11-23）

| 部分 | 状态 |
|---|---|
| 网站 NPS Guide | 能用：美国 64 座国家公园（63 页）、加拿大 3 座、4 处园外名胜，987 个景点、364 条徒步路线；英文版、同行适合度、时区、营业季节、季节性山路、NPS 道路事件、安全页、活动页。11-20 到 11-22 照着 Wabunka 整站改版。部署在 Vercel（https://team-peach-five.vercel.app ），登录以后行程和对话存进 Neon |
| Copilot | 调度员（模型决定改条件、提问、加减景点、换住处）→ Intake（模型摘片段、代码算）→ `plan_trip`（确定的行程引擎）→ Critic → Writer；回答问题有 search agent（模型自己选 9 种查询工具，评测 39/44，找一次就答 19/44；11-23 线上打开）和按意思找资料（Gemini 嵌入 + Neon pgvector）；**多 agent 排行程**（规划 agent 摘软要求、代码核对、翻成引擎的 18 种旋钮，审查 agent 最多 3 轮商量，11-22 起默认打开）。模型：Gemini 3.5 Flash Lite → Nemotron 3.5 Super → Qwen3.8 27B → DeepSeek Flash（付费备用）→ 本机 Qwen3.5 35B-A3B |
| 线上部署 | Modal 上两个环境：staging（合进 main 自动部署，配 Vercel Preview）、正式（发版才部署，配 Vercel Production）；口令 + 限流；正式环境 https://momomojun--nps-copilot-web.us-east.modal.run |
| CI/CD | PR 上 3 项必需检查（网站、Copilot 测试 + 十组回放门禁、镜像冒烟），成绩表贴到 PR；`copilot-v*` tag 发版到 GHCR、建 Release、部署 Modal 正式环境。已发到 [`copilot-v0.7.0`](https://github.com/momomojun/Team/releases/tag/copilot-v0.7.0)（11-23）；提示词回滚、换镜像回滚都演示过 |
| 版本和追溯 | 每个回答记下代码版本、提示词版本（hash）、数据版本（网站数据、资料、各地叫法的 sha256）和提交号；镜像 tag 带这三样 |
| 评测 | 十组回放门禁（单句 25/25、held-out v1 37/40、held-out v2 70/70、各地叫法 17/17、多轮对话 20/20 · 15/15 · 1/2、读公告、找资料、search agent）；软要求 soft-v1 30 题、对照题 soft-v2 20 题；行程引擎对照 73 条真实行程、110 条按论文方法打分；回归注入、漂移、故障、混沌测试、LLM 打分；四个模型的全套对照。网站 236 个测试、Copilot 535 个测试。成绩在 [RESULTS.md](../copilot/eval/RESULTS.md)，后台的“测试和评测”页（`/zh-Hans/admin/evals`）画成对比 |
| 实时数据 | 每晚读 NPS 公告（模型提取关闭）、NPS 道路事件，发到 `data/alerts-live`；两周内出发的行程网站和 Copilot 都不排关了的景点；新的关闭由模型提议、人来批 |
| 监控 | 后台 `/zh-Hans/admin`（英文 `/en/admin`）：技术栈、五张架构图、对话和排行程比例、每个模型的调用和花费、计费总账、每晚读公告、最近几轮 |
| 仓库 | `main` 受保护（必须走 PR、3 项检查通过）；协作者 JadenChen10（Tianyue Chen）、huilingfu95-source（Huiling Fu） |
| 目标清单 | 所有要求和承诺做到哪、还差什么：[GOALS.md](GOALS.md) |

## 等仓库主人决定的事

- **计划书交了没有**（A6）：大纲写 10 月 29 日那周交。
- **组员分工**（A9）：Huiling 做了账号和云端保存（#88）；Tianyue 提了“危险”模块的想法，还没有提交。期末报告要写谁做了什么。
- **软要求剩下的几题要不要再修**：S21“两晚都看日落”本来做不到；S22“南北缘都要去”4B 和 Gemini 没说北缘没收录；S03“只住一家”4B 没做到。修了也不算新成绩。

## 下一步

所有要求和承诺的完成情况、还没完成的完整清单见 [GOALS.md](GOALS.md)；这里只写接下来按什么顺序做（课程时间：11 月 5 日起每周 scrum，12 月 10 日项目演示）。

1. ~~**确认 copilot-v0.7.0 上线、打开 search agent**~~（11-23 做完）：正式环境 `/health` 报 copilot/0.7.0；仓库主人在 Modal 正式环境的 Secret `nps-copilot` 加了 `COPILOT_QA_AGENT=1`，同一句“我想去沙漠玩，有什么国家公园推荐”打开前走“找一次就答”，打开后走 search agent（2 步，调了按季节比公园）。
2. **演示和期末报告**（A8，12-10）：演示脚本（一句话排行程 → 软要求和取舍说明 → 提问 → 后台和测试页 → 发版和回滚）、期末报告和展示。材料：RESULTS.md 的成绩、GOALS 里“定了不做”的理由、后台的架构图和测试页。
3. **每周 scrum**（A7）：`npm run scrum` 生成草稿，下周计划、卡住的自己填。
4. **可选**：路线动画导出成短视频（O53，演示可以用）；Docker 一键启动换成 35B 以后找一台装了 Docker 的电脑试一次。
5. 网站这边的待办：[archive/audit/2026-10-16/_followups.md](archive/audit/2026-10-16/_followups.md)；机票按灵活日期找最便宜、租车平台对比、手机信号覆盖、日文韩文版（GOALS 的 W1、W2、W8、W10）。

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
- 10-17 起本来是全部本地运行；10-20 仓库主人定改成免费的云端模型优先、本机模型兜底（谁稳谁准用谁），每次调用记进计费总账。

### 模型

- **11-22 起本机默认换成 Qwen3.5 35B-A3B**（`qwen3.5:35b-a3b-q4_K_M`，MoE，每次只用 3B）：仓库主人看了全套对照定的。回答问题（search agent）27 → 33/44、读公告日期 16 → 20/24、软要求多 agent 25 → 27/30，单句理解打平；在 8 GB 显存的电脑上慢 2–3 倍、要 22 GB 磁盘和 32 GB 内存。没下的电脑（`start-local.ps1`）自动退回 4B；CI 门禁仍回放 4B 的录音（测的是代码有没有退步）。gpt-oss 20B 不合适。见 RESULTS.md。
- **10-17 到 11-22 默认 Qwen3.5 4B**（`qwen3.5:4b-q4_K_M`）；Qwen3.5 9B 留作对照；Qwen3 4B 删了（会编造片段）。2026-10-17 用户定的。
- 依据（同一版代码、同一套样例，详见 [RESULTS.md](../copilot/eval/RESULTS.md)）：Qwen3.5 4B 开发集 25/25、没有编造、每次约 2.4 秒；9B 也是 25/25，但更常漏公园名（4 组靠规则补）、Writer 慢将近一倍（15.4 s 对 8.7 s）；Qwen3 4B 20/25、编造 6 个片段。
- 早期实验里 Qwen3 4B 和 Qwen3.5 4B 互有胜负（V2 28/32 对 27/32，V3 17/18 对 18/18），当时的结论是“先把系统搭起来，用新的评测集再定”，后来的评测选了 Qwen3.5 4B。
- 等评测集扩到约 150 条（含工具调用和 Writer 忠实度）再比较更多模型（Qwen3 8B、Gemma 4 E2B），可以分角色选；不做微调，除非某类错误换模型、改提示词都解决不了，而且有足够的标注数据。
- 本机：早期在 RTX 2070 Max-Q 8 GB、内存约 16 GB 的电脑上（D 盘空间时常不够）；11-22 的模型对照在 RTX 4070 Laptop 8 GB、内存 32 GB 的电脑上（Ollama 在 11434 端口）。下载新模型前先看空间。模型和 Ollama 便携包在 `experiments/local-model-validation/`（`.gitignore` 排除），便携 Ollama 用 11435 端口。

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
