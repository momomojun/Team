# 要提前订的：约书亚树、死亡谷、圆顶礁、尖峰石阵、The Wave 补漏（2026-10-19 按官方页面核对）

说明：`src/data/bookings.ts` 里这 5 处原来各只有一条（jotr-campgrounds、deva-furnace-creek-campground、care-fruita-campground、pinn-campground、wave-coyote-buttes-north）。下面逐项记录官方怎么说。任务说明里提到的 `jotr-camp-*`、`care-camp-fruita` 这些 id 在仓库里不存在（营地没有收成住宿或景点，现有条目用的是 `places`）。

## 约书亚树 jotr

### jotr · 现有的营地条目（`jotr-campgrounds`）要不要改
- 要不要提前订：Black Rock、Cottonwood、Indian Cove、Jumbo Rocks、Ryan 五个（加上团体营地 Sheep Pass）只能预约；**Belle、Hidden Valley、White Tank 三个是先到先得**，现有条目的说明没提到，可以补一句（或另开一条 `first-come` 的条目，places 写这三个）
- 什么时候开订：最早提前 6 个月、最晚当天 → 现有的 window: { type: "rolling", months: 6, time: "10:00", tz: "America/New_York" } 和官方一致（10:00 美东是 Recreation.gov 营地通用的放票时间，NPS 页面没写）
- 适用季节：预约营地“一般全年开放”，夏天可能部分或全部关闭；Ryan 夏天关；Belle、White Tank 夏天暂时关；Hidden Valley 全年开。官方没写具体月份
- 来源：https://www.nps.gov/jotr/planyourvisit/campgrounds.htm
- 原文："Reservations can be made the same day or up to 6 months in advance." / "Hidden Valley, White Tank, and Belle Campgrounds are first-come, first-served." / "Ryan is closed in the summer months."
- 备注：现有条目 noteZh 写“等营地全年都要预约”，容易让人以为所有营地都要订；Ryan 夏天关闭也可以写进去。团体营地（Cottonwood、Indian Cove、Sheep Pass）也是提前 6 个月。

### jotr · Keys Ranch 导览（`jotr-keys-ranch`）
- 要不要提前订：要（只在 Recreation.gov 卖，园里和游客中心不卖票）
- 什么时候开订：提前 60 天，订到导览前一天（Recreation.gov 写前一天太平洋时间 21:00 截止）；放票的几点没写 → 建议写成 window: { type: "rolling", days: 60 }，kind: "tour"，targets: ["jotr-keys-ranch"]
- 适用季节：一般 10–5 月，盛夏没有（Recreation.gov 写“May through September”可能没有）；只在日历上选定的日子开
- 来源：https://www.nps.gov/jotr/planyourvisit/ranchtour.htm ；https://www.recreation.gov/ticket/300004/ticket/1040
- 原文："Tickets can be booked up to 60 days in advance." / "available up to 60 days in advance and until the day before the tour." / "Tickets are NOT available at the national park or visitor centers"
- 备注：12 岁以上每人 $20，4–11 岁和老人、Access Pass $10，4 岁以下 $1，不含门票；提前 15 分钟到牧场大门，迟到不能进、不退款。景点数据里 permit 已经写了“提前 60 天、没有现场票”，和官方一致。

### jotr · 野外过夜许可（backcountry permit）
- 要不要提前订：要（**已经不是自助登记**：官方写不再用黄色自助登记单），也可以当天到总部许可办公室拿
- 什么时候开订：最早提前 6 个月，Recreation.gov 或电话 1-877-444-6777；当天现场 16:00 前在总部（Twentynine Palms，100 号楼旗杆旁，每天 8:00–16:00）→ 建议写成 window: { type: "rolling", months: 6 }，also: [{ type: "first-come" }]，kind: "permit"，targets: []，places: ["野外过夜（backcountry）"]
- 适用季节：全年
- 来源：https://www.nps.gov/jotr/planyourvisit/backpacking.htm ；Recreation.gov 许可页 https://www.recreation.gov/permits/4675329
- 原文："A permit is required for all overnight stays in the backcountry." / "Permits may be booked up to 6 months in advance." / "In person same day permits will be available up until 4 pm at the permit office."
- 备注：$6 一张，1–12 人、最多 14 晚。网站没收野外过夜的景点，只适合放在公园页列出（places）。几点放票没写。

## 死亡谷 deva

