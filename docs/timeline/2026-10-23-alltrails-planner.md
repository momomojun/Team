# 10-23：行程引擎用上 AllTrails（分支 `feature/alltrails-planner`）

- 为什么做：仓库主人说徒步是国家公园最重要的玩法，AllTrails 的数据加进来以后，要让排行程也用上（GOALS O72）。
- 挑步道：`generate-trip.ts` 的 `trailRanks`。第一版把 AllTrails 热度叠加在 Google 名次上，网站测试挂了 3 个、回放评测挂了 3 组；第二版改成只给还没有 Google 名次的徒步补空缺，测试全过，但仓库主人指出逻辑不对：雾径 AllTrails 上 2.76 万条评价、优胜美地徒步第一，Google 上只有 320 条、园内排第 16，真正走步道的人用 AllTrails。第三版（最终）：徒步只看 AllTrails 评价数在园内徒步里的排名（分量和 Google 名次一样，评分高低再加减一点），别的景点、没对上或对错了的徒步照旧看 Google。用评价数不用 AllTrails 的热度分数：那个分数大多挤在 99 以上。
- 测试：原来的三个测试断言的是具体景点（峡谷地 Needles 的 Cave Spring 不排、冰川 Bowman Lake 在“离其他景点太远”里、瓜达卢佩山 Dog Canyon 不排），换了热度来源以后改成断言本意：Cave Spring 还是不专门绕路，去 Needles 的那天一定有 Chesler Park（AllTrails 上 Needles 最热门的步道，值得专门去）；Bowman Lake 不排、原因是离其他景点太远；Dog Canyon 不排。改了挑选结果，三组多轮对话回放评测的录音对不上了，用本机 Qwen3.5 4B 重新录了一遍。
- 前后对比（同样的输入）：优胜美地 6 月 4 天从弗雷斯诺进出多了 Hetch Hetchy 的步道；锡安 3 天多了 Observation Point；冰川没变。
- 核对：`npm run check:hikes`，报告在 `docs/archive/audit/2026-10-23/hikes-vs-alltrails.md`。65 条相差大：11 条多半对错了路线（雷丘步道对上 19.5 英里去 Junction Stock Camp 的长线、雨湖步道对上 McAlester Lake……），一批是同一个地方不同走法（雾径到弗纳尔瀑布 vs 弗纳尔 + 内华达瀑布环线），还有一批短步道我们写的只有 AllTrails 的一半（可能是把单程当往返，但 NPS 也有写“0.3 英里环线”的），要逐条按官方资料核对。
- 加进行程：徒步页每条 AllTrails 步道都有“加入行程”，网站没收录的存进行程的 `customStops`（`src/lib/custom-stops.ts`），车程借最近的已收录景点（`travel.ts` 的 `registerTravelProxy`）。浏览器里试过：锡安 Kolob 的 Double Arch via Middle Fork Taylor Creek 借到 Kolob 峡谷、补 7 分钟，估 3 小时 15 分，自动排进第 2 天、推荐住 St. George / Hurricane，详情里写明是 AllTrails 的步道、开放季节和许可证要自己查。
