# 官方建议行程（NPS、Parks Canada）收集记录

2026-10-27 整理。目的：给排行程引擎做一组“官方真值”，看自动生成攻略和公园自己推荐的路线差多少。数据在 `tests/fixtures/real-routes/nps-itineraries.json`。

**做法**：只用 nps.gov、parks.canada.ca 上的页面（含挂在上面的 PDF），不用第三方博客，不登录。每个官方行程按页面的顺序记下每一站；能明确对上网站景点（`src/data/attractions/<代码>.ts` 的 `id`）的写 id，对不上的保留官方英文名、前面加 `?`；纯后勤（开车回去、吃午饭）不记，有名字的地方（比如某家旅馆、某个码头）照记。一个页面给了几种方案（一天、三天……）就拆成几条。页面给“A 或 B 或 C”几选一的，只记第一个，在下面写明。

**字段**：`id`、`park`、`parks`、`title`（页面标题）、`source`（网址）、`checked`、`season`（页面写了季节才填）、`days[].stops`、`evidence`（页面上一句不到 15 个词的原话，证明这是官方的建议行程）。

**两类来源**：(1) 公园网站自己的“Trip Ideas / Suggested Itineraries”页面；(2) NPS 官方 App 里的自导游览（Tours），网页版在 `https://www.nps.gov/tours/view.htm?id=…`，网页上的站点是脚本加载的，站点列表按 NPS API 的 `/tours` 接口（`developer.nps.gov`，用公开的 DEMO_KEY）读出来，和网页是同一份数据。Tours 里大部分是单个步道、单个景区的讲解（老忠实泉、Cook's Meadow 环线……），那种只有一个景点的没收；只收跨几个景点、写成“一次参观怎么走”的（短时参观、自驾游览路线），id 里带 `-tour-`，`days` 只有一段（“Tour (single visit)”）。Tours 里的停车场、班车站、同一处的第二个讲解点不记。

## 优胜美地 yose

