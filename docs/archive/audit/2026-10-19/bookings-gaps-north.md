# 预约规则补漏：雷尼尔山、火山口湖、拉森火山、兰格尔–圣伊莱亚斯（2026-10-19 查，只用官方来源）

## 雷尼尔山 mora

### mora · Paradise Inn (`mora-stay-paradise-inn`)
- 要不要提前订：要（Rainier Guest Services，电话 855-755-2275 或官网 Book Now）
- 什么时候开订：官方没写提前多少个月开订；特许经营商官网 2026 年 10 月的横幅是 "Now Booking Paradise 2027"（搜索结果标题，官网对自动访问返回 403，没进去看），即 2027 年整季现在已经能订 → 建议写成 window: { type: "anytime" }，noteZh 写“2027 年整季已开订”
- 适用季节：5 月中到 9 月 30 日（中午关门），冬天关
- 来源：https://www.nps.gov/mora/planyourvisit/lodging.htm ；https://mtrainierguestservices.com/paradise-inn/ （2026-09-11 Wayback 存档）
- 原文：NPS "generally open mid-May through early October." / 特许商 FAQ "Paradise Inn is open from Mid-May and closes at noon on September 30. It is closed in winter."
- 备注：提前几个月滚动开放的规则 not found（NPS 和特许商页面都没写）。季节和 lodging-seasons.ts 里已有的天堂旅馆数据一致。

### mora · National Park Inn (`mora-stay-national-park-inn`)
- 要不要提前订：要（同上，Rainier Guest Services）
- 什么时候开订：not found（NPS 和特许商页面都没写提前多久）→ 建议 window: { type: "anytime" }
- 适用季节：全年营业
- 来源：https://www.nps.gov/mora/planyourvisit/lodging.htm ；https://mtrainierguestservices.com/accommodations/national-park-inn/ （2026-10-11 Wayback 存档）
- 原文："the National Park Inn is open year round."
- 备注：特许商取消电话 855-755-2275（8am–5pm PST）。

### mora · Cougar Rock Campground (`mora-camp-cougar-rock`)
- 要不要提前订：要（Recreation.gov 232466），另有少量先到先得营位
- 什么时候开订：分两批——提前 6 个月滚动、和提前 1 周滚动 → 建议 window: { type: "rolling", months: 6 }, also: [{ type: "rolling", days: 7 }]（Recreation.gov 营地一般是美东 10:00 放，但这个营地页面没写具体时间，不写 time）
- 适用季节：一般 5 月底到 10 月初（2026 年已关闭过冬）
- 来源：https://www.nps.gov/thingstodo/camping-at-mount-rainier.htm ；https://www.nps.gov/mora/planyourvisit/campgrounds.htm ；https://www.recreation.gov/camping/campgrounds/232466
- 原文："Reservations can be made 6 months in advance or 1 week in advance." / "First-come, first-served campsites also available." / "Typical season is late May-early October."
- 备注：Recreation.gov 页面警告用滑动窗口抢周末会被取消整单。团体营位 Memorial Day 到 Columbus Day 必须预约，Recreation.gov 写团体预约窗口 6 个月。

### mora · Ohanapecosh Campground (`mora-camp-ohanapecosh`)
- 要不要提前订：平时要（Recreation.gov，同样 6 个月 / 1 周两批）；**2026 年整年关闭**
- 什么时候开订：平时同 Cougar Rock → 建议 window: { type: "rolling", months: 6 }, also: [{ type: "rolling", days: 7 }]；2026 年要标关闭
- 适用季节：一般 5 月底到 10 月初
- 来源：https://www.nps.gov/mora/planyourvisit/campgrounds.htm ；https://www.nps.gov/thingstodo/camping-at-mount-rainier.htm
- 原文："Ohanapecosh Campground is CLOSED in 2026." （原因 "the Ohanapecosh Campground rehabilitation project"）
- 备注：2027 年会不会重开 not found。"6 months / 1 week" 那句话出自全园营地页面，没单独说 Ohanapecosh。

### mora · White River Campground (`mora-camp-white-river`)
- 要不要提前订：先到先得，不能预约（现场用 Recreation.gov App 的 Scan and Pay 付费）
- 什么时候开订：→ window: { type: "first-come" }
- 适用季节：一般 6 月底到 9 月
- 来源：https://www.nps.gov/mora/planyourvisit/campgrounds.htm
- 原文："White River Campground is first-come, first-served ONLY."
- 备注：无

