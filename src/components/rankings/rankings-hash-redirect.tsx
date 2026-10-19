"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** 旧的 #timeline、#picks、#honors 锚点改去各自的页面 */
export function RankingsHashRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if ((id === "timeline" || id === "picks" || id === "honors") && pathname.endsWith("/rankings")) {
      router.replace(`${pathname}/${id}`);
    }
  }, [pathname, router]);
  return null;
}
