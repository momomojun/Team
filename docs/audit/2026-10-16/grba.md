# grba 核对记录（2026-10-16）

- grba-mountain-view-trail：宠物（园内步道一律不许带宠物 → 除了 Lexington 石拱步道和 Baker 镇到 Great Basin 游客中心的小路，园内步道都不许带宠物）。来源：https://www.nps.gov/grba/planyourvisit/pets.htm
- grba-lexington-arch：宠物（园内唯一能带狗的步道 → 园内仅有的两条能牵狗走的步道之一，另一条是 Baker 镇到 Great Basin 游客中心的小路），和上一条统一。来源：同上；https://www.nps.gov/thingstodo/hike-to-lexington-arch.htm
- grba-baker-creek：Baker Creek 路开放月份（一般 5 月到 10 月 → 5 月到 11 月），openMonths 加上 11 月。来源：https://www.nps.gov/grba/planyourvisit/auto-touring.htm（“generally open May through November, weather permitting”）

## 核对过、没问题的
Alpine Lakes Loop 2.7 英里 / 440 ft、和狐尾松步道连走 4.1 英里；Glacier 步道往返 4.8 英里；Wheeler Peak 8.6 英里 / 3,100 ft / 4–10 小时；Baker Creek Loop 3.3 英里 / 850 ft / 起点 8,020 ft；Lexington Arch 5.6 英里 / 1,220 ft、车停在原停车场前约 1 英里；Mountain View 0.3 英里；景观道 12 英里、Upper Lehman Creek 以上限长 24 英尺、上段一般 6–10 月开；Baker Creek 路 3.5 英里；Lehman Caves 导览价格、时长、69 级台阶、5 岁以下只在 11 月 1 日–3 月 5 日能参加 Grand Palace、每团 20 人、提前 30 天订、只收卡。

## 没改、拿不准的
- **新临时关闭（季节性提前）**：NPS 公告 2026-10-08 起惠勒峰景观道冬季封闭（公告写在 Upper Lehman Creek 营地封路，路况页写 “CLOSED at Mather Overlook”）。grba-scenic-drive、grba-alpine-lakes、grba-bristlecone-grove、grba-wheeler-peak 的 openMonths 含 10 月，今年 10 月已经去不了，需要加进 closures.ts（2026-10-08 起，到明年 5 月底/6 月）。来源：https://www.nps.gov/grba/planyourvisit/conditions.htm
- 同期公告：Wheeler Peak 营地 10 月 10 日起关闭；倾倒站 10 月 9 日中午起关闭，之后园内（营地）没有饮用水——grba-lehman-caves-vc 说游客中心水龙头全年能接水，未见冲突，没改。
- grba-lexington-arch：NPS 步道页说它是 “the one and only trail … that permits pets”，宠物规定页还列了 Baker 镇到 Great Basin 游客中心的小路，按规定页写成两条。
- grba-bristlecone-grove：狐尾松步道单独的 NPS 页面没找到（Glacier 页说前 1.4 英里重合，即往返 2.8 英里和数据一致），爬升 600 ft 没核到。
- grba-great-basin-vc：“10 月中旬关门”和开放月份，hours 页面的开放时间是脚本加载的，没核到。
- 文件头注释里“惠勒峰景观道…几条路都开着（NPS 路况 2026-09-21）”已过时（只是注释，不显示）。
