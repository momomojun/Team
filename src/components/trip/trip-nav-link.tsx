"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tripIds, useTrip } from "@/lib/trip-store";

/** 页头的“行程”，后面带景点数；颜色跟随页头（透明时白字，滚动后墨色）。className 给了就整个换掉（页头右边的金色按钮） */
export function TripNavLink({ href, label, className }: { href: string; label: string; className?: string }) {
  const trip = useTrip();
  const count = tripIds(trip).length;
  const active = usePathname() === href;

  return (
    <Link href={href} className={className ?? `inline-flex items-baseline gap-1.5 hover:opacity-60 ${active ? "link-line" : ""}`}>
      {label}
      {count > 0 && <span className="text-[11px] tabular-nums opacity-70">{count}</span>}
    </Link>
  );
}
