import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { notifications, ridePassengers, rides, users } from "../db/schema";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli
// (../db) import yollarını kullanıyor.

export type LeaveOutcome = "left" | "not_joined";
export type DeleteOutcome = "deleted" | "not_found";

// Kullanıcıyı yolculuktan çıkarır ve yalnızca gerçekten bir kayıt silindiyse
// sürücüye bildirim yazar. Her şey tek veritabanı işleminde yapılır.
export async function leaveRide(
  userId: string,
  rideId: string,
): Promise<LeaveOutcome> {
  return db.transaction(async (tx): Promise<LeaveOutcome> => {
    const [ride] = await tx
      .select({
        id: rides.id,
        eventId: rides.eventId,
        driverId: rides.driverId,
        origin: rides.origin,
        destination: rides.destination,
      })
      .from(rides)
      .where(eq(rides.id, rideId))
      .limit(1);

    if (!ride) {
      return "not_joined";
    }

    const removed = await tx
      .delete(ridePassengers)
      .where(
        and(
          eq(ridePassengers.rideId, rideId),
          eq(ridePassengers.userId, userId),
        ),
      )
      .returning({ userId: ridePassengers.userId });

    if (removed.length === 0) {
      return "not_joined";
    }

    const [passenger] = await tx
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await tx.insert(notifications).values({
      userId: ride.driverId,
      type: "ride_left",
      title: "Bir yolcu yolculuğundan ayrıldı",
      body: `${passenger?.name ?? "Bir yolcu"}, ${ride.origin} → ${ride.destination} yolculuğundan ayrıldı.`,
      link: `/events/${ride.eventId}/yolculuk/${ride.id}`,
    });

    return "left";
  });
}

// Yalnızca yolculuğun sürücüsü silebilir (sahiplik sorgunun içinde).
// Silmeden önce o anda yolculukta olan yolculara bildirim yazılır.
export async function deleteRide(
  userId: string,
  rideId: string,
): Promise<DeleteOutcome> {
  return db.transaction(async (tx): Promise<DeleteOutcome> => {
    const [ride] = await tx
      .select({
        id: rides.id,
        eventId: rides.eventId,
        origin: rides.origin,
        destination: rides.destination,
      })
      .from(rides)
      .where(and(eq(rides.id, rideId), eq(rides.driverId, userId)))
      .for("update");

    if (!ride) {
      return "not_found";
    }

    const passengers = await tx
      .select({ userId: ridePassengers.userId })
      .from(ridePassengers)
      .where(eq(ridePassengers.rideId, ride.id));

    if (passengers.length > 0) {
      await tx
        .insert(notifications)
        .values(
          passengers.map((passenger) => ({
            userId: passenger.userId,
            type: "ride_cancelled" as const,
            title: "Katıldığın yolculuk iptal edildi",
            body: `${ride.origin} → ${ride.destination} yolculuğu sürücü tarafından silindi.`,
            link: `/events/${ride.eventId}`,
            dedupeKey: `ride_cancelled:${ride.id}:${passenger.userId}`,
          })),
        )
        .onConflictDoNothing();
    }

    await tx
      .delete(rides)
      .where(and(eq(rides.id, ride.id), eq(rides.driverId, userId)));

    return "deleted";
  });
}