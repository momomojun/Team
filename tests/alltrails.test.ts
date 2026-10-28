import assert from "node:assert/strict";
import test from "node:test";
import { alltrailsAttractionUrl, alltrailsParkUrls, alltrailsTrailUrl } from "@/data/alltrails";
import { alltrailsParkCounts, alltrailsParkTop, attractions, getParkAttractions } from "@/data/attractions";

test("AllTrails 数据集：户外徒步景点均匹配直达步道链接，园内步道热度排名按 popularity 降序", () => {
  const hikes = attractions.filter((a) => a.hike);
  const matched = hikes.filter((a) => a.alltrails);
  // 对上的多半不是同一条路线的（alltrails-doubtful，11 条）不挂 AllTrails
  assert.ok(matched.length >= 404, `至少匹配 404 条徒步路线，实际 ${matched.length}`);

  for (const a of matched) {
    const info = a.alltrails!;
    assert.ok(info.slug.includes("/"), `${a.id} 的 slug 格式合法：${info.slug}`);
    assert.ok(info.rating >= 1 && info.rating <= 5, `${a.id} 的评分在 1–5 之间`);
    assert.ok(info.reviews >= 0, `${a.id} 的评价数非负`);
    assert.ok(info.popularity > 0, `${a.id} 的热度指数大于 0`);
    assert.equal(
      alltrailsAttractionUrl(a, "Yosemite National Park"),
      alltrailsTrailUrl(info.slug),
      `${a.id} 优先返回 AllTrails 步道直达链接`,
    );
  }

  // 优胜美地：Mist Trail (Vernal Fall) 的步道热度应排第 1
  const yoseHikes = getParkAttractions("yose")
    .filter((a) => a.hike && a.hikeRank !== undefined)
    .sort((a, b) => a.hikeRank! - b.hikeRank!);
  assert.equal(yoseHikes[0]?.id, "yose-mist-trail");
  for (let i = 1; i < yoseHikes.length; i++) {
    assert.ok(
      yoseHikes[i - 1]!.alltrails!.popularity >= yoseHikes[i]!.alltrails!.popularity,
      `园内 hikeRank 按 AllTrails 热度降序排列`,
    );
  }
});

test("AllTrails 公园热门步道榜单：覆盖所有有步道的国家公园且按热度降序排列", () => {
  const parkCodes = Object.keys(alltrailsParkTop);
  assert.ok(parkCodes.length >= 65, `至少覆盖 65 座公园，实际 ${parkCodes.length}`);

  for (const code of parkCodes) {
    const list = alltrailsParkTop[code]!;
    assert.ok(list.length > 0 && list.length <= 40);
    assert.ok((alltrailsParkCounts[code] ?? 0) >= list.length);
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]!;
      const curr = list[i]!;
      assert.ok(
        prev.popularity > curr.popularity || (prev.popularity === curr.popularity && prev.reviews >= curr.reviews),
        `${code} 榜单第 ${i} 与第 ${i + 1} 条按热度降序`,
      );
    }
  }

  assert.ok(alltrailsParkUrls("yose").length === 1);
  assert.ok(alltrailsParkUrls("seki").length === 2);
});
