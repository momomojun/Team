import { useSyncExternalStore } from "react";

export { nlrCheckKey, pointCheckKey } from "./place-check-keys";

// 充电桩打卡存在这台设备上：没有账号，不上传
const STORAGE_KEY = "nps-guide:place-checks";

export type CheckStatus = "works" | "broken" | "missing";

export interface PlaceCheck {
  status: CheckStatus;
  /** ISO 时间 */
  at: string;
}

export type CheckStore = Record<string, PlaceCheck>;

const EMPTY: CheckStore = {};
let cachedRaw: string | null = null;
let cached: CheckStore = EMPTY;
const listeners = new Set<() => void>();

function read(): CheckStore {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? (JSON.parse(raw) as CheckStore) : EMPTY;
    } catch {
      cached = EMPTY;
    }
  }
  return cached;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePlaceChecks(): CheckStore {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** 再点一次同一个状态就取消 */
export function savePlaceCheck(id: string, status: CheckStatus) {
  const current = read();
  const next = { ...current };
  if (current[id]?.status === status) delete next[id];
  else next[id] = { status, at: new Date().toISOString() };
  cachedRaw = JSON.stringify(next);
  cached = next;
  window.localStorage.setItem(STORAGE_KEY, cachedRaw);
  listeners.forEach((listener) => listener());
}
