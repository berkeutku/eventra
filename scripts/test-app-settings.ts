import { parseSettingFlag } from "../src/lib/app-settings-rules";

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    console.log(`  BAŞARISIZ: ${name} (beklenen ${expected}, gelen ${actual})`);
  }
}

check("1 açık", parseSettingFlag("1", false), true);
check("0 kapalı", parseSettingFlag("0", true), false);
check("kayıt yok, varsayılan kapalı", parseSettingFlag(undefined, false), false);
check("kayıt yok, varsayılan açık", parseSettingFlag(undefined, true), true);
check("null varsayılana düşer", parseSettingFlag(null, true), true);
check("bozuk değer varsayılana düşer", parseSettingFlag("evet", false), false);
check("boş değer varsayılana düşer", parseSettingFlag("", true), true);
check("DB kaydı ortam değişkenini ezer (kapalı)", parseSettingFlag("0", true), false);
check("DB kaydı ortam değişkenini ezer (açık)", parseSettingFlag("1", false), true);

console.log(`${passed} test geçti, ${failed} test başarısız`);
process.exit(failed > 0 ? 1 : 0);
