import { readFileSync } from "node:fs";
import path from "node:path";
import { checkCronAuth } from "../src/lib/cron-auth";

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

const SECRET = "a-long-test-secret-value-1234567890";
const GOOD = `Bearer ${SECRET}`;

check("anahtar tanımsızsa adres kapalı (not_configured)", checkCronAuth(GOOD, undefined) === "not_configured");
check("boş anahtar kapalı", checkCronAuth(GOOD, "") === "not_configured");
check("16 karakterden kısa anahtar kapalı", checkCronAuth("Bearer short", "short") === "not_configured");
check("doğru başlık kabul edilir", checkCronAuth(GOOD, SECRET) === "ok");
check("başlık yoksa reddedilir", checkCronAuth(null, SECRET) === "unauthorized");
check("boş başlık reddedilir", checkCronAuth("", SECRET) === "unauthorized");
check("yanlış anahtar reddedilir", checkCronAuth("Bearer wrong-secret-value-1234567890", SECRET) === "unauthorized");
check("Bearer öneki olmadan reddedilir", checkCronAuth(SECRET, SECRET) === "unauthorized");
check("küçük harfli bearer reddedilir", checkCronAuth(`bearer ${SECRET}`, SECRET) === "unauthorized");
check("sonda boşluk reddedilir", checkCronAuth(`${GOOD} `, SECRET) === "unauthorized");
check("farklı uzunlukta başlıklar hata vermeden reddedilir", checkCronAuth(`${GOOD}x`, SECRET) === "unauthorized" && checkCronAuth("B", SECRET) === "unauthorized");
check("çok uzun başlık hata vermeden reddedilir", checkCronAuth("x".repeat(100000), SECRET) === "unauthorized");

const route = readFileSync(path.join(process.cwd(), "src", "app", "api", "cron", "biletimgo", "route.ts"), "utf8");
const authAt = route.indexOf("checkCronAuth(");
const syncAt = route.indexOf("runBiletimgoSync(");
check("route yetkiyi senkrondan ÖNCE kontrol eder", authAt !== -1 && syncAt !== -1 && authAt < syncAt);
check("route konsola hiçbir şey yazmaz (sızıntı riski)", !/console\./.test(route));
check("route anahtarı yalnızca ortamdan okur", /process\.env\.CRON_SECRET/.test(route) && /process\.env\.BILETIMGO_API_TOKEN/.test(route));

const config = JSON.parse(readFileSync(path.join(process.cwd(), "vercel.json"), "utf8")) as { crons?: { path: string; schedule: string }[] };
check("vercel.json tek ve günlük bir cron tanımlar (Hobby sınırı)", config.crons?.length === 1 && config.crons[0].path === "/api/cron/biletimgo" && /^\d{1,2} \d{1,2} \* \* \*$/.test(config.crons[0].schedule));

console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

if (failed > 0) {
  process.exitCode = 1;
}