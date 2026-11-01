import {
  LIMITS,
  cleanInline,
  htmlToText,
  mapCategory,
  normalizeCityKey,
  normalizeEvent,
  normalizePrice,
  parseTurkeyDateTime,
  safeBiletimgoUrl,
} from "../src/lib/biletimgo/normalize";

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

const iso = (date: Date | null) => (date ? date.toISOString() : null);

// Tarih
check("20:00 Türkiye saati = 17:00 UTC", iso(parseTurkeyDateTime("2026-11-15 20:00")) === "2026-11-15T17:00:00.000Z");
check("yalnızca saat verilirse dakika 00", iso(parseTurkeyDateTime("2026-11-15 20")) === "2026-11-15T17:00:00.000Z");
check("T ayracı kabul edilir", iso(parseTurkeyDateTime("2026-11-15T20:00")) === "2026-11-15T17:00:00.000Z");
check("gece yarısından sonra bir önceki güne düşer (UTC)", iso(parseTurkeyDateTime("2026-01-01 00:30")) === "2025-12-31T21:30:00.000Z");
check("31 Şubat reddedilir", parseTurkeyDateTime("2026-02-31 10:00") === null);
check("13. ay reddedilir", parseTurkeyDateTime("2026-13-01 10:00") === null);
check("24:00 reddedilir", parseTurkeyDateTime("2026-11-15 24:00") === null);
check("bozuk metin reddedilir", parseTurkeyDateTime("yarın") === null);
check("metin olmayan değer reddedilir", parseTurkeyDateTime(12345) === null);

// Kategori
check("Tiyatro -> theatre", mapCategory("Tiyatro") === "theatre");
check("Sahne -> other", mapCategory("Sahne") === "other");
check("Eğitim -> workshop", mapCategory("Eğitim") === "workshop");
check("Workshop -> workshop", mapCategory("Workshop") === "workshop");
check("Parti -> party", mapCategory("Parti") === "party");
check("Çocuk Etkinlikleri -> kids", mapCategory("Çocuk Etkinlikleri") === "kids");
check("Stand-Up -> standup", mapCategory("Stand-Up") === "standup");
check("KONSER büyük harfle -> concert", mapCategory("KONSER") === "concert");
check("Festival -> festival", mapCategory("Festival") === "festival");
check("bilinmeyen kategori -> other", mapCategory("Bilinmeyen Bir Şey") === "other");
check("prototip anahtarı güvenli (constructor -> other)", mapCategory("constructor") === "other");

// Şehir anahtarı
check("İstanbul -> istanbul", normalizeCityKey("İstanbul") === "istanbul");
check("Çanakkale -> canakkale", normalizeCityKey("Çanakkale") === "canakkale");
check("Şanlıurfa -> sanliurfa", normalizeCityKey("Şanlıurfa") === "sanliurfa");
check("ISPARTA -> isparta", normalizeCityKey("ISPARTA") === "isparta");

// Fiyat
check("tek fiyat korunur", normalizePrice("600") === "600");
check("aralık korunur", normalizePrice("350 - 657") === "350 - 657");
check("Aktif Bilet Yok korunur", normalizePrice("Aktif Bilet Yok") === "Aktif Bilet Yok");
check("boş fiyat null", normalizePrice("  ") === null);
check("metin olmayan fiyat null", normalizePrice(12) === null);
check("çok uzun fiyat kısaltılır", (normalizePrice("9".repeat(100)) ?? "").length <= LIMITS.price);

// URL
const ticket = "https://www.biletimgo.com/etkinlik/x?partner=abc";
check("geçerli bilet bağlantısı DEĞİŞTİRİLMEDEN döner", safeBiletimgoUrl(ticket) === ticket);
check("http reddedilir", safeBiletimgoUrl("http://www.biletimgo.com/x") === null);
check("başka alt alan adı reddedilir", safeBiletimgoUrl("https://evil.biletimgo.com/x") === null);
check("alan adı öneki taklidi reddedilir", safeBiletimgoUrl("https://www.biletimgo.com.evil.example/x") === null);
check("kullanıcı bilgisi içeren adres reddedilir", safeBiletimgoUrl("https://user:pw@www.biletimgo.com/x") === null);
check("port içeren adres reddedilir", safeBiletimgoUrl("https://www.biletimgo.com:8443/x") === null);
check("boşluk içeren adres reddedilir", safeBiletimgoUrl("https://www.biletimgo.com/a b") === null);
check("javascript adresi reddedilir", safeBiletimgoUrl("javascript:alert(1)") === null);
check("metin olmayan değer reddedilir", safeBiletimgoUrl(5) === null);
check("görsel yolu /images/ ile başlamalı", safeBiletimgoUrl("https://www.biletimgo.com/images/a.jpeg", "/images/") !== null && safeBiletimgoUrl("https://www.biletimgo.com/baska/a.jpeg", "/images/") === null);

// Tek satırlık alanlar
check("&amp; ve &quot; bir kez çözülür", cleanInline("Fine &amp; Dine &quot;Fin&quot;", 200) === 'Fine & Dine "Fin"');
check("çift kodlama ikinci kez çözülmez", cleanInline("&amp;lt;", 200) === "&lt;");
check("kontrol ve yön değiştirme karakterleri atılır", cleanInline("a\u0000b\u202Ec", 50) === "abc");
check("metin olmayan değer boş döner", cleanInline(123, 10) === "");

