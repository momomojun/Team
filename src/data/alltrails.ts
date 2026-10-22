/**
 * AllTrails 上每座公园的“最佳步道”页面（www.alltrails.com/parks/…）。2026-10-22 逐个打开核对过（都是 200，标题是“Best hikes and trails in …”），
 * 地址不是都能按名字拼出来：大沙丘、新河峡谷、阿拉斯加几座带 “and Preserve”（兰格尔、卡特迈、克拉克湖只写 “preserve”），夏威夷按岛分，
 * 维尔京群岛、美属萨摩亚不在 us/ 下面。红杉与国王峡谷在 AllTrails 上是两页。园外名胜（羚羊峡谷、马蹄湾、纪念碑谷、波浪谷）没有公园页，
 * 只给单条步道的搜索链接。AllTrails 第一次打开可能先“验证设备”几秒，会自己过去
 */
export const ALLTRAILS_PARKS: Record<string, string[]> = {
  yose: ["us/california/yosemite-national-park"],
  seki: ["us/california/sequoia-national-park", "us/california/kings-canyon-national-park"],
  pinn: ["us/california/pinnacles-national-park"],
  chis: ["us/california/channel-islands-national-park"],
  jotr: ["us/california/joshua-tree-national-park"],
  redw: ["us/california/redwood-national-park"],
  lavo: ["us/california/lassen-volcanic-national-park"],
  crla: ["us/oregon/crater-lake-national-park"],
  mora: ["us/washington/mount-rainier-national-park"],
  olym: ["us/washington/olympic-national-park"],
  noca: ["us/washington/north-cascades-national-park"],
  yell: ["us/wyoming/yellowstone-national-park"],
  grte: ["us/wyoming/grand-teton-national-park"],
  glac: ["us/montana/glacier-national-park"],
  romo: ["us/colorado/rocky-mountain-national-park"],
  meve: ["us/colorado/mesa-verde-national-park"],
  grsa: ["us/colorado/great-sand-dunes-national-park-and-preserve"],
  blca: ["us/colorado/black-canyon-of-the-gunnison-national-park"],
  deva: ["us/california/death-valley-national-park"],
  zion: ["us/utah/zion-national-park"],
  brca: ["us/utah/bryce-canyon-national-park"],
  grca: ["us/arizona/grand-canyon-national-park"],
  grba: ["us/nevada/great-basin-national-park"],
  arch: ["us/utah/arches-national-park"],
  cany: ["us/utah/canyonlands-national-park"],
  care: ["us/utah/capitol-reef-national-park"],
  whsa: ["us/new-mexico/white-sands-national-park"],
  cave: ["us/new-mexico/carlsbad-caverns-national-park"],
  pefo: ["us/arizona/petrified-forest-national-park"],
  sagu: ["us/arizona/saguaro-national-park"],
  chir: ["us/arizona/chiricahua-national-park"],
  gumo: ["us/texas/guadalupe-mountains-national-park"],
  bibe: ["us/texas/big-bend-national-park"],
  badl: ["us/south-dakota/badlands-national-park"],
  wica: ["us/south-dakota/wind-cave-national-park"],
  thro: ["us/north-dakota/theodore-roosevelt-national-park"],
  cuva: ["us/ohio/cuyahoga-valley-national-park"],
  indu: ["us/indiana/indiana-dunes-national-park"],
  jeff: ["us/missouri/gateway-arch-national-park"],
  isro: ["us/michigan/isle-royale-national-park"],
  voya: ["us/minnesota/voyageurs-national-park"],
  grsm: ["us/tennessee/great-smoky-mountains-national-park"],
  shen: ["us/virginia/shenandoah-national-park"],
  neri: ["us/west-virginia/new-river-gorge-national-park-and-preserve"],
  maca: ["us/kentucky/mammoth-cave-national-park"],
  cong: ["us/south-carolina/congaree-national-park"],
  hosp: ["us/arkansas/hot-springs-national-park"],
  acad: ["us/maine/acadia-national-park"],
  ever: ["us/florida/everglades-national-park"],
  bisc: ["us/florida/biscayne-national-park"],
  drto: ["us/florida/dry-tortugas-national-park"],
  viis: ["us-virgin-islands/virgin-islands-national-park"],
  dena: ["us/alaska/denali-national-park"],
  kefj: ["us/alaska/kenai-fjords-national-park"],
  wrst: ["us/alaska/wrangell-st-elias-national-park-preserve"],
  glba: ["us/alaska/glacier-bay-national-park-and-preserve"],
  gaar: ["us/alaska/gates-of-the-arctic-national-park-and-preserve"],
  kova: ["us/alaska/kobuk-valley-national-park"],
  katm: ["us/alaska/katmai-national-park-preserve"],
  lacl: ["us/alaska/lake-clark-national-park-preserve"],
  havo: ["hawaii/hawaii/hawaii-volcanoes-national-park"],
  hale: ["hawaii/maui/haleakala-national-park"],
  npsa: ["american-samoa/national-park-of-american-samoa"],
  banf: ["canada/alberta/banff-national-park"],
  jasp: ["canada/alberta/jasper-national-park"],
  yoho: ["canada/british-columbia/yoho-national-park"],
};

export const alltrailsParkUrls = (park: string) => (ALLTRAILS_PARKS[park] ?? []).map((path) => `https://www.alltrails.com/parks/${path}`);

/**
 * 单条步道：AllTrails 的地址按它自己的名字起（mist-trail、angels-landing-trail……），和我们的名字对不上，
 * 也没有不登录、不抓页面就能查的接口；所以用搜索，只搜 alltrails.com/trail 下面的页面，第一条一般就是这条步道
 */
export function alltrailsSearchUrl(trailNameEn: string, parkNameEn: string) {
  // 不加引号：AllTrails 的名字常和我们的差一点（“Upper Yosemite Fall Trail” 在那边是 “Upper Yosemite Falls Trail”），加了引号反而搜到别的步道
  const query = `site:alltrails.com/trail ${trailNameEn.replace(/["“”]/g, "")} ${parkNameEn}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
