"use client";

import { useEffect, useRef } from "react";
import { replaceTrip, useTrip, type Trip } from "@/lib/trip-store";

/** 登录以后把行程同步到 Neon。没登录（接口 401）就继续只用这台浏览器的 localStorage */
export function CloudSync() {
  const trip = useTrip();
  const latest = useRef(trip);
  const ready = useRef(false);
  const skipNext = useRef(false);
  latest.current = trip;

  useEffect(() => {
    let cancel = false;
    fetch("/api/me/trip")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { trip?: Trip | null } | null) => {
        if (cancel || !data) return;
        ready.current = true;
        if (data.trip) {
          skipNext.current = true;
          replaceTrip(data.trip);
          return;
        }
        void fetch("/api/me/trip", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trip: latest.current }),
        });
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
    const timer = window.setTimeout(() => {
      void fetch("/api/me/trip", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip }),
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [trip]);

  return null;
}
