import {
  dayKey,
  describeWhen,
  eventsHref,
  formatDay,
  parseDay,
  parseWhen,
  rangeFor,
  upcomingDays,
} from "../src/lib/event-filter-rules";

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

// 25 Kasım 2026 Çarşamba, Türkiye saatiyle 13:00
const NOW = new Date("2026-11-25T10:00:00Z");
const iso = (date: Date | undefined) => date?.toISOString();

check("bilinmeyen tarih değeri -> all", parseWhen("dün") === "all");
check("tomorrow tanınır", parseWhen("tomorrow") === "tomorrow");

check("geçerli gün kabul edilir", parseDay("2026-11-25") === "2026-11-25");
check("31 Kasım reddedilir", parseDay("2026-11-31") === null);
check("bozuk biçim reddedilir", parseDay("25.11.2026") === null);
check("boş değer reddedilir", parseDay(undefined) === null);

check("gün anahtarı Türkiye saatine göre", dayKey(new Date("2026-11-25T22:30:00Z")) === "2026-11-26");

const today = rangeFor("today", NOW);
check("bugün: TR gece yarısından başlar", iso(today?.from) === "2026-11-24T21:00:00.000Z");
check("bugün: 1 gün sürer", iso(today?.to) === "2026-11-25T21:00:00.000Z");

const tomorrow = rangeFor("tomorrow", NOW);
check("yarın: ertesi gün", iso(tomorrow?.from) === "2026-11-25T21:00:00.000Z");

const weekend = rangeFor("weekend", NOW);
check("hafta sonu: cumartesi başlar", iso(weekend?.from) === "2026-11-27T21:00:00.000Z");
check("hafta sonu: pazartesi biter", iso(weekend?.to) === "2026-11-29T21:00:00.000Z");

const sunday = rangeFor("weekend", new Date("2026-11-29T10:00:00Z"));
check("pazar günü hafta sonu yalnızca bugün", iso(sunday?.from) === "2026-11-28T21:00:00.000Z" && iso(sunday?.to) === "2026-11-29T21:00:00.000Z");

check("all için aralık yok", rangeFor("all", NOW) === null);

const single = rangeFor("custom", NOW, "2026-12-05");
check("tek gün seçimi", iso(single?.from) === "2026-12-04T21:00:00.000Z" && iso(single?.to) === "2026-12-05T21:00:00.000Z");

const span = rangeFor("custom", NOW, "2026-12-01", "2026-12-03");
check("aralık son günü de kapsar", iso(span?.to) === "2026-12-03T21:00:00.000Z");

const reversed = rangeFor("custom", NOW, "2026-12-03", "2026-12-01");
check("ters aralık düzeltilir", iso(reversed?.from) === "2026-11-30T21:00:00.000Z");

check("geçersiz özel tarih -> aralık yok", rangeFor("custom", NOW, "abc") === null);

const days = upcomingDays(NOW, 14);
check("14 gün üretilir", days.length === 14);
check("ilk gün Bugün", days[0].top === "Bugün" && days[0].key === "2026-11-25");
check("ikinci gün Yarın", days[1].top === "Yarın");
check("cumartesi hafta sonu sayılır", days[3].top === "Cmt" && days[3].weekend);

check("gün biçimi", formatDay("2026-11-25") === "25 Kasım");
check("özel aralık açıklaması", describeWhen("custom", "2026-12-01", "2026-12-03") === "1 Aralık – 3 Aralık");
check("hazır seçenek açıklaması", describeWhen("weekend") === "Bu hafta sonu");

const state = { q: "caz", sehir: "istanbul", tarih: "custom", bas: "2026-12-01" };
check("değişiklik uygulanır", eventsHref(state, { sehir: "ankara" }) === "/events?q=caz&sehir=ankara&tarih=custom&bas=2026-12-01");
check("hazır tarihe geçince özel günler silinir", eventsHref(state, { tarih: "today" }) === "/events?q=caz&sehir=istanbul&tarih=today");
check("all ve boş değerler adrese yazılmaz", eventsHref({ tarih: "all", kaynak: "all" }) === "/events");
check("sayfa numarası eklenir", eventsHref({ kategori: "concert" }, {}, 3) === "/events?kategori=concert&sayfa=3");

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);
process.exitCode = failed > 0 ? 1 : 0;
