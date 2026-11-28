# Copilot v0.7.2（2026-11-27）

只修问题的一版。

## 修了什么

- **审查 agent 在线上一直没跑过**：镜像（`copilot/Dockerfile`）只拷了排行程、查资料的两个 Node 脚本，没拷审查软要求用的 `scripts/soft-check.mjs`、`soft-check-lib.mjs`。线上每次检查“中间留一天休息”“每天开车别超过 2 小时”这类要求都报错、被代码吞掉，所以 v0.7.0 起线上只有规划 agent 在做事：回复里没有“按你说的排了……”“没能完全做到……”，“这一步做了什么”里也没有审查 agent。本机和 CI 用的是整个仓库，看不出来；11-27 用网站连线上 Copilot 测新的对话界面时发现的（线上这一轮只调了 3 次模型，本机同一句话会多调一次审查 agent）。现在拷进去了（Dockerfile 和 `.dockerignore` 的白名单都加上）；加了一条测试（Copilot 代码里拿去跑的 Node 脚本连同它们引用的，都要在 Dockerfile 和白名单里），CI、staging、发版构建镜像以后都在镜像里真跑一次软要求检查（`copilot/scripts/smoke_team.py`）。
- **说“带沙漠的国家公园”这一类公园时去查着推荐**（#137）：原来调度员当成给条件、只会再问一遍想去哪座，现在交给 search agent 推荐，推荐完的几座列成按钮。

## 怎么试

“2027年6月10日从弗雷斯诺去优胜美地玩5天，中间留一天休息，每天开车别超过2小时，节奏适中”：回复里应该有“按你说的排了：中间留一天休息”和“没能完全做到‘每天开车不超过 2 小时’”（最后一天开回机场一定超过 2 小时），“这一步做了什么”里有审查 agent。“那我要去带沙漠的国家公园”：应该直接推荐几座、列成按钮。

## 怎么用、回滚

```bash
COPILOT_TAG=copilot-v0.7.2 docker compose -f copilot/docker-compose.yml up -d
```

回滚到上一版：`COPILOT_TAG=copilot-v0.7.1`；Modal 上在 Actions 里手动跑 “Deploy Copilot to Modal”，tag 填 `copilot-v0.7.1`。

---

# Copilot v0.7.2 (2026-11-27)

A bug-fix release.

## Fixes

- **The review agent never ran in production**: the image (`copilot/Dockerfile`) copied only the two Node scripts for planning and lookups, not `scripts/soft-check.mjs` and `soft-check-lib.mjs`, which the review agent uses to check soft wishes. In production every check of a wish like "a rest day in the middle" or "no more than 2 hours of driving a day" failed and the error was swallowed, so since v0.7.0 only the planning agent did any work online: replies never said "Planned as you asked…" or "I couldn't fully manage…", and "What the Copilot did" never listed the review agent. Local runs and CI use the whole repository, so it didn't show; we found it on Nov 27 while testing the new chat UI against the production Copilot (that turn made only 3 model calls, while the same message locally makes one more for the review agent). The scripts are now copied (added to both the Dockerfile and the `.dockerignore` allowlist); a new test requires every Node script the Copilot code runs, plus the scripts they import, to be in the Dockerfile and the allowlist; and CI, staging and releases now run a real soft-wish check inside the built image (`copilot/scripts/smoke_team.py`).
- **Asking for a kind of park, like "national parks with desert", gets recommendations** (#137): the dispatcher used to treat it as trip details and just asked "which park?" again; now the search agent recommends parks and they become buttons.

## How to try it

"2027年6月10日从弗雷斯诺去优胜美地玩5天，中间留一天休息，每天开车别超过2小时，节奏适中" (Yosemite for 5 days from Fresno on June 10, 2027, a rest day in the middle, no more than 2 hours of driving a day, balanced pace): the reply should say the rest day was planned as asked and that the 2-hour cap couldn't be fully met (the last day's drive back to the airport is longer than 2 hours), and "What the Copilot did" should list the review agent. "那我要去带沙漠的国家公园" (I want a national park with desert): it should recommend a few parks as buttons.

## Use and rollback

```bash
COPILOT_TAG=copilot-v0.7.2 docker compose -f copilot/docker-compose.yml up -d
```

To roll back: `COPILOT_TAG=copilot-v0.7.1`; on Modal, run "Deploy Copilot to Modal" manually in Actions with the tag `copilot-v0.7.1`.
