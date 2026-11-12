import { and, eq, inArray } from "drizzle-orm";
import {
  destinationsMatch,
  requestFitsRide,
  timeMatches,
} from "../src/lib/request-match-rules";

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
    "varış yeri: aynı ve içeren eşleşir",
    destinationsMatch("Kadıköy", "kadikoy") &&
      destinationsMatch("Kadıköy", "Kadıköy, İstanbul"),
  );
  check(
    "varış yeri: yalnızca ortak şehir adı eşleşme sayılmaz",
    !destinationsMatch("Beşiktaş, İstanbul", "Kadıköy, İstanbul"),
  );
  check(
    "varış yeri: farklı, boş ve çok kısa eşleşmez",
    !destinationsMatch("Kadıköy", "Ankara") &&
      !destinationsMatch("", "Kadıköy") &&
      !destinationsMatch("ab", "abc"),
  );
  check(
    "saat: girilmediyse her saat uyar, 60 dakikaya kadar uyar",
    timeMatches(null, "10:00") &&
      timeMatches("23:30", "23:45") &&
      timeMatches("23:30", "00:20"),
  );
  check(
    "saat: 60 dakikadan fazla fark uymaz",
    !timeMatches("23:30", "03:00") && !timeMatches("23:30", "00:40"),
  );
  check(
    "talep yolculuğa: koltuk yetmezse uymaz",
    requestFitsRide(
      { destination: "Kadıköy", preferredTime: null, seats: 2 },
      { destination: "Kadıköy", departureTime: "23:30", seatsLeft: 2 },
    ) &&
      !requestFitsRide(
        { destination: "Kadıköy", preferredTime: null, seats: 2 },
        { destination: "Kadıköy", departureTime: "23:30", seatsLeft: 1 },
      ),
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
  const { notifyMatchingRequests, countMatchingRides } = await import(
    "../src/lib/request-matching"
  );

  const tag = `rm-${Date.now()}`;
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
    .select({ id: schema.events.id })
    .from(schema.events)
    .where(eq(schema.events.source, "demo"))
    .limit(1);

  if (!event) {
    throw new Error("Veritabanında demo etkinlik yok.");
  }

  async function makeRide(
    driverId: string,
    destination: string,
    departureTime: string,
    seats: number,
  ): Promise<string> {
    const [created] = await db
      .insert(schema.rides)
      .values({
        eventId: event.id,
        driverId,
        origin: "Test Başlangıç",
        destination,
        meetingPoint: "Test Nokta",
        departureTime,
        durationMinutes: 40,
        seats,
        totalCost: 300,
      })
      .returning({ id: schema.rides.id });
    return created.id;
  }

  async function received(userId: string): Promise<number> {
    const rows = await db
      .select({ id: schema.notifications.id })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.type, "ride_request_match"),
        ),
      );
    return rows.length;
  }

  try {
    const driver = await makeUser("surucu");
    const p1 = await makeUser("yolcu1");
    const p2 = await makeUser("yolcu2");
    const p3 = await makeUser("yolcu3");
    const p4 = await makeUser("yolcu4");

    const requests = [
      { id: p1, destination: "Kadıköy", time: "23:30", seats: 1 },
      { id: p2, destination: "Ankara", time: null, seats: 1 },
      { id: p3, destination: "kadikoy", time: null, seats: 2 },
      { id: p4, destination: "Kadıköy", time: "23:30", seats: 1 },
      { id: driver, destination: "Kadıköy", time: null, seats: 1 },
    ];

    for (const item of requests) {
      await db.insert(schema.rideRequests).values({
        eventId: event.id,
        passengerId: item.id,
        destination: item.destination,
        preferredTime: item.time,
        seats: item.seats,
      });
    }

    const r1 = await makeRide(driver, "Kadıköy, İstanbul", "23:45", 3);
    // p4 bu etkinlikte zaten bir yolculuğa katılmış: bildirim almamalı.
    await db.insert(schema.ridePassengers).values({ rideId: r1, userId: p4 });

    const n1 = await notifyMatchingRequests(r1);
    check("ilk yolculuk: yalnızca uyan iki yolcuya bildirim yazıldı", n1 === 2);
    check("uyan yolcular bildirim aldı", (await received(p1)) === 1 && (await received(p3)) === 1);
    check("uymayan, katılmış ve sürücü bildirim almadı", (await received(p2)) === 0 && (await received(p4)) === 0 && (await received(driver)) === 0);

    const [sample] = await db
      .select({
        link: schema.notifications.link,
        body: schema.notifications.body,
      })
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, p1))
      .limit(1);

    check("bildirim bağlantısı yolculuk sayfasına gider", sample?.link === `/events/${event.id}/yolculuk/${r1}`);
    check("bildirimde ad ve not yok, yalnızca güzergâh ve saat", !!sample && sample.body.includes("Kadıköy, İstanbul") && sample.body.includes("23:45") && !sample.body.includes("yolcu1") );

    check("aynı yolculuk için ikinci çağrı tekrar bildirim üretmez", (await notifyMatchingRequests(r1)) === 0 && (await received(p1)) === 1);

    check(
      "talep verirken uyan açık yolculuk sayılır, uymayan sayılmaz",
      (await countMatchingRides(event.id, { destination: "Kadıköy", preferredTime: "23:30", seats: 1 }, p1)) === 1 &&
        (await countMatchingRides(event.id, { destination: "Ankara", preferredTime: null, seats: 1 }, p2)) === 0,
    );

    const r2 = await makeRide(driver, "Kadıköy", "03:00", 3);
    check("saati uymayan talep bildirilmez, saat girmeyen bildirilir", (await notifyMatchingRequests(r2)) === 1 && (await received(p3)) === 2);

    const r3 = await makeRide(driver, "Kadıköy", "23:30", 1);
    check("koltuğu yetmeyen talep bildirilmez", (await notifyMatchingRequests(r3)) === 1 && (await received(p1)) === 2 && (await received(p3)) === 2);

    const r4 = await makeRide(driver, "Kadıköy", "23:30", 3);
    check("üçüncü eşleşme hâlâ gider", (await notifyMatchingRequests(r4)) === 2);

    const r5 = await makeRide(driver, "Kadıköy", "23:30", 3);
    check("6 saatte 3 bildirim sınırı uygulanır", (await notifyMatchingRequests(r5)) === 0 && (await received(p1)) === 3 && (await received(p3)) === 3);

    check("var olmayan yolculuk 0 döner", (await notifyMatchingRequests("00000000-0000-0000-0000-000000000000")) === 0);
  } finally {
    // Kullanıcıların silinmesi yolculuk, talep ve bildirimleri zincirleme siler.
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