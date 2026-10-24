import Link from "next/link";
import Icon, { categoryIcon } from "@/components/Icons";
import { categoryMeta, type EventCategory } from "@/data/events";

const categories = Object.keys(categoryMeta) as EventCategory[];

export default function CategoryChips({ active }: { active?: EventCategory }) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors";
  const on = "bg-night text-white";
  const off = "bg-white text-ink ring-1 ring-line hover:bg-lilac";

  return (
    <nav aria-label="Etkinlik kategorileri" className="flex flex-wrap gap-3">
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