### mora · 荒野过夜许可（含 Wonderland Trail、攀登路线营地 Camp Muir 等）
- 要不要提前订：鼓励预约、不是必须；夏季约 2/3 名额可预约，约 1/3 留给现场先到先得；全年过夜都要许可
- 什么时候开订（2026 年，Recreation.gov 4675317 的 important_dates）：提前抢先抽签 2 月 10 日 7:00 PT 开始申请，3 月 3 日 19:00 PT 截止，3 月 14 日 7:00 PT 起通知结果；中签者 3 月 21 日起按各自分到的时段订（抢先期只能订 1 单）；4 月 25 日 7:00 PT 剩下的公开开售；至少提前 2 天订 → 建议 window: { type: "seasonal-lottery", time: "07:00", tz: "America/Los_Angeles", seasons: [{ visit: ["05-22", "10-12"], apply: ["02-10", "03-03"], results: "03-14" }] }, also: [{ type: "fixed-date", opens: "2026-04-25", time: "07:00", tz: "America/Los_Angeles", forYear: 2026 }]（或者 seasonal-release，visit 同上、opens "04-25"）
- 适用季节：预约季是 5 月底到 10 月第一个联邦假日（Columbus Day），2026 年最后可预约日 10 月 12 日；10 月 13 日起荒野信息中心关闭，在 Longmire 博物馆先到先得或自助登记
- 来源：https://www.recreation.gov/permits/4675317 （API permitcontent 的 important_dates）；https://www.nps.gov/mora/planyourvisit/wilderness-permit.htm ；https://www.nps.gov/mora/planyourvisit/wilderness-permit-faqs.htm
- 原文："Early-access lottery applications accepted starting at 7:00 am PT." (February 10, 2026) / "Early-access lottery closes at 7:00 pm PT." (March 3, 2026) / "Reservations go on-sale at 7:00 am PT for trips starting between the end of May and the first federal holiday in October. (General On-Sale)" (April 25, 2026) / "Reservations must be made at least 2 days in advance of the trip start."
- 备注：NPS FAQ 说抽签是试行（pilot），申请"mid-February to early March (check Recreation.gov for exact dates)"；2027 年日期还没公布。想走完整 Wonderland Trail 的 NPS 建议参加抽签。Wonderland Trail 的 Carbon River 吊桥到 Sunrise 附近 Frozen Lake 一段目前关闭。费用：每单 $6 申请费 + 每人每晚 $12（15 岁以下免）。领许可要本人去荒野信息中心（出发当天或前一天）。

### mora · 攀登许可（10,000 英尺以上或上冰川，登顶）
- 要不要提前订：攀登许可本身不预约，在荒野信息中心现场办（交 Climbing Cost Recovery Fee）；但攀登路线上过夜（Camp Muir 等，Recreation.gov 里叫 "High and Moderate Use Climbing Routes"）走上面同一套荒野许可预约，旺季鼓励预约
- 什么时候开订：同荒野许可（抽签 + 4 月 25 日开售）→ 可以合并进上一条，不单列
- 适用季节：10 月到 4 月在 Paradise Old Ranger Station 自助登记
- 来源：https://www.recreation.gov/permits/4675317 ；https://www.nps.gov/mora/planyourvisit/wilderness-permit.htm
- 原文："Climbing permits can be obtained in person at a Wilderness Information Center." / "A climbing permit is required for travel above 10,000 feet or on glaciers."
- 备注：一般游客跟向导公司登顶的由向导公司办，这里不展开。

## 火山口湖 crla

### crla · Crater Lake Lodge (`crla-stay-crater-lake-lodge`)
- 要不要提前订：要（特许经营商 Explor Crater Lake，官网或电话 866-292-6720）；官方说整季都满
- 什么时候开订：最多提前 365 天 → 建议 window: { type: "rolling", days: 365 }（或 months: 12）
- 适用季节：一般 5 月中到 10 月初
- 来源：https://www.nps.gov/crla/planyourvisit/craterlakelodge.htm ；https://explorecraterlake.com/faq/ （官网对自动访问返回 403，用的是 2026-06-10 的 Wayback 存档）
- 原文：NPS "Reservations can be made up to 365 days in advance." / 特许商 FAQ "Accommodations in Crater Lake are at capacity the entire season. Book as soon as possible in order to secure reservations."
- 备注：NPS 这页最后更新 2024-05-31；没写每天几点放。2027 年具体开业日期 not found。

