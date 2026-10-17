# 公园时区"坑"清单（2026-10-16 调研）

只调研，没改项目文件。来源只用官方或运营方页面；查不到的写"未找到官方说法"。
WebSearch 本轮额度用完后，剩下几项只能按已知官方页面直接打开核对，少数几家没核到，见文末"没查到的"。

## 先说结论

### 1. `timeZone` 要不要改

`src/data/parks.ts` 里 59 个 `timeZone`（55 座国家公园、4 处园外名胜）全部核对过，**没有填错的**，不用改。
少数园区内有区域实际用另一个时区：

| 公园 | 现在 | 园内要用别的时区的 | 怎么处理 |
|---|---|---|---|
| `thro` 西奥多·罗斯福 | America/Denver（South Unit） | North Unit 五个景点：`thro-cannonball-concretions`、`thro-little-mo`、`thro-caprock-coulee`、`thro-river-bend`、`thro-oxbow-overlook` 用中部时间（America/Chicago） | 现在只在提示里说；如果做景点级时区，就给这 5 个填 America/Chicago |
| `wave` 波浪谷 | America/Denver（犹他） | `wave-the-wave`（36.996°N）、`wave-white-pocket`（36.957°N）其实在亚利桑那境内（37°N 以南），当地是亚利桑那时间；但 Wire Pass 步道口、Toadstools、Paria 游客站都在犹他，许可证按犹他时间 | 保持 America/Denver 合理，在这两个景点的提示里说一句 |
| `jasp` 贾斯珀 | America/Edmonton | `jasp-mount-robson`（BC 省）用 BC 的 Pacific time，**全年 UTC-7** | 现在的提示"冬季差 2 小时"**错了**，见下 |
| `mova` 纪念碑谷 | America/Denver | 游客中心（36.982°N）在亚利桑那一侧、Forrest Gump Point 在犹他一侧，但都在纳瓦霍保留地上、都实行夏令时 | 不用改 |
| `ante` 羚羊峡谷 | America/Phoenix | 峡谷在纳瓦霍保留地上（保留地实行夏令时），但**所有导览公司、码头都按亚利桑那时间** | 不用改 |

项目里现在**没有景点级的时区**：一天的时间线、日出日落都按当天第一站所在公园的时区算（`src/components/plan/planner.tsx` 的 `sunInfo`、`dayViews.timeZone`）。所以同一天里跨时区时会差 1 小时，最容易出事的几种组合：

- 佩吉（羚羊峡谷、马蹄湾，亚利桑那时间）和纪念碑谷（纳瓦霍时间）排在同一天：3 月第二个周日到 11 月第一个周日，纪念碑谷快 1 小时，Valley Drive 最晚入场 15:30（冬季 14:30）是纳瓦霍时间；
- 锡安 / 布莱斯 / 卡纳布（犹他）和佩吉、大峡谷（亚利桑那）同一天：夏天犹他快 1 小时；
- 西奥多·罗斯福 North Unit 和 South Unit 同一天：North Unit 快 1 小时，全年；
- 大盆地（太平洋时间）和犹他那边同一天：犹他快 1 小时，全年。

### 2. 项目里现有文字要改的地方（供参考，没动）

1. **`src/data/attractions/jasp.ts:372` 和 `src/data/lodging.ts:2045`**："BC 省这边用太平洋时间，比贾斯珀晚 1 小时（冬季差 2 小时）"。BC 省 2026 年 3 月 8 日是最后一次调钟，之后全年 UTC-7（省政府把它叫 Pacific time）；艾伯塔 11 月 1 日起全年 UTC-6。所以贾斯珀和罗布森山、Valemount **一年到头都只差 1 小时**，不会差 2 小时。
2. **`docs/DEVELOPMENT.md` 的时区说明**："幽鹤所在的 Field 一带据说也跟着改了，但没找到 BC 省的官方说法"。现在能说得更具体：BC 省政府页面写明 East Kootenay "remain aligned with Alberta and use MDT (UTC-6) year round"；Golden 镇议会 9 月初先决定改成全年 UTC-7，9 月 22 日又推翻、改成全年 UTC-6，和艾伯塔一致。Field 在 Columbia Shuswap 区域 Area A（Golden 周边的乡村区），Golden 这次的调查和复议都包括 Area A 的居民，但**没找到专门写 Field 的官方说法**。按现在的信息，幽鹤用 America/Edmonton 是对的，班夫到幽鹤不用调表。注意 BC 省政府那页（2026-09-17 发布）和 Golden 镇官网的旧公告都还写着 Golden 改 UTC-7，已经过时。
3. **时区数据版本**：本机 Node 24.11.1 自带 tz 2025b，`America/Edmonton` 在 2026 年 12 月还算成 UTC-7、`America/Vancouver` 算成 UTC-8，都是旧规则。IANA 2026b 才有 BC 全年 UTC-7，2026c（2026-07-08 发布）才有艾伯塔全年 UTC-6，最新是 2026d。用户的浏览器如果时区数据旧，11 月以后班夫、贾斯珀、幽鹤的日出日落和"今天"模式的时间会差 1 小时。
4. **Parks Canada 的"山地时间早上 8 点"**（`src/data/bookings.ts`、`src/data/activities.ts` 里梦莲湖班车、欧哈拉湖抽签、伯吉斯页岩、营地开订）：2027 年 1–4 月这些开订日，"Mountain Time" 在艾伯塔是 UTC-6，比美国山地标准时间（丹佛、盐湖城冬天 UTC-7）早 1 小时。从美国山地时区抢票的人会晚一小时。文案最好写"艾伯塔时间（UTC-6）早上 8 点"。
5. **大弯 Boquillas**：NPS 2024 年的公告说墨西哥科阿韦拉州的钟不跟夏令时、夏天比美方口岸慢 1 小时；但墨西哥 2022 年的《时区法》把 Boquillas 所在的 Ocampo 列进了跟美国同步夏令时的边境市镇。两边说法冲突，见下面大弯一节。

