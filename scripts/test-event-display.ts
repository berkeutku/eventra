import {
  formatPrice,
  isProviderEvent,
  multiDayRange,
  sourceLabel,
  venueLine,
} from "../src/lib/event-display";

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

check("tek fiyata TL eklenir", formatPrice("600").text === "600 TL");
check("binlik ayraç", formatPrice("1250").text === "1.250 TL");
check("aralık", formatPrice("350 - 657").text === "350 – 657 TL");
check("aynı uçlu aralık tek fiyat olur", formatPrice("400-400").text === "400 TL");
check("sıfır ücretsiz", formatPrice("0").text === "Ücretsiz");
check("TL zaten varsa dokunulmaz", formatPrice("500 TL").text === "500 TL");
check("Aktif Bilet Yok -> tükendi", formatPrice("Aktif Bilet Yok").soldOut && formatPrice("Aktif Bilet Yok").text === null);
check("boş fiyat", formatPrice(null).text === null && !formatPrice(null).soldOut);
check("bilinmeyen metin olduğu gibi", formatPrice("Davetiyeli").text === "Davetiyeli");

check("biletimGO etiketi", sourceLabel("biletimgo") === "biletimGO");
check("demo etiketi", sourceLabel("demo") === "Demo etkinlik");
check("sağlayıcı etkinliği tanınır", isProviderEvent("biletimgo") && !isProviderEvent("demo"));

check("tek günlük etkinlikte aralık yok", multiDayRange("2026-11-28T17:00:00Z", "2026-11-28T20:00:00Z") === null);
check("gece yarısını geçen konser çok günlü sayılmaz", multiDayRange("2026-11-28T18:00:00Z", "2026-11-28T22:30:00Z") === null);
check("çok günlü aralık", multiDayRange("2026-11-28T10:00:00Z", "2026-12-01T18:00:00Z") === "28 Kas – 1 Ara");
check("bitiş yoksa aralık yok", multiDayRange("2026-11-28T10:00:00Z", null) === null);

check("mekân şehirle aynıysa şehir", venueLine("Mersin", "Mersin") === "Mersin");
check("mekân ve şehir", venueLine("Zorlu PSM", "İstanbul") === "Zorlu PSM, İstanbul");
check("mekân şehri içeriyorsa tekrar yok", venueLine("İstanbul Kongre Merkezi", "İstanbul") === "İstanbul Kongre Merkezi");

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);
process.exitCode = failed > 0 ? 1 : 0;
