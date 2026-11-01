import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { eq, inArray, like, or, sql } from "drizzle-orm";
import { db } from "../src/db";
import { events, rides, syncRuns, users } from "../src/db/schema";
import { runBiletimgoSync, type SyncResult } from "../src/lib/biletimgo/sync";
import type { FetchLike } from "../src/lib/biletimgo/client";

const SECRET = "TEST-TOKEN-DO-NOT-LEAK-123";

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

function apiItem(id: number, title: string, extra: Record<string, unknown> = {}) {
  return {
    id: String(id),
    etkinlik: title,
    kategori: "Konser",
    detay: "%3Cp%3ETest%20a%C3%A7%C4%B1klama%3C%2Fp%3E",
    konum: "Test Mekan",
    adres: "Test Adres",
    sehir: "İstanbul",
    organizator: "Test Org",
    url: `https://www.biletimgo.com/etkinlik/${id}?partner=test`,
    gorsel: `https://www.biletimgo.com/images/${id}.jpeg`,
    baslangic: "2027-03-15 20:00",
    bitis: "2027-03-15 23:00",
    fiyat: "300",
    ...extra,
  };
}

function jsonFetch(items: unknown[]): FetchLike {
  return (async () =>
    new Response(JSON.stringify({ error: "success", data: items }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as unknown as FetchLike;
}

function statusFetch(status: number): FetchLike {
  return (async () => new Response("{}", { status })) as unknown as FetchLike;
}

async function main() {
  const stamp = Date.now();
  const prefix = `bgotest${stamp}-`;
  const prefix2 = `bgotestb${stamp}-`;
  const lockKeys = [`biletimgo:${prefix}`, `biletimgo:${prefix2}`];

  const demoState = async () => {
    const res = (await db.execute(
      sql`select count(*)::int as n, md5(coalesce(string_agg(id||'|'||title||'|'||starts_at::text||'|'||description, E'\n' order by id),'')) as h from events where source = 'demo'`,
    )) as unknown as { rows: Record<string, unknown>[] };
    return JSON.stringify(res.rows[0]);
  };

  const run = (
    items: unknown[],
    apply = true,
    extra: { prefix?: string; allowDrop?: boolean } = {},
  ): Promise<SyncResult> =>
    runBiletimgoSync({
      token: SECRET,
      apply,
      prefix: extra.prefix ?? prefix,
      allowDrop: extra.allowDrop,
      fetchImpl: jsonFetch(items),
    });

  const rowsOf = (p: string) =>
    db
      .select({
        id: events.id,
        title: events.title,
        city: events.city,
        source: events.source,
        isActive: events.isActive,
        missedRuns: events.missedRuns,
        ticketUrl: events.ticketUrl,
        startsAt: events.startsAt,
      })
      .from(events)
      .where(like(events.id, `${p}%`));

  const items = (ids: number[]) => ids.map((id) => apiItem(id, `Sync A${id - 90000}`));
  const five = [90001, 90002, 90003, 90004, 90005];

  const demoBefore = await demoState();

  const [user] = await db
    .insert(users)
    .values({
      name: "Sync Test",
      email: `sync-${stamp}@sync-test.invalid`,
      passwordHash: "test",
      role: "driver",
    })
    .returning({ id: users.id });

  try {
    // 1) İlk senkron
    const r1 = await run(items(five));
    const rows1 = await rowsOf(prefix);
    check("ilk senkron başarılı ve 5 kayıt ekler", r1.status === "success" && r1.inserted === 5 && r1.updated === 0 && rows1.length === 5);
    check("kayıtlar biletimgo kaynaklı ve aktif", rows1.every((r) => r.source === "biletimgo" && r.isActive && r.missedRuns === 0));
    const first = rows1.find((r) => r.id === `${prefix}90001`);
    check("bilet bağlantısı değiştirilmeden saklandı", first?.ticketUrl === "https://www.biletimgo.com/etkinlik/90001?partner=test");
    check("tarih Türkiye saatinden UTC'ye doğru çevrildi", first?.startsAt.toISOString() === "2027-03-15T17:00:00.000Z");

    // 2) Tekrar: mükerrer yok
    const r2 = await run(items(five));
    check("aynı yanıtı tekrar işlemek kayıt eklemez", r2.inserted === 0 && r2.updated === 5 && (await rowsOf(prefix)).length === 5);

    // 3) Güncelleme aynı satırı değiştirir
    await run([apiItem(90001, "Sync A1 yeni"), ...items(five.slice(1))]);
    const renamed = (await rowsOf(prefix)).find((r) => r.id === `${prefix}90001`);
    check("değişen başlık aynı satırı günceller", renamed?.title === "Sync A1 yeni" && (await rowsOf(prefix)).length === 5);

    // 4) Deneme modu yazmaz
    const dry = await run([apiItem(90001, "DENEME"), ...items(five.slice(1))], false);
    const afterDry = (await rowsOf(prefix)).find((r) => r.id === `${prefix}90001`);
    check("deneme modu veritabanını değiştirmez", dry.status === "dry_run" && afterDry?.title === "Sync A1 yeni");

    // 5) Kaybolan etkinlik: 2 ardışık kayıpta pasif, silinmez
    const withoutFive = [apiItem(90001, "Sync A1 yeni"), ...items([90002, 90003, 90004])];
    const m1 = await run(withoutFive);
    const afterM1 = (await rowsOf(prefix)).find((r) => r.id === `${prefix}90005`);
    check("ilk kayıpta etkinlik hâlâ aktif (kayıp sayısı 1)", m1.missed === 1 && m1.deactivated === 0 && afterM1?.isActive === true && afterM1.missedRuns === 1);
    const m2 = await run(withoutFive);
    const afterM2 = (await rowsOf(prefix)).find((r) => r.id === `${prefix}90005`);
    check("ikinci kayıpta pasifleşir ama silinmez", m2.deactivated === 1 && afterM2?.isActive === false && (await rowsOf(prefix)).length === 5);

    // 6) Tekrar görününce aktifleşir
    const back = await run([apiItem(90001, "Sync A1 yeni"), ...items(five.slice(1))]);
    const afterBack = (await rowsOf(prefix)).find((r) => r.id === `${prefix}90005`);
    check("tekrar görünen etkinlik yeniden aktifleşir", back.reactivated === 1 && afterBack?.isActive === true && afterBack.missedRuns === 0);

    // 7) Yinelenen kimlik
    const dup = await run([...items(five), apiItem(90001, "Yinelenen")]);
    check("aynı yanıttaki yinelenen kimlik tek kayda iner", dup.duplicates === 1 && dup.status === "success" && (await rowsOf(prefix)).length === 5);

    // 8) Boş yanıt
    const empty = await run([]);
    check("boş yanıt şüpheli sayılır, hiçbir şey değişmez", empty.status === "suspicious" && empty.errorCode === "empty" && (await rowsOf(prefix)).every((r) => r.isActive));

    // 9) Çok geçersiz kayıt
    const mixed = [
      ...[90101, 90102, 90103, 90104, 90105, 90106].map((id) => apiItem(id, `Geçerli ${id}`)),
      ...[90107, 90108, 90109, 90110].map((id) => apiItem(id, `Geçersiz ${id}`, { url: "http://evil.example/x" })),
    ];
    const invalid = await run(mixed);
    check("geçersiz oranı yüksekse çalışma durur ve hiçbir şey yazılmaz", invalid.status === "suspicious" && invalid.errorCode === "too_many_invalid" && (await rowsOf(prefix)).length === 5);

    // 10) API hatası
    const authFail = await runBiletimgoSync({ token: SECRET, apply: true, prefix, fetchImpl: statusFetch(401) });
    check("API 401: durum failed, kod auth, veri değişmez", authFail.status === "failed" && authFail.errorCode === "auth" && (await rowsOf(prefix)).length === 5);
    check("sonuçta token geçmez", !JSON.stringify(authFail).includes(SECRET) && !JSON.stringify(r1).includes(SECRET));
    const serverFail = await runBiletimgoSync({ token: SECRET, apply: true, prefix, fetchImpl: statusFetch(500) });
    check("API 500: durum failed, kod server", serverFail.status === "failed" && serverFail.errorCode === "server");
    const netFail = await runBiletimgoSync({
      token: SECRET,
      apply: true,
      prefix,
      fetchImpl: (async () => {
        throw new Error(`bağlantı hatası ${SECRET}`);
      }) as unknown as FetchLike,
    });
    check("ağ hatasında hata metni sızdırılmaz", netFail.status === "failed" && netFail.errorCode === "network" && !JSON.stringify(netFail).includes(SECRET));

    // 11) Kilit
    await db.insert(syncRuns).values({ source: lockKeys[0], status: "running" });
    const locked = await run(items(five));
    check("çalışan bir senkron varken ikinci çalışma reddedilir", locked.status === "locked");
    await db.delete(syncRuns).where(eq(syncRuns.source, lockKeys[0]));

    // 12) Kimlik koruması (yolculuğu olan etkinlik)
    const [ride] = await db
      .insert(rides)
      .values({
        eventId: `${prefix}90002`,
        driverId: user.id,
        origin: "T",
        destination: "T",
        meetingPoint: "T",
        departureTime: "23:30",
        durationMinutes: 30,
        seats: 2,
        totalCost: 100,
      })
      .returning({ id: rides.id });
    const swapped = await run([
      apiItem(90001, "Sync A1 yeni"),
      apiItem(90002, "Tamamen Başka", { konum: "Başka Mekan", sehir: "Ankara" }),
      ...items([90003, 90004, 90005]),
    ]);
    const protectedRow = (await rowsOf(prefix)).find((r) => r.id === `${prefix}90002`);
    check("yolculuğu olan etkinliğin kimliği tamamen başka etkinliğe dönüşürse korunur", swapped.protectedChanges === 1 && protectedRow?.title === "Sync A2" && protectedRow.city === "İstanbul");
    await run([
      apiItem(90001, "Sync A1 yeni"),
      apiItem(90002, "Sync A2 yeni"),
      ...items([90003, 90004, 90005]),
    ]);
    const renamedRide = (await rowsOf(prefix)).find((r) => r.id === `${prefix}90002`);
    check("yalnızca başlığı değişen etkinlik yolculuğu olsa da güncellenir", renamedRide?.title === "Sync A2 yeni");
    const rideStill = await db.select({ id: rides.id }).from(rides).where(eq(rides.id, ride.id));
    check("yolculuk kaydı durur", rideStill.length === 1);

    // 13) Ani düşüş koruması
    const twentyFour = Array.from({ length: 24 }, (_, i) => 91001 + i);
    const seeded = await run(items(twentyFour), true, { prefix: prefix2 });
    check("24 kayıt eklenir", seeded.inserted === 24);
    const drop = await run(items(twentyFour.slice(0, 5)), true, { prefix: prefix2 });
    const afterDrop = await rowsOf(prefix2);
    check("ani düşüşte çalışma durur, hiçbir etkinlik pasifleşmez", drop.status === "suspicious" && drop.errorCode === "sharp_drop" && afterDrop.every((r) => r.isActive && r.missedRuns === 0));
    const forced = await run(items(twentyFour.slice(0, 5)), true, { prefix: prefix2, allowDrop: true });
    const afterForced = await rowsOf(prefix2);
    check("bilerek geçilirse yalnızca kayıp sayısı artar (hâlâ aktif)", forced.status === "success" && forced.missed === 19 && afterForced.every((r) => r.isActive));

    // 14) Kod taraması: etkinlik silen kod yok
    const dir = path.join(process.cwd(), "src", "lib", "biletimgo");
    const sources = readdirSync(dir).filter((f) => f.endsWith(".ts")).map((f) => readFileSync(path.join(dir, f), "utf8"));
    check("senkron kodunda etkinlik silen ifade yok", sources.every((s) => !/\.delete\(\s*events\s*\)/.test(s) && !/delete\s+from/i.test(s)));
    check("senkron kodunda token ortam değişkeni okunmuyor (yalnızca dışarıdan verilir)", sources.every((s) => !/process\.env/.test(s)));

    // 15) Demo etkinlikler
    check("demo etkinliklerin içeriği ve sayısı değişmedi", (await demoState()) === demoBefore);
  } finally {
    const ids = (
      await db
        .select({ id: events.id })
        .from(events)
        .where(or(like(events.id, `${prefix}%`), like(events.id, `${prefix2}%`)))
    ).map((r) => r.id);

    if (ids.length > 0) {
      await db.delete(rides).where(inArray(rides.eventId, ids));
      await db.delete(events).where(inArray(events.id, ids));
    }

    await db.delete(syncRuns).where(inArray(syncRuns.source, lockKeys));
    await db.delete(users).where(eq(users.id, user.id));
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