### deva · The Inn at Death Valley（`deva-stay-inn`）和 The Ranch at Death Valley（`deva-stay-ranch`）
- 要不要提前订：要（两家是同一个特许经营商 The Oasis at Death Valley，同一套预订规则，可以合成一条，targets: ["deva-stay-inn", "deva-stay-ranch"]）
- 什么时候开订：最多提前 13 个月；每月 1 号放明年同一个月的整月 → 建议写成 window: { type: "block", day: 1, monthsAhead: 12 }（和黄石园内酒店“5 号放明年同一整个月”同一种写法；例：2027 年 10 月任何一天，2026 年 10 月 1 日开订）
- 适用季节：官方页面没写季节性关闭（写着前台和两家都 24 小时开）
- 来源：https://oasisatdeathvalley.com/?p=327 （Reservation Policies；也从 https://www.oasisatdeathvalley.com/lodging/reservations/ 进）
- 原文："We are currently accepting reservations for stays up to 13 months in advance." / "On the first of each month, we will begin accepting reservations for the entire month of the following year."
- 备注：订的时候收每处第一晚的房费当订金；入住前 72 小时（3 天）以内取消、改期订金不退，天气原因取消也不退。电话 1-800-236-7916（山地时间 7:00–19:00），当天的预订打 760-786-2345。几点放票没写。

### deva · Stovepipe Wells Village（`deva-stay-stovepipe`）
- 要不要提前订：可以在官网订（酒店房间和 RV 营位都有在线预订），提前多久没查到
- 什么时候开订：没查到（官网首页、FAQ、Village Info & Policies 都没写）→ 建议不写这条，或者写 window: { type: "anytime" }
- 来源：https://www.stovepipedeathvalley.com/ （原来的 deathvalleyhotels.com 301 跳到这里）；FAQ https://www.stovepipedeathvalley.com/know-before-you-go/faq/
- 原文：没有关于预订窗口的原文
- 备注：前台 888-328-4144、frontdesk@stovepipedeathvalley.com。同名的 Stovepipe Wells **NPS 营地**（不是村里的 RV Park）是先到先得，见下面。

### deva · Panamint Springs Resort（`deva-stay-panamint`）
- 要不要提前订：可以订，提前多久没查到
- 什么时候开订：没查到 → 不建议写窗口
- 来源：https://www.panamintsprings.com/accommodations/policies-and-information/ ；https://www.panamintsprings.com/accommodations/camping-rv/
- 原文：没拿到。官网所有页面都先弹“Verifying that you are not a robot...”的机器人验证，没有绕过；Wayback Machine 也抓不了（工具不能访问 web.archive.org）
- 备注：只从搜索结果摘要看到（**没有在页面上核对**）：入住前 48 小时以内取消按全价收那几晚、到店才付款；28 个营位里只有 9 个能提前订，其余先到先得；4 间房以上要发邮件订。用之前要有人在浏览器里打开核对。是私营的，不在 NPS 营地体系里。

### deva · 其他 NPS 营地（Stovepipe Wells、Texas Springs、Mesquite Spring、Sunset、Emigrant、Wildrose 等）
- 要不要提前订：先到先得。官方只说 Furnace Creek 之外的 NPS 营地都不能预约，没逐个列名字
- 什么时候开订：→ window: { type: "first-come" }；现有 `deva-furnace-creek-campground` 的 noteZh 已经写了“园内其他营地都是先到先得”，不用另开一条
- 适用季节：很多营地是季节性的，NPS 页面上每个营地的开放日期是用脚本加载的，没读到具体月份
- 来源：https://www.nps.gov/deva/planyourvisit/developed-campgrounds.htm
- 原文："All other National Park campgrounds are first-come, first-served (no reservations) when open."
- 备注：Furnace Creek 营地同页原文 "Reservations must be made at least 2 days in advance, but can be made up to 6 months in advance."，季节 10 月 15 日到 4 月 15 日，和现有条目一致。

### deva · 野外过夜许可（路边露营、背包）
- 要不要提前订：分两种
  - **必须预约（只能网上）**：几条土路的路边露营——Greenwater Valley（Furnace Creek Wash）、Echo Canyon、Hole in the Wall、Cottonwood Canyon 和 Marble Canyon；以及 Cottonwood-Marble 背包环线
  - **建议但不强制**：其他背包、其他路边露营、野外小屋、溯溪（canyoneering），当天或提前都行：Furnace Creek 游客中心营业时间内、Stovepipe Wells 护林站外 24 小时自助登记，或下载表格（表格要至少提前 3 天交）
