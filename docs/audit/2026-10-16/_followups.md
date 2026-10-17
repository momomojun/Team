# 核对中发现、要我处理或问用户的

## 问用户
- 德纳里的山名：NPS 2025 年起写 Mount McKinley（公园仍叫 Denali National Park）。全站中英文现在都叫 Denali / 德纳里峰。

## 我来处理（不在各公园助手范围内）
- closures.ts / parks.ts / bookings.ts：Pretty Rocks 新桥 9/2 完工，只许徒步、骑车通过；2026 季巴士到 East Fork（Mile 43），2027 季恢复全程。检查有没有写“新桥未完工”这类说法。
- 德纳里 2027：Eielson 游客中心 2027 仍关闭、去 Kantishna 的巴士约 6/8 开始（只有 Afar 引述发言人）；2027 预约 2026-12-01 开放。
- 德纳里秋季私家车到 Mile 30 只到 10/15，之后随时在 Mile 13 或总部关闭（Current Conditions 10/6）。
- 金都（Richmond）英文名查不到，暂用 Kam Do。
- 北瀑布：parks.ts / closures.ts 里 20 号公路“11 月中下旬封路”、Cascade River Road“7 月下旬”要统一成 NPS 说法（11 月下旬到 12 月初封、4 月或 5 月初开；Cascade River Road 大雪年份 7 月初）。
- 北瀑布临时关闭候选：Stehekin Valley Road（12/10 起滑坡，可能已修，洪水更新页 9/9）、Golden West 游客中心 2026 关闭、Sibley Creek / Hidden Lake 公路冲毁、山火关闭（Border 2 整个 Hozomeen、Luna Big Beaver Trail 一段、Sisi Agnes Gorge 等）、USFS Ptarmigan Fire 到 10/31。
- 北瀑布拿不准：迪亚布洛湖渡轮一日徒步能否坐（NPS 说到吊桥后原路返回）；雷丘步道 NPS 说 moderate climb；华盛顿山口观景台雪到 7 月初、要 Northwest Forest Pass。
- 注意：WebSearch 每轮有 200 次额度，北瀑布那个助手用完了。
- 奥林匹克临时关闭（closures.ts 里没有 olym；来源 https://www.nps.gov/olym/planyourvisit/conditions.htm 10/13）：Elwha 的 Olympic Hot Springs Road 在 Madison Falls 停车场处禁止车辆；Staircase 开发区 7/8 重开、其余步道仍关（2025 Bear Gulch 火）；飓风岭停车场工程、山上没饮用水；霍河游客中心只开周五到周日；Mora Road 10/15 已重开。
- 奥林匹克拿不准：飓风岭路夏季 24 小时开放、雪链日期（11/1 还是 11/15 到 4/1）。
- 黄石施工延误（parkroads.htm、conditions.htm）：Gardner River High Bridge 单车道到 10 月底、9/7 后 5 次夜间全封；Yellowstone River Bridge 铺路到 11 月（拉马尔谷方向）；Bridge Bay Bridge 8/25–11 月；Firehole River Bridge 10 月；全园 chip seal。火洞河游泳区关闭。West Thumb、Biscuit Basin 的关闭看 closures.ts 有没有。
- 黄石北门公路重建：9/17 FONSI 选方案 2，Old Gardiner Road 以后改步道（https://www.nps.gov/yell/learn/news/26023.htm）。
- 【优先】大提顿 Death Canyon Road 和步道口 2026-05 到 2027-06 全封，行人也不能进（road-construction.htm）→ 加进 closures.ts，影响从 Death Canyon 步道口出发的景点（Phelps Lake 等，要查哪些景点用这个步道口）。
- 大提顿：Moran Junction 一带 10–12 月红绿灯单车道延误 20 分钟；Cottonwood Creek 野餐区 2026 关闭；Signal Mountain、Colter Bay、Leeks 码头已关。
- 大提顿拿不准：Menors Ferry Road 工作日封闭只有第三方；杰克逊湖大坝抬高水位 30 ft 还是 39 ft。
- 【优先】冰川向阳大道高山段 10/9 晚 7 点起 Avalanche 到 Jackson Glacier Overlook 临时封闭（https://www.nps.gov/glac/learn/news/temporary-closure-in-alpine-sections-of-going-to-the-sun-road.htm），正常季节 10/19 结束 → roads.ts FIXES 补今年的关闭日期，或 closures.ts。
- 冰川：St. Mary 营地 2026 秋–2027 春部分关闭；North Lake McDonald Road 秋季涵洞施工；Two Medicine North Shore 步道口进不去（要涉水，走 South Shore 多约 1 英里）。
- 冰川拿不准：高线步道 gainFt 800 只是到 Granite Park 一段，全程爬升 2,388 ft、下降 4,773 ft；几条步道 NPS 两类页面爬升对不上（雪崩湖、格林内尔冰川、弗吉尼亚瀑布）。
- 【优先】雷尼尔山：Grove of the Patriarchs 停车场 10/5 起关闭（银瀑布起点，改停 Cowlitz Divide）；Fryingpan Creek（Summerland）停车场 10/1 起关闭到 2029；季节封路 White River Road 10/19（或 10/26）、Stevens Canyon 10/26、Paradise Valley Road 10/19、Ricksecker Point 10/20 → roads.ts FIXES；SR 706 10/16 晚夜间封路（已过）。Carbon River、Mowich、Grand Park 一带、Wonderland 部分关闭。
- 雷尼尔山：换桥开工 2027 夏（ohanapecosh.htm）还是 2028（conditions.htm），parks.ts / closures.ts 统一。
- 加州施工和关闭：chis Santa Rosa 东南区 2026 内不开放；lavo Juniper Lake Road 关闭（Dixie 火）、Mount Harkness 瞭望塔关闭；crla Pinnacles Road 只许步行骑车、东环湖路 2027 才全开、园内没加油；seki Generals Highway 堵 30 分钟、Mineral King Road 9/8–10/28 施工（周一到周四 10–16 全封）、Congress Trail 一段可能还封；yose El Capitan 桥工作日延误到 12 月、Big Oak Flat Road 工作日延误、荒野中心到 Lembert Dome 步道封；redw 每月第一个周六 Bike and Hike Day 不让车进 NBD Parkway（10 月到次年 5 月）。
- 加州范围外：google.ts 探索中心官方名 Yosemite Exploration Center；半穹顶钢缆官方页 10/15 还写在山上；雾径 NPS 评 Strenuous、下段冬季关闭；seki 营地和 Cedar Grove 设施季节（lodging.ts）；jotr 游客中心已搬到 Twentynine Palms Freedom Plaza，名字没改；马拉绿洲 2026 年 3 月洪水关闭查不到官方。
- 【优先】大弯 Grapevine Hills Road 封闭至另行通知 → bibe-balanced-rock 去不了（conditions.htm 10/16），加进 closures.ts。
- grsa Medano Pass Road 第 3–5 个涉水点水深约 3 英尺，NPS 建议机动车别走（Point of No Return 以前照常）；meve 主路前 4 英里施工延误 15 分钟。
- 科罗拉多和得州范围外：romo Gore Range Overlook 坐标可能不对（官方在高山游客中心东边 1 英里，海拔 12,018 ft）；Sky Pond NPS 两页矛盾；blca 橡树平地环线 NPS 评 Strenuous（数据 moderate）；sagu Bajada 环线封路的来源要换、Tanque Verde Ridge 数字对不上；gumo Current Conditions 没核到。
- 【优先】布莱斯 Bryce Connector Trail 8/28 起关闭（brca-peekaboo-loop 从 Bryce Point 下去的路线）；Wall Street 8/28 暴雨后关闭。
- 【优先】大盆地景观道 10/8 起冬季封路（grba-scenic-drive、alpine-lakes、bristlecone-grove、wheeler-peak）。
- 圆顶礁 Capitol Gorge 土路 10/15 仍关闭；Cathedral Valley、Burr Trail 土路“likely impassable”。
- 峡谷地 Grand View Point 2027 年 7–9 月最后一期施工（每周一 6:00 到周四 16:00 关）。
- 锡安：天使降临因搜救临时关闭（可能已重开）；大车新规（2026-06-07 起取消隧道通行证，超尺寸车不能走 Canyon Junction 到东门）→ 检查 parks.ts / roads.ts。
- 大峡谷：南缘过夜住宿 8/30–11/16 全部暂停（lodging.ts）；北缘 10/15 起无服务、Point Imperial Road 10/15–11/3 关；North Kaibab、Phantom Ranch 关；Bright Angel 1.5 Mile 以下关到至少 10/22。
