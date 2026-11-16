import { installHint, isIosDevice } from "../src/lib/install-prompt-rules";

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

const base = { standalone: false, dismissed: false, canPrompt: false, ios: false };

check(
  "iPhone, iPad ve iPod tanınır, Android ve masaüstü tanınmaz",
  isIosDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)") &&
    isIosDevice("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)") &&
    !isIosDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120") &&
    !isIosDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120"),
);

check("uygulama olarak açılmışsa teşvik yok", installHint({ ...base, standalone: true, canPrompt: true }) === "none");
check("kapatılmışsa teşvik yok", installHint({ ...base, dismissed: true, canPrompt: true }) === "none");
check("tarayıcı kurulum penceresi verebiliyorsa 'prompt'", installHint({ ...base, canPrompt: true }) === "prompt");
check("iPhone'da yönerge gösterilir", installHint({ ...base, ios: true }) === "ios");
check("kurulum penceresi varsa iPhone yönergesine tercih edilir", installHint({ ...base, ios: true, canPrompt: true }) === "prompt");
check("hiçbiri uygun değilse teşvik yok (masaüstü, olay gelmedi)", installHint(base) === "none");

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);
process.exit(failed === 0 ? 0 : 1);
