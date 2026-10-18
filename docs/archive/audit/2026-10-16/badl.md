# badl 核对记录（2026-10-16）

- badl-ben-reifel-vc：饮用水提示（园里只有这里有饮用水 → 野外和 Sage Creek 营地都没有饮用水）。原来的说法和官方矛盾，White River 游客中心也有饮用水。来源：https://www.nps.gov/badl/planyourvisit/hours.htm（White River VC “restrooms, picnic tables, and water”）；https://www.nps.gov/badl/planyourvisit/accessibility.htm（“Sage Creek Campground … no water available onsite”）；Things To Do 页 “no potable water in the backcountry”
- badl-sage-creek-rim-road：离野牛多远（至少 25 码（约 23 米），NPS 建议 100 英尺以上 → 野牛时速能超过 30 英里，公园规定离野生动物至少 100 英尺（约 30 米）），中英文都改。来源：https://www.nps.gov/badl/planyourvisit/safety.htm（“Park regulations require visitors to keep a 100-foot distance from park wildlife, especially bison, which can run faster than 30 miles per hour”）
- badl-sage-creek-rim-road（适合度）：下车拍照至少隔 25 码（约 23 米）→ 100 英尺（约 30 米），英文 80 feet → 100 feet。来源：同上

## 核对过、没问题的
护林员节目：Door 步道的地质散步 5 月 17 日到 9 月 26 日 8:30；化石讲解 10:30 和 14:00；夜间讲解 6–7 月 21:00、8 月 20:30、9 月 20:00；星空 21:30 / 21:00 / 20:30；化石修复室 5 月 23 日到 10 月 31 日 9:00–16:00（https://www.nps.gov/thingstodo/badl-ranger-programs.htm）。Ben Reifel 夏季 8–17（5 月 4 日到 9 月 26 日）、冬季 9–16。Sheep Mountain Table 土路 5 英里到观景点，之后 2.5 英里只有高底盘四驱能走（https://www.nps.gov/thingstodo/sheep-mtn-table.htm）。Roberts 犬鼠城在 Pinnacles 入口以西 5 英里；Pinnacles 是北园区最高的观景点；Notch 的梯子是钢缆加原木；Cliff Shelf 爬升约 200 ft；Delta-01 导览每团 6 人，Recreation.gov 提前 30 天；无障碍说明和 NPS 无障碍页一致。

## 没改、拿不准的
- **步道长度，两个官方页面对不上**：Things To Do 页 https://www.nps.gov/thingstodo/hiking-badl.htm（2026-09-10 更新）写的往返长度是 Door 0.75 mi（木栈道 ¼ mi）、Window 0.25、Notch 1.5、Castle 10、Cliff Shelf 0.5、Saddle Pass 0.25、Fossil Exhibit 0.25。公园页 https://www.nps.gov/badl/planyourvisit/hiking-in-badlands.htm（2026-04-22 更新）写的是 Door 木栈道 226 码 / 0.26 mi、Window 0.26、Notch 1.25、Castle 10.2、Cliff Shelf 0.86、Saddle Pass 0.68、Fossil Exhibit 0.34。数据和更新得晚的 Things To Do 页一致，没改。Cliff Shelf、Saddle Pass 差得比较多，要定的话可以问公园。
- badl-notch-trail：NPS 公告写 Notch 步道关闭期是 2026-08-31 到 **2027-01-05**。closures.ts 里 reopen 是 null，可以补上这个预计日期。来源：公园 Alerts（https://www.nps.gov/badl/park-alerts-badl.json）
- badl-white-river-vc：“2026 年 5 月下旬到 9 月 25 日，9:00–16:00”在官方页面没核到（Porch Talks 写的是 5 月 17 日到 9 月 7 日）；7 月 26 日因为高温临时关过一天（已经过期）。
- badl-minuteman-missile：Delta-09 在 Exit 116，游客中心在 Exit 131，相隔约 15 英里（24 公里），英文写 “About 16 miles west”，只差 1 英里，没改。

## 主线复核（10-16）
- Notch 步道：核对助手说公告写关闭到 2027-01-05，主线 10-16 晚重新读 park-alerts-badl.json，公告的结束日期字段是 2026-09-30、没有写 2027-01-05，也没有宣布重开。closures.ts 的 reopen 保持 null（按“没公布重开日期”处理），只把 checked 改成 10-16。