- 什么时候开订：必须预约的那几处最多提前 6 个月 → 建议写成 window: { type: "rolling", months: 6 }，kind: "permit"，targets: []，places: ["Echo Canyon、Hole in the Wall、Greenwater Valley、Cottonwood/Marble Canyon 路边露营", "Cottonwood-Marble 背包环线"]
- 适用季节：全年（页面没写季节）
- 来源：https://www.nps.gov/deva/planyourvisit/wilderness-permits.htm ；Recreation.gov 路边露营 https://www.recreation.gov/camping/campgrounds/10303151 ；Cottonwood-Marble 背包 https://www.recreation.gov/permits/4675343
- 原文：表格里这几处标 "Mandatory" / "Online"，窗口 "Up to 6 mo in advance"；建议的那些 "May be done same day or in advance."
- 备注：搜索摘要说 2024 年 4 月 30 日起实行、路边露营每晚 $10、背包每张 $10——许可页本身没写费用，没核对（新闻稿 https://www.nps.gov/deva/learn/news/death-valley-national-park-to-launch-online-backcountry-permits-system-on-recreation-gov.htm 可能有）。网站没收这些露营点，只适合公园页列出。最晚提前多久没写。

## 圆顶礁 care

### care · 进园预约 / 分时段入园
- 要不要提前订：不要
- 什么时候开订：→ 可以加一条 window: { type: "first-come" }，kind: "timed-entry"，targets: []（照 arch-no-timed-entry-2026 的写法），或者就靠现有 Fruita 条目里那句“进圆顶礁本身不用预约”
- 来源：https://www.nps.gov/care/planyourvisit/permitsandreservations.htm
- 原文："There is no reservation or timed-entry ticket needed to enter Capitol Reef National Park."

### care · Fruita 营地（现有 `care-fruita-campground`）和其他营地
- 要不要提前订：Fruita 只能预约（Recreation.gov，最早提前 6 个月），现有条目正确；**Cathedral Valley（6 个营位）、Cedar Mesa（5 个营位）两个原始营地免费、不能预约、先到先得**
- 什么时候开订：Cathedral Valley、Cedar Mesa → window: { type: "first-come" }，places: ["Cathedral Valley Campground", "Cedar Mesa Campground"]（Cathedral Valley 景点 `care-cathedral-valley` 可以放进 targets）
- 适用季节：全年，但 Cathedral Valley 的土路常常不通（要高底盘，常建议四驱；Alerts & Conditions 10-15 写着 Cathedral Valley 片区道路 “unknown, likely impassable”——这句来自搜索摘要，没在页面上核对）
- 来源：https://www.nps.gov/care/planyourvisit/primitive-campgrounds.htm
- 原文（Cathedral Valley）："No reservations; first-come, first-served."（摘自搜索结果里该页的文字，没单独打开核对）
- 备注：Fruita 团体营位另订，搜索摘要说团体营位可以提前一年（NPS 页面原话没打开核对）。Fruita 的“全年可预约”出自 https://www.nps.gov/care/learn/news/fruita-campground-soon-reservable-year-round.htm ，现有条目已经引用。

### care · 野外过夜许可（背包，含 Cathedral Valley 一带野外露营）
- 要不要提前订：要许可，但**不能提前订**，只能当天在游客中心营业时间内现场拿，免费
- 什么时候开订：→ window: { type: "first-come" }，kind: "permit"，targets: []，places: ["野外过夜（backcountry）"]
- 适用季节：全年
- 来源：https://www.nps.gov/care/planyourvisit/backpacking.htm
- 原文："The permit is free and can be obtained in person at the visitor center during normal business hours."
- 备注："may not be reserved in advance" 这句出现在搜索摘要里，背包页本身没写“不能预约”，只写了现场拿；带马、驮畜的另要 Backcountry Use Permit。

### care · 溯溪（canyoneering）、攀岩许可
- 要不要提前订：要许可（免费，当天的），游客中心门口自助登记，或发邮件到 care_permits@nps.gov（每条路线、每天一封）；不是 Recreation.gov 的预约
- 什么时候开订：没写提前多久 → 网站没收溯溪路线，建议不加
- 来源：https://www.nps.gov/care/planyourvisit/canyoneering.htm ；https://www.nps.gov/care/planyourvisit/permitsandreservations.htm
- 原文："Permits are now required."
- 备注：Burro Wash、Fivemile Wash 等 4 月 1 日到 8 月 31 日季节性关闭（搜索摘要）。导览团、游船、班车：没有。

## 尖峰石阵 pinn

