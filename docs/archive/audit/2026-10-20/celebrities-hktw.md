# 明星同款：港台、东南亚华语艺人（2026-10-20 / 10-21）

接着 [celebrities-cn-feasibility.md](celebrities-cn-feasibility.md) 做：大陆明星难找，先收港台、新马的华语艺人，以及在 Instagram、官方 YouTube 上发帖的大陆明星。收录标准照 `src/data/celebrities.ts` 开头和 [agent-briefs/07-celebrity-spots-v2.md](../../agent-briefs/07-celebrity-spots-v2.md)：

- 本人公开发的帖子（Instagram，或本人官方 YouTube / B 站视频），地点能认出是网站收录的公园、名胜里的哪里；
- 至少一家报道确认人和地点；没有报道的，帖子本身要打了定位或写明地点、账号是认证账号；
- 不收违规的、删了帖的、主角是未成年人的、只发了限时动态的。

方法：不登录。Instagram 帖子用 `/p/<代码>/embed/captioned/` 核对发帖账号、配文和定位（WebFetch 读文字；照片内容在浏览器面板里打开同一个公开嵌入页看，不下载、不存）。YouTube 用 oEmbed 和公开的视频页核对频道、发布日期、能不能嵌入。

每查一个候选马上记一笔。

## 收了的

### 1. 蔡明思 Jessica Tsoi（香港，前 Super Girls 成员）：马蹄湾、羚羊峡谷

- 帖子：https://www.instagram.com/p/Dekn8Syk2tA/ （@jessicatsoi，认证账号；主页简介写 Jamcast management；2026-10-16 发）。嵌入页核对：定位“佩吉市”（Page, Arizona），配文第一行“Antelope Canyon + Horseshoe bend ✅✅”，后面说景色很美但车程太辛苦，建议坐飞机或在拉斯维加斯参加一日团。
- 照片（在嵌入页逐张看过）：第 1 张马蹄湾全景（蓝天白云）；第 2 张她穿白色上衣背对镜头，坐在马蹄湾崖边伸出去的岩石上、一只手举起，下面是绿色的河湾；后面几张是羚羊峡谷里的光和岩壁纹理，有她站在谷底双手比 V、坐在谷底斜坡上戴墨镜侧脸的照片。
- 报道：东网 2026-10-18《蔡明思遊美赴羚羊峽谷苦勸自駕遊　露肩晒長腿極吸睛》 https://hk.on.cc/hk/bkn/cnt/entertainment/20261018/bkn-20261018160113084-1018_00862_001.html ，写明羚羊峡谷、马蹄湾，没写上羚羊还是下羚羊。
- 处理：拆成两条（同一个帖子，和入江陵介、渡部香生子那两条一样的做法）。马蹄湾对上景点 `hsbd-horseshoe-bend`，confidence high；羚羊峡谷不知道是哪一段，不对景点、只写公园，confidence high（定位 + 配文 + 报道都写明羚羊峡谷），说明里写清楚哪一段不清楚。
- 拍法有危险：马蹄湾那张坐在没有护栏的崖边，tipsZh 写在护栏处或离边缘几米坐着拍。不算违规（马蹄湾护栏外不禁止走动），和入江陵介那条一样收、写安全提醒。

### 2. 閻奕格 Janice Yan（台湾歌手）：优胜美地冰川点

- 视频：https://www.youtube.com/watch?v=syFhJcLyRC0 《Yosemite is insane! 優勝美地 太誇張了！Part 1》，频道“Janice Yan閻奕格”（@janiceyanmusic），频道带 YouTube 的官方艺人认证（BADGE_STYLE_TYPE_VERIFIED_ARTIST），简介里的 IG、FB 都是她本人的；2024-11-10 发布，11 分 43 秒，`playableInEmbed: true`。第二集 https://www.youtube.com/watch?v=k-Oo2kj_8-o （2024-11-16）。
- 视频没有字幕轨、没有章节，按 YouTube 公开的预览缩略图（storyboard，在浏览器面板里看，不下载）认地点：先在车上、超市，然后是字幕写着“我們現在在 Tunnel View”的隧道观景点全景（酋长岩、新娘面纱瀑布），山谷里的瀑布和步道；最后一段字幕打出“Glacier Point”和“05:12 PM”，她在观景台步道上边走边自拍，结尾是半穹顶的日落余晖和观景台上的人群剪影，打出“Yosemite part 2 coming!”。
- 报道：没找到（WebSearch“閻奕格 優勝美地”“閻奕格 美國 自駕 vlog”“閻奕格 IG 美國 旅行”都没有；台湾媒体报道过她 2026 年去瑞士，没有这趟）。按任务说明的例外收：账号是认证的官方艺人频道，视频本身写明了地点（片名写优胜美地、字幕写 Glacier Point）。
- 处理：对上景点 `yose-glacier-point`，confidence medium，说明里写清楚没有报道。`sources` 不能为空（测试要求），放的是同一趟的第二集。拍法没有危险（在护栏的观景台上）。

## 查过、没收的

