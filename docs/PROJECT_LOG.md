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
- Time zones (Oct 16): attractions can carry their own zone, the planner converts local opening, tour, entry, and parking times into the day's zone (e.g. Page on Arizona time vs. Monument Valley on Navajo time in summer), day cards show local times and phone-switching warnings, and park pages get a "Time zone" block with official sources. Alberta's and B.C.'s 2026 permanent-time rules are patched in for outdated time zone data.
- Film spots grew from 27 to 51, each with a licensed Commons photo of the location; celebrity spots grew from 11 to 19 with every post link re-verified through public embeds.
- PR #3 (open): the fact audit, time zones, and the film and celebrity expansion. The last two audit groups will be added to it.
- **LLMOps status (Oct 16)**: another assistant built a careful local-model Intake experiment track (Qwen3 / Qwen3.5 4B on Ollama). The Copilot is not yet wired to the trip engine, and there is no CI/CD yet. The review and roadmap are in [LLMOPS_PLAN.md](LLMOPS_PLAN.md). Start there.

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
  - 第 10 节逐条对应老师的 4 个学习目标。
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
- **10-16 用户的新要求**：
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
- **10-16 结果**：
  - 电影同款从 27 条扩到 51 条（纪念碑谷 +9、死亡谷 +3、鲍威尔湖 +4、峡谷地 +2、班夫的韩剧《爱情怎么翻译？》2 条，锡安、白沙、恶地、拉什莫尔山各 1 条）。51 条都有专门挑的 Commons 实景照片（CC BY / CC BY-SA / CC0 / 公有领域），`npm run data:film-photos` 已生成。查过没收的片子和原因写在 `films.ts` 开头的注释里。
  - 明星同款从 11 条扩到 19 条：新增肯达尔·詹娜（优胜美地）、贾斯汀·比伯和海莉·比伯（路易斯湖）、布莱恩·克兰斯顿（路易斯湖、班夫温泉酒店）、入江陵介（马蹄湾）、渡部香生子（下羚羊峡谷）、麦莉·赛勒斯（鲍威尔湖）。原有 6 条带原帖链接的用 Instagram 的公开 embed 页核对过，都是本人认证账号、内容对得上，没有指错的；X 的 oEmbed 接口要付费，改用推特公开的嵌入接口核对。所有条目补了 `whoZh`。
  - 没到目标数量：这一轮会话的 WebSearch 额度（200 次，所有助手共用）用完了；中文娱乐新闻这个搜索引擎几乎搜不到，华语明星一条没找到。想继续扩充，可以开新会话，或者调高环境变量 `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`。
  - 新条目的英文正在写，任务说明见 [agent-briefs/09](agent-briefs/09-english-films-celebrities.md)。

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
    - 阿拉斯加：wrst、glba、katm、lacl、gaar、kova，**10-16 已核完**。重要的改动：冰川湾 Bartlett Lake 步道往返 8 英里（原来写 10 英里）、全天游船停 Margerie 或 Johns Hopkins 冰川；卡特迈、克拉克湖看熊团按 2026 年 10 月官网标价更新（`bookings.ts` 也同步了）；看熊团年龄限制按各家写的改；北极之门 Dalton 公路车程按 BLM 改长；科伯克谷遗产中心电话改成 907-318-2230；克拉克湖 Silver Salmon Creek 的莎草草甸 6 月 15 日到 9 月 15 日关闭写进了提示。
    - 园外名胜和新墨西哥、夏威夷：ante、hsbd、mova、wave、pefo、whsa、cave、havo、hale，**10-16 已核完**（提交 dda968e）。
    - 东部：acad、ever、bisc、drto、grsm，10-16 晚上在核。
    - 大平原和阿巴拉契亚：thro、badl、wica、shen、neri，10-16 晚上在核（thro 前一次做了一半，改动保留）。
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

## 7. 时区（10-16）

- 用户提醒：
  - 有的公园跨州、跨时区；
  - 有的项目按特定地区的时间计时，比如羚羊峡谷、佩吉；
  - 要提醒用户手机上的时区可能和实际不符。
- 现在每座公园只有一个 `timeZone`，在 `src/data/parks.ts`。
- 调研：每座公园、每个项目按什么时间计时，任务说明见 [agent-briefs/08-time-zones.md](agent-briefs/08-time-zones.md)，结果（带官方原话和来源）在 [audit/2026-10-16/timezones.md](audit/2026-10-16/timezones.md)。59 个公园的 `timeZone` 都对；园内要单独标的是西奥多·罗斯福 North Unit（中部时间）和贾斯珀旁边 BC 省的罗布森山。
- 做了什么：
  - **景点可以单独写时区**（`Attraction.timeZone`）：North Unit 的 5 个景点是 `America/Chicago`，罗布森山是 `America/Vancouver`。
  - **排行程按时区换算**（`src/lib/time-zone.ts`、`planner.ts` 的 `localShifts`）：一天的时间按当天第一站的时区写，别的时区的景点写的开门、班次、入场、停车场时间先换算过来。比如夏天从佩吉（亚利桑那时间）去纪念碑谷（纳瓦霍时间，快 1 小时），Valley Drive 当地 15:30 最晚入场，在行程里就是 14:30。日出日落的窗口带上它的时区（`SunWindow.zone`），自动生成攻略也一样。
  - **行程页**：别的时区的景点在时间下面写“当地 15:25”，并说明比这天快 / 慢几小时；这天跨时区的，卡片上写“这天的时间都按某某时间写”；第一次去某座公园的那天，列出这座公园时区的坑（`src/data/time-notes.ts`：羚羊峡谷各家导览按亚利桑那时间、手机常跳成犹他时间，纪念碑谷是纳瓦霍时间，波浪谷抽签按犹他时间、领证按当地时间，瓜达卢佩山手机常显示中部时间，大盆地 Lehman Caves 按太平洋时间，大弯 Boquillas，冰川和加拿大落基山 2026 年 11 月的变化……）。只在夏令时才有差别的，冬天的行程不提。
  - **公园页**新增“时区”：叫什么时间、调不调夏令时，加上这座公园的时区提醒和官方来源。
  - **艾伯塔、BC 的新规则**：BC 省 2026 年 3 月起全年 UTC-7，艾伯塔 11 月 1 日起全年 UTC-6。Node 24 和很多浏览器的时区数据（2025b）还没有这两条，`time-zone.ts` 里手动补上（日出日落、行程都用它）。
  - 改正：贾斯珀到罗布森山、Valemount 原来写“冬季差 2 小时”，其实一年到头都差 1 小时（中英文都改了）。
  - 测试：`tests/time-zone.test.ts`（`park-zones.ts` 和 `parks.ts` 一致、佩吉到纪念碑谷的换算、North Unit、艾伯塔和 BC）。

## 8. LLMOps：现状评估和下一步（10-16）

- 另一个助手在 `experiments/local-model-validation/` 做了本地模型的 Intake 实验（V1、V2、V3、Qwen3 4B 对 Qwen3.5 4B），记录在 [LLMOPS_WORK_LOG.md](LLMOPS_WORK_LOG.md)。
- 评估和分阶段计划写在 **[LLMOPS_PLAN.md](LLMOPS_PLAN.md)**：做得好的（实验规范、职责划分、全部本地）、要改的（只做了 Intake、没有 CI/CD、字段和网站的 `WizardInput` 没对齐、只支持 3 座公园、样本少、几个状态机 bug），以及下一步（契约和 `plan_trip` 工具 → 最小 Copilot → GitHub Actions 和回放评测门禁 → 150 条评测集和对照实验 → 接进网站）。

## 9. 搜索额度（10-16）

- 这一轮的 WebSearch 额度用完了。Claude Code 每个会话最多 200 次 WebSearch，主对话和所有子助手共用一个计数；这次同时开了好几个助手（事实核对、电影、明星、时区），每个都要搜很多次，所以很快用完。
- 怎么增加（官方文档 code.claude.com/docs/en/tools-reference.md 的 Session search limit、env-vars.md）：
  - 环境变量 `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` 调高上限（正整数，没有上限，不能关掉）；可以写在 `~/.claude/settings.json` 的 `env` 里，设好后重启 Claude Code；
  - 在 Claude Code 里运行 `/clear` 会把计数清零；新版本（v2.1.290 以后）额度每小时大约回补 100 次（`CLAUDE_CODE_WEB_SEARCH_REFILLS_PER_HOUR` 可调）。
  - 用 API 计费的话，网页搜索按每 1,000 次 $10 另算。
- 额度用完后助手改用 WebFetch 直接打开官方页面（不受这个额度限制），能核对已知网址，但找不到新的资料（比如新的明星帖子）。
- 10-16 用户让把上限加到 500：已写进 `C:\Users\ZJ\.claude\settings.json` 的 `env`（`CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION=500`），**重启 Claude Code 之后才生效**。
- **用户要求的交接规则**：额度快用完之前（一个会话大约用到 400 次，或者第一次碰到额度报错），不再开新的调研，先把交接写好：
  - 做完了什么、还剩什么、文件在哪，写进本文件；没做完的任务说明留在 `docs/agent-briefs/`；
  - 交给助手的调研任务都要求“每做完一项马上写记录”（比如每座公园一个核对记录），中途停下也不丢东西；
  - 同时开的调研助手控制在 2–3 个，共用的额度能撑更久。

### 当前交接状态（10-16 晚）

- PR #3（`feature/fact-audit`）已开：事实核对 48 座、时区、电影 51 处和明星 19 条、交接文档。
- 还在跑的：东部 5 座（acad ever bisc drto grsm）和大平原、阿巴拉契亚 5 座（thro badl wica shen neri）的事实核对。任务说明是 [agent-briefs/05-fact-audit.md](agent-briefs/05-fact-audit.md)；每座公园的记录先写在会话的临时目录里，做完复制到 `docs/audit/2026-10-16/`。如果助手中途停了：`git diff` 看哪些公园已经改了（`src/data/attractions/<代码>.ts`、`src/i18n/en/content/attractions-<代码>.ts`），没改的公园按同一份任务说明重新派。
- 想继续扩充明星、电影同款：开新会话（额度已经加到 500），按 [agent-briefs/07](agent-briefs/07-celebrity-spots-v2.md)、[06](agent-briefs/06-film-locations-v2.md) 继续；新条目的英文按 [09](agent-briefs/09-english-films-celebrities.md) 写。
- LLMOps 的下一步见 [LLMOPS_PLAN.md](LLMOPS_PLAN.md) 第 2 节，从阶段 1（契约和 `plan_trip` 工具）开始。

## 10. 用户的偏好（接手时注意）

- 用户用中文交流，在美国，Next.js 开发者，去过 7 座国家公园。
- 设计风格是纸色底、墨色字的杂志风，不要"AI 味"的默认 Tailwind 样式。
- 开发服务器只用预览工具启动（`.claude/launch.json` 里的 `nps-guide`），不要用后台 Bash 启动。
- 给用户的命令要能在任何目录下运行，比如用 `git -C` 或 `npm --prefix`。
- 改完界面要在浏览器里实际看过，从用户的角度确认。
- 不爬小红书。不登录任何网站，不替用户填写密钥或密码。