### crla · The Cabins at Mazama Village (`crla-stay-mazama-cabins`)
- 要不要提前订：要（同上，Explor Crater Lake）
- 什么时候开订：同 Lodge，最多提前 365 天 → 建议 window: { type: "rolling", days: 365 }
- 适用季节：一般 5 月底到 9 月（开门日看积雪）
- 来源：https://www.nps.gov/crla/planyourvisit/craterlakelodge.htm ；https://www.nps.gov/places/mazama-cabins.htm
- 原文："Reservations can be made up to 365 days in advance." / "Operating dates are typically late May through September"
- 备注：365 天这句在同一页上，是对 Lodge 和 Cabins 一起说的（搜索摘要里 cabins 地点页也写 "can be made up to a year in advance of your visit"，没有单独打开核对）。

### crla · Mazama Village Campground (`crla-camp-mazama-village`)
- 要不要提前订：分两段——开门（5 月底，看积雪）到 6 月 30 日先到先得；7 月 1 日到 9 月 30 日（最后一晚）可以在 Recreation.gov（10337002）预约
- 什么时候开订：Recreation.gov 设施数据写预约窗口 12 个月（"reservationWindow" value 12, units Months），也就是滚动提前 12 个月 → 建议 window: { type: "rolling", months: 12 }，applies: [{ from: "07-01", to: "09-30" }]；另写一条或在 noteZh 说明 6 月底以前先到先得
- 适用季节：一般 6 月开、9 月下旬关（按营位积雪每年定）
- 来源：https://www.recreation.gov/camping/campgrounds/10337002 （API 设施数据，2026-06-15 认证）；https://explorecraterlake.com/stay-at-crater-lake/mazama-campground/ （2026-07-06 Wayback 存档）；https://explorecraterlake.com/faq/ （2026-06-10 Wayback 存档）
- 原文：特许商 "Late May, 2026 – June 30th, 2026 – First come first serve (weather dependent)" / "July 1st, 2026 – October 1st, 2026 – Open for reservations (September 30th, 2026 is the last night for overnight accommodations)" / FAQ "Note: campsite reservations are available starting July 1, 2026 online at Rec.gov"
- 备注：12 个月窗口来自 Recreation.gov 的机器数据字段，页面正文没写这句话，可信度中等；没写每天几点放（Recreation.gov 营地通常美东 10:00）。徒步、骑车来的 $5 营位先到先得。2026-10-14 的 NPS 路况页说 A、B 两个营区先到先得开着（季末）。

### crla · Lost Creek Campground (`crla-camp-lost-creek`)
- 要不要提前订：先到先得（NPS 管理），**2025 年没开，2026 年 NPS 路况页仍列在 "What's Closed"**
- 什么时候开订：→ window: { type: "first-come" }
- 适用季节：not found（营地页 "Operating Hours & Seasons" 下面是空的）
- 来源：https://www.nps.gov/crla/planyourvisit/lost_creek.htm （最后更新 2025-05-06）；https://www.nps.gov/crla/planyourvisit/conditions.htm （最后更新 2026-10-14）
- 原文："Lost Creek Campground will not be open in 2025." / 路况页 What's Closed: "Lost Creek Campground"
- 备注：营地页本身没写先到先得那句（Reservations 标题下空着），"first come first served" 出自 NPS 搜索摘要；关闭原因、2027 年会不会开 not found。

### crla · 荒野过夜许可（backcountry permit）
- 要不要提前订：不能预约，要许可但是现场自助领（免费与否页面没写）
- 什么时候开订：→ window: { type: "first-come" }
- 适用季节：最适合 7 月中到 9 月
- 来源：https://www.nps.gov/crla/planyourvisit/conditions.htm ；https://www.nps.gov/crla/planyourvisit/permits.htm
- 原文："Backpacking permits are required and available on a self serve basis at the Ranger Station, 24/7." / 指定营位按 "with your backcountry permit on a first come, first served basis"
- 备注：permits 页同时写 "Crater Lake National Park does NOT offer or require reservations to enter the park."。PCT 徒步者有 Grouse Hill 三个专用营位。

