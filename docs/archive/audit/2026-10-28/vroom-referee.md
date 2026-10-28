# VROOM 当裁判：分天这一步还能少开多少车（2026-10-27）

103 条两天以上的行程（和行程质量评测同一组请求），景点、每晚住处不变，让 VROOM 重新分天、排顺序。

| 指标 | 结果 |
|---|---|
| VROOM 解出来的 | 103 / 103 |
| VROOM 全排上、按我们的规则也不多出“去不了、赶不上”的 | 69 条 |
| 这些行程一共开车：引擎 / VROOM | 52188 / 51396 分钟（VROOM 少 1.5%） |
| VROOM 能少开 30 分钟以上的行程 | 21 条（VROOM 反而多开的 5 条：它是启发式算法，不保证最优） |
| 其中最累的一天也不比引擎长的 | 36 条：引擎 / VROOM 28189 / 28336 分钟，少开 30 分钟以上的 4 条 |
| VROOM 有景点没排上（时间窗、一天的时长放不下） | 1 条 |
| VROOM 的排法按我们的规则多出“去不了、赶不上、太满” | 33 条（停车场、末班车这些 VROOM 不懂） |

## VROOM 少开车最多的几条（最累的一天不比引擎长、也不多出“去不了、赶不上”的）

- **ever**：少开 151 分钟（972 → 821；最累的一天 595 → 597 分钟），挪了 4 个景点：万岛群游船、Kirby Storter 木栈道（大柏树）、Ernest F. Coe 游客中心、Robert Is Here 水果摊
  - 第 1 天 引擎：Shark Valley 电车导览与观景塔 → 万岛群游船 → Kirby Storter 木栈道（大柏树）；VROOM：Ernest F. Coe 游客中心 → Robert Is Here 水果摊 → Shark Valley 电车导览与观景塔
  - 第 2 天 引擎：Clyde Butcher 大柏树画廊 → Marjory Stoneman Douglas 游客中心（Gulf Coast） → Smallwood 老商店博物馆 → Tamiami Trail 风扇船 → Ernest F. Coe 游客中心 → Robert Is Here 水果摊；VROOM：Tamiami Trail 风扇船 → Kirby Storter 木栈道（大柏树） → Marjory Stoneman Douglas 游客中心（Gulf Coast） → 万岛群游船 → Smallwood 老商店博物馆 → Clyde Butcher 大柏树画廊
  - 第 3 天 引擎：Pa-hay-okee 观景台 → 桃花心木林步道 → Flamingo 码头与游客中心 → Flamingo 游船（红树林水道 / 佛罗里达湾） → 西湖红树林木栈道 → 蛇鸟步道；VROOM：Pa-hay-okee 观景台 → 桃花心木林步道 → Flamingo 游船（红树林水道 / 佛罗里达湾） → Flamingo 码头与游客中心 → 西湖红树林木栈道 → 蛇鸟步道
- **chir**：少开 60 分钟（533 → 473；最累的一天 423 → 423 分钟），挪了 1 个景点：Fort Bowie 国家历史遗址
  - 第 1 天 引擎：Bonita Creek 小环线和野餐区；VROOM：Bonita Creek 小环线和野餐区 → Fort Bowie 国家历史遗址
  - 第 2 天 引擎：Fort Bowie 国家历史遗址；VROOM：（空）
  - 第 3 天 引擎：Faraway Ranch 历史农庄 → Massai Point 观景台和自然步道 → Bonita Canyon Drive 观景路 → 奇里卡瓦游客中心；VROOM：Faraway Ranch 历史农庄 → Massai Point 观景台和自然步道 → 奇里卡瓦游客中心 → Bonita Canyon Drive 观景路
- **gumo**：少开 53 分钟（642 → 589；最累的一天 411 → 411 分钟），挪了 4 个景点：McKittrick 峡谷 · Pratt 小屋、McKittrick 峡谷游客站和自然步道、Smith Spring 环线、Frijole 牧场
  - 第 1 天 引擎：Pinery 驿站遗址步道 → Pine Springs 游客中心；VROOM：Pine Springs 游客中心 → Pinery 驿站遗址步道 → Frijole 牧场 → Smith Spring 环线
  - 第 2 天 引擎：McKittrick 峡谷 · Pratt 小屋 → McKittrick 峡谷游客站和自然步道；VROOM：（空）
  - 第 3 天 引擎：Smith Spring 环线 → Frijole 牧场 → El Capitan 观景点（62/180 号公路）；VROOM：McKittrick 峡谷游客站和自然步道 → McKittrick 峡谷 · Pratt 小屋 → El Capitan 观景点（62/180 号公路）
  - 第 4 天 引擎：Salt Basin 石膏沙丘；VROOM：Salt Basin 石膏沙丘
- **grsm+shen**：少开 32 分钟（1247 → 1215；最累的一天 774 → 668 分钟），挪了 5 个景点：Alum Cave 步道、Mingus 磨坊、Mary's Rock、Dark Hollow 瀑布、Bearfence 攀岩环线
  - 第 1 天 引擎：Alum Cave 步道 → Kuwohi 观景塔（原 Clingmans Dome）；VROOM：Kuwohi 观景塔（原 Clingmans Dome） → Mingus 磨坊
  - 第 2 天 引擎：Mingus 磨坊 → Elkmont 历史区（Daisy Town） → Cades Cove 环路；VROOM：Alum Cave 步道 → Elkmont 历史区（Daisy Town） → Cades Cove 环路
  - 第 3 天 引擎：Blackrock 山顶 → Mary's Rock → Stony Man；VROOM：Blackrock 山顶 → Bearfence 攀岩环线 → Stony Man
  - 第 4 天 引擎：Hawksbill 山顶 → Rapidan 营地（胡佛总统夏季营地）导览 → Dark Hollow 瀑布 → Big Meadows 草甸；VROOM：Hawksbill 山顶 → Rapidan 营地（胡佛总统夏季营地）导览 → Big Meadows 草甸
  - 第 5 天 引擎：Bearfence 攀岩环线；VROOM：Dark Hollow 瀑布 → Mary's Rock
