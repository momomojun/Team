"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** 旧的 #car、#gas 锚点改去各自的页面 */
export function PricesHashRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if ((id === "car" || id === "gas") && pathname.endsWith("/prices")) {
      router.replace(`${pathname}/${id}`);
    }
  }, [pathname, router]);
  return null;
}
