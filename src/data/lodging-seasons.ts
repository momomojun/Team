// 住处的营业季节：只收季节性营业的（园内酒店、帐篷木屋、阿拉斯加和加拿大落基山的夏季旅馆……），全年营业的不写。
// 按官方页面（NPS、特许经营商、旅馆自己的网站）整理，写明是哪一年公布的日期；之后的年份按同样的月日估。
// 排行程时这晚不营业的住处不推荐、不自动选；用户自己选了的，行程页那晚提醒。
// 公布的关门日期有的是最后一晚、有的是退房那天，看得出来的按最后一晚写，看不出来的照抄（可能多算一晚）。

export interface LodgingSeason {
  /**
   * 营业的晚上（入住日期，MM-DD，含两头）。可以有几段（冬季一段、夏季一段）；
   * 跨年的一段 from 比 to 大（"12-15" 到 "03-01"）
   */
  open?: { from: string; to: string }[];
  /** 临时关闭（施工、山洪……，不是每年都有的）：YYYY-MM-DD，含两头；没公布重开日期的 to 是 null，核对后 90 天内当关着 */
  closed?: { from: string; to: string | null }[];
  /** 这是哪一年的日期 */
  year: number;
  /** 官方来源 */
  source: string;
  /** 核对日期 */
  checked: string;
}

