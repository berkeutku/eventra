import "dotenv/config";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import {
  events,
  notifications,
  ridePassengers,
  rides,
  users,
} from "../src/db/schema";
import {
  MAX_RIDES_PER_DAY,
  MAX_RIDES_PER_HOUR,
  countRecentRides,
  parseRideFields,
  updateRide,
  type RideFields,
} from "../src/lib/ride-edit";

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

const valid = {
  origin: "Başlangıç",
  destination: "Kadıköy",
  meetingPoint: "Ana kapı",
  departureTime: "23:30",
  duration: "45",
  seats: "3",
  cost: "600",
};

async function main() {
  // Alan doğrulama (veritabanı gerekmez)
  check("geçerli alanlar kabul edilir", parseRideFields(valid).ok);
  check("kısa başlangıç reddedilir", (() => { const r = parseRideFields({ ...valid, origin: "a" }); return !r.ok && Boolean(r.errors.origin); })());
  check("geçersiz saat reddedilir", (() => { const r = parseRideFields({ ...valid, departureTime: "25:00" }); return !r.ok && Boolean(r.errors.departureTime); })());
  check("süre sınırları", !parseRideFields({ ...valid, duration: "4" }).ok && !parseRideFields({ ...valid, duration: "601" }).ok && parseRideFields({ ...valid, duration: "5" }).ok);
  check("koltuk sınırları", !parseRideFields({ ...valid, seats: "0" }).ok && !parseRideFields({ ...valid, seats: "7" }).ok);
  check("masraf sınırları ve biçimi", !parseRideFields({ ...valid, cost: "5001" }).ok && !parseRideFields({ ...valid, cost: "-1" }).ok && !parseRideFields({ ...valid, cost: "abc" }).ok && parseRideFields({ ...valid, cost: "0" }).ok);
  check("çok uzun metin reddedilir", !parseRideFields({ ...valid, meetingPoint: "x".repeat(81) }).ok);
  check("sınır sabitleri", MAX_RIDES_PER_HOUR === 5 && MAX_RIDES_PER_DAY === 15);

  const [demo] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.source, "demo"))
    .limit(1);

  if (!demo) {
    throw new Error("Demo etkinlik yok.");
  }

  const stamp = Date.now();
  const created = await db
    .insert(users)
    .values(
      ["D", "P1", "P2", "O"].map((name, index) => ({
        name: `Edit ${name}`,
        email: `edit-${index}-${stamp}@edit-test.invalid`,
        passwordHash: "test",
        role: name === "D" ? ("driver" as const) : ("passenger" as const),
      })),
    )
    .returning({ id: users.id, name: users.name });

  const find = (name: string) => created.find((user) => user.name === `Edit ${name}`);
  const d = find("D");
  const p1 = find("P1");
  const p2 = find("P2");
  const o = find("O");

  if (!d || !p1 || !p2 || !o) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  try {
    const [ride] = await db
      .insert(rides)
      .values({ eventId: demo.id, driverId: d.id, origin: "T", destination: "T", meetingPoint: "T", departureTime: "23:30", durationMinutes: 30, seats: 3, totalCost: 100 })
      .returning({ id: rides.id });
    const rideId = ride.id;

    await db.insert(ridePassengers).values([
      { rideId, userId: p1.id },
      { rideId, userId: p2.id },
    ]);

    const t0 = new Date(Math.floor(Date.now() / 60_000) * 60_000 + 1000);
    let current: RideFields = { origin: "T", destination: "T", meetingPoint: "T", departureTime: "23:30", durationMinutes: 30, seats: 3, totalCost: 100 };

    const edit = async (changes: Partial<RideFields>, at: Date = t0) => {
      const status = await updateRide({ userId: d.id, rideId, fields: { ...current, ...changes }, now: at });
      if (status === "updated") {
        current = { ...current, ...changes };
      }
      return status;
    };

    const countNotes = async () =>
      (
        await db
          .select({ id: notifications.id })
          .from(notifications)
          .where(and(inArray(notifications.userId, [p1.id, p2.id, d.id, o.id]), eq(notifications.type, "ride_updated")))
      ).length;

    check("sürücü olmayan düzenleyemez", (await updateRide({ userId: o.id, rideId, fields: { ...current, origin: "X" }, now: t0 })) === "not_owner");
    check("yolcunun kendisi de düzenleyemez", (await updateRide({ userId: p1.id, rideId, fields: { ...current, origin: "X" }, now: t0 })) === "not_owner");
    check("var olmayan yolculuk", (await updateRide({ userId: d.id, rideId: "00000000-0000-4000-8000-000000000000", fields: current, now: t0 })) === "not_found");
    check("bozuk yolculuk kimliği hata vermez", (await updateRide({ userId: d.id, rideId: "bozuk", fields: current, now: t0 })) === "not_found");
    check("yolcu sayısından az koltuk reddedilir", (await edit({ seats: 1 })) === "too_few_seats");
    check("değişiklik yoksa 'unchanged'", (await edit({})) === "unchanged");
    check("hiçbir bildirim gitmedi", (await countNotes()) === 0);

    check("varış değişikliği kaydedilir", (await edit({ destination: "Beşiktaş" })) === "updated");
    const [row1] = await db.select().from(rides).where(eq(rides.id, rideId));
    check("yolculuk satırı güncellendi", row1.destination === "Beşiktaş");

    const notesP1 = await db.select().from(notifications).where(and(eq(notifications.userId, p1.id), eq(notifications.type, "ride_updated")));
    check("iki yolcuya birer bildirim gitti, sürücü ve başkası almadı", (await countNotes()) === 2 && notesP1.length === 1);
    check("bildirim bağlantısı yolculuk sayfasına gider", notesP1[0]?.link === `/events/${demo.id}/yolculuk/${rideId}`);

    check("yalnızca koltuk değişikliği kaydedilir", (await edit({ seats: 4 })) === "updated");
    check("koltuk değişikliği bildirim üretmez", (await countNotes()) === 2);

    check("aynı dakikada ikinci değişiklik kaydedilir", (await edit({ meetingPoint: "Yeni kapı" }, new Date(t0.getTime() + 10_000))) === "updated");
    check("aynı dakikadaki bildirim tekrar gönderilmez", (await countNotes()) === 2);

    check("sonraki dakikalarda saat değişikliği kaydedilir", (await edit({ departureTime: "23:45" }, new Date(t0.getTime() + 120_000))) === "updated");
    const [row2] = await db.select().from(rides).where(eq(rides.id, rideId));
    check("saat doğru saklandı", row2.departureTime.startsWith("23:45"));
    check("yeni dakikada yolcular yeniden bilgilendirilir", (await countNotes()) === 4);

    check("masraf değişikliği de bildirim üretir", (await edit({ totalCost: 250 }, new Date(t0.getTime() + 240_000))) === "updated" && (await countNotes()) === 6);

    // Yolculuk oluşturma sayacı
    await db.insert(rides).values([
      { eventId: demo.id, driverId: d.id, origin: "A", destination: "A", meetingPoint: "A", departureTime: "22:00", durationMinutes: 30, seats: 2, totalCost: 50 },
      { eventId: demo.id, driverId: d.id, origin: "B", destination: "B", meetingPoint: "B", departureTime: "22:00", durationMinutes: 30, seats: 2, totalCost: 50 },
      { eventId: demo.id, driverId: d.id, origin: "C", destination: "C", meetingPoint: "C", departureTime: "22:00", durationMinutes: 30, seats: 2, totalCost: 50, createdAt: new Date(Date.now() - 2 * 86_400_000) },
    ]);
    const recent = await countRecentRides(d.id);
    check("son saat ve son gün sayıları doğru (eski yolculuk sayılmaz)", recent.hour === 3 && recent.day === 3);
    const later = await countRecentRides(d.id, new Date(Date.now() + 2 * 3_600_000));
    check("iki saat sonra saatlik sayaç sıfırlanır, günlük kalır", later.hour === 0 && later.day === 3);
    check("başka sürücünün sayacı sıfır", (await countRecentRides(o.id)).day === 0);
  } finally {
    await db.delete(rides).where(eq(rides.driverId, d.id));
    await db.delete(users).where(inArray(users.id, created.map((user) => user.id)));
  }

  console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Test çalışırken hata oluştu:", error instanceof Error ? error.message : "bilinmeyen hata");
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });