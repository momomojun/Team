# 10-28：5 条步道的爬升按 NPS 官网重查（分支 `feature/fix-quality-issues`）

- 为什么做：海拔剖面做出来以后（O80），和资料比差得多的里面，有 5 条 AllTrails 和我们的剖面都比资料高得多，仓库主人让按 NPS 官网重查（O81）。
- 查出来：资料没有抄错，是 NPS 写的 Elevation Change（最高点和最低点的高差）被当成了累计爬升（`hike.gainFt`，页面上显示“爬升”）。切斯勒公园的 NPS 页面自己写了“Cumulative elevation gain on this route is much greater”。
- 改了：魔鬼花园原始步道环线 286 → 950 英尺（画出来的路线少了几条岔路，按 AllTrails）、双 O 拱门 275 → 530、切斯勒公园观景垭口 533 → 820、Balconies 洞穴与崖壁环线 100 → 410（按我们的高程剖面，往返的取去程、环线取一圈）。
- Tanque Verde 山脊步道（观景点）的爬升没错（NPS：“about 0.6 miles (roughly 100ft elevation)”），是景点的点放在了 1.3 英里外的山脊上，路线跟着画过去了。点挪到路线上 0.6 英里处，`UPDATE=sagu-tanque-verde-ridge npm run data:trails` 和 `npm run data:elevation` 只重算这一条（对过 main，生成文件里只有这一条变了）。
- 跟着跑了 `npm run copilot:contracts`（Copilot 回答问题用的资料里这 4 条的爬升变了）和 `npm run data:audit-index`。核对记录：`docs/archive/audit/2026-10-28/elevation-recheck.md`；DEVELOPMENT 的注意事项里写了 Elevation Change 和累计爬升的区别。
- 检查：网站 `npm test` 192 个、Copilot `pytest` 216 个、七组回放门禁全过，行程质量评测不变（最终通过率 100%、时间分 0.770）。