## 拉森火山 lavo

营地开放日期（NPS hours 页，2026-09-16 更新，表里没写年份，应是 2026 年）：Manzanita Lake 全服务 5/23–10/7、A/B 两个营区 10/8 起干营到下雪；Butte Lake 5/30–9/1、B 区 9/2–10/14 干营；Summit Lake North 6/27–9/8；Summit Lake South 6/27–9/8、9/9–9/23 干营；Warner Valley 6/16–10/14（特许商页面写 6/12–10/12）；Southwest 常年开（有雪时帐篷位置会变）；Juniper Lake 关闭、在准备重开。来源 https://www.nps.gov/lavo/planyourvisit/hours.htm

### lavo · Manzanita Lake Camping Cabins (`lavo-stay-manzanita-cabins`)
- 要不要提前订：要，在 Recreation.gov 订（233257，特许商 Lassen Lodging 管理，官网 Book Now 链到 Recreation.gov）
- 什么时候开订：not found（Recreation.gov 设施页、特许商页面都没写提前多久；NPS 西语营地页的 "seis meses" 是对营地说的，没提木屋）→ 如果要写，只能保守写 window: { type: "anytime" }，或者照营地写 rolling 6 个月并注明是推断（不建议）
- 适用季节：2026 年 5 月 21 日到 10 月 12 日（看天气）
- 来源：https://www.recreation.gov/camping/campgrounds/233257 ；https://lassenlodging.com/manzanita-camping-cabins/ （官网对自动访问返回 403，用的是 2026-08-31 Wayback 存档）
- 原文："Manzanita Lake Camping Cabins will be open for the 2026 season from May 21 through October 12, 2026 weather dependent."
- 备注：自助入住（确认邮件里有密码锁号码），木屋里没有水电和厕所。

### lavo · Drakesbad Guest Ranch (`lavo-stay-drakesbad`)
- 要不要提前订：要（Lassen Lodging；吃饭、骑马这些对一日游客也要预约）
- 什么时候开订：not found。NPS FAQ（据搜索摘要）说 "Often, reservations need to be made at least 6 months in advance"——这是“建议至少提前 6 个月”，不是开订规则；旧新闻说 11 月起接受一年半后的预订，2018 年前后的说法、不是官方页面，没采用 → 建议 window: { type: "anytime" }
- 适用季节：NPS 旧页（2020 年更新）写 6 月初到 10 月初；2026 年季节特许商页面只写 "preparing for the 2026 Season"
- 来源：https://www.nps.gov/lavo/planyourvisit/drakesbad.htm ；https://lassenlodging.com/drakesbad/ （2026-10-12 Wayback 存档）；https://www.nps.gov/lavo/faqs.htm （只看了搜索摘要）
- 原文：NPS "Reservations are required." / 特许商 "Drakesbad Guest Ranch is preparing for the 2026 Season. Please select "Book Your Stay" to begin planning your adventure."
- 备注：Drakesbad 和 Warner Valley 营地 2024 年整季关闭（特许商有一篇 "drakesbad-lodge-and-warner-valley-campground-remain-closed-for-2024-season"），2025 年 7 月才延迟重开；2026 年特许商在做“重开 + America 250”的 $250 一晚活动。季节没有官方日期，lodging-seasons.ts 里如果有要对一下。

### lavo · Manzanita Lake Campground (`lavo-camp-manzanita-lake`)
- 要不要提前订：要（Recreation.gov 234039）
- 什么时候开订：NPS 西语营地页写提前 6 个月可订（英文页没写，Recreation.gov 设施数据里也没有 reservationWindow 字段）→ 建议 window: { type: "rolling", months: 6 }（Recreation.gov 一般美东 10:00 放，这里页面没写，不写 time）
- 适用季节：全服务 5/23–10/7；10/8 以后 A/B 区干营（这段要不要订没写）
- 来源：https://www.nps.gov/lavo/planyourvisit/camping-in-campgrounds.htm ；https://www.nps.gov/lavo/espanol/campismo.htm （2024-10-03 更新）；https://www.recreation.gov/camping/campgrounds/234039
- 原文："Reservations are required for all campgrounds except Juniper Lake and Southwest Walk-in." / "Reservaciones se pueden hacer con seis meses de anticipación."
- 备注：6 个月出自西语页，可信度中等，英文 NPS 页面没有这句话。团体营位只在春秋可订。

