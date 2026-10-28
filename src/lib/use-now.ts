import { startTransition, useEffect, useState } from "react";

// 现在的时间（毫秒），每 30 秒更新一次；从后台切回来时马上更新。“今天”模式算“还有多久日落”“晚了多少”用。
// 放在模块里的一个值：渲染时只读它，不在渲染里调 Date.now()。
// 用它的行程页很大，每 30 秒整页重新渲染一次（开发版要一两百毫秒）：更新放进 startTransition，React 分成小段做、中间让浏览器画画面，
// 正在播的路线动画、滚动不会每 30 秒顿一下（原来用 useSyncExternalStore，更新只能一口气同步做完）

const TICK_MS = 30 * 1000;
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();
/** 播放路线动画时先不报新的时间（行程页太大，切成小段渲染也有一段切不开，动画会顿一下）；播完马上补一次 */
let held = false;

function refresh() {
  now = Date.now();
  if (!held) listeners.forEach((listener) => listener());
}

/** 路线动画开始、结束时调用（park-map.tsx）：播放的这一两分钟里“今天”的倒计时停在原地，播完马上更新 */
export function holdClock(on: boolean) {
  if (held === on) return;
  held = on;
  if (!on && listeners.size > 0) refresh();
}

function onVisible() {
  if (document.visibilityState === "visible") refresh();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(refresh, TICK_MS);
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

/** 现在的时间戳；服务端渲染、还没订阅上时是 null */
export function useNow(): number | null {
  const [value, setValue] = useState<number | null>(null);
  useEffect(() => {
    const update = () => startTransition(() => setValue(now || Date.now()));
    const unsubscribe = subscribe(update);
    // 订阅上以后先给一个值（放到微任务里，不在 effect 里同步改状态）
    queueMicrotask(update);
    return unsubscribe;
  }, []);
  return value;
}
