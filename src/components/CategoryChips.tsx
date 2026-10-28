"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import Icon, { categoryIcon } from "@/components/Icons";
import { categoryMeta, type EventCategory } from "@/data/events";

const categories = Object.keys(categoryMeta) as EventCategory[];

export default function CategoryChips({ active }: { active?: EventCategory }) {
  const navRef = useRef<HTMLElement>(null);

  // Seçili kategoriyi, yalnızca bu çubuğun içinde ortalayarak görünür yap.
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

  const base =
    "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors";
  const on = "bg-night text-white";
  const off = "bg-white text-ink ring-1 ring-line hover:bg-lilac";

  return (
    <nav
      ref={navRef}
      aria-label="Etkinlik kategorileri"
      className="relative -mx-6 flex gap-3 overflow-x-auto px-6 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <Link
        href="/events"
        aria-current={!active ? "page" : undefined}
        className={`${base} ${!active ? on : off}`}
      >
        Tümü
      </Link>
      {categories.map((category) => {
        const meta = categoryMeta[category];
        const isActive = active === category;

        return (
          <Link
            key={category}
            href={`/events?kategori=${category}`}
            aria-current={isActive ? "page" : undefined}
            className={`${base} ${isActive ? on : off}`}
          >
            <span
              className={`grid h-6 w-6 place-items-center rounded-full ${meta.soft} ${meta.accent}`}
            >
              <Icon name={categoryIcon[category]} className="h-3.5 w-3.5" />
            </span>
            {meta.label}
          </Link>
        );
      })}
    </nav>
  );
}