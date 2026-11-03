"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import Icon, { categoryIcon } from "@/components/Icons";
import { categoryMeta, type EventCategory } from "@/data/events";

const ALL = Object.keys(categoryMeta) as EventCategory[];
// Adet bilgisi verilmediğinde (ana sayfa) gösterilen eski kategoriler.
const LEGACY = ALL.filter(
  (category) => !["party", "workshop", "kids"].includes(category),
);

type Props = {
  active?: EventCategory;
  counts?: Partial<Record<EventCategory, number>>;
  params?: { sehir?: string; q?: string; kaynak?: string; tarih?: string };
};

function hrefFor(category: EventCategory | undefined, params: Props["params"]) {
  const search = new URLSearchParams();

  if (category) {
    search.set("kategori", category);
  }
  if (params?.sehir) {
    search.set("sehir", params.sehir);
  }
  if (params?.q) {
    search.set("q", params.q);
  }
  if (params?.kaynak) {
    search.set("kaynak", params.kaynak);
  }
  if (params?.tarih) {
    search.set("tarih", params.tarih);
  }

  const text = search.toString();
  return text ? `/events?${text}` : "/events";
}

export default function CategoryChips({ active, counts, params }: Props) {
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

  const categories = counts
    ? ALL.filter(
        (category) => (counts[category] ?? 0) > 0 || category === active,
      ).sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))
    : LEGACY;
  const totalCount = counts
    ? Object.values(counts).reduce((sum, value) => sum + (value ?? 0), 0)
    : undefined;

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
        href={hrefFor(undefined, params)}
        aria-current={!active ? "page" : undefined}
        className={`${base} ${!active ? on : off}`}
      >
        Tümü{totalCount !== undefined ? ` (${totalCount})` : ""}
      </Link>
      {categories.map((category) => {
        const meta = categoryMeta[category];
        const isActive = active === category;

        return (
          <Link
            key={category}
            href={hrefFor(category, params)}
            aria-current={isActive ? "page" : undefined}
            className={`${base} ${isActive ? on : off}`}
          >
            <span
              className={`grid h-6 w-6 place-items-center rounded-full ${meta.soft} ${meta.accent}`}
            >
              <Icon name={categoryIcon[category]} className="h-3.5 w-3.5" />
            </span>
            {meta.label}
            {counts ? ` (${counts[category] ?? 0})` : ""}
          </Link>
        );
      })}
    </nav>
  );
}