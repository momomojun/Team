# 10-16 核对遗留项复查（2026-10-20）

复查 [2026-10-16/_followups.md](../2026-10-16/_followups.md) 里“还没处理”和“拿不准”的几项。每项写：官方页面现在怎么说、页面的更新日期、10-20 还适不适用、网站数据建议怎么改。只写报告，没改代码和数据。

说明：
- “建议”里的景点 id 都在 `src/data/attractions/<公园>.ts` 里查过；closures.ts 的条目格式照现有的写（`checked` 一律 2026-10-20）。
- web.archive.org 这次抓不到（工具不让访问），所以“已经关了的路具体哪天关的”只能按 NPS 页面和新闻稿写，查不到的写明查不到。

## 雷尼尔山 mora

来源：
- 路况页 https://www.nps.gov/mora/planyourvisit/road-status.htm （Last updated: October 19, 2026）
- Current Conditions https://www.nps.gov/mora/planyourvisit/conditions.htm （Last updated: October 19, 2026）
- 步道状况页 https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm （Last updated: October 16, 2026）
- WTA 10-08 的转述（日期出自公园）：https://www.wta.org/news/signpost/hiker-headlines-last-call-for-photo-contest-free-day-mount-rainier-winter-road-closure-dates-10-8-26

| 路 | 10-08 公园公布的计划日 | 10-19 路况页 | 10-20 适用吗 |
|---|---|---|---|
| Paradise Valley Road | 10-19 | CLOSED for the season | 关了。页面没写哪天关，按计划日和页面 10-19 更新，应是 10-19 |
| Ricksecker Point Road | 10-20 | OPEN，scheduled to close October 20（date subject to change） | 今天按计划关，还没看到关了的更新 |
| Stevens Canyon Road | 10-26 | OPEN，scheduled to close October 26 | 还开着 |
| White River Road（到营地） | 10-26 | CLOSED for the season | 已经提前关了。页面没写哪天；没找到提前关的新闻稿（2024 年是因人手 10-14 关的，chronline 报道）。具体日期查不到 |
| Sunrise Road | 已关（山火） | CLOSED for the season | 关着，数据里 2026 年已写 08-07 |
| SR 410 Chinook / SR 123 Cayuse | — | OPEN，预计 11 月中下旬关，看天气 | 开着 |
| Carbon River Road、Mowich Lake Road | — | CLOSED（SR 165 Fairfax 桥），没有重开日期 | 关着，网站原来就没收录这两处 |
| SR 706（园外） | — | 10 月 19 日那周铺路，具体日子未定，可能延误 | 适用；另见下面 10-23 夜间全封 |

NPS 公告（alerts 接口，10-19、10-20）补充：
- “Winter Season Closures”（10-19）：“The following regular winter season road closures are in place: Paradise Valley Road, White River Road, & Sunrise Road.” 封着的路没施工时可以骑车。
- “WILDFIRE CLOSURES”（10-19）：Grand Park 一带、Northern Loop Trail、Wonderland Trail 从 Carbon River 吊桥到 Frozen Lake 关闭，until further notice；“White River & Sunrise Roads have closed for the winter season.”
- “Fryingpan Creek Bridge Replacement Project”（10-19）：Summerland 步道口在 Fryingpan Creek 桥处关闭，**施工到 2029 年**，行人不能沿 White River Road 走过封闭区，骑车可以。（10-16 记的“到 2029”有了官方出处：https://www.nps.gov/mora/planyourvisit/park-construction.htm#fryingpan-creek-bridge ）
- “Overnight closure of SR 706 on October 23”（10-20）：园外 SR 706 从 Kernahan Road East 到 Nisqually 入口 **10-23（周五）21:00 到 10-24 6:00 全封**换涵洞，这段时间进不了 Nisqually 入口，去 Paradise 要走东边 SR 123 的 Stevens Canyon 入口（WSDOT 新闻稿 https://wsdot.wa.gov/about/news/2026/round-2-overnight-closure-sr-706-near-mount-rainier-national-park-friday-oct-23 ）。只是一个晚上，closures.ts 按天算，不加；行程页两周内出发的会显示这条公告。
- White River Road 哪天关的，公告也没写。

步道和停车场：
- Grove of the Patriarchs 停车场：步道状况页（10-16）写 “Parking lot closed starting October 5, 2026”，Eastside Trail 一栏也写停 Cowlitz Divide 往南走；但 Current Conditions（10-19）写停车场和厕所 “Normal seasonal access”。两页矛盾。步道状况页更细、更新晚于 10-05 并专门写了日期，closures.ts 里 `mora-silver-falls` 那条保留。另外步道状况页 10-16 写 Ohanapecosh 一侧的步道口 2026 年因施工关闭，Silver Falls 不能走成环线，只能两岸各自往返——和现有 reasonZh 的意思一致。
- 换桥：conditions.htm（10-19）写 “Construction is scheduled to begin in 2028”。10-16 时 ohanapecosh.htm 写 2027 夏。按 conditions.htm 统一成 2028 年开工。
- Fryingpan Creek（Summerland）停车场：步道状况页写 “will be closed starting 10/1/2026”，因施工；公告写施工到 2029 年（见上）。网站没有从这里出发的景点。
- Mt. Fremont Trail、Grand Park 一带：“CLOSED due to Grand Park 2 Fire until further notice”（10-16）；Wonderland Trail Carbon River 到 Summerland 一段关闭。
- Myrtle Falls 施工：这几页都没提，仍拿不准。