- 来源：NPS 视频 [One Day in Yosemite (Summer)](https://www.nps.gov/media/video/view.htm?id=3A8D1C4B-9CAC-4CB8-96D5-A4F974797C62)（页面挂在 [Visiting Yosemite: Tips and Trip Planning Videos](https://www.nps.gov/yose/learn/photosmultimedia/ytp.htm)、[One Day in Yosemite Videos](https://www.nps.gov/yose/learn/photosmultimedia/oneday.htm)）。网页上只有一句简介，内容按 NPS 官方的英文字幕文件整理（`https://www.nps.gov/nps-audiovideo/closed-caption/AA0C3592-077F-FFF6-77438450F8B4D7E1.vtt`，从 NPS API 的视频条目里找到）。
- 找到：一个“只有一天”的介绍：先讲山谷里（Yosemite Village 的游客中心、Exploration Center、博物馆和重建的原住民村落 → Lower Yosemite Fall → Cook's Meadow 环线 → Happy Isles → Vernal Fall 步道 → Mirror Lake），再给“出山谷的三个建议”：Glacier Point（夏天 10 点前到，中午停车场会满）、Mariposa Grove（回程顺路去 Wawona 的历史中心）、Tuolumne Meadows（走 Tioga Road 一个半小时）。结尾说“这些只是几个选项，你做不完”。
- 记法：山谷的一串记成 `nps-yose-1day-summer-valley`，三个出山谷的建议各记一条（`-glacier-point`、`-mariposa-grove`、`-tuolumne`），**是三选一的加项，不是要都去**。季节：视频是夏季版（Glacier Point Road 一般 5 月到 11 月通、Tioga Road 5 或 6 月到 11 月）。
- 对应：Exploration Center 对到 `yose-valley-visitor-center`（我们这个景点就叫 Yosemite Exploration Center，欢迎中心和它挨着，合成一站）；Lower Yosemite Fall 对到 `yose-yosemite-falls`（我们的起点就是 Lower Yosemite Fall 步道口）；Vernal Fall 步道对到 `yose-mist-trail`；Wawona 的 Yosemite History Center 对到 `yose-pioneer-history-center`。博物馆和原住民村落、Happy Isles 的艺术自然中心没收。
- 拿不准：视频只是按地点介绍，“山谷”那一串是视频讲解的先后，不一定是建议的行走顺序；Vernal Fall 那段只说“去顶上来回各 1.5 英里、很陡”，没说一定要走。
- 也看了：冬季版视频（Visiting Yosemite in Winter）只是介绍冬天能做的事（Valley Loop、Yosemite Falls 步道、展馆、Curry Village 滑冰、雪鞋、Badger Pass 滑雪），没有一天的安排，没收；Yosemite Nature Notes 的 “One Day in Yosemite” 是纪录片，不是建议行程。NPS App 里的几条游览（Lower Yosemite Fall、Cook's Meadow、建筑、地质、Mariposa Grove 两条、Tuolumne 的 Soda Springs、Wawona 历史中心）都是单个景区的讲解；Tioga Road 那条是沿路无障碍讲解牌的合集，没收。另有一份给学校团体的 [Lesson Plan & Itinerary](http://home.nps.gov/yose/planyourvisit/upload/lplan.pdf)，没看（面向教学）。

## 大峡谷 grca

- 公园网站上没找到按天的建议行程页（搜了 “if you have … hours/day”、suggested itinerary；Things To Do、FAQ、Trip Planner PDF 里都没有按天的方案。FAQ 只说下到河边再上来是两天的行程）。
- NPS App 自导游览：[South Rim; The 1–2 hour visit.](https://www.nps.gov/tours/view.htm?id=216AB34D-CB1C-47F5-85E8D69694F4EDD0)，标签 “trip planning”，原文是“护林员推荐的南缘 1–2 小时参观”。记成 `nps-grca-tour-1-2h-south-rim`：游客中心 → Mather Point → Yavapai Geology Museum → 坐橙线班车到 Yaki Point → 回游客中心。两个班车站、班车总站没记。游客中心（我们没有单独的景点）、Yaki Point 没收。
- 注意：API 里这条的时长单位写的是 `m`（1–2 分钟），标题和正文都是 1–2 小时，按小时理解。
- 其他游览（Trail of Time 地质步道、Historic Village 历史村）都是单个景区的讲解，没收。

## 冰川 glac

- 公园网站上没找到按天的建议行程页。
- NPS App 自导游览：[Going-to-the-Sun Road Tour](https://www.nps.gov/tours/view.htm?id=9798BB3C-CE97-421F-2BDB0EDEB0F698D4)（2–5 小时语音导览，从西边 Apgar 开到东边 St. Mary，26 站，`nps-glac-tour-going-to-the-sun-road`）。页面没写季节，向阳大道全线一般 7 月到 10 月中才通。
- 对应：26 站里对上 9 个。Apgar Village 对到 `glac-lake-mcdonald`（Lake McDonald (Apgar)），Avalanche Creek 对到 `glac-trail-of-the-cedars`（Trail of the Cedars 就从 Avalanche Creek 出发），St. Mary Falls Trailhead 对到 `glac-st-mary-virginia-falls`。路边的停靠点（West Tunnel、The Loop、Weeping Wall、Triple Arches、Oberlin Bend、Siyeh Bend、Sunrift Gorge、Rising Sun……）多数我们没有单独的景点，留作 `?`。这条是讲解沿路风景的，停靠点很密，拿来比顺序有用，比“去哪些景点”时对不上的会很多。
- 其他游览（Logan Pass 两条短讲解、Running Eagle Falls、St. Mary 地质、North Fork 步道、Many Glacier 酒店历史）是单点，没收。

## 阿卡迪亚 acad

- 来源：[A Half-Day at Acadia](https://www.nps.gov/tripideas/a-half-day-at-acadia.htm)（NPS Trip Idea）
- 找到：标成“半天”的一组活动，按页面顺序：开 Park Loop Road → Sieur de Monts 看鸟 → Jesup Path 和 Hemlock Path 环线 → Ocean Path → Jordan Pond 野餐 → 走马车道 → Otter Point 看鸟 → Bar Island 看潮池。记成 `nps-acad-halfday-options`。**8 项活动半天做不完，页面像是一组可选项、不是排好的路线**（页面上也没写“suggested”，只标“Trip Idea”，evidence 只能用标题）。拿来评测只能看“去哪些地方”。
- 对应：Jordan Pond 对到 `acad-jordan-pond`（原文是在那里野餐），Carriage Roads 对到 `acad-carriage-roads`，Bar Island 对到 `acad-bar-island`。Park Loop Road、Sieur de Monts、Jesup/Hemlock 环线、Ocean Path 没有单独的景点；Otter Point 和我们的 Otter Cliff 挨着但不是同一处，没对。
- 也看了：[Car-Free Acadia](https://www.nps.gov/tripideas/car-free-acadia.htm)（12 条坐 Island Explorer 班车去的徒步，是选项清单）、[Tour the Fall Colors of Acadia](https://home.nps.gov/tripideas/tour-the-fall-colors-of-acadia.htm)（10 个秋叶活动的选项清单），都没有顺序，没收。NPS App 里的 Carriage Road Bridges、Great Head、Memorials、Passport Stamp 几条游览是单一主题，没收。

## 大烟山 grsm

- 来源：[Itinerary Beginning at Sugarlands Visitor Center](https://www.nps.gov/grsm/planyourvisit/svc-itinerary.htm)
- 找到：从 Sugarlands 游客中心出发的 12 个去处（瀑布 3、自驾 3、徒步 3、野餐 3），每个写了从游客中心开过去多久、玩多久，后面一行“Suggested combinations”（建议搭配哪几个）。我把每个去处和它的建议搭配记成一条：`nps-grsm-svc-<去处>`，站点是“Sugarlands 游客中心 → 这个去处 → 建议搭配的几个”，一共 12 条。**页面没写搭配之间的先后顺序，也没说一天还是半天**，拿来评测只适合看“官方觉得哪几个放在一起合适”，不适合比顺序。
- 对应：Laurel Falls、Grotto Falls、Roaring Fork、Kuwohi（原文 Kuwohi 和旧名 Clingmans Dome 都出现，都对到 `grsm-kuwohi`）、Newfound Gap、Cades Cove、Chimney Tops、Charlies Bunion、Alum Cave 能对上；Cataract Falls、Hen Wallow Falls、三个野餐区（Chimneys、Metcalf Bottoms、Cosby）没收。“参观历史老房子多加 1 小时”这类不是地点，没记。
- 拿不准：`grsm-laurel-falls` 我们的数据里整修关闭到 2027 年，这个页面是两年前的（搜索结果显示约 596 天前），还把 Laurel Falls 当搭配。另试了 Oconaluftee 那边同样的页面（`ovc-itinerary.htm`），是 404。NPS App 里的 Cades Cove Places、Elkmont 两条游览是单一片区，没收。

## 拱门 arch

- 来源：[Trip Ideas](https://home.nps.gov/arch/planyourvisit/itineraries.htm)
- 找到：按“有多少时间”分的几种方案，不分天，都是一天之内的半日、两小时方案。记了 8 条：开车 1.5 小时的两种（Windows 片区；精致拱门观景点 + 回程 Wolfe Ranch）、徒步两小时的四种（Windows 环线 + Double Arch + Balanced Rock；精致拱门；魔鬼花园到风景拱门；沙丘拱门 + 断拱 + Tapestry Arch）、徒步半天的两种（魔鬼花园到 Dark Angel；Klondike Bluffs 到塔拱）。
- 没记的：“3 小时：整条公园路开一遍，每个观景点停 10 分钟”和“半天：开完整条路，再在 Windows、精致拱门观景点、Balanced Rock 三处选一处走一走”——没有点名具体顺序，只是“每个观景点”，没法变成站点列表。徒步半天的标题写三条，页面上只有两条。
- 对应：Wolfe Ranch 是精致拱门步道口的历史农场，我们没单独收，留作 `?`；Tapestry Arch 没收。魔鬼花园到 Dark Angel 那条，我们最近的是 `arch-double-o-arch`（Dark Angel 在双 O 拱门再往前），不算同一个地方，留作 `?`；原文说回程可以走原始步道（对应 `arch-devils-garden-loop`），是可选的，没记。
- 季节：精致拱门那条写了“夏天中午别走”，其他没写季节。
- NPS App 自导游览：[Geology](https://www.nps.gov/tours/view.htm?id=1F3F39F7-90B3-1F5D-8895E7A16B25A885)（4–6 小时，8 站：Moab Fault Viewpoint → Park Avenue → Balanced Rock → Double Arch → Panorama Point → 精致拱门观景点 → Fiery Furnace 观景点 → Skyline Arch，记成 `nps-arch-tour-geology-tour`，只有 Moab Fault Viewpoint 对不上）；[Human History](https://www.nps.gov/tours/view.htm?id=4B806231-95E9-02C6-ECF5509B861642A9)（2–5 小时：游客中心 → Wolfe Ranch → Courthouse Wash 岩画，`nps-arch-tour-human-history-tour`，后两个没收）。

## 奥林匹克 olym

- 来源：[Trip Ideas](https://www.nps.gov/olym/planyourvisit/tripideas.htm)
- 找到：半天、一天、多天（2–3 天）三种，都从安吉利斯港出发。记了 3 条：`nps-olym-halfday`、`nps-olym-fullday`、`nps-olym-multiday`。
- 多天那条**页面只列了要去的片区、没分天**，只建议几晚住安吉利斯港、几晚住西边（Forks、Kalaloch 或 Quinault）；按页面顺序记成一个“2–3 天”的列表。
- 对应：页面按片区写（Lake Crescent 下面列 Marymere Falls……），片区本身有对应景点的（Hurricane Ridge、Lake Crescent、Quinault）记片区，Sol Duc、Mora、Hoh、Kalaloch 这几个片区只记下面列的具体地方。Devil's Punchbowl 对到 `olym-spruce-railroad`（Spruce Railroad Trail – Devil's Punchbowl），Sol Duc Hot Springs Resort 对到 `olym-sol-duc-hot-springs`，Quinault area 对到 `olym-lake-quinault`。没收的：Ancient Groves Trail、First Beach、Third Beach、Beach 4。
- 没记的：可选的加项（半天里的“有空再去 Rialto Beach 或园外的 Dungeness Spit、Salt Creek”，多天里的马卡保留地、Neah Bay、Cape Flattery）。`olym-cape-flattery` 我们有，但官方只是“可选”，没放进站点。
- 拿不准：“半天”要走 Hurricane Ridge、Lake Crescent、Sol Duc 三处，实际一个半天很紧，原文就是这么写的。季节：一天和多天都写了 5–9 月 Hoh 雨林入口排长队，多天写了海滩低潮时去最好。

## 雷尼尔山 mora

- 公园网站上没找到按天的建议行程页。
- NPS App 自导游览：[Journey to Paradise](https://www.nps.gov/tours/view.htm?id=85089A3C-A854-E01E-8F9F3F618A419FC5)（4–8 小时，从 Nisqually 入口开到 Paradise 的自驾，`nps-mora-tour-journey-to-paradise`）。Longmire、Christine Falls、Narada Falls 对上；最后一站 “Paradise” 是一个片区，对到 `mora-paradise-visitor-center`（Paradise 的游客中心）。Nisqually Entrance、Kautz Creek、Twin Firs Trailhead、Ricksecker Point 没收。
- 其他游览（Sunrise 地质、各种步道讲解、瀑布合集、巡逻小屋合集）是单点或者主题合集、没有先后顺序，没收。

## 布莱斯峡谷 brca

- 公园网站上没找到按天的建议行程页。
- NPS App 自导游览两条：[“Must See” Views and an Easy Walk](https://www.nps.gov/tours/view.htm?id=8AD41B8F-FABD-4048-F1EC7EEA132C6998)（“给只有 1–3 小时的人”，Bryce Point → Inspiration Point → Sunset Point → Sunrise Point，前两站是停车场和班车站（4 月中到 10 月中坐班车），没记，`nps-brca-tour-1-3h-must-see`）；[A Driving Tour of the Park](https://www.nps.gov/tours/view.htm?id=B51CC502-B892-25D3-4AECFEA16B008FC0)（3–6 小时，先开到最南的 Rainbow Point 再一路往回停，`nps-brca-tour-3-6h-driving-tour`）。
- 对应：Yovimpa Point（和 Rainbow Point 挨着，我们的 Rainbow Point 没写包括它）、Black Birch Canyon、Ponderosa Canyon、Farview Point、Piracy Point、Swamp Canyon 没收。

## 红杉与国王峡谷 seki

- 来源：[Help! I only have one day at Sequoia and Kings Canyon!](https://www.nps.gov/tripideas/only-have-one-day.htm)（NPS 的 Trip Ideas 文章）
- 找到：标题是“只有一天”，但内容是**一份选项清单、不是排好顺序的路线**：游客中心和博物馆、护林员活动、巨杉和步道各几项，每项写了季节和要多久。记成 `nps-seki-1day-options`，按页面列出的顺序记有地名的项；护林员活动、少年护林员、雪鞋（冬天，雪 8 英寸以上才有）这类活动没记。**拿来比较时只能当“官方认为一天值得去的地方”，不能比顺序。** 而且 Foothills 在南门、Kings Canyon Visitor Center 在 Grant Grove，一天里不太可能都去。
- 对应：Giant Forest Museum、Tunnel Log、General Sherman Tree、Congress Trail 能对上；Foothills、Kings Canyon、Lodgepole 三个游客中心、Lodgepole 到谢尔曼将军树的步道（夏天，回程坐 1 号绿线班车）、Muir Grove 没收。
- 另查了 2026 年春季的 Trip Planner PDF（[链接](http://home.nps.gov/seki/learn/news/upload/Trip_Planner_2026_Spring_2026-03-19_01_for_web_508.pdf)），里面没有建议行程，只有“给别人留一份详细行程”的安全提示。

## 死亡谷 deva

- 公园网站上没找到按天的建议行程页。
- NPS App 自导游览两条：[Highlights: 3 Hour Driving Tour](https://www.nps.gov/tours/view.htm?id=2ACEFF55-0D9F-5149-404642CCF408EC74)（3–5 小时，Furnace Creek 游客中心 → Badwater → Artists Palette → Zabriskie Point → Mesquite Flat 沙丘，5 站全部对上，`nps-deva-tour-3h-highlights-drive`）；[Star Wars Film Locations Tour](https://www.nps.gov/tours/view.htm?id=335EEE75-E2C7-3F33-A4F62F5FCF55B370)（5–7 小时，主题游览，`nps-deva-tour-star-wars-drive`），Twenty Mule Team Canyon、Desolation Canyon 没收。
- 拿不准：Star Wars 那条是主题路线，不是“一般游客怎么玩”，拿来评测时可以单独看。另有 Golden Canyon 徒步讲解（单点），没收。
- NPS 视频 [One Day Visit Highlights](https://www.nps.gov/media/video/view.htm?id=4F5C3CB5-82BE-4C03-B2C9-71E1C19300A5)（简介：“只有一天？护林员的推荐”），按官方英文字幕（`https://www.nps.gov/nps-audiovideo/legacy/closed-caption/pwr/avElement/deva-onedayenUS1.vtt`）整理：先到 Furnace Creek 游客中心 → 往南半小时到 Badwater → 往北开 Artists Drive（Artists Palette）→ Zabriskie Point，原话是“只有几个小时就看这三个”；时间多就再往西 35 分钟去 Mesquite Flat 沙丘；看兴趣再去 Salt Creek（春天看鳉鱼）、Harmony Borax Works、Dante's View。记了三条：`nps-deva-1day-video-couple-hours`、`nps-deva-1day-video-one-day`（加上沙丘）、`nps-deva-1day-video-add-ons`（三个按兴趣选的，**是选项不是顺序**）。Artists Drive 对到 `deva-artists-palette`（Artists Palette 在这条单行道上）。视频提醒夏天 49°C 以上要带足水，没写季节限制。
- 这三条和上面 App 里的 Highlights 3 小时自驾几乎一样（游客中心 → Badwater → Artists Palette → Zabriskie → 沙丘），是同一套官方推荐的两个版本。

## 约书亚树 jotr

- 公园网站上没找到按天的建议行程页。
- NPS App 自导游览：[Joshua Tree to Cottonwood Audio Tour](https://www.nps.gov/tours/view.htm?id=A757672D-A6E0-1513-BB5D40A4CB7D0703)（1–4 小时语音导览，从北边 Joshua Tree 镇的游客中心开到南门 Cottonwood，27 段，`nps-jotr-tour-joshua-tree-to-cottonwood`）。每段的名字是“话题（地点）”，比如 “Ecology (Hidden Valley)”，按括号里的地点记；第 2 段和第 1 段是同一个游客中心，没重复记。
- 对应：26 站对上 10 个（游客中心、Hidden Valley、Barker Dam、Cap Rock、Keys View、Skull Rock、Arch Rock、Cholla、Cottonwood 游客中心、Cottonwood Spring），其余是路边的讲解点（Quail Springs、Hemingway、Intersection Rock、Pinto Basin 等）。
- 同一条路反方向的（Cottonwood to Joshua Tree）、29 Palms 方向的两条内容类似，没重复收；Geology Tour Road、Hi-View、Indian Cove 是单点，没收。

## 大提顿 grte

- 来源：[Trip Ideas](https://home.nps.gov/grte/planyourvisit/tripideas.htm)（“Ideas for one to four days at the park”）
- 找到：一套 4 天的行程（Day 1–4），记成 `nps-grte-4day`。页面的提示写的是 2027 年夏天（String Lake、洛克菲勒保护区停车场 7 点前或下午 3 点后去），季节按夏天记。另有一节“经典体验的替代”（热门步道口的替代选择），不是按天的行程，没记。
- 对应：Craig Thomas 游客中心、Mormon Row、Cunningham Cabin、Jackson Lake Dam、Signal Mountain Summit Road 能对上；Colter Bay Visitor Center 对到 `grte-colter-bay`（同一处，我们的景点是那里的 Heron Pond & Swan Lake 环线），同在 Colter Bay 的 Lakeshore Trail 是另一条步道，没对。
- 拿不准：Day 1 第 5 站原文是“Mormon Row、Glacier View Overlook 或 Snake River Overlook”三选一，只记了第一个 Mormon Row（`grte-snake-river-overlook` 也是选项之一）。Day 4 第一站是“在 JHMR、Granite Canyon、Colter Bay 或洛克菲勒纪念公路徒步”几选一，没对到具体景点。官方这套行程偏重园区边上的活动（漂流、野生动物团、码头、旅馆），对不上的站很多（23 站里对上 6 个）。
- NPS App 自导游览：[Behind the Lens: Photo Spots](https://www.nps.gov/tours/view.htm?id=4A2D7076-E51E-7BAC-2A624D3E051422E5)（1–4 小时，8 个拍照点，`nps-grte-tour-photo-spots`）。Jackson Lake Overlook 没收；“Jenny Lake Overlook”（珍妮湖景观道上的观景台）对到 `grte-jenny-lake`，“Inspiration Point” 对到 `grte-hidden-falls`（Hidden Falls & Inspiration Point），这两个算同一处但不是同一个停车点，拿不准。另有 Fire in the Tetons、Bar BC Ranch、Menor's Ferry 几个单点讲解，没收。

## 德纳里 dena

- 公园网站上没找到按天的建议行程页。
- NPS App 自导游览：[Denali Highlights: From the Park Entrance to Savage River](https://www.nps.gov/tours/view.htm?id=6A076A49-BA7F-8B68-9FFFC4ECC5F4F2BF)（2–6 小时，开车加步行，公园路前 15 英里，`nps-dena-tour-entrance-to-savage-river`）。页面写最适合夏天（大约 5 月 20 日到 9 月中），冬天大部分公园路封闭、只能到雪橇犬舍。游客中心 → 历史总部 → 雪橇犬舍 → Mountain Vista → Savage River → Riley Creek 野餐区；历史总部、Riley Creek 野餐区没收。
- McKinley Station Trail 那条是单条步道，没收。

## 班夫 banf（Parks Canada，含贾斯珀、幽鹤）

- 来源一：[Suggested itineraries - Banff National Park](https://parks.canada.ca/pn-np/ab/banff/visit/les10-top10/itineraries)。5 个主题方案，页面都没写几天、几小时：
  - “Hit the spots in town”（镇上：上温泉 → Cave and Basin → Cascades of Time 花园 → Bow Falls），`pc-banf-in-town`；
  - “Four extraordinary afternoons”（四个下午各做一件：Vermilion Lakes 划船、Tunnel Mountain 徒步、Fenland Trail、Legacy Trail 骑车），记成一条 4 段的 `pc-banf-four-afternoons`，每段一个下午；
  - “Family time on Minnewanka Loop”（Minnewanka 湖野餐 → Stewart Canyon → Lower Bankhead），`pc-banf-minnewanka-loop`，最后“可以住 Two Jack Main 营地”是可选的，没记；
  - “Take the scenic route”（冰原大道往北，Parker Ridge、Bow Glacier Falls、Crowfoot Glacier、Bow Lake、Herbert Lake，再走 David Thompson Highway 去园外的 Rocky Mountain House 国家历史遗址过夜），`pc-banf-scenic-route`。**顺序是页面写的顺序，和沿路实际先后不一致**（Herbert Lake 在最南、Parker Ridge 在最北），拿来比顺序不合适；
  - “Banff's iconic landscapes”（Bow Valley Parkway → 路过 Castle Mountain → Johnston Canyon → Lake Louise，夏冬各有玩法），`pc-banf-iconic-landscapes`。
  - 页面说 5–9 月特别忙；Moraine Lake 只在页末提了一句，不在任何方案里。
- 来源二：Parks Canada 西部旅行路线里的两条 7 天行程（从卡尔加里出发），按天写、每晚写了建议住的营地：
  - [Banff and Jasper: the ultimate duo](https://parks.canada.ca/voyage-travel/region/ouest-west/itin/itin1)（945 公里），`pc-banf-jasp-7day`，`parks` 是 banf + jasp；
  - [Rocky mountain retreat](https://parks.canada.ca/voyage-travel/region/ouest-west/itin/itin7)（690 公里，Lake Louise → 幽鹤 3 天 → 库特尼 3 天），`pc-banf-yoho-kootenay-7day`，`parks` 是 banf + yoho。库特尼国家公园网站上没有，那 3 天的站全是 `?`；第 4 天只写“跟 Parks Canada 讲解员徒步”，没地名。
  - 每晚住的营地（Tunnel Mountain、Two Jack、Lake Louise、Wapiti、Whistlers、Kicking Horse、Redstreak）没放进 stops，要比住处时看原页面。
- 对应：Minnewanka Loop（一条环路，沿路有 Lake Minnewanka、Two Jack Lake 等）对到 `banf-lake-minnewanka`；“Columbia Icefield area” 对到 `jasp-athabasca-glacier`（也可以是 `jasp-columbia-icefield-adventure`，拿不准）；“Jasper Transit (town attractions)” 对到 `jasp-jasper-town`；Icefields Parkway 用的是贾斯珀那边的 `jasp-icefields-parkway`；Field 对到 `yoho-field-visitor-centre`。“Maligne Valley”是片区、“Trails from Wapiti and Whistlers campgrounds”太笼统，前者留作 `?`、后者没记。
- 没收的：同一组西部路线里的“Depart from Calgary”一日游清单（[链接](https://parks.canada.ca/voyage-travel/region/ouest-west/itin/calgary)）。里面有一条幽鹤一日游（Field 游客中心、Natural Bridge、Kicking Horse River、Takakkaw Falls、Yoho Lake），但整页是几个地方的简短介绍，不是排好的路线；其余几条在园外或者只有一个点。

## 没找到官方建议行程的公园

用 WebSearch（只搜 nps.gov）、WebFetch 和 NPS API（`/tours`、`/multimedia/videos`，看字幕）查过，下面几座在 nps.gov 上没找到按时间安排的建议行程：

- **黄石 yell**：搜了 “suggested itineraries”、“if you have one day”、“one-day itinerary”、“Grand Loop / lower loop / upper loop”。只有各片区的一日徒步清单（Trip Ideas 的 Day Hikes in the Canyon / Lake / Old Faithful / Tower Area、Yellowstone Peaks in a Day）、Top 10 Tips 视频和园区简介；NPS App 里的游览都是单个地热区（老忠实泉和上间歇泉盆地、Fountain Paint Pot、Mud Volcano、West Thumb、Black Sand Basin、Upper Terrace Drive、北线历史自驾），没有跨片区的“一天怎么走”。
- **锡安 zion**：搜了 trip ideas、one day、half day、itinerary；看了 [Zion Planning Guide](http://home.nps.gov/zion/planyourvisit/planning-guide.htm)，只有“早到或下午 3 点后来”这类建议，没有行程。NPS App 里只有 Pa'rus 步道一条讲解。
- **落基山 romo**：搜了 suggested itinerary、one day；看了 [Plan Your Summer Trip to Rocky](https://www.nps.gov/romo/plan-your-summer-trip-to-rocky.htm)，只按片区介绍（Bear Lake Road、Trail Ridge Road），没有按时间的方案。NPS App 里只有 Holzwarth 历史遗址一条。
- **仙纳度 shen**：搜了 itinerary、if you have、one day；[Driving Skyline Drive](https://www.nps.gov/shen/planyourvisit/driving-skyline-drive.htm) 只说开完全程约 3 小时、四个入口在哪；[Suggested Backcountry Trips](https://www.nps.gov/shen/planyourvisit/backcountry-trips.htm) 是过夜背包路线（PDF），不是一般游客的行程，没收。视频 “A Day in Shenandoah” 没有字幕和文字稿。NPS App 里是 Stony Man、Limberlost、Rapidan Camp 等单点讲解。
- **火山口湖 crla**：搜了 itinerary、if you have、Rim Drive；[Scenic Rim Drive](https://www.nps.gov/crla/planyourvisit/scenic-rim-drive.htm)、[Overlooks](https://www.nps.gov/crla/planyourvisit/overlooks.htm) 只说环湖至少 2 小时、一般停 8 个以上观景点，没有点名顺序；2026 年夏秋季的 Reflections 报纸 PDF 里也没有“一天怎么玩”。搜索结果里的 “Driving Tour of Crater Rim Drive” 其实是夏威夷火山国家公园的 Crater Rim Drive（`havo`），不是火山口湖，没收。
- **北瀑布、拉森等不在优先名单里的**没查。

## 其他没收的

- 大峡谷 Trip Planner PDF、红杉 2026 春季 Trip Planner PDF：没有按天的行程。
- 优胜美地给学校团体的 Lesson Plan & Itinerary PDF：面向教学，没看。
- NPS App 里奥林匹克的 “Gems of History and Culture in Western Washington”（1–4 天，8 站）：主题是华盛顿州西部的历史文化遗址，大多在园外，没收。

## 汇总

见文件开头说明。拿来评测时建议分三档用：(1) 真正按天、按顺序的行程（大提顿 4 天、班夫 + 贾斯珀 7 天、班夫 + 幽鹤 7 天、Parks Canada 班夫的几条主题线）；(2) 一次参观的顺序（拱门、奥林匹克、死亡谷、布莱斯、冰川向阳大道、德纳里、大峡谷南缘、雷尼尔山 Paradise、约书亚树、优胜美地山谷这几条）；(3) 只是“官方认为值得去 / 适合放在一起”的选项清单（红杉一天、阿卡迪亚半天、大烟山 Sugarlands 的 12 组搭配、优胜美地出山谷的三选一、死亡谷按兴趣选的三个），只能比“去哪些”，不能比顺序。
