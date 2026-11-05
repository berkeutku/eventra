import "dotenv/config";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import {
  actionLog,
  events,
  notifications,
  ridePassengers,
  rideMessages,
  rides,
  users,
} from "../src/db/schema";
import {
  MAX_MESSAGE,
  chatPhase,
  containsLink,
  prepareMessage,
} from "../src/lib/chat-rules";
import { deleteMessage, loadChat, sendMessage } from "../src/lib/ride-chat";

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
const DAY = 24 * HOUR;
const iso = (ms: number) => new Date(ms).toISOString();

async function main() {
  // Saf kurallar
  const ok = prepareMessage("  Merhaba   herkese \n selam ");
  check("mesaj temizlenir", ok.ok && ok.text === "Merhaba herkese selam");
  check("boş ve metin olmayan mesaj reddedilir", !prepareMessage("   ").ok && !prepareMessage(42).ok && !prepareMessage(null).ok);
  check("500 karakter kabul, 501 ve çok uzun reddedilir", prepareMessage("x".repeat(MAX_MESSAGE)).ok && (() => { const r = prepareMessage("x".repeat(MAX_MESSAGE + 1)); return !r.ok && r.reason === "too_long"; })() && !prepareMessage("x".repeat(3000)).ok);
  check("kontrol karakterleri temizlenir", (() => { const r = prepareMessage("a\u0000b"); return r.ok && r.text === "a b"; })());
  check("bağlantılar engellenir", ["http://x.co", "https://ornek.com/yol", "www.ornek.com", "ornek.com", "t.me/kanal"].every((text) => containsLink(text) && !prepareMessage(text).ok));
  check("normal metin ve telefon numarası engellenmez", !containsLink("Mavi tabelanın önündeyim 23:30") && !containsLink("saat 5.30'da") && prepareMessage("Beni ara: 0532 123 45 67").ok);

  const now = Date.now();
  check("etkinlik bitmemişse ve 24 saat içinde sohbet açık", chatPhase({ startsAt: iso(now + HOUR) }) === "open" && chatPhase({ startsAt: iso(now - 5 * HOUR), endsAt: iso(now - HOUR) }) === "open");
  check("etkinlik bittikten 24 saat sonra salt okunur", chatPhase({ startsAt: iso(now - 30 * HOUR), endsAt: iso(now - 25 * HOUR) }) === "readonly");
  check("geçersiz tarih salt okunur sayılır", chatPhase({ startsAt: "bozuk" }) === "readonly");

  // Veritabanı
  const [demo] = await db.select({ id: events.id }).from(events).where(eq(events.source, "demo")).limit(1);

  if (!demo) {
    throw new Error("Demo etkinlik yok.");
  }

  const stamp = Date.now();
  const created = await db
    .insert(users)
    .values(
      ["D", "P1", "P2", "O"].map((name, index) => ({
        name: `Chat ${name} Soyad`,
        email: `chat-${index}-${stamp}@chat-test.invalid`,
        passwordHash: "test",
        role: name === "D" ? ("driver" as const) : ("passenger" as const),
      })),
    )
    .returning({ id: users.id, name: users.name });

  const find = (name: string) => created.find((user) => user.name === `Chat ${name} Soyad`);
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
    await db.insert(ridePassengers).values([{ rideId, userId: p1.id }, { rideId, userId: p2.id }]);

    const t0 = new Date(Math.floor(Date.now() / 300_000) * 300_000 + 1000);
    const at = (seconds: number) => new Date(t0.getTime() + seconds * 1000);
    const send = (userId: string, text: unknown, when: Date = t0) => sendMessage({ rideId, userId, text, now: when });
    const notes = async (userId: string) => (await db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.type, "ride_message")))).length;
    const countBy = async (userId: string) => (await db.select({ id: rideMessages.id }).from(rideMessages).where(and(eq(rideMessages.rideId, rideId), eq(rideMessages.senderId, userId)))).length;

    check("sürücü mesaj gönderir", (await send(d.id, "Merhaba")) === "sent");
    check("yolcular mesajı görür: yalnızca ilk ad, soyad görünmez", await (async () => {
      const chat = await loadChat(rideId, p1.id, t0);
      return chat?.items.length === 1 && chat.items[0].name === "Chat" && !JSON.stringify(chat.items).includes("Soyad") && chat.items[0].mine === false && chat.access.phase === "open";
    })());
    check("gönderen kendi mesajını 'mine' görür", (await loadChat(rideId, d.id, t0))?.items[0].mine === true);
    check("ilk mesajda iki yolcuya birer bildirim gitti, gönderene gitmedi", (await notes(p1.id)) === 1 && (await notes(p2.id)) === 1 && (await notes(d.id)) === 0);

    check("yolcu mesaj gönderir", (await send(p1.id, "Ben geldim", at(60))) === "sent");
    check("sürücüye bildirim gitti, aynı 5 dakikada yolcuya tekrar gitmedi", (await notes(d.id)) === 1 && (await notes(p2.id)) === 1);
    check("üçüncü kişi yazınca aynı 5 dakikada bildirim tekrarlanmaz", (await send(p2.id, "Tamam", at(120))) === "sent" && (await notes(d.id)) === 1 && (await notes(p1.id)) === 1);
    check("sonraki 5 dakikada yeniden bildirilir", (await send(d.id, "Yola çıkıyoruz", at(360))) === "sent" && (await notes(p1.id)) === 2 && (await notes(p2.id)) === 2);

    const chatP1 = await loadChat(rideId, p1.id, at(360));
    check("mesajlar eskiden yeniye sıralı", chatP1?.items.map((item) => item.body).join("|") === "Merhaba|Ben geldim|Tamam|Yola çıkıyoruz");

    check("katılımcı olmayan okuyamaz ve yazamaz", (await loadChat(rideId, o.id, t0)) === null && (await send(o.id, "Selam")) === "not_participant");
    check("var olmayan ve bozuk yolculuk kimliği", (await sendMessage({ rideId: "00000000-0000-4000-8000-000000000000", userId: d.id, text: "x", now: t0 })) === "not_participant" && (await sendMessage({ rideId: "bozuk", userId: d.id, text: "x", now: t0 })) === "not_participant");
    check("boş, uzun ve bağlantılı mesaj reddedilir", (await send(d.id, "  ")) === "empty" && (await send(d.id, "x".repeat(501))) === "too_long" && (await send(d.id, "bak https://ornek.com")) === "link");
    check("reddedilen mesajlar kaydedilmez", (await countBy(d.id)) === 2);

    const mine = chatP1?.items.find((item) => item.body === "Ben geldim");
    check("başkasının mesajını silemez", Boolean(mine) && !(await deleteMessage(d.id, mine!.id)));
    check("kendi mesajını siler", Boolean(mine) && (await deleteMessage(p1.id, mine!.id)) && (await loadChat(rideId, d.id, at(360)))?.items.length === 3);
    check("bozuk mesaj kimliği hata vermez", !(await deleteMessage(p1.id, "bozuk")));

    // Hız sınırı: 30 mesaj hakkı önceden doldurulur
    await db.insert(actionLog).values(Array.from({ length: 30 }, () => ({ userId: p2.id, kind: "chat_message", createdAt: at(400) })));
    check("10 dakikada 30 mesaj sınırı uygulanır", (await send(p2.id, "Bir tane daha", at(400))) === "rate_limited");

    // Salt okunur
    const farFuture = new Date(Date.now() + 365 * DAY);
    check("etkinlikten 24 saat sonra yazılamaz, okunabilir", (await send(d.id, "Geç kaldım", farFuture)) === "read_only" && (await loadChat(rideId, d.id, farFuture))?.access.phase === "readonly");

    // Yolculuktan ayrılan erişimini kaybeder, mesajları kalır
    await db.delete(ridePassengers).where(and(eq(ridePassengers.rideId, rideId), eq(ridePassengers.userId, p2.id)));
    check("yolculuktan ayrılan okuyamaz ve yazamaz", (await loadChat(rideId, p2.id, at(420))) === null && (await send(p2.id, "Ayrıldım", at(420))) === "not_participant");
    check("ayrılanın eski mesajları diğerlerinde kalır", (await loadChat(rideId, d.id, at(420)))?.items.some((item) => item.body === "Tamam") === true);

    // 60 günden eski mesajlar temizlenir
    await db.insert(rideMessages).values({ rideId, senderId: d.id, body: "eski mesaj", createdAt: new Date(t0.getTime() - 61 * DAY) });
    check("gönderimde 60 günden eski mesajlar silinir", (await send(d.id, "Yeni mesaj", at(500))) === "sent" && (await db.select({ id: rideMessages.id }).from(rideMessages).where(eq(rideMessages.body, "eski mesaj"))).length === 0);

    // Hesap silinince mesajları silinir
    await send(p1.id, "Hesabım silinecek", at(520));
    check("hesap silinmeden önce mesaj var", (await countBy(p1.id)) === 1);
    await db.delete(users).where(eq(users.id, p1.id));
    check("hesap silinince o kişinin mesajları silinir, diğerlerinin kalır", (await countBy(p1.id)) === 0 && (await countBy(d.id)) > 0);

    // Yolculuk başına mesaj sınırı
    await db.delete(rideMessages).where(eq(rideMessages.rideId, rideId));
    await db.insert(rideMessages).values(Array.from({ length: 500 }, (_, i) => ({ rideId, senderId: d.id, body: `m${i}`, createdAt: new Date(t0.getTime() - HOUR + i) })));
    check("yolculuk başına 500 mesaj sınırı uygulanır", (await send(d.id, "Bir fazla", at(600))) === "ride_full");

    // Yolculuk silinince sohbet silinir
    await db.delete(rides).where(eq(rides.id, rideId));
    check("yolculuk silinince mesajlar da silinir", (await db.select({ id: rideMessages.id }).from(rideMessages).where(eq(rideMessages.rideId, rideId))).length === 0);
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