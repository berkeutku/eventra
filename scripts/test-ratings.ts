import "dotenv/config";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "../src/db";
import {
  events,
  ridePassengers,
  rideRatings,
  rides,
  userReports,
  users,
} from "../src/db/schema";
import {
  MAX_COMMENT,
  cleanText,
  ratingWindowState,
} from "../src/lib/rating-rules";
import {
  getRatingContext,
  submitRating,
  submitReport,
} from "../src/lib/ride-ratings";

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

const HOUR = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();

async function main() {
  const now = Date.now();

  // Saf kurallar
  check("bitişi geçmiş etkinlikte puanlama açık", ratingWindowState({ startsAt: iso(now - 5 * HOUR), endsAt: iso(now - HOUR) }) === "open");
  check("henüz bitmeyen etkinlikte puanlama kapalı (not_yet)", ratingWindowState({ startsAt: iso(now + HOUR) }) === "not_yet");
  check("bitiş yoksa başlangıç + 3 saat kabul edilir", ratingWindowState({ startsAt: iso(now - 2 * HOUR) }) === "not_yet" && ratingWindowState({ startsAt: iso(now - 4 * HOUR) }) === "open");
  check("30 günden eski etkinlikte puanlama kapanır", ratingWindowState({ startsAt: iso(now - 40 * 24 * HOUR), endsAt: iso(now - 40 * 24 * HOUR + 2 * HOUR) }) === "closed");
  check("geçersiz tarih kapalı sayılır", ratingWindowState({ startsAt: "bozuk" }) === "closed");
  check("metin temizleme: kontrol karakterleri ve boşluklar", cleanText("  a\u0000b \n c ", 50) === "a b c");
  check("metin sınırı uygulanır", cleanText("x".repeat(400), MAX_COMMENT).length === MAX_COMMENT);
  check("metin olmayan değer boş döner", cleanText(42, 10) === "");

  const stamp = Date.now();
  const created = await db
    .insert(users)
    .values(
      ["D", "P", "P2", "O"].map((name, index) => ({
        name: `Rate ${name}`,
        email: `rate-${index}-${stamp}@rate-test.invalid`,
        passwordHash: "test",
        role: name === "D" ? ("driver" as const) : ("passenger" as const),
      })),
    )
    .returning({ id: users.id, name: users.name });

  const find = (name: string) => created.find((user) => user.name === `Rate ${name}`);
  const d = find("D");
  const p = find("P");
  const p2 = find("P2");
  const o = find("O");

  if (!d || !p || !p2 || !o) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  const pastId = `bgotestrate${stamp}-past`;
  const futureId = `bgotestrate${stamp}-future`;
  const base = {
    category: "other" as const,
    city: "Test",
    venue: "Test",
    description: "Test",
    source: "biletimgo",
    isActive: true,
  };

  try {
    await db.insert(events).values([
      { ...base, id: pastId, externalId: `r${stamp}p`, title: "Geçmiş test", startsAt: new Date(now - 3 * 24 * HOUR), endsAt: new Date(now - 3 * 24 * HOUR + 2 * HOUR) },
      { ...base, id: futureId, externalId: `r${stamp}f`, title: "Gelecek test", startsAt: new Date(now + 3 * 24 * HOUR) },
    ]);

    const makeRide = async (eventId: string) => {
      const [ride] = await db
        .insert(rides)
        .values({ eventId, driverId: d.id, origin: "T", destination: "T", meetingPoint: "T", departureTime: "23:30", durationMinutes: 30, seats: 3, totalCost: 100 })
        .returning({ id: rides.id });
      await db.insert(ridePassengers).values([
        { rideId: ride.id, userId: p.id },
        { rideId: ride.id, userId: p2.id },
      ]);
      return ride.id;
    };

    const ride1 = await makeRide(pastId);
    const ride2 = await makeRide(futureId);

    // Puanlama
    check("yolcu sürücüyü puanlar", (await submitRating({ rideId: ride1, raterId: p.id, rateeId: d.id, score: 5, comment: "Harika" })) === "saved");
    check("tekrar puanlama eski puanı günceller (tek kayıt)", (await submitRating({ rideId: ride1, raterId: p.id, rateeId: d.id, score: 3, comment: "  Fena değil  " })) === "saved" && (await db.select().from(rideRatings).where(eq(rideRatings.raterId, p.id))).length === 1 && (await db.select().from(rideRatings).where(eq(rideRatings.raterId, p.id)))[0].score === 3);
    check("sürücü yolcuyu puanlar", (await submitRating({ rideId: ride1, raterId: d.id, rateeId: p.id, score: 4, comment: "" })) === "saved");
    check("yolculuğa katılmayan puanlayamaz", (await submitRating({ rideId: ride1, raterId: o.id, rateeId: d.id, score: 5, comment: "" })) === "not_participant");
    check("kimse kendini puanlayamaz", (await submitRating({ rideId: ride1, raterId: p.id, rateeId: p.id, score: 5, comment: "" })) === "self");
    check("geçersiz puanlar reddedilir", (await submitRating({ rideId: ride1, raterId: p.id, rateeId: d.id, score: 0, comment: "" })) === "invalid" && (await submitRating({ rideId: ride1, raterId: p.id, rateeId: d.id, score: 6, comment: "" })) === "invalid" && (await submitRating({ rideId: ride1, raterId: p.id, rateeId: d.id, score: "5", comment: "" })) === "invalid");
    check("yolcular birbirini puanlayamaz", (await submitRating({ rideId: ride1, raterId: p.id, rateeId: p2.id, score: 5, comment: "" })) === "not_ratable");
    check("etkinlik bitmeden puanlama kapalı", (await submitRating({ rideId: ride2, raterId: p.id, rateeId: d.id, score: 5, comment: "" })) === "not_open");
    check("var olmayan yolculuk", (await submitRating({ rideId: "00000000-0000-4000-8000-000000000000", raterId: p.id, rateeId: d.id, score: 5, comment: "" })) === "not_found");
    check("bozuk yolculuk kimliği hata vermez", (await submitRating({ rideId: "bozuk", raterId: p.id, rateeId: d.id, score: 5, comment: "" })) === "not_found");
    await submitRating({ rideId: ride1, raterId: p2.id, rateeId: d.id, score: 4, comment: "x".repeat(400) });
    const longRow = (await db.select().from(rideRatings).where(eq(rideRatings.raterId, p2.id)))[0];
    check("uzun yorum kısaltılır", (longRow.comment ?? "").length === MAX_COMMENT);

    // Bağlam
    const ctxP = await getRatingContext(ride1, p.id);
    check("yolcu bağlamı: sürücü puanlanabilir, diğer yolcu puanlanamaz", ctxP?.phase === "open" && ctxP.targets.find((t) => t.userId === d.id)?.ratable === true && ctxP.targets.find((t) => t.userId === p2.id)?.ratable === false && ctxP.targets.find((t) => t.userId === d.id)?.score === 3);
    check("sürücü bağlamı: tüm yolcular puanlanabilir", (await getRatingContext(ride1, d.id))?.targets.every((t) => t.ratable) === true);
    check("katılımcı olmayana bağlam verilmez", (await getRatingContext(ride1, o.id)) === null);

    // Şikâyet
    check("şikâyet kaydedilir", (await submitReport({ rideId: ride1, reporterId: p.id, reportedId: d.id, reason: "unsafe", details: "Hızlı sürdü" })) === "saved");
    check("aynı şikâyet tekrar kaydedilmez", (await submitReport({ rideId: ride1, reporterId: p.id, reportedId: d.id, reason: "unsafe", details: "" })) === "duplicate");
    check("katılımcı olmayan şikâyet edemez", (await submitReport({ rideId: ride1, reporterId: o.id, reportedId: d.id, reason: "other", details: "" })) === "not_participant");
    check("geçersiz neden reddedilir", (await submitReport({ rideId: ride1, reporterId: p2.id, reportedId: d.id, reason: "uydurma", details: "" })) === "invalid_reason");
    check("kendini şikâyet edemez", (await submitReport({ rideId: ride1, reporterId: p.id, reportedId: p.id, reason: "other", details: "" })) === "self");
    check("yolculuktaki iki yolcu birbirini bildirebilir", (await submitReport({ rideId: ride1, reporterId: p2.id, reportedId: p.id, reason: "harassment", details: "" })) === "saved");

    await db.insert(userReports).values(
      Array.from({ length: 5 }, () => ({ reporterId: o.id, reportedId: d.id, reason: "other" })),
    );
    await db.insert(ridePassengers).values({ rideId: ride2, userId: o.id });
    check("günlük şikâyet sınırı (5) uygulanır", (await submitReport({ rideId: ride2, reporterId: o.id, reportedId: d.id, reason: "other", details: "" })) === "rate_limited");

    // Yolculuk silinse de puan kalır
    await db.delete(rides).where(eq(rides.id, ride1));
    const afterDelete = await db.select().from(rideRatings).where(eq(rideRatings.rateeId, d.id));
    check("yolculuk silinince puanlar silinmez (yolculuk bağı boşalır)", afterDelete.length === 2 && afterDelete.every((row) => row.rideId === null));

    // Hesap silinince ilgili kayıtlar da silinir
    await db.delete(users).where(eq(users.id, d.id));
    const left = await db.select().from(rideRatings).where(eq(rideRatings.rateeId, d.id));
    const leftReports = await db.select().from(userReports).where(eq(userReports.reportedId, d.id));
    check("hesap silinince hakkındaki puanlar ve şikâyetler silinir", left.length === 0 && leftReports.length === 0);
  } finally {
    await db.delete(rides).where(inArray(rides.eventId, [pastId, futureId]));
    await db.delete(events).where(like(events.id, `bgotestrate${stamp}-%`));
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