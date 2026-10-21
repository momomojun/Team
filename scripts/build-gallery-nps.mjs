// 给景点补 NPS 官方的照片：NPS 的员工、志愿者拍的照片是美国政府作品，属于公有领域，可以直接用（署名“NPS Photo”）。
// Commons（build-gallery.mjs）上照片少、或者只有别处照片的景点，从 NPS API 的两个地方找：
//   1. places：公园网站上每个地点自带的照片，署名以 NPS 开头的才收（别的是借来的、有版权）
//   2. multimedia/galleries/assets：公园相册里标了 Public domain 的
// 按名字对到景点：地点名、照片的标题和说明里写了景点的英文名（或者名字里有分量的词都在），地点还可以按距离（150 米内）对。
// 输出 src/data/attractions/gallery-nps.generated.ts，和 Commons 的分开放，重挑 Commons 的照片不会冲掉；
// 两边在 src/data/attractions/gallery.ts 合起来。
// 用法：PARKS=maca,cong npm run data:gallery-nps（只跑这几座公园，别的公园原来的保留）；要 .env.local 里的 DATA_GOV_API_KEY
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { attractions, sleep, USER_AGENT } from "./load-data.mjs";

// sharp 是 Next 自带的图片库：用来量宽高、认黑白照片；万一没有就只按 JPEG 头读宽高、不认黑白
const sharp = await import("sharp").then((mod) => mod.default).catch(() => null);

const ENV_FILE = new URL("../.env.local", import.meta.url);
if (existsSync(ENV_FILE)) process.loadEnvFile(fileURLToPath(ENV_FILE));
const API_KEY = process.env.DATA_GOV_API_KEY || "DEMO_KEY";
const API = "https://developer.nps.gov/api/v1";
const OUTPUT = new URL("../src/data/attractions/gallery-nps.generated.ts", import.meta.url);
/** 每个景点最多补几张（Commons 的在前面，合起来最多 8 张，见 gallery.ts） */
const PER_ATTRACTION = 4;
const NEAR_M = 150;
const PAGE = 500;
/** 接口返回的原始数据存一份（系统临时目录），调过滤规则重跑时不用再花接口次数；REFRESH=1 重新取 */
const CACHE = process.env.NPS_CACHE ?? join(tmpdir(), "nps-gallery-cache");
mkdirSync(CACHE, { recursive: true });

