# 5 条步道的爬升按 NPS 官网重查（2026-10-28）

[elevation-check.md](elevation-check.md) 里“资料多半写错了”的 5 条（AllTrails 和我们的高程剖面都比资料高得多），逐条打开 NPS 的页面核对。

结论：资料里的数字大多是照 NPS 抄的，没有抄错，但 NPS 写的是 **Elevation Change**（最高点和最低点的高差），不是一路上上下下的累计爬升。我们的字段 `hike.gainFt` 是累计爬升（`types.ts`），页面上显示成“爬升 X 米”。走在岩鳍、光滑岩坡、崖壁上来回起伏的步道，两个数差得很多；NPS 自己在切斯勒公园的页面上也写了“Cumulative elevation gain on this route is much greater”。

累计爬升 NPS 没有给，所以改成我们自己的高程剖面算的（`npm run data:elevation`，和 AllTrails 上 234 条步道比中位数 1.01 倍）：往返的取去程的爬升、环线取一圈，取整到 10 英尺。画出来的路线比资料短 15% 以上的（魔鬼花园：没画进去几条岔路）改用 AllTrails 的数。

| 步道 | NPS 写的 | 原来的 `gainFt` | 高程剖面 | AllTrails | 改成 |
|---|---|---|---|---|---|
| 拱门 魔鬼花园原始步道环线（`arch-devils-garden-loop`） | 全程 7.9 英里，Elevation Change 286 ft（87 m） | 286 | 207 米（画出来的路线 6.5 英里） | 291 米（8.1 英里） | **950**（按 AllTrails） |
| 拱门 双 O 拱门（`arch-double-o-arch`） | 往返 4.0 英里，Elevation Change 275 ft（84 m）；现在的 Devils Garden 页面写 4.1 英里、“steeply climbs up and on the sandstone fins”，没写爬升 | 275 | 去程 162 米 | 158 米 | **530** |
| 峡谷地 切斯勒公园观景垭口（`cany-chesler-park`） | 往返 5.8 英里，3–4 小时，Overall Elevation Change 533 ft（162 m），“Cumulative elevation gain on this route is much greater” | 533 | 去程 249 米 | 293 米 | **820** |
| 尖峰石阵 Balconies 洞穴与崖壁环线（`pinn-balconies-cave`） | Trails of Pinnacles 页面：2.4 英里环线，100 ft；Things To Do 页面：约 2.4 英里，1–2 小时，“Maximum grade: 200 feet”，没写爬升 | 100 | 一圈 125 米 | 116 米 | **410** |
| 巨人柱 Tanque Verde 山脊步道（观景点）（`sagu-tanque-verde-ridge`） | “head up about 0.6 miles (roughly 100ft elevation) to the overlook area” | 100 | 原来 227 米（画到了 1.3 英里外） | 462 米（对上的是走到 Crested Saguaro 的长路线，在 AllTrails 存疑名单里） | 不变 |

- **Tanque Verde 是路线画错了，不是爬升写错了**：景点的点放在步道口往上约 1.3 英里的山脊上（步道先往南、再折向东北），路线一直画到那里。按 NPS 的 0.6 英里，把点挪到路线上 0.6 英里处（32.1586, -110.72088），`UPDATE=sagu-tanque-verde-ridge npm run data:trails` 重画（0.97 公里），再重算剖面：去程爬升 73 米。比 NPS 的“大约 100 英尺”多一些，高程模型 30 米一格，这么短的路差几十米说不准，资料照 NPS 写的不变。
- 拿不准的：AllTrails 和高程剖面算法不同，同一条步道的累计爬升差 10–30% 很常见；改的数字是“大约”，比原来更接近走起来的感觉，不是精确值。没找到 NPS 写累计爬升的页面（魔鬼花园的 2017、2018 年步道导览 PDF 也只写距离）。

来源：

- https://www.nps.gov/arch/planyourvisit/devils-garden.htm
- https://www.nps.gov/places/devils-garden-trailhead.htm
- https://www.nps.gov/places/chesler-park-viewpoint-and-trail.htm
- https://www.nps.gov/pinn/planyourvisit/trails.htm
- https://www.nps.gov/thingstodo/pinnacles-hike-balconies-cliffs-trail-balconies-cave-trail.htm
- https://www.nps.gov/places/tanque-verde-ridge-trail.htm
