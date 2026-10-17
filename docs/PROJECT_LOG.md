# 项目工作记录 / Project Log

## English summary

This repository (`momomojun/Team`) is the CSYE 7374 (LLMOps, Fall 2026) team project. It is built on **NPS Guide**, a Chinese-language U.S. national park trip planner that Jun Zhai built before the course (copied from `momomojun/NPS-guide` at commit `4590c45`, without history). The course work adds an LLM layer ("NPS Guide Copilot") and the LLMOps pipeline around it. This file records, in order, what the user (Jun Zhai) asked for, what was decided, and what was built, so anyone pulling the repo can continue. Local-model experiments done by another assistant are recorded separately in [LLMOPS_WORK_LOG.md](LLMOPS_WORK_LOG.md) and [experiments/](../experiments/README.md).

Key decisions so far:

- **LLM role**: the LLM understands requests and explains plans; it never replaces the deterministic trip engine. NPS Guide's data and algorithms serve as the knowledge base, the tools, and the referee (the checks).
- **Official English sources win**: facts come from NPS, Parks Canada, and operator pages. The Chinese text was written from those sources, and the English edition should follow the original official wording.
- **Bilingual git text**: every commit message, PR title, and PR description in this repo is written in both Chinese and English.
- **English edition** (`/en`): written natively, not translated line by line. It uses imperial units and 12-hour times. See [ENGLISH.md](ENGLISH.md).

Shipped so far:

- PR #1: family suitability for kids, seniors, and wheelchair users.
- PR #2: the English edition, film locations, and celebrity spots on the routes page.
- In progress: the fact audit against official sources, more film and celebrity spots, and time-zone handling.

---

## 1. 课程和计划书（2026-10-11 到 10-13）

- **课程**：CSYE 7374 Infrastructure & DevOps w/LLMs（LLMOps），老师 Raja Alomari。作业要求见用户桌面 `C:\Users\ZJ\Desktop\CSYE7374_LLMOPS\projecctproposal.pdf`：
  - 做一个端到端的 LLMOps 系统，从 5 个方向里选一个重点：微调、多智能体、API 系统、PromptOps、监控治理；
  - 必须有简化的 CI/CD；
  - 先交 1–2 页的 proposal。
- **团队**：1–3 人。现在是 Jun Zhai 和 Tianyue Chen（chen.t2@northeastern.edu），以后可能加第三人。另有一个邮箱 huilingfu95@gmail.com，用户说是队友的，但 GitHub 上搜不到对应账号，需要队友提供 GitHub 用户名才能邀请。
- **计划书**：`C:\Users\ZJ\Desktop\CSYE7374_LLMOPS\Project_Proposal_NPS_Guide_Copilot.docx` 和同名 PDF，用户在 Word 里手动改过。
  - 标题：NPS Guide Copilot: An End-to-End LLMOps Pipeline for a Grounded Multi-Agent Assistant over Fast-Changing Data。
  - 结构按老师模板的 1–9 节写。
  - 第 3 节先讲项目做什么，再讲为什么是 LLMOps 问题：知识过时、悄悄变差、成本不透明；这个领域的错误可以用代码客观判定。
  - 第 4 节按生命周期列出系统组件。
  - 第 8 节逐条对应老师的 4 个学习目标。
- **用户问过的关键问题和结论**：
  - NPS Guide 本身不是 LLM 项目，要打分的 LLMOps 部分基本都要新写。
  - NPS Guide 适合当底座：真实、会变的数据，加上能客观判对错的检查逻辑。
  - **加入 LLM 可行，但不要用 LLM 替换现有算法**。LLM 负责听懂需求和解释，算法负责算对。
  - 一个很合适的 LLM 用途：从 NPS 公告里提取封路信息，取代现在手动维护的 `closures.ts`。

## 2. 仓库、部署、协作（10-15 到 10-16）

- **仓库**：GitHub 仓库 `momomojun/Team`，公开，用户选择只复制文件、不带历史。本地目录 `D:\LLM\Team`，从 `D:\WebWorkplace\Team` 搬过来的。
- **协作方式**：
  - 每个功能开一个分支、提 PR，由队友 review 后合并。
  - 推送前要先问用户。
  - **所有 commit、PR 和描述都写中英双语**（10-16 起）。