export const lodgingSeasons: Record<string, LodgingSeason> = {
  // Travel Yosemite: "Curry Village will not be open from November 29, 2026, through December 10, 2026." NPS lodging page calls it "open seasonally"; tent cabins are heated from the Tuesday after Labor Day to the Friday before Memorial Day | Effectively year-round except a 12-night closure Nov 29-Dec …
  "yose-stay-curry-village": { open: [{ from: "12-11", to: "11-28" }], year: 2026, source: "https://www.travelyosemite.com/lodging/curry-village/", checked: "2026-10-18" },
  // NPS Fall 2026 trip planner: "John Muir Lodge and Cabins CLOSED after November 28". NPS Spring 2026 planner (dated 2026-03-19) lists "John Muir Lodge - Lobby open 24 hours", cabin rentals "Available after April 10". Winter 2025-26 planner (2025-12-09) lists no John Muir Lodge under Grant Grove. …
  "seki-stay-john-muir-lodge": { open: [{ from: "03-19", to: "11-28" }], year: 2026, source: "https://www.nps.gov/seki/learn/news/upload/Trip_Planner_2026_Fall_2026-08-21_web_508.pdf", checked: "2026-10-18" },
  // Kept dates from current note (2026 May 21-Oct 12). Recreation.gov public availability data for Oct 2026 shows cabins reserved through the night of Oct 12 and no inventory after that, consistent with an Oct 12 close. NPS eating & sleeping page only says reservations required (lassenlodging.com is …
  "lavo-stay-manzanita-cabins": { open: [{ from: "05-21", to: "10-12" }], year: 2026, source: "https://www.recreation.gov/camping/campgrounds/233257", checked: "2026-10-18" },
  // Kept 2026 dates from current note (June 12-Oct 12); operator site lassenlodging.com blocked (403), NPS page gives no dates. Older NPS text: generally early June through early October. | Not independently verified for 2026. In 2025 the ranch opened late (July).
  "lavo-stay-drakesbad": { open: [{ from: "06-12", to: "10-12" }], year: 2026, source: "https://www.nps.gov/lavo/planyourvisit/eatingsleeping.htm", checked: "2026-10-18" },
  // Explore Crater Lake (concessioner): operating dates "May 15th, 2026 - October 13th, 2026"; FAQ: dining room dinner service May 16-October 13 2026; NPS: "typically open mid-May through early-October" | End date as published; it may be the last checkout morning rather than the last night (then last …
  "crla-stay-crater-lake-lodge": { open: [{ from: "05-15", to: "10-13" }], year: 2026, source: "https://explorecraterlake.com/stay-at-crater-lake/crater-lake-lodge/", checked: "2026-10-18" },
  // Explore Crater Lake (concessioner): "May 8th, 2026 - October 4th, 2026"; NPS: typically late May through September, opening can be delayed by snowpack | End date as published; may be the last checkout day (then last night = 10-03). Current note's 'late May to end of September' is the NPS typical …
  "crla-stay-mazama-cabins": { open: [{ from: "05-08", to: "10-04" }], year: 2026, source: "https://explorecraterlake.com/stay-at-crater-lake/the-cabins-at-mazama-village/", checked: "2026-10-18" },
  // NPS Operating Hours page (checked 2026-10-18): Paradise Inn "CLOSED for the season", "Generally open May through September". Concessioner (Mount Rainier Guest Services, site Cloudflare-blocked; seen via search snippets): 2026 dining hours table May 16-September 28; FAQ: Paradise Inn closes at noon …
  "mora-stay-paradise-inn": { open: [{ from: "05-16", to: "09-29" }], year: 2026, source: "https://www.nps.gov/mora/planyourvisit/hours.htm", checked: "2026-10-18" },
  // NPS Olympic lodging page: Lake Crescent Lodge "Season: April 17, 2026 - January 1, 2027" | Existing note says to Jan 3 and that in winter only some cabins (Roosevelt Fireplace cabins) open on weekends - not confirmed (concessioner pages 404). Nov-Dec may be weekends-only/partial; Jan 1 may be the …
  "olym-stay-lake-crescent-lodge": { open: [{ from: "04-17", to: "01-01" }], year: 2026, source: "https://www.nps.gov/olym/planyourvisit/lodging.htm", checked: "2026-10-18" },
  // NPS Olympic lodging page: Log Cabin Resort season May 15 to September 29, 2026 | Existing note says rooms close Sept 27 (maybe lodging vs campground difference); NPS says Sept 29. Use 09-27 if being conservative.
  "olym-stay-log-cabin-resort": { open: [{ from: "05-15", to: "09-29" }], year: 2026, source: "https://www.nps.gov/olym/planyourvisit/lodging.htm", checked: "2026-10-18" },
  // NPS Olympic lodging page: Sol Duc Hot Springs Resort March 20 to November 1, 2026; concessioner home page: "open March to November" | Nov 1 may be the last checkout day (then last night 10-31).
  "olym-stay-sol-duc": { open: [{ from: "03-20", to: "11-01" }], year: 2026, source: "https://www.nps.gov/olym/planyourvisit/lodging.htm", checked: "2026-10-18" },
  // NPS Yellowstone Operating Dates 2026: Old Faithful Inn May 1-October 11; Old Faithful Lodge Cabins May 8-October 3; Old Faithful Snow Lodge summer April 24-October 24, winter 2026-27 December 16-March 5 | Union of Inn + Snow Lodge. Apr 24-Apr 30 and Oct 12-Oct 24 only the Snow Lodge is open. Winter …
  "yell-stay-old-faithful": { open: [{ from: "04-24", to: "10-24" }], year: 2026, source: "https://www.nps.gov/yell/planyourvisit/operating-dates.htm", checked: "2026-10-18" },
  // NPS Yellowstone Operating Dates 2026: Canyon Lodge & Cabins - Lodging May 15-October 24; Cabins May 15-October 4 | Lodge buildings open until Oct 24; cabins close Oct 4. Existing note 'early October' is the cabins' date.
  "yell-stay-canyon-lodge": { open: [{ from: "05-15", to: "10-24" }], year: 2026, source: "https://www.nps.gov/yell/planyourvisit/operating-dates.htm", checked: "2026-10-18" },
  // NPS Yellowstone Operating Dates 2026: Lake Yellowstone Hotel May 15-October 10; Lake Yellowstone Hotel Cabins May 22-October 10; Lake Lodge Cabins June 10-October 3 | Range is the hotel; the cheaper Lake Lodge Cabins mentioned in the note only open June 10-October 3.
  "yell-stay-lake-hotel": { open: [{ from: "05-15", to: "10-10" }], year: 2026, source: "https://www.nps.gov/yell/planyourvisit/operating-dates.htm", checked: "2026-10-18" },
  // NPS Yellowstone Operating Dates 2026: Mammoth Hot Springs Hotel (and cabins) April 24, 2026 - March 7, 2027 | Open continuously summer through winter; closed roughly Mar 8-Apr 23 (spring shoulder). Reachable by car year-round via North Entrance.
  "yell-stay-mammoth": { open: [{ from: "04-24", to: "03-07" }], year: 2026, source: "https://www.nps.gov/yell/planyourvisit/operating-dates.htm", checked: "2026-10-18" },
  // NPS Yellowstone Operating Dates 2026: Grant Village Lodge May 29-October 10
  "yell-stay-grant-village": { open: [{ from: "05-29", to: "10-10" }], year: 2026, source: "https://www.nps.gov/yell/planyourvisit/operating-dates.htm", checked: "2026-10-18" },
  // NPS Grand Teton Operating Hours, lodging 2026: Jackson Lake Lodge opening May 15 / closing October 4 | Matches existing note. Closing date may be last checkout day.
  "grte-stay-jackson-lake-lodge": { open: [{ from: "05-15", to: "10-04" }], year: 2026, source: "https://www.nps.gov/grte/planyourvisit/hours.htm", checked: "2026-10-18" },
  // NPS Grand Teton Operating Hours, lodging 2026: Jenny Lake Lodge and Dining Room May 29 / October 4 | Matches existing note.
  "grte-stay-jenny-lake-lodge": { open: [{ from: "05-29", to: "10-04" }], year: 2026, source: "https://www.nps.gov/grte/planyourvisit/hours.htm", checked: "2026-10-18" },
  // NPS Grand Teton Operating Hours, lodging 2026: Signal Mountain Lodge May 8 / October 11 | Matches existing note.
  "grte-stay-signal-mountain-lodge": { open: [{ from: "05-08", to: "10-11" }], year: 2026, source: "https://www.nps.gov/grte/planyourvisit/hours.htm", checked: "2026-10-18" },
  // NPS Grand Teton Operating Hours, lodging 2026: Colter Bay Cabins May 21 / September 27; Colter Bay Tent Village May 22 / September 7 | Union = cabins (tent village is within that window). Matches existing note.
  "grte-stay-colter-bay": { open: [{ from: "05-21", to: "09-27" }], year: 2026, source: "https://www.nps.gov/grte/planyourvisit/hours.htm", checked: "2026-10-18" },
  // NPS Grand Teton Operating Hours, lodging 2026: Headwaters Lodge and Cabins May 22 / October 4 | Matches existing note.
  "grte-stay-headwaters": { open: [{ from: "05-22", to: "10-04" }], year: 2026, source: "https://www.nps.gov/grte/planyourvisit/hours.htm", checked: "2026-10-18" },
  // Citing the lodge's website: Main Lodge & Suites Mar 1-Nov 30, 2026; Sunset Motel Mar 1-Nov 30; Sunrise Motel Mar 27-Nov 9; Cabins May 1-Oct 15 (opening weather dependent). | Union = Main Lodge/Sunset Motel. Official visitbrycecanyon.com pages did not show dates via fetch (homepage advertises 2026 …
  "brca-stay-lodge": { open: [{ from: "03-01", to: "11-30" }], year: 2026, source: "https://www.nationalparkstraveler.org/parks/bryce-canyon-national-park/lodging-bryce-canyon-national-park", checked: "2026-10-18" },
  // Denali Princess Wilderness Lodge 'Rates & Operating Dates': "May - September"; Princess Copper River fact sheet uses "mid-May through mid-September"; Pursuit Denali Cabins (Denali Park area) 2026: May 18 - Sept 16. | Canyon ('Glitter Gulch') hotels close in winter; exact dates vary by property …
  "dena-stay-nenana-canyon": { open: [{ from: "05-15", to: "09-15" }], year: 2026, source: "https://www.princesslodges.com/princess-alaska-lodges/denali-lodge/pricing/", checked: "2026-10-18" },
  // "Camping is open 1 March to 20 November" (2026); store open March 15 to November 15. | Official site says Nov 20, not Nov 21 as in the current Chinese note. Unclear whether Nov 20 is last night or last checkout day; to be safe the last night could be 11-19.
  "cany-stay-needles-outpost": { open: [{ from: "03-01", to: "11-20" }], year: 2026, source: "https://www.needlesoutpost.com/", checked: "2026-10-18" },
  // "Moraine Lake Lodge is a summer seasonal property with dates of operation from June 1st to October 1st." Same page At a Glance: "Seasonal Operation: Early June – Early October". | No year stated; Oct 1 read as check-out day (last night Sep 30). Moraine Lake Road 2026 open Jun 1 - Oct 13 per Parks …
  "banf-stay-moraine-lake-lodge": { open: [{ from: "06-01", to: "09-30" }], year: 2026, source: "https://www.morainelake.com/faq", checked: "2026-10-18" },
  // Homepage (Oct 2026): "All services are now closed for the Winter Season. We look forward to greeting everyone in April 2027. Date to be confirmed." Travel Alberta: Spring Fling Early Bird package "to celebrate the opening of their resort for the 2026 season". Third-party guide …
  "banf-stay-saskatchewan-crossing": { open: [{ from: "04-15", to: "10-15" }], year: 2026, source: "https://thecrossingresort.com/", checked: "2026-10-18" },
  // "2026 Dates: May 1 – October 12, 2026" | Oct 12 treated as last check-out (last night Oct 11); use to:10-12 if the operator means last night.
  "jasp-stay-glacier-view-lodge": { open: [{ from: "05-01", to: "10-11" }], year: 2026, source: "https://www.banffjaspercollection.com/hotels/glacier-view-lodge/", checked: "2026-10-18" },
  // "We are now hiring for our 2026 season, which runs from early May through mid-October." | Exact opening/closing days not published; early May / mid-Oct approximated as 05-01 to 10-15.
  "jasp-stay-sunwapta-falls-lodge": { open: [{ from: "05-01", to: "10-15" }], year: 2026, source: "https://www.sunwapta.com/jobs", checked: "2026-10-18" },
  // "Cathedral Mountain Lodge is a summer seasonal property with dates of operation from late May until early October." At a Glance: "Seasonal Operation: Late May - Early October." | Exact days not published (no year on page); late May / early Oct approximated conservatively as 05-25 to 10-01. Employer …
  "yoho-stay-cathedral-mountain-lodge": { open: [{ from: "05-25", to: "10-01" }], year: 2026, source: "https://www.cathedralmountainlodge.com/frequently-asked-questions/", checked: "2026-10-18" },
  // "Open May 15, 2026 | Closed September 28, 2026"; 2027: "Open May 14, 2027 | Closed September 30, 2027" | Xanterra's 'Closed' date is the checkout day (restaurants end with breakfast on closing day), so last night = 09-27. 2027 nights: 05-14 to 09-29.
  "glac-stay-lake-mcdonald-lodge": { open: [{ from: "05-15", to: "09-27" }], year: 2026, source: "https://www.glaciernationalparklodges.com/lodging/lake-mcdonald-lodge/", checked: "2026-10-18" },
  // Apgar Village Lodge 2026 cabins and motel "May 8 - October 11" (2027: cabins May 7-Sep 26, motel May 7-Oct 3). Village Inn at Apgar (https://www.glaciernationalparklodges.com/lodging/village-inn-at-apgar/): "Open May 20, 2026 | Closed October 2, 2026" (2027: May 19-Oct 1). | Union of the two. End …
  "glac-stay-apgar-village": { open: [{ from: "05-08", to: "10-10" }], year: 2026, source: "https://www.glacierparkcollection.com/lodging/apgar-village-lodge-cabins/", checked: "2026-10-18" },
  // "Open June 5, 2026 | Closed September 21, 2026"; 2027: "Open June 3, 2027 | Closed September 20, 2027" | Closing date = checkout day, last night 09-20. 2027 nights: 06-03 to 09-19.
  "glac-stay-many-glacier-hotel": { open: [{ from: "06-05", to: "09-20" }], year: 2026, source: "https://www.glaciernationalparklodges.com/lodging/many-glacier-hotel/", checked: "2026-10-18" },
  // "Open June 8, 2026 | Closed September 16, 2026"; 2027: "Open June 8, 2027 | Closed September 17, 2027" | Closing date = checkout day, last night 09-15. 2027 nights: 06-08 to 09-16.
  "glac-stay-swiftcurrent": { open: [{ from: "06-08", to: "09-15" }], year: 2026, source: "https://www.glaciernationalparklodges.com/lodging/swiftcurrent-motor-inn-cabins/", checked: "2026-10-18" },
  // "Open June 11, 2026 | Closed September 13, 2026"; 2027 same dates; "restaurants begin service with dinner on opening day and conclude with breakfast on closing day" | Closing date = checkout day, last night 09-12. 2027 identical.
  "glac-stay-rising-sun": { open: [{ from: "06-11", to: "09-12" }], year: 2026, source: "https://www.glaciernationalparklodges.com/lodging/rising-sun-motor-inn-cabins/", checked: "2026-10-18" },
  // "2026 Dates: May 29 - October 5; 2027 Dates: May 28 - October 4" | Based on St. Mary Village (main lodging). Other small motels/cabins in St. Mary and Babb are also summer-seasonal; their dates not researched. End date treated as checkout day.
  "glac-stay-st-mary": { open: [{ from: "05-29", to: "10-04" }], year: 2026, source: "https://www.glacierparkcollection.com/lodging/st-mary-village/", checked: "2026-10-18" },
  // Glacier Park Lodge 2026: May 29 to September 27; 2027: May 28 to September 20. | Based on Glacier Park Lodge; the few other motels in East Glacier Park Village are also summer-only (not researched). End date treated as checkout day.
  "glac-stay-east-glacier": { open: [{ from: "05-29", to: "09-26" }], year: 2026, source: "https://www.glacierparkcollection.com/lodging/glacier-park-lodge/", checked: "2026-10-18" },
  // Kenai River Princess/Kenai Princess Wilderness Lodge (Cooper Landing) 'Rates & Operating Dates': "May - September". | Main lodge summer-only; a few cabins/Gwin's Lodge may take off-season guests but no official confirmation. Mid-May to mid-Sept approximated.
  "kefj-stay-cooper-landing": { open: [{ from: "05-15", to: "09-15" }], year: 2026, source: "https://www.princesslodges.com/princess-alaska-lodges/kenai-lodge/pricing/", checked: "2026-10-18" },
  // Lodge job postings (coolworks, by the lodge): open May 23 - Sep 7, 2026; early-season promo valid from 'Opening Day' May 23 to June 14, 2026. Lodge homepage now shows "2027 Season: May 29 to Sept 6". | 2026 last night taken as Sep 6 (Sep 7 check-out). For 2027 use 05-29 to 09-06 (homepage; unclear …
  "wrst-stay-kennicott-glacier-lodge": { open: [{ from: "05-23", to: "09-06" }], year: 2026, source: "https://www.kennicottlodge.com/", checked: "2026-10-18" },
  // McCarthy Lodge / Ma Johnson's Hotel site: "Booking May Through September". Other McCarthy listings (McCarthy Cabins May 1 - Sept 15, Camp McCarthy May 15 - Sept 15) also summer. | Official site says only May-September; mid-May to mid-Sept used to match the Kennecott shuttle season (May 25 - Sept …
  "wrst-stay-mccarthy": { open: [{ from: "05-15", to: "09-15" }], year: 2026, source: "https://www.mccarthylodge.com/", checked: "2026-10-18" },
  // Copper River Princess fact sheet: "Operating Dates: mid-May through mid-September"; pricing page "May - September". Uncle Nicolai's Inn: Memorial Day - Labor Day weekend. | Copper Center Lodge / Old Town Copper Center Inn may operate longer, but no year-round confirmation found. In winter use …
  "wrst-stay-copper-center": { open: [{ from: "05-15", to: "09-15" }], year: 2026, source: "https://www.princesslodges.com/copper-river-princess-wilderness-lodge-fact-sheet-4/", checked: "2026-10-18" },
  // Operating dates "April 17 - October 18" (no year printed; matches note's 2026 dates). NPS: "open from spring to fall-dates are adjusted each year." | Unclear whether Oct 18 is last night or last checkout; conservative last night would be 10-17.
  "meve-stay-far-view-lodge": { open: [{ from: "04-17", to: "10-18" }], year: 2026, source: "https://www.visitmesaverde.com/stay/far-view-lodge", checked: "2026-10-18" },
  // Operating season "April 24 - October 18"; "Winter Closure October 19 at 10:00 am"; primitive camping without services April 16-24 and October 19-25. | Oct 18 is the last night (closure Oct 19 10am). Year not printed but matches 2026 note.
  "meve-stay-morefield": { open: [{ from: "04-24", to: "10-18" }], year: 2026, source: "https://www.visitmesaverde.com/stay/morefield-campground", checked: "2026-10-18" },
  // NPS: Great Sand Dunes Lodge "Open mid-March through October." Lodge's own site (gsdlodge.com) gives no season dates. | Approximate: exact 2026 open/close days not published; 'mid-March' taken as 03-15.
  "grsa-stay-great-sand-dunes-lodge": { open: [{ from: "03-15", to: "10-31" }], year: 2026, source: "https://www.nps.gov/grsa/planyourvisit/lodging.htm", checked: "2026-10-18" },
  // NPS: Oasis Camping Cabins "Open April through October." greatdunes.com gives no lodging dates (restaurant "Closed for the Season" as of Oct 2026). | Approximate month-level season; motel rooms reportedly only May-Sep per current note (not verified).
  "grsa-stay-oasis": { open: [{ from: "04-01", to: "10-31" }], year: 2026, source: "https://www.nps.gov/grsa/planyourvisit/lodging.htm", checked: "2026-10-18" },
  // NPS 2026 approved hours & rates: lodge season May 21 - September 8, 2026 (first check-in May 21, last check-out Sep 8). | Last night Sep 7. Matches existing note (2026-05-21 to 09-08).
  "glba-stay-glacier-bay-lodge": { open: [{ from: "05-21", to: "09-07" }], year: 2026, source: "https://www.nps.gov/glba/learn/management/upload/20260504-Approved-Hours-and-Rates-GB-Lodge-508-version-2-1.pdf", checked: "2026-10-18" },
  // NPS: Gustavus is a community of ~450 year-round residents with scattered inns, lodges and B&Bs; Glacier Bay Lodge runs mid-May to early Sept. Main inns (Glacier Bay Country Inn, Gustavus Inn) open mid-May to mid-Sept per guides; Bear Track Inn summer only. | A few private cabins/B&Bs (e.g. Annie …
  "glba-stay-gustavus": { open: [{ from: "05-15", to: "09-15" }], year: 2026, source: "https://www.nps.gov/glba/planyourvisit/eatingsleeping.htm", checked: "2026-10-18" },
  // Inn site: "Our lodge operates in the summertime" (no dates). Alaska.org listings: Memorial Day - Labor Day; also May 21/22 - early Sept. | Exact dates not official; approximated as late May to Labor Day 2026 (Sep 7).
  "glba-stay-bear-track-inn": { open: [{ from: "05-22", to: "09-06" }], year: 2026, source: "https://www.beartrackinn.com/", checked: "2026-10-18" },
  // Inn site banner: "NOW BOOKING SUMMER 2026 & 2027" (no exact dates). Wikivoyage/Sygic travel guides: open mid-May to mid-September. | Exact dates not on the official site; mid-May to mid-Sep is from third-party guides. Matches current note (May-Sep).
  "glba-stay-glacier-bay-country-inn": { open: [{ from: "05-15", to: "09-15" }], year: 2026, source: "https://www.glacierbayalaska.com/", checked: "2026-10-18" },
  // Operator FAQ "What Are Your Seasonal Dates?": "April 15th - October 15th" (no year printed). | Whether Oct 15 is last night or checkout is not stated; conservative last night 10-14.
  "badl-stay-cedar-pass-lodge": { open: [{ from: "04-15", to: "10-15" }], year: 2026, source: "https://staybadlands.com/stay/", checked: "2026-10-18" },
  // Blue Bell page: dining room and lounge "Open seasonally from May through October." Resort: "Season 2026 Opening Day: May 1"; State Game page: restaurants "open seasonally from the beginning of May through mid-October." | APPROXIMATE: no exact 2026 closing day published; mid-October used (consistent …
  "wica-stay-blue-bell": { open: [{ from: "05-01", to: "10-15" }], year: 2026, source: "https://www.custerresorts.com/plan-your-trip/blue-bell-lodge", checked: "2026-10-18" },
  // Restaurants "all open seasonally from the beginning of May through mid-October"; resort "Season 2026 Opening Day: May 1". Page also says Creekside Lodge next to State Game Lodge is open year-round. | APPROXIMATE closing day. Creekside Lodge (adjacent, same operator) is year-round and could serve as …
  "wica-stay-state-game-lodge": { open: [{ from: "05-01", to: "10-15" }], year: 2026, source: "https://www.custerresorts.com/plan-your-trip/state-game-lodge", checked: "2026-10-18" },
  // "The lodging, general store, restaurant & lounge are open seasonally May through October." A murder-mystery dinner is scheduled at Sylvan Lake Lodge on Oct 17, 2026. | APPROXIMATE: month-level only; exact closing day not published (at least through Oct 17, 2026).
  "wica-stay-sylvan-lake": { open: [{ from: "05-01", to: "10-31" }], year: 2026, source: "https://www.custerresorts.com/plan-your-trip/sylvan-lake-lodge", checked: "2026-10-18" },
  // 2026 season: March 30 - November 8. | Whether Nov 8 is last night or checkout not stated; conservative last night 11-07.
  "shen-stay-skyland": { open: [{ from: "03-30", to: "11-08" }], year: 2026, source: "https://www.goshenandoah.com/lodging/skyland", checked: "2026-10-18" },
  // "2026 Season: May 4 - November 29" | Conservative last night 11-28 if Nov 29 is checkout.
  "shen-stay-big-meadows-lodge": { open: [{ from: "05-04", to: "11-29" }], year: 2026, source: "https://www.goshenandoah.com/lodging/big-meadows-lodge", checked: "2026-10-18" },
  // "2026 Season: April 10 - November 8." | Conservative last night 11-07 if Nov 8 is checkout.
  "shen-stay-lewis-mountain": { open: [{ from: "04-10", to: "11-08" }], year: 2026, source: "https://www.goshenandoah.com/lodging/lewis-mountain-cabins", checked: "2026-10-18" },
  // Xanterra alert updated Oct 13, 2026: lodging closures extended through November 19, 2026; arrivals on/after Nov 20 proceeding
  "grca-stay-village": { closed: [{ from: "2026-08-31", to: "2026-11-19" }], year: 2026, source: "https://www.grandcanyonlodges.com/alerts/", checked: "2026-10-18" },
  // Delaware North: all lodging within the park is closed for overnight guests (Stage 4 water restrictions); no reopening date
  "grca-stay-yavapai": { closed: [{ from: "2026-08-31", to: null }], year: 2026, source: "https://www.visitgrandcanyon.com/operational-updates", checked: "2026-10-18" },
  // Rock Harbor Lodge official site: Operating Season "June 5, 2026 – September 12, 2026 (Full Operations. Last Night Stay is 9/11/2026)"
  "isro-stay-rock-harbor-lodge": { open: [{ from: "06-05", to: "09-11" }], year: 2026, source: "https://www.rockharborlodge.com/lodging/rock-harbor-lodge/", checked: "2026-10-20" },
  // Site still lists the 2025 season: "June 6 – September 5, 2025 (last night)"; 2026 dates not posted, using 2025
  "isro-stay-windigo-cabins": { open: [{ from: "06-06", to: "09-05" }], year: 2025, source: "https://www.rockharborlodge.com/lodging/washington-harbor-camper-cabins/", checked: "2026-10-20" },
  // Hotel site gives no operating dates (summer by boat or floatplane, winter by snowmobile); Recreation.gov's Kettle Falls cruise note says the hotel kitchen is closed for October 2026 tours. | APPROXIMATE: common mid-May (fishing opener) to end of September, not an official date
  "voya-stay-kettle-falls-hotel": { open: [{ from: "05-15", to: "09-30" }], year: 2026, source: "https://www.kettlefallshotel.com/faq", checked: "2026-10-20" },
};
