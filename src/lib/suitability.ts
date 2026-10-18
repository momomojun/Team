import type { Hazard, Suitability } from "../data/attractions/types";

/** 同行的人：最小的孩子几岁、推不推婴儿车、有没有老人或体力一般的、有没有坐轮椅的。都不填就是全是成年人 */
export interface Party {
  youngestKid?: number;
  stroller?: boolean;
  seniors?: boolean;
  wheelchair?: boolean;
}

export type FitLevel = "ok" | "caution" | "no";

/**
 * 为什么不适合、要注意什么：
 * minAge 官方年龄下限；kidsAge 建议的孩子年龄；stroller 婴儿车推不了或只能推一段；wheelchair 轮椅去不了或要协助；
 * seniors 老人不建议或量力而行；hazard 带孩子或老人要小心的危险
 */
export type FitReason =
  | { kind: "minAge"; age: number }
  | { kind: "kidsAge"; age: number }
  | { kind: "stroller"; value: "partial" | "no" }
  | { kind: "wheelchair"; value: "assisted" | "partial" | "no" }
  | { kind: "seniors"; value: "caution" | "no"; serious?: boolean }
  | { kind: "carrier"; under: number }
  | { kind: "hazard"; hazard: Hazard; who: "kids" | "seniors" };

export interface Fit {
  level: FitLevel;
  reasons: FitReason[];
  /** 决定不去的原因（level 是 no 时才有） */
  blocking: FitReason[];
  /** 能去，但要请用户务必慎重考虑（婴儿要背着爬梯子、带老人走特别累的路线）：行程里用最醒目的样式提醒 */
  serious: boolean;
}

const SEVERITY: Record<FitLevel, number> = { ok: 0, caution: 1, no: 2 };

/** 带孩子要多小心的危险 */
const KID_HAZARDS: Hazard[] = ["dropoff", "scramble", "thermal", "flashFlood", "water", "wildlife"];
/** 老人、体力一般的要多小心的危险 */
const SENIOR_HAZARDS: Hazard[] = ["heat", "altitude", "scramble", "motion", "remote"];

export const hasParty = (party: Party | undefined): party is Party =>
  party !== undefined &&
  (party.youngestKid !== undefined || party.stroller === true || party.seniors === true || party.wheelchair === true);

/**
 * 这群人去这个景点合不合适：no 是不建议去（自动生成攻略不排），caution 是能去但要注意（排进去、标出提醒）。
 * 婴儿车推不了不算不能去（可以用背带），只提醒
 */
export function fitFor(party: Party | undefined, suitability: Suitability | undefined): Fit {
  const reasons: FitReason[] = [];
  const blocking: FitReason[] = [];
  if (!hasParty(party) || !suitability) return { level: "ok", reasons, blocking, serious: false };
  let level: FitLevel = "ok";
  let serious = false;
  const add = (reason: FitReason, reasonLevel: FitLevel) => {
    reasons.push(reason);
    if (reasonLevel === "no") blocking.push(reason);
    if (SEVERITY[reasonLevel] > SEVERITY[level]) level = reasonLevel;
  };
  const kid = party.youngestKid;
  if (kid !== undefined) {
    if (suitability.minAge !== undefined && kid < suitability.minAge) add({ kind: "minAge", age: suitability.minAge }, "no");
    else if (kid < suitability.kidsFromAge) {
      // 背在背带里也能去的（梅萨维德崖居）：照排，但要醒目提醒；背不动、又爬不了的年龄照旧不排
      if (suitability.carrierUnder !== undefined && kid < suitability.carrierUnder) {
        add({ kind: "carrier", under: suitability.carrierUnder }, "caution");
        serious = true;
      } else add({ kind: "kidsAge", age: suitability.kidsFromAge }, "no");
    }
  }
  if (party.stroller && suitability.stroller !== "yes") add({ kind: "stroller", value: suitability.stroller }, "caution");
  if (party.wheelchair && suitability.wheelchair !== "yes") {
    add({ kind: "wheelchair", value: suitability.wheelchair }, suitability.wheelchair === "no" ? "no" : "caution");
  }
  if (party.seniors && suitability.seniors !== "ok") {
    const seriousSeniors = suitability.seniors === "caution" && suitability.seniorsSerious === true;
    add({ kind: "seniors", value: suitability.seniors, ...(seriousSeniors ? { serious: true } : {}) }, suitability.seniors === "no" ? "no" : "caution");
    if (seriousSeniors) serious = true;
  }
  const withKids = kid !== undefined || party.stroller === true;
  for (const hazard of suitability.hazards ?? []) {
    if (withKids && KID_HAZARDS.includes(hazard)) add({ kind: "hazard", hazard, who: "kids" }, "caution");
    else if ((party.seniors || party.wheelchair) && SENIOR_HAZARDS.includes(hazard)) {
      add({ kind: "hazard", hazard, who: "seniors" }, "caution");
    }
  }
  return { level, reasons, blocking, serious: serious && blocking.length === 0 };
}
