# jasp 改动记录

- jasp-jasper-skytram：summary 去 Whistlers 山顶的步道（约 1.4 公里、200 米 → 约 1.1 公里、150 米）。Parks Canada："Trail 5a (moderate); 1.1 km one way; elevation gain 150 m, 1 hour"。来源：https://parks.canada.ca/pn-np/ab/jasper/activ/experience/sentiers-trails/ouest-west
- jasp-jasper-skytram（适合度）：noteZh（1.4 公里碎石坡（爬升约 200 米）→ 1.1 公里碎石坡（爬升约 150 米）），同上。

## 核对过、没改的
- 冰川脚步道往返 1.8 km / 60 m；威尔科克斯山口第一观景点往返 2.4 km、到山口往返 8 km / 390 m / 2–3 小时；桑瓦普塔下瀑布往返 2.6 km / 1 小时；Mary Schäffer 环线 3.2 km；驼鹿湖环线 2.7 km；五湖谷 Wetland Way 往返 1.8 km、Emerald Loop 5.4 km、Valley Loop 7.7 km、P15 在镇南 9 km。来源：https://parks.canada.ca/pn-np/ab/jasper/activ/experience/sentiers-trails ；https://parks.canada.ca/pn-np/ab/jasper/activ/experience/sentiers-trails/sud-south
- 玛琳峡谷：Parks Canada 步道页 "Closed until further notice"，步道状况页（2026-10-13）"Superintendent closure, no public access"，和数据一致（closures.ts 已有）。
- 伊迪丝·卡维尔山：步道状况页 "Cavell Road and Astoria River trailhead are closed for the 2026 season"，closures.ts 已有，tips 写的是"平常"开放时间，未改。
- 罗布森山时差：阿尔伯塔政府官网写从 2026 年 11 月起不再调回 Mountain Standard Time，全年用 Alberta Time，tips 正确。来源：https://www.alberta.ca/albertas-new-time-system

## 不在范围、请处理
- 步道状况页另有 "Mile 5 Hill (93A N) will close in September for repairs; use 93A S via Athabasca Falls"（93A 北段 9 月起维修封路），可以考虑加进 closures.ts / roads。来源：https://parks.canada.ca/pn-np/ab/jasper/activ/experience/sentiers-trails/etat-sentiers-trail-conditions

## 没改、拿不准的
- jasp-maligne-canyon：tips "下游的第五桥野餐区可以去"，官方页面只写峡谷关闭，没写第五桥是否开放，未核实。
- 冰原探险（5/1–10/12）、玛琳湖游船（5/27–10/11）、Ice Odyssey 停开等是 Pursuit 的运营信息，没逐一核实。
- 缆车上下站海拔 1,258 / 2,263 米、约 7 分钟：来自缆车公司，没在官方页面核实。