### 3. 最容易搞错的地方

1. **羚羊峡谷**：峡谷在纳瓦霍保留地上，保留地实行夏令时，手机常跳到犹他 / 纳瓦霍时间；但**每一家导览公司和 Antelope Point 码头都按亚利桑那时间**（全年 UTC-7）。夏天（3 月第二个周日到 11 月第一个周日）手机自动时间会快 1 小时。Ken's Tours 的原话是 "Not Utah Time — Not Navajo Nation Time"。
2. **佩吉 → 纪念碑谷**：一个按亚利桑那时间，一个按纳瓦霍时间，夏天差 1 小时；冬天一样。
3. **波浪谷抽签**：申请、开奖、确认付款都按犹他 / 纳瓦霍时间；第二天 8:30 的领证和安全讲解按领证点的当地时间：卡纳布按犹他、佩吉按亚利桑那，夏天两地差 1 小时。
4. **鲍威尔湖**：在犹他境内的 Lone Rock 按亚利桑那时间；Bullfrog、Halls Crossing、Hite 按犹他时间。
5. **瓜达卢佩山**：公园用山地时间，园里大部分地方手机连的是中部时区的基站，会显示快 1 小时，还会来回跳；McKittrick 峡谷 17:00 锁门要按山地时间算。
6. **西奥多·罗斯福**：North Unit 中部时间、South Unit 和 Medora 山地时间，全年差 1 小时。
7. **大盆地**：公园在内华达，用太平洋时间；Lehman Caves 导览和 Recreation.gov 放票都按太平洋时间。紧挨犹他（山地时间，全年快 1 小时），Baker 一带手机可能显示犹他时间。
8. **加拿大落基山（2026 年 11 月 1 日起）**：艾伯塔全年 UTC-6；BC 大部分全年 UTC-7；Golden、East Kootenay 跟艾伯塔一样是 UTC-6。贾斯珀 → 罗布森山全年差 1 小时；班夫 → 幽鹤不用调。冬天从美国蒙大拿（MST，UTC-7）开进艾伯塔要快 1 小时，以前冬天两边一样。
9. **大峡谷**：全年亚利桑那时间。从犹他（锡安、卡纳布）去北缘，或者从东门经 Cameron（纳瓦霍保留地）进来，夏天会碰到差 1 小时；从拉斯维加斯过来，冬天亚利桑那比内华达快 1 小时，夏天一样。
10. **大弯 Boquillas**：口岸按美方中部时间开放，墨西哥那边的钟可能和美方不一样（官方说法冲突），回程按美方口岸关门时间（16:00 中部时间）算。

### 4. 按特殊时间计时的项目

| 项目 | 按什么时间 | 来源 |
|---|---|---|
| 上羚羊、下羚羊、羚羊 X、水洞峡谷各家导览 | 亚利桑那时间（MST，全年 UTC-7），不是纳瓦霍时间 | 各公司官网，见羚羊峡谷一节 |
| Antelope Point Marina 游船 | 亚利桑那时间 | 码头官网 |
| 鲍威尔湖皮划艇（佩吉的公司） | 亚利桑那时间 | Lake Powell Adventure Co.、Hidden Canyon Kayak |
| 纪念碑谷部落公园的开放时间 | 纳瓦霍时间（实行夏令时） | 部落公园官网只写了钟点；纳瓦霍保留地实行夏令时见 NPS |
| 波浪谷每日抽签、季度抽签 | 犹他 / 纳瓦霍时间；领证按当地时间 | Recreation.gov、Kane County 旅游局 |
| Wahweap、Antelope Point、Lone Rock、Lees Ferry | 亚利桑那时间（Lone Rock 在犹他境内也一样） | NPS 格伦峡谷 |
| Bullfrog、Halls Crossing、Hite | 犹他时间 | NPS 格伦峡谷 |
| Lehman Caves 导览 | 太平洋时间 | NPS 大盆地 |
| 西奥多·罗斯福 North Unit 游客中心 | 中部时间 | NPS |
| 石化林 8:00–17:00 | 全年山地标准时间 | NPS |
| Parks Canada 预约开放（2026 年 11 月以后） | 艾伯塔时间 UTC-6（官方还叫 Mountain Time） | 艾伯塔省政府 |

