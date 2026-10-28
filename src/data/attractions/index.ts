import { celebrityShots, type CelebrityShot } from "../celebrities";
import { filmSpots, type FilmSpot } from "../film-spots";
import { creatorRoutes, type CreatorLanguage } from "../creators";
import { parkingRules } from "../parking";
import { suitability } from "../suitability";
import { bryceCanyon } from "./brca";
import { channelIslands } from "./chis";
import { craterLake } from "./crla";
import { denali } from "./dena";
import { deathValley } from "./deva";
import { gallery } from "./gallery";
import { googlePlaces } from "./google";
import { grandCanyon } from "./grca";
import { grandTeton } from "./grte";
import { lassenVolcanic } from "./lavo";
import { mountRainier } from "./mora";
import { northCascades } from "./noca";
import { olympic } from "./olym";
import { redwood } from "./redw";
import { sequoiaKingsCanyon } from "./seki";
import { arches } from "./arch";
import { canyonlands } from "./cany";
import { capitolReef } from "./care";
import { antelopeCanyon } from "./ante";
import { horseshoeBend } from "./hsbd";
import { monumentValley } from "./mova";
import { theWave } from "./wave";
import { banff } from "./banf";
import { jasper } from "./jasp";
import { yoho } from "./yoho";
import { joshuaTree } from "./jotr";
import { rockyMountain } from "./romo";
import { glacier } from "./glac";
import { kenaiFjords } from "./kefj";
import { wrangellStElias } from "./wrst";
import { whiteSands } from "./whsa";
import { carlsbadCaverns } from "./cave";
import { mesaVerde } from "./meve";
import { petrifiedForest } from "./pefo";
import { greatSandDunes } from "./grsa";
import { blackCanyon } from "./blca";
import { hawaiiVolcanoes } from "./havo";
import { haleakala } from "./hale";
import { glacierBay } from "./glba";
import { gatesOfTheArctic } from "./gaar";
import { kobukValley } from "./kova";
import { katmai } from "./katm";
import { lakeClark } from "./lacl";
import { pinnacles } from "./pinn";
import { greatBasin } from "./grba";
import { bigBend } from "./bibe";
import { theodoreRoosevelt } from "./thro";
import { badlands } from "./badl";
import { windCave } from "./wica";
import { saguaro } from "./sagu";
import { guadalupeMountains } from "./gumo";
import { shenandoah } from "./shen";
import { newRiverGorge } from "./neri";
import { acadia } from "./acad";
import { everglades } from "./ever";
import { biscayne } from "./bisc";
import { dryTortugas } from "./drto";
import { greatSmokyMountains } from "./grsm";
import { mammothCave } from "./maca";
import { congaree } from "./cong";
import { hotSprings } from "./hosp";
import { cuyahogaValley } from "./cuva";
import { indianaDunes } from "./indu";
import { gatewayArch } from "./jeff";
import { isleRoyale } from "./isro";
import { voyageurs } from "./voya";
import { virginIslands } from "./viis";
import { americanSamoa } from "./npsa";
import { chiricahua } from "./chir";
import { alltrailsParkTop as alltrailsParkTopRaw, alltrailsPlaces, type AllTrailsParkTrail, type AllTrailsPlace } from "./alltrails.generated";
import { alltrailsDoubtful } from "./alltrails-doubtful.generated";
import { trails, type TrailPath } from "./trails.generated";
import type { Attraction, GooglePlace, ParkingRule, Photo, Suitability } from "./types";
import { yellowstone } from "./yell";
import { yosemite } from "./yose";
import { zion } from "./zion";

export type { Attraction, AttractionKind, GooglePlace, Hazard, Hike, ParkingRule, Photo, Suitability, TimeOfDay } from "./types";
export type { AllTrailsParkTrail, AllTrailsPlace } from "./alltrails.generated";
export { alltrailsParkCounts } from "./alltrails.generated";
export type { TrailPath } from "./trails.generated";

