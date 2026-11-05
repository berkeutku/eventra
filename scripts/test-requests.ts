import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import { events, rideRequests, rides, users } from "../src/db/schema";
import {
  MAX_NOTE,
  MAX_REQUESTS_PER_DAY,
  firstName,
  looksLikeContact,
  parseRequestInput,
} from "../src/lib/request-rules";
import { joinRide } from "../src/lib/ride-join";
import {
  countRequests,
  deleteRequest,
  getMyRequest,
  listRequests,
  saveRequest,
} from "../src/lib/ride-requests";

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

const valid = { destination: "Kadıköy", preferredTime: "23:30", seats: "2", note: "Bagajım var" };

async function main() {
  // Saf kurallar
  const ok = parseRequestInput(valid);
  check("geçerli talep kabul edilir", ok.ok && ok.value.destination === "Kadıköy" && ok.value.preferredTime === "23:30" && ok.value.seats === 2 && ok.value.note === "Bagajım var");
  const minimal = parseRequestInput({ destination: "Beşiktaş", preferredTime: "", seats: "1", note: "" });
  check("saat ve not boş bırakılabilir", minimal.ok && minimal.value.preferredTime === null && minimal.value.note === null);
  check("kısa varış yeri reddedilir", (() => { const r = parseRequestInput({ ...valid, destination: "a" }); return !r.ok && Boolean(r.errors.destination); })());
  check("geçersiz saat reddedilir", (() => { const r = parseRequestInput({ ...valid, preferredTime: "25:00" }); return !r.ok && Boolean(r.errors.preferredTime); })());
  check("kişi sayısı sınırları (1-4)", !parseRequestInput({ ...valid, seats: "0" }).ok && !parseRequestInput({ ...valid, seats: "5" }).ok && !parseRequestInput({ ...valid, seats: "abc" }).ok && parseRequestInput({ ...valid, seats: "4" }).ok);
  const longNote = parseRequestInput({ ...valid, note: "x".repeat(300) });
  check("uzun not kısaltılır", longNote.ok && (longNote.value.note ?? "").length === MAX_NOTE);
  check("kontrol karakterleri temizlenir", (() => { const r = parseRequestInput({ ...valid, destination: "Kadı\u0000köy" }); return r.ok && r.value.destination === "Kadı köy"; })());
  check("iletişim bilgisi algılanır: telefon, e-posta, bağlantı", looksLikeContact("0532 123 45 67") && looksLikeContact("05321234567") && looksLikeContact("ben@ornek.com") && looksLikeContact("http://x.co") && looksLikeContact("www.x.co") && !looksLikeContact("Kadıköy iskele 23:30 civarı"));
  check("nota ya da varış yerine iletişim bilgisi yazılamaz", !parseRequestInput({ ...valid, note: "ara 0532 123 45 67" }).ok && !parseRequestInput({ ...valid, destination: "ben@ornek.com" }).ok);
  check("ilk ad: ilk sözcük, boşsa 'Yolcu', en fazla 20 karakter", firstName("Ayşe Yılmaz") === "Ayşe" && firstName("   ") === "Yolcu" && firstName("x".repeat(50)).length === 20);

  // Veritabanı
  const [demo] = await db.select({ id: events.id }).from(events).where(eq(events.source, "demo")).limit(1);

  if (!demo) {
    throw new Error("Demo etkinlik yok.");
  }

  const stamp = Date.now();
  const created = await db
    .insert(users)
    .values(
      ["P1", "P2", "D"].map((name, index) => ({
        name: `Req ${name} Soyad`,
        email: `req-${index}-${stamp}@req-test.invalid`,
        passwordHash: "test",
        role: name === "D" ? ("driver" as const) : ("passenger" as const),
      })),
    )
    .returning({ id: users.id, name: users.name });

  const find = (name: string) => created.find((user) => user.name === `Req ${name} Soyad`);
  const p1 = find("P1");
  const p2 = find("P2");
  const d = find("D");

  if (!p1 || !p2 || !d) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  const fields = { destination: "Kadıköy", preferredTime: "23:30", seats: 2, note: "Bagajım var" };
  const before = await countRequests(demo.id);

  try {
    check("talep kaydedilir", (await saveRequest({ userId: p1.id, eventId: demo.id, fields })) === "saved");
    const mine = await getMyRequest(p1.id, demo.id);
    check("kendi talebi okunur (saat 5 karakter)", mine?.destination === "Kadıköy" && mine.preferredTime === "23:30" && mine.seats === 2);
    check("başkasının talebi okunmaz", (await getMyRequest(p2.id, demo.id)) === null);

    check("aynı kişi tekrar kaydedince güncellenir (tek kayıt)", (await saveRequest({ userId: p1.id, eventId: demo.id, fields: { ...fields, destination: "Beşiktaş", seats: 3 } })) === "saved" && (await countRequests(demo.id)) === before + 1 && (await getMyRequest(p1.id, demo.id))?.destination === "Beşiktaş");

    await saveRequest({ userId: p2.id, eventId: demo.id, fields: { ...fields, destination: "Üsküdar", note: null } });
    const listP1 = (await listRequests(demo.id, p1.id)).filter((item) => item.destination === "Beşiktaş" || item.destination === "Üsküdar");
    const ownP1 = listP1.find((item) => item.destination === "Beşiktaş");
    const otherP1 = listP1.find((item) => item.destination === "Üsküdar");
    check("liste: yalnızca ilk ad görünür", ownP1?.firstName === "Req" && !JSON.stringify(listP1).includes("Soyad"));
    check("liste: kendi talebi işaretlenir, başkasınınki işaretlenmez", ownP1?.isOwn === true && otherP1?.isOwn === false);
    check("liste: talep sahibinin kimliği dışarı verilmez", !JSON.stringify(listP1).includes(p1.id) && !JSON.stringify(listP1).includes(p2.id));
    check("giriş yapmamış görüntüleyicide kimse 'kendi' değil", (await listRequests(demo.id)).every((item) => item.isOwn === false));

    check("başkası silemez, sahibi siler", !(await deleteRequest(d.id, demo.id)) && (await deleteRequest(p2.id, demo.id)) && !(await deleteRequest(p2.id, demo.id)));

    // Günlük sınır
    let lastStatus = "saved";
    for (let i = 0; i < MAX_REQUESTS_PER_DAY; i += 1) {
      lastStatus = await saveRequest({ userId: p2.id, eventId: demo.id, fields });
    }
    check("günlük talep sınırı uygulanır", lastStatus === "rate_limited" || (await saveRequest({ userId: p2.id, eventId: demo.id, fields })) === "rate_limited");

    // Yolculuğa katılınca talep silinir ve yeni talep verilemez
    const [ride] = await db
      .insert(rides)
      .values({ eventId: demo.id, driverId: d.id, origin: "T", destination: "T", meetingPoint: "T", departureTime: "23:30", durationMinutes: 30, seats: 2, totalCost: 100 })
      .returning({ id: rides.id });
    check("katılmadan önce talep duruyor", (await getMyRequest(p1.id, demo.id)) !== null);
    check("yolculuğa katılınca talep kendiliğinden silinir", (await joinRide(p1.id, ride.id)).status === "joined" && (await getMyRequest(p1.id, demo.id)) === null);
    check("yolculuğa katılmış kişi talep veremez", (await saveRequest({ userId: p1.id, eventId: demo.id, fields })) === "has_ride");

    // Hesap silinince talepler silinir
    await db.delete(users).where(eq(users.id, p2.id));
    check("hesap silinince talepleri de silinir", (await db.select({ id: rideRequests.id }).from(rideRequests).where(eq(rideRequests.passengerId, p2.id))).length === 0);
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