---

## 逐座公园

### 羚羊峡谷 `ante`

**数据核对**
- `timeZone: "America/Phoenix"` 对。羚羊峡谷在纳瓦霍保留地上（保留地实行夏令时），但所有导览公司、码头都明确按亚利桑那时间发团，这里用 Phoenix 正合适。
- 6 个景点（`ante-upper-antelope-canyon`、`ante-lower-antelope-canyon`、`ante-antelope-canyon-x`、`ante-waterholes-canyon`、`ante-antelope-canyon-kayak`、`ante-antelope-canyon-boat-tour`）都按亚利桑那时间，不用单独设时区。现有提示（"各家都按亚利桑那时间发团"）是对的。

**项目计时（各家原话）**

纳瓦霍部落公园官网列出的授权公司（navajonationparks.org 的 Antelope Canyon Tour Operators 页）：上羚羊 6 家、下羚羊 2 家、羚羊 X 的 Taadidiin Tours；水洞峡谷那家不在这页的列表里。

上羚羊：
- **Antelope Canyon Tours, Inc.**（从佩吉镇上 22 S Lake Powell Blvd 出发）：按 "Arizona Time (MST non-daylight)"，Page 是 "ALWAYS -7 UTC, we never change times"；FAQ 里还说保留地上 "all businesses in this area follow Phoenix Arizona time"。提前 30 分钟到。
- **Antelope Canyon Navajo Tours**（98 号公路部落公园入口）：团的时间写的是 "8:45 a.m. MST" 到 "4 p.m. MST"，要提前 1 小时到。没写夏令时怎么算，但标的是 MST（标准时间）。
- **Adventurous Antelope Canyon Tours**：FAQ 原话 "We operate on MOUNTAIN STANDARD TIME all year round"，"same time as Phoenix, AZ and Page, AZ"，并提醒手机时间 "can jump around in this area"。
- **Antelope Slot Canyon Tours**（Chief Tsosie，佩吉镇上 55 S Lake Powell Blvd）：首页写 "We Operate on MST"，没有更多说明。
- **Tse Bighanilini Tours**：FAQ 写纳瓦霍保留地夏令时期间用 MDT，"we operate on MST year-round, aligning with Page's time"。
- **Antelope Hogan Tours**：未找到官方说法（官网只有民宿入住时间）。

下羚羊：
- **Ken's Tours**：服务条款原话 "All times on our site and confirmations are in ARIZONA TIME"，"No Daylight Saving Time — Not Utah Time — Not Navajo Nation Time"；"Because the Utah State Line is less than 7 miles away, cell phone towers from Utah often show the wrong time"，"Manually set your cell phone to PHOENIX, AZ time"。提前 30 分钟签到。
- **Dixie's Lower Antelope Canyon Tours**：FAQ 原话 "We follow Arizona Standard Time (MST). We share the same time as the City of Page, Flagstaff, Grand Canyon, and Phoenix."；另一篇说明写纳瓦霍保留地和犹他都实行夏令时、手机和 GPS 夏天会自动跳过去。提前 45 分钟到。

羚羊 X：
- **Taadidiin Tours**：FAQ 原话 "We are located on the reservation BUT WE DO NOT OPERATE ON Daylight Savings Time"，"The time on your phone will change when you are in our area"，"We are the same time as Page, AZ, Flagstaff, AZ, and Phoenix, AZ ALL YEAR"。

水洞峡谷：
- **Waterhole Canyon Experience**：FAQ 原话 "Waterhole Canyon Experience, LLC and Page, Arizona operate on Mountain Standard Time (MST) year round"，"same time as Phoenix, Arizona"。提前 15 分钟签到并付款（首页写 30 分钟，两处不一样）。

鲍威尔湖水上部分：
- **Antelope Point Marina**（游船）：原话 "We follow Arizona Standard Time (MST). We share the same time as the City of Page, Flagstaff, Grand Canyon, and Phoenix."，夏令时期间（3 月 8 日到 11 月 1 日）开车经过纳瓦霍保留地和犹他会碰到时差，"Your electronic devices will take that into consideration and also move 1 hour ahead"。
- **Lake Powell Adventure Co.**：FAQ 原话 "Page operates on Arizona Time"，"If your cell phone is set to AUTO, it may pick up a Utah signal and show the wrong time"，建议手动设成 "Phoenix, AZ (PHX)"。
- **Hidden Canyon Kayak**：FAQ 的日出日落表标的是 "AZT"（亚利桑那时间），没有别的说明。
- **Lake Powell Paddleboards & Kayaks**、**High Desert Paddle Co.**：未找到官方说法。
- NPS：Antelope Point 公共坡道一带 "Antelope Point operates on Arizona (Mountain Standard) Time year-round"。

**手机提醒**
- 佩吉一带离犹他州界不到 7 英里，羚羊峡谷、Antelope Point 又在纳瓦霍保留地上，手机自动时间常跳成犹他 / 纳瓦霍时间（UTC-6）。
- 只在夏令时期间有差别：3 月第二个周日到 11 月第一个周日（2026 年是 3 月 8 日到 11 月 1 日），手机快 1 小时；冬天一样。
- 建议：手机手动设成 Phoenix。