/** 人工看过、不合适的（按照片标题或地点名开头匹配，带“/”的按网址里的一段）。公园代码对这座公园的景点生效，景点 id 只对那个景点 */
// 10-21 逐张看过（全部公园约 1200 张）：导览牌和告示亭、监控相机拍的熊、油画、明信片、地图、墓碑、拼图、工作人员、礼品店、剪彩、狗、垃圾桶、重复的（按网址里的一段排除）
const EXCLUDE = {
  hosp: ["GetAsset/0C9F3816-1218-4398-AB35-121541FEE5CD", "GetAsset/B774B105-A308-45A7-9081-243193955AC9", "GetAsset/E0234257-7A00-4402-9883-D7C68AD8B38A", "GetAsset/FD9B7FA5-5099-4FAC-9633-B802B03ADDD8", "GetAsset/45B38E36-565F-4B39-AB16-BBCECC2064BA", "GetAsset/ED2B8FE7-A6DD-42D8-9BCA-CD2A5372D6E4"],
  cuva: ["/C5EB50A6-9F37-D0CE-55BC8DF7B9D37FB6", "/8F18DFA9-D10E-D1D8-ACA90C6AA876E4EC", "/BED78ACC-D23D-4C95-44DDCB2E3CABF376", "/004F0793-C0D1-EEF5-8C783912363F9E48", "/966B5F82-EF2C-07DD-1AE8307204C64992", "/C6637E9F-C62C-E58B-84FD74991F718CC3", "/8526C1FB-C824-2966-0C3BF88C119D9C48", "/0146560B-E5F0-F135-E0A9276717ED8677", "/6997ED14-F8F6-AD9D-0567F42CA1F4FDC1", "/263B3761-A766-2D1E-FBED7F8FAEC52117", "/FADA0A99-0AA3-4CCA-0F44F6E0D5A6CC6D", "/FDAD8BF6-FE4E-CEAB-75195BF530593442", "/CEBA8501-F027-2148-E82306E2B39D4112", "GetAsset/46D35E59-3A32-4708-A3B6-A835C6C1BA19", "GetAsset/621A5CED-5950-4270-8C81-F6F221A25C4B"],
  indu: ["GetAsset/B1E705E7-F025-442F-8B60-EAABBE0330D1", "GetAsset/0B8C5433-155D-4519-3ED6-7C243379784A", "GetAsset/0C06E5CE-155D-4519-3E06-0C34488A717E", "/F0486D14-C38B-3466-52F14B64190F3CBD", "GetAsset/686F64F6-155D-4519-3EF0-F15C3B59942E", "GetAsset/6600C978-155D-4519-3E76-6BD59D35ADBD"],
  chir: ["GetAsset/AC83B36B-E59F-40C3-A9C3-768939776BF7", "GetAsset/313C2795-02E9-4D5C-9683-CF5ACE20DF8B", "GetAsset/FAAEA55C-E5BF-47F1-AC1A-4341F4996CEA", "GetAsset/BEF2ED75-A729-42AA-81B0-ADC98EA6F084", "GetAsset/795A6A6A-2E97-46CA-A252-F4ED5C03C9E7", "GetAsset/F008BE0F-46AF-4B26-B415-7B8DE983BBB3", "GetAsset/B7DAA0A3-FD3B-4410-995E-3A3BB6897D5F"],
  maca: ["GetAsset/159FDAD4-419A-474E-8F86-07F845578D44"],
  isro: ["/269140BA-F8B4-FC53-49106F5BD2CA5440", "GetAsset/B280612C-3AC6-47A2-AC4F-2F61DDF22739", "GetAsset/C3C13143-62E8-4F58-AD41-810EB4113426", "GetAsset/DFE7E73B-EA76-4C5D-9FAD-FDFFB1EF35F8", "GetAsset/49E62B6C-047A-410E-89E6-71920EC2DDD0"],
  voya: ["GetAsset/9C35F0C1-4BBB-436F-BBEE-EFD29AF78460", "GetAsset/FF382923-C0BC-464D-A043-98E65107ABAA", "GetAsset/C9968044-0373-5DAA-DFAE-A6E59B51EF11"],
  yose: ["GetAsset/C3D20945-5E48-4354-B3F5-62E74967494C"],
  chis: ["/2C51976B-AEEB-8C54-4FF497BD77C45320"],
  redw: ["GetAsset/6580CCF3-1DD8-B71B-0BD0-C5317B2D2C53", "GetAsset/988D8AEF-D712-4134-B51E-FB210D85D777", "GetAsset/0F8908E0-9F83-4C0C-9563-85F93ADCD561"],
  lavo: ["GetAsset/C69B4D65-155D-4519-3E58-54998C774F42", "GetAsset/91B349F9-947D-4272-B7A6-367582B131BA", "GetAsset/09E6758A-62DA-4104-B695-C47691507E60"],
  crla: ["/E9950DB6-D4B3-7808-8BB5141807A5C16E"],
  olym: ["GetAsset/17FD6FAB-F76E-40FB-B2B9-FA83C081D5FC", "GetAsset/4E964174-A0FD-482B-848F-F93D56A9F244", "/8AAA70A6-B982-CB99-FD7192AEEF46A867"],
  yell: ["GetAsset/BBA3D3DE-2D86-41EB-8CC6-59B2B5FF3A60"],
  deva: ["GetAsset/B76254B9-3F33-434E-9878-51A1BDC57ACB"],
  zion: ["GetAsset/CCF3CD3B-11C4-46CB-AC68-B513BD239459", "GetAsset/356EE7F9-F33B-45F8-887B-93FF102F4A0A"],
  brca: ["/868EC945-E069-33E3-9F1A82E924D573CD", "/020CDBA4-093F-853C-D8938FF31D35C869"],
  grca: ["GetAsset/8C0F3F8B-003C-460C-87A5-637BC23AE3AC", "/6875756C-ED77-A5D5-35928F3B84535B42"],
  care: ["/2E0C50D4-B68D-DB89-95687991F9120CE4"],
  glac: ["GetAsset/57E1B22B-DC3C-4B62-8758-967AFC31670C", "GetAsset/4B44569E-4E71-4A20-BEC9-CCBE6477D646", "GetAsset/C33C1A62-A3AA-46C9-A9E9-76ABD36FEBD1"],
  kefj: ["GetAsset/BA01D29D-87F2-43DD-BC5B-B8F763FD35B9"],
  wrst: ["/8E74688E-E11E-259A-A19A45D08B9FAD4D"],
  meve: ["GetAsset/425102AF-C69D-4919-8337-230360A82E32"],
  kova: ["GetAsset/FF6BA2C0-1DD8-B71C-072E-B40C7E979F3C", "GetAsset/37507DC7-1DD8-B71C-072F-E2FDFAE1F605"],
  grba: ["GetAsset/42EB2385-5757-479D-99D2-E91916CF2128"],
  bibe: ["/B2644D9D-ED20-4CFD-5BD74AEA80195368"],
  badl: ["GetAsset/C70C857A-11AD-4BC5-8444-595C679E17BB"],
  wica: ["/25F180ED-F034-2DC8-75FE8984ABE89304", "GetAsset/3F7B2504-98CF-4483-9281-4962C02EB99D"],
  neri: ["/B286418A-E2AD-C800-03F80DAACACEBEA0"],
  acad: ["GetAsset/1A0DFA11-155D-451F-6772-D72A28DF5236", "/F0E1B3CB-9803-D645-065DD517C129E689", "/31B79343-B626-ADA5-B7F930A94E155D7C", "GetAsset/7A78A93B-9F09-46C9-8183-56197A10C9F0", "/29260ED6-95EB-7FD6-45C6ACF6DB3C9B13", "GetAsset/18634706-0F1A-4143-8620-694D89B7D3D8", "GetAsset/D30021D5-A5F2-414D-B7FA-6F546F949F97", "GetAsset/E0773403-FB7B-4B6B-B7E2-0F2D1DC7D6E7", "/8FC9627E-DFB8-BC7E-8692E82B2EDA7B3B"],
  ever: ["GetAsset/382D96AC-1DD8-B71C-0797-F67754A7B740", "GetAsset/3830CA52-1DD8-B71C-0709-A06B0B75C071", "GetAsset/6CEAA985-0DAA-47AA-A0D2-43B30372471C"],
  viis: ["GetAsset/D3A89F74-1DD8-B71B-0B76-5A8FF7B42C96"],
};

