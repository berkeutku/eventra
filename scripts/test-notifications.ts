import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import { events, rides, users } from "../src/db/schema";
import {
  countUnread,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../src/lib/notifications";
import { joinRide } from "../src/lib/ride-join";
import { deleteRide, leaveRide } from "../src/lib/ride-manage";

const EMAIL_DOMAIN = "@notify-test.invalid";

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
  const names = ["Test Sürücü", "Test Yolcu 1", "Test Yolcu 2", "Test Yabancı"];
  const created = await db
    .insert(users)
    .values(
      names.map((name, index) => ({
        name,
        email: `user-${index}-${stamp}${EMAIL_DOMAIN}`,
        passwordHash: "test",
        role: index === 0 ? ("driver" as const) : ("passenger" as const),
      })),
    )
    .returning({ id: users.id, name: users.name });

  const driver = created.find((user) => user.name === "Test Sürücü");
  const passenger1 = created.find((user) => user.name === "Test Yolcu 1");
  const passenger2 = created.find((user) => user.name === "Test Yolcu 2");
  const stranger = created.find((user) => user.name === "Test Yabancı");

  if (!driver || !passenger1 || !passenger2 || !stranger) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  try {
    const [ride] = await db
      .insert(rides)
      .values({
        eventId: event.id,
        driverId: driver.id,
        origin: "Test Başlangıç",
        destination: "Test Varış",
        meetingPoint: "Test",
        departureTime: "23:30",
        durationMinutes: 30,
        totalCost: 100,
        seats: 3,
      })
      .returning({ id: rides.id });

    // Katılma bildirimleri
    const join1 = await joinRide(passenger1.id, ride.id);
    check("birinci yolcu katıldı", join1.status === "joined");
    check("sürücünün 1 okunmamış bildirimi var", (await countUnread(driver.id)) === 1);

    const driverList = await listNotifications(driver.id);
    check(
      "bildirim türü ride_joined ve yolcu adını içeriyor",
      driverList[0]?.type === "ride_joined" &&
        driverList[0].body.includes("Test Yolcu 1"),
    );
    check(
      "bildirim bağlantısı site içi bir yol",
      driverList[0]?.link.startsWith("/events/") === true,
    );
    check(
      "katılan yolcuya bildirim gitmedi",
      (await countUnread(passenger1.id)) === 0,
    );

    await joinRide(passenger2.id, ride.id);
    check("ikinci katılımdan sonra 2 okunmamış", (await countUnread(driver.id)) === 2);

    const failedJoin = await joinRide(driver.id, ride.id);
    check(
      "sürücü kendi yolculuğuna katılamaz ve bildirim oluşmaz",
      failedJoin.status === "own_ride" && (await countUnread(driver.id)) === 2,
    );

    // Yetki kontrolü
    const firstId = driverList[0].id;
    check(
      "başka kullanıcı bildirimi okundu işaretleyemez",
      (await markNotificationRead(stranger.id, firstId)) === false,
    );
    check(
      "başkasının işlemi okunmamış sayısını değiştirmedi",
      (await countUnread(driver.id)) === 2,
    );
    check(
      "yabancı kullanıcı başkasının bildirimlerini göremez",
      (await listNotifications(stranger.id)).length === 0,
    );

    // Okundu durumu kalıcı
    check(
      "sahibi bildirimi okundu işaretleyebilir",
      (await markNotificationRead(driver.id, firstId)) === true,
    );
    check("okunmamış sayısı 1'e düştü", (await countUnread(driver.id)) === 1);
    check(
      "geçersiz kimlik reddedilir",
      (await markNotificationRead(driver.id, "gecersiz")) === false,
    );
    await markAllNotificationsRead(driver.id);
    check("tümünü okundu yapınca sayı 0", (await countUnread(driver.id)) === 0);

    // Ayrılma
    const left = await leaveRide(passenger1.id, ride.id);
    check("birinci yolcu ayrıldı", left === "left");
    const afterLeave = await listNotifications(driver.id);
    check(
      "sürücüye ride_left bildirimi gitti",
      (await countUnread(driver.id)) === 1 && afterLeave[0]?.type === "ride_left",
    );
    const leftAgain = await leaveRide(passenger1.id, ride.id);
    check(
      "ikinci ayrılma işlemi bildirim üretmez",
      leftAgain === "not_joined" && (await countUnread(driver.id)) === 1,
    );

    // Silme
    check(
      "sürücü olmayan kullanıcı yolculuğu silemez",
      (await deleteRide(stranger.id, ride.id)) === "not_found",
    );
    const stillThere = await db
      .select({ id: rides.id })
      .from(rides)
      .where(eq(rides.id, ride.id));
    check("yolculuk hâlâ duruyor", stillThere.length === 1);

    check(
      "sürücü yolculuğu silebilir",
      (await deleteRide(driver.id, ride.id)) === "deleted",
    );
    const cancelled = await listNotifications(passenger2.id);
    check(
      "kalan yolcuya ride_cancelled bildirimi gitti",
      (await countUnread(passenger2.id)) === 1 &&
        cancelled[0]?.type === "ride_cancelled" &&
        cancelled[0].link.startsWith("/events/"),
    );
    check(
      "önceden ayrılan yolcuya iptal bildirimi gitmedi",
      (await countUnread(passenger1.id)) === 0,
    );
  } finally {
    // Test kullanıcılarını sil; yolculuklar, katılımlar ve bildirimler zincirleme silinir.
    await db.delete(users).where(
      inArray(
        users.id,
        created.map((user) => user.id),
      ),
    );
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