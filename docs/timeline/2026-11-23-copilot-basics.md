# 11-23：线上试用查出的基础问题，回复下面写“这一步 Copilot 做了什么”，copilot-v0.7.1（分支 `fix/copilot-basics`）

- 为什么做：v0.7.0 上线、打开 search agent 以后，仓库主人在线上试了两段对话（“这个季节有什么推荐的公园 → 我想去加州的 → 我想去加州的国家公园”，英文“in this season, do you have any recommend? → I want to go to the Califonia's NP → I want to go to death valley → tomoroow → tomorrow → 5 → SFO → Even slower”），说“很基础的东西都不行”，也看不出 search agent 和多 agent 协作在哪里。按后台记录在本机用 35B-A3B 重放，复现了同样的问题。
- 查出来的：
  - “加州”认不出来：`knowledge.group_mention` 只认 4 座以内的片区（加州 8 座），后面还要紧跟“国家公园”；资料里只有中文州名；英文打错（Califonia）更认不出。英文那一轮回答“没收录”，还写着“52 座国家公园”（10-21 起是 64 座）。
  - 推荐完公园接着问“想去哪座”，没有选项，要自己再打一遍名字。
  - “tomoroow”不认，又问一遍日期。
  - search agent 其实在工作（两句季节问题都走了它，2 步、调了按季节比公园），但只记在后台；多 agent 只在有软要求时出场，这两段对话里没有软要求，所以什么也看不到。
- 改了什么：
  - `knowledge.py`：州、片区加上英文叫法和“德州、得州”（`GROUP_ALIASES`）；`group_mention(limit=)`：后面跟“国家公园 / 公园 / NP / parks”，或者前面是“去、玩、to、visit、in”的都算，“从加州出发”不算；英文按整个词认，6 个字母以上的允许打错一两个（相似度 0.85）；“都去”（`group_parks`）照旧只认 4 座以内。
  - `intake.py`：列出来让用户挑的最多 9 座；能排成一趟的才给“都去”；只有一座的直接定下来；“没收录”那句不写座数、提示可以按州说。
  - `pipeline.py`：`_offer_parks`：回答里推荐了 2 座以上的公园、接着要问去哪座时，把它们（最多 6 座，按出现的先后）列成选项；调度员那条路和原来那条路都加了。
  - `dates.py`：tomorrow 的常见打错（tomorow、tommorow、tomoroow、tmr、tmrw）。
  - 新的 `steps.py`：把每一轮的 trace 翻成给用户看的几步（调度员、search agent 或找一次就答、规划 agent、行程引擎、审查 agent、Critic、Writer），不调模型；`api.py` 的回复多了 `steps`；网站 `/api/copilot/chat` 转过去，`copilot-chat.tsx` 在每条回复下面列出来（调了模型的金色点、确定的代码白色点），标题“这一步 Copilot 做了什么” / “What the Copilot did”。
  - 行程页底下的小字把本机模型改成 Qwen3.5 35B-A3B。
  - 版本 0.7.1，`docs/releases/copilot-v0.7.1.md`。
- 验证：新加 `copilot/tests/test_steps.py`（州名、英文、打错、出发地不算、西弗吉尼亚不当成弗吉尼亚、tomorrow 打错、steps 的几种情况）；Copilot 538 个测试、十组回放门禁、ruff、网站 236 个测试、tsc、eslint 都过。本机用 35B-A3B 重放仓库主人的两段对话：加州（中英文）列出 8 座让点，tomoroow 认成明天，季节推荐以后列出死亡谷、大弯、约书亚树、巨人柱、瓜达卢佩山、白沙六个按钮；浏览器里看过行程页的对话框，带软要求的那句下面列出调度员、规划 agent（摘出 2 条）、行程引擎、审查 agent（商量 1 轮、做到 1/2）。
- 没做：缺的条件还是一样一样问（日期、天数、机场、节奏要 4 轮）；合在一起问会改动多轮对话评测的期望，另做。