export interface AttractionWithPhoto extends Attraction {
  /** 主图，等于 gallery 第一张 */
  photo?: Photo;
  /** 图集（Wikimedia Commons），最多 6 张 */
  gallery: Photo[];
  /** Google Maps 评分和评论数快照；徒步（kind 是 hike）不挂，步道只看 AllTrails */
  google?: GooglePlace;
  /** 本公园内按 Google 评论数的热度排名，从 1 开始；徒步、游客中心、园外景点和没有 Google 数据的景点不排 */
  hotRank?: number;
  /** AllTrails 步道评分、评价数、综合热度与直达路径；对上的多半不是同一条路线的（alltrails-doubtful）不挂 */
  alltrails?: AllTrailsPlace;
  /** 本公园内带徒步数据的景点的 AllTrails 热度排名，从 1 开始；徒步景点的热度只看它（lib/popularity.ts） */
  hikeRank?: number;
  /** 按 OpenStreetMap 步道算出的路线 */
  trailLine?: TrailPath;
  /** 博主对这个景点的看法（creators.ts），和出现在几条博主路线里 */
  creatorNotes?: CreatorNote[];
  creatorRouteCount?: number;
  /** 明星在这里公开发过的照片（celebrities.ts） */
  celebrityShots?: CelebrityShot[];
  /** 电影、电视剧在这里取过景（films.ts） */
  filmShots?: FilmSpot[];
  /** 旺季早上就停满的停车场（parking.ts） */
  parking?: ParkingRule;
  /** 带小孩、老人、轮椅能不能去（suitability/） */
  family?: Suitability;
}

export interface CreatorNote {
  routeId: string;
  creator: string;
  platform: "youtube" | "bilibili";
  language: CreatorLanguage;
  url: string;
  text: string;
}

const creatorNotes = new Map<string, CreatorNote[]>();
const creatorRouteCounts = new Map<string, number>();
for (const route of creatorRoutes) {
  for (const note of route.notes ?? []) {
    creatorNotes.set(note.stop, [
      ...(creatorNotes.get(note.stop) ?? []),
      { routeId: route.id, creator: route.creator, platform: route.platform, language: route.language, url: route.url, text: note.text },
    ]);
  }
  for (const id of new Set(route.route?.flatMap((day) => day.stops) ?? [])) {
    creatorRouteCounts.set(id, (creatorRouteCounts.get(id) ?? 0) + 1);
  }
}

/**
 * 步道只用 AllTrails 的数据，不看 Google Maps（徒步的 Google 评分、评论数、名次都不挂）。
 * 对上的 AllTrails 步道多半不是同一条路线的（scripts/check-hikes.mjs 查出来的，比如巨人柱的 Tanque Verde 观景点来回 1.2 英里，
 * 对上的是 5.3 英里到 Tanque Verde Dome 那条）不挂 AllTrails：评分、评价数、热度名次都不显示，距离、爬升按我们自己的数据，链接改成搜索
 */
const doubtful = new Set(alltrailsDoubtful);

