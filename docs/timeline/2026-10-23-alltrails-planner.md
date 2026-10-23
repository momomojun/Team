# 10-23：行程引擎用上 AllTrails（分支 `feature/alltrails-planner`）

- 为什么做：仓库主人说徒步是国家公园最重要的玩法，AllTrails 的数据加进来以后，要让排行程也用上（GOALS O72）。
- 挑步道：`generate-trip.ts` 的 `trailRanks`。先试了所有徒步都叠加 AllTrails 热度，网站测试挂了 3 个（峡谷地 Needles 的 Cave Spring、瓜达卢佩山 Dog Canyon 这种偏远小步道被抬高，西奥多·罗斯福 North Unit 被挤掉），回放评测挂了 3 组；改成只给还没有 Google 名次的徒步打分（补空缺）以后，网站测试 170 个、七组回放评测全过。用评价数不用 AllTrails 的热度分数：那个分数大多挤在 99 以上，有的明显不对。
- 核对：`npm run check:hikes`，报告在 `docs/archive/audit/2026-10-23/hikes-vs-alltrails.md`。65 条相差大：11 条多半对错了路线（雷丘步道对上 19.5 英里去 Junction Stock Camp 的长线、雨湖步道对上 McAlester Lake……），一批是同一个地方不同走法（雾径到弗纳尔瀑布 vs 弗纳尔 + 内华达瀑布环线），还有一批短步道我们写的只有 AllTrails 的一半（可能是把单程当往返，但 NPS 也有写“0.3 英里环线”的），要逐条按官方资料核对。
- 加进行程：徒步页每条 AllTrails 步道都有“加入行程”，网站没收录的存进行程的 `customStops`（`src/lib/custom-stops.ts`），车程借最近的已收录景点（`travel.ts` 的 `registerTravelProxy`）。浏览器里试过：锡安 Kolob 的 Double Arch via Middle Fork Taylor Creek 借到 Kolob 峡谷、补 7 分钟，估 3 小时 15 分，自动排进第 2 天、推荐住 St. George / Hurricane，详情里写明是 AllTrails 的步道、开放季节和许可证要自己查。