**来源**
- 部落公园授权名单：https://navajonationparks.org/guided-tour-operators/antelope-canyon-tour-operators/
- Antelope Canyon Tours：https://www.antelopecanyon.com/faq/
- Antelope Canyon Navajo Tours：https://navajotours.com/tour-packages/guided-sightseers-tours/
- Adventurous Antelope Canyon Tours：https://adventurousantelopecanyon.com/faq/
- Antelope Slot Canyon Tours：https://antelopeslotcanyon.com
- Tse Bighanilini Tours：https://www.tsebighanilini.com/faq/
- Ken's Tours：https://lowerantelope.com/terms-of-service/
- Dixie's：https://antelopelowercanyon.com/faq 、https://www.antelopelowercanyon.com/blog/what-you-should-know-before-visiting-the-lower-antelope-canyon
- Taadidiin Tours：https://www.antelopecanyon-x.com/faq/
- Waterhole Canyon Experience：https://waterholecanyonexperience.com/faq/
- Antelope Point Marina：https://antelopepointlakepowell.com/guest-service/
- Lake Powell Adventure Co.：https://lakepowelladventure.com/current-time-in-page-arizona
- Hidden Canyon Kayak：https://www.hiddencanyonkayak.com/faq
- NPS 格伦峡谷开放时间：https://www.nps.gov/glca/planyourvisit/seasonalhours.htm
- 纳瓦霍保留地实行夏令时（NPS 谢伊峡谷）：https://www.nps.gov/cach/planyourvisit/hours.htm

### 马蹄湾和佩吉 `hsbd`

**数据核对**
- `timeZone: "America/Phoenix"` 对。7 个景点都在亚利桑那、不在保留地上（马蹄湾、大坝观景点、Carl Hayden 游客中心、Wahweap、Lees Ferry 出发的皮划艇、佩吉出发的漂流、Wahweap 出发的游船），全按亚利桑那时间。

**项目计时**
- 马蹄湾停车场：日出开门、日落停止放车进场（horseshoebend.com 的收费表，页脚写由佩吉市和格伦峡谷管理，但这个域名是不是市政府自己的没法确认）；没写哪个时区，按亚利桑那时间。
- Wahweap：NPS 原话 "Wahweap operates on Arizona (Mountain Standard) Time Year-round"。
- Lees Ferry（`hsbd-horseshoe-bend-kayak` 的出发点）："Lees Ferry operates on Arizona (Mountain Standard) Time year-round"。
- Wilderness River Adventures（`hsbd-glen-canyon-float`）、Lake Powell Resorts（`hsbd-glen-canyon-dam-cruise`）：未找到官方说法，两家都在佩吉 / Wahweap，按亚利桑那时间。
- 佩吉市：未找到市政府的官方说法；各导览公司、码头都写佩吉和凤凰城同一个时间。

**手机提醒**：和羚羊峡谷一样，佩吉离犹他州界很近，夏天手机可能快 1 小时。

**来源**
- https://www.nps.gov/glca/planyourvisit/seasonalhours.htm
- https://horseshoebend.com/parking-fees/

### 鲍威尔湖、格伦峡谷（不是单独的公园，分散在 `ante`、`hsbd`）

**项目计时**（NPS 格伦峡谷开放时间页，2026-05-19 更新）：
- "Wahweap operates on Arizona (Mountain Standard) Time Year-round"
- "Despite its pysical location in Utah, Lone Rock operates on Arizona (Mountain Standard) Time year-round"
- "Antelope Point operates on Arizona (Mountain Standard) Time year-round"
- "Lees Ferry operates on Arizona (Mountain Standard) Time year-round"
- "Bullfrog, Halls Crossing, Hite, and Escalante are on Utah (Mountain Standard) Time"（写的是 "Utah (Mountain Standard)"，意思应该是按犹他时间，夏天实行夏令时）

网站目前没收 Bullfrog、Halls Crossing 的景点；以后加的话要用 America/Denver，而且 Bullfrog–Halls Crossing 渡轮按犹他时间。

**手机提醒**：Lone Rock 在犹他，手机会显示犹他时间，但营地和收费站按亚利桑那时间，夏天差 1 小时。

**来源**：https://www.nps.gov/glca/planyourvisit/seasonalhours.htm

### 纪念碑谷 `mova`

**数据核对**
- `timeZone: "America/Denver"` 对。部落公园在纳瓦霍保留地上，保留地实行夏令时，和犹他、科罗拉多、新墨西哥一样。
- 游客中心 `mova-the-view`（36.982°N）其实在亚利桑那一侧，`mova-forrest-gump-point`（37.10°N）在犹他一侧，两边都实行夏令时，不用分。

