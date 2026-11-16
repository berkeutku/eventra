import { exportFileName, wrapExport } from "../src/lib/data-export-rules";

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

function pureChecks() {
  const now = new Date("2026-11-16T10:00:00Z");

  check(
    "dosya adı tarih içerir",
    exportFileName(now) === "eventra-verilerim-2026-11-16.json",
  );

  const wrapped = wrapExport({ a: 1 }, now);
  check(
    "zarf: not, oluşturulma zamanı ve veriler bulunur",
    wrapped.bilgi.length > 20 &&
      wrapped.olusturulma === "2026-11-16T10:00:00.000Z" &&
      wrapped.veriler.a === 1,
  );
}

async function dbChecks() {
  const env = process as unknown as { loadEnvFile?: (path?: string) => void };

  if (!process.env.DATABASE_URL) {
    try {
      env.loadEnvFile?.(".env");
    } catch {
      // .env yoksa ortam değişkeni başka yoldan verilmiş olmalı.
    }
  }

  const { db } = await import("../src/db");
  const schema = await import("../src/db/schema");
  const { collectUserData } = await import("../src/lib/data-export");
  const { inArray } = await import("drizzle-orm");

  const tag = `dx-${Date.now()}`;
  const userIds: string[] = [];

  try {
    const [event] = await db
      .select({ id: schema.events.id })
      .from(schema.events)
      .limit(1);

    if (!event) {
      check("test için en az bir etkinlik gerekir", false);
      return;
    }

    async function makeUser(name: string): Promise<{ id: string; email: string }> {
      const email = `${tag}-${name}@example.test`;
      const [created] = await db
        .insert(schema.users)
        .values({
          name: `${name} Test`,
          email,
          passwordHash: `PWHASH-${tag}-${name}`,
        })
        .returning({ id: schema.users.id });
      userIds.push(created.id);
      return { id: created.id, email };
    }

    const driver = await makeUser("surucu");
    const passenger = await makeUser("yolcu");

    const [ride] = await db
      .insert(schema.rides)
      .values({
        eventId: event.id,
        driverId: driver.id,
        origin: "Test Başlangıç",
        destination: "Test Varış",
        meetingPoint: "Test Nokta",
        departureTime: "21:00",
        durationMinutes: 30,
        seats: 3,
        totalCost: 300,
      })
      .returning({ id: schema.rides.id });

    await db
      .insert(schema.ridePassengers)
      .values({ rideId: ride.id, userId: passenger.id });

    await db.insert(schema.rideRatings).values({
      rideId: ride.id,
      raterId: passenger.id,
      rateeId: driver.id,
      score: 5,
      comment: `YORUM-${tag}`,
    });

    await db.insert(schema.rideMessages).values({
      rideId: ride.id,
      senderId: passenger.id,
      body: `MESAJ-${tag}`,
    });

    await db.insert(schema.ticketVerifications).values({
      userId: driver.id,
      eventId: event.id,
      codeHash: `CODEHASH-${tag}`,
    });

    await db.insert(schema.pushSubscriptions).values({
      userId: driver.id,
      endpoint: `https://example.test/ENDPOINT-${tag}`,
      p256dh: `P256-${tag}`,
      auth: `AUTH-${tag}`,
    });

    const driverData = await collectUserData(driver.id);
    const driverJson = JSON.stringify(driverData);
    const passengerData = await collectUserData(passenger.id);
    const passengerJson = JSON.stringify(passengerData);

    check(
      "sürücü: profil ve oluşturduğu yolculuk gelir",
      driverData.profil?.email === driver.email &&
        driverData.olusturdugumYolculuklar.length === 1,
    );
    check(
      "sürücü: hakkındaki puan ve yorum gelir",
      driverData.hakkimdakiPuanlar.length === 1 &&
        driverData.hakkimdakiPuanlar[0].comment === `YORUM-${tag}`,
    );
    check(
      "sürücü: bilet doğrulaması gelir, cihaz sayısı 1",
      driverData.biletDogrulamalarim.length === 1 &&
        driverData.bildirimTercihim.kayitliCihazSayisi === 1,
    );
    check(
      "yolcu: katıldığı yolculuk, verdiği puan ve mesajı gelir",
      passengerData.katildigimYolculuklar.length === 1 &&
        passengerData.verdigimPuanlar.length === 1 &&
        passengerData.sohbetMesajlarim.length === 1 &&
        passengerData.hakkimdakiPuanlar.length === 0,
    );

    check(
      "gizli alanlar sızmaz: parola özeti, bilet özeti, cihaz anahtarları",
      !driverJson.includes("PWHASH") &&
        !driverJson.includes("CODEHASH") &&
        !driverJson.includes("ENDPOINT") &&
        !driverJson.includes("P256") &&
        !driverJson.includes("AUTH-") &&
        !passengerJson.includes("PWHASH"),
    );
    check(
      "başkasının kimliği sızmaz: sürücü dosyasında yolcunun e-postası/adı yok",
      !driverJson.includes(passenger.email) &&
        !driverJson.includes("yolcu Test") &&
        !passengerJson.includes(driver.email) &&
        !passengerJson.includes("surucu Test"),
    );
  } finally {
    // Kullanıcıların silinmesi yolculuk, puan, mesaj, doğrulama ve abonelikleri zincirleme siler.
    if (userIds.length > 0) {
      await db.delete(schema.users).where(inArray(schema.users.id, userIds));
    }
  }
}

async function main() {
  pureChecks();

  try {
    await dbChecks();
  } catch (error) {
    failed += 1;
    console.log(
      "  BAŞARISIZ: veritabanı testi çalışmadı:",
      error instanceof Error ? error.message : error,
    );
  }

  console.log(`\n${passed} test geçti, ${failed} test başarısız.`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
