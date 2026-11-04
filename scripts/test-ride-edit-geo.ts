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
import { updateRide, type RideFields } from "../src/lib/ride-edit";

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
      ["D", "P", "O"].map((name, index) => ({
        name: `EditGeo ${name}`,
        email: `editgeo-${index}-${stamp}@edit-test.invalid`,
        passwordHash: "test",
        role: name === "D" ? ("driver" as const) : ("passenger" as const),
      })),
    )
    .returning({ id: users.id, name: users.name });

  const find = (name: string) => created.find((user) => user.name === `EditGeo ${name}`);
  const d = find("D");
  const p = find("P");
  const o = find("O");

  if (!d || !p || !o) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  try {
    const [ride] = await db
      .insert(rides)
      .values({ eventId: demo.id, driverId: d.id, origin: "T", destination: "T", meetingPoint: "T", departureTime: "23:30", durationMinutes: 30, seats: 3, totalCost: 100 })
      .returning({ id: rides.id });
    const rideId = ride.id;
    await db.insert(ridePassengers).values({ rideId, userId: p.id });

    const t0 = new Date(Math.floor(Date.now() / 60_000) * 60_000 + 1000);
    const at = (seconds: number) => new Date(t0.getTime() + seconds * 1000);
    let fields: RideFields = { origin: "T", destination: "T", meetingPoint: "T", departureTime: "23:30", durationMinutes: 30, seats: 3, totalCost: 100 };

    const notes = async () =>
      (await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, p.id), eq(notifications.type, "ride_updated")))).length;

    check("alan ve harita değişmediyse 'unchanged'", (await updateRide({ userId: d.id, rideId, fields, now: t0 })) === "unchanged");
    check("harita değişmediyse bildirim yok", (await notes()) === 0);

    check("yalnızca harita değişti: 'updated'", (await updateRide({ userId: d.id, rideId, fields, geoChanged: true, now: t0 })) === "updated");
    check("harita değişikliği yolcuya bildirim gönderir", (await notes()) === 1);

    check("aynı dakikadaki ikinci harita değişikliği kaydedilir", (await updateRide({ userId: d.id, rideId, fields, geoChanged: true, now: t0 })) === "updated");
    check("aynı dakikada bildirim tekrarlanmaz", (await notes()) === 1);

    check("sonraki dakikada yeniden bildirilir", (await updateRide({ userId: d.id, rideId, fields, geoChanged: true, now: at(120) })) === "updated" && (await notes()) === 2);

    check("sürücü olmayan harita değişikliği yapamaz", (await updateRide({ userId: o.id, rideId, fields, geoChanged: true, now: at(180) })) === "not_owner");
    check("reddedilen deneme bildirim üretmez", (await notes()) === 2);

    fields = { ...fields, seats: 4 };
    check("yalnızca koltuk değişti ve harita aynı: bildirim yok", (await updateRide({ userId: d.id, rideId, fields, now: at(240) })) === "updated" && (await notes()) === 2);

    fields = { ...fields, seats: 5 };
    check("koltuk değişti ve harita da değişti: bildirim gider", (await updateRide({ userId: d.id, rideId, fields, geoChanged: true, now: at(360) })) === "updated" && (await notes()) === 3);
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