建议：
1. **roads FIXES / roads-manual.json 现在不改。** 数据里的两条雷尼尔山季节路是 `mora-sunrise-road`（2026 已写 07-04 开、08-07 关）和 `mora-stevens-canyon-road`（2026 只有 05-22 开）。Stevens Canyon Road 计划 10-26 关，还没关，等关了再在 roads-manual.json 的 `mora-stevens-canyon-road` 把 2026 行改成 `[2026,"05-22","10-26"]`（以实际关的那天为准），来源写路况页当天的更新。Paradise Valley Road、Ricksecker Point Road、White River Road 下段都不在 roads.ts 里，不用补。
2. closures.ts 的 `mora-silver-falls`：保留，`checked` 改成 2026-10-20；reasonZh 可以补一句“Ohanapecosh 一侧的步道口 2026 年施工关闭，不能走成环线”。
3. 换桥年份：`mora-silver-falls` 的提示已经写“计划 2028 年开工”，和 conditions.htm 一致，parks.ts 里没有 2027 的说法，不用改。
4. `mora-fremont-lookout`：维持关闭说明（Grand Park 2 山火，until further notice）。

## 北瀑布 noca

来源：
- Current Conditions https://www.nps.gov/noca/planyourvisit/conditions.htm （Last updated: May 15, 2025，只是目录页，没有具体内容）
- 步道状况 https://www.nps.gov/noca/planyourvisit/trail-conditions.htm （Last updated: October 14, 2026）
- 山火关闭 https://www.nps.gov/noca/planyourvisit/fire-closures.htm （Last updated: October 6, 2026）
- road-status.htm 现在是 404。WSDOT 的山口实时页这次没读出内容，20 号公路今天开没开没核到（按往年 11 月下旬到 12 月初才封）。

逐项：
- **20 号公路、Cascade River Road 的说法统一**：已经统一了。`noca.ts` 文件头和各景点的 closedNote 都写“通常 11 月下旬到 12 月初封路、次年 4 月或 5 月初开通”“Cascade River Road 一般 6 月底才通到步道口（大雪年份 7 月初）”。步道状况页（10-14）写 Cascade River Road “typically does not open to the Cascade Pass Trailhead until July 1”，和现有说法不冲突。不用改。
- **山火关闭**（10-06）：Border 2（整个 Hozomeen 区、Willow Lake、Hozomeen Lake、Desolation Lookout 等步道）、Luna（Big Beaver Trail 从 Big Beaver Stock Camp 到 Stillwell Camp）、Sisi（Agnes Gorge Trail、PCT Agnes Creek 段 10-07 起关、Company Creek Trail）都写着 until further notice。网站没有这些地方的景点。不改。
- **USFS Ptarmigan Fire 到 10-31**：NPS 页面没提，在国家森林里，网站没有对应景点。不改。
- **Stehekin Valley Road、Golden West 游客中心**：步道状况页只写 6-24 Bridge Creek 到 Cottonwood 一段旧路清理过、“rough but passable”，Stehekin 洪水更新页另见；网站没有 Stehekin 的景点，Golden West 也没收。不改。
- **Hidden Lake / Sibley Creek 路**：步道状况页写 Hidden Lakes Road 冬季洪水冲坏，Sibley Creek 附近约 2 英里处有大冲口，建议四驱或高底盘车（没写日期）。网站没有这条步道。不改。
- **Cascade River Road 养护延误**（NPS 公告，lastIndexed 10-20）：10-13 起 Eldorado（MP 20，步道口前 3 英里）以后的路段可能延误。`noca-cascade-pass` 可以加 tip：“2026 年 10 月中旬起 Cascade River Road 最后 3 英里（MP 20 以后）养护，可能要等”。季末前很快就不用了，不加也行。
- **Cascade Pass**：10-14 Basin Creek 桥已拆（在山口另一侧，往 Stehekin 方向，不影响到山口的往返）；9-29 高处有压实的雪和冰。`noca-cascade-pass` 的 closedNote 已写“10 月下旬开始下雪”，不改。

拿不准的三项：
- **迪亚布洛湖步道能不能坐渡轮回来**：查清楚了，不能。NPS 步道状况页（4-30 的条目）写 “It is an out-and-back trail, so you must return the way you came”；Ross Lake Resort 的 Getting Here 页写渡轮（Seattle City Light Diablo Ferry，每天 10:30、14:00）要有度假村的装备租赁、水上出租车或木屋预订才能订，并且 “If you are renting equipment or hiking for the day, you will take the 1 mile Ross Dam trail, rather than the Diablo Ferry”（https://www.rosslakeresort.com/getting-here ，页脚 ©2021，班次可能旧，但只给住客的规则是明确的）。
  - 建议：`noca-diablo-lake-trail` 第二条 tip 换成“这是往返步道，到 Ross 大坝下的吊桥后原路返回；湖上的 Diablo 渡轮只载 Ross Lake Resort 的住客，一日徒步坐不了”，英文表跟着用 rekey-zh.py 改；如果 `src/data/suitability/noca.ts` 里也写了坐渡轮回来，一起改。7.6 英里往返、270 分钟本来就是按往返算的，不用动。
