"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { TAB_ITEMS, tabHref, type PanelTab } from "@/lib/panel-tabs";

export default function PanelTabs({
  active,
  counts,
}: {
  active: PanelTab;
  counts: Partial<Record<PanelTab, number>>;
}) {
  const navRef = useRef<HTMLElement>(null);

  // Aktif sekmeyi, yalnızca bu çubuğun içinde ortalayarak görünür yap (mobil).
  useEffect(() => {
    const container = navRef.current;
    const current = container?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );

    if (container && current) {
      container.scrollLeft = Math.max(
        0,
        current.offsetLeft - (container.clientWidth - current.offsetWidth) / 2,
      );
    }
  }, [active]);

  return (
    <nav
      ref={navRef}
      aria-label="Profil bölümleri"
      className="relative -mx-6 mt-8 flex gap-2 overflow-x-auto px-6 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {TAB_ITEMS.map((item) => {
        const isActive = item.key === active;
        const count = counts[item.key];

        return (
          <Link
            key={item.key}
            href={tabHref(item.key)}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
              isActive
                ? "bg-night text-white"
                : "bg-white text-ink ring-1 ring-line hover:bg-lilac"
            }`}
          >
            {item.label}
            {count !== undefined ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive ? "bg-white/20" : "bg-lilac text-violet"
                }`}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}