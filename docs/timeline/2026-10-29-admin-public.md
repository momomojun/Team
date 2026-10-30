# 10-29：线上的后台和本机一样，看得到计费（分支 `fix/admin-public`）

- 为什么做：仓库主人打开 https://team-peach-five.vercel.app/zh-Hans/admin 什么都没有，说“线上也显示计费等事情，不需要隐藏，保持线下和线上一致”。原因有两个：
  - Vercel 上没设 `SITE_PASSWORD`，`/api/copilot/admin` 为了不露出“最近的对话”里的用户原话，整个返回 404；
  - 本机的总账（10-28 评测的 411 次）只在这台电脑上，线上本来就读不到。
- 改了什么：
  - 后台接口不再因为没设访问密码返回 404，线上和本机给的一样（包括最近的对话，仓库主人定的）。
  - `copilot/nps_copilot/publish.py`：把这台机器最近 90 天的计费汇总（每天、谁调用的、哪个模型的次数、token、花费；没有原话、没有 key）推到 `data/alerts-live` 分支的 `usage-local.json`，每台机器一份（`ledger.machine()`，电脑名的 hash），只换自己那一份，没变就不推。命令 `python -m nps_copilot billing --publish`；`start.cmd` 开的服务设了 `COPILOT_PUBLISH_USAGE=1`，每小时发一次。
  - 后台把本机服务的总账、各台机器发上来的、每晚读公告的加起来；开着的服务就是发上来的那台时用服务里的（更新），不重复算。
  - GitHub 接口（不登录每个 IP 每小时 60 次，Vercel 的出口 IP 共用）被限流时，原来整个 `nightly` 变空、连 raw 文件里的计费也丢了；现在只是没有 runs、issues，计费照样读，1 分钟后再试。
  - 顺手修了表头有两个“上限”时 React 报 key 重复。
- 第一次发布：411 次调用（机器 77add44f）。本机打开后台、Copilot 服务不开（和线上一样）能看到一共 421 次（加上每晚读公告的 10 次 Gemini），实际付的 $0.02，估算 $0.05。
- 检查：Copilot `pytest` 444 个全过（新加 `test_publish.py`，用本机的空 git 仓库测推送和没变不推），`tsc`、`eslint` 没报错。
