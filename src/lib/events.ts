import { cache } from "react";
import { and, asc, eq, gte, ilike, lt, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { getShowRealEvents } from "@/lib/app-settings";
import type { EventCategory, EventItem } from "@/data/events";
import {
  DAY_MS,
  rangeFor,
  trDayStart,
  type WhenFilter,
} from "@/lib/event-filter-rules";

export { parseWhen, type WhenFilter } from "@/lib/event-filter-rules";

type EventRow = typeof events.$inferSelect;

function toEventItem(row: EventRow): EventItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    city: row.city,
    venue: row.venue,
    startsAt: row.startsAt.toISOString(),
    description: row.description,
    source: row.source === "biletimgo" ? "biletimgo" : "demo",
    ticketUrl: row.ticketUrl,
    imageUrl: row.imageUrl,
    address: row.address,
    organizer: row.organizer,
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    priceText: row.priceText,
    sourceCategory: row.sourceCategory,
    isActive: row.isActive,
  };
}

export const PAGE_SIZE = 24;

export type SourceFilter = "all" | "real" | "demo";
export type EventFilters = {
  category?: EventCategory;
  cityKey?: string;
  query?: string;
  source?: SourceFilter;
  when?: WhenFilter;
  // Yalnızca when === "custom" iken kullanılır: "YYYY-MM-DD"
  from?: string;
  to?: string;
};

export type EventPage = {
  items: EventItem[];
  total: number;
  page: number;
  pageCount: number;
};

export type CityOption = { key: string; name: string; total: number };

// Etkinlik, bitiş saatine (yoksa başlangıç + 6 saate) kadar "yaklaşan" sayılır.
const UPCOMING = sql`coalesce(${events.endsAt}, ${events.startsAt} + interval '6 hours') >= now()`;

function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function visibleSource(source: SourceFilter, showReal: boolean): SQL {
  const demo = eq(events.source, "demo");

  if (!showReal || source === "demo") {
    return demo;
  }

  const real = and(
    eq(events.source, "biletimgo"),
    eq(events.isActive, true),
  ) as SQL;

  return source === "real" ? real : (or(demo, real) as SQL);
}

function conditions(
  filters: EventFilters,
  withCategory: boolean,
  showReal: boolean,
): SQL {
  const parts: (SQL | undefined)[] = [
    visibleSource(filters.source ?? "all", showReal),
    UPCOMING,
  ];

  if (withCategory && filters.category) {
    parts.push(eq(events.category, filters.category));
  }

  if (filters.cityKey) {
    parts.push(eq(events.cityKey, filters.cityKey));
  }

  const range = filters.when
    ? rangeFor(filters.when, new Date(), filters.from, filters.to)
    : null;

  if (range) {
    parts.push(lt(events.startsAt, range.to));
    parts.push(
      sql`coalesce(${events.endsAt}, ${events.startsAt} + interval '6 hours') >= ${range.from.toISOString()}::timestamptz`,
    );
  }

  const query = filters.query?.trim();

  if (query) {
    const pattern = `%${escapeLike(query.slice(0, 80))}%`;
    parts.push(
      or(
        ilike(events.title, pattern),
        ilike(events.venue, pattern),
        ilike(events.city, pattern),
      ),
    );
  }

  return and(...parts) as SQL;
}

export async function listEvents(
  filters: EventFilters & { page?: number },
): Promise<EventPage> {
  const where = conditions(filters, true, await getShowRealEvents());

  const [counted] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(events)
    .where(where);

  const total = counted.total;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const wanted = Math.floor(filters.page ?? 1) || 1;
  const page = Math.min(Math.max(1, wanted), pageCount);

  const rows = await db
    .select()
    .from(events)
    .where(where)
    .orderBy(asc(events.startsAt), asc(events.id))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return { items: rows.map(toEventItem), total, page, pageCount };
}

// Kategori adetleri: kategori filtresi hariç diğer filtreleri uygular.
export async function countByCategory(
  filters: EventFilters,
): Promise<Partial<Record<EventCategory, number>>> {
  const rows = await db
    .select({
      category: events.category,
      total: sql<number>`count(*)::int`,
    })
    .from(events)
    .where(conditions(filters, false, await getShowRealEvents()))
    .groupBy(events.category);

  const result: Partial<Record<EventCategory, number>> = {};

  for (const row of rows) {
    result[row.category] = row.total;
  }

  return result;
}

// Şehir seçenekleri: şehir filtresi hariç diğer filtreleri uygular.
export async function listCities(filters: EventFilters): Promise<CityOption[]> {
  const rows = await db
    .select({
      key: events.cityKey,
      name: sql<string>`min(${events.city})`,
      total: sql<number>`count(*)::int`,
    })
    .from(events)
    .where(
      conditions({ ...filters, cityKey: undefined }, true, await getShowRealEvents()),
    )
    .groupBy(events.cityKey)
    .orderBy(sql`count(*) desc`, sql`min(${events.city})`);

  return rows
    .filter((row) => row.key)
    .map((row) => ({ key: row.key as string, name: row.name, total: row.total }));
}

// Tarih şeridi için: önümüzdeki günlerde başlayan etkinlik sayıları (tarih filtresi hariç).
export async function countByDay(
  filters: EventFilters,
  days = 14,
): Promise<Record<string, number>> {
  const start = new Date(trDayStart(new Date()));
  const end = new Date(start.getTime() + days * DAY_MS);
  const day = sql<string>`to_char(${events.startsAt} at time zone 'Europe/Istanbul', 'YYYY-MM-DD')`;

  const rows = await db
    .select({ day, total: sql<number>`count(*)::int` })
    .from(events)
    .where(
      and(
        conditions(
          { ...filters, when: "all", from: undefined, to: undefined },
          true,
          await getShowRealEvents(),
        ),
        gte(events.startsAt, start),
        lt(events.startsAt, end),
      ),
    )
    .groupBy(day);

  const result: Record<string, number> = {};

  for (const row of rows) {
    result[row.day] = row.total;
  }

  return result;
}

// Ana sayfa için: yaklaşan ilk etkinlikler.
export const getEvents = cache(async (): Promise<EventItem[]> => {
  const rows = await db
    .select()
    .from(events)
    .where(conditions({}, true, await getShowRealEvents()))
    .orderBy(asc(events.startsAt), asc(events.id))
    .limit(12);

  return rows.map(toEventItem);
});

// Detay sayfası: pasif ve geçmiş etkinlikler de açılır (yolculuklar orada durur).
export const getEventById = cache(
  async (id: string): Promise<EventItem | null> => {
    const showReal = await getShowRealEvents();
    const rows = await db
      .select()
      .from(events)
      .where(
        showReal
          ? eq(events.id, id)
          : and(eq(events.id, id), eq(events.source, "demo")),
      )
      .limit(1);

    return rows[0] ? toEventItem(rows[0]) : null;
  },
);

// Yalnızca demo etkinlikleri döndürür (bilet doğrulama simülasyonu için).
export const getDemoEventById = cache(
  async (id: string): Promise<EventItem | null> => {
    const rows = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.source, "demo")))
      .limit(1);

    return rows[0] ? toEventItem(rows[0]) : null;
  },
);