// Açıklama
check("temel HTML düz metne döner", htmlToText("%3Cp%3EMerhaba%20d%C3%BCnya%3C%2Fp%3E") === "Merhaba dünya");
check("script içeriğiyle birlikte atılır", htmlToText("%3Cscript%3Ealert(1)%3C%2Fscript%3EMerhaba") === "Merhaba");
check("img ve olay özniteliği atılır", htmlToText("%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E") === "");
check("bağlantı metni kalır, adres atılır", htmlToText("%3Ca%20href%3D%22https%3A%2F%2Fevil.example%22%3Et%C4%B1kla%3C%2Fa%3E") === "tıkla");
check("liste maddeleri satıra dönüşür", (() => { const t = htmlToText("%3Cul%3E%3Cli%3EBir%3C%2Fli%3E%3Cli%3E%C4%B0ki%3C%2Fli%3E%3C%2Ful%3E"); return t.includes("• Bir") && t.includes("• İki") && !t.includes("<"); })());
check("çift kodlanmış etiket de temizlenir", htmlToText("%26lt%3Bb%26gt%3Bx") === "x");
check("emoji korunur", htmlToText("%F0%9F%96%A4%20Halloween") === "🖤 Halloween");
check("kodlanmış artı işareti korunur", htmlToText("18%2B%20ya%C5%9F") === "18+ yaş");
check("ham artı işareti boşluğa çevrilmez", htmlToText("A+B") === "A+B");
check("bozuk kodlama hata vermez", htmlToText("100% iyi") === "100% iyi" && htmlToText("%E0%A4%A") === "%E0%A4%A");
check("ardışık boş satırlar sadeleşir", htmlToText("A%0A%0A%0A%0AB") === "A\n\nB");
check("aşırı uzun metin sınırlanır", (() => { const t = htmlToText("a".repeat(9000)); return t.length === LIMITS.description && t.endsWith("…"); })());
check("metin olmayan değer boş döner", htmlToText(null) === "");

// Tam etkinlik
const base = {
  id: "12345",
  etkinlik: "Test &amp; Gece",
  kategori: "Konser",
  detay: "%3Cp%3EMerhaba%3C%2Fp%3E",
  konum: "Test Mekan",
  adres: "Test Adres",
  sehir: "İstanbul",
  organizator: "Org",
  url: ticket,
  gorsel: "https://www.biletimgo.com/images/x.jpeg",
  baslangic: "2026-11-15 20:00",
  bitis: "2026-11-15 23:00",
  fiyat: "350 - 657",
};

const good = normalizeEvent(base);
check("geçerli etkinlik kabul edilir", good.ok);

if (good.ok) {
  const e = good.event;
  check("kimlik bgo- önekiyle oluşur", e.id === "bgo-12345" && e.externalId === "12345");
  check("başlık varlıkları çözülür", e.title === "Test & Gece");
  check("kategori eşlenir, özgün ad saklanır", e.category === "concert" && e.sourceCategory === "Konser");
  check("şehir anahtarı oluşur", e.cityKey === "istanbul");
  check("başlangıç ve bitiş doğru", iso(e.startsAt) === "2026-11-15T17:00:00.000Z" && iso(e.endsAt) === "2026-11-15T20:00:00.000Z");
  check("bilet bağlantısı değişmedi", e.ticketUrl === ticket);
  check("fiyat metin olarak korundu", e.priceText === "350 - 657");
  check("açıklama düz metin", e.description === "Merhaba");
}

const custom = normalizeEvent(base, "x-");
check("özel önek uygulanır", custom.ok && custom.event.id === "x-12345");
check("kimlik rakam değilse reddedilir", (() => { const r = normalizeEvent({ ...base, id: "12ab" }); return !r.ok && r.reason === "id"; })());
check("bilet bağlantısı geçersizse etkinlik reddedilir", (() => { const r = normalizeEvent({ ...base, url: "http://evil.example/x" }); return !r.ok && r.reason === "url"; })());
check("başlangıç bozuksa reddedilir", (() => { const r = normalizeEvent({ ...base, baslangic: "bozuk" }); return !r.ok && r.reason === "start"; })());
check("görsel geçersizse etkinlik yine kabul edilir (görselsiz)", (() => { const r = normalizeEvent({ ...base, gorsel: "https://evil.example/a.png" }); return r.ok && r.event.imageUrl === null; })());
check("bitiş başlangıçtan önceyse bitiş null", (() => { const r = normalizeEvent({ ...base, bitis: "2026-11-15 18:00" }); return r.ok && r.event.endsAt === null; })());
check("mekân boşsa adres, o da boşsa şehir kullanılır", (() => { const a = normalizeEvent({ ...base, konum: "" }); const b = normalizeEvent({ ...base, konum: "", adres: "" }); return a.ok && a.event.venue === "Test Adres" && b.ok && b.event.venue === "İstanbul"; })());
check("nesne olmayan kayıt reddedilir", !normalizeEvent("bozuk").ok);

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

if (failed > 0) {
  process.exitCode = 1;
}