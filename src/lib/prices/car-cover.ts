/**
 * 柜台保险的估算，不是报价。
 * 美国机场柜台的碰撞险（LDW / CDW）公开报道里常见大约每天 $15–$35，责任险（SLI）大约每天 $10–$20。
 * 这里取区间中间，方便和“信用卡已经含碰撞险”比较。各机场、各公司、淡旺季都不一样。
 */
export const LDW_PER_DAY = 25;
export const SLI_PER_DAY = 15;

/** 取还车和参考价快照里已经写明的情况，没有写的机场不另做判断 */
export const pickupNotes = {
  LAX: "offAirport",
  MIA: "offAirport",
  FLL: "offAirport",
  WYS: "seasonal",
  CNY: "scarce",
  DRO: "scarce",
} as const;

export type PickupNote = (typeof pickupNotes)[keyof typeof pickupNotes];