### pinn · 营地的帐篷小屋（`pinn-stay-campground`）
- 要不要提前订：要。帐篷小屋就是同一个 Recreation.gov 营地（234015）里的营位（列表里是 “Site 24 TENT CABIN” 这样的营位），和帐篷位、房车位一起订，**没有另外的预订渠道或窗口**；现有 `pinn-campground` 已经覆盖，不用另开
- 什么时候开订：帐篷位、房车位最多提前 6 个月；**所有预订至少要提前 48 小时**（现有条目没写这一点，可以补进 noteZh）；团体营位最多提前 12 个月 → 现有 window: { type: "rolling", months: 6, time: "07:00", tz: "America/Los_Angeles" } 不变（07:00 太平洋 = Recreation.gov 通用的 10:00 美东，NPS 页面没写几点）
- 适用季节：全年
- 来源：https://www.nps.gov/pinn/planyourvisit/camp.htm ；https://www.nps.gov/pinn/planyourvisit/permitsandreservations.htm ；https://www.recreation.gov/camping/campgrounds/234015
- 原文："Tent and RV sites can be reserved up to 6 months in advance." / "Group sites can be reserved up to 12 months in advance." / "All reservations must be made at least 48 hours in advance." / "First come, first served sites are NOT available at this location." / "Tent Cabin check-in time: is 3pm and check out is 11am."
- 备注：NPS 的营地页没提帐篷小屋的窗口，按它们在 Recreation.gov 上是同一营地的营位推断窗口一样（6 个月）。

### pinn · 进园、洞穴（`pinn-bear-gulch-cave`、`pinn-balconies-cave`）
- 要不要提前订：不要。进园不用预约；两个洞穴不用许可、不用门票，自己带手电进
- 什么时候开订：→ 如果要写，window: { type: "first-come" }，kind: "timed-entry"，targets: []
- 适用季节：Bear Gulch 洞因汤森大耳蝠育幼季节性开放（具体月份见景点数据，现有提示已写 5 月中到 7 月中关）；Balconies 全年开，下雨发水时会临时关
- 来源：https://www.nps.gov/pinn/planyourvisit/permitsandreservations.htm （洞穴说明来自 nps.gov 的洞穴页，搜索摘要，洞穴页 caves.htm 本身打开是 404）
- 原文："No advance reservations are required to enter Pinnacles National Park."
- 备注：搜索摘要提到“护林员带队的活动要预约（Recreation.gov）”，但 permitsandreservations 页本身没写，也没查到具体哪些活动、提前多久——网站没收护林员活动，没继续查。

## The Wave 一带 wave（BLM，Paria Canyon–Vermilion Cliffs Wilderness）

### wave · Coyote Buttes North 每日抽签（现有 `wave-coyote-buttes-north` 的 also）
- 要不要提前订：要（抽签）。**现有条目已经写了每日抽签**（also: days-before 2 天、06:00–18:00 America/Denver），和官方一致，不用另开
- 什么时候开订：两天前 6:00–18:00（犹他、纳瓦霍时间），人要在 Kanab 到 Page 一带（389、89 号公路沿线约 3,272 平方英里）的地理围栏里用手机申请
- 来源：https://www.recreation.gov/permits/4251909
- 原文："Applications must be submitted two days before your hike." / "The lottery system is based on the time in Utah and the Navajo Nation." / "16 people and/or 4 groups (whichever comes first) receive permits through this Daily Lottery."
- 备注：月度抽签每天 48 人或 12 组、提前 4 个月申请，也和现有条目一致。Recreation.gov 页面**没写每日抽签几点出结果**，现有 noteZh 的 “19:15 出结果”这次没核对到出处（可能来自 BLM 的 FAQ），可以再看一下 https://www.blm.gov/arizona/public-room/fact-sheet/coyote-buttes-north-advanced-lottery-wave-faqs 和每日抽签 FAQ。

