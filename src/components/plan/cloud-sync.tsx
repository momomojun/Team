"use client";

import { useEffect, useRef } from "react";
import { replaceTrip, useTrip, type Trip } from "@/lib/trip-store";

/** 登录后云端的行程替换掉本机的之前，本机那份存在这里（别的设备上排过的行程更新，但万一想找回本机的） */
export const BEFORE_SYNC_KEY = "nps-trip-before-sync";

function put(trip: Trip, keepalive = false) {
  return fetch("/api/me/trip", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trip }),
    keepalive,
  }).catch(() => undefined);
}

function hasPlans(trip: Trip) {
  return trip.pool.length > 0 || trip.days.some((day) => day.length > 0);
}

/** 登录以后把行程同步到 Neon。没登录（接口 401）就继续只用这台浏览器的 localStorage */
export function CloudSync() {
  const trip = useTrip();
  const latest = useRef(trip);
  const ready = useRef(false);
  const skipNext = useRef(false);
  // 上传一个接一个发：先发的请求不会晚到、把后面的新行程盖掉
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  // 改了还没发出去的（800 毫秒以内离开页面时补发）
  const pending = useRef<Trip | null>(null);
  const upload = (next: Trip) => {
    pending.current = null;
    queue.current = queue.current.then(() => put(next));
  };

  // 渲染时不能写 ref（React 的规则），在 effect 里跟上最新的行程
  useEffect(() => {
    latest.current = trip;
  }, [trip]);

  useEffect(() => {
    let cancel = false;
    fetch("/api/me/trip")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { trip?: Trip | null } | null) => {
        if (cancel || !data) return;
        ready.current = true;
        if (data.trip) {
          const local = latest.current;
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
        upload(latest.current);
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
    pending.current = trip;
    const timer = window.setTimeout(() => upload(trip), 800);
    return () => window.clearTimeout(timer);
  }, [trip]);

  // 关掉页面、离开行程页时，把还没发出去的那次发出去（keepalive：页面关了请求也会发完）
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
