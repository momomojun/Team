# 10-28：步道只看 AllTrails，不再用 Google Maps 的数据（分支 `feature/trails-alltrails-only`）

- 为什么做：仓库主人说“步道全面采用 AllTrails 的数据，不需要依靠 Google Maps”（O82）。原来徒步的卡片上显示 Google 评分、热度名次按 Google 评论数（和观景点一起排），只有自动生成攻略挑步道时看 AllTrails；对错路线的步道在徒步页上还会显示别的路线的数字（Tanque Verde 观景点步道来回 1.2 英里、爬升 100 英尺，页面上是 8.5 公里、爬升 460 米）。
- 数据：`src/data/attractions/index.ts` 里徒步（356 个）不挂 Google 的评分、评论数，`hotRank` 只在非徒步之间排；对错路线的 11 条（`alltrails-doubtful.generated.ts`，9 条徒步加 Laurel Falls、Pola Island）连 AllTrails 也不挂，徒步页榜单里去掉和它们的对应。生成文件和 `google.ts` 都没改。
- 名次：新的 `src/lib/popularity.ts`：`popularRank` 徒步取 AllTrails 的 `hikeRank`、别的取 Google 的 `hotRank`；`byPopularity` 按热度排时两边名次交替（景点第 1、步道第 1、景点第 2……）。景点页“按热度”、公园概览的亮点、行程页（每站的名次和评分、去不了的热门景点、要注意的排序）、Copilot 的查景点、两个评测脚本里的“有名”都换成它。
- 页面：景点卡片和行程里的景点详情，徒步显示“步道热度第 n · AllTrails ★评分 · 评价数”，加了 AllTrails 链接（对上了直达，没对上就搜）；没对上的不显示评分。资料出处里徒步写“AllTrails 步道的评分、评价数和热度”。徒步页（`src/lib/hike-rows.ts`）在 AllTrails 榜单后面补上网站收录、榜单里没有的徒步（47 条，其中 17 条没对上或对错路线，按我们自己的距离、爬升、难度列、不写评分）；原来没有榜单的公园给的假评分 4.5、热度 10 去掉了。Google Maps 的位置、导航链接都留着。
- 自动生成攻略：没对上 AllTrails 或对错路线的徒步不再拿 Google 名次补，按园内步道的中间名次算（权重的一半，`UNKNOWN_TRAIL_SHARE`），必去、当月最佳照样加分；“必去或热度前 5 却没时间排”按新的名次算。
- 检查：网站 `npm test` 195 个（新加 `tests/trails-alltrails-only.test.ts`；`tests/alltrails.test.ts` 对上的下限 415 → 404，少的就是对错路线不挂的 11 条）、Copilot `pytest` 216 个、单句三组和读公告的回放门禁过了。行程质量评测在门禁里（时间 0.769 → 0.767、空间 0.997 → 0.998、顺序 0.977 → 0.973，基线没改）。真实行程评测：覆盖 0.669 → 0.677；有名景点覆盖 0.864 → 0.816，是“有名”的定义变了（景点、步道各算前 5，真人行程里有名的从 243 个变成 272 个），按原来的定义算还是 0.864，基线跟着改了（`tests/fixtures/real-routes/baseline.json` 的 note 里写了）。
- 没做完：Copilot 多轮对话的三组回放门禁（conversation v1、v2、v3）没过，报“回放记录里没有这次调用”：排出的行程变了，后面几轮发给模型的对话跟着变了，要用本机模型重新录。