- **部署**：
  - Vercel 项目叫 team，正式网址 https://team-peach-five.vercel.app ，main 分支自动部署。
  - `DATA_GOV_API_KEY` 由用户自己在 Vercel 和 `.env.local` 里设置，密钥不要写进任何文件或聊天记录。
  - 现在没有设 `SITE_PASSWORD`，网站谁都能打开。
- **另一个模型**：负责 LLMOps 本地模型实验，用 Ollama 在本地跑 Qwen3 4B 和 Qwen3.5 4B，做需求提取的 V1、V2、V3 和模型对照。记录在 [LLMOPS_WORK_LOG.md](LLMOPS_WORK_LOG.md)，实验材料在 `experiments/`。模型权重和运行库被 `.gitignore` 排除，不提交。

## 3. 同行适合度：带小孩、老人、轮椅（PR #1，已合并）

- 用户提出：排行程时要考虑家庭、小朋友、老人能不能去，有没有危险。
- **数据**：`src/data/suitability/`，每座公园一个文件，覆盖全部 871 个景点。字段包括建议年龄、官方年龄下限、婴儿车、轮椅、老人、危险类型、说明和来源。
- **逻辑**：`src/lib/suitability.ts`。
  - 生成攻略时可以选"同行的人"。
  - 不适合的不排，在攻略说明里写明原因；需要注意的照常排，在行程里提醒。
  - 公园页可以按适合度筛选。
- **怎么做的**：先按徒步数据生成草稿，再由 6 个助手按各公园 NPS 无障碍页面逐个核对。助手的任务说明在 [agent-briefs/01-family-suitability-labels.md](agent-briefs/01-family-suitability-labels.md)。
- **留给用户决定的两件事**（还没答复）：
  - 梅萨维德崖居导览官方允许用背带背婴儿去，但数据写的是"建议 4–6 岁以上"。
  - 几条特别累、但没有悬崖窄脊的路线判成了"不建议老人"。

## 4. 英文版（PR #2，已合并）

- 用户要求：课程展示需要英文版，**按英语母语的写法写，不要纯翻译**。
- **用户定的规则**：
  - 全部内容分三批做；
  - 用英制单位；
  - 针对英语读者改写：签证提醒改成通用写法，NPS 公告显示原文，亚洲超市叫 Asian markets；
  - 博主频道名：带英文的只留英文，纯中文的用拼音。
- **实现**：
  - 界面文案在 `src/i18n/en/dictionary.ts`；
  - 数据内容在 `src/i18n/en/content/<组>.ts`，按中文原文查英文；
  - `npm run i18n:en` 生成待写的条目，`tests/i18n-en.test.ts` 检查有没有漏写；
  - 模板支持单复数、月份名、序数、ISO 日期，时间写成 12 小时制。
  - 写作规范见 [ENGLISH.md](ENGLISH.md)，助手任务说明见 [agent-briefs/02](agent-briefs/02-english-ui-dictionary.md) 和 [03](agent-briefs/03-english-content.md)。
- **顺带修正的中文数据**：
  - 《星球大战》的 Jawa 改译为"爪哇人"；
  - 野牛的安全距离改为 25 码，大烟山麋鹿改为 50 码；
  - 两个波特兰机场分开命名。

## 5. 明星同款、电影同款

- 用户提出把明星同款放进博主路线页。现在路线页有三栏："博主路线 / 明星同款 / 电影同款"。
- 用户提出加电影同款：
  - 第一版有 27 处取景地，数据在 `src/data/films.ts`，任务说明见 [agent-briefs/04](agent-briefs/04-film-locations.md)；
  - 收录标准：要有可靠来源；只收在公园或景点里拍的；不剧透；不转载剧照。
- **10-16 用户的新要求**（进行中）：
  1. 电影、电视剧多收出名的，并且配图。
     - 照片用 Wikimedia Commons 上允许转载的**取景地实景照片**，不用剧照。
     - 字段 `photoFile`，用 `npm run data:film-photos` 生成 `films-photos.generated.ts`。
     - 没有专门挑照片的，用对应景点图集的第一张。
     - 任务说明见 [agent-briefs/06](agent-briefs/06-film-locations-v2.md)。
  2. 明星同款太少、链接不对：要多收大牌明星，帖子链接逐条核对。
     - **不登录 Instagram、X**：用公开的 embed 和 oEmbed 接口核对帖子，用新闻报道找帖子。
     - 任务说明见 [agent-briefs/07](agent-briefs/07-celebrity-spots-v2.md)。
  3. 明星名字要带英文名，还要一句"是谁"。
     - 新字段 `whoZh`；页面显示中文常用名、英文名，再加一行身份说明。

