import "dotenv/config";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import {
  events,
  loginAttempts,
  notifications,
  pushSubscriptions,
  ridePassengers,
  rides,
  users,
} from "../src/db/schema";
import { deleteAccountData } from "../src/lib/account";

const EMAIL_DOMAIN = "@delete-test.invalid";

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean) {
  if (ok) {
    passed += 1;
    console.log(`  geçti: ${name}`);
  } else {
    failed += 1;
    console.log(`  BAŞARISIZ: ${name}`);
  }
}

async function main() {
  const [event] = await db.select({ id: events.id }).from(events).limit(1);

  if (!event) {
    console.error("Veritabanında etkinlik yok. Önce seed-events çalıştırılmalı.");
    process.exitCode = 1;
    return;
  }

  const stamp = Date.now();
  const names = ["Test Sürücü", "Test Yolcu 1", "Test Yolcu 2", "Test Diğer Sürücü"];
  const created = await db
    .insert(users)
    .values(
      names.map((name, index) => ({
        name,
        email: `delete-${index}-${stamp}${EMAIL_DOMAIN}`,
        passwordHash: "test",
        role: index === 0 || index === 3 ? ("driver" as const) : ("passenger" as const),
      })),
    )
    .returning({ id: users.id, name: users.name, email: users.email });

  const driver = created.find((user) => user.name === "Test Sürücü");
  const passenger1 = created.find((user) => user.name === "Test Yolcu 1");
  const passenger2 = created.find((user) => user.name === "Test Yolcu 2");
  const other = created.find((user) => user.name === "Test Diğer Sürücü");

  if (!driver || !passenger1 || !passenger2 || !other) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  const ids = created.map((user) => user.id);

  try {
    const baseRide = {
      eventId: event.id,
      origin: "Test Başlangıç",
      destination: "Test Varış",
      meetingPoint: "Test",
      departureTime: "23:30",
      durationMinutes: 30,
      totalCost: 100,
      seats: 3,
    };

    const [ride] = await db
      .insert(rides)
      .values({ ...baseRide, driverId: driver.id })
      .returning({ id: rides.id });
    const [otherRide] = await db
      .insert(rides)
      .values({ ...baseRide, driverId: other.id })
      .returning({ id: rides.id });

    await db.insert(ridePassengers).values([
      { rideId: ride.id, userId: passenger1.id },
      { rideId: ride.id, userId: passenger2.id },
      { rideId: otherRide.id, userId: passenger1.id },
    ]);

    await db.insert(pushSubscriptions).values({
      userId: driver.id,
      endpoint: `https://push.example.invalid/${stamp}/driver`,
      p256dh: "key",
      auth: "auth",
    });
    await db.insert(loginAttempts).values({ email: driver.email });
    await db.insert(notifications).values({
      userId: driver.id,
      type: "ride_joined",
      title: "Eski bildirim",
      body: "Sürücüye ait bildirim",
      link: "/events/test",
    });

    // Sürücü hesabını sil
    const first = await deleteAccountData(driver.id);
    check("sürücü hesabı silindi", first === true);

    const driverRows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, driver.id));
    check("sürücünün kullanıcı kaydı yok", driverRows.length === 0);

    const rideRows = await db
      .select({ id: rides.id })
      .from(rides)
      .where(eq(rides.id, ride.id));
    check("sürücünün yolculuğu silindi", rideRows.length === 0);

    const stillThere = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, [passenger1.id, passenger2.id]));
    check("yolcuların hesapları duruyor", stillThere.length === 2);

    const cancelled1 = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, passenger1.id),
          eq(notifications.type, "ride_cancelled"),
        ),
      );
    check(
      "birinci yolcuya iptal bildirimi gitti",
      cancelled1.length === 1 && cancelled1[0].link.startsWith("/events/"),
    );

    const cancelled2 = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, passenger2.id),
          eq(notifications.type, "ride_cancelled"),
        ),
      );
    check("ikinci yolcuya iptal bildirimi gitti", cancelled2.length === 1);

    const subs = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, driver.id));
    check("sürücünün telefon abonelikleri silindi", subs.length === 0);

    const attempts = await db
      .select({ id: loginAttempts.id })
      .from(loginAttempts)
      .where(eq(loginAttempts.email, driver.email));
    check("e-postanın giriş deneme kayıtları silindi", attempts.length === 0);

    check(
      "aynı hesabı ikinci kez silmek false döner",
      (await deleteAccountData(driver.id)) === false,
    );

    // Yolcu hesabını sil
    const second = await deleteAccountData(passenger1.id);
    check("yolcu hesabı silindi", second === true);

    const informed = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, other.id),
          eq(notifications.type, "ride_left"),
        ),
      );
    check(
      "diğer sürücüye adsız bilgi bildirimi gitti",
      informed.length === 1 && !informed[0].body.includes("Test Yolcu 1"),
    );

    const otherRideRows = await db
      .select({ id: rides.id })
      .from(rides)
      .where(eq(rides.id, otherRide.id));
    check("diğer sürücünün yolculuğu duruyor", otherRideRows.length === 1);

    const passenger2Notes = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(eq(notifications.userId, passenger2.id));
    check(
      "başka yolcunun bildirim sayısı değişmedi",
      passenger2Notes.length === 1,
    );
  } finally {
    // Kalan test kullanıcılarını sil (yolculuklar ve bildirimler zincirleme silinir).
    await db.delete(users).where(inArray(users.id, ids));
  }

  console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

  if (failed > 0) {
    process.exitCode = 1;
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