"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** 概览保留全屏大图；其他分页不再重复那张图，直接从导航进入这一页的内容 */
export function ParkChrome({
  overviewPath,
  hero,
  nav,
  children,
}: {
  overviewPath: string;
  hero: ReactNode;
  nav: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <>
      {pathname === overviewPath ? hero : null}
      {nav}
      {children}
    </>
  );
}
