import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { ridePassengers, rideRequests, rides, users } from "../db/schema";
import { takeRateSlot } from "./rate-limit";
import {
  MAX_REQUESTS_PER_DAY,
  firstName,
  type RequestFields,
} from "./request-rules";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

export type SaveStatus = "saved" | "has_ride" | "rate_limited";

// Aynı etkinlik için zaten bir yolculuğa katılmış kişi talep veremez.
// Talep varsa güncellenir (kişi başına etkinlik başına tek talep).
export async function saveRequest(input: {
  userId: string;
  eventId: string;
  fields: RequestFields;
  now?: Date;
}): Promise<SaveStatus> {
  const joined = await db
    .select({ rideId: ridePassengers.rideId })
    .from(ridePassengers)
    .innerJoin(rides, eq(ridePassengers.rideId, rides.id))
    .where(
      and(
        eq(ridePassengers.userId, input.userId),
        eq(rides.eventId, input.eventId),
      ),
    )
    .limit(1);

  if (joined.length > 0) {
    return "has_ride";
  }

  const allowed = await takeRateSlot(
    input.userId,
    "ride_request",
    MAX_REQUESTS_PER_DAY,
    86_400_000,
    input.now,
  );

  if (!allowed) {
    return "rate_limited";
  }

  const f = input.fields;

  await db
    .insert(rideRequests)
    .values({
      passengerId: input.userId,
      eventId: input.eventId,
      destination: f.destination,
      preferredTime: f.preferredTime,
      seats: f.seats,
      note: f.note,
    })
    .onConflictDoUpdate({
      target: [rideRequests.passengerId, rideRequests.eventId],
      set: {
        destination: f.destination,
        preferredTime: f.preferredTime,
        seats: f.seats,
        note: f.note,
        updatedAt: new Date(),
      },
    });

  return "saved";
}

// Yalnızca kendi talebini silebilirsin. Gerçekten bir kayıt silindiyse true döner.
export async function deleteRequest(
  userId: string,
  eventId: string,
): Promise<boolean> {
  const removed = await db
    .delete(rideRequests)
    .where(
      and(
        eq(rideRequests.passengerId, userId),
        eq(rideRequests.eventId, eventId),
      ),
    )
    .returning({ id: rideRequests.id });

  return removed.length > 0;
}

export type MyRequest = {
  destination: string;
  preferredTime: string | null;
  seats: number;
  note: string | null;
};

export async function getMyRequest(
  userId: string,
  eventId: string,
): Promise<MyRequest | null> {
  const [row] = await db
    .select({
      destination: rideRequests.destination,
      preferredTime: rideRequests.preferredTime,
      seats: rideRequests.seats,
      note: rideRequests.note,
    })
    .from(rideRequests)
    .where(
      and(
        eq(rideRequests.passengerId, userId),
        eq(rideRequests.eventId, eventId),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    destination: row.destination,
    preferredTime: row.preferredTime ? row.preferredTime.slice(0, 5) : null,
    seats: row.seats,
    note: row.note,
  };
}

export async function countRequests(eventId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(rideRequests)
    .where(eq(rideRequests.eventId, eventId));

  return row.total;
}

export type RequestListItem = {
  id: string;
  firstName: string;
  destination: string;
  preferredTime: string | null;
  seats: number;
  note: string | null;
  isOwn: boolean;
};

// Talep sahibinin kimliği dışarı verilmez, yalnızca ilk adı ve "senin talebin mi" bilgisi.
export async function listRequests(
  eventId: string,
  viewerId?: string,
): Promise<RequestListItem[]> {
  const rows = await db
    .select({
      id: rideRequests.id,
      passengerId: rideRequests.passengerId,
      name: users.name,
      destination: rideRequests.destination,
      preferredTime: rideRequests.preferredTime,
      seats: rideRequests.seats,
      note: rideRequests.note,
    })
    .from(rideRequests)
    .innerJoin(users, eq(rideRequests.passengerId, users.id))
    .where(eq(rideRequests.eventId, eventId))
    .orderBy(desc(rideRequests.createdAt))
    .limit(50);

  return rows.map((row) => ({
    id: row.id,
    firstName: firstName(row.name),
    destination: row.destination,
    preferredTime: row.preferredTime ? row.preferredTime.slice(0, 5) : null,
    seats: row.seats,
    note: row.note,
    isOwn: viewerId !== undefined && row.passengerId === viewerId,
  }));
}