### lavo · Butte Lake Campground (`lavo-camp-butte-lake`)
- 要不要提前订：要（Recreation.gov 234156）
- 什么时候开订：同上，6 个月（西语页）→ window: { type: "rolling", months: 6 }
- 适用季节：5/30–9/1 全服务；9/2–10/14 B 区干营
- 来源：同 Manzanita Lake；https://www.recreation.gov/camping/campgrounds/234156
- 原文：同上
- 备注：Recreation.gov 设施数据 reservationCutOff 写 "Not Reservable"（意义不明，季末关闭后的状态？）。

### lavo · Summit Lake North (`lavo-camp-summit-lake-north`)
- 要不要提前订：要（Recreation.gov 234041）
- 什么时候开订：同上，6 个月 → window: { type: "rolling", months: 6 }
- 适用季节：6/27–9/8
- 来源：同 Manzanita Lake；https://www.recreation.gov/camping/campgrounds/234041
- 原文：同上
- 备注：无

### lavo · Summit Lake South (`lavo-camp-summit-lake-south`)
- 要不要提前订：要（Recreation.gov 234040）
- 什么时候开订：同上，6 个月 → window: { type: "rolling", months: 6 }
- 适用季节：6/27–9/8 全服务；9/9–9/23 干营
- 来源：同 Manzanita Lake；https://www.recreation.gov/camping/campgrounds/234040
- 原文：同上
- 备注：无

### lavo · Southwest Walk-in Campground (`lavo-camp-southwest`)
- 要不要提前订：先到先得，不能预约（Recreation.gov 10370498 只用来 Scan & Pay 付费）
- 什么时候开订：→ window: { type: "first-come" }
- 适用季节：常年开（有雪时帐篷位置改变）
- 来源：https://www.nps.gov/lavo/planyourvisit/camping-in-campgrounds.htm ；https://www.recreation.gov/camping/campgrounds/10370498
- 原文：NPS "Juniper Lake and Southwest Walk-in campgrounds are available first-come, first-served and cannot be reserved." / Recreation.gov "The Southwest Campground is a first-come first-serve campground."
- 备注：Recreation.gov 两处说法不一（20 个步行帐篷位 + 5 个房车位 / 19 个 + 10 个）。

### lavo · Warner Valley Campground (`lavo-camp-warner-valley`)
- 要不要提前订：要。15 个营位（1–15 号）在 Recreation.gov（10047182）提前订，16–18 号在 Drakesbad Guest Ranch 订
- 什么时候开订：not found（特许商和 Recreation.gov 都没写提前多久；NPS 营地页 FAQ 还把 Warner Valley 列为先到先得，和特许商页面矛盾，以特许商 2026 年页面为准）→ 建议 window: { type: "anytime" }，或按全园 6 个月写并注明
- 适用季节：2026 年 6 月 12 日到 10 月 12 日（特许商）；NPS hours 页写 6/16–10/14
- 来源：https://lassenlodging.com/warner-campground/ （2026-06-15 Wayback 存档）；https://www.recreation.gov/camping/campgrounds/10047182 ；https://www.nps.gov/lavo/planyourvisit/camping-in-campgrounds.htm
- 原文："Warner Valley Campground has 18 campsites and offers sites 1 thru 15 sites that can be reserved in advance online and sites 16-18 can be reserved at Drakesbad Guest Ranch." / NPS FAQ "The only FCFS campsites at Lassen are Juniper Lake, Warner Valley, and Southwest Walk-in campgrounds."
- 备注：营地由 Lassen Lodging（特许商）经营，每晚 $21 加税；路是陡、有车辙的砂石路，不建议房车。

