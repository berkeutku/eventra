import {
  CO2_GRAMS_PER_KM,
  MAX_COST,
  co2SavedKg,
  suggestRideCost,
} from "../src/lib/trip-estimates";

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

const base = { distanceMeters: 100_000, litersPer100: 7, pricePerLiter: 80, tolls: 0 };

check("100 km, 7 L/100 km, 80 TL: 560 TL (kayan nokta hatası yok)", suggestRideCost(base) === 560);
check("otoyol eklenince 10 TL'ye yukarı yuvarlanır (655 -> 660)", suggestRideCost({ ...base, tolls: 95 }) === 660);
check("1 km için en az 10 TL", suggestRideCost({ ...base, distanceMeters: 1000 }) === 10);
check("çok uzun mesafe 5000 TL ile sınırlanır", suggestRideCost({ ...base, distanceMeters: 3_000_000 }) === MAX_COST);
check("geçersiz mesafe reddedilir", suggestRideCost({ ...base, distanceMeters: 0 }) === null && suggestRideCost({ ...base, distanceMeters: -5 }) === null);
check("geçersiz tüketim reddedilir", suggestRideCost({ ...base, litersPer100: 1 }) === null && suggestRideCost({ ...base, litersPer100: 31 }) === null && suggestRideCost({ ...base, litersPer100: Number.NaN }) === null);
check("geçersiz fiyat reddedilir", suggestRideCost({ ...base, pricePerLiter: 0 }) === null && suggestRideCost({ ...base, pricePerLiter: 501 }) === null);
check("geçersiz otoyol reddedilir", suggestRideCost({ ...base, tolls: -1 }) === null && suggestRideCost({ ...base, tolls: 2001 }) === null);

const a = { lat: 41, lng: 29 };
const mid = { lat: 41, lng: 29.5 };
const b = { lat: 41, lng: 30 };

check("buluşma başlangıçla aynıysa tüm rota sayılır: 2 yolcu, 100 km = 30 kg", co2SavedKg({ passengers: 2, routeMeters: 100_000, origin: a, meeting: a, dest: b }) === 30);
const half = co2SavedKg({ passengers: 2, routeMeters: 100_000, origin: a, meeting: mid, dest: b });
check("buluşma ortadaysa yarısı sayılır (~15 kg)", half !== null && half > 14.5 && half < 15.5);
check("yolcu yoksa null", co2SavedKg({ passengers: 0, routeMeters: 100_000, origin: a, meeting: mid, dest: b }) === null);
check("mesafe yoksa ya da geçersizse null", co2SavedKg({ passengers: 1, routeMeters: null, origin: a, meeting: mid, dest: b }) === null && co2SavedKg({ passengers: 1, routeMeters: 0, origin: a, meeting: mid, dest: b }) === null);
check("kesirli yolcu sayısı reddedilir", co2SavedKg({ passengers: 1.5, routeMeters: 1000, origin: a, meeting: mid, dest: b }) === null);
check("emisyon varsayımı 150 g/km", CO2_GRAMS_PER_KM === 150);

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

if (failed > 0) {
  process.exitCode = 1;
}