/** 标题、说明里有这些词的不要：标牌、地图、展板、画、老照片、监控相机、车、人在办公室 */
const BAD_TEXT =
  /\b(signs?|signage|kiosks?|maps?|wayside|exhibits?|panels?|brochures?|posters?|paintings?|artwork|art|illustrations?|drawings?|historic photo|historical photo|archives?|circa|c\. ?1[89]\d\d|1[89]\d\d|19[0-6]\d|trail ?cam(era)?|camera trap|wildlife camera|trucks?|vehicles?|parking|restrooms?|staff|employees?|volunteers?|desk|meeting|workshop|ceremony|award|logo|graphic|diagram|screenshot|printed matter|oil|canvas|watercolou?r|lithograph|engraving|etching|prints?|painted|stylized|portrait|baskets?|basketry|artifacts?|specimens?|cup|objects?|manuscript|journal|letters?|page|writing|documents?|postcards?|poem|poetry|crowd|group of|students|class|junior ranger|ranger-led|ranger program|buses|bus|shuttles?)\b/i;
/** 博物馆藏品的编号（“YOSE 8199”“YOSE 4711: Cup”）：画、器物、老照片，不是风景 */
const CATALOG = /\b[A-Z]{4}\s?\d{3,}\b/;
/** 黑白照片（多半是档案里的老照片）：缩成 24×24 看每个像素的颜色差，平均不到这么多就算黑白 */
const GRAY_SPREAD = 14;

/** 名字里不算数的词：只剩这些的名字（“Visitor Center”）要整个名字出现才算对上 */
const WEAK = new Set(
  "the a an of and at on in to trail trails loop tour tours overlook center visitor visitors point drive road area park national state historic site view views walk river lake creek beach bay".split(" "),
);

const parks = (process.env.PARKS ?? "").split(",").filter(Boolean);
if (parks.length === 0) {
  console.error("用 PARKS=公园代码,… 指定要补照片的公园（比如 PARKS=maca,cong）");
  process.exit(1);
}

