import "dotenv/config";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../src/db";
import { events, ridePassengers, rides, users } from "../src/db/schema";
import { joinRide } from "../src/lib/ride-join";

const EMAIL_DOMAIN = "@race-test.invalid";

async function countPassengers(rideId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(ridePassengers)
    .where(eq(ridePassengers.rideId, rideId));
  return row.total;
}

async function main() {
  const [event] = await db.select({ id: events.id }).from(events).limit(1);

  if (!event) {
    console.error("Veritabanında etkinlik yok. Önce seed-events çalıştırılmalı.");
    process.exitCode = 1;
    return;
  }

  const stamp = Date.now();
  const testUsers: (typeof users.$inferInsert)[] = [
    {
      name: "Test Sürücü",
      email: `driver-${stamp}${EMAIL_DOMAIN}`,
      passwordHash: "test",
      role: "driver",
    },
    ...Array.from({ length: 6 }, (_, index) => ({
      name: `Test Yolcu ${index + 1}`,
      email: `passenger-${index + 1}-${stamp}${EMAIL_DOMAIN}`,
      passwordHash: "test",
      role: "passenger" as const,
    })),
  ];

  const created = await db
    .insert(users)
    .values(testUsers)
    .returning({ id: users.id, role: users.role });

  const driver = created.find((user) => user.role === "driver");
  const passengers = created.filter((user) => user.role === "passenger");

  if (!driver || passengers.length < 6) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  // Senaryo 1 için 5 yolcu, Senaryo 2 için hiçbir yolculuğa katılmamış 6. yolcu.
  const raceGroup = passengers.slice(0, 5);
  const loneUser = passengers[5];

  try {
    const baseRide = {
      eventId: event.id,
      driverId: driver.id,
      origin: "Test",
      destination: "Test",
      meetingPoint: "Test",
      departureTime: "23:30",
      durationMinutes: 30,
      totalCost: 100,
    };

    // Senaryo 1: 2 koltuk, aynı anda 5 farklı yolcu katılmaya çalışıyor.
    const [rideA] = await db
      .insert(rides)
      .values({ ...baseRide, seats: 2 })
      .returning({ id: rides.id });

    const resultsA = await Promise.all(
      raceGroup.map((passenger) => joinRide(passenger.id, rideA.id)),
    );
    const joinedA = resultsA.filter((r) => r.status === "joined").length;
    const fullA = resultsA.filter((r) => r.status === "full").length;
    const savedA = await countPassengers(rideA.id);

    console.log(
      `Senaryo 1 (2 koltuk, 5 eşzamanlı yolcu): katılan=${joinedA}, dolu cevabı=${fullA}, veritabanındaki kayıt=${savedA}`,
    );
    console.log(
      `  Alınan cevaplar: ${resultsA.map((r) => r.status).join(", ")}`,
    );

    const okA = joinedA === 2 && fullA === 3 && savedA === 2;

    // Senaryo 2: aynı yolcu aynı yolculuğa 3 kez eşzamanlı katılmaya çalışıyor.
    const [rideB] = await db
      .insert(rides)
      .values({ ...baseRide, seats: 3 })
      .returning({ id: rides.id });

    const resultsB = await Promise.all([
      joinRide(loneUser.id, rideB.id),
      joinRide(loneUser.id, rideB.id),
      joinRide(loneUser.id, rideB.id),
    ]);
    const joinedB = resultsB.filter((r) => r.status === "joined").length;
    const duplicateB = resultsB.filter(
      (r) => r.status === "already_joined",
    ).length;
    const savedB = await countPassengers(rideB.id);

    console.log(
      `Senaryo 2 (aynı yolcu 3 kez): katılan=${joinedB}, zaten katıldı=${duplicateB}, veritabanındaki kayıt=${savedB}`,
    );
    console.log(
      `  Alınan cevaplar: ${resultsB.map((r) => r.status).join(", ")}`,
    );

    const okB = joinedB === 1 && duplicateB === 2 && savedB === 1;

    // Senaryo 3: yolcu bir etkinlikte tek yolculuğa katılabilir.
    const [rideC] = await db
      .insert(rides)
      .values({ ...baseRide, seats: 3 })
      .returning({ id: rides.id });

    const resultC = await joinRide(loneUser.id, rideC.id);
    const savedC = await countPassengers(rideC.id);

    console.log(
      `Senaryo 3 (aynı etkinlikte ikinci yolculuk): cevap=${resultC.status}, veritabanındaki kayıt=${savedC}`,
    );

    const okC = resultC.status === "other_ride" && savedC === 0;

    if (okA && okB && okC) {
      console.log(
        "BAŞARILI: Koltuk kapasitesi, tekrar katılma ve tek-yolculuk kuralları eşzamanlı isteklerde de korunuyor.",
      );
    } else {
      console.error("BAŞARISIZ: Beklenen sonuçlar elde edilemedi.");
      process.exitCode = 1;
    }
  } finally {
    // Test kullanıcılarını sil; yolculuklar ve katılımlar da zincirleme silinir.
    await db.delete(users).where(
      inArray(
        users.id,
        created.map((user) => user.id),
      ),
    );
  }
}

main()
  .catch((error) => {
    console.error("Test çalışırken hata oluştu:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });