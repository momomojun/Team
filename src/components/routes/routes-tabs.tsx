"use client";

import { useEffect, useState, type ReactNode } from "react";

/** 博主路线页的两栏：博主路线 / 明星同款。网址带 #celebs 时直接打开明星同款，换栏时改网址的 # 部分（不刷新） */
export function RoutesTabs({
  tabs,
  label,
}: {
  tabs: { id: string; label: string; count: number; panel: ReactNode }[];
  label: string;
}) {
  const [active, setActive] = useState(tabs[0].id);
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some((tab) => tab.id === id)) setActive(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);
  const pick = (id: string) => {
    setActive(id);
    const search = window.location.search;
    window.history.replaceState(null, "", id === tabs[0].id ? window.location.pathname + search : `${window.location.pathname}${search}#${id}`);
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-8 border-b border-line">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => pick(tab.id)}
            className={`-mb-px inline-flex items-baseline gap-2 border-b-2 pb-3 font-serif text-xl transition-colors ${
              active === tab.id ? "border-ink text-ink" : "border-transparent text-mute hover:text-ink"
            }`}
          >
            {tab.label}
            <span className="font-sans text-xs tabular-nums opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" hidden={active !== tab.id} className="mt-10">
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
