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

/** 已知 AllTrails 步道 slug 时直接拼出步道详情页链接 */
export const alltrailsTrailUrl = (slug: string) => `https://www.alltrails.com/trail/${slug}`;

/** 根据 AllTrails 的 profile_photo_data（形如 "127072286-3d432de0c3b377614907487488a91895"）拼出官方精选封面图 CDN 地址 */
export function alltrailsPhotoUrl(photoData?: string, width = 320, height = 320): string | undefined {
  if (!photoData) return undefined;
  const dash = photoData.indexOf("-");
  if (dash <= 0) return undefined;
  const id = photoData.slice(0, dash);
  const hash = photoData.slice(dash + 1);
  const payload = JSON.stringify({
    bucket: "assets.alltrails.com",
    key: `uploads/photo/image/${id}/${hash}.jpg`,
    edits: {
      toFormat: "jpeg",
      resize: { width, height, fit: "inside" },
      rotate: null,
      jpeg: {
        trellisQuantisation: true,
        overshootDeringing: true,
        optimiseScans: true,
        quantisationTable: 3,
      },
    },
  });
  const b64 = typeof btoa === "function" ? btoa(payload) : Buffer.from(payload).toString("base64");
  return `https://images.alltrails.com/${b64}`;
}

/**
 * 单条步道回退搜索：当没有精确匹配到 AllTrails slug 时，
 * 用 Google 限定搜 alltrails.com/trail 下面的页面
 */
export function alltrailsSearchUrl(trailNameEn: string, parkNameEn: string) {
  const query = `site:alltrails.com/trail ${trailNameEn.replace(/["“”]/g, "")} ${parkNameEn}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/** 优先返回已匹配的 AllTrails 步道直达链接，无匹配时回退到搜索 */
export function alltrailsAttractionUrl(
  attraction: { nameEn: string; alltrails?: { slug: string } },
  parkNameEn: string,
) {
  return attraction.alltrails?.slug
    ? alltrailsTrailUrl(attraction.alltrails.slug)
    : alltrailsSearchUrl(attraction.nameEn, parkNameEn);
}