- **雷丘步道难度**：NPS 写 “moderate climb”，数据是 easy、summary 写“坡度平缓”。3.8 英里、680 英尺，按网站别处的标准接近 easy/moderate 的边界。建议改成 `difficulty: "moderate"`，summary 的“坡度平缓”改成“坡度不大”（官方说法优先）。季节性木桥：步道状况页只写 4-24 装好，还是没有拆桥日期，现有“大约 11 月到次年 4 月没有桥、以 NPS 步道状况为准”保留。
- **华盛顿山口观景台**：NPS 无障碍页（约 9 年前的旧页）写 “Snow covers this area until early-July”、停车要 Northwest Forest Pass；USFS 现在的 Washington Pass Observation Site 页写不收费（https://www.fs.usda.gov/r06/okanogan-wenatchee/recreation/washington-pass-observation-site ）。按管理方 USFS 的新页面，**不加停车费**。雪的说法：tips 写“支路常要到 5–6 月雪化了才开”，NPS 旧页说到 7 月初。建议改成“支路常要到 6 月甚至 7 月初雪化了才开”，更保守。

## 奥林匹克 olym

来源：
- Current Conditions https://www.nps.gov/olym/planyourvisit/conditions.htm （Last updated: October 17, 2026）
- Hurricane Ridge in Winter https://www.nps.gov/olym/planyourvisit/hurricane-ridge-in-winter.htm （Last updated: April 4, 2026）
- Visiting Hurricane Ridge https://www.nps.gov/olym/planyourvisit/visiting-hurricane-ridge.htm （Last updated: May 26, 2026）

逐项（10-17 的 Current Conditions）：
- **Elwha：Olympic Hot Springs Road 在 Madison Falls 停车场处因路基冲毁禁止车辆**，行人、骑车、牵狗还能进。仍适用。网站没有 Elwha 的景点（Madison Falls 没收）。不改。
- **Staircase**：开发区开放（Staircase Rapids Loop、营地、护林站），其他步道全关（看 Fire Conditions）。仍适用。网站没有 Staircase 的景点。不改。
- **飓风岭**：2026 年换供水系统、改造管线，主停车场里还在施工；山上没有饮用水，用流动厕所和临时供水；补路面、画线可能临时滚动封路。Hurricane Ridge Road、Hurricane Hill Road 都开着，Obstruction Point Road 开着但不适合房车。
  - `olym-hurricane-ridge` 第二条 tip 已写“没有餐饮和饮用水”，可以补半句“2026 年主停车场在换供水系统施工，补路面时可能临时封路”。小改，不急。
- **霍河游客中心**：现在周五到周日 9:00–16:30。`olym-hoh-visitor-center` 写“夏季每天开放，春秋多为周五到周日，冬季（约 1 月到 3 月初）关闭”，一致。不改。
- **Mora Road**：开着（10-15 已重开），closures.ts 里早就去掉了。不改。
- 其他：Spruce Railroad Trail 两头都开、Marymere Falls 步道口开、Sol Duc 路开、Quinault 的 North Fork、Graves Creek 路都开；Kalaloch、Quinault 护林站季节性关闭；SR 112（去 Ozette）常因洪水塌方封路绕行。都不影响现有景点，不改。

拿不准的两项：
- **飓风岭夏季 24 小时开放**：NPS 现在的 Visiting Hurricane Ridge 页只写 “The road is open throughout summer”，没有“24 小时”的说法（全园 24 小时开放，但这条路冬季有时段）。建议把 tip 里的“夏季（约 5 月中到 10 月）道路通常 24 小时开放”改成“夏季（约 5 月中到 10 月）每天开放”，去掉“24 小时”。
- **雪链日期**：已核实。Hurricane Ridge in Winter 写 “All vehicles are required to carry tire chains when traveling above the Heart O' the Hills entrance station November 1 through April 1”，冬季开放季 “generally late November through the end of March”，冬季 “typically open to uphill traffic from 9 am to 4 pm, Friday through Sunday and some holidays”，有时到中午才开。现有 tip“11 月 1 日到 4 月 1 日必须随车带雪链”正确，不改；可以把“周五到周日白天开放”写细成“周五到周日和部分节假日 9:00–16:00 只许上山，有时中午才开”。2026–27 冬季的具体开放日期还没公布（页面写的是 2025–26 季已结束）。

## 黄石 yell

来源：
- 道路页 https://www.nps.gov/yell/planyourvisit/parkroads.htm （Last updated: October 13, 2026）
- Current Conditions https://www.nps.gov/yell/planyourvisit/conditions.htm （Last updated: September 29, 2026）
- 北门公路 FONSI 新闻稿 https://www.nps.gov/yell/learn/news/26023.htm （2026-09-17）

施工延误（parkroads.htm 10-13）：

| 工程 | 官方说法 | 10-20 适用吗 |
|---|---|---|
| Gardner River High Bridge（猛犸往 Tower 方向 0.5 英里） | 4-13 到 10 月下旬，单车道 24 小时、最多延误 15 分钟；超宽超长车不能过；9-07 后有 5 次夜间（21:00–4:00）全封，提前通知 | 适用到 10 月底 |
| Yellowstone River Bridge（东北门路，Tower Junction 以东） | 铺路，到 11 月最多延误 30 分钟 | 适用；这段路全年开，会延续到 11 月 |
| Bridge Bay Bridge | 8-25 到 11 月，最多 15 分钟 | 适用到 10-31 季末封路 |
| Firehole River Bridge（老忠实以南 1.5 英里） | 10 月整月，最多 15 分钟 | 适用到 10-31 |
| 全园 chip seal | 2026 年全年最多 30 分钟 | 适用 |

