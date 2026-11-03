import { cache } from "react";
import { and, asc, eq, ilike, lt, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import type { EventCategory, EventItem } from "@/data/events";

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

// Gerçek (biletimGO) etkinlikler yalnızca SHOW_REAL_EVENTS=1 ise görünür ve açılabilir.
// Değişken yoksa site yalnızca demo etkinlikleri gösterir (güvenli varsayılan).
export function realEventsEnabled(): boolean {
  return process.env.SHOW_REAL_EVENTS === "1";
}

export type SourceFilter = "all" | "real" | "demo";
export type WhenFilter = "all" | "today" | "week" | "weekend" | "month";

const WHEN_VALUES: WhenFilter[] = ["all", "today", "week", "weekend", "month"];

export function parseWhen(value: string): WhenFilter {
  return WHEN_VALUES.find((item) => item === value) ?? "all";
}

export type EventFilters = {
  category?: EventCategory;
  cityKey?: string;
  query?: string;
  source?: SourceFilter;
  when?: WhenFilter;
};

export type EventPage = {
  items: EventItem[];
  total: number;
  page: number;
  pageCount: number;
};

export type CityOption = { key: string; name: string; total: number };

const DAY_MS = 86_400_000;
const TR_OFFSET_MS = 3 * 3_600_000; // Türkiye sabit UTC+3

// Seçilen zaman aralığı (Türkiye saatine göre): [from, to)
function whenRange(
  when: Exclude<WhenFilter, "all">,
  now: Date,
): { from: Date; to: Date } {
  const local = now.getTime() + TR_OFFSET_MS;
  const dayNumber = Math.floor(local / DAY_MS);
  const todayStart = dayNumber * DAY_MS - TR_OFFSET_MS;
  const weekday = (dayNumber + 4) % 7; // 0 pazar, 6 cumartesi

  if (when === "today") {
    return { from: new Date(todayStart), to: new Date(todayStart + DAY_MS) };
  }

  if (when === "week") {
    return { from: new Date(todayStart), to: new Date(todayStart + 7 * DAY_MS) };
  }

  if (when === "month") {
    return { from: new Date(todayStart), to: new Date(todayStart + 30 * DAY_MS) };
  }

  if (weekday === 0) {
    return { from: new Date(todayStart), to: new Date(todayStart + DAY_MS) };
  }

  if (weekday === 6) {
    return { from: new Date(todayStart), to: new Date(todayStart + 2 * DAY_MS) };
  }

  const saturday = todayStart + (6 - weekday) * DAY_MS;
  return { from: new Date(saturday), to: new Date(saturday + 2 * DAY_MS) };
}

// Etkinlik, bitiş saatine (yoksa başlangıç + 6 saate) kadar "yaklaşan" sayılır.
const UPCOMING = sql`coalesce(${events.endsAt}, ${events.startsAt} + interval '6 hours') >= now()`;

function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function visibleSource(source: SourceFilter): SQL {
  const demo = eq(events.source, "demo");

  if (!realEventsEnabled() || source === "demo") {
    return demo;
  }

  const real = and(
    eq(events.source, "biletimgo"),
    eq(events.isActive, true),
  ) as SQL;

  return source === "real" ? real : (or(demo, real) as SQL);
}

function conditions(filters: EventFilters, withCategory: boolean): SQL {
  const parts: (SQL | undefined)[] = [
    visibleSource(filters.source ?? "all"),
    UPCOMING,
  ];

  if (withCategory && filters.category) {
    parts.push(eq(events.category, filters.category));
  }

  if (filters.cityKey) {
    parts.push(eq(events.cityKey, filters.cityKey));
  }

  const when = filters.when;

  if (when && when !== "all") {
    const range = whenRange(when, new Date());
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
  const where = conditions(filters, true);

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
    .where(conditions(filters, false))
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
    .where(conditions({ ...filters, cityKey: undefined }, true))
    .groupBy(events.cityKey)
    .orderBy(sql`count(*) desc`, sql`min(${events.city})`);

  return rows
    .filter((row) => row.key)
    .map((row) => ({ key: row.key as string, name: row.name, total: row.total }));
}

// Ana sayfa için: yaklaşan ilk etkinlikler.
export const getEvents = cache(async (): Promise<EventItem[]> => {
  const rows = await db
    .select()
    .from(events)
    .where(conditions({}, true))
    .orderBy(asc(events.startsAt), asc(events.id))
    .limit(12);

  return rows.map(toEventItem);
});

// Detay sayfası: pasif ve geçmiş etkinlikler de açılır (yolculuklar orada durur).
export const getEventById = cache(
  async (id: string): Promise<EventItem | null> => {
    const rows = await db
      .select()
      .from(events)
      .where(
        realEventsEnabled()
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