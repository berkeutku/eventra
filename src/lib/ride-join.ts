import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { notifications, ridePassengers, rides, users } from "../db/schema";

export type JoinOutcome =
  | { status: "joined"; eventId: string }
  | { status: "not_found" }
  | { status: "full" }
  | { status: "already_joined" }
  | { status: "other_ride" }
  | { status: "own_ride" };

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli
// (../db) import yollarını kullanıyor.
export async function joinRide(
  userId: string,
  rideId: string,
): Promise<JoinOutcome> {
  return db.transaction(async (tx): Promise<JoinOutcome> => {
    // Aynı kullanıcının aynı anda gelen isteklerini sıraya sokar.
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");

    // Yolculuk satırını kilitler: aynı yolculuğa katılmak isteyen diğer
    // işlemler, bu işlem bitene kadar burada bekler.
    const [ride] = await tx
      .select({
        id: rides.id,
        eventId: rides.eventId,
        seats: rides.seats,
        driverId: rides.driverId,
        origin: rides.origin,
        destination: rides.destination,
      })
      .from(rides)
      .where(eq(rides.id, rideId))
      .for("update");

    if (!ride) {
      return { status: "not_found" };
    }

    // Sürücü kendi oluşturduğu yolculuğa yolcu olarak katılamaz.
    if (ride.driverId === userId) {
      return { status: "own_ride" };
    }

    // Kullanıcı bu etkinliğe ait hangi yolculuklara katılmış?
    const existing = await tx
      .select({ rideId: ridePassengers.rideId })
      .from(ridePassengers)
      .innerJoin(rides, eq(ridePassengers.rideId, rides.id))
      .where(
        and(
          eq(ridePassengers.userId, userId),
          eq(rides.eventId, ride.eventId),
        ),
      );

    if (existing.some((row) => row.rideId === ride.id)) {
      return { status: "already_joined" };
    }

    if (existing.length > 0) {
      return { status: "other_ride" };
    }

    const [counted] = await tx
      .select({ total: sql<number>`count(*)::int` })
      .from(ridePassengers)
      .where(eq(ridePassengers.rideId, ride.id));

    if (counted.total >= ride.seats) {
      return { status: "full" };
    }

    await tx.insert(ridePassengers).values({ rideId: ride.id, userId });

    // Sürücüye bildirim: katılımla aynı işlemde yazılır, katılım geri alınırsa bildirim de olmaz.
    const [passenger] = await tx
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await tx.insert(notifications).values({
      userId: ride.driverId,
      type: "ride_joined",
      title: "Yolculuğuna yeni bir yolcu katıldı",
      body: `${passenger?.name ?? "Bir yolcu"}, ${ride.origin} → ${ride.destination} yolculuğuna katıldı.`,
      link: `/events/${ride.eventId}/yolculuk/${ride.id}`,
    });

    return { status: "joined", eventId: ride.eventId };
  });
}