秋季封路（同一页）：Dunraven Pass、Beartooth、Chief Joseph 预计 10-12 封（Beartooth 标着 Closed for the season）；其余季节性路段写的日期是 October 31（数据里 `yell.ts` 已写“2026 年 4 月 17 日开通、10 月 31 日关闭”，一致）。

关闭：
- **火洞河游泳区**：Current Conditions（9-29）仍写 Closed。`yell-firehole-canyon-drive` 写“2026 年到 9 月仍未开放”，到季末（10-31 支路随主路关）都还对。建议把“2026 年到 9 月仍未开放”改成“2026 年整季没开放”（季末一定成立），免得明年看着像“可能已经开了”。
- **West Thumb 栈道**：tip 写“2026 年 10 月中旬前，通到 Fishing Cone 和湖岸间歇泉的一段木栈道在换支撑，暂时关闭”。NPS 页面上没找到重开的通知（搜索只找到 2022、2023 年的旧关闭）。这条路 10-31 封路，今年剩下的日子不多了；建议明年春天更新数据时把这条 tip 删掉（或者改成“2026 年秋天换过支撑”），现在不用动。
- **Biscuit Basin**：closures.ts 没有，靠 `yell-black-sand-basin`、`yell-mystic-falls` 的提示和起点改到路边说明，网站本身就没把 Biscuit Basin 当景点。不改。

建议：
1. 不加 closures.ts：这些都是延误 15–30 分钟，不是关闭。
2. 可以在 `yell-mammoth-terraces` 或 `yell-tower-fall` 加一条 2026 年的 tip：“2026 年 10 月底前猛犸以东的 Gardner River 高桥单车道通行、最多等 15 分钟；Tower Junction 以东的黄石河桥铺路到 11 月，最多等 30 分钟”，来源 parkroads.htm。也可以不加：10 月底以后就过期了，留在数据里的时间很短。我倾向**不加**，或者加在 `yell-lamar-valley`（这段延误到 11 月、冬天也是唯一开着的路）。
3. 北门公路重建（FONSI 9-17）：选方案 2（Center Alignment），Gardner 峡谷里毁坏的旧路大部分不修、还原；临时的 Old Gardiner Road 以后改成多用途步道。新闻稿没有施工时间表。`yell-roosevelt-arch` 的 tip“北门到猛犸温泉目前走 2022 年洪水后临时改建的 Old Gardiner Road”现在仍然对（新路还没开工），不改；等开工了再补。

## 冰川 glac

来源：
- 临时封路新闻稿 https://www.nps.gov/glac/learn/news/temporary-closure-in-alpine-sections-of-going-to-the-sun-road.htm （2026-10-09）
- 施工页 https://www.nps.gov/glac/planyourvisit/projectwork.htm （Last updated: September 15, 2026）
- Current Conditions https://www.nps.gov/glac/planyourvisit/conditions.htm （Last updated: July 8, 2026，没有具体内容）；directions.htm（May 7, 2026）、gtsrinfo.htm（April 19, 2024）都是一般说明，实时状态在交互地图里，读不到

逐项：
- **向阳大道本季已关**：NPS 公告 “Going-to-the-Sun Road Seasonal Closure”（lastIndexed 2026-10-19）写 “Going-to-the-Sun Road is closed for the season at Avalanche Creek on the west side of the park. On the east side, the closure is located at Jackson Glacier Overlook.”
- **向阳大道高山段 10-09 起临时封闭**（Avalanche 到 Jackson Glacier Overlook，10-09 19:00 起）：新闻稿说 “evaluate and re-open … when conditions improve”，没写重开日期。正常季末是 10 月第三个周一（2026-10-19），已经过了。10-09 到 10-19 之间有没有重开，NPS 页面上找不到（搜索只找到 2019 年等旧的“本季不再开放”报道）。
  - 建议：FIXES 里的 `["glac-logan-pass", 2026, "06-22", "10-09"]` 保留（10-09 临时封闭后，10-19 公告直接改成本季关闭，看不出中间重开过）。如果以后查到中间重开过，把关闭日改成最后关的那天（最晚 10-19）。
- **St. Mary 营地**：2026 年秋到 2027 年春换供水系统，营地部分关闭。网站没把营地当住处（`lodging.ts` 没有 St. Mary 营地；`campgrounds.ts` 里如果有，只影响选“露营”的人）。不加 closures.ts。
- **North Lake McDonald Road**：2026 年秋天换涵洞，页面没写影响。网站没有这条路上的景点。不改。
- **Two Medicine North Shore 步道口进不去**：施工页没提 North Shore 步道口；Two Medicine 路 9 月中下旬起已经在 49 号公路路口全封，整个片区都进不去，`glac-two-medicine-lake`、`glac-running-eagle-falls` 已经在 closures.ts 里（longTerm）。North Shore 的说法等 2027 年重开再看，现在不改。
- **North Fork**：10-04 起 Polebridge 护林站往 Logging Creek 方向全封，大施工预计 2026 年 11 月完工、恢复到 2027 年夏；Bowman、Kintla 湖照常能去。`glac-bowman-lake` 已有这条 tip，一致。不改。

