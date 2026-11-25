# Copilot v0.7.1（2026-11-23）

只修问题的一版。v0.7.0 当天上线以后，仓库主人在线上试了几句，说“很基础的东西都不行”，也看不出 search agent 和多 agent 协作在哪里。

## 修了什么

- **按州、片区说公园**：“我想去加州的”“我想去加州的国家公园”“I want to go to the Califonia's NP”原来认不出来（只认 4 座以内的片区、没有英文州名、打错一个字母就不认），只会再问一遍“想去哪座国家公园”，英文还回答“没收录”。现在按州、片区列出网站上的公园让用户点（最多 9 座；能排成一趟的才给“都去”），英文州名、常见打错的都认；“从加州出发”不算。片区里只有一座的直接定下来。
- **推荐完公园可以直接点**：回答“这个季节去哪好”以后接着问“想去哪座”，原来没有选项，现在把刚推荐的几座（最多 6 座）列成按钮。
- **tomorrow 打错也认**：tomoroow、tomorow、tommorow、tmr、tmrw。
- **“没收录”那句写死了 52 座**：网站 10-21 起已经是美国全部 64 座，改成不写座数，并提示可以按州说。
- **每条回复下面写“这一步 Copilot 做了什么”**：调度员判断这句话要干什么、search agent 自己查了哪些（几步）、规划 agent 从话里摘出了哪几条要求（没有就写“没有特别的要求，按常规排”）、行程引擎排了几天（不用模型）、审查 agent 商量了几轮、做到几条。调了模型的步骤是金色的点，确定的代码是白色的点。Copilot 的回复多了 `steps` 字段，网站对话框显示出来。
- 行程页底下的小字把本机模型改成 Qwen3.5 35B-A3B。
- **换公园不再清掉条件**：排好以后说“换成布莱斯吧”“let's do Bryce Canyon instead”，原来会被当成重新开始，日期、天数、出发地、节奏全清掉；现在只换公园。
- **第 11 道门槛：真实说法的多轮对话**（`live-v1`，20 段、中英各半，含 11-23 线上试的两段原话），回放的是 Gemini（线上模型）录的回答，不是本机 4B 的。Gemini 第一次 19/20，修了上一条以后 20/20。

## 怎么试

多 agent 只在说了软要求时才出场，可以这样说：“2027 年 6 月 10 日从弗雷斯诺去优胜美地玩 5 天，中间留一天休息，每天开车别超过 2 小时，节奏适中”。回复下面会写规划 agent 摘出的 2 条、审查 agent 商量了几轮。search agent：问“这个季节有什么推荐的公园”。

## 怎么用、回滚

```bash
COPILOT_TAG=copilot-v0.7.1 docker compose -f copilot/docker-compose.yml up -d
```

回滚到上一版：`COPILOT_TAG=copilot-v0.7.0`；Modal 上在 Actions 里手动跑 “Deploy Copilot to Modal”，tag 填 `copilot-v0.7.0`。

---

# Copilot v0.7.1 (2026-11-23)

A bug-fix release. After v0.7.0 went live the same day, the owner tried a few messages in production, said "even basic things don't work", and couldn't see where the search agent and multi-agent planning came in.

## Fixes

- **Parks by state or region**: "我想去加州的", "我想去加州的国家公园" and "I want to go to the Califonia's NP" weren't recognized (only regions with at most 4 parks counted, there were no English state names, and one wrong letter broke it), so the Copilot asked "which park?" again, and in English said the place wasn't covered. Now it lists the site's parks in that state or region for the user to tap (up to 9; "All of them" only when they fit in one trip), recognizes English state names and common misspellings, and ignores "from California". A region with a single park is chosen directly.
- **Tap a recommended park**: after answering "where should I go this season", the follow-up "which park?" had no options; it now offers the parks just recommended (up to 6) as buttons.
- **Misspelled "tomorrow"**: tomoroow, tomorow, tommorow, tmr and tmrw are recognized.
- **"Not covered" said 52 parks**: the site has had all 64 U.S. national parks since Oct 21; the message no longer states a count and suggests naming a state.
- **"What the Copilot did" under every reply**: what the dispatcher decided the message was, what the search agent looked up (and in how many steps), which wishes the planning agent found (or "no special wishes, planning as usual"), how many days the trip planner planned (no model), and how many rounds the review agent negotiated and how many wishes were met. Steps that called a model have a gold dot, deterministic code a white one. Copilot replies gain a `steps` field, which the site's chat box shows.
- The small print under the trip page's chat now names the local model as Qwen3.5 35B-A3B.
- **Swapping parks keeps the other details**: "换成布莱斯吧" or "let's do Bryce Canyon instead" after a plan used to be treated as a restart that wiped the date, days, origin and pace; now only the park changes.
- **An 11th gate for real user phrasing** (`live-v1`, 20 conversations, half Chinese and half English, including the two tried in production on Nov 23), replaying answers recorded with Gemini (the production model) rather than local 4B. Gemini scored 19/20 on the first run and 20/20 after the fix above.

## How to try it

Multi-agent planning only comes in when there are soft wishes, for example: "2027 年 6 月 10 日从弗雷斯诺去优胜美地玩 5 天，中间留一天休息，每天开车别超过 2 小时，节奏适中" (Yosemite for 5 days from Fresno on June 10, 2027, a rest day in the middle, no more than 2 hours of driving a day, balanced pace). The reply then lists the 2 wishes the planning agent found and how many rounds the review agent took. For the search agent, ask "这个季节有什么推荐的公园" (which parks are good this season).

## Use and rollback

```bash
COPILOT_TAG=copilot-v0.7.1 docker compose -f copilot/docker-compose.yml up -d
```

To roll back: `COPILOT_TAG=copilot-v0.7.0`; on Modal, run "Deploy Copilot to Modal" manually in Actions with the tag `copilot-v0.7.0`.