**项目计时**
- 部落公园官网写了各时段的开放时间（10 月 3–16 日：观景台 7:00–19:00，Valley Drive 8:00–18:00、最晚 15:30 进；10 月 17 日起冬季：观景台 8:00–17:00，Valley Drive 8:00–17:00、最晚 14:30 进），但**没写是哪个时区**。
- 纳瓦霍保留地实行夏令时：NPS 原话 "From March through November, the Navajo Nation observes Mountain Daylight Savings Time"，"The rest of Arizona observes Mountain Standard Time all year"。
- Dixie's（下羚羊的导览公司）的一篇说明写 "Monument Valley follows Navajo Nation time, while Page, and our tours, stay on Arizona time all year"，夏天 "9 a.m. in Monument Valley is 8 a.m. in Page"。
- 现有提示（`mova.ts:41` "纳瓦霍保留地实行夏令时，夏天比佩吉快 1 小时"）是对的。
- 部落公园里的纳瓦霍向导团：各家未查（部落公园有授权名单 https://navajonationparks.org/guided-tour-operators/monument-valley-tour-operators/）。

**手机提醒**
- 从佩吉、大峡谷开过来（160 号公路），夏天时间会快 1 小时；手机会在 Tuba City、Kayenta 一带跳。
- 160 号公路在 Tuba City 旁边经过霍皮族的 Moenkopi，霍皮保留地不实行夏令时，夏天手机可能来回跳。这一点**未找到官方说法**。

**来源**
- https://navajonationparks.org/navajo-tribal-parks/monument-valley/
- https://www.nps.gov/cach/planyourvisit/hours.htm
- https://www.antelopelowercanyon.com/blog/monument-valley-to-antelope-canyon

### 波浪谷 `wave`

**数据核对**
- `timeZone: "America/Denver"`（犹他）可以保留：领证点之一在卡纳布，Wire Pass 步道口（37.02°N）、Toadstools、Paria 游客站都在犹他，抽签也按犹他时间。
- 但 `wave-the-wave`（36.996°N）和 `wave-white-pocket`（36.957°N）其实在亚利桑那境内（37°N 以南），当地是亚利桑那时间（不在保留地上）。徒步是从犹他的步道口走过去的，按犹他时间问题不大；从佩吉出发去 White Pocket 的导览团可能按亚利桑那时间，要看团怎么写。

**项目计时**
- Recreation.gov 原话："The lottery system is based on the time in Utah and the Navajo Nation."；每日抽签要在徒步前两天 6:00–18:00 之间、人在地理围栏里（"roughly from Kanab, Utah to Page, Arizona"）用手机申请。
- Kane County 旅游局（visitsouthernutah.com）原话："Application submission, confirmation, and payment deadlines are on the time in Utah and the Navajo Nation."，"Permit pick-up and orientation deadlines are on local time."，"During Daylight Savings, 9:30 in Utah is 8:30 in Arizona (except the Navajo Nation)."；中签的要在 "8 AM Utah time" 前确认付款，19:15 发结果，第二天 "8:30 AM local time" 到领证点参加安全讲解。
- 领证点在卡纳布（犹他）和佩吉（亚利桑那）各一个（BLM 2022 年新闻稿）。所以"8:30 当地时间"：卡纳布按犹他、佩吉按亚利桑那，夏天佩吉的 8:30 比卡纳布的晚 1 小时。
- 季度抽签：网站里写 "11 月 1 日上午 9 点山地时间开奖"（`activities.ts:1292`），按 Recreation.gov 应理解为犹他时间。

**手机提醒**
- 卡纳布到佩吉这条走廊（89 号公路）上来回跨州界，夏天差 1 小时。在佩吉住、去卡纳布领证的，最容易迟到（佩吉 7:30 = 卡纳布 8:30）。

**来源**
- https://www.recreation.gov/permits/4251909
- https://www.visitsouthernutah.com/dailylottery/
- https://www.blm.gov/press-release/blm-enhance-permitting-process-wave-coyote-buttes-north

### 大峡谷 `grca`

**数据核对**
- `timeZone: "America/Phoenix"` 对。14 个景点都在南缘（村子、Hermit Road、Desert View），全按亚利桑那时间。网站没收北缘的景点；北缘也是亚利桑那时间。

**项目计时**：NPS 大峡谷的开放时间页没写时区（未找到官方说法）。亚利桑那全年不实行夏令时见石化林一节的 NPS 原话。

**手机提醒**
- 从锡安、布莱斯、卡纳布（犹他）来北缘：夏天犹他快 1 小时，进亚利桑那要往回拨。
- 从东门进来（89 号公路经 Cameron、64 号公路）：Cameron 在纳瓦霍保留地上，夏天手机可能显示快 1 小时；Desert View 一带离保留地很近，手机可能跳。**未找到官方说法**。
- 从拉斯维加斯来：冬天（11 月到 3 月）亚利桑那比内华达快 1 小时，夏天一样。

### 石化林 `pefo`

**数据核对**：`timeZone: "America/Phoenix"` 对。

**项目计时**（NPS 原话）："Park hours are 8am to 5pm."，"Remember that times are Mountain Standard year round."，"Arizona does not observe Daylight Saving Time, remaining on Mountain Standard Time year-round."，夏天 "the time in Arizona and California is the same, with New Mexico and the Navajo Reservation one hour ahead"。现有文案对。

