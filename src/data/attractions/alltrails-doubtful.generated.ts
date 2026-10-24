// 由 scripts/check-hikes.mjs 生成，请勿手改：对上的 AllTrails 步道多半不是同一条路线（距离或爬升差好几倍）的徒步景点。
// 行程引擎挑步道时不拿这些的 AllTrails 热度（generate-trip.ts 的 trailRanks）。重跑：npm run check:hikes
export const alltrailsDoubtful: string[] = [
  "cave-desert-nature-trail",
  "grsm-laurel-falls",
  "hale-halemauu-trail",
  "havo-kupinai-pali",
  "indu-3-dune-challenge",
  "jasp-mount-edith-cavell",
  "noca-diablo-lake-trail",
  "noca-rainy-lake",
  "noca-thunder-knob",
  "npsa-pola-island",
  "sagu-tanque-verde-ridge"
];