### lavo · 荒野过夜许可（wilderness permit）
- 要不要提前订：全年过夜都要许可，在 Recreation.gov（4675334）预约
- 什么时候开订：提前 90 天滚动开放，每天美东 10:00 → 建议 window: { type: "rolling", days: 90, time: "10:00", tz: "America/New_York" }
- 适用季节：全年
- 来源：https://www.recreation.gov/permits/4675334 （API permitcontent 的 season_information）；https://www.nps.gov/lavo/planyourvisit/wilderness-permit-information.htm
- 原文："Reservations can be made online, year-round, 90-days before trip start date on a rolling basis. Reservations open daily at 10:00 am Eastern Standard Time."
- 备注：每单 $6 预约费 + 每人每次 $5（15 岁以下免）；Recreation.gov 系统里的配置是 max_booking 3 个月（和 90 天一致）。important_dates 写 "Wilderness permits are required year around."（2027 年）。

## 兰格尔–圣伊莱亚斯 wrst

### wrst · Kennicott Glacier Lodge (`wrst-stay-kennicott-glacier-lodge`)
- 要不要提前订：要（私营旅馆，电话 1-907-258-2350 或官网在线订；晚餐也要预约）
- 什么时候开订：没有固定开订规则；2026 年 6 月时已经同时接受 2026、2027 两年的预订（2026 年 10 月的存档只剩 2027 季）→ 建议 window: { type: "anytime" }，noteZh 写“2027 年整季已开订”
- 适用季节：2026 年 5 月 23 日到 9 月 7 日 15:00；2027 年 5 月 29 日到 9 月 6 日 15:00
- 来源：https://www.kennicottlodge.com/reservations/ （官网对自动访问返回 403，用的是 2026-06-09 Wayback 存档）；https://www.kennicottlodge.com/reservations/reservation-policies/ （2026-09-25 存档）
- 原文："Kennicott Glacier Lodge will be open for Guests from May 23 to 3pm on September 7, 2026 and May 29 to 3pm on September 6, 2027. We are now accepting reservations for 2026 and 2027 by phone and through our online booking system."
- 备注：2027 年的订单要全额付款才确认；到达前 60 天以上取消每间每晚收 $50，60 天以内不退。lodging-seasons.ts 如果收了这家，可以补 2027 年日期。

### wrst · Kendesnii Campground (`wrst-camp-kendesnii`)
- 要不要提前订：不用，也不能预约；先到先得、免费、全年开放（10 个营位）
- 什么时候开订：→ window: { type: "first-come" }
- 适用季节：全年
- 来源：https://www.nps.gov/wrst/planyourvisit/camping-along-the-nabesna-road.htm （最后更新 2022-08-16）
- 原文："No reservations are required and none are taken." / "It is free and open year-round."
- 备注：在 Nabesna Road 27.8 英里处（有的 NPS 页面写 28.2）；砂石路常常颠，建议高底盘车。

### wrst · 公园的公共木屋（public use cabins，places 用，不进行程）
- 要不要提前订：只有 Viking Lodge、Caribou Creek、Nugget Creek、Esker Stream 四座要预约（发邮件表格给公园，不走 Recreation.gov）；其他木屋（多是要坐小飞机去的）先到先得
- 什么时候开订：最多提前 6 个月；公园建议至少提前两周，48 小时以内的申请可能来不及处理 → 建议 window: { type: "rolling", months: 6 }
- 适用季节：全年（5–9 月和节假日周末最抢手）
- 来源：https://www.nps.gov/wrst/planyourvisit/public-use-cabins.htm （最后更新 2025-08-13）
- 原文："Viking Lodge, Caribou Creek, Nugget Creek, and Esker Stream are the only cabins that require reservations." / "Reservations can be made up to six months in advance of your desired stay."
- 备注：费用页面没看。一般游客用不到，可以只在公园页列出。

### wrst · 其他（没有单独列的必要）
- 去 McCarthy 的小飞机（Wrangell Mountain Air 等）、冰川徒步、观光飞行都是私营公司，没有官方的开订规则，NPS 只说要提前订；Kennicott Glacier Lodge FAQ："We recommend making reservations in advance directly with the guiding companies to guarantee availability."（2026-10-04 存档）。选矿厂导览已经有 `wrst-kennecott-mill-tour`。
- Kennecott 接驳车（McCarthy 步行桥到 Kennecott）没查到要预约的官方说法，这次没查。

