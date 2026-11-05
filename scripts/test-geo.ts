import "dotenv/config";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "../src/db";
import { apiThrottle, events, geoCache, rides, users } from "../src/db/schema";
import {
  distanceKm,
  fromMicro,
  isValidPoint,
  parseNominatim,
  parseOrsRoute,
  parseOsrmRoute,
  parsePointsBody,
  parseRideGeoInput,
  roundCoarse,
  roundFine,
  routeKey,
  searchKey,
  thinPath,
  toMicro,
} from "../src/lib/geo-rules";
import {
  cacheGet,
  cachePut,
  claimThrottle,
  getRoute,
  searchPlaces,
} from "../src/lib/geo-service";
import { getRideGeo, saveRideGeo } from "../src/lib/ride-geo";

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function fakeFetch(body: unknown, status = 200) {
  let calls = 0;
  const fetcher = (async () => {
    calls += 1;
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fetcher, count: () => calls };
}

async function main() {
  // Saf kurallar
  check("İstanbul geçerli, Londra ve NaN geçersiz", isValidPoint({ lat: 41.0082, lng: 28.9784 }) && !isValidPoint({ lat: 51.5, lng: -0.12 }) && !isValidPoint({ lat: Number.NaN, lng: 29 }));
  check("kaba yuvarlama yaklaşık 1 km (2 ondalık)", JSON.stringify(roundCoarse({ lat: 41.01234, lng: 28.97866 })) === JSON.stringify({ lat: 41.01, lng: 28.98 }));
  check("ince yuvarlama 5 ondalık", JSON.stringify(roundFine({ lat: 41.0123456, lng: 28.9786612 })) === JSON.stringify({ lat: 41.01235, lng: 28.97866 }));
  check("mikro derece gidiş-dönüş kayıpsız", fromMicro(toMicro(41.01)) === 41.01 && fromMicro(toMicro(28.97866)) === 28.97866);
  const km = distanceKm({ lat: 41.0082, lng: 28.9784 }, { lat: 39.9334, lng: 32.8597 });
  check("İstanbul-Ankara kuş uçuşu yaklaşık 350 km", km > 330 && km < 370);
  const long: [number, number][] = Array.from({ length: 1000 }, (_, i) => [28 + i / 1000, 41 + i / 2000]);
  const thin = thinPath(long, 400);
  check("çizgi 400 noktaya indirilir, ilk ve son korunur", thin.length === 400 && thin[0][0] === 28 && thin[399][0] === Math.round(long[999][0] * 1e5) / 1e5);
  check("kısa çizgi değişmez", thinPath([[28, 41], [29, 42]], 400).length === 2);
  check("rota anahtarı sabit", routeKey([{ lat: 41, lng: 29 }]) === routeKey([{ lat: 41, lng: 29 }]));
  check("arama anahtarı büyük-küçük harf ve boşluktan etkilenmez", searchKey("  KADIKÖY   İskele ") === searchKey("kadıköy iskele"));

  const none = parseRideGeoInput(() => "");
  const full: Record<string, string> = { originLat: "41.0123", originLng: "28.9876", meetingLat: "41.01234567", meetingLng: "28.98765432", destLat: "40.9912", destLng: "29.0211" };
  const okInput = parseRideGeoInput((key) => full[key] ?? "");
  check("harita alanları boşsa 'none'", none.status === "none");
  check("eksik alan 'invalid'", parseRideGeoInput((key) => (key === "destLng" ? "" : full[key] ?? "")).status === "invalid");
  check("sayı olmayan ya da Türkiye dışı alan 'invalid'", parseRideGeoInput((key) => (key === "originLat" ? "abc" : full[key] ?? "")).status === "invalid" && parseRideGeoInput((key) => (key === "originLat" ? "51.5" : full[key] ?? "")).status === "invalid");
  check("geçerli alanlar yuvarlanır (başlangıç ve varış kaba, buluşma ince)", okInput.status === "ok" && okInput.origin.lat === 41.01 && okInput.dest.lng === 29.02 && okInput.meeting.lat === 41.01235);
  check("rota isteği: üç geçerli nokta kabul, eksik ya da dışı reddedilir", parsePointsBody({ points: [{ lat: 41, lng: 29 }, { lat: 41.1, lng: 29.1 }, { lat: 41.2, lng: 29.2 }] })?.length === 3 && parsePointsBody({ points: [{ lat: 41, lng: 29 }] }) === null && parsePointsBody({ points: [{ lat: 41, lng: 29 }, { lat: 41, lng: 29 }, { lat: 10, lng: 29 }] }) === null && parsePointsBody("x") === null);

  const orsSample = { features: [{ geometry: { coordinates: [[28.9, 41.0], [29.0, 41.1]] }, properties: { summary: { distance: 12345.6, duration: 1500.2 } } }] };
  const orsRoute = parseOrsRoute(orsSample);
  check("OpenRouteService yanıtı ayrıştırılır", orsRoute?.distanceMeters === 12346 && orsRoute.durationSeconds === 1500 && orsRoute.path.length === 2);
  const osrmRoute = parseOsrmRoute({ code: "Ok", routes: [{ distance: 8000, duration: 900, geometry: { coordinates: [[28.9, 41.0], [29.0, 41.1], [29.1, 41.2]] } }] });
  check("OSRM yanıtı ayrıştırılır", osrmRoute?.distanceMeters === 8000 && osrmRoute.path.length === 3);
  check("bozuk rota yanıtları null döner", parseOrsRoute({}) === null && parseOsrmRoute({ code: "NoRoute", routes: [] }) === null && parseOsrmRoute(null) === null && parseOrsRoute({ features: [{ geometry: { coordinates: [[1, 2]] }, properties: { summary: { distance: 1, duration: 1 } } }] }) === null);
  const places = parseNominatim([
    { lat: "41.0", lon: "29.0", display_name: "Kadıköy, İstanbul" },
    { lat: "51.5", lon: "-0.1", display_name: "Londra" },
    { lat: "x", lon: "29", display_name: "Bozuk" },
    { lat: "40.9", lon: "29.1", display_name: "" },
    ...Array.from({ length: 8 }, (_, i) => ({ lat: String(40 + i / 10), lon: "30", display_name: `Yer ${i}` })),
  ]);
  check("adres sonuçları süzülür: Türkiye dışı, bozuk ve adsız elenir, en fazla 5", places.length === 5 && places[0].label === "Kadıköy, İstanbul" && !places.some((p) => p.label === "Londra"));
  check("dizi olmayan adres yanıtı boş döner", parseNominatim({}).length === 0);

  // Veritabanı ve sahte dış hizmetler
  const stamp = Date.now();
  const prefix = `test${stamp}-`;
  const cacheKeys: string[] = [];

  try {
    const provider = `${prefix}throttle`;
    check("hız sınırı: ilk hak verilir, hemen ikincisi verilmez", (await claimThrottle(provider, 30)) && !(await claimThrottle(provider, 30)));
    await claimThrottle(`${prefix}throttle2`, 0.4);
    await sleep(900);
    check("hız sınırı: süre geçince yeniden hak verilir", await claimThrottle(`${prefix}throttle2`, 0.4));

    const cacheKey = `test:${stamp}`;
    cacheKeys.push(cacheKey);
    await cachePut(cacheKey, "değer");
    check("önbellek kaydı okunur", (await cacheGet(cacheKey, 60_000)) === "değer");
    check("süresi geçen önbellek kaydı boş döner", (await cacheGet(cacheKey, -1)) === null);
    check("olmayan önbellek anahtarı boş döner", (await cacheGet(`test:yok:${stamp}`, 60_000)) === null);

    const query = `deneme-sorgu-${stamp}`;
    cacheKeys.push(searchKey(query));
    const search = fakeFetch([{ lat: "41.0", lon: "29.0", display_name: "Deneme yeri" }]);
    const first = await searchPlaces(query, { fetcher: search.fetcher, prefix });
    const second = await searchPlaces(query, { fetcher: search.fetcher, prefix });
    check("arama sonucu döner ve ikinci arama önbellekten gelir (tek dış istek)", first.status === "ok" && first.places.length === 1 && second.status === "ok" && search.count() === 1);
    const failing = fakeFetch({}, 500);
    await sleep(1200);
    await sleep(1200);
    check("dış arama hatası 'failed' döner", (await searchPlaces(`hatali-${stamp}`, { fetcher: failing.fetcher, prefix })).status === "failed");

    delete process.env.ORS_API_KEY;
    const pts = [{ lat: 41.0 + (stamp % 7) / 100, lng: 29.0 }, { lat: 41.1, lng: 29.1 }, { lat: 41.2, lng: 29.2 }];
    cacheKeys.push(routeKey(pts));
    const osrm = fakeFetch({ code: "Ok", routes: [{ distance: 9000, duration: 800, geometry: { coordinates: [[29.0, 41.0], [29.1, 41.1], [29.2, 41.2]] } }] });
    const r1 = await getRoute(pts, { fetcher: osrm.fetcher, prefix });
    const r2 = await getRoute(pts, { fetcher: osrm.fetcher, prefix });
    check("rota hesaplanır (OSRM), ikincisi önbellekten gelir", r1.status === "ok" && r1.source === "osrm" && r1.route.distanceMeters === 9000 && r2.status === "ok" && r2.source === "cache" && osrm.count() === 1);
    const other = [{ lat: 40.5, lng: 30.0 }, { lat: 40.6, lng: 30.1 }, { lat: 40.7, lng: 30.2 }];
    const bad = fakeFetch({}, 500);
    await sleep(1200);
    check("rota hizmeti hata verirse 'failed' döner", (await getRoute(other, { fetcher: bad.fetcher, prefix })).status === "failed");
    check("hatalı rota önbelleğe yazılmaz", (await cacheGet(routeKey(other), 60_000)) === null);
    check("geçersiz nokta sayısı 'failed' döner", (await getRoute([{ lat: 41, lng: 29 }], { fetcher: bad.fetcher, prefix })).status === "failed");

    // Yolculuk harita kaydı
    const [demo] = await db.select({ id: events.id }).from(events).where(eq(events.source, "demo")).limit(1);

    if (!demo) {
      throw new Error("Demo etkinlik yok.");
    }

    const [driver] = await db
      .insert(users)
      .values({ name: "Geo Test", email: `geo-${stamp}@geo-test.invalid`, passwordHash: "test", role: "driver" })
      .returning({ id: users.id });

    try {
      const [ride] = await db
        .insert(rides)
        .values({ eventId: demo.id, driverId: driver.id, origin: "T", destination: "T", meetingPoint: "T", departureTime: "23:30", durationMinutes: 30, seats: 2, totalCost: 100 })
        .returning({ id: rides.id });

      const route = { distanceMeters: 9000, durationSeconds: 800, path: [[29.0, 41.0], [29.1, 41.1]] as [number, number][] };
      await saveRideGeo(ride.id, { origin: { lat: 41.01, lng: 29.0 }, meeting: { lat: 41.01235, lng: 29.00123 }, dest: { lat: 40.99, lng: 29.12 } }, route);
      const saved = await getRideGeo(ride.id);
      check("harita kaydı okunur (koordinatlar kayıpsız)", saved?.origin.lat === 41.01 && saved.meeting.lng === 29.00123 && saved.dest.lat === 40.99);
      check("rota bilgisi ve çizgi okunur", saved?.distanceMeters === 9000 && saved.durationSeconds === 800 && saved.path?.length === 2);

      await saveRideGeo(ride.id, { origin: { lat: 41.02, lng: 29.0 }, meeting: { lat: 41.0, lng: 29.0 }, dest: { lat: 40.9, lng: 29.1 } }, null);
      const updated = await getRideGeo(ride.id);
      check("aynı yolculuk için kayıt güncellenir, rota yoksa çizgi boş", updated?.origin.lat === 41.02 && updated.path === null && updated.distanceMeters === null);
      check("harita kaydı olmayan yolculuk için null", (await getRideGeo("00000000-0000-4000-8000-000000000000")) === null);

      await db.delete(rides).where(eq(rides.id, ride.id));
      check("yolculuk silinince harita kaydı da silinir", (await getRideGeo(ride.id)) === null);
    } finally {
      await db.delete(rides).where(eq(rides.driverId, driver.id));
      await db.delete(users).where(eq(users.id, driver.id));
    }
  } finally {
    await db.delete(geoCache).where(inArray(geoCache.key, cacheKeys));
    await db.delete(apiThrottle).where(like(apiThrottle.provider, `${prefix}%`));
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