const withData: AttractionWithPhoto[] = [
  ...yosemite,
  ...sequoiaKingsCanyon,
  ...channelIslands,
  ...redwood,
  ...lassenVolcanic,
  ...craterLake,
  ...mountRainier,
  ...olympic,
  ...northCascades,
  ...yellowstone,
  ...grandTeton,
  ...deathValley,
  ...zion,
  ...bryceCanyon,
  ...grandCanyon,
  ...denali,
  ...arches,
  ...canyonlands,
  ...capitolReef,
  ...antelopeCanyon,
  ...horseshoeBend,
  ...monumentValley,
  ...theWave,
  ...banff,
  ...jasper,
  ...yoho,
  ...joshuaTree,
  ...rockyMountain,
  ...glacier,
  ...kenaiFjords,
  ...wrangellStElias,
  ...whiteSands,
  ...carlsbadCaverns,
  ...mesaVerde,
  ...petrifiedForest,
  ...greatSandDunes,
  ...blackCanyon,
  ...hawaiiVolcanoes,
  ...haleakala,
  ...glacierBay,
  ...gatesOfTheArctic,
  ...kobukValley,
  ...katmai,
  ...lakeClark,
  ...pinnacles,
  ...greatBasin,
  ...bigBend,
  ...theodoreRoosevelt,
  ...badlands,
  ...windCave,
  ...saguaro,
  ...guadalupeMountains,
  ...shenandoah,
  ...newRiverGorge,
  ...acadia,
  ...everglades,
  ...biscayne,
  ...dryTortugas,
  ...greatSmokyMountains,
  ...mammothCave,
  ...congaree,
  ...hotSprings,
  ...cuyahogaValley,
  ...indianaDunes,
  ...gatewayArch,
  ...isleRoyale,
  ...voyageurs,
  ...virginIslands,
  ...americanSamoa,
  ...chiricahua,
].map((attraction) => ({
  ...attraction,
  photo: gallery[attraction.id]?.[0],
  gallery: gallery[attraction.id] ?? [],
  google: attraction.kind === "hike" ? undefined : googlePlaces[attraction.id],
  alltrails: doubtful.has(attraction.id) ? undefined : alltrailsPlaces[attraction.id],
  trailLine: trails[attraction.id],
  parking: parkingRules[attraction.id],
  family: suitability[attraction.id],
}));

// 游客中心人人都会路过，评论多不代表值得专门去；园外的镇子、景点（比如 Jackson 镇广场）也不算公园的热度，都不参与排名。
// 徒步没有 Google 数据（上面去掉了），只在 hikeRank 里按 AllTrails 排
const hotRanks = new Map<string, number>();
const hikeRanks = new Map<string, number>();
for (const park of new Set(withData.map((attraction) => attraction.park))) {
  withData
    .filter(
      (attraction) =>
        attraction.park === park && attraction.google && attraction.kind !== "visitor" && !attraction.outsidePark,
    )
    .sort((a, b) => b.google!.reviews - a.google!.reviews)
    .forEach((attraction, index) => hotRanks.set(attraction.id, index + 1));

  withData
    .filter((attraction) => attraction.park === park && attraction.hike && attraction.alltrails && !attraction.outsidePark)
    .sort(
      (a, b) =>
        b.alltrails!.popularity - a.alltrails!.popularity || b.alltrails!.reviews - a.alltrails!.reviews,
    )
    .forEach((attraction, index) => hikeRanks.set(attraction.id, index + 1));
}

export const attractions: AttractionWithPhoto[] = withData.map((attraction) => ({
  ...attraction,
  hotRank: hotRanks.get(attraction.id),
  hikeRank: hikeRanks.get(attraction.id),
  creatorNotes: creatorNotes.get(attraction.id),
  creatorRouteCount: creatorRouteCounts.get(attraction.id),
  celebrityShots: celebrityShots.filter((shot) => shot.attraction === attraction.id),
  filmShots: filmSpots.filter((shot) => shot.attraction === attraction.id),
}));

/**
 * AllTrails 上每座公园最热门的步道（徒步页）。对上的多半不是同一条路线的，去掉和我们景点的对应：
 * 这条 AllTrails 步道照样列出来（数字是它自己的），但不再当成我们的景点（不借我们的中文名、轨迹、海拔，加进行程按 AllTrails 步道算）
 */
export const alltrailsParkTop: Record<string, AllTrailsParkTrail[]> = Object.fromEntries(
  Object.entries(alltrailsParkTopRaw).map(([park, list]) => [
    park,
    list.map(({ attractionId, ...trail }) =>
      attractionId && !doubtful.has(attractionId) ? { ...trail, attractionId } : trail,
    ),
  ]),
);

export function getParkAttractions(parkCode: string): AttractionWithPhoto[] {
  return attractions.filter((attraction) => attraction.park === parkCode);
}
