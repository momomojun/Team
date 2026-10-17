// 电影同款：电影、电视剧在网站收录的公园、名胜里取景的地方，写明拍的是哪场戏、怎么拍同款，附来源。
// 每条至少要有一个可靠来源确认这部片在这个地方拍过：NPS / Parks Canada 的拍摄页面、州或地方电影委员会、
// 片方或主流媒体的报道；只在粉丝网站、地点“看起来像”的不收。剧照不转载，场景和拍法是我们自己的描述；
// 拍法有危险的（崖边、在路中间站着拍），tipsZh 里写安全的拍法。

export interface FilmShot {
  id: string;
  /** 片名：中文通用译名（大陆常用的）和英文原名 */
  titleZh: string;
  titleEn: string;
  year: number;
  kind: "film" | "tv";
  /** 导演或主演，一两个人名就够（中文名） */
  creditsZh?: string;
  /** 公园代码 */
  park: string;
  /** 能对上网站景点的写景点 id，景点卡片上也显示 */
  attraction?: string;
  /** 在哪拍的 */
  placeZh: string;
  /** 拍的是哪场戏、画面里是什么（我们自己的描述，不剧透结局的关键情节就别写） */
  sceneZh: string;
  /** 怎么拍同款：站在哪、几点去光线最像、要不要预约或许可 */
  howToZh: string;
  tipsZh: string[];
  /**
   * 取景地的实景照片：Wikimedia Commons 上的文件名（不带 File: 前缀），只用允许转载的授权（CC BY、CC BY-SA、公有领域），
   * 不用剧照；由 scripts/build-film-photos.mjs 查缩略图、作者和授权。不填时用对应景点图集的第一张
   */
  photoFile?: string;
  /** 确认取景地的来源 */
  sources: string[];
  /** high：官方或几家可靠来源都写明；medium：只有一家可靠来源，或者具体机位是推断的 */
  confidence: "high" | "medium";
  /** 拿不准的地方 */
  noteZh?: string;
}

// 2026-10-16 整理，同一天扩充到 51 条、每条配上取景地的实景照片。查过没收的：
// 《绝地归来》恩多星球（主要在 Smith River 一带的私人林地，飞车追逐在 Grizzly Creek 州立公园，都不在网站景点里）、
// 《末路狂花》结尾（Fossil Point 在死马点州立公园外面，而且是结局）、《地心引力》结尾（鲍威尔湖，是结局）、《127 小时》（Blue John Canyon，BLM 土地；
// 走出峡谷那段是结局）、班夫一带的《盗梦空间》《荒野猎人》《断背山》《燃情岁月》（在坎莫尔、卡纳纳斯基斯和 Morley 保留地，不在国家公园里）、
// 成龙的《上海正午》（在艾伯塔的 Drumheller 恶地、Bragg Creek 布景和 Morley 一带拍，没查到在班夫、贾斯珀国家公园里拍）、
// 《日瓦戈医生》（只有一张铁路照片说明写了路易斯湖一带的雪景，拍的是铁路空镜）、《The Far Country》（1954，贾斯珀阿萨巴斯卡冰川上赶牛，
// 只有艾伯塔省历史遗产部门一家写了，国内知名度也低）、《国家宝藏 2》（在拉什莫尔山拍过，但片子的谜底就在这里，写出来就剧透）、
// 《假期历险记》大峡谷（只有 IMDb 和娱乐网站写了，没有可靠来源）、《大峡谷》（1991，没查到在公园哪里拍）、
// 《E.T. 外星人》（森林戏在 Crescent City 附近，具体地点说法不一，有的说在私人牧场，飞船降落那场在摄影棚）、
// 《百战天龙》试播集（Moab 旅游局写了在死马点拍过，哪场戏没查到）、《万世流芳》（Moab 旅游局写了在峡谷地 Green River 观景点拍过，哪场戏没查到）、
// 《西部世界》第二季和 2001 版《人猿星球》（都写了在鲍威尔湖拍过，没写在哪、拍的哪场）、《赌侠马华力》在优胜美地的几场（写在鲍威尔湖那条的提示里）、
// 《暮光之城》（故事设在奥林匹克半岛的 Forks，没查到在奥林匹克国家公园里拍的可靠来源）、剧集《黄石》（在蒙大拿的私人牧场和犹他拍，不在黄石公园里）、
// 《荒野生存》阿拉斯加的巴士（没查到在德纳里国家公园里拍）、《侏罗纪公园》（夏威夷那几座岛上的取景地都不在夏威夷火山、哈莱阿卡拉两座公园里）、
// 夏威夷火山、哈莱阿卡拉、大烟山、仙纳度、黄石、奥林匹克、大峡谷（没找到能说清在哪拍了哪场戏的可靠来源）。
// 华语电影、综艺：没找到在这些公园、名胜取景的可靠报道；韩剧只收了 2026 年 Netflix 的《爱情怎么翻译？》（路易斯湖、班夫镇）。

