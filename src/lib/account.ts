import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  loginAttempts,
  notifications,
  ridePassengers,
  rides,
  users,
} from "../db/schema";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli
// (../db) import yollarını kullanıyor.

// Hesabı ve ona bağlı tüm verileri tek işlemde siler. Parola doğrulaması
// çağıran tarafta yapılır. Hesap bulunamazsa false döner.
export async function deleteAccountData(userId: string): Promise<boolean> {
  return db.transaction(async (tx): Promise<boolean> => {
    const [user] = await tx
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");

    if (!user) {
      return false;
    }

    // Sürücü olarak oluşturduğu yolculuklardaki yolcular: iptal bildirimi.
    const toCancel = await tx
      .select({
        passengerId: ridePassengers.userId,
        rideId: rides.id,
        eventId: rides.eventId,
        origin: rides.origin,
        destination: rides.destination,
      })
      .from(ridePassengers)
      .innerJoin(rides, eq(ridePassengers.rideId, rides.id))
      .where(eq(rides.driverId, userId));

    if (toCancel.length > 0) {
      await tx
        .insert(notifications)
        .values(
          toCancel.map((item) => ({
            userId: item.passengerId,
            type: "ride_cancelled" as const,
            title: "Katıldığın yolculuk iptal edildi",
            body: `${item.origin} → ${item.destination} yolculuğu, sürücü hesabını sildiği için iptal edildi.`,
            link: `/events/${item.eventId}`,
            dedupeKey: `ride_cancelled:${item.rideId}:${item.passengerId}`,
          })),
        )
        .onConflictDoNothing();
    }

    // Yolcu olarak katıldığı yolculukların sürücüleri: adsız bilgi bildirimi.
    const toInform = await tx
      .select({
        driverId: rides.driverId,
        rideId: rides.id,
        eventId: rides.eventId,
        origin: rides.origin,
        destination: rides.destination,
      })
      .from(ridePassengers)
      .innerJoin(rides, eq(ridePassengers.rideId, rides.id))
      .where(eq(ridePassengers.userId, userId));

    const informable = toInform.filter((item) => item.driverId !== userId);

    if (informable.length > 0) {
      await tx
        .insert(notifications)
        .values(
          informable.map((item) => ({
            userId: item.driverId,
            type: "ride_left" as const,
            title: "Bir yolcu yolculuğundan ayrıldı",
            body: `Bir yolcu hesabını sildi ve ${item.origin} → ${item.destination} yolculuğundan ayrıldı.`,
            link: `/events/${item.eventId}/yolculuk/${item.rideId}`,
            dedupeKey: `ride_left_account:${item.rideId}:${userId}`,
          })),
        )
        .onConflictDoNothing();
    }

    // Bu e-postaya ait giriş deneme kayıtları (kullanıcıya bağlı değil, ayrıca silinir).
    await tx.delete(loginAttempts).where(eq(loginAttempts.email, user.email));

    // Oturumlar, yolculuklar, katılımlar, bilet kayıtları, bildirimler ve
    // telefon abonelikleri zincirleme silinir.
    await tx.delete(users).where(eq(users.id, userId));

    return true;
  });
}