async function get(path) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${API}/${path}`, { headers: { "X-Api-Key": API_KEY, "User-Agent": USER_AGENT } });
    if (response.ok) return response.json();
    console.warn(`NPS API ${response.status}：${path}`);
    await sleep(3000 * (attempt + 1));
  }
  throw new Error(`NPS API 一直出错：${path}`);
}

async function all(path) {
  const file = join(CACHE, `${path.replace(/[^a-z0-9]+/gi, "_")}.json`);
  if (!process.env.REFRESH && existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const items = await fetchAll(path);
  writeFileSync(file, JSON.stringify(items));
  return items;
}

async function fetchAll(path) {
  const items = [];
  for (let start = 0; ; start += PAGE) {
    const page = await get(`${path}&limit=${PAGE}&start=${start}`);
    items.push(...page.data);
    if (page.data.length < PAGE || items.length >= Number(page.total)) return items;
    await sleep(300);
  }
}

const plain = (text) =>
  (text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** 景点英文名 → 整个名字和有分量的词（去掉括号里的补充） */
function nameKeys(stop) {
  const phrase = plain(stop.nameEn.replace(/\(.*?\)/g, " "));
  const strong = phrase.split(" ").filter((word) => word.length >= 3 && !WEAK.has(word));
  return { phrase, strong };
}

function names(text, keys) {
  const hay = ` ${plain(text)} `;
  if (keys.phrase && hay.includes(` ${keys.phrase} `)) return true;
  return keys.strong.length > 0 && keys.strong.every((word) => hay.includes(` ${word} `));
}

function meters(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

/** title 可以是照片标题、地点名或者照片网址（按网址里的一段排除） */
function excluded(stop, title) {
  const lower = title.toLowerCase();
  return [...(EXCLUDE[stop.park] ?? []), ...(EXCLUDE[stop.id] ?? [])].some((prefix) => lower.startsWith(prefix.toLowerCase()) || (prefix.includes("/") && lower.includes(prefix.toLowerCase())));
}

/** 下载要显示的那张，量宽高、看是不是黑白；下载不了返回 null */
async function inspect(url) {
  if (!sharp) {
    const size = await jpegSize(url);
    return size && { ...size, gray: false };
  }
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  try {
    const meta = await sharp(buffer).metadata();
    const { data, info } = await sharp(buffer).resize(24, 24, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let spread = 0;
    if (info.channels >= 3) {
      for (let i = 0; i < data.length; i += info.channels) spread += Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);
      spread /= data.length / info.channels;
    }
    return { width: meta.width, height: meta.height, gray: spread < GRAY_SPREAD };
  } catch {
    return null;
  }
}

/** JPEG 的宽高：只下载前 64 KB，读 SOF 段 */
async function jpegSize(url) {
  const response = await fetch(url, { headers: { Range: "bytes=0-65535", "User-Agent": USER_AGENT } });
  if (!response.ok) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  for (let i = 2; i + 9 < bytes.length; ) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: (bytes[i + 5] << 8) | bytes[i + 6], width: (bytes[i + 7] << 8) | bytes[i + 8] };
    }
    i += 2 + length;
  }
  return null;
}

const author = (credit) => credit.replace(/^NPS\s*Photo\s*[/:,-]?\s*/i, "NPS / ").replace(/\s*\/\s*$/, "").trim() || "NPS";

const previous = existsSync(OUTPUT)
  ? JSON.parse(readFileSync(OUTPUT, "utf8").replace(/^[\s\S]*?= /, "").replace(/;\s*$/, ""))
  : {};
/** 每张收下的照片的标题、说明（调过滤规则用，写到临时目录，不进仓库） */
const meta = {};
const result = Object.fromEntries(Object.entries(previous).filter(([id]) => !parks.includes(id.split("-")[0])));

for (const park of parks) {
  const stops = attractions.filter((stop) => stop.park === park);
  const places = await all(`places?parkCode=${park}`);
  const assets = await all(`multimedia/galleries/assets?parkCode=${park}`);
  const used = new Set();
  const found = Object.fromEntries(stops.map((stop) => [stop.id, []]));

  // 1. 地点自带的照片：名字对上，或者离景点（和出发点）很近
  for (const place of places) {
    const at = { lat: Number(place.latitude), lon: Number(place.longitude) };
    const owners = stops.filter((stop) => {
      if (names(place.title, nameKeys(stop))) return true;
      if (!Number.isFinite(at.lat) || !at.lat) return false;
      return [stop, stop.start].filter(Boolean).some((point) => meters(point, at) <= NEAR_M);
    });
    for (const image of place.images ?? []) {
      if (!/^NPS/i.test(image.credit ?? "") || /courtesy/i.test(image.credit) || used.has(image.url)) continue;
      if (BAD_TEXT.test(`${image.title} ${image.altText} ${image.caption}`) || CATALOG.test(`${image.title} ${image.credit}`)) continue;
      for (const stop of owners) {
        if (excluded(stop, place.title) || excluded(stop, image.title ?? "")) continue;
        found[stop.id].push({ kind: "place", image, page: place.url, title: image.title || place.title });
        used.add(image.url);
        break;
      }
    }
  }

  // 2. 相册：标题、替代文字、说明里写了景点的名字
  for (const asset of assets) {
    if (asset.constraintsInfo?.constraint !== "Public domain" || !/jpe?g/i.test(asset.fileInfo?.fileType ?? "")) continue;
    if (used.has(asset.fileInfo.url)) continue;
    const text = `${asset.title} ${asset.altText} ${asset.description}`;
    if (BAD_TEXT.test(text) || CATALOG.test(`${asset.title} ${asset.credit}`)) continue;
    const stop = stops.find((candidate) => names(text, nameKeys(candidate)) && !excluded(candidate, asset.title ?? ""));
    if (!stop) continue;
    found[stop.id].push({ kind: "asset", asset, title: asset.title });
    used.add(asset.fileInfo.url);
  }

  for (const stop of stops) {
    const photos = [];
    // 地点的照片在前（公园网站上挑过的），横图在前
    const candidates = found[stop.id];
    for (const candidate of candidates) {
      if (photos.length >= PER_ATTRACTION) break;
      if (candidate.kind === "place") {
        if (excluded(stop, candidate.image.url)) continue;
        const look = await inspect(candidate.image.url);
        await sleep(150);
        if (!look || look.gray) continue;
        meta[candidate.image.url] = { stop: stop.id, title: candidate.title, alt: candidate.image.altText, caption: candidate.image.caption };
        photos.push({
          url: candidate.image.url,
          width: look.width,
          height: look.height,
          page: candidate.page,
          author: author(candidate.image.credit),
          license: "Public domain (NPS)",
          landscape: look.width >= look.height,
        });
      } else {
        const info = candidate.asset.fileInfo;
        if (excluded(stop, info.url)) continue;
        // 原图常常几 MB，页面上用 NPS 自己的中等尺寸，点开看大图时才用原图
        const url = `${info.url}/proxy/hires`;
        const look = await inspect(url);
        await sleep(150);
        if (!look || look.gray) continue;
        meta[url] = { stop: stop.id, title: candidate.asset.title, alt: candidate.asset.altText, caption: candidate.asset.description, credit: candidate.asset.credit };
        photos.push({
          url,
          large: info.url,
          width: info.widthPixels,
          height: info.heightPixels,
          page: candidate.asset.permalinkUrl,
          author: author(candidate.asset.credit ?? ""),
          license: "Public domain (NPS)",
          landscape: info.widthPixels >= info.heightPixels,
        });
      }
    }
    photos.sort((a, b) => Number(b.landscape) - Number(a.landscape));
    if (photos.length > 0) result[stop.id] = photos.map((photo) => {
      delete photo.landscape;
      return photo;
    });
    else delete result[stop.id];
  }
  const count = stops.filter((stop) => result[stop.id]).length;
  console.log(`${park}：地点 ${places.length} 个、相册 ${assets.length} 张，补到照片的景点 ${count} / ${stops.length}`);
}

const ordered = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(
  OUTPUT,
  `// 由 scripts/build-gallery-nps.mjs 生成，不要手改。NPS 官方的公有领域照片，补在 Commons 的照片后面（见 gallery.ts）
import type { Photo } from "./types";

export const npsGallery: Record<string, Photo[]> = ${JSON.stringify(ordered, null, 2)};
`,
);
writeFileSync(join(CACHE, "meta.json"), JSON.stringify(meta, null, 1));
console.log(`写入 ${Object.keys(ordered).length} 个景点、${Object.values(ordered).flat().length} 张照片`);