**手机提醒**：公园北边紧挨纳瓦霍保留地，往东是新墨西哥（实行夏令时），夏天手机可能快 1 小时；17:00 关路按亚利桑那时间。

**来源**：https://www.nps.gov/pefo/planyourvisit/hours.htm

### 大盆地 `grba`

**数据核对**：`timeZone: "America/Los_Angeles"` 对，11 个景点都在内华达。

**项目计时**
- NPS 40 周年活动页：免费票 "available at the Lehman Caves Visitor Center starting at 8:00am (Pacific Time)"，说明公园和导览按太平洋时间。
- Recreation.gov 提前 30 天早上 7 点（太平洋时间）放票：网站已经这样写；Recreation.gov 页面本身的时区写法没核到。
- NPS 大盆地的开放时间页、Lehman Caves 导览页、基本信息页都没写时区。

**手机提醒**
- 公园紧挨犹他（山地时间，全年快 1 小时），Baker 一带手机可能连上犹他的基站。**未找到官方说法**。
- 住宿里的 Border Inn（`lodging.ts:3330`）就在州界上，住在那里手机更容易跳。

**来源**：https://www.nps.gov/grba/planyourvisit/40th-anniversary.htm

### 西奥多·罗斯福 `thro`

**数据核对**
- `timeZone: "America/Denver"`（South Unit）对。
- North Unit 的 5 个景点用中部时间（America/Chicago）：`thro-cannonball-concretions`、`thro-little-mo`、`thro-caprock-coulee`、`thro-river-bend`、`thro-oxbow-overlook`。
- Painted Canyon（`thro-painted-canyon`、`thro-painted-canyon-trail`）、Elkhorn Ranch（`thro-elkhorn-ranch`）、Petrified Forest 步道（`thro-petrified-forest`）、Medora（`thro-medora-musical`、`thro-tr-library`）都是山地时间。Painted Canyon 有 NPS 原话（MDT），其余按所在县判断，NPS 没单独写。

**项目计时**
- NPS 原话："Please note that the North Unit operates on Central time, while the South Unit operates on Mountain time."
- NPS 2010 年的新闻稿：South Unit 游客中心 "8 a.m. to 4:30 p.m. MDT"，Painted Canyon "8:30 a.m. to 4:30 p.m. MDT"，North Unit "9 a.m. to 5:30 p.m. CDT"。
- 现有提示（`thro.ts:9`）对。

**手机提醒**：85 号公路从 South Unit 开到 North Unit 中间跨时区，全年都差 1 小时（两边都实行夏令时）。

**来源**
- https://www.nps.gov/thro/planyourvisit/hours.htm
- https://www.nps.gov/thro/learn/news/theodore-roosevelt-national-park-announces-spring-visitor-center-hours.htm

### 大弯 `bibe`

**数据核对**：`timeZone: "America/Chicago"` 对，园内和 Terlingua、Big Bend Ranch 州立公园都是中部时间。

**项目计时**
- Boquillas 口岸：NPS 写 2025 年 11 月 1 日起周五到周一 9:00–16:00 开放（页面 2026-01-14 更新），没写时区，按美方中部时间。
- 墨西哥那边的钟：
  - NPS 2024-04-15 的公告原话："Please note that clocks in the Mexican State of Coahuila are not adjusted to Daylight Saving Time"，"will display one hour behind the U.S. Port of Entry."
  - 但墨西哥《时区法》（Ley de los Husos Horarios，最后修订 DOF 2022-11-29）第 5 条把科阿韦拉州的 Acuña、Allende、Guerrero、Hidalgo、Jiménez、Morelos、Nava、**Ocampo**、Piedras Negras、Villa Unión、Zaragoza 列为实行和美国同步的夏令时（夏天用西经 75 度，即 UTC-5，和美国中部夏令时一样）。Boquillas del Carmen 属于 Ocampo。
  - 两个官方说法冲突。按法律 Boquillas 应该和美方一样；按 NPS 公告夏天慢 1 小时（可能是村里实际不跟）。实用的做法：全程按美方口岸的时间，16:00 前回到口岸。
- 回美国：网站已经写了中国护照要有效美国签证。

**手机提醒**
- 从埃尔帕索、瓜达卢佩山、卡尔斯巴德（山地时间）开过来，进 Jeff Davis / Presidio / Brewster 县以后快 1 小时，全年。
- 在 Boquillas、Santa Elena 峡谷（河对岸是奇瓦瓦州）一带手机可能连上墨西哥的基站。**未找到官方说法**。

**来源**
- https://www.nps.gov/bibe/planyourvisit/visiting-boquillas.htm
- https://www.nps.gov/bibe/learn/news/port-of-entry-begins-summer-schedule-4-28.htm
- https://www.diputados.gob.mx/LeyesBiblio/pdf/LHHEUM.pdf

### 瓜达卢佩山 `gumo`

**数据核对**：`timeZone: "America/Denver"` 对（Culberson、Hudspeth 县和新墨西哥那边的 Dog Canyon 都是山地时间）。

