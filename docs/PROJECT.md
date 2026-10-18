# 项目现状和记录 / Project Status and Log

做到哪了、下一步做什么、有哪些事等仓库主人决定、做过哪些决定和为什么，以及按时间的完整记录。**怎么做事**见 [GUIDE.md](GUIDE.md)。

**English summary.** This repository (`momomojun/Team`) is the CSYE 7374 (LLMOps, Fall 2026) team project. It builds on **NPS Guide**, a Chinese-language U.S. national park trip planner that Jun Zhai built before the course (copied from `momomojun/NPS-guide` at commit `4590c45`, without history). The course work adds **NPS Guide Copilot**, an LLM layer that understands trip requests and explains plans while the deterministic engine does the planning, plus the LLMOps pipeline around it. Phases 1–3 are done as of 2026-10-17: contracts and the `plan_trip` tool; the Python Copilot (Intake → plan_trip → Critic → Writer) on a local Qwen3.5 4B with three replay eval gates in CI (dev 25/25, regression 37/40, regional wording 17/17); and Docker images, a tag-driven release workflow to GHCR, versioned prompts with env-var rollback, run-log monitoring and a rollback demo. No release has been tagged yet. Next: a fresh unseen eval set, ablations, and a chat panel on the website.

## 现状（2026-10-17）

| 部分 | 状态 |
|---|---|
| 网站 NPS Guide | 能用：52 座美国国家公园、加拿大 3 座、4 处园外名胜，871 个景点；英文版、同行适合度、时区、59 座全部按官方资料核对过。部署在 Vercel（https://team-peach-five.vercel.app ，没设访问密码） |
| 阶段 1：契约和工具 | 完成（PR #4）：`TripRequest` / `TripResult` v1、`plan_trip` 工具 |
| 阶段 2：Python Copilot | 完成（PR #5）：Intake、Critic、Writer、Provider、日志；默认本机 Qwen3.5 4B |
| 阶段 3：CI/CD | 完成（PR #6）：5 项 PR 检查（3 项必需）、Docker 镜像、`release.yml` 发版流程、提示词版本和回滚、监控、Ollama 一键启动；**还没真的发过版** |
| 阶段 4：评测和对照实验 | 进行中：开发集 25、复杂情况 40、各地写法 17 组都当回归门禁；还缺一批没见过的、对照实验 |
| 阶段 5：接进网站 | 没开始 |
| 仓库 | `main` 受保护（必须走 PR、3 项检查通过）；协作者 JadenChen10、huilingfu95-source |

## 等仓库主人决定的事

- **发第一个版本 `copilot-v0.2.0`**：打 tag、推镜像到 GHCR、建 GitHub Release；GHCR 的包要不要公开。换镜像的回滚要等发过两个版本才能演示。
- **清理分支**：删掉已经合并的远程分支，打开“合并后自动删除分支”。
- **网站要不要设访问密码**（`SITE_PASSWORD`）：现在网址谁都能打开，而 Google 评分快照、自用抓取不适合公开。
- **德纳里的山名**：NPS 2025 年起写 Mount McKinley，网站现在写德纳里。
- **同行适合度两处判断**：梅萨维德崖居导览官方允许背着婴儿去，数据写的是“建议 4–6 岁以上”；几条很累、但没有悬崖窄脊的路线判成了“不建议老人”。

## 下一步

1. 另写一批没看过的评测样例（holdout-v2），**先提交期望再跑**；逐步扩到约 150 条（中英文和混合；日期冲突；多公园；带小孩、老人、轮椅；改口、否定、错别字；提示注入；要求去关闭、要抽签的景点）。
2. 对照实验（期末报告要用）：单个模型直接回答 vs 流水线；有 Critic vs 没有；Qwen3.5 4B vs 9B。固定数据下的回归和“关闭数据更新后答案跟着变”分开测。
3. 发版（等决定）、做一次换镜像的回滚演示。
4. 阶段 5：行程页加对话面板。用户用自然语言说需求 → Copilot 追问、确认 → 生成行程（就是现在“自动生成攻略”的结果）→ 用户可以继续说“第二天轻松一点”“换成住 Jackson”；显示每条说明的来源，没把握时明说；没有 Copilot 时页面照旧能用。
5. 一个很合适的 LLM 用途：从 NPS 公告里提取封路信息，取代现在手动维护的 `closures.ts`。
6. 网站这边的待办：[archive/audit/2026-10-16/_followups.md](archive/audit/2026-10-16/_followups.md)（北瀑布、奥林匹克、黄石、加州各园的施工延误和次要关闭；大峡谷南缘住宿暂停、红杉营地季节；锡安 2026 年 6 月起取消隧道通行证）；按日期的设施开放、充电桩打卡（[DEVELOPMENT.md](DEVELOPMENT.md#路线图)）。

## 课程和团队

- **课程**：CSYE 7374 Infrastructure & DevOps w/LLMs（LLMOps），老师 Raja Alomari。作业要求在 momomojun 电脑上的 `C:\Users\ZJ\Desktop\CSYE7374_LLMOPS\projecctproposal.pdf`：
  - 做一个端到端的 LLMOps 系统，从 5 个方向里选一个重点：微调、多智能体、API 系统、PromptOps、监控治理；
  - 必须有简化的 CI/CD（自动测试、版本管理、部署）；
  - 先交 1–2 页的 proposal。
- **计划书**：同一目录的 `Project_Proposal_NPS_Guide_Copilot.docx` 和 PDF。标题 *NPS Guide Copilot: An End-to-End LLMOps Pipeline for a Grounded Multi-Agent Assistant over Fast-Changing Data*；按老师模板 1–9 节写，第 3 节讲为什么是 LLMOps 问题（知识过时、悄悄变差、成本不透明；这个领域的错误可以用代码客观判定），第 4 节按生命周期列组件，第 10 节对应老师的 4 个学习目标。
- **团队**：1–3 人。Jun Zhai（momomojun，仓库主人）和 Tianyue Chen（chen.t2@northeastern.edu），可能还有第三人。
- **仓库主人**：用中文交流，在美国，Next.js 开发者，去过 7 座国家公园；不熟悉 DevOps，解释部署、CI 这些要从头讲、多打比方。

## 做过的决定

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

## LLMOps 分阶段计划

| 阶段 | 内容 | 状态 |
|---|---|---|
| 1. 契约和工具 | `TripRequest` / `TripResult` 契约、`plan_trip` 工具、全部 59 座公园和 86 个机场的目录 | 完成。单独的查询工具（某天关没关、山路把握、要提前订的、适合度、时区提醒）没做，这些信息已经在 `TripResult` 的 `warnings`、`skipped` 里 |
| 2. 最小 Copilot | Intake → plan_trip → Critic → Writer；Provider 可换；JSONL 日志 | 完成。计划里的 Writer“每句事实带来源”还没做，现在是模板 + 忠实度检查 |
| 3. CI/CD | PR 检查和回放门禁、Docker、按 tag 发版、提示词版本、回滚、监控 | 完成，没发过版。日志用 JSONL，没接 MLflow |
| 4. 评测和对照实验 | 约 150 条评测集、分项报告、对照实验 | 进行中 |
| 5. 接进网站 | 行程页的对话面板 | 没开始 |

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

- 评估了另一个助手的实验（见上面），定了分阶段计划（见上面“LLMOps 分阶段计划”）。

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
