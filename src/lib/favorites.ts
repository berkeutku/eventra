import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { eventFavorites, events } from "../db/schema";
import { realEventsEnabled } from "./flags";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

export const MAX_FAVORITES = 200;

export type FavoriteEvent = {
  id: string;
  title: string;
  city: string;
  venue: string;
  startsAt: string;
  source: "demo" | "biletimgo";
};

export type SetFavoriteResult = "added" | "removed" | "unchanged" | "limit";

export async function isFavorite(
  userId: string,
  eventId: string,
): Promise<boolean> {
  const rows = await db
    .select({ eventId: eventFavorites.eventId })
    .from(eventFavorites)
    .where(
      and(
        eq(eventFavorites.userId, userId),
        eq(eventFavorites.eventId, eventId),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

// Etkinliğin görünür olup olmadığı çağıran tarafta (sunucu eylemi) kontrol edilir.
export async function setFavorite(
  userId: string,
  eventId: string,
  on: boolean,
  max: number = MAX_FAVORITES,
): Promise<SetFavoriteResult> {
  if (on) {
    if (await isFavorite(userId, eventId)) {
      return "unchanged";
    }

    const [counted] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(eventFavorites)
      .where(eq(eventFavorites.userId, userId));

    if (counted.total >= max) {
      return "limit";
    }

    const inserted = await db
      .insert(eventFavorites)
      .values({ userId, eventId })
      .onConflictDoNothing()
      .returning({ eventId: eventFavorites.eventId });

    return inserted.length > 0 ? "added" : "unchanged";
  }

  const removed = await db
    .delete(eventFavorites)
    .where(
      and(
        eq(eventFavorites.userId, userId),
        eq(eventFavorites.eventId, eventId),
      ),
    )
    .returning({ eventId: eventFavorites.eventId });

  return removed.length > 0 ? "removed" : "unchanged";
}

// Gerçek (biletimGO) etkinlikler yalnızca SHOW_REAL_EVENTS=1 ise listelenir.
export async function listFavoriteEvents(
  userId: string,
): Promise<FavoriteEvent[]> {
  const visible = realEventsEnabled() ? undefined : eq(events.source, "demo");

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      city: events.city,
      venue: events.venue,
      startsAt: events.startsAt,
      source: events.source,
    })
    .from(eventFavorites)
    .innerJoin(events, eq(eventFavorites.eventId, events.id))
    .where(and(eq(eventFavorites.userId, userId), visible))
    .orderBy(desc(eventFavorites.createdAt))
    .limit(MAX_FAVORITES);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    city: row.city,
    venue: row.venue,
    startsAt: row.startsAt.toISOString(),
    source: row.source === "biletimgo" ? "biletimgo" : "demo",
  }));
}