**项目计时**：NPS 原话 "Guadalupe Mountains National Park observes Mountain Time."，"Your cellular phone may not be reliable."。McKittrick 峡谷大门 8:00–17:00、游客中心 8:00–16:00 都按山地时间；现有提示对。

**手机提醒**（NPS 原话）："Most of the nearby cellular towers are located in central time just south and east of the park."，"people's phones and smartwatches display central time in most of the park"，"sometimes the devices will switch back and forth"。全年都会快 1 小时（两边都实行夏令时）。建议手动设成丹佛或埃尔帕索。

**来源**
- https://www.nps.gov/thingstodo/gumo_whattimeisit.htm
- https://www.nps.gov/gumo/planyourvisit/hours.htm

### 卡尔斯巴德洞窟 `cave`

**数据核对**：`timeZone: "America/Denver"` 对。

**项目计时**：NPS 开放时间页写 9:30–14:30 进洞，没写时区（按山地时间）。Recreation.gov "山地时间早上 8 点"放票，网站已写。

**手机提醒**：公园南边紧挨得州，东南方向的 Reeves、Loving 县是中部时间，手机可能跳。**未找到 NPS 官方说法**（搜索额度用完前没找到）。

**来源**：https://www.nps.gov/cave/planyourvisit/hours.htm

### 黄石 `yell`、大提顿 `grte`

`America/Denver` 对。黄石跨怀俄明、蒙大拿、爱达荷三州，园内和 West Yellowstone（MT）、Island Park（ID）、Cody、Jackson 都是山地时间，没有时区问题。（爱达荷只有北部狭长地带用太平洋时间，离黄石很远。）**未找到 NPS 写时区的页面**，按时区数据库确认。

### 冰川 `glac`

**数据核对**：`America/Denver` 对，景点和住宿都在蒙大拿。

**手机提醒 / 跨境**
- 北边是艾伯塔（Waterton）和 BC 的 East Kootenay。2026 年 11 月 1 日以后这两边都全年 UTC-6；蒙大拿冬天 UTC-7。所以**11 月到次年 3 月**从冰川开去 Waterton、班夫要快 1 小时（以前冬天一样）；夏天三边都是 UTC-6、一样。
- Goat Haunt、Chief Mountain、Polebridge 一带手机可能连上加拿大的基站，冬天会快 1 小时。**未找到官方说法**；而且冬天这些地方基本不开。
- 注意别和 BC 省的 Glacier National Park of Canada 搞混（那边在 Rogers Pass，用 BC 时间）。

### 加拿大落基山 `banf`、`jasp`、`yoho`

**数据核对**
- 三座都填 `America/Edmonton`，对。
- `jasp-mount-robson` 在 BC 省（罗布森山省立公园），用 BC 的 Pacific time（2026-03-08 起全年 UTC-7），比贾斯珀晚 1 小时，**全年都是 1 小时**。现在的提示"冬季差 2 小时"错（`jasp.ts:372`，`lodging.ts:2045` 的 Valemount 也一样）。
- 幽鹤（Field）：BC 省里用山地时间的地区。Golden 9 月 22 日复议后改成全年 UTC-6（和艾伯塔、East Kootenay 一致），Field 所在的 Area A 跟 Golden 一起做的调查；Field 本身**未找到官方说法**。幽鹤用 America/Edmonton 是对的。幽鹤的住宿里有 Golden 和 Kicking Horse 度假村，也都是 UTC-6。

**项目计时**
- 艾伯塔省政府原话："Beginning in November 2026, clocks will no longer reset to Mountain Standard Time."，"Alberta Time is equivalent to UTC-6:00."，正式缩写 "ABT"。
- BC 省政府（2026-03-02 新闻稿）："Pacific time will be set seven hours behind co-ordinated universal time (UTC-7)"，"On Nov. 1, 2026, when previously clocks would have been turned back an hour, no change will be made."；"local governments will retain the power to determine what time zone they observe."
- BC 省政府时区页（2026-09-17 发布）：East Kootenay "will remain aligned with Alberta and use MDT (UTC-6) year round"；还写着 "Golden will make their last time change on November 1, 2026 to MST (UTC-7)"，**这句已经过时**。
- Golden 镇：9 月 2 日公告 "will remain on Mountain Standard Time (UTC-7) year-round"；9 月 22 日 The Golden Star 报道议会复议后 "remain permanently on Mountain Daylight Time (UTC-6)"，9 月 23 日 CTV 报道同样内容。镇官网上的 9 月 2 日公告还没撤（不算官方的更正，但复议是议会正式表决）。
- Parks Canada 的预约开放时间（梦莲湖班车、欧哈拉湖、伯吉斯页岩、营地）一直写 "Mountain Time"；2026 年 11 月以后实际是艾伯塔时间 UTC-6，冬天比美国山地时间早 1 小时。欧哈拉湖巴士和预约电话按山地时间，Parks Canada 的幽鹤开放时间页没写时区（只在第三方说明里看到）。

