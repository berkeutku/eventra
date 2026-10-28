import { safeNextPath } from "../src/lib/safe-redirect";

let passed = 0;
let failed = 0;

function check(name: string, actual: string, expected: string) {
  if (actual === expected) {
    passed += 1;
    console.log(`  geçti: ${name}`);
  } else {
    failed += 1;
    console.log(
      `  BAŞARISIZ: ${name} (beklenen: ${expected}, gelen: ${actual})`,
    );
  }
}

check(
  "site içi yol kabul edilir",
  safeNextPath("/events/gece-yolculugu-konseri"),
  "/events/gece-yolculugu-konseri",
);
check(
  "sorgu parametreli yol kabul edilir",
  safeNextPath("/events?kategori=match"),
  "/events?kategori=match",
);
check("tam adres reddedilir", safeNextPath("https://kotu.example"), "/panel");
check(
  "çift eğik çizgili adres reddedilir",
  safeNextPath("//kotu.example"),
  "/panel",
);
check(
  "ters eğik çizgili adres reddedilir",
  safeNextPath("/\\kotu.example"),
  "/panel",
);
check(
  "javascript adresi reddedilir",
  safeNextPath("javascript:alert(1)"),
  "/panel",
);
check("boş değer panele döner", safeNextPath(""), "/panel");
check("tanımsız değer panele döner", safeNextPath(undefined), "/panel");
check(
  "giriş sayfasına geri dönülmez",
  safeNextPath("/giris?next=/panel"),
  "/panel",
);
check(
  "çok uzun yol reddedilir",
  safeNextPath(`/${"a".repeat(300)}`),
  "/panel",
);
check(
  "satır sonu karakteri reddedilir",
  safeNextPath("/events\r\nSet-Cookie: x=1"),
  "/panel",
);

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

if (failed > 0) {
  process.exitCode = 1;
}