拿不准的：
- **高线步道爬升**：`hike.gainFt: 800` 是洛根山口到 Granite Park 一段的爬升，`distanceMi: 11.8` 却是到 The Loop 的全程。NPS places 页写全程爬升 2,388 ft、下降 4,773 ft（GIS 累计，含所有上下坡）。网站按单程穿越写，下降比上升多得多，用 800 低估了累计爬升，但写 2,388 也会让人以为是一路爬坡。
  - 建议：`gainFt` 改成 2388，在第一条 tip 里加“全程累计爬升约 730 米、下降约 1,450 米（NPS），大部分是最后下到 The Loop 的长下坡”。如果网站其他单程穿越的步道（比如大峡谷的下峡谷步道）也是按累计爬升写的，就照这个统一；不确定的话保留 800，只加这句说明。
- 雪崩湖、格林内尔冰川、弗吉尼亚瀑布在 NPS 两类页面上的数字不一样：10-16 已决定保留和 Hiking / Things To Do 页一致的数字，这次没有新信息，不改。

## 大提顿 grte

来源：
- 道路施工 https://www.nps.gov/grte/planyourvisit/road-construction.htm （页脚 Last updated: October 15, 2026；施工一节写 10-07 更新）
- 全园施工 https://www.nps.gov/grte/planyourvisit/park-construction.htm （Last updated: October 16, 2026；施工信息 10-15 更新）
- Current Conditions https://www.nps.gov/grte/planyourvisit/conditions.htm （Last updated: September 30, 2026）

逐项：
- **Death Canyon Road 和步道口**（2026-05 到 2027-06，禁止一切通行；可以从 Granite Canyon 步道口或 LSR 保护区走过去，车位少）：仍适用。10-16 已经写进 LSR 保护区的提示，没有景点从这个步道口出发。不改。
- **Moran Junction 附近 26/89/191 号公路**（加固被河水冲刷的路基）：10–12 月，临时红绿灯单车道交替放行，两个方向最多延误 20 分钟。仍适用。建议在 `grte-oxbow-bend` 或 `grte-cunningham-cabin` 加 tip：“2026 年 10–12 月 Moran Junction 附近 26/89/191 号公路修路基，红绿灯单车道放行，最多等 20 分钟”。只是延误，不加 closures.ts。
- **Moose 入口站环岛**：5-01 到 11-15 最多延误 20 分钟（不含排队进园），工程到 2027 年 6 月。`grte-teton-park-road` 已有 tip，一致。不改。
- **Moose-Wilson Road**：9-08 到 11-15 LSR 到 Moose 段全封，closures.ts 已有 `grte-moose-wilson-road`（reopen 2026-11-16），一致。另外施工页写 2027 年也有 Phase II，2027 年的安排等公布。不改。
- **Cottonwood Creek 野餐区**：2026 年施工关闭（10-15：路缘石装好、在准备铺路面）。网站没有这个景点。不改。
- **Signal Mountain、Colter Bay、Leeks 码头**：Current Conditions（9-30）写都关了（Signal Mountain 船坡开着，但水下有松动卵石，建议手推下水）。网站这几处是住处、游客中心，不是靠码头的景点；`grte-jackson-lake-dam` 的 tip 已写 Colter Bay 码头 7 月就提前停业。不改。
- **新发现：Taggart Lake 步道口和步道**（2026-05 到 2027-11 改造）：2026 年部分关闭（10-15：北段步道关到冬季越野滑雪开始）；**2027 年 5 月 1 日起步道口和步道全部关闭**，徒步、骑马都不行（冬季雪上活动照常），2027 年只能从北边的 Valley Trail 走到 Taggart Lake。
  - 建议在 closures.ts 加一条：
    ```ts
    {
      attractions: ["grte-taggart-lake"],
      from: "2027-05-01",
      reopen: null,
      longTerm: true, // 计划 2027 年 11 月完工，完工公布后改成重开那天
      reasonZh:
        "Taggart Lake 步道口改造（扩成 140 个车位），2027 年 5 月 1 日起步道口和步道全部关闭，徒步、骑马都不行，预计 2027 年 11 月完工；2027 年想去塔格特湖只能从北边沿 Valley Trail 走过去（比如从 Lupine Meadows 步道口），或者改走隐秘瀑布 · 灵感点。",
      source: "https://www.nps.gov/grte/planyourvisit/park-construction.htm",
      checked: "2026-10-20",
    },
    ```
    （`longTerm` 是因为 `reopen: null` 时只有核对后 90 天内当关着，而这条从 2027-05-01 才开始，不标 longTerm 就永远不生效。）
  - `grte-taggart-lake` 的第一条 tip 可以改成“2026 年步道北段施工封闭，只能走南线（往返约 6.8 公里、坡更陡）；2027 年 5 月起整个步道口关闭”。
  - 另外 `grte.ts` 里好几处写“冬天可以改去全年能开车到的 Taggart Lake 步道口”（弦湖、LSR 保护区等的 closedNote）——2026–27 冬天还对（冬季雪上活动照常），2027 年夏天施工期间就不对了，但那几条是冬季替代，影响不大，先不改。