**手机提醒**
- 贾斯珀往西过 Yellowhead Pass 进 BC：慢 1 小时（全年）。
- 班夫 / 露易丝湖到幽鹤、Golden：不用调。
- 从幽鹤往西过 Rogers Pass（Glacier NP of Canada、Revelstoke）：慢 1 小时。
- 冬天从美国蒙大拿北上进艾伯塔：快 1 小时。
- 浏览器或手机系统的时区数据要 2026c 以上，否则 11 月以后艾伯塔会被算成 UTC-7。

**来源**
- https://www.alberta.ca/albertas-new-time-system-abt
- https://news.gov.bc.ca/releases/2026AG0013-000209
- https://www2.gov.bc.ca/gov/content/governments/celebrating-british-columbia/daylight-saving-time
- https://www.golden.ca/town-hall/news-notices/council-supports-permanent-mountain-standard-time-utc-7-golden （9 月 2 日的旧决定）
- https://thegoldenstar.net/local-news/council-supports-permanent-mountain-standard-time-utc-7-for-golden/ （复议，报道）
- https://www.ctvnews.ca/vancouver/article/bc-town-wont-join-provinces-new-time-zone-will-keep-mountain-daylight-time/ （复议，报道）
- IANA 时区数据库发布记录：https://www.iana.org/time-zones/releases/2026d

### 阿拉斯加 `dena`、`kefj`、`wrst`、`glba`、`gaar`、`kova`、`katm`、`lacl`

都对：`America/Anchorage`（德纳里、基奈峡湾、兰格尔、北极之门、卡特迈、克拉克湖）、`America/Juneau`（冰川湾）、`America/Nome`（科伯克谷 / Kotzebue）。这几个名字在时区数据库里是分开的历史区，现在的规则完全一样（阿拉斯加时间，实行夏令时）。King Salmon、Homer、Gustavus、Kotzebue、Coldfoot 都是阿拉斯加时间；只有阿留申群岛西段用别的时间，和这些公园无关。**未找到 NPS 写时区的页面**，按时区数据库确认。
跨境提示（网站没收相关景点）：冰川湾、兰格尔东边是 BC 和育空，育空全年 UTC-7、BC 现在也全年 UTC-7，比阿拉斯加夏天快 1 小时、冬天快 2 小时。

### 夏威夷 `havo`、`hale`

`Pacific/Honolulu` 对，全年 UTC-10，不实行夏令时。和美国本土的时差随季节变：比太平洋时间夏天晚 3 小时、冬天晚 2 小时。哈莱阿卡拉日出预约（Recreation.gov 提前 60 天和 2 天早上 7 点放票）按夏威夷时间。NPS 夏威夷火山开放时间页没写时区（未找到官方说法）。

### 大烟山 `grsm`

`America/New_York` 对。田纳西一侧（Gatlinburg、Townsend、Sevier / Blount 县）和北卡一侧（Cherokee、Bryson City）都是东部时间（田纳西州只有西部、中部是中部时间，离公园很远）。**未找到 NPS 写时区的页面**。

### 其他公园（`timeZone` 都对）

| 公园 | timeZone | 说明（按时区数据库确认，没找官方页面） |
|---|---|---|
| yose、seki、pinn、chis、jotr、redw、lavo、crla、mora、olym、noca | America/Los_Angeles | 加州、俄勒冈、华盛顿都是太平洋时间 |
| deva | America/Los_Angeles | 内华达那边的 Beatty、Pahrump 也是太平洋时间 |
| romo、meve、grsa、blca | America/Denver | 科罗拉多；梅萨维德旁边的 Ute Mountain、纳瓦霍保留地也实行夏令时 |
| zion、brca、arch、cany、care | America/Denver | 犹他。锡安、布莱斯到佩吉 / 大峡谷，夏天慢 1 小时 |
| whsa | America/Denver | 新墨西哥 |
| sagu | America/Phoenix | 图森；旁边的 Tohono O'odham 保留地跟亚利桑那一样不实行夏令时 |
| badl、wica | America/Denver | 南达科他西部是山地时间；恶地东边从 I-90 往东过 Kadoka 到 Murdo（Jones 县）就是中部时间，从苏福尔斯开过来要往回拨 1 小时 |
| shen、neri、acad | America/New_York | |
| ever、bisc、drto | America/New_York | 干龟渡轮 8:00 开、7:00 报到，按东部时间 |

---

## 没查到的

本轮 WebSearch 额度用完后只能直接打开已知页面，下面几项没核到：
- Antelope Hogan Tours、Lake Powell Paddleboards & Kayaks、High Desert Paddle Co.、Wilderness River Adventures、Lake Powell Resorts 有没有写按哪个时间；
- 纪念碑谷部落公园授权的各家向导团；
- 霍皮保留地（Moenkopi）不实行夏令时的官方说法；
- NPS 卡尔斯巴德洞窟关于手机跳时区的说法；
- NPS 大峡谷北缘、黄石、大烟山、夏威夷几座公园写时区的页面；
- Field 本身的时区决定（Columbia Shuswap 区域 Area A 有没有单独公告）；
- 卡纳布、佩吉两个波浪谷领证点现在的具体地址（BLM 2022 年的新闻稿只说两地各一个）。
