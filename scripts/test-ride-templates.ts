import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import { events, rides, users } from "../src/db/schema";
import { MAX_TEMPLATES, listRideTemplates } from "../src/lib/ride-templates";

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
    console.error("Demo etkinlik yok. Önce seed-events çalıştırılmalı.");
    process.exitCode = 1;
    return;
  }

  const stamp = Date.now();
  const created = await db
    .insert(users)
    .values(
      ["D1", "D2", "D3", "D4"].map((name, index) => ({
        name: `Tpl ${name}`,
        email: `tpl-${index}-${stamp}@tpl-test.invalid`,
        passwordHash: "test",
        role: "driver" as const,
      })),
    )
    .returning({ id: users.id, name: users.name });

  const find = (name: string) => created.find((user) => user.name === name);
  const d1 = find("Tpl D1");
  const d2 = find("Tpl D2");
  const d3 = find("Tpl D3");
  const d4 = find("Tpl D4");

  if (!d1 || !d2 || !d3 || !d4) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  const ride = (driverId: string, origin: string, time: string, cost: number, seats = 3) => ({
    eventId: demo.id,
    driverId,
    origin,
    destination: "Varış",
    meetingPoint: "Buluşma",
    departureTime: time,
    durationMinutes: 30,
    seats,
    totalCost: cost,
  });

  try {
    await db.insert(rides).values(ride(d1.id, "A", "23:30:00", 100));
    await db.insert(rides).values(ride(d1.id, "A", "23:30:00", 100));
    await db.insert(rides).values(ride(d1.id, "C", "22:15:00", 250, 2));
    await db.insert(rides).values(ride(d2.id, "Z", "21:00:00", 80));

    for (let i = 0; i < 7; i += 1) {
      await db.insert(rides).values(ride(d3.id, `Rota ${i}`, "20:00:00", 100 + i));
    }

    const t1 = await listRideTemplates(d1.id);
    check("birebir aynı yolculuklar tek şablona iner", t1.length === 2);
    check("en yeni şablon önce gelir", t1[0]?.origin === "C" && t1[1]?.origin === "A");
    check("kalkış saati SS:DD biçiminde", t1[0]?.departureTime === "22:15" && t1[1]?.departureTime === "23:30");
    check("değerler doğru taşınır", t1[0]?.seats === 2 && t1[0]?.totalCost === 250 && t1[1]?.durationMinutes === 30);

    const t2 = await listRideTemplates(d2.id);
    check("başka sürücünün şablonu karışmaz", t2.length === 1 && t2[0].origin === "Z");

    check("yolculuğu olmayan sürücü için boş liste", (await listRideTemplates(d4.id)).length === 0);
    check("en fazla 5 şablon döner", (await listRideTemplates(d3.id)).length === MAX_TEMPLATES);
  } finally {
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