拿不准的两项：
- **Menors Ferry Road 工作日封闭、周末开放**：NPS 的道路施工页、全园施工页、Current Conditions 都没提 Menors Ferry Road，只有第三方报道。建议把 `grte-chapel-transfiguration` 那条 tip 改成不带工作日/周末的说法：“2026–2027 年 Moose 入口一带修环岛，Menors Ferry Road 施工期间可能临时封闭、车位减少，出发前查 NPS 路况”。
- **杰克逊湖大坝抬高水位多少**：NPS 的 Jackson Lake Dam Overlook 地点页和大提顿多篇新闻稿都写 39 feet（https://www.nps.gov/places/000/jackson-lake-dam-overlook.htm ，例如 https://www.nps.gov/grte/learn/news/modified-operations-at-marinas-on-jackson-lake.htm ）；只有 Vital Signs 报告写 38 ft。`grte-jackson-lake-dam` 的 summary 写“约 9 米”（30 英尺），偏低。建议改成“约 12 米（39 英尺）”，用 rekey-zh.py 同时改英文。

## 加州各园（chis、lavo、crla、seki、yose、redw）

这一节另外用了 NPS alerts 接口（`developer.nps.gov/api/v1/alerts`，2026-10-20 拉的，和网站读公告用的是同一个接口），下面写“公告”的就是它，括号里是公告的 lastIndexedDate。

### 海峡群岛 chis

- Current Conditions https://www.nps.gov/chis/planyourvisit/conditions.htm （Last updated: June 30, 2026）；公告 “Parts of Santa Rosa Island Closed During Wildfire Recovery”（10-14），详情 https://www.nps.gov/chis/planyourvisit/santa-rosa-island-fire-recovery.htm
- **Santa Rosa 岛东南区 2026 年内不开放**：公告写过火区仍关，**东南区（Southeast Quadrant）的海滩露营 2026 年剩下的季节都不开**。仍适用。`chis-santa-rosa-island` 的 tip 已写“Torrey Pines 步道和烧过的区域仍关闭，Water Canyon 营地和西北、西南两区的海滩露营……”，一日游照常，不用加 closures.ts。可以在那条 tip 末尾补“东南区的海滩露营 2026 年不再开放”。
- 另：Current Conditions 写 China Camp 到 Cluster Point 的海滩、沙丘暂时禁止进入（只能走标出的小路），Sandy Point 全年关（海豹繁殖地），Skunk Point 到 East Point 3-01 到 9-15 保护雪鸻。都是一日游走不到的地方，不改。

### 拉森火山 lavo

- Current Conditions https://www.nps.gov/lavo/planyourvisit/conditions.htm （Last updated: July 18, 2026，基本只有链接）；公告 “Juniper Lake Campground Closed”（7-31）；路况页 https://www.nps.gov/lavo/planyourvisit/winter-road-closures-and-spring-clearing-update.htm （Last updated: May 24, 2026）
- **Juniper Lake Road 关闭（Dixie 火）**：**已经不对了**。公告写 Juniper Lake 营地和日间使用区因维修、改造关闭，没有饮用水，但 “The Juniper Lake Road (access to lake and trailheads) is open”，路上可能有施工队。网站没有 Juniper Lake 的景点，不改。
- **Mount Harkness 瞭望塔**：这几页都没提，网站也没有这个景点。不改。
- 公园公路：没有关闭公告，按路况页的说法 “If there is no active closure alert, then the park road is fully open”，10-20 全线开着；历年表 2026 年的关闭日还空着。等关了再补 roads-manual.json 的 `lavo-park-highway`（现在 `[2026,"05-22",null]`）。
- 另：园内电动车充电桩坏了、没有修复时间（公告 6-08）。如果补给数据里列了 Lassen 园内的充电桩，可以标一下；`lavo.ts` 里没写，不改。

### 火山口湖 crla

- Current Conditions https://www.nps.gov/crla/planyourvisit/conditions.htm （Last updated: October 14, 2026）
- **Pinnacles Road 只许步行、骑车**：仍适用（因修路，随东环湖路一起关）。`crla.ts` 的 `PINNACLES_ROAD_TIP` 写“2026 年 9 月时……”，建议改成“2026 年整季 Pinnacles Road 因施工只能步行或骑车进入”（10-14 仍是这样，季末一定成立）。
- **东环湖路 2027 才全开**：页面写东环湖路现在已能穿行（工区附近有交通管制，部分路边停车点可能关），工程大部分完成，“all of East Rim Drive is expected to open in 2027”，全线一般 7 月中旬通车。西环湖路、东环湖路、北入口路都写 “Closes November 1 or earlier”。和 roads.ts 的说法一致，2023–2026 年不算统计的处理也不用改。
- **园内没有加油**：页面写园内没有加油站，最近在 Prospect（62 号公路，离南收费站 29 英里）、Crater Lake Junction（97 号公路，30 英里）、Diamond Lake Resort（138 号公路方向）。建议在 `crla-rim-village` 或 parks.ts 的 crla 介绍里加一句“园内没有加油站，进园前在 Prospect、Crater Lake Junction 或 Diamond Lake 加满”（`crla.ts` 里现在没有加油的说法）。
- Cleetwood Cove：整季关闭，closures.ts 已有（到 2029-07-01）。不改。

### 红杉与国王峡谷 seki

- 道路施工 https://www.nps.gov/seki/planyourvisit/road-construction.htm （Last updated: October 13, 2026）；Current Conditions https://www.nps.gov/seki/planyourvisit/conditions.htm （Last updated: October 13, 2026）；公告 “Weekday Traffic Delays on Generals Highway North of Giant Forest”（10-09）、“Some Trails Closed in the Grant Grove Area Due to Prescribed Burn Activity”（10-20）
- **Generals Highway 堵 30 分钟**：仍适用。公告写 180 号公路到 Giant Forest 之间清理危险树木，工作日 8:00–17:00 最多延误 30 分钟，联邦节假日不堵，没写结束日期。建议在 `seki-general-sherman` 或 `seki-general-grant` 加 tip：“2026 年秋天 Generals Highway 在 180 号公路到 Giant Forest 之间清理危险树木，工作日 8:00–17:00 最多等 30 分钟”。不加 closures.ts。
- **Mineral King Road 9-08 到 10-28 施工**：周一到周四 10:00–16:00 全封（前后 7–10 点、16–19 点最多延误 30 分钟），周五到周日 8:00–19:00 封路、只在 10:00、13:00、16:00 放行；**10-28 起冬季封路**。网站没有 Mineral King 的景点，不改。
- **Congress Trail 一段可能还封**：7-13 版的一日徒步页说一段封到 9 月底；这次 day-hikes 页 404，Things To Do 页（2025-08-30 更新）和 Current Conditions 都没提封闭。没有新的关闭说法，**不改**（数据里本来就没写封闭）。
- **Grant Grove 计划烧除**（公告 10-20，新的）：格兰特将军树一带在做计划烧除，周围的区域和步道关闭，清理完危险再开，关闭范围在公告链接的地图上（文字里没写到底包不包括 General Grant Tree Trail）。是几天的事，不加 closures.ts；如果有人这几天要去，行程页会显示这条公告。
- Cedar Grove：路一般开到 11 月上中旬；Cedar Grove Lodge、Market、Grill 营业到 10-25；Lodgepole Grill 11-02 起冬季关。lodging.ts 里没有 Cedar Grove Lodge（只有 John Muir Lodge 等），不用改。

### 优胜美地 yose

- Current Conditions https://www.nps.gov/yose/planyourvisit/conditions.htm （Last updated: October 20, 2026）；公告 “Tioga Road (Hwy 120 through the park) temporarily closing Wednesday at 5 pm”（10-20）
- **El Capitan 桥工作日延误到 12 月**：仍适用。加固 El Capitan 桥，周一到周五 7:00–19:00 最多延误 15 分钟，可能短暂封闭（有绕行）；过 El Capitan 桥的 Valley Loop Trail 工作日关到 12 月。建议在 `yose-el-capitan` 加 tip：“2026 年 12 月前工作日 7:00–19:00 El Capitan 桥施工，最多等 15 分钟，桥上的 Valley Loop 步道工作日不开”。
- **Big Oak Flat Road 工作日延误**：仍适用（Foresta 到 Big Oak Flat 之间防火作业，工作日最多 15 分钟，没写结束日期）。`yose-tuolumne-grove` 或 `yose-hetch-hetchy` 的 tip 可以补一句；不加也行。
- **荒野中心到 Lembert Dome 的步道封**：仍适用（施工，没写结束日期，有替代步道）。`yose-lembert-dome` 的起点是 Dog Lake 步道口，不走这一段，不受影响。不改。
- **Tioga Road**（新的）：公告写 10-21（周三）17:00 起因预报下雪**临时**关闭。这还没发生，而且是临时关闭；如果之后宣布本季不再开，就在 FIXES 里加 `["yose-tioga-road", 2026, "05-15", "10-21"]`（关闭日按实际关的那天）。现在不改。Tioga Road、Glacier Point Road 和沿线停车场 10-16 起不许过夜停车。
- 半穹顶钢缆：已经放倒（“Down for the season”）。10-16 记的“官方页 10-15 还写在山上”已经过时；数据里“10 月第二个周一的次日拆除”的规律不用改。
- 雾径：10 月底前只在周五到周日和节假日全天开放，周一到周四 15:30 到次日 7:00 开放，和 DEVELOPMENT.md、数据里的说法一致。Chilnualna Falls 步道已重开（closures.ts 里早已去掉）。

### 红木 redw

- Current Conditions https://www.nps.gov/redw/planyourvisit/conditions.htm （Last updated: October 16, 2026）；公告 “Prescribed Fire in the Bald Hills Area”（10-16）、“Delays along Highway 101”（6-17）、“44 Creek Bridge Failure”（8-04）
- **每月第一个周六 Hike and Bike Day 不让车进 Newton B. Drury Parkway（10 月到次年 5 月）**：仍适用，Current Conditions 写 “The first Saturday of each month, October through May … vehicle traffic is closed”。
  - closures.ts 只支持“每周几”，没有“每月第一个周六”。建议按日期逐条加 2026–27 季剩下的 7 天（都是一天的关闭）：2026-11-07、2026-12-05、2027-01-02、2027-02-06、2027-03-06、2027-04-03、2027-05-01。写法示例：
    ```ts
    {
      attractions: ["redw-newton-b-drury-parkway"],
      from: "2026-11-07",
      reopen: "2026-11-08",
      reasonZh:
        "10 月到次年 5 月每月第一个周六是 Hike and Bike Day，牛顿·德鲁里风景道这天不让机动车开，只能步行或骑车；开车可以走平行的 101 公路，Prairie Creek 游客中心和马鹿草原从南口进去还能到。",
      source: "https://www.nps.gov/redw/planyourvisit/conditions.htm",
      checked: "2026-10-20",
    },
    ```
    其余 6 天照写（也可以在 `TempClosure` 里加一个“每月第几个星期几”的字段，一条写完，但要改 `closureOn`，属于代码改动）。“游客中心从南口进去还能到”这一句官方没写封闭的范围，没把握就删掉，只写“开车改走 101 公路”。
