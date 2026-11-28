# 11-27：线上审查 agent 一直没跑过：镜像少拷了软要求判分脚本（分支 `fix/docker-soft-check`）

- 怎么发现的：测新的对话界面时，本机网站连线上（Modal）的 Copilot 0.7.1，说“2027年6月10日从弗雷斯诺去优胜美地玩5天，中间留一天休息，每天开车别超过2小时，节奏适中”。规划 agent 摘出了 2 条要求，但回复里没有“按你说的排了……”，“这一步做了什么”里也没有审查 agent。线上 `/stats` 这一轮只有 3 次 Gemini 调用、没有出错；本机用 Gemini 跑同一句多一次审查 agent 的调用（放弃了“每天开车不超过 2 小时”：最后一天开回机场一定超过）。
- 原因：`team.grade` 用 Node 跑 `scripts/soft-check.mjs`（和评测同一个判分脚本），`copilot/Dockerfile` 只拷了 `plan-trip.mjs`、`lookup.mjs`。线上每次都报错，`pipeline.py` 把 `TeamError` 记进 trace 的 `team_error` 就跳过了，v0.7.0 起线上审查 agent 一次都没跑过。本机、CI 的测试和回放门禁都在整个仓库里跑，镜像的冒烟测试只排行程、查资料，所以没拦住。
- 做了什么：
  - Dockerfile 拷上 `scripts/soft-check.mjs`、`scripts/soft-check-lib.mjs`；`.dockerignore` 是白名单，两个也要放行（第一次推上去 CI 构建镜像报 not found，才发现）。
  - `copilot/tests/test_docker_files.py`：Copilot 代码里写在引号里拿去跑的 `scripts/*.mjs`，连同它们 `./` 引用的，都要在 Dockerfile 的 COPY 里、也要在 `.dockerignore` 的白名单里（少了哪个都失败）。
  - `copilot/scripts/smoke_team.py`：排一个行程，用判分脚本检查两条要求，要有结果；`ci.yml`、`copilot-staging.yml`、`release.yml` 构建镜像以后都在镜像里跑一次（不调模型）。
  - 版本号 0.7.2，`docs/releases/copilot-v0.7.2.md`（含 #137 的修复）。
- 验证：Copilot 541 个测试、十一组回放门禁、ruff 都过；`smoke_team.py` 在本机仓库里跑通（这台电脑没装 Docker，镜像里的那一次由 CI 验证）。
- 教训：线上和本机跑的东西不一样的地方（镜像里拷了什么），要有在镜像里真跑一次的冒烟测试；新功能调用新的脚本时，测试会提醒把它拷进镜像。
