import {
  DRIVER_DECLARATION_TEXT,
  isDriverDeclarationAccepted,
} from "../src/lib/driver-declaration-rules";

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean) {
  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    console.log("BAŞARISIZ:", name);
  }
}

check("1 değeri onay sayılır", isDriverDeclarationAccepted("1") === true);
check("işaretlenmemiş kutu (null) onay değil", isDriverDeclarationAccepted(null) === false);
check("undefined onay değil", isDriverDeclarationAccepted(undefined) === false);
check("boş metin onay değil", isDriverDeclarationAccepted("") === false);
check("0 onay değil", isDriverDeclarationAccepted("0") === false);
check("true metni onay değil", isDriverDeclarationAccepted("true") === false);
check("on metni onay değil", isDriverDeclarationAccepted("on") === false);
check("dosya değeri onay değil", isDriverDeclarationAccepted(new File([], "x")) === false);
check("beyan metni ehliyet ve sigortayı anar", DRIVER_DECLARATION_TEXT.includes("ehliyet") && DRIVER_DECLARATION_TEXT.includes("sigorta"));
check("beyan metni kâr amacı gütmemeyi anar", DRIVER_DECLARATION_TEXT.includes("kâr amacı gütmüyorum"));

console.log(`${passed} test geçti, ${failed} test başarısız`);
process.exit(failed === 0 ? 0 : 1);