- **101 公路 Orick 到 Crescent City 多处施工停车放行**（6-17 起，没写结束日期）：仍适用。可以在 `redw-klamath-river-overlook` 或 parks.ts 的 redw 交通说明里加一句“2026 年 101 公路 Orick 到 Crescent City 有多处施工放行，多留时间”。
- Bald Hills 计划烧除 10-22 到 10-26，Lyon's Ranch Trail 间歇关闭：网站没有这条步道，不改。
- 44 Creek 桥损毁（Redwood Creek Trail 上，离 Tall Trees 渡河点约 1 英里，往 44 Camp 方向）：只影响从 Redwood Creek 步道口长线走到 44 Camp，不影响 `redw-tall-trees-grove`（从 Tall Trees 步道口进）。不改。
- Boy Scout Tree Trail 倒树：`redw-boy-scout-tree` 已有 tip，一致（8-04 起，1.75 英里处，能翻过去但费劲）。不改。

## 汇总：建议的数据改动（按优先级）

| 优先 | 文件 | 改动 |
|---|---|---|
| 高 | `src/data/closures.ts` | 新增 `grte-taggart-lake`：2027-05-01 起步道口和步道全封（longTerm，计划 2027-11 完工） |
| 高 | `src/data/closures.ts` | 新增 `redw-newton-b-drury-parkway` 的 7 个一天关闭（2026-11-07、12-05，2027-01-02、02-06、03-06、04-03、05-01，Hike and Bike Day） |
| 中 | `src/data/attractions/noca.ts` | `noca-diablo-lake-trail` 删掉“坐渡轮回来”，改成原路返回；`noca-thunder-knob` 难度改 moderate；`noca-washington-pass-overlook` 雪化改成“6 月甚至 7 月初” |
| 中 | `src/data/attractions/grte.ts` | `grte-chapel-transfiguration` 去掉没有官方出处的“工作日封闭、周末开放”；`grte-jackson-lake-dam` “约 9 米”改“约 12 米（39 英尺）”；`grte-taggart-lake` tip 补 2027 全封；可选：Moran Junction 10–12 月延误 20 分钟 |
| 中 | `src/data/attractions/olym.ts` | `olym-hurricane-ridge` 去掉“24 小时开放”；可写细冬季时段 |
| 中 | `src/data/attractions/glac.ts` | `glac-highline-trail` 爬升说明（gainFt 800 → 2388，或只加说明） |
| 低 | `src/data/attractions/crla.ts` | `PINNACLES_ROAD_TIP` 改成“2026 年整季”；加“园内没有加油站” |
| 低 | `src/data/attractions/yell.ts` | 火洞河游泳区改成“2026 年整季没开放”；West Thumb 栈道 tip 明年春天删 |
| 低 | `src/data/attractions/{yose,seki,redw,noca,chis}.ts` | 2026 年秋天的施工延误 tip（El Capitan 桥、Generals Highway、101 公路、Cascade River Road、Santa Rosa 东南区露营） |
| 低 | `src/data/closures.ts` | `mora-silver-falls` 的 checked 改 2026-10-20，reasonZh 补“不能走成环线” |
| 等 | `scripts/data/roads-manual.json` | `mora-stevens-canyon-road` 2026 关闭日：计划 10-26，**等实际关了再补** |
| 等 | `scripts/build-roads.mjs` FIXES | `yose-tioga-road` 2026：10-21 17:00 起临时关，如果宣布本季不开再补 `"10-21"`；`lavo-park-highway`、`crla-*`、`romo-trail-ridge-road` 也还没关 |
| 不改 | — | 冰川 FIXES 的 10-09 保留；雷尼尔山 Paradise Valley / Ricksecker / White River 下段不在 roads.ts 里；北瀑布、奥林匹克、黄石其余施工和山火关闭都没有对应景点 |

中文改了的，按 docs/ENGLISH.md 用 `scripts/rekey-zh.py` 同时改英文表。

## 处理情况（10-20、10-21）

- 已改：`closures.ts` 加了大提顿 Taggart Lake（2027-05-01 起，longTerm）、红木牛顿·德鲁里风景道 7 个 Hike and Bike Day；`mora-silver-falls` 的 checked 改成 10-20。迪亚布洛湖步道、雷丘步道、华盛顿山口观景台、Menors Ferry Road、杰克逊湖大坝、Taggart Lake 提示、飓风岭“24 小时”、高线步道的累计爬升、Pinnacles Road、火山口湖没有加油站、火洞河游泳区都按上面的建议改了（英文表用 `rekey-zh.py` 跟着改）。
- 没改：2026 年秋天只延误十几到三十分钟的施工（El Capitan 桥、Generals Highway、101 公路、Cascade River Road、Moran Junction、Santa Rosa 东南区露营）：几周内就过期，两周内出发的行程页本来就会显示那条公告。雷尼尔山 Stevens Canyon Road、优胜美地 Tioga Road 等实际关了再补进 FIXES。
- 10-21 `npm run check:closures`：大烟山 Cades Cove 2026 年的周三禁车 10-01 已经结束，从数据里删了（2027 年那条留着）；核对脚本不再把还没开始的关闭（红木的禁车日）列成“可能已经重开”。