## 6. 按英文官方资料核对事实（10-16，进行中）

- 用户要求：中英文说法不一致时要查清楚谁对；**英文界面要依据英文原始资料**，比如 NPS 官网。中文是当初转述的，可能有误差。
- **做法**：
  - 逐座公园对照官方页面，核对距离、爬升、海拔、开放时间、价格、规定、名称和 2026 年的关闭；
  - 以官方为准，中英文一起改；
  - 每处改动记下来源。
  - 任务说明见 [agent-briefs/05-fact-audit.md](agent-briefs/05-fact-audit.md)。
- **工具**：
  - `scripts/rekey-zh.py`：改中文原文时，同步改英文表里的键。先写英文，写中文失败会回滚。
  - `scripts/check-en.mjs`：检查英文内容组。
- **记录**：每座公园一份，在 [audit/2026-10-16/](audit/2026-10-16/)；`_followups.md` 是各助手交给主线处理的事项。
- **进度**：
  - 已核完 35 座：加州、西北、落基山北部、犹他、大峡谷、死亡谷、大盆地、科罗拉多、得州，以及班夫、贾斯珀、幽鹤、基奈峡湾。
  - 剩下 4 组：
    - 阿拉斯加：wrst、glba、katm、lacl、gaar、kova；
    - 东部：acad、ever、bisc、drto、grsm；
    - 大平原和阿巴拉契亚：thro、badl、wica、shen、neri；
    - 园外名胜和新墨西哥、夏威夷：ante、hsbd、mova、wave、pefo、whsa、cave、havo、hale，这组 10-16 晚上已重新开始。
  - 中途两次碰到用量上限、一次换了会话，没核完的组要重新派。
- **已经加进 `closures.ts` 的新临时关闭**（10-16）：
  - 雷尼尔山 Grove of the Patriarchs 停车场（影响银瀑布）；
  - 大弯 Grapevine Hills Road（平衡石）；
  - 布莱斯 Bryce Connector Trail（Peekaboo Loop）；
  - 大盆地惠勒峰景观道冬季封路；
  - 圆顶礁国会峡谷土路。
  - 另外，冰川向阳大道 2026 年 10 月 9 日的提前关闭已补进季节性山路数据。
- **还没处理的**：见 `audit/2026-10-16/_followups.md`。主要有：
  - 北瀑布、奥林匹克、黄石、加州各园的施工延误和次要关闭；
  - lodging.ts 里大峡谷南缘住宿暂停、红杉营地季节；
  - 锡安 2026 年 6 月起取消隧道通行证，超尺寸车不能过隧道；
  - 德纳里的山名：NPS 2025 年起写 Mount McKinley，**要用户决定**。

## 7. 时区（10-16，进行中）

- 用户提醒：
  - 有的公园跨州、跨时区；
  - 有的项目按特定地区的时间计时，比如羚羊峡谷、佩吉；
  - 要提醒用户手机上的时区可能和实际不符。
- 现在每座公园只有一个 `timeZone`，在 `src/data/parks.ts`。
- 正在调研每座公园、每个项目按什么时间计时，任务说明见 [agent-briefs/08-time-zones.md](agent-briefs/08-time-zones.md)。调研完再改数据和界面：
  - 景点或项目单独标时区；
  - 行程里显示"按某地时间"，并提醒手机可能自动切换时区。

## 8. 用户的偏好（接手时注意）

- 用户用中文交流，在美国，Next.js 开发者，去过 7 座国家公园。
- 设计风格是纸色底、墨色字的杂志风，不要"AI 味"的默认 Tailwind 样式。
- 开发服务器只用预览工具启动（`.claude/launch.json` 里的 `nps-guide`），不要用后台 Bash 启动。
- 给用户的命令要能在任何目录下运行，比如用 `git -C` 或 `npm --prefix`。
- 改完界面要在浏览器里实际看过，从用户的角度确认。
- 不爬小红书。不登录任何网站，不替用户填写密钥或密码。