### wave · Coyote Buttes South 许可（网站没收这个景点）
- 要不要提前订：要。每天 20 人：10 人走提前预订（**先到先得，不是抽签**），10 人走两天前的每日抽签
- 什么时候开订：提前预订——每月 1 号中午 12:00（山地时间）放“往后第三个月”的整月（1 月 1 日放 4 月、2 月 1 日放 5 月……）→ 建议写成 window: { type: "block", day: 1, monthsAhead: 3, time: "12:00", tz: "America/Denver" }，also: [{ type: "days-before", days: 2, time: "06:00", tz: "America/Denver", until: "18:00" }]，kind: "permit"，targets: []，places: ["Coyote Buttes South"]
- 适用季节：全年；只许当天往返，不许过夜
- 来源：https://www.recreation.gov/permits/16851 （提前预订）；https://www.recreation.gov/permits/4251911 （每日抽签）；https://www.blm.gov/arizona/fact-sheet/coyote-buttes-south-advanced-permit-faqs （BLM FAQ，2022-10-13 发布）
- 原文："Reservations are accepted at 12:00 noon (MT) on the 1st of each month for a permit during the third month ahead." / "These permits are first-come, first-served and are made available up to four months in advance." / 每日抽签 "Applications must be submitted two days before your hike during the lottery application window (6am - 6pm)." / "10 people and/or 4 groups (whichever comes first) receive permits through this Daily Lottery."
- 备注：Recreation.gov 的 gateway 页和 BLM 都说“提前 4 个月”，是把放票那个月也算上了；按月份算是往后第 3 个月（BLM 表：1 月 1 日 → 4 月）。预订费 $6 不退，每人（狗也算）$5；每组最多 6 人；一定要四驱高底盘车（Lone Tree 路况好时两驱高底盘也行——这句来自搜索摘要）；许可要打印带着，手机截图不认（搜索摘要）。不退不改期。每日抽签几点出结果页面没写。

### wave · White Pocket（`wave-white-pocket`）
- 要不要提前订：不要许可，没有可以预订的东西（景点数据里已经写了“不用许可证”）；没另外查到官方说法，没花检索
- 来源：没查（BLM 没有针对 White Pocket 的许可页面出现在检索结果里）

### wave · Wire Pass / Buckskin Gulch 一日徒步（`wave-wire-pass`）
- 要不要提前订：不用抽签；一日徒步每人 $6 的使用费，在步道口自助付或在 Recreation.gov 买 Day Use Pass（https://www.recreation.gov/activitypass/10006175），景点数据已经写了。不需要“提前订”的条目

### wave · Paria Canyon 过夜许可（含 Buckskin Gulch 过夜，网站没收）
- 要不要提前订：要
- 什么时候开订：每月 1 号中午 12:00（山地时间）放往后第三个月（例：8 月的许可 5 月 1 日开放）；当天和第二天出发的不接受预订 → 建议写成 window: { type: "block", day: 1, monthsAhead: 3, time: "12:00", tz: "America/Denver" }，kind: "permit"，places: ["Paria Canyon / Buckskin Gulch 过夜"]
- 适用季节：全年
- 来源：https://www.recreation.gov/permits/74984
- 原文："Reservations are accepted at 12:00 noon (MT) on the 1st of each month for a permit during the third month ahead." / "permits for the month of August would become available on May 1st at 12:00 noon MT." / "Reservations are not accepted for trips beginning the day-of or the next day."
- 备注：预订费 $6，每人每晚（狗也算）$5；同一队最多 10 人。是先到先得还是抽签页面没写（按“开放时间接受预订”的写法看是先到先得）。

## 小结

| 项 | 结果 |
|---|---|
| jotr 营地（现有条目） | 查到；Belle、Hidden Valley、White Tank 先到先得，现有说明要补；Ryan 夏天关 |
| jotr Keys Ranch 导览 | 查到：提前 60 天，订到前一天，10–5 月，没有现场票 |
| jotr 野外过夜许可 | 查到：提前 6 个月（Recreation.gov），当天 16:00 前也能在总部拿，$6 |
| deva Inn / Ranch | 查到：最多 13 个月，每月 1 号放明年同月 |
| deva Stovepipe Wells Village | 没查到窗口 |
| deva Panamint Springs | 没查到（官网有机器人验证，没绕过） |
| deva 其他营地 | 查到：Furnace Creek 以外都先到先得（现有条目已写） |
| deva 野外过夜 | 查到：5 处路边露营和 Cottonwood-Marble 背包必须网上预约，提前 6 个月；其他建议办、当天也行 |
| care 进园 | 查到：不用预约 |
| care Cathedral Valley、Cedar Mesa 营地 | 查到：先到先得，免费 |
| care 野外过夜 | 查到：免费，只能在游客中心现场拿 |
| pinn 帐篷小屋 | 查到：和营地同一个 Recreation.gov 营地，6 个月；至少提前 48 小时（现有条目没写） |
| pinn 进园、洞穴 | 查到：不用预约、不用许可 |
| wave CBN 每日抽签 | 现有条目已经有；19:15 出结果这次没核对到 |
| wave Coyote Buttes South | 查到：每月 1 号 12:00 MT 放往后第 3 个月，先到先得 + 两天前每日抽签 |
| wave Paria Canyon 过夜 | 查到：同上，每月 1 号 12:00 MT 放往后第 3 个月 |
| wave White Pocket | 不用许可（没另外查官方） |