- **譚杏藍 Hana Tam（香港歌手、YouTuber）· 羚羊峡谷**：本人频道 2019-09-15 的 vlog https://www.youtube.com/watch?v=m7d5LlUAbPE （《【人生必到之仙境】羚羊谷！…》，能嵌入）。频道没有认证标记，WebSearch“譚杏藍 羚羊谷”也没有报道，她 2019 年的 IG 帖子不登录翻不到。两个条件都不满足，不收。
- **吳彥祖 Daniel Wu · 优胜美地**：HK01 2026-08-05 报道他拍完《九龙城寨之终章》后和妻女去优胜美地露营徒步，照片来自他的 IG（@thatdanielwu）。报道和照片的主角是他 13 岁的女儿（在巨杉树洞前留影），属于“主角是未成年人”，不收；报道也没给帖子链接、没写是哪片巨杉林。
- **韓藝瑟（韩国演员）· 羚羊峡谷**：ETtoday 报道她“攀爬羚羊峡谷”被骂没常识，违规拍法，不收（也不是华语艺人）。
- **《木曜4超玩》（邰智源、坤达、林柏昇 KID、温妮、泱泱、阿部玛利亚）· 大峡谷南缘**：节目官方频道（认证）2023-10-12 的《木曜旅行趴 EP2 大峡谷》 https://www.youtube.com/watch?v=NcQgHsaE9bk 。看预览缩略图：在南缘的 Rim Trail 一带看日出、走步道，没打出是哪个观景点；有一段几个人爬到崖边外侧的岩石上拍。WebSearch 没找到报道。不收：是综艺节目而不是本人发的帖子，地点认不到具体观景点，崖边那段是不该照搬的拍法。
- **愛莉莎莎 Alisasa（台湾 YouTuber）· 优胜美地**：本人认证频道 2026-09-22 的《美國自駕 Cybertruck 到優勝美地國家公園》 https://www.youtube.com/watch?v=5KsMmmIzEKw （能嵌入，没有章节）。ETtoday 2026-09-03 报道她这趟在加州自驾（机场被种族歧视那条新闻），没提优胜美地。没收：她是网红、YouTuber，不是这一栏收的明星、歌手、演员、运动员；地点也还要看画面才能定到景点。仓库主人想收网红的话，这条最容易补。
- **林宣 Xuan Lin（台湾 YouTuber）· 优胜美地雾径**：认证频道 2022-08-18 的加州 vlog https://www.youtube.com/watch?v=nkcsO9Pv5nE ，章节写明“04:29 這次來爬的 Mist Trail”。WebSearch 只查到同名的旅游 YouTuber 去阿拉斯加打工游学，不是明星，没收。
- **Soya手癢計劃、阿滴、魚乾、瑪茲一、The DoDo Men、馬米高 等**：YouTube 搜“大峽谷 / 羚羊谷 / 黃石 / 優勝美地 / 班夫 vlog”出来的认证频道都是旅游、生活类 YouTuber，不是明星，没收。
- **鄧紫棋、張韶涵、鍾嘉欣、谷愛凌、劉雯、周子瑜、王嘉爾，以及韩团的华人成员（宋雨琦、宁艺卓、黄旭熙、WayV）**：按“人名 + 公园”在中文、英文、韩文里各搜了一次，都没找到在网站收录的公园里发帖的报道。不代表没有，只是这套搜索工具搜不到。
- **皮尔斯·布鲁斯南 · 黄石**：东网 2023-12-29 报道他涉嫌擅入黄石热泉禁区被起诉，违规，不收（也不是华语艺人）。

## 怎么找的、为什么少

- WebSearch 共 35 次。按地点盲搜（“藝人 + 公园名 + IG / 曬照”，加上 ETtoday、自由、三立、UDN、TVBS、HK01、东网、明报、星岛等域名限定）几乎只出旅行社线路和游记；能搜到的娱乐新闻偏向最近几个月（东网蔡明思那条就是这样搜到的）。按人名搜，搜索引擎对中文人名的召回也很差。
- 免费的补充办法：
  - ETtoday 站内搜索 `https://www.ettoday.net/news_search/doSearch.php?keywords=<词>` 不用登录，但只返回最近几个月、翻页参数不起作用（查到韩艺瑟那条）。
  - YouTube 搜索结果页（不登录）里能看到频道的认证标记，`BADGE_STYLE_TYPE_VERIFIED_ARTIST` 是官方艺人频道。按公园名搜了几十组中英文关键词，官方艺人频道里在这些公园拍了 vlog 的只有閻奕格（另有蔡依林的洛杉矶 vlog、Soya 的阿拉斯加极光，不在公园里或不是明星）。
  - B 站搜索页能用，但结果里看不出 UP 主是不是明星本人（查“羚羊谷 vlog”出来的都是普通 UP 主）。
- 照片、视频内容：Instagram 公开嵌入页、YouTube 公开的预览缩略图（storyboard）在浏览器面板里看，用来写拍法和确认有没有危险动作，不下载、不存。YouTube 的字幕接口现在不登录拿不到（返回空），没有用。
- 建议：港台明星照样“先有人名和事件、再核对”更有效。能想到具体是谁去过哪里的线索，交给助手按上面的方法核对，比按地点搜快得多。