- **zion**：少开 23 分钟（695 → 672；最累的一天 410 → 397 分钟），挪了 4 个景点：锡安游客中心、河滨步道、翡翠池、族长庭院
  - 第 1 天 引擎：锡安游客中心 → 河滨步道；VROOM：族长庭院 → 翡翠池
  - 第 2 天 引擎：翡翠池 → 族长庭院 → 峡谷交汇桥 → 帕鲁斯步道；VROOM：河滨步道 → 峡谷交汇桥 → 锡安游客中心 → 帕鲁斯步道
  - 第 3 天 引擎：科罗布峡谷；VROOM：科罗布峡谷
- **meve**：少开 22 分钟（457 → 435；最累的一天 390 → 344 分钟），挪了 3 个景点：云杉树屋（观景台）、半地穴屋与台地村落、帕克点火警瞭望台
  - 第 1 天 引擎：云杉树屋（观景台） → 太阳点观景台 → 方塔屋（观景台） → 太阳神庙 · 悬崖宫殿远眺；VROOM：帕克点火警瞭望台 → 半地穴屋与台地村落 → 方塔屋（观景台） → 太阳点观景台 → 太阳神庙 · 悬崖宫殿远眺
  - 第 2 天 引擎：阳台屋（护林员导览） → 苏打峡谷观景步道 → 半地穴屋与台地村落 → 帕克点火警瞭望台；VROOM：云杉树屋（观景台） → 阳台屋（护林员导览） → 苏打峡谷观景步道
- **grca+zion**：少开 19 分钟（1189 → 1170；最累的一天 507 → 507 分钟），挪了 2 个景点：守望者步道、族长庭院
  - 第 1 天 引擎：守望者步道；VROOM：族长庭院
  - 第 2 天 引擎：河滨步道 → 族长庭院 → 峡谷交汇桥 → 帕鲁斯步道；VROOM：河滨步道 → 峡谷交汇桥 → 守望者步道 → 帕鲁斯步道
  - 第 3 天 引擎：峡谷观景步道 → 棋盘台地 → 沙漠观景塔 → 大观点；VROOM：峡谷观景步道 → 棋盘台地 → 沙漠观景塔 → 大观点
  - 第 4 天 引擎：马瑟点 → 南凯巴布步道 · Ooh Aah Point → 亚瓦派观景点 → 光明天使步道；VROOM：马瑟点 → 亚瓦派观景点 → 光明天使步道 → 南凯巴布步道 · Ooh Aah Point
  - 第 5 天 引擎：隐士休息站 → 霍皮点；VROOM：霍皮点 → 隐士休息站
- **sagu**：少开 17 分钟（386 → 369；最累的一天 521 → 504 分钟），挪了 0 个景点：只换了顺序
  - 第 1 天 引擎：Gates Pass 观景台 → 红山游客中心（西区） → 沙漠探索步道 → 亚利桑那–索诺拉沙漠博物馆 → Signal Hill 岩画 → Bajada 环线景观道；VROOM：Gates Pass 观景台 → 亚利桑那–索诺拉沙漠博物馆 → 红山游客中心（西区） → 沙漠探索步道 → Bajada 环线景观道 → Signal Hill 岩画
  - 第 2 天 引擎：Javelina Rocks 观景点 → Tanque Verde 山脊步道（观景点） → Freeman 家园步道 → 林孔山游客中心（东区） → Cactus Forest 环线景观道；VROOM：Javelina Rocks 观景点 → Tanque Verde 山脊步道（观景点） → Freeman 家园步道 → 林孔山游客中心（东区） → Cactus Forest 环线景观道
- **noca**：少开 15 分钟（708 → 693；最累的一天 565 → 578 分钟），挪了 6 个景点：迪亚布洛湖观景台、罗斯湖观景点、雷丘步道、梯溪瀑布、峡谷溪瀑布、雪松步道
  - 第 1 天 引擎：迪亚布洛湖观景台 → 罗斯湖观景点 → 雨湖步道 → 华盛顿山口观景台；VROOM：雪松步道 → 雷丘步道 → 雨湖步道 → 华盛顿山口观景台
  - 第 2 天 引擎：雷丘步道 → 迪亚布洛湖步道；VROOM：罗斯湖观景点 → 迪亚布洛湖观景台 → 迪亚布洛湖步道 → 峡谷溪瀑布 → 梯溪瀑布
  - 第 3 天 引擎：梯溪瀑布 → 峡谷溪瀑布 → 雪松步道 → 北瀑布游客中心；VROOM：北瀑布游客中心
- **jeff**：少开 9 分钟（138 → 129；最累的一天 234 → 216 分钟），挪了 3 个景点：河滨步道和 Eads 大桥、老法院（Old Courthouse）、拱门下的博物馆
  - 第 1 天 引擎：河滨步道和 Eads 大桥 → 老法院（Old Courthouse） → 密西西比河游船；VROOM：拱门下的博物馆 → 密西西比河游船
  - 第 2 天 引擎：拱门下的博物馆 → 拱门草地和倒影池；VROOM：老法院（Old Courthouse） → 拱门草地和倒影池 → 河滨步道和 Eads 大桥
