import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import type { EventItem } from "@/data/events";

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
  };
}

export const getEvents = cache(async (): Promise<EventItem[]> => {
  const rows = await db.select().from(events).orderBy(asc(events.startsAt));
  return rows.map(toEventItem);
});

export const getEventById = cache(
  async (id: string): Promise<EventItem | null> => {
    const rows = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);
    return rows[0] ? toEventItem(rows[0]) : null;
  },
);