// 电影同款的取景地照片：src/data/films.ts 里每条的 photoFile（Wikimedia Commons 文件名），查缩略图、作者和授权，
// 写到 src/data/films-photos.generated.ts。只收允许转载的授权（CC BY、CC BY-SA、CC0、公有领域），其余报错。
// 用法：npm run data:film-photos
import { writeFileSync } from "node:fs";
import { USER_AGENT } from "./load-data.mjs";
import { filmShots } from "../src/data/films.ts";

const API = "https://commons.wikimedia.org/w/api.php";
const OUTPUT = new URL("../src/data/films-photos.generated.ts", import.meta.url);
const THUMB_WIDTH = 960;
/** 允许的授权：署名、署名-相同方式共享、CC0、公有领域；NC（非商业）、ND（禁止演绎）不收 */
const ALLOWED = /^(CC BY(-SA)? [\d.]+( [A-Za-z-]+)?|CC0|Public domain|PD.*)$/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const plainText = (html) =>
  (html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\(talk\s*·\s*contribs\)/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

async function lookup(titles) {
  const url = new URL(API);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: String(THUMB_WIDTH),
    iiextmetadatafilter: "Artist|Credit|LicenseShortName",
    titles: titles.join("|"),
  });
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(30_000) }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      if (!data.error) return data.query?.pages ?? [];
    }
    await sleep(3000 * (attempt + 1));
  }
  throw new Error(`Commons 查询失败：${titles.join(", ")}`);
}

const files = [...new Set(filmShots.map((shot) => shot.photoFile).filter(Boolean))];
const photos = {};
const problems = [];
// Commons 一次最多查 50 个标题
for (let i = 0; i < files.length; i += 50) {
  const batch = files.slice(i, i + 50);
  const pages = await lookup(batch.map((file) => `File:${file}`));
  for (const page of pages) {
    const file = page.title.replace(/^File:/, "");
    const info = page.imageinfo?.[0];
    if (page.missing || !info) {
      problems.push(`找不到：${file}`);
      continue;
    }
    const meta = info.extmetadata ?? {};
    const license = plainText(meta.LicenseShortName?.value);
    if (!ALLOWED.test(license)) {
      problems.push(`授权不能用（${license}）：${file}`);
      continue;
    }
    const url = info.thumburl.split("?")[0];
    const largeWidth = [1920, 1280].find((width) => info.width >= width);
    photos[file] = {
      url,
      large: largeWidth ? url.replace(`/${THUMB_WIDTH}px-`, `/${largeWidth}px-`) : info.url,
      width: info.thumbwidth,
      height: info.thumbheight,
      page: info.descriptionurl,
      author: plainText(meta.Artist?.value) || plainText(meta.Credit?.value) || "Unknown",
      license,
    };
  }
  // Commons 返回的标题会把下划线换成空格；按 films.ts 里的写法对一遍
  for (const file of batch) {
    const normalized = file.replace(/_/g, " ");
    if (!photos[file] && photos[normalized]) photos[file] = photos[normalized];
  }
}

writeFileSync(
  OUTPUT,
  `// 由 scripts/build-film-photos.mjs 生成，不要手改：电影同款取景地照片（Commons 文件名 → 缩略图、作者、授权）\n` +
    `import type { Photo } from "./attractions/types";\n\n` +
    `export const filmPhotos: Record<string, Photo> = ${JSON.stringify(photos, null, 2)};\n`,
);
console.log(`${Object.keys(photos).length} 张照片${problems.length ? `；有问题的 ${problems.length} 张：\n${problems.join("\n")}` : ""}`);
if (problems.length) process.exitCode = 1;
