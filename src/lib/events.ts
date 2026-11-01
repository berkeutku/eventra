import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
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

// ŞİMDİLİK yalnızca demo etkinlikler listelenir ve açılabilir. Gerçek (biletimGO)
// etkinlikler arayüz hazır olunca bilerek açılacak (Faz 4). Bu yüzden veritabanına
// gerçek etkinlik yazılsa bile sayfalar, yolculuk oluşturma ve bilet doğrulama
// onları görmez ve reddeder.
export const getEvents = cache(async (): Promise<EventItem[]> => {
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.source, "demo"))
    .orderBy(asc(events.startsAt));
  return rows.map(toEventItem);
});

export const getEventById = cache(
  async (id: string): Promise<EventItem | null> => {
    const rows = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.source, "demo")))
      .limit(1);
    return rows[0] ? toEventItem(rows[0]) : null;
  },
);