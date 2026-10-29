import {
  buildStats,
  computeBadges,
  driverContribution,
  passengerSaving,
  summarize,
  type StatsRide,
} from "../src/lib/stats";

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

const NOW = new Date("2026-11-01T12:00:00+03:00");
const PAST = "2026-10-20T20:00:00+03:00";
const FUTURE = "2026-11-21T20:00:00+03:00";

function ride(overrides: Partial<StatsRide> = {}): StatsRide {
  return {
    id: "r1",
    eventId: "e1",
    eventStartsAt: FUTURE,
    totalCost: 600,
    seats: 3,
    passengerCount: 2,
    ...overrides,
  };
}

// Tasarruf hesapları
check(
  "yolcu tasarrufu: 600 TL, 2 yolcu + sürücü = kişi başı 200, tasarruf 400",
  passengerSaving(ride()) === 400,
);
check(
  "sürücü katkısı: 2 yolcu x 200 = 400",
  driverContribution(ride()) === 400,
);
check(
  "yukarı yuvarlama: 100 TL, 3 kişi, kişi başı 34, yolcu tasarrufu 66",
  passengerSaving(ride({ totalCost: 100 })) === 66,
);
check(
  "yukarı yuvarlama: sürücü katkısı 2 x 34 = 68",
  driverContribution(ride({ totalCost: 100 })) === 68,
);
check(
  "yolcusuz yolculukta sürücü katkısı 0",
  driverContribution(ride({ passengerCount: 0 })) === 0,
);
check(
  "tutarsız veride yolcu tasarrufu 0'ın altına inmez",
  passengerSaving(ride({ passengerCount: 0 })) === 0,
);
check(
  "sürücü katkısı toplam masrafı aşmaz",
  driverContribution(ride({ totalCost: 1, passengerCount: 5 })) <= 1,
);

// Geçmiş ve yaklaşan ayrımı
const summary = summarize(
  [ride({ eventStartsAt: PAST }), ride({ id: "r2", eventStartsAt: FUTURE })],
  passengerSaving,
  NOW,
);
check(
  "bir geçmiş, bir yaklaşan yolculuk ayrı sayılır",
  summary.past === 1 && summary.upcoming === 1,
);
check(
  "tasarruf tutarları ayrı toplanır",
  summary.savedPast === 400 && summary.savedUpcoming === 400,
);
check(
  "geçersiz tarihli yolculuk sayıma girmez",
  summarize([ride({ eventStartsAt: "bozuk" })], passengerSaving, NOW).past +
    summarize([ride({ eventStartsAt: "bozuk" })], passengerSaving, NOW)
      .upcoming ===
    0,
);

// Rozetler
const none = computeBadges([], []);
check("hiç yolculuk yokken hiçbir rozet kazanılmaz", none.every((b) => !b.earned));

const joined = computeBadges([], [ride()]);
check(
  "yolcu olarak katılınca yalnızca İlk Katılım kazanılır",
  joined.find((b) => b.key === "first_join")?.earned === true &&
    joined.filter((b) => b.earned).length === 1,
);

const driven = computeBadges([ride({ passengerCount: 0 })], []);
check(
  "yolculuk oluşturunca İlk Kaptanlık kazanılır, Dolu Araç kazanılmaz",
  driven.find((b) => b.key === "first_ride")?.earned === true &&
    driven.find((b) => b.key === "full_car")?.earned === false,
);

const full = computeBadges([ride({ seats: 1, passengerCount: 1 })], []);
check(
  "tüm koltuklar dolunca Dolu Araç kazanılır",
  full.find((b) => b.key === "full_car")?.earned === true,
);

const sameEvent = computeBadges([ride(), ride({ id: "r2" })], []);
check(
  "aynı etkinlik iki kez sayılmaz (Kaşif kazanılmaz, ilerleme 1)",
  sameEvent.find((b) => b.key === "explorer")?.earned === false &&
    sameEvent.find((b) => b.key === "explorer")?.current === 1,
);

const explorer = computeBadges(
  [ride({ eventId: "e1" }), ride({ id: "r2", eventId: "e2" })],
  [ride({ id: "r3", eventId: "e3" })],
);
check(
  "3 farklı etkinlikte Kaşif kazanılır",
  explorer.find((b) => b.key === "explorer")?.earned === true,
);

const five = computeBadges(
  [ride(), ride({ id: "r2" }), ride({ id: "r3" })],
  [ride({ id: "r4" }), ride({ id: "r5" })],
);
check(
  "5 yolculukta Paylaşım Ustası kazanılır",
  five.find((b) => b.key === "sharing_master")?.earned === true,
);

const built = buildStats([ride()], [ride({ id: "r2" })], NOW);
check(
  "buildStats toplam yolculuk sayısını verir",
  built.totalRides === 2 && built.badges.length === 5,
);

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

if (failed > 0) {
  process.exitCode = 1;
}