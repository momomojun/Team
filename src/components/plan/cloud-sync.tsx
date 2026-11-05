"use client";

import { useEffect, useRef } from "react";
import { currentTrip, replaceTrip, useTrip, type Trip } from "@/lib/trip-store";

/** 登录后云端的行程替换掉本机的之前，本机那份存在这里（别的设备上排过的行程更新，但万一想找回本机的） */
export const BEFORE_SYNC_KEY = "nps-trip-before-sync";

/** 一次要上传的：行程和修订号（改的那一刻的时间，服务器只收比库里新的） */
interface Upload {
  trip: Trip;
  rev: number;
}

/** 上传一次，返回成没成（4xx、5xx、断网都算没成） */
async function put({ trip, rev }: Upload, keepalive = false): Promise<boolean> {
  try {
    const response = await fetch("/api/me/trip", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trip, rev }),
      keepalive,
    });
    return response.ok;
  } catch {
    return false;
  }
}

function hasPlans(trip: Trip) {
  return trip.pool.length > 0 || trip.days.some((day) => day.length > 0);
}

/** 登录以后把行程同步到 Neon。没登录（接口 401）就继续只用这台浏览器的 localStorage */
export function CloudSync() {
  const trip = useTrip();
  const ready = useRef(false);
  const skipNext = useRef(false);
  // 上传一个接一个发；服务器按修订号只收新的，所以离开页面时直接发也不会被旧的盖掉
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  // 改了还没发成的：离开页面时补发；发失败了、后面又没有更新的，也留在这里等下次
  const pending = useRef<Upload | null>(null);
  const upload = (next: Upload) => {
    pending.current = null;
    queue.current = queue.current.then(async () => {
      if (!(await put(next)) && pending.current === null) pending.current = next;
    });
  };

  useEffect(() => {
    let cancel = false;
    fetch("/api/me/trip")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { trip?: Trip | null } | null) => {
        if (cancel || !data) return;
        ready.current = true;
        const local = currentTrip();
        if (data.trip) {
          if (hasPlans(local) && JSON.stringify(local) !== JSON.stringify(data.trip)) {
            try {
              localStorage.setItem(BEFORE_SYNC_KEY, JSON.stringify(local));
            } catch {
              // 存不下就算了
            }
          }
          skipNext.current = true;
          replaceTrip(data.trip);
          return;
        }
        upload({ trip: local, rev: Date.now() });
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const next = { trip, rev: Date.now() };
    pending.current = next;
    const timer = window.setTimeout(() => upload(next), 800);
    return () => window.clearTimeout(timer);
  }, [trip]);

  // 关掉页面、离开行程页时，把还没发成的马上发出去（keepalive：页面关了请求也会发完；修订号保证不被旧的盖掉）
  useEffect(() => {
    const flush = () => {
      if (pending.current && ready.current) void put(pending.current, true);
      pending.current = null;
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  return null;
}
