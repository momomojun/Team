# English edition: how we write it

The English site (`/en`) is written for native English speakers — mostly Americans planning a national park trip, plus international visitors who read English. It is **not a translation** of the Chinese site. Same facts, same structure, but the sentences should read as if an experienced American park writer wrote them from scratch.

The Chinese data files stay the source of truth for facts. English lives in two places:

| Where | What |
|---|---|
| `src/i18n/en/dictionary.ts` | Interface text: buttons, headings, labels, templates with `{placeholders}` |
| `src/i18n/en/content/<group>.ts` | Data text: Chinese source string → English. One file per group (each park's attractions and suitability, park descriptions, closures, lodging…) |

`npm run i18n:en` finds every Chinese string in the data and adds missing entries (empty strings) to the group files. Keep the keys exactly as they are — the key is the Chinese source, and the site looks up English by that exact string. If the Chinese changes, the old entry stops matching and the script adds a new empty one; `tests/i18n-en.test.ts` fails until it is written.

## Voice

- **Practical, specific, calm.** Like the best NPS trip-planning pages or a seasoned friend who has been there: what it is, why it's worth it, what to watch out for.
- **Second person, active voice.** "Park at the lower lot and take the stairs." Not "Visitors are advised to…".
- **Short sentences.** One idea each. Cut filler.
- **No hype or clichés**: avoid *breathtaking, stunning, hidden gem, nestled, must-see* (except the UI tag), *iconic* (use sparingly), *paradise*, *majestic*, exclamation marks.
- **No empty safety boilerplate** ("Be careful", "Stay safe"). Say the concrete risk and what to do: "The ledge has no railing; hold small children's hands."
- **Don't translate Chinese idioms literally.** 出片 → "photographs beautifully" / "a classic photo spot"; 人少 → "quieter"; 打卡 → "stop at" / "check off"; 性价比高 → "good value".
- Natural American phrasing: "trailhead", "pullout", "overlook", "the lot fills by 8 a.m.", "round trip", "elevation gain", "shoulder season", "day-use area", "first come, first served".

## Facts

- Keep every fact: numbers, dates, prices, names, rules, sources. Don't add facts that aren't in the Chinese, and don't soften warnings.
- If the Chinese looks wrong or self-contradictory, write the English as given and list the item in your report.
- You may drop context that only matters to Chinese readers (see *Localization* below), and you may reorder clauses so the English reads naturally.

## Names

- Use official English names: the `nameEn` field, NPS names, signed trail names. Chinese descriptive names like 守望者步道 become **Watchman Trail**, never a re-translation like "Watchman's Path".
- Don't repeat a name in parentheses the way the Chinese does ("守望者峰（Watchman）" → "the Watchman").
- Keep Native and local names with their marks: Haleakalā, Hawaiʻi, Kīlauea, Nāhuku, Uēkahuna, Kuwohi.
- Organizations: National Park Service (NPS), Parks Canada, Bureau of Land Management (BLM), Navajo Nation Parks & Recreation, Recreation.gov.

## Units, numbers, dates, times

- **Imperial first**: miles, feet, °F, acres. Convert metric values in the Chinese ("约 1 公里" → "about 0.6 mile"; "海拔约 2,880 米" → "about 9,450 feet"). When the data already gives miles/feet (hike stats), use those exact numbers. Round sensibly: distances to 0.1 mile under 10 miles, elevations to the nearest 10 or 50 feet, temperatures to whole degrees. Metric in parentheses only where it really helps (Canada: "2.4 miles (3.8 km)").
- Numbers: numerals for 10 and up and for all measurements, money, times and ages ("5-year-olds", "2 miles", "9 a.m."); spell out one through nine in plain prose ("three viewpoints").
- Money: "$35 per vehicle", "$1 reservation fee", "C$10.75" for Canadian dollars.
- Dates: "May 22–October 18, 2026"; "June 22 to December 23"; month names spelled out in prose, abbreviated in tight labels (Jan., Feb., Aug., Sept., Oct., Nov., Dec.; March–July never abbreviated). No ordinals ("May 22", not "May 22nd").
- Times: "8:30 a.m.", "7:30 p.m.", "noon", "midnight". Ranges: "9 a.m.–5 p.m." Time zones: "Mountain Time", "Pacific Time".
- Ranges use an en dash without spaces: "6–10 miles", "May–September".
- Durations: "2–3 hours", "about 45 minutes", "a full day".

## Style

- American spelling (color, center, traveler, gray).
- Serial (Oxford) comma.
- Curly quotes and apostrophes are fine (“ ” ’); straight apostrophes are fine too — be consistent within a file. Inside the content files, values are JSON strings: escape straight double quotes as `\"`, or use “curly quotes”.
- Headings and buttons in sentence case ("Plan a trip", "Best time to visit").
- Tips are complete sentences ending with a period. Summaries are one to three sentences.
- Don't start every sentence with "You". Vary it.
- Directions and features in lowercase unless part of a name: "the south rim of the canyon", but "South Rim" when it's the area name.

## Localization: what changes for English readers

- **Visas and passports**: replace China-specific advice with general advice. "中国护照要有效的加拿大签证" → "Bring your passport. Depending on your citizenship you may need a Canadian visa or an eTA." For returning to the U.S.: "Make sure you have the documents to re-enter the U.S."
- **Asian groceries** (亚洲超市): keep, call them "Asian markets" or "Asian grocery stores". Don't explain why Chinese travelers want them.
- **NPS alerts**: shown in the original English; no translation notes.
- **Chinese platforms**: Bilibili creators stay ("a Bilibili creator"); mentions of 小红书 or "Chinese-language information is scattered" go away.
- **Nonresident fee**: keep — it affects international visitors. Phrase it neutrally: "Starting in 2026, visitors 16 and older who aren't U.S. residents pay a $100 nonresident fee at 11 popular parks…"
- **Food**: references to rice cookers, hot pot, instant noodles as Chinese travel habits become neutral ("bring easy meals").
- **Units and holidays**: Chinese holidays (国庆, 春节) → say the dates; U.S. holidays by name (Memorial Day, Labor Day).
- Anything addressed to "Chinese visitors" (中国游客) addresses "visitors" or "international visitors" instead.

## Glossary

| Chinese | English |
|---|---|
| 观景点 / 观景台 | overlook, viewpoint (follow the official name: "Point", "Overlook", "Vista") |
| 步道 / 步道口 | trail / trailhead |
| 往返 / 单程 / 环线 | round trip / one way / loop |
| 爬升 | elevation gain |
| 景观道 / 景观路 | scenic drive |
| 门户小镇 | gateway town |
| 园内住宿 | in-park lodge |
| 民宿（区） | vacation rentals (area) |
| 班车 / 换乘点 | shuttle / shuttle stop, park-and-ride |
| 分时段预约 / 入园预约 | timed-entry reservation |
| 许可证 / 抽签 | permit / lottery |
| 年卡 | America the Beautiful pass (annual pass) |
| 非居民附加费 | nonresident fee |
| 护林员 / 护林员导览 | ranger / ranger-led program, ranger-led tour |
| 游客中心 | visitor center |
| 营地 | campground |
| 停车场停满 | the lot fills, parking fills |
| 季节性山路 | seasonal road |
| 临时关闭 | temporary closure |
| 必去 | must-see (UI tag only) |
| 热度 | popularity |
| 攻略 | itinerary, trip plan |
| 博主 | creator |
| 明星同款 | celebrity photo spots |
| 同行的人 | your group / traveling with |
| 婴儿车 / 背带 | stroller / baby carrier |
| 轮椅（有人协助） | wheelchair (with assistance) |
| 量力而行 | take it at your own pace / know your limits |
| 暗夜公园 | International Dark Sky Park |
| 世界遗产 | World Heritage Site |
