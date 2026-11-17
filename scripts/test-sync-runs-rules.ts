import {
  consecutiveFailures,
  explainSyncError,
  formatRunDuration,
  syncStatusLabel,
  syncStatusTone,
} from "../src/lib/sync-runs-rules";

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

check("başarılı etiketi", syncStatusLabel("success") === "Başarılı");
check("başarısız etiketi", syncStatusLabel("failed") === "Başarısız");
check("bilinmeyen durum olduğu gibi", syncStatusLabel("x") === "x");
check("success tonu iyi", syncStatusTone("success") === "good");
check("failed tonu kötü", syncStatusTone("failed") === "bad");
check("suspicious tonu uyarı", syncStatusTone("suspicious") === "warn");
check("running nötr", syncStatusTone("running") === "neutral");

check("hata kodu yoksa boş", explainSyncError(null) === "");
check("cloudflare açıklaması", explainSyncError("forbidden_html").includes("Cloudflare"));
check("bilinmeyen kod gösterilir", explainSyncError("zzz") === "Hata kodu: zzz");

const start = new Date("2026-11-17T18:00:00Z");
check("bitmemiş çalışma süresiz", formatRunDuration(start, null) === null);
check("saniye", formatRunDuration(start, new Date("2026-11-17T18:00:03Z")) === "3 sn");
check("tam dakika", formatRunDuration(start, new Date("2026-11-17T18:02:00Z")) === "2 dk");
check("dakika ve saniye", formatRunDuration(start, new Date("2026-11-17T18:01:05Z")) === "1 dk 5 sn");
check("negatif süre sıfır", formatRunDuration(start, new Date("2026-11-17T17:59:00Z")) === "0 sn");

check("hepsi başarısız", consecutiveFailures(["failed", "failed", "failed"]) === 3);
check("başarıda durur", consecutiveFailures(["failed", "success", "failed"]) === 1);
check("ilk başarılıysa sıfır", consecutiveFailures(["success", "failed"]) === 0);
check("running sayılmaz", consecutiveFailures(["running", "failed", "success"]) === 1);
check("boş liste sıfır", consecutiveFailures([]) === 0);

console.log(`${passed} test geçti, ${failed} test başarısız`);
process.exit(failed === 0 ? 0 : 1);
