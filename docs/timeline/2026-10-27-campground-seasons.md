# 10-27：营地开放季节写入 lodging-seasons（分支 `feature/campground-seasons`）

- 为什么做：10-19 审 PR #26 发现营地没有开放季节，1 月选“露营”会排进火山口湖 Mazama、雷尼尔山 Cougar Rock、落基山 Glacier Basin、黄石 Slough Creek 等夏季营地；任务说明 [archive/agent-briefs/10-campground-seasons.md](../archive/agent-briefs/10-campground-seasons.md)。
- 做了什么：在 `src/data/lodging-seasons.ts` 加了约 85 条季节性营地（NPS campgrounds / Operating Hours、特许经营商页，核对日 2026-10-26）；全年开的不写。加 `tests/campground-seasons.test.ts`（1 月不排关门营地、7 月照排、id 校验）；顺手删掉 `price-center.tsx` 未用的 `pickupNotes` 导入。更新 DEVELOPMENT / GOALS / PROJECT。
- 没写/估的：Lost Creek、Colter Bay marina end-ties 等查不到可靠日期的；冰川、拉森、红杉与国王峡谷、雪兰多、海峡群岛等只写到月份的按估计并在注释标明。预约页条目少时的空白排版（brief 另一件）本 PR 没做。
