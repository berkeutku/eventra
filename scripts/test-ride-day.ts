import { and, eq, inArray } from "drizzle-orm";
import {
  nextStatus,
  parseVehicle,
  rideDayOpen,
} from "../src/lib/ride-day-rules";

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
  check(
    "durum sırası: planlandı -> yolda -> vardı -> son",
    nextStatus("planned") === "departed" &&
      nextStatus("departed") === "arrived" &&
      nextStatus("arrived") === null,
  );

  const empty = parseVehicle("   ");
  check("boş araç bilgisi null kabul edilir", empty.ok && empty.value === null);

  const good = parseVehicle("Beyaz Renault Clio, plaka sonu 123");
  check("normal araç bilgisi kabul edilir", good.ok && good.value !== null);

  check("telefon içeren araç bilgisi reddedilir", !parseVehicle("Clio 0532 123 45 67").ok);
  check("tam plaka reddedilir", !parseVehicle("Beyaz Clio 34 ABC 123").ok);

  const start = new Date("2026-11-20T20:00:00Z");
  const at = (hours: number) => new Date(start.getTime() + hours * 3_600_000);

  check(
    "pencere: 3 saat önce açılır, daha önce kapalı",
    rideDayOpen(start, null, at(-2)) && !rideDayOpen(start, null, at(-4)),
  );
  check(
    "pencere: bitişten 24 saat sonra kapanır (bitiş yoksa başlangıç + 3 saat)",
    rideDayOpen(start, null, at(26)) && !rideDayOpen(start, null, at(28)),
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
  const day = await import("../src/lib/ride-day");

  const tag = `rd-${Date.now()}`;
  const userIds: string[] = [];

  async function makeUser(name: string): Promise<string> {
    const [created] = await db
      .insert(schema.users)
      .values({
        name: `${name} Test`,
        email: `${tag}-${name}@example.test`,
        passwordHash: "x",
      })
      .returning({ id: schema.users.id });
    userIds.push(created.id);
    return created.id;
  }

  const [event] = await db
    .select({ id: schema.events.id, startsAt: schema.events.startsAt })
    .from(schema.events)
    .where(eq(schema.events.source, "demo"))
    .limit(1);

  if (!event) {
    throw new Error("Veritabanında demo etkinlik yok.");
  }

  async function makeRide(driverId: string): Promise<string> {
    const [created] = await db
      .insert(schema.rides)
      .values({
        eventId: event.id,
        driverId,
        origin: "Test Başlangıç",
        destination: "Test Varış",
        meetingPoint: "Test Nokta",
        departureTime: "23:30",
        durationMinutes: 40,
        seats: 3,
        totalCost: 300,
      })
      .returning({ id: schema.rides.id });
    return created.id;
  }

  async function statusCount(userId: string): Promise<number> {
    const rows = await db
      .select({ id: schema.notifications.id })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.type, "ride_status"),
        ),
      );
    return rows.length;
  }

  try {
    const driver = await makeUser("surucu");
    const p1 = await makeUser("yolcu1");
    const outsider = await makeUser("disaridan");

    const ride = await makeRide(driver);
    const ride2 = await makeRide(driver);
    await db.insert(schema.ridePassengers).values({ rideId: ride, userId: p1 });

    const start = new Date(event.startsAt);

    check("araç bilgisi: sürücü olmayan değiştiremez", (await day.setVehicle(p1, ride, "Mavi Clio")) === "not_found");
    check("araç bilgisi: sürücü kaydeder", (await day.setVehicle(driver, ride, "Mavi Clio, plaka sonu 123")) === "saved");
    check("araç bilgisi okunur", (await day.getRideDayState(ride, start))?.vehicle === "Mavi Clio, plaka sonu 123");
    check("başlangıç durumu 'planned'", (await day.getRideDayState(ride, start))?.status === "planned");

    check("durum: yolcu değiştiremez", (await day.changeStatus({ userId: p1, rideId: ride, to: "departed", now: start })) === "not_owner");
    check("durum: sırayı atlayamaz (varış önce)", (await day.changeStatus({ userId: driver, rideId: ride, to: "arrived", now: start })) === "bad_transition");
    check("durum: pencere kapalıyken değişmez", (await day.changeStatus({ userId: driver, rideId: ride2, to: "departed", now: new Date(start.getTime() - 5 * 3_600_000) })) === "closed");
    check("durum: sürücü yola çıkar", (await day.changeStatus({ userId: driver, rideId: ride, to: "departed", now: start })) === "changed");
    check("yolcuya bildirim gitti, sürücüye gitmedi", (await statusCount(p1)) === 1 && (await statusCount(driver)) === 0);
    check("aynı durum ikinci kez uygulanmaz", (await day.changeStatus({ userId: driver, rideId: ride, to: "departed", now: start })) === "bad_transition" && (await statusCount(p1)) === 1);
    check("durum: sürücü varır, yolcuya ikinci bildirim gider", (await day.changeStatus({ userId: driver, rideId: ride, to: "arrived", now: start })) === "changed" && (await statusCount(p1)) === 2);
    check("durum 'arrived' olarak saklandı", (await day.getRideDayState(ride, start))?.status === "arrived");

    check("paylaşım: yolculuktaki olmayan oluşturamaz", (await day.createShareLink(outsider, ride)).status === "not_participant");
    const first = await day.createShareLink(p1, ride);
    check("paylaşım: yolcu bağlantı oluşturur", first.status === "ok");

    if (first.status === "ok") {
      const shared = await day.getShare(first.token);
      check("paylaşım sayfası verisi doğru", !!shared && shared.origin === "Test Başlangıç" && shared.vehicle === "Mavi Clio, plaka sonu 123" && shared.driverFirstName === "surucu");
      check("paylaşımda yolcu adı ve paylaşan kimliği yok", !JSON.stringify(shared).includes("yolcu1") && !JSON.stringify(shared).includes("Test Test"));
      check("geçersiz token null döner", (await day.getShare("kisa")) === null && (await day.getShare("a".repeat(32))) === null);
      check("25 saat sonra bağlantı çalışmaz", (await day.getShare(first.token, new Date(Date.now() + 25 * 3_600_000))) === null);

      const stored = await db
        .select({ tokenHash: schema.rideShares.tokenHash })
        .from(schema.rideShares)
        .where(eq(schema.rideShares.rideId, ride));
      check("token düz metin saklanmaz", stored.length === 1 && stored[0].tokenHash !== first.token);
    }

    for (let i = 0; i < 4; i += 1) {
      await day.createShareLink(p1, ride);
    }
    check("günde 5 bağlantı sınırı uygulanır", (await day.createShareLink(p1, ride)).status === "rate_limited");
  } finally {
    // Kullanıcıların silinmesi yolculuk, paylaşım ve bildirimleri zincirleme siler.
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