export const filmShots: FilmShot[] = [
  {
    id: "forrest-gump-mova",
    titleZh: "阿甘正传",
    titleEn: "Forrest Gump",
    year: 1994,
    kind: "film",
    creditsZh: "罗伯特·泽米吉斯 / 汤姆·汉克斯",
    park: "mova",
    attraction: "mova-forrest-gump-point",
    placeZh: "犹他州 163 号公路约 13 英里路标处，纪念碑谷部落公园以北（公路归犹他州交通厅管，不在部落公园里）",
    sceneZh:
      "阿甘横穿美国跑了三年多，跟着跑的人越来越多，他在这条笔直的公路上忽然停下、转身。画面是公路正中一条长长的直线伸向远处的红色孤峰。",
    howToZh:
      "从纪念碑谷游客中心往北开约 20 分钟、过了 Mexican Hat 方向的岔路之前，路边有一块写着 Forrest Gump Point 的小牌子和砂石停车处。拍的人站在路肩上，镜头放低、用长焦往南压缩公路和孤峰；被拍的人站在路肩白线外侧。镜头朝南，早晚太阳在东西两侧，都是侧光，日出日落时孤峰最红；中午太阳在南边，是逆光。",
    tipsZh: [
      "这是正常通车的国道，车速 100 公里以上，还有大货车。不要站到路中间拍：犹他州旅游局专门提醒过这里出过伤亡事故。想要“站在路中间”的效果，用长焦从路肩斜着拍。",
      "非要拍路中间的，两个人配合：一人在路肩专门看两头来车，看到车就喊，拍完马上回路肩，不要停留。",
      "去 Moab、拱门方向顺路经过；附近的 Valley of the Gods 和 Goosenecks 州立公园也可以一起看。",
    ],
    photoFile: "Forrest Gump Point Monument Valley November 2018 001.jpg",
    sources: [
      "https://www.visitutah.com/articles/selfie-at-forrest-gump-point",
      "https://www.ksl.com/article/51600293/utahs-roads-of-fame-exploring-utahs-roads-featured-in-hollywood",
    ],
    confidence: "high",
  },
  {
    id: "searchers-mova",
    titleZh: "搜索者",
    titleEn: "The Searchers",
    year: 1956,
    kind: "film",
    creditsZh: "约翰·福特 / 约翰·韦恩",
    park: "mova",
    attraction: "mova-john-fords-point",
    placeZh: "谷地自驾环线中段的约翰·福特点，一块伸出去的岩台正对 Merrick Butte",
    sceneZh:
      "故事设在得州，外景几乎都在纪念碑谷拍。约翰·福特点这一带拍的是骑兵、骑警在孤峰前集结准备出击的段落，人马站在岩台上，背后是空旷的谷地和红色孤峰。",
    howToZh:
      "开 Valley Drive 环线（砂土路）到约翰·福特点停车场，走几十米到岩台。拍的人退到岩台后方稍高处，把岩台、人和远处的 Merrick Butte 一起收进来；上午光照在孤峰正面，下午逆光适合拍剪影。纳瓦霍人常在岩台上牵马，骑马拍照现场付费。",
    tipsZh: [
      "岩台三面是陡坎，没有护栏，拍照别往边上退；骑马拍照听马主人安排。",
      "环线只能在规定的土路上开，冬季下午 2:30、其他季节 3:30 前进环线，以纳瓦霍部落公园公告为准。",
      "公园门票每人 10 美元，国家公园年卡不能用。",
    ],
    photoFile: "John Ford's Point Monument Valley Luca Galuzzi 2007.jpg",
    sources: [
      "https://www.glennfrankel.com/john-fords-monument",
      "https://theculturetrip.com/north-america/usa/articles/a-mythical-terrain",
      "https://catalog.afi.com/Film/53577-THE-SEARCHERS",
    ],
    confidence: "medium",
    noteZh: "《搜索者》在纪念碑谷拍外景是确定的；约翰·福特点拍的具体是哪场戏，几家说法不一样（有的说是骑警准备突袭营地，有的说是印第安营地被袭）。",
  },
  {
    id: "stagecoach-mova",
    titleZh: "关山飞渡",
    titleEn: "Stagecoach",
    year: 1939,
    kind: "film",
    creditsZh: "约翰·福特 / 约翰·韦恩",
    park: "mova",
    attraction: "mova-valley-drive",
    placeZh: "纪念碑谷谷地，游客中心下方 Valley Drive 环线一带",
    sceneZh:
      "约翰·福特第一次来纪念碑谷拍的片子，也是让约翰·韦恩成名的片子：一辆驿站马车载着一车各怀心事的乘客，穿过空旷的谷地，往远处的红色孤峰驶去。片中纪念碑谷的镜头加起来只有几分钟，其余大多在加州拍。",
    howToZh:
      "从游客中心下坡开进 Valley Drive 环线，在连指手套峰（West / East Mitten）和 Merrick Butte 之间的空旷谷地找路边能停车的宽处。拍的人退到路边高一点的地方，用中长焦把砂土路、谷地和三座孤峰压在一起，等有车或骑马的人从路上经过再按快门。早上太阳从孤峰背后升起，拍出来是剪影；下午顺光，孤峰最红。",
    tipsZh: [
      "环线是砂土路，只能在规定的路上开，坑多，开慢一点；冬季下午 2:30、其他季节 3:30 前进环线，以纳瓦霍部落公园公告为准。",
      "公园门票每人 10 美元，国家公园年卡不能用。",
      "Goulding's 旅馆里有个小博物馆，展出福特剧组当年在这里拍片的老照片。",
    ],
    photoFile: "Monument Valley USA Mittens and Merrick Butte 2009.jpg",
    sources: [
      "https://catalog.afi.com/Catalog/moviedetails/4173",
      "https://www.cbsnews.com/pictures/monument-valley-in-the-movies/",
      "https://truewestmagazine.com/harry-goulding-and-his-monument",
    ],
    confidence: "high",
    noteZh: "在纪念碑谷拍外景是确定的（AFI 记了片方资料）；具体是在谷地哪里拍的哪几个镜头没有公开，上面写的是能拍到同样画面的地方。",
  },
  {
    id: "my-darling-clementine-mova",
    titleZh: "侠骨柔情",
    titleEn: "My Darling Clementine",
    year: 1946,
    kind: "film",
    creditsZh: "约翰·福特 / 亨利·方达",
    park: "mova",
    placeZh: "纪念碑谷谷地（剧组在这里搭了一整座墓碑镇布景，早已拆掉，具体位置没有公开）",
    sceneZh:
      "讲怀亚特·厄普兄弟在墓碑镇当警长、和克兰顿一家结怨的故事。真的墓碑镇在亚利桑那南部，福特却把整座小镇搭在纪念碑谷：镇上的街道一眼望过去，尽头就是红色的孤峰。",
    howToZh:
      "布景已经不在了。想拍“小镇街道尽头是孤峰”的感觉，可以在游客中心一带用长焦，把远处的孤峰压到前景的建筑、围栏后面；或者开 Valley Drive，找一段笔直的土路，被拍的人站在路边、背后是孤峰。下午到傍晚孤峰顺光，颜色最暖。",
    tipsZh: [
      "环线上偶尔也有车，拍照时人站在路边，别站在土路中间。",
      "环线开放时间和门票以纳瓦霍部落公园公告为准，国家公园年卡不能用。",
    ],
    photoFile: "Monument Valley drive (51131270682).jpg",
    sources: [
      "https://www.tcm.com/articles/288846/behind-the-camera-my-darling-clementine",
      "https://catalog.afi.com/Catalog/moviedetails/24883",
      "https://www.cbsnews.com/pictures/monument-valley-in-the-movies/",
    ],
    confidence: "high",
    noteZh: "墓碑镇布景搭在纪念碑谷是确定的；搭在谷地哪个位置没查到。",
  },
  {
    id: "she-wore-a-yellow-ribbon-mova",
    titleZh: "黄巾骑兵队",
    titleEn: "She Wore a Yellow Ribbon",
    year: 1949,
    kind: "film",
    creditsZh: "约翰·福特 / 约翰·韦恩",
    park: "mova",
    placeZh: "纪念碑谷谷地（具体机位没有公开）",
    sceneZh:
      "福特“骑兵三部曲”的第二部，也是他在纪念碑谷拍的第一部彩色片。最有名的一个镜头：骑兵巡逻队排成一行走过谷地，背后是压过来的雷雨云和闪电。摄影师当时觉得光线不够、不想拍，福特坚持开机，这部片后来拿了奥斯卡最佳彩色摄影。",
    howToZh:
      "这种画面要碰天气：7–9 月午后常有雷雨，云从远处压过来时，在游客中心观景台或 Valley Drive 的空旷处，用中焦把低低的乌云和孤峰一起拍，地平线放低、让天空占大半。远处正好有骑马团经过时，最像片中的巡逻队。",
    tipsZh: [
      "打雷时别站在空旷的高处或岩台上，回车里或室内等；雷雨后土路积水打滑，环线可能临时关闭。",
      "骑马团由纳瓦霍向导带，在游客中心一带报名，费用现场问。",
    ],
    photoFile: "Storm Clouds at the Sun Rise (46030354065).jpg",
    sources: [
      "https://www.tcm.com/articles/21860/she-wore-a-yellow-ribbon",
      "https://www.filmsite.org/sheworeayellowribbon.html",
      "https://www.cbsnews.com/pictures/monument-valley-in-the-movies/",
    ],
    confidence: "high",
    noteZh: "在纪念碑谷拍、雷雨那场是福特坚持拍下来的，几家来源都写了；那场具体在谷地哪里没查到。",
  },
  {
    id: "2001-mova",
    titleZh: "2001 太空漫游",
    titleEn: "2001: A Space Odyssey",
    year: 1968,
    kind: "film",
    creditsZh: "斯坦利·库布里克",
    park: "mova",
    placeZh: "纪念碑谷上空（航拍，具体航线没有公开）",
    sceneZh:
      "片子后段“木星与无限之外”一段：穿过光的隧道之后，镜头低低地掠过一颗陌生星球的地面，颜色被处理成奇怪的蓝紫、橙红。仔细看，能认出纪念碑谷的孤峰和台地。",
    howToZh:
      "公园里不能飞无人机，地面上拍不出航拍。地面上最接近的是日出前后的游客中心观景台：天色发蓝、孤峰是剪影，后期把色调往冷色推，就有点片中“外星”的感觉。想看俯瞰的样子，只能坐观光飞机，有没有航线、价格以运营方为准。",
    tipsZh: [
      "纳瓦霍部落公园不能私自飞无人机。",
      "这一段里还有别的地方的航拍，不是每个镜头都是纪念碑谷。",
    ],
    photoFile: "Over Monument Valley, Navajo Nation - 3814243001.jpg",
    sources: [
      "https://www.cbsnews.com/pictures/monument-valley-in-the-movies/",
      "https://www.arizonahighways.com/blog/50-years-ago-two-iconic-films-featured-monument-valley",
    ],
    confidence: "high",
  },
  {
    id: "once-upon-a-time-in-the-west-mova",
    titleZh: "西部往事",
    titleEn: "Once Upon a Time in the West",
    year: 1968,
    kind: "film",
    creditsZh: "赛尔乔·莱昂内 / 克劳迪娅·卡汀娜",
    park: "mova",
    placeZh: "纪念碑谷谷地（具体机位没有公开）",
    sceneZh:
      "意大利导演莱昂内的经典西部片，大部分在西班牙拍，只有少数外景跑到纪念碑谷。常被提到的是女主角吉尔坐马车去荒原上的甜水镇那段：马车穿过红色孤峰之间的谷地，配着莫里康内的音乐。",
    howToZh:
      "开 Valley Drive，在路边能同时看到连指手套峰和远处台地的空旷处停车。拍的人退远用长焦，等环线上的车或骑马团从孤峰前经过，画面里留出大片天空；傍晚前后孤峰最红，云多的时候更有气势。",
    tipsZh: [
      "据说莱昂内来勘景时，把福特拍过的机位一个个指给剧组看，可以和《搜索者》《关山飞渡》的机位一起找。",
      "环线开放时间和门票以纳瓦霍部落公园公告为准，国家公园年卡不能用。",
    ],
    photoFile: "Monument Valley Sunset Thunderstorm.jpg",
    sources: [
      "https://www.arizonahighways.com/blog/50-years-ago-two-iconic-films-featured-monument-valley",
      "https://en.ilsole24ore.com/art/between-pinnacles-utah-once-upon-a-time-america-AHZrgRtC",
    ],
    confidence: "medium",
    noteZh: "在纪念碑谷拍过外景是确定的；吉尔坐马车那段是常见的说法，没找到可靠来源写明在纪念碑谷拍的是哪几场戏。",
  },
  {
    id: "easy-rider-mova",
    titleZh: "逍遥骑士",
    titleEn: "Easy Rider",
    year: 1969,
    kind: "film",
    creditsZh: "丹尼斯·霍珀 / 彼得·方达",
    park: "mova",
    attraction: "mova-the-view",
    placeZh: "从 Kayenta 往北到纪念碑谷的 163 号公路，和游客中心观景台看出去的谷地",
    sceneZh:
      "两个骑着改装摩托的年轻人一路向东，路过一座黑色的火山岩尖峰，镜头再慢慢扫过黎明时的纪念碑谷孤峰。没有台词，只有摩托、公路和大片荒原。",
    howToZh:
      "日出前到游客中心旁的观景台（The View 酒店前面），太阳从连指手套峰背后升起，孤峰是剪影，镜头慢慢横着扫，最像片中的长镜头。白天沿 163 号公路往南开，Kayenta 以北路东边那座黑色尖峰就是 Agathla Peak，在路边宽敞的停车处拍公路和尖峰。",
    tipsZh: [
      "163 号公路车速快、有大货车，只在正规的路边停车处停，拍公路别站到车道上。",
      "骑摩托来的话，保留地白天风沙大、晚上路上常有牛羊和野马，天黑前到住处。",
    ],
    photoFile: "Monument Valley sunrise.jpg",
    sources: [
      "https://www.visitutah.com/plan-your-trip/recommended-itineraries/easy-riding-southern-wasatch-to-monument-valley",
      "https://www.slate.com/id/2233176/entry/2233172/",
    ],
    confidence: "medium",
    noteZh: "犹他州旅游局写了片中扫过纪念碑谷的全景镜头；路过 Agathla Peak 的说法来自影评和取景地整理，没找到片方资料。",
  },
  {
    id: "back-to-the-future-3-mova",
    titleZh: "回到未来 3",
    titleEn: "Back to the Future Part III",
    year: 1990,
    kind: "film",
    creditsZh: "罗伯特·泽米吉斯 / 迈克尔·J·福克斯",
    park: "mova",
    placeZh: "纪念碑谷谷地边上（剧组搭了一座露天汽车电影院布景，拍完就拆了，具体位置没有公开）",
    sceneZh:
      "马蒂开着时光车德罗宁，从 1955 年孤峰脚下的一座露天汽车电影院出发，加速冲向画着印第安人的银幕，一下子回到 1885 年。穿越过去以后，眼前就是空旷的谷地和红色孤峰。",
    howToZh:
      "布景早就不在了。想拍“汽车 + 孤峰”的同款，在游客中心停车场或 Valley Drive 起点一带，把车停在能看到连指手套峰的地方，拍的人蹲低用广角，让车头冲着孤峰；日落前一小时孤峰最红，天黑以后开着车灯拍也有电影里的味道。",
    tipsZh: [
      "环线里只能在规定的土路上开，别为了拍照开出路面；天黑前要出环线。",
      "公园门票每人 10 美元，国家公园年卡不能用。",
    ],
    photoFile: "West Mitten Butte, East Mitten Butte, and Merrick Butte (Unsplash).jpg",
    sources: [
      "https://laist.com/news/entertainment/a-handy-guide-to-the-filming-locations-of-back-to-the-future",
      "https://www.cbsnews.com/pictures/monument-valley-in-the-movies/",
    ],
    confidence: "medium",
    noteZh: "露天电影院布景在纪念碑谷是确定的；搭在谷地哪个位置没查到。",
  },
  {
    id: "lone-ranger-mova",
    titleZh: "独行侠",
    titleEn: "The Lone Ranger",
    year: 2013,
    kind: "film",
    creditsZh: "戈尔·维宾斯基 / 约翰尼·德普",
    park: "mova",
    attraction: "mova-john-fords-point",
    placeZh: "Valley Drive 环线中段的约翰·福特点",
    sceneZh:
      "德普演的印第安人通托和蒙面侠约翰在纪念碑谷骑马、赶路的几场戏；有一个画面是两人站在约翰·福特点伸出去的岩台上，背后是 Merrick Butte。剧组的营地就扎在纪念碑谷，纳瓦霍族领导人还到片场给两位主演送了毛毯。",
    howToZh:
      "开到约翰·福特点停车场，走到岩台边。两个人站在岩台上一左一右、面向孤峰，拍的人退到岩台后方高一点的地方，用中焦把人、岩台和 Merrick Butte 收进来；上午孤峰正面受光，傍晚逆光拍剪影，最像海报。",
    tipsZh: [
      "岩台三面是陡坎，没有护栏，拍照别往边上退；骑马拍照听马主人安排，现场付费。",
      "片中也在亚利桑那的谢伊峡谷（Canyon de Chelly）拍过，不全是这里。",
    ],
    photoFile: "John Ford's Point and Merrick Butte (29290201352).jpg",
    sources: [
      "https://www.cbsnews.com/pictures/monument-valley-in-the-movies/",
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
      "https://indianz.com/News/2012/005326.asp",
    ],
    confidence: "high",
  },
  {
    id: "transformers-4-mova",
    titleZh: "变形金刚 4：绝迹重生",
    titleEn: "Transformers: Age of Extinction",
    year: 2014,
    kind: "film",
    creditsZh: "迈克尔·贝 / 马克·沃尔伯格",
    park: "mova",
    placeZh: "纪念碑谷部落公园和旁边的 163 号公路（犹他、亚利桑那交界一带，公路归州交通厅管）",
    sceneZh:
      "这部片就是在纪念碑谷开拍的：新造型的擎天柱和几辆跑车（变形前的汽车人）在红色孤峰之间的公路上排成车队飞驰。",
    howToZh:
      "163 号公路从游客中心路口往北到阿甘点一段，路两侧都是孤峰。拍车队同款，就在路边宽敞的停车处，用长焦对着来车方向，把公路和远处的孤峰压在一起，等车开过来；早上和傍晚侧光，孤峰最立体。",
    tipsZh: [
      "这是正常通车的国道，车速快、有大货车，人和三脚架都留在路肩外，别到车道上拍。",
      "往北开到阿甘点就是《阿甘正传》的机位，可以一起拍。",
    ],
    photoFile: "US Route 163 near Monument Valley.jpg",
    sources: ["https://www.ksl.com/article/news/utah/transformers-4-filming-in-monument-valley/25374950"],
    confidence: "medium",
    noteZh: "导演开拍时公布了在纪念碑谷部落公园开拍、车队开过 163 号公路；成片里具体是哪几个镜头，只有粉丝整理的资料说是残存的汽车人重新会合那段。",
  },
  {
    id: "indiana-jones-3-arch",
    titleZh: "夺宝奇兵 3：圣战奇兵",
    titleEn: "Indiana Jones and the Last Crusade",
    year: 1989,
    kind: "film",
    creditsZh: "史蒂文·斯皮尔伯格 / 哈里森·福特",
    park: "arch",
    attraction: "arch-double-arch",
    placeZh: "窗户区的双拱门",
    sceneZh:
      "开场的 1912 年：少年印第安纳·琼斯跟童子军在犹他沙漠骑马，溜进一个山洞撞见盗墓贼。画面里两道相连的巨大拱门立在岩壁上方；山洞是剧组搭的，现实里拱下没有洞。",
    howToZh:
      "开到窗户区下层的 Double Arch 停车场，走约 0.5 公里平缓沙路到拱脚。想要电影里那种“远处看拱门”的画面，就在停车场到拱门的半路上回头找角度，人放小、让两道拱占画面上半部；想拍仰视，就走到两道拱正下方用广角往上拍。早上拱门内侧背阴、颜色柔和，日落前一小时外侧最红。",
    tipsZh: [
      "可以爬到拱下的岩石上，但往下爬比往上难，看好路线；别爬到拱上去，拱门园区禁止攀爬拱门。",
      "2026 年进园不用预约时段，但 3–10 月白天入口常排队一小时以上，早上 7 点前进园最顺。",
      "对面就是南北窗和炮塔拱门，一次停车都能看。",
    ],
    photoFile: "Double Arch (Arches National Park).jpg",
    sources: [
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
      "https://www.discovermoab.com/movie-sites",
      "https://naturalarches.org/BobsArches/DoubleArch.html",
    ],
    confidence: "high",
  },
  {
    id: "thelma-louise-arch",
    titleZh: "末路狂花",
    titleEn: "Thelma & Louise",
    year: 1991,
    kind: "film",
    creditsZh: "雷德利·斯科特 / 苏珊·萨兰登、吉娜·戴维斯",
    park: "arch",
    attraction: "arch-park-avenue",
    placeZh: "进园后不远的法院塔（Courthouse Towers）一带，公园大道观景点往北",
    sceneZh:
      "两人超速被州警拦下，反过来缴了他的枪、把他锁进警车后备箱的那场戏。画面是一条空荡的公路，路边是高耸的砂岩塔和岩墙。",
    howToZh:
      "进园后沿主路上坡，先到公园大道停车场，再往北开约 2 公里到法院塔一带的路边停车处。拍的人站在路边停车处里，用中长焦把公路、车和后面的砂岩塔一起拍；下午到傍晚太阳在西边，岩塔正面被照亮。",
    tipsZh: [
      "只在正规的停车处停车，别把车停在主路上摆拍；园内主路车多，下车先看后方来车。",
      "公园大道观景台到法院塔之间有一条约 1.6 公里的谷底步道，单程走过去能慢慢找角度，安排人到另一头接。",
    ],
    photoFile: "Courthouse Towers kz01.jpg",
    sources: [
      "https://www.visitutah.com/plan-your-trip/recommended-itineraries/thelma-louise-road-trip",
      "https://www.discovermoab.com/movie-sites",
    ],
    confidence: "medium",
    noteZh: "Moab 旅游局写了这部片在拱门国家公园拍过；具体在法院塔拍警察这场戏，只有犹他州旅游局一家写明。片尾那场戏在死马点州立公园外的 Fossil Point，不在收录范围。",
  },
  {
    id: "mission-impossible-2-dead-horse-point",
    titleZh: "碟中谍 2",
    titleEn: "Mission: Impossible 2",
    year: 2000,
    kind: "film",
    creditsZh: "吴宇森 / 汤姆·克鲁斯",
    park: "cany",
    attraction: "cany-dead-horse-point",
    placeZh: "死马点州立公园（犹他州立公园，不在峡谷地国家公园里，在去天空之岛的路上）",
    sceneZh:
      "吴宇森执导的开场：伊森·亨特在度假，不系保护徒手攀在几百米高的红色崖壁上，身下是科罗拉多河绕出的大弯；爬到崖顶后，直升机送来藏着任务的墨镜。",
    howToZh:
      "开到州立公园最里面的 Dead Horse Point 观景台，往下看就是片中那种红崖加马蹄弯的背景。拍的人站在观景台护栏里侧，被拍的人背靠护栏、侧身做“刚爬上来”的动作，用广角把下面的河弯收进来；日出时河弯在阴影里、远处崖壁先亮，日落前一小时整片崖壁最红。",
    tipsZh: [
      "不要模仿攀崖：只在护栏里侧拍，崖边砂岩风化松脆，一碰就掉，每年都有人在 Moab 一带坠崖。",
      "州立公园另收门票，2026 年每辆车 20 美元，国家公园年卡不能用。",
      "园内 East Rim / West Rim 步道沿崖边走，能多找几个看河弯的角度；顺路接着去峡谷地天空之岛。",
    ],
    photoFile: "Dead Horse Point State Park.jpg",
    sources: [
      "https://www.discovermoab.com/movie-sites",
      "https://slashfilm.com/1790549/tom-cruise-injured-mission-impossible-2-stunt-rock-climbing",
      "https://www.redcliffslodge.com/attractions/dead-horse-point-state-park",
    ],
    confidence: "high",
    noteZh: "确定是在死马点拍的；克鲁斯爬的是哪一面崖壁没有公开，观景台只是能看到同样背景的地方。",
  },
  {
    id: "westworld-dead-horse-point",
    titleZh: "西部世界（第一季）",
    titleEn: "Westworld",
    year: 2016,
    kind: "tv",
    creditsZh: "埃文·蕾切尔·伍德 / 安东尼·霍普金斯",
    park: "cany",
    attraction: "cany-dead-horse-point",
    placeZh: "死马点州立公园（犹他州立公园，不在峡谷地国家公园里，在去天空之岛的路上）和峡谷地国家公园一带",
    sceneZh:
      "HBO 的科幻西部剧：主题乐园里的机器人“接待员”一遍遍过着重来的西部生活。第一季里交代乐园有多大的远景，很多就是死马点、峡谷地一带层层叠叠的红色台地和峡谷。",
    howToZh:
      "开到死马点观景台，或者沿 East Rim / West Rim 步道往两边走几百米，找没有护栏和人群入镜的角度，用广角把台地和下面科罗拉多河的大弯收进来。日落前一小时崖壁最红；日出时河谷里常有薄雾，最像剧里那种辽阔又有点不真实的感觉。",
    tipsZh: [
      "崖边砂岩风化松脆，离边缘留出几步，别为了构图往前挪。",
      "州立公园门票 2026 年每辆车 20 美元，国家公园年卡不能用；峡谷地国家公园另收门票。",
      "第一季也在 Moab 东边的 Castle Valley 拍了不少，开 128 号公路时可以顺路转进去看。",
    ],
    photoFile: "DeadHorseStatePark.jpg",
    sources: [
      "https://www.visitutah.com/articles/HBOs-Westworld-go-there-now",
      "https://sltrib.com/artsliving/tv/2016/12/27/binge-watch-westworld-and-look-for-utah-landmarks",
    ],
    confidence: "medium",
    noteZh: "犹他州旅游局和犹他电影委员会都写了第一季在死马点州立公园、峡谷地国家公园拍过；具体是哪几集、哪几个镜头没有公开。",
  },
  {
    id: "thelma-louise-shafer",
    titleZh: "末路狂花",
    titleEn: "Thelma & Louise",
    year: 1991,
    kind: "film",
    creditsZh: "雷德利·斯科特 / 苏珊·萨兰登、吉娜·戴维斯",
    park: "cany",
    attraction: "cany-shafer-canyon-overlook",
    placeZh: "峡谷地国家公园天空之岛一带的 Shafer Canyon 观景点，下面是盘山土路 Shafer Trail",
    sceneZh:
      "电影后半段，塞尔玛和路易丝开着那辆绿色的雷鸟敞篷车一路往西逃，车开进一片红色峡谷和台地，四周空无一人，只有土路和峭壁。",
    howToZh:
      "进天空之岛的入口站后不远，路左边就是 Shafer Canyon 观景点，走几步到崖边护栏处，往下看是一圈圈盘下峡谷的 Shafer Trail。拍的人站在护栏里侧用中长焦，把盘山路和下面的峡谷收进来，等有越野车开下去时按快门；上午太阳在东边，峡谷里光线最均匀。",
    tipsZh: [
      "Shafer Trail 是陡峭的砂石路，要高底盘四驱、有经验再开，多数租车合同不让开；不开下去，在观景点看就够了。",
      "峡谷地国家公园门票每车 30 美元，国家公园年卡可用。",
      "片尾的悬崖戏在死马点州立公园外的 Fossil Point，属于结局，这里不写。",
    ],
    photoFile: "Shafer Trail (51224238070).jpg",
    sources: [
      "https://www.discovermoab.com/movie-sites",
      "https://www.wilderness.org/articles/blog/18-biggest-national-park-and-forest-cameos-movies",
    ],
    confidence: "medium",
    noteZh: "Moab 旅游局把 Shafer Overlook 列为取景地，Wilderness Society 写了后半段的荒漠戏在峡谷地拍；具体是哪一场没查到。",
  },
  {
    id: "butch-cassidy-zion",
    titleZh: "虎豹小霸王",
    titleEn: "Butch Cassidy and the Sundance Kid",
    year: 1969,
    kind: "film",
    creditsZh: "乔治·罗伊·希尔 / 保罗·纽曼、罗伯特·雷德福",
    park: "zion",
    placeZh: "锡安峡谷里的维珍河边（具体河段没有公开）；园区西北角的科罗布一带也拍过",
    sceneZh:
      "两个西部大盗布奇和圣丹斯被一路追捕。片中有一段两人并排骑着马，沿锡安峡谷的维珍河往前走，两边是高耸的红色岩壁。",
    howToZh:
      "从游客中心出发的 Pa'rus 步道沿着维珍河走，平缓好走，河对岸就是锡安峡谷的岩壁。走到步道中段的小桥上往峡谷深处看，用中焦把河、两岸的棉白杨和远处的岩峰一起拍。早上峡谷背阴、岩壁偏冷色；下午太阳偏西，岩壁被照成橙红色。",
    tipsZh: [
      "班车季锡安峡谷景观道不让私家车进，Pa'rus 步道从游客中心走过去就行，不用坐班车。",
      "想骑马同款，园内有特许经营的骑马团，线路和季节以官网为准。",
      "片中骑自行车那场在园外的 Grafton 鬼镇，可以出园后顺路去。",
    ],
    photoFile: "Virgin River, Zion Canyon, Zion National Park, Utah (1025561083).jpg",
    sources: [
      "https://www.visitutah.com/plan-your-trip/recommended-itineraries/robert-redfords-sundance",
      "https://film.greaterzion.com/filmed-in-greater-zion/",
      "https://tcm.com/this-month/article/220487",
    ],
    confidence: "medium",
    noteZh: "犹他州旅游局写了两人沿维珍河骑马这段在锡安峡谷拍，雷德福也说过锡安是片中最好的外景之一；具体在哪段河没查到。科罗布这边犹他州旅游局说是布奇的藏身地，在 Cave Valley 一带拍了他和手下争老大的戏。",
  },
  {
    id: "galaxy-quest-goblin-valley",
    titleZh: "银河追缉令",
    titleEn: "Galaxy Quest",
    year: 1999,
    kind: "film",
    creditsZh: "迪恩·帕里索特 / 蒂姆·艾伦、西格妮·韦弗",
    park: "care",
    attraction: "care-goblin-valley",
    placeZh: "妖精谷州立公园（犹他州立公园，在圆顶礁国家公园东边约 1.5 小时车程，不在国家公园里）",
    sceneZh:
      "一群过气科幻剧演员被真外星人请去“救场”，传送到一颗陌生星球上找零件。外星球的地面就是这里成片的蘑菇状红色石柱。",
    howToZh:
      "从观景台停车场走下坡，进第一片谷地（Valley 1）就是满地石柱，可以随便在石柱间走。拍外星球感：人站在两三根高石柱之间，拍的人蹲低、用广角往上拍，把石柱的“蘑菇头”和天空一起收进来；傍晚斜光下石柱影子最长，阴天反而更像外星。",
    tipsZh: [
      "州立公园另收门票，2026 年每辆车 20 美元，国家公园年卡不能用。",
      "别爬到石柱顶上、也别坐在“蘑菇头”上：石柱很脆，2013 年有人推倒石柱被起诉。",
      "夏天中午谷底没有遮阴，很热；附近的 Little Wild Horse Canyon 片中也拍过，是好走的窄缝峡谷，雨天别进。",
    ],
    photoFile: "Utah - North America - Goblin Valley State Park - Hoodoos (4892850582).jpg",
    sources: [
      "https://www.discovermoab.com/movie-sites",
      "https://utahfilmcenter.org/film-screening/galaxy-quest/",
      "https://www.utah.com/destinations/state-parks/goblin-valley-state-park/",
    ],
    confidence: "high",
  },
  {
    id: "star-wars-artists-palette",
    titleZh: "星球大战：新希望",
    titleEn: "Star Wars: Episode IV – A New Hope",
    year: 1977,
    kind: "film",
    creditsZh: "乔治·卢卡斯 / 马克·哈米尔",
    park: "deva",
    attraction: "deva-artists-palette",
    placeZh: "Artists Drive 景观道中途的艺术家调色板停车场下方",
    sceneZh:
      "塔图因星球上，R2-D2 独自走进一条峡谷，被躲在岩石后的爪哇人（Jawa）用电击枪击倒、抬上沙漠爬行者。拍的是停车场左下方的棕色干沟，远处巨大的沙漠爬行者是后期画上去的。",
    howToZh:
      "从 Badwater Road 南口进单行的 Artists Drive，开到 Artists Palette 停车场。站在停车场边往下看左手边的棕色干沟，就是 R2-D2 走进去的地方；停车场南边转弯处的碎石坡是爪哇人抬着它走的路线。下午 3 点以后光打在彩色山坡上，粉绿色最明显。",
    tipsZh: [
      "Artists Drive 单行，只能从南口进、北口出；车长超过 25 英尺（约 7.6 米）不能进。",
      "可以走下停车场到干沟里，但这片彩色岩层很脆，别踩到坡面上；夏天中午地表能到 70°C 以上，上午或傍晚再去。",
      "NPS App 里有一条免费的《星球大战》取景地自驾语音导览，进园前下载好，园内多数地方没信号。",
    ],
    photoFile: "Death Valley at Artists Palette 2013.jpg",
    sources: [
      "https://www.nps.gov/deva/planyourvisit/star-wars-in-death-valley.htm",
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
      "https://www.saturdayeveningpost.com/2026/06/finding-star-wars-in-death-valley/",
    ],
    confidence: "high",
  },
  {
    id: "star-wars-dantes-view",
    titleZh: "星球大战：新希望",
    titleEn: "Star Wars: Episode IV – A New Hope",
    year: 1977,
    kind: "film",
    creditsZh: "乔治·卢卡斯 / 亚历克·吉尼斯",
    park: "deva",
    attraction: "deva-dantes-view",
    placeZh: "但丁观景台，俯瞰恶水盆地",
    sceneZh:
      "欧比旺带卢克站在崖边，俯瞰远处的莫斯艾斯利太空港，说那里是银河系里最乌烟瘴气的地方。画面下方的盐滩就是恶水盆地，太空港的建筑和道路是后期画上去的。",
    howToZh:
      "从 190 号公路转进 Dantes View Road 开到山顶停车场，往南走几分钟到观景台边。被拍的人站在观景台平台上背对镜头、看向下方白色的恶水盆地，拍的人退后用中焦，把人和下面的盐滩一起拍；日出时太阳从背后升起，盆地对面的 Telescope Peak 先亮，最像电影的冷色调。",
    tipsZh: [
      "最后一段路又窄又陡，车长超过 25 英尺（约 7.6 米）不能上去。",
      "山顶海拔约 1,669 米，比谷底凉十几度，风大，冬天早上带厚外套。",
      "平台外面的山脊没有护栏，拍照别往外走。",
    ],
    photoFile: "Badwater Basin from Dante's View Overlook.JPG",
    sources: [
      "https://www.nps.gov/deva/planyourvisit/star-wars-in-death-valley.htm",
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
      "https://www.saturdayeveningpost.com/2026/06/finding-star-wars-in-death-valley/",
    ],
    confidence: "high",
  },
  {
    id: "star-wars-mesquite-dunes",
    titleZh: "星球大战：新希望",
    titleEn: "Star Wars: Episode IV – A New Hope",
    year: 1977,
    kind: "film",
    creditsZh: "乔治·卢卡斯",
    park: "deva",
    attraction: "deva-mesquite-dunes",
    placeZh: "Stovepipe Wells 以东的梅斯基特平原沙丘",
    sceneZh:
      "C-3PO 和 R2-D2 坐逃生舱落到塔图因后在沙丘里分道扬镳，R2-D2 独自往远处的山走。塔图因的沙丘戏大多在突尼斯拍，这里补拍了一部分远景。",
    howToZh:
      "停在 190 号公路边的沙丘停车场，往沙丘里走 15–20 分钟，避开停车场附近被踩乱的沙面。拍的人站在一道沙脊上，让被拍的人（或者你带的 R2-D2 模型）走在下面的沙谷里、背对镜头往远山走，留出大片沙纹；日出后半小时和日落前一小时沙纹影子最立体。",
    tipsZh: [
      "NPS 建议夏天上午 10 点以后别进沙丘徒步；沙丘里没有步道，记好回停车场的方向。",
      "不能开车上沙丘，可以带自己的滑沙板。",
    ],
    photoFile: "Mesquite Flat Sand Dunes Death Valley December 2013.jpg",
    sources: [
      "https://www.nps.gov/deva/planyourvisit/star-wars-in-death-valley.htm",
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
      "https://www.saturdayeveningpost.com/2026/06/finding-star-wars-in-death-valley/",
    ],
    confidence: "medium",
    noteZh: "NPS 和白宫 2015 年的文章都写了这片沙丘是取景地之一；具体是片中哪几个镜头，只有《星期六晚邮报》一家写明。",
  },
  {
    id: "zabriskie-point-deva",
    titleZh: "扎布里斯基角",
    titleEn: "Zabriskie Point",
    year: 1970,
    kind: "film",
    creditsZh: "米开朗基罗·安东尼奥尼",
    park: "deva",
    attraction: "deva-zabriskie",
    placeZh: "扎布里斯基角观景台和下方的黄色泥岩丘",
    sceneZh:
      "意大利导演安东尼奥尼拍的美国六十年代青年反叛电影，片名就是这个观景点。最有名的一段是一对男女在观景台下起伏的黄色泥岩丘之间漫游，画面里只有光秃秃的土丘和尖尖的 Manly Beacon。",
    howToZh:
      "从停车场走几分钟上坡到观景台，往下看就是片中的泥岩丘。想走进画面里，就从观景台走 Badlands Loop 或往金色峡谷方向的步道下到土丘之间，拍的人留在步道高处用长焦往下拍，人放小、让起伏的土丘占满画面。日出时土丘被一点点照亮，最像片中的金黄色。",
    tipsZh: [
      "泥岩表面很脆，走现成的步道，别在没路的坡上滑下去，下雨后更滑。",
      "从这里走到 Manly Beacon 约 2.4 公里，夏天上午 10 点后别下去，带足水。",
    ],
    photoFile: "Manly Beacon seen from Zabriskie Point, Death Valley National Park, California.jpg",
    sources: [
      "https://www.nps.gov/deva/learn/historyculture/death-valley-in-movies-and-television.htm",
      "https://www.atlasobscura.com/places/zabriskie-point",
      "https://catalog.afi.com/Catalog/moviedetails/18851",
    ],
    confidence: "high",
  },
  {
    id: "star-wars-golden-canyon",
    titleZh: "星球大战：新希望",
    titleEn: "Star Wars: Episode IV – A New Hope",
    year: 1977,
    kind: "film",
    creditsZh: "乔治·卢卡斯",
    park: "deva",
    attraction: "deva-golden-canyon",
    placeZh: "Badwater Road 边金色峡谷（Golden Canyon）步道口往里的一段干沟",
    sceneZh:
      "接着艺术家调色板那场：R2-D2 独自滚进一条窄峡谷，爪哇人躲在岩缝里、从大石头后面探头盯着它。镜头里是两侧黄褐色的泥岩壁和满地碎石的干沟。",
    howToZh:
      "从 190 号公路转进 Badwater Road 往南约 3 公里，路东边就是 Golden Canyon 停车场。沿干沟往里走十几分钟，两侧岩壁收窄、有大石块的地方最像片中。拍的人站在干沟中间、蹲低往上游拍，让被拍的人（或者你带的 R2-D2 模型）走在画面中下部，两侧岩壁做框。上午谷里背阴、光线均匀；下午太阳照进来，岩壁发金。",
    tipsZh: [
      "岩缝和石头底下可能有蝎子和响尾蛇，别把手伸进看不到的缝里。",
      "夏天谷底很热、没有遮阴，5–9 月上午 10 点以后别进，带足水。",
      "沿步道继续往里走约 2.5 公里能到红色大教堂（Red Cathedral），也有步道接到扎布里斯基角。",
    ],
    photoFile: "Narrows in Golden Canyon, Death Valley National Park, California.jpg",
    sources: [
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
      "https://www.saturdayeveningpost.com/2026/06/finding-star-wars-in-death-valley/",
    ],
    confidence: "medium",
    noteZh: "白宫 2015 年的文章写了金色峡谷是取景地之一；具体是片中哪几个镜头，只有《星期六晚邮报》一家写明。",
  },
  {
    id: "star-wars-desolation-canyon",
    titleZh: "星球大战：新希望",
    titleEn: "Star Wars: Episode IV – A New Hope",
    year: 1977,
    kind: "film",
    creditsZh: "乔治·卢卡斯 / 马克·哈米尔",
    park: "deva",
    placeZh: "Badwater Road 东侧、金色峡谷以南的荒凉峡谷（Desolation Canyon）",
    sceneZh:
      "沙人（塔斯肯袭击者）冲回去骑上班萨兽的那场在这里拍；卢克举着望远镜看远处的沙人时，镜头里也是这条峡谷的谷口。",
    howToZh:
      "从 Badwater Road 转进一条短砂石路到停车处，沿干沟往东走进峡谷。想拍“卢克举望远镜”的画面，就在谷口外的高处，让被拍的人举着望远镜朝谷里看，拍的人在侧后方用中焦把人和远处的谷口一起拍。谷口朝西，下午顺光，岩壁的颜色最清楚。",
    tipsZh: [
      "峡谷里没有修整的步道，往里有几处要手脚并用爬过干瀑布，没把握就在谷口拍。",
      "夏天 5–9 月上午 10 点以后别进；这里是荒野区，不能开车进去，也不能飞无人机。",
      "砂石路一般小轿车能开，下过雨先问游客中心。",
    ],
    photoFile: "Desolation Canyon in Death Valley National Park, California, US.jpg",
    sources: [
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
      "https://www.saturdayeveningpost.com/2026/06/finding-star-wars-in-death-valley/",
    ],
    confidence: "medium",
    noteZh: "白宫 2015 年的文章写了荒凉峡谷是取景地之一；具体是片中哪几个镜头，只有《星期六晚邮报》一家写明。",
  },
  {
    id: "return-of-the-jedi-twenty-mule-team",
    titleZh: "星球大战：绝地归来",
    titleEn: "Star Wars: Episode VI – Return of the Jedi",
    year: 1983,
    kind: "film",
    creditsZh: "理查德·马昆德 / 安东尼·丹尼尔斯",
    park: "deva",
    placeZh: "190 号公路南侧的二十骡队峡谷（Twenty Mule Team Canyon）单行土路，扎布里斯基角东边",
    sceneZh:
      "开场不久，C-3PO 和 R2-D2 走在去贾巴宫殿的路上，一路嘀嘀咕咕，路两边是起伏的荒山。画面里的“路”其实是两侧夹着土丘的干沟。",
    howToZh:
      "入口在扎布里斯基角东边、190 号公路南侧，是一条约 4 公里的单行土路，绕一圈回到 190 号公路。在两侧土丘最高、路看得最远的地方找宽处停车，拍的人站在路边高一点的地方往下拍，让被拍的人沿着干沟走向远处。早上土丘被侧光照亮，黄褐色的层理最清楚。",
    tipsZh: [
      "一般小轿车能开，特别低的车不建议；下雨后可能封路，出发前问游客中心。",
      "单行路，只在宽处停车，别把车停在弯道上；夏天车里也备足水。",
      "蓝光版删减片段里卢克组装光剑的小山洞也在这条峡谷，NPS 说洞已经因为安全原因封闭，别进去。",
    ],
    photoFile: "TWENTY MULE TEAM CANYON ROAD, DEATH VALLEY, CA.jpg",
    sources: [
      "https://www.nps.gov/thingstodo/drive-twenty-mule-team-canyon.htm",
      "https://www.saturdayeveningpost.com/2026/06/finding-star-wars-in-death-valley/",
    ],
    confidence: "high",
  },
  {
    id: "shining-glac",
    titleZh: "闪灵",
    titleEn: "The Shining",
    year: 1980,
    kind: "film",
    creditsZh: "斯坦利·库布里克 / 杰克·尼科尔森",
    park: "glac",
    attraction: "glac-wild-goose-island",
    placeZh: "圣玛丽湖和湖北岸的向阳大道东段，野鹅岛观景台一带",
    sceneZh:
      "片头字幕：航拍镜头贴着平静的湖面飞过湖中的小岛，再追上一辆在山路上开的黄色甲壳虫，一家三口正开往山上的酒店，配着阴森的音乐。",
    howToZh:
      "开向阳大道东段到 Rising Sun 以西的野鹅岛观景台，路边停车走几步就到。片头那种“湖、小岛、远山”的画面，用中焦对准湖中小岛，把两侧山峰收进来；想加上片中的公路，往东退到能看见湖边公路的弯道处。清晨无风时湖面最平，最像片头。",
    tipsZh: [
      "国家公园内禁止飞无人机，航拍同款拍不了，靠地面机位。",
      "春季扫雪后东段一般 6 月前后才通到这里，以 NPS 路况为准；2026 年进园不用预约。",
      "拍公路时人和车都待在停车处里，别在弯道上停车。",
    ],
    photoFile: "Wild Goose Island 2017.jpg",
    sources: [
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
      "https://idyllopuspress.com/idyllopus/film/sh_stmarys.htm",
    ],
    confidence: "high",
    noteZh: "片头是直升机航拍，地面上没有一样的机位；野鹅岛观景台是看同一片湖面最近的地方。片中的酒店外景在俄勒冈州的 Timberline Lodge，不在这里。",
  },
  {
    id: "forrest-gump-glac",
    titleZh: "阿甘正传",
    titleEn: "Forrest Gump",
    year: 1994,
    kind: "film",
    creditsZh: "罗伯特·泽米吉斯 / 汤姆·汉克斯",
    park: "glac",
    attraction: "glac-going-to-the-sun-road",
    placeZh: "向阳大道东段沿圣玛丽湖的一段",
    sceneZh:
      "阿甘长跑横穿美国的蒙太奇里，有一段他跑在山间公路上，背后是雪山和圣玛丽湖；旁白里说山里的湖静得像有两个天空。",
    howToZh:
      "在 St. Mary 入口到 Rising Sun、野鹅岛观景台之间，找路边的停车处。拍的人站在停车处里，用长焦把公路弯道、湖面和背后的山压在一起，被拍的人在路肩外的停车处里做跑步动作。早上逆光、湖面最平；下午顺光，山体颜色更清楚。",
    tipsZh: [
      "不要在向阳大道的车道上跑步摆拍：路窄弯多、夏天车很多，只在停车处里拍。",
      "7–8 月上午 9 点以后到傍晚车多，清晨来最顺；2026 年进园不用预约。",
    ],
    photoFile: "Little Chief Mountain and Saint Mary Lake with Going-to-the-Sun Road- panoramio.jpg",
    sources: [
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
      "https://www.reddeeradvocate.com/life/the-upside-of-the-mountaintop-view-photo-gallery/",
    ],
    confidence: "medium",
    noteZh: "确定是向阳大道和圣玛丽湖；阿甘具体跑在哪一段路上没查到可靠的说法，上面写的是能拍到同样背景的路段。",
  },
  {
    id: "nomadland-wall-drug",
    titleZh: "无依之地",
    titleEn: "Nomadland",
    year: 2020,
    kind: "film",
    creditsZh: "赵婷 / 弗兰西斯·麦克多蒙德",
    park: "badl",
    attraction: "badl-wall-drug",
    placeZh: "Wall 镇主街的 Wall Drug 杂货铺（私人商店，不在恶地国家公园里）",
    sceneZh:
      "华人导演赵婷拿下奥斯卡最佳影片和最佳导演的电影。电影一开拍就在南达科他：女主角弗恩一路打零工，有一段在 Wall Drug 干活，戴着店里那种纸帽子。",
    howToZh:
      "Wall 镇就在 I-90 边上，离恶地国家公园 Pinnacles 入口约 15 分钟。店里几条走廊连着餐厅、牛仔用品店和老照片墙，在餐厅一带找有木头装饰和西部招牌的角落拍；主街门口的老招牌下也能拍。白天人多，开门后不久或傍晚人少一些。",
    tipsZh: [
      "店里拍照没问题，但别对着店员和其他顾客的脸拍。",
      "冰水仍然免费、咖啡 5 美分；看完恶地的日落回来吃晚饭正好。",
    ],
    photoFile: "Wall Drug Ext. Day.jpg",
    sources: [
      "https://www.travelsouthdakota.com/trip-ideas/roam-south-dakotas-nomadland",
      "https://www.thelocationguide.com/industrynews/academy-award-winning-nomadland-displays-the-landscapes-of-the-american-west",
    ],
    confidence: "high",
  },
  {
    id: "nomadland-badl",
    titleZh: "无依之地",
    titleEn: "Nomadland",
    year: 2020,
    kind: "film",
    creditsZh: "赵婷 / 弗兰西斯·麦克多蒙德",
    park: "badl",
    placeZh: "恶地国家公园的岩丘之间（具体哪条步道没有公开）",
    sceneZh: "弗恩一个人在恶地的岩丘间徒步，停下来看四周粉色、米色条纹的岩壁。没有台词，只有人和大片荒地。",
    howToZh:
      "这类画面在 Cedar Pass 一带最容易拍：Door 和 Window 步道、Notch 步道口都在 240 号公路边。人走在步道上、背对镜头，拍的人退远用中长焦，让条纹岩壁占满画面、人只占一小块。日出后一小时和日落前一小时岩壁的粉色最明显。",
    tipsZh: [
      "Door 步道走过木栈道以后，要沿黄色标杆走，岩丘表面松软，下雨后很滑。",
      "夏天中午岩丘间没有遮阴，带足水；看到响尾蛇绕开走。",
    ],
    photoFile: "Badlands National Park - End of Door Trail at dusk.jpg",
    sources: ["https://www.travelsouthdakota.com/trip-ideas/roam-south-dakotas-nomadland"],
    confidence: "medium",
    noteZh: "南达科他州旅游局写了这段在恶地国家公园拍，但没说哪条步道；有旅游博客说弗恩做营地管理员的营地是 Cedar Pass 营地，没找到可靠来源，没写进来。",
  },
  {
    id: "dances-with-wolves-badl",
    titleZh: "与狼共舞",
    titleEn: "Dances with Wolves",
    year: 1990,
    kind: "film",
    creditsZh: "凯文·科斯特纳",
    park: "badl",
    attraction: "badl-sage-creek-rim-road",
    placeZh: "恶地国家公园西北部的 Sage Creek 荒野区，Sage Creek Rim Road 沿线",
    sceneZh:
      "邓巴中尉坐着运货马车，从海斯堡出发穿过大草原去偏远的塞奇威克堡。一路是起伏的草原，地平线上是恶地的岩丘。",
    howToZh:
      "从 Pinnacles 观景点北边转进 Sage Creek Rim Road（砂石路），沿路有几个路边观景处，一侧是草原、一侧是岩丘。拍的人站在观景处里，用长焦往草原深处拍，等野牛群或远处的砂石路进画面；傍晚太阳低，草原金黄、岩丘有阴影，最像电影的色调。",
    tipsZh: [
      "野牛就在路边吃草时也要至少保持 25 码（约 23 米），在车里拍最安全，别下车靠近。",
      "大雨、下雪后砂石路会临时封闭，出发前问游客中心。",
    ],
    photoFile: "Pinnacles Overlook-Sage Creek Rim Road PA100142.JPG",
    sources: [
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
      "https://americancowboy.com/lifestyle/black-hills-sd/",
    ],
    confidence: "high",
  },
  {
    id: "starship-troopers-badl",
    titleZh: "星河战队",
    titleEn: "Starship Troopers",
    year: 1997,
    kind: "film",
    creditsZh: "保罗·范霍文",
    park: "badl",
    placeZh: "恶地国家公园（具体在哪片岩丘没有公开）",
    sceneZh:
      "人类联邦的机动步兵到外星球和“虫族”打仗。片中有一场外星球上的激烈战斗，荒凉起伏的灰白色岩丘就是在恶地拍的。",
    howToZh:
      "这种“外星战场”在 Badlands Loop Road 边的 Pinnacles 观景点、Yellow Mounds 一带最容易拍：观景台往下是一层层尖尖的岩丘。拍的人用长焦压缩远近的岩丘；阴天或傍晚光线低时颜色发灰，最像片里的外星荒原。",
    tipsZh: [
      "观景台外面的岩丘很松软，下雨后又滑又黏，别翻出去爬。",
      "夏天午后常有雷暴，空旷的观景台上看到闪电就回车里。",
    ],
    photoFile: "Pinnacles Overlook, Badlands National Park, Wall, SD.jpg",
    sources: [
      "https://www.eastman.org/starship-troopers",
      "https://strangehorizons.com/wordpress/non-fiction/articles/offworlding-without-leaving-earth-going-on-location-with-starship-troopers/",
    ],
    confidence: "medium",
    noteZh: "乔治·伊士曼博物馆的放映介绍写了外星球上的战斗在恶地国家公园拍；也有文章说外星球的镜头主要在怀俄明的 Hell's Half Acre 拍，可能两边都拍过。",
  },
  {
    id: "north-by-northwest-wica",
    titleZh: "西北偏北",
    titleEn: "North by Northwest",
    year: 1959,
    kind: "film",
    creditsZh: "阿尔弗雷德·希区柯克 / 加里·格兰特",
    park: "wica",
    attraction: "wica-mount-rushmore",
    placeZh: "拉什莫尔山国家纪念地的观景平台和停车场（当年拍戏的餐厅和游客中心 1994 年拆了）",
    sceneZh:
      "广告人罗杰被误认成间谍，一路被追到南达科他。在拉什莫尔山，他和伊芙在观景餐厅里见面，窗外就是四位总统的巨像，这里发生的一场意外让剧情急转。剧组在餐厅、停车场和几处观景平台拍了两天；片尾在头像上攀爬追逐那段是在摄影棚里搭的假山上拍的，NPS 当年不允许在雕像上拍暴力戏。",
    howToZh:
      "从停车场穿过旗帜大道（Avenue of Flags）走到 Grand View Terrace 观景平台，正对四位总统头像。拍的人站在平台后方，被拍的人站在护栏前、侧身回头，把人和头像一起收进来。头像朝东南，上午顺光最清楚，傍晚头像背光。",
    tipsZh: [
      "纪念地不收门票，但停车要另付停车费，国家公园年卡不能抵。",
      "Presidential Trail 能走到离头像近一些的地方，只能走步道，不能往山上爬。",
      "片中的餐厅已经不在了，现在的餐厅是后来新建的，位置也不一样。",
    ],
    photoFile: "Mount Rushmore from Grand View Terrace.jpg",
    sources: [
      "https://www.pbs.org/wgbh/americanexperience/features/rushmore-north-northwest",
      "https://text-message.blogs.archives.gov/2014/04/22/north-by-northwest",
      "https://hitchcock.zone/wiki/Hitchcock_Chronology:_Mount_Rushmore,_South_Dakota",
    ],
    confidence: "high",
  },
  {
    id: "lost-world-fern-canyon",
    titleZh: "侏罗纪公园 2：失落的世界",
    titleEn: "The Lost World: Jurassic Park",
    year: 1997,
    kind: "film",
    creditsZh: "史蒂文·斯皮尔伯格 / 杰夫·高布伦",
    park: "redw",
    attraction: "redw-fern-canyon",
    placeZh: "草原溪红杉州立公园（Prairie Creek Redwoods）的蕨类峡谷，属红木国家和州立公园",
    sceneZh:
      "猎人队里有人掉队，独自走进一条两侧长满蕨类的窄峡谷，一群小型恐龙从溪边围上来。画面里是十几米高、整面垂着蕨类的岩壁和浅浅的溪床。",
    howToZh:
      "开 Davison Road（约 8 英里单车道土路）到尽头的 Fern Canyon 停车场，走几分钟进峡谷口。往里走 100–200 米、两侧岩壁最高最窄的地方，拍的人站在溪床下游往上游拍，让被拍的人走在溪水中间、两边全是蕨类。阴天或上午光线柔，岩壁不会一半亮一半暗。",
    tipsZh: [
      "5 月 15 日到 9 月 15 日开车进 Davison Road 要提前在网上预约，免费；走路进来不用预约。",
      "要在溪水里走、翻倒木，穿能湿水的鞋；路上要涉水过两条小溪，底盘低的车容易卡住。",
      "蕨类和苔藓很娇气，别扯、别爬岩壁。",
    ],
    photoFile: "Fern canyon 7x10.jpg",
    sources: [
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
      "https://www.visitredwoods.com/listing/visit-a-canyon-where-dinosaurs-roam/625/",
      "https://abc10.com/article/entertainment/television/programs/backroads/explore-the-lost-world-of-jurassic-park-on-a-hike-through-fern-canyon/103-4efad5b4-cd8a-407f-91a2-5174b43c9ebc",
    ],
    confidence: "high",
  },
  {
    id: "star-trek-5-yose",
    titleZh: "星际迷航 5：终极先锋",
    titleEn: "Star Trek V: The Final Frontier",
    year: 1989,
    kind: "film",
    creditsZh: "威廉·夏特纳 / 伦纳德·尼莫伊",
    park: "yose",
    attraction: "yose-el-capitan",
    placeZh: "优胜美地山谷的酋长岩",
    sceneZh:
      "开场柯克舰长休假，在酋长岩上徒手攀岩，斯波克穿着火箭靴飘到他身边聊天。远景是真的酋长岩，柯克的近景是在搭出来的假岩壁上拍的。",
    howToZh:
      "在 Northside Drive 边的酋长岩草甸（El Capitan Meadow）停车，从草甸抬头看整面岩壁。拍的人用长焦对准岩壁中段，常能拍到挂在壁上的攀岩者，最有片中“人在巨壁上”的感觉；傍晚太阳偏西，岩壁被照成橙色。",
    tipsZh: [
      "带望远镜找岩壁上的攀岩者和过夜吊帐；沿草甸边的现成小路走，别踩进湿草甸。",
      "不要去岩壁脚下的乱石坡“摆攀岩姿势”，上面常有落石。",
    ],
    photoFile: "Yosemite Valley - El Capitan from the medows - 1.jpg",
    sources: [
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
      "https://reactormag.com/someone-has-completed-the-climb-captain-kirk-attempted-at-the-opening-of-star-trek-v/",
    ],
    confidence: "high",
  },
  {
    id: "free-solo-yose",
    titleZh: "徒手攀岩",
    titleEn: "Free Solo",
    year: 2018,
    kind: "film",
    creditsZh: "金国威、伊丽莎白·柴·瓦沙瑞莉 / 亚历克斯·霍诺尔德",
    park: "yose",
    attraction: "yose-el-capitan",
    placeZh: "优胜美地山谷的酋长岩西南面",
    sceneZh:
      "华裔攀岩摄影师金国威和妻子执导的纪录片，拿了奥斯卡最佳纪录长片：霍诺尔德 2017 年 6 月不带绳子、不带保护，沿 Freerider 路线爬上约 900 米高的酋长岩。镜头里是人贴在巨大花岗岩壁上的画面。",
    howToZh:
      "在酋长岩草甸往北看，Freerider 这条线在岩壁西南面（偏左的一侧）。拍的人用长焦，从草甸或 Northside Drive 边的停车处对准岩壁，等攀岩者进画面；想拍整面岩壁和山谷，就去隧道观景点或山谷景观点（Valley View）。上午岩壁背光偏冷色，傍晚被照成橙色。",
    tipsZh: [
      "片中是顶尖攀岩者准备多年后的极限挑战，别去岩壁脚下尝试任何攀爬；想体验可以报优胜美地攀岩学校的入门课。",
      "春夏常能看到挂在岩壁上的攀岩队伍，带望远镜。",
    ],
    photoFile: "El Capitan 4.jpg",
    sources: [
      "https://films.nationalgeographic.com/free-solo",
      "https://www.goodmorningamerica.com/news/story/film-chronicles-climbers-solo-journey-up-yosemite-s-el-capitan-with-no-gear-58101842",
    ],
    confidence: "high",
  },
  {
    id: "rocky-4-mormon-row",
    titleZh: "洛奇 4",
    titleEn: "Rocky IV",
    year: 1985,
    kind: "film",
    creditsZh: "西尔维斯特·史泰龙",
    park: "grte",
    attraction: "grte-mormon-row",
    placeZh: "大提顿国家公园摩门街（Mormon Row）北边的 Antelope Flats 草原",
    sceneZh:
      "洛奇去“苏联西伯利亚”备战：在齐膝深的雪里跑步、劈柴、拉雪橇，背后是一排雪山。那个西伯利亚小村其实是搭在摩门街北边的布景，雪山是提顿群峰。",
    howToZh:
      "夏秋开 Antelope Flats Road 到摩门街，往北走一段，找前景没有谷仓、只有草原和提顿群峰的角度。拍的人退远用长焦，让人在雪地或草地里跑向镜头、背后是群峰；日出时群峰先被照亮，冬天雪后最像片中。",
    tipsZh: [
      "积雪后（大约 12 月到次年 3 月）Antelope Flats Road 不扫雪，车开不进来，只能停在 191 号公路边，步行、滑雪或穿雪鞋约 3 公里进去。",
      "野牛就在路边时也要保持 25 码（约 23 米）以上；冬天这里常是零下二十几度，片场当年冻坏过器材，手机电池也要保暖。",
      "布景拍完就拆了，现在只剩草原。",
    ],
    photoFile: "Snow at Moulton Barn (29312222586).jpg",
    sources: [
      "https://cowboystatedaily.com/2024/12/14/rockys-siberian-training-site-in-rocky-iv-was-really-in-wyoming",
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
    ],
    confidence: "medium",
    noteZh: "白宫 2015 年的文章写了大提顿是片中的“俄罗斯雪原”；布景搭在摩门街北边，只有怀俄明的 Cowboy State Daily 一家写明，具体位置没有公开。",
  },
  {
    id: "rocky-4-cody-peak",
    titleZh: "洛奇 4",
    titleEn: "Rocky IV",
    year: 1985,
    kind: "film",
    creditsZh: "西尔维斯特·史泰龙",
    park: "grte",
    attraction: "grte-aerial-tram",
    placeZh: "杰克逊霍尔滑雪场的 Cody Peak（国家森林里，归 Jackson Hole Mountain Resort 和 Bridger-Teton 国家森林管，不在大提顿国家公园里），坐空中缆车上山能看到",
    sceneZh: "训练的最后，洛奇一路爬上雪山山顶，张开双臂冲着群山大喊对手的名字。",
    howToZh:
      "从 Teton Village 坐空中缆车到 Rendezvous 山顶，在山顶观景平台往南看，旁边的尖峰就是 Cody Peak。山顶平台上就能拍同款：人站在平台护栏里侧、张开双臂对着远山，拍的人蹲低往上拍，把天空和远处的山脊收进来。上午天气最稳定，下午常起云。",
    tipsZh: [
      "缆车 2026 年夏季 5 月 16 日到 10 月 4 日运营，要买票；10 月初到 12 月初、4 月到 5 月中旬停运。",
      "不要自己往 Cody Peak 走：那一带是滑雪场边界外的陡坡，冬天有雪崩风险，夏天碎石很滑。",
      "山顶海拔 3,185 米，比山下冷得多、风大，夏天也带外套。",
    ],
    photoFile: "Hikers, Rendezvous Mountain near top of Aerial Tram, Cody Peak behind (fd8b56d3-155d-451f-67da-856659886920).JPG",
    sources: ["https://cowboystatedaily.com/2024/12/14/rockys-siberian-training-site-in-rocky-iv-was-really-in-wyoming"],
    confidence: "medium",
    noteZh: "山顶这场在 Cody Peak 拍，只有 Cowboy State Daily 一家写明（采访了当年的剧组人员）；部分近景在缆车山顶站附近拍。",
  },
  {
    id: "shane-grte",
    titleZh: "原野奇侠",
    titleEn: "Shane",
    year: 1953,
    kind: "film",
    creditsZh: "乔治·史蒂文斯 / 艾伦·拉德",
    park: "grte",
    placeZh: "大提顿国家公园东南部 Kelly 一带的 Antelope Flats 草原和 Kelly Warm Springs，摩门街往东南约 5 公里",
    sceneZh:
      "孤独的枪手沙恩骑马走进山谷、来到拓荒者斯塔雷特一家的农场。片中的小镇和农场都背靠提顿群峰，镜头里群峰几乎一直在背景里。",
    howToZh:
      "开 Antelope Flats Road 往东到 Kelly 方向，路边草原上往西看，提顿群峰正好横在地平线上。拍的人退远用长焦，让人（或骑马的人）走在草原中间、背后是群峰；清晨太阳从背后照亮群峰，最像片中的画面。",
    tipsZh: [
      "布景早已拆掉，片中的小镇只有一座马具店保存下来，在杰克逊霍尔历史协会展出。",
      "Antelope Flats Road 冬天不扫雪，12 月到次年 3 月车开不进来；草原上常有野牛和叉角羚，保持距离。",
    ],
    photoFile: "Teton Range from the Kelly Parcel (54236442110).jpg",
    sources: [
      "https://www.nps.gov/home/learn/news/final-movie-of-homestead-centennial-film-festival-shane.htm",
      "https://americancowboy.com/?p=2783",
    ],
    confidence: "medium",
    noteZh: "NPS 写了这部片在大提顿国家公园拍；小镇布景在 Antelope Flats、农场在 Kelly Warm Springs，只有《American Cowboy》杂志一家写明。",
  },
  {
    id: "planet-of-the-apes-alstrom-point",
    titleZh: "人猿星球",
    titleEn: "Planet of the Apes",
    year: 1968,
    kind: "film",
    creditsZh: "富兰克林·沙夫纳 / 查尔顿·赫斯顿",
    park: "hsbd",
    placeZh: "鲍威尔湖犹他一侧的 Alstrom Point，属格伦峡谷国家休闲区（NPS），对面是 Gunsight Butte",
    sceneZh:
      "宇航员的飞船坠进一片陌生的湖里，几个人坐着橡皮艇逃出来，划向岸边寸草不生的砂岩荒地。背景是湖面和对面方顶的孤峰 Gunsight Butte。",
    howToZh:
      "从佩吉往西开 89 号公路到 Big Water，转进 Smoky Mountain Road 等土路，开约 40 公里到 Alstrom Point 崖顶。站在崖顶往东南看，下面是鲍威尔湖的 Padre Bay，对面就是 Gunsight Butte。日出时孤峰和湖面一起被照亮；不想开这么远，坐 Wahweap 的游船也能从湖面上看到这一带。",
    tipsZh: [
      "最后几公里是岩石路，要高底盘四驱，雨后土路泥泞开不了；手机没信号，带足水和油。",
      "崖顶没有护栏，离边缘留够距离，别为了构图往前挪。",
      "这里在格伦峡谷国家休闲区里，要买休闲区门票（国家公园年卡可用）。",
    ],
    photoFile: "Alstrom Point vista.jpg",
    sources: [
      "https://www.sltrib.com/artsliving/2022/08/29/lake-powell-movies-supporting/",
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
    ],
    confidence: "medium",
    noteZh: "片中荒漠戏在鲍威尔湖、格伦峡谷一带拍是确定的；坠湖这场具体在 Alstrom Point，只有《盐湖论坛报》一家写明，剧本里原定的是 Lone Rock。",
  },
  {
    id: "doctor-who-lone-rock",
    titleZh: "神秘博士",
    titleEn: "Doctor Who",
    year: 2011,
    kind: "tv",
    creditsZh: "马特·史密斯",
    park: "hsbd",
    placeZh: "鲍威尔湖犹他一侧的 Lone Rock Beach，属格伦峡谷国家休闲区（NPS），在佩吉西北约 15 分钟",
    sceneZh:
      "第六季第一集《不可能的宇航员》开篇：博士和同伴们在一片湖边野餐重聚，湖中央立着一块孤零零的大岩石。剧中把这里叫作“寂静湖”（Lake Silencio）。",
    howToZh:
      "从 89 号公路转进 Lone Rock Road 开到湖边沙滩，湖中央那块孤岩就是剧中的背景。拍的人站在沙滩上，让孤岩在画面中间偏一侧，人坐在前景的沙滩上；傍晚太阳在背后，孤岩和对岸砂岩被照成橙红色。",
    tipsZh: [
      "沙滩可以开车下去，但沙很软，普通轿车停在硬地上走过去，别开进软沙里。",
      "要买格伦峡谷国家休闲区门票（国家公园年卡可用）；旺季周末露营车很多。",
      "湖水位每年变化大，孤岩露出水面的高度和离岸距离会不一样。",
    ],
    photoFile: "Lone rock - panoramio (1).jpg",
    sources: [
      "https://www.sltrib.com/artsliving/2022/08/29/lake-powell-movies-supporting/",
      "https://obamawhitehouse.archives.gov/realitycheck/blog/2015/04/20/forrest-gump-star-wars-10-national-parks-and-forests-who-played-role-your-favorite-m",
    ],
    confidence: "high",
  },
  {
    id: "john-carter-lake-powell",
    titleZh: "异星战场",
    titleEn: "John Carter",
    year: 2012,
    kind: "film",
    creditsZh: "安德鲁·斯坦顿 / 泰勒·基奇",
    park: "hsbd",
    placeZh: "鲍威尔湖（格伦峡谷国家休闲区，NPS），具体是哪段湖湾没有公开",
    sceneZh:
      "南北战争老兵约翰·卡特被送到火星，片中的火星荒漠大多在犹他南部拍。其中一段：卡特和火星公主德嘉·索丽丝从悬停的飞船上跳进河里，再划着小船在红色峡谷之间的水道里往前走。",
    howToZh:
      "鲍威尔湖有很多两侧是红色砂岩壁的窄湖湾，最像片中的水道。从 Antelope Point 坡道划皮划艇进羚羊峡谷的水上部分，或者从 Wahweap 码头坐游船、租船进支湾，拍的人在后面一条船上，用中焦拍前面的船划进峡谷。上午水面平，岩壁倒影最清楚。",
    tipsZh: [
      "湖水凉、午后常起风浪，划皮划艇穿救生衣，跟着有执照的向导去更稳妥。",
      "要买格伦峡谷国家休闲区门票（国家公园年卡可用）；水位每年变化大，有的支湾低水位时进不去。",
    ],
    photoFile: "Glen Canyon National Recreation Area - Lake Powell - Reflection Canyon.jpg",
    sources: ["https://www.sltrib.com/artsliving/2022/08/29/lake-powell-movies-supporting/"],
    confidence: "medium",
    noteZh: "《盐湖论坛报》写了这段在鲍威尔湖拍，没写具体在哪段湖湾；照片是鲍威尔湖的 Reflection Canyon，只是同类的景色。",
  },
  {
    id: "point-break-lake-powell",
    titleZh: "惊爆点",
    titleEn: "Point Break",
    year: 1991,
    kind: "film",
    creditsZh: "凯瑟琳·毕格罗 / 基努·里维斯、帕特里克·斯威兹",
    park: "hsbd",
    placeZh: "鲍威尔湖上空（格伦峡谷国家休闲区，NPS），具体在哪段湖面没有公开",
    sceneZh:
      "FBI 探员约翰尼混进冲浪抢劫团伙以后，跟着团伙老大博迪去跳伞：几个人从飞机上跳下来，在空中手拉手围成一圈，下面是蓝色的湖水和红色砂岩。",
    howToZh:
      "地面上最接近的视角是佩吉旁边的 Wahweap 观景点：站在高处往下看，湖湾和砂岩岛一起铺开。想看片中那样的俯瞰，可以坐佩吉机场出发的观光飞机，航线和价格以运营方为准。中午光线硬，上午或傍晚湖水颜色更好。",
    tipsZh: [
      "NPS 管的地方一般不能飞无人机，起飞前查格伦峡谷的最新规定。",
      "观景点一带的崖边别靠太近，想体验跳伞找有执照的跳伞场。",
    ],
    photoFile: "Over Lake Powell - 3806170417.jpg",
    sources: ["https://www.sltrib.com/artsliving/2022/08/29/lake-powell-movies-supporting/"],
    confidence: "medium",
    noteZh: "《盐湖论坛报》写了跳伞这场在鲍威尔湖上空拍，没写具体位置。",
  },
  {
    id: "maverick-lake-powell",
    titleZh: "赌侠马华力",
    titleEn: "Maverick",
    year: 1994,
    kind: "film",
    creditsZh: "理查德·唐纳 / 梅尔·吉布森、朱迪·福斯特",
    park: "hsbd",
    placeZh: "鲍威尔湖西头、犹他一侧 Big Water 附近的湖岸（格伦峡谷国家休闲区，NPS），剧组在这里搭了一座“河边”小镇的布景",
    sceneZh:
      "梅尔·吉布森演一个油嘴滑舌的赌徒，一路凑钱去参加扑克大赛。电影前半段那座河边的西部小镇，其实是搭在鲍威尔湖岸边的布景，湖水在片里当成了河。",
    howToZh:
      "布景早就拆了。Big Water 在佩吉西北约 20 分钟，附近的 Lone Rock Beach 和 Wahweap 一带都是红色台地夹着湖水的景色。在 Wahweap 观景点往下看湖湾，或者到 Lone Rock Beach 的湖边，用中焦把湖面和对岸的砂岩崖拍成“河岸”；傍晚太阳在背后，对岸的崖壁最红。",
    tipsZh: [
      "梅尔·吉布森当年说每天坐船过湖去片场；现在想去对岸要租船或跟游船。",
      "要买格伦峡谷国家休闲区门票（国家公园年卡可用）。",
      "片中还有几场在优胜美地的 Washburn Point 和 Leidig 草甸拍，具体是哪几场没查到。",
    ],
    photoFile: "Lake Powell from Wahweap Overlook, Page, Arizona - April 2026.jpg",
    sources: [
      "https://www.deseret.com/1994/6/3/19112512/on-location-utah/",
      "https://www.sltrib.com/artsliving/2022/08/29/lake-powell-movies-supporting/",
      "https://www.yosemitethisyear.com/articles/films-shot-in-yosemite-and-madera-county",
    ],
    confidence: "medium",
    noteZh: "《德瑟雷特新闻》写了片子前半段的河边小镇在鲍威尔湖犹他一侧拍，《盐湖论坛报》写了在 Big Water 附近；布景的具体位置没有公开。",
  },
  {
    id: "into-the-wild-lees-ferry",
    titleZh: "荒野生存",
    titleEn: "Into the Wild",
    year: 2007,
    kind: "film",
    creditsZh: "西恩·潘 / 埃米尔·赫斯基",
    park: "hsbd",
    placeZh: "格伦峡谷国家休闲区的 Lees Ferry（NPS），大峡谷河段漂流的起点，佩吉西南约 1 小时车程",
    sceneZh:
      "大学毕业生克里斯烧掉钱、给自己改名“超级流浪者”，一路搭车流浪。途中他买了一条皮划艇，想顺着科罗拉多河漂下大峡谷，却被告知要排很多年的队才能拿到许可。",
    howToZh:
      "从佩吉沿 89 号、89A 号公路往西南开，过了 Navajo Bridge 转进 Lees Ferry Road 开到河边。在码头和下游的河滩上，背后是红色的 Vermilion 悬崖，拍的人站在岸上用中焦，让被拍的人拿着桨站在河边、看向下游的峡谷口；下午悬崖顺光最红。",
    tipsZh: [
      "这里的河水是从大坝底下放出来的，常年只有 8–10°C，水流也急，别下水游泳；坐船划船都穿救生衣。",
      "想真去大峡谷漂流，要提前很久抽签拿许可，或者报商业漂流团；从大坝脚下漂到这里的一日平水漂流不用许可，跟团就行。",
      "Lees Ferry 在格伦峡谷国家休闲区里，要买休闲区门票（国家公园年卡可用）。",
    ],
    photoFile: "Fly Fisher On The Colorado River At Lee's Ferry, AZ.jpg",
    sources: ["https://azdailysun.com/news/local/page-going-wild-over-penn-movie/article_db2e8fa3-6e63-5c02-ba35-40007fdb51dc.html"],
    confidence: "medium",
    noteZh: "亚利桑那当地报纸《Arizona Daily Sun》报道剧组在 Lees Ferry 和佩吉拍过，没写是哪场戏；上面写的是故事里和这一带有关的情节。",
  },
  {
    id: "shutter-island-otter-cliff",
    titleZh: "禁闭岛",
    titleEn: "Shutter Island",
    year: 2010,
    kind: "film",
    creditsZh: "马丁·斯科塞斯 / 莱昂纳多·迪卡普里奥",
    park: "acad",
    attraction: "acad-otter-cliff",
    placeZh: "阿卡迪亚 Park Loop Road 边的水獭崖",
    sceneZh:
      "故事设在麻省外海的一座精神病院孤岛上，岛边的海崖戏在这里拍：主角在湿滑的粉色花岗岩海崖上攀爬寻找线索，脚下是拍上来的海浪。",
    howToZh:
      "开 Park Loop Road 到水獭崖路边停车处，沿 Ocean Path 走到崖顶，往南回望整段崖壁和海浪。拍的人站在步道上，用中焦把崖壁和海面一起拍；阴天、起雾或大浪的天气最有片中阴郁的感觉；晴天日出时崖壁是粉色的。",
    tipsZh: [
      "崖边没有护栏，石头上有青苔和雾气时很滑，别下到崖壁上拍；崖壁上的攀岩者都系着绳子、跟着向导。",
      "Park Loop Road 这一段只能停在右侧车道，满了就往前开到 Otter Point 停车场。",
    ],
    photoFile: "Acadia National Park, Otter Cliff.jpg",
    sources: [
      "https://mainebiz.biz/article/lights-camera-acadia-maine-cliff-entices-hollywood-producers/",
      "https://visitmaine.com/de/articles/films-shot-in-maine/",
    ],
    confidence: "high",
  },
  {
    id: "river-of-no-return-bow-falls",
    titleZh: "大江东去",
    titleEn: "River of No Return",
    year: 1954,
    kind: "film",
    creditsZh: "奥托·普雷明格 / 玛丽莲·梦露、罗伯特·米彻姆",
    park: "banf",
    attraction: "banf-bow-falls",
    placeZh: "班夫镇边、费尔蒙班夫温泉酒店脚下的弓河瀑布",
    sceneZh:
      "梦露主演的西部片，一家人坐木筏顺着急流逃命，整部片大半时间在河上。片尾几场漂流戏在弓河拍，剧组把一只木筏从弓河瀑布上放了下去。",
    howToZh:
      "开到酒店这一侧的 Bow Falls 停车场，走几步到瀑布边的观景处。拍的人站在下游河岸上，用中焦把翻白的瀑布和两岸的松林、山坡一起收进来；想要城堡一样的酒店入画，绕到河对岸的惊喜角（Surprise Corner）。上午瀑布顺光，水花最亮。",
    tipsZh: [
      "瀑布下的水流很急、水温很低，别下到河边的湿石头上。",
      "从镇中心沿弓河边的步道走到瀑布约 20 分钟，夏天停车场常满。",
    ],
    photoFile: "Bow Falls Banff (AB) September 2019 (49581486441).jpg",
    sources: [
      "https://albertashistoricplaces.com/2016/09/07/hollywood-in-the-canadian-rockies/",
      "https://catalog.afi.com/Film/51330-RIVER-OF-NO-RETURN",
    ],
    confidence: "medium",
    noteZh: "片子在班夫、贾斯珀国家公园拍是确定的（AFI 记了片方资料）；弓河瀑布这场只有艾伯塔省历史遗产部门的博客一家写明。梦露拍片时在贾斯珀的玛琳河滑倒受伤，那一段没写进来。",
  },
  {
    id: "can-this-love-be-translated-lake-louise",
    titleZh: "爱情怎么翻译？",
    titleEn: "Can This Love Be Translated?",
    year: 2026,
    kind: "tv",
    creditsZh: "柳英恩 / 金宣虎、高允真",
    park: "banf",
    attraction: "banf-lake-louise",
    placeZh: "班夫国家公园的路易斯湖湖边，对面是维多利亚冰川，背后是费尔蒙城堡酒店",
    sceneZh:
      "Netflix 韩剧：会八种语言的翻译周浩镇，给因丧尸片爆红的女明星车茂熙当随行翻译，跟着她去日本、加拿大、意大利拍恋爱综艺。到了加拿大落基山，两人在湖边并肩散步、慢慢说出心里话；剧里一起看极光的戏也在湖边。",
    howToZh:
      "从停车场走到城堡酒店前的湖岸，再沿湖岸的平路往冰川方向走一段，人就少了。拍的人在湖岸上往冰川方向拍，两个人沿湖边并肩走、背对镜头。剧组是秋天拍的，9 月下旬到 10 月初湖水还绿、山顶已经有雪。想碰极光要看太阳活动预报，选晴朗、没月亮的晚上，离酒店的灯光远一点。",
    tipsZh: [
      "夏秋湖边停车场很早就满，停车要付费，也可以坐 Parks Canada 的班车。",
      "晚上湖边很冷，秋天也常在零度以下；看极光带厚衣服和头灯，走回停车场注意野生动物。",
      "班夫一带纬度不算高，强极光时才看得清，能不能碰上全看运气。",
    ],
    photoFile: "Lake Louise, Banff National Park, Canada.jpg",
    sources: [
      "https://www.koreatimes.co.kr/entertainment/shows-dramas/20260130/5-charming-filming-locations-from-netflixs-can-this-love-be-translated",
      "https://v.daum.net/v/Zj4wcrcnEz",
    ],
    confidence: "medium",
    noteZh: "《韩国时报》写了一起看极光的戏在路易斯湖拍；也有韩国网站说看极光那场在国家公园外的坎莫尔（Canmore），湖边散步那段才在路易斯湖。",
  },
  {
    id: "can-this-love-be-translated-banff-bridge",
    titleZh: "爱情怎么翻译？",
    titleEn: "Can This Love Be Translated?",
    year: 2026,
    kind: "tv",
    creditsZh: "柳英恩 / 金宣虎、高允真",
    park: "banf",
    attraction: "banf-banff-avenue",
    placeZh: "班夫镇中央公园（Central Park）旁、弓河上的红色步行桥",
    sceneZh:
      "第 5 集，两人在班夫镇逛街、喝咖啡，走到弓河上的步行桥上玩起“翻译游戏”。这座桥现在常有韩剧粉丝排队拍照。",
    howToZh:
      "从 Banff Avenue 往南走到弓河边，往西拐进中央公园，步行桥就在公园旁边。拍的人站在河岸上，用中焦把整座桥和后面的 Cascade 山一起拍；想拍桥上的人，就站在桥头往桥中间拍。早上人少，傍晚桥身被斜光照亮。",
    tipsZh: [
      "桥上走人也走自行车，拍照时靠边站，别挡路。",
      "镇中心停车紧张，住在镇上走过去最方便，也可以坐 Roam 公交。",
    ],
    photoFile: "Banff Alberta New footbridge (9942689494).jpg",
    sources: [
      "https://dailyhive.com/edmonton/netflix-can-this-love-be-translated-alberta-calgary",
      "https://v.daum.net/v/Zj4wcrcnEz",
    ],
    confidence: "medium",
    noteZh: "《Daily Hive》写了第 5 集在班夫中央公园的步行桥拍；桥上玩翻译游戏的情节来自韩国网站的整理。",
  },
  {
    id: "transformers-whsa",
    titleZh: "变形金刚",
    titleEn: "Transformers",
    year: 2007,
    kind: "film",
    creditsZh: "迈克尔·贝",
    park: "whsa",
    attraction: "whsa-dunes-drive",
    placeZh: "白沙国家公园和相邻的白沙导弹靶场",
    sceneZh: "片中“中东沙漠”里美军小队被机器人追击的段落，在白沙一带纯白的石膏沙丘里拍，画面是一望无际的白色沙丘和蓝天。",
    howToZh:
      "开沙丘大道到最里面 Heart of the Sands 一带的停车处，往沙丘里走几分钟，找没有脚印的沙脊。拍的人蹲低用广角，让人从沙丘顶上往下冲向镜头；下午四五点斜光下沙纹最清楚，正午白沙反光太强、画面发灰。",
    tipsZh: [
      "导弹试验时沙丘大道会封闭最多 3 小时，出发前一天查 NPS 的 Park Closures 页面。",
      "夏天沙面反光很晒，戴墨镜、带足水；进沙丘记好回停车处的方向，白沙里很容易迷路。",
    ],
    photoFile: "White Sands National Park, New Mexico, USA8.jpg",
    sources: ["https://www.nps.gov/whsa/learn/historyculture/commercial-filming.htm", "https://www.nps.gov/whsa/learn/historyculture/stories.htm"],
    confidence: "medium",
    noteZh: "NPS 白沙的拍摄历史页面把《变形金刚》两部都列为在白沙拍的片子，但没写哪些镜头在国家公园里；第二部的沙漠大战明确是在旁边的导弹靶场拍的（游客进不去），所以没收第二部。",
  },
  {
    id: "man-who-fell-to-earth-whsa",
    titleZh: "天外来客",
    titleEn: "The Man Who Fell to Earth",
    year: 1976,
    kind: "film",
    creditsZh: "尼古拉斯·罗格 / 大卫·鲍伊",
    park: "whsa",
    placeZh: "白沙国家公园的石膏沙丘（当年还叫白沙国家纪念地，具体在哪片沙丘没有公开）",
    sceneZh:
      "大卫·鲍伊演一个从缺水星球来到地球的外星人。片中闪回他家乡星球的段落，一家人走在一望无际、白得发亮的荒漠里，那片荒漠就是用白沙拍的。",
    howToZh:
      "开沙丘大道到最里面 Heart of the Sands 一带，往没有植物的大沙丘里走几分钟。拍的人站在沙脊上，让被拍的人穿深色衣服、走在纯白的沙谷里，人放小；日落前后沙丘发蓝发粉，最像片里那种不属于地球的颜色。",
    tipsZh: [
      "导弹试验时沙丘大道会封闭最多 3 小时，出发前一天查 NPS 的 Park Closures 页面。",
      "夏天沙面反光很晒，带足水；进沙丘记好回停车处的方向，白沙里很容易迷路。",
    ],
    photoFile: "2026 White Sands National Park Dunes Clouds and Sun.jpg",
    sources: ["https://www.nps.gov/whsa/learn/historyculture/commercial-filming.htm", "https://en.wikipedia.org/wiki/The_Man_Who_Fell_to_Earth"],
    confidence: "medium",
    noteZh: "NPS 白沙的拍摄历史页面列了这部片；用白沙拍外星人家乡的说法来自影评，具体是哪几个镜头没有公开。",
  },
  {
    id: "wild-crater-lake",
    titleZh: "走出荒野",
    titleEn: "Wild",
    year: 2014,
    kind: "film",
    creditsZh: "让-马克·瓦雷 / 瑞茜·威瑟斯彭",
    park: "crla",
    placeZh: "火山口湖环湖公路（Rim Drive）北侧、北入口路交汇处附近，往北能看到浮石沙漠（Pumice Desert）",
    sceneZh:
      "雪儿背着巨大的登山包独自走太平洋山脊步道，走到火山口湖边停下来，望着远处的浮石荒原，坐在树下换衣服、整理背包，然后继续往坡下走。",
    howToZh:
      "从北入口路进园，到和环湖公路交汇的 North Junction 一带，找路边的观景停车处。被拍的人背着大包站在路边树旁、看向北边空旷的浮石沙漠，拍的人在侧后方用中焦拍背影；想要湖景，就近到 Merriam Point，或往南几分钟到守望者峰观景台。下午光线从西边来，比较柔。",
    tipsZh: [
      "北入口路和环湖公路西段冬天封闭，通常 7 月前后才开，以 NPS 路况为准。",
      "环湖公路弯多、路肩窄，只在观景停车处停车拍。",
      "太平洋山脊步道在这一段穿过公园，想走一小段可以从北入口路边的步道口进去。",
    ],
    photoFile: "Mount Thielsen from the Pumice Desert, Crater Lake National Park.jpg",
    sources: ["https://www.heraldandnews.com/news/local_news/wild-filming-at-crater-lake/article_c592bffc-3c6a-11e3-bf87-001a4bcf887a.html"],
    confidence: "medium",
    noteZh: "只有克拉马斯福尔斯当地报纸《Herald and News》一家现场报道写明，在环湖公路北侧拍、望向浮石沙漠；具体停车处是推断的。",
  },
];
