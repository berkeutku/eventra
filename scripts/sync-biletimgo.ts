import "dotenv/config";
import { runBiletimgoSync } from "../src/lib/biletimgo/sync";

// Kullanım:
//   npx tsx scripts/sync-biletimgo.ts            -> DENEME MODU (veritabanına hiçbir şey yazmaz)
//   npx tsx scripts/sync-biletimgo.ts --apply    -> gerçekten yazar (ilk gerçek senkron aşamasında)
//   --allow-drop                                  -> ani düşüş korumasını bilerek geç
// Token yalnızca BILETIMGO_API_TOKEN ortam değişkeninden okunur ve hiçbir yerde yazdırılmaz.

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const allowDrop = args.includes("--allow-drop");
  const token = process.env.BILETIMGO_API_TOKEN ?? "";

  if (!token) {
    console.log("BILETIMGO_API_TOKEN ortam değişkeni tanımlı değil.");
    process.exitCode = 1;
    return;
  }

  console.log(apply ? "MOD: GERÇEK YAZMA (--apply)" : "MOD: deneme (hiçbir şey yazılmaz)");

  const result = await runBiletimgoSync({ token, apply, allowDrop });

  console.log("durum:", result.status, result.errorCode ? `(${result.errorCode})` : "");
  console.log("API'den gelen:", result.fetched, "| geçerli:", result.valid, "| atlanan:", result.skipped, "| yinelenen:", result.duplicates);
  console.log("atlama nedenleri:", JSON.stringify(result.skippedReasons));
  console.log("eklenecek/eklenen:", result.inserted, "| güncellenecek/güncellenen:", result.updated, "| yeniden aktif:", result.reactivated);
  console.log("görünmeyen (aktif):", result.missed, "| pasifleşecek/pasifleşen:", result.deactivated, "| korunan kimlik değişimi:", result.protectedChanges);

  if (result.status !== "dry_run" && result.status !== "success") {
    process.exitCode = 1;
  }
}

main()
  .catch(() => {
    console.log("Beklenmeyen hata.");
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });