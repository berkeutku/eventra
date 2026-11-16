import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

// Tüm test betiklerini (scripts/test-*.ts) sırayla çalıştırır ve kısa bir özet verir.
//   npx tsx scripts/test-all.ts
// Her betik kendi sonucunu "N test geçti, M test başarısız." satırıyla yazar.

const SCRIPTS_DIR = join(process.cwd(), "scripts");
const SELF = "test-all.ts";
// Adı "test-" ile başlayan ama test olmayan yardımcı betikler asla çalıştırılmaz.
const NOT_TESTS = new Set(["test-event.ts"]);
const TIMEOUT_MS = 180_000;

type Result = {
  file: string;
  passed: number;
  failed: number;
  crashed: boolean;
  noSummary: boolean; // eski betikler "N test geçti" satırı yazmaz, yalnızca çıkış koduna bakılır
  tail: string;
};

function runOne(file: string): Result {
  const run = spawnSync("npx", ["tsx", join("scripts", file)], {
    encoding: "utf8",
    shell: true,
    timeout: TIMEOUT_MS,
    maxBuffer: 20 * 1024 * 1024,
  });

  const output = `${run.stdout ?? ""}\n${run.stderr ?? ""}`;
  const match = output.match(/(\d+) test geçti, (\d+) test başarısız/);
  const lines = output.trim().split(/\r?\n/);

  return {
    file,
    passed: match ? Number(match[1]) : 0,
    failed: match ? Number(match[2]) : 0,
    // Özet satırı yoksa çıkış koduna bakılır: 0 ise geçti, değilse çöktü ya da zaman aşımına uğradı.
    crashed: match ? run.status === null : run.status !== 0,
    noSummary: !match,
    tail: lines.slice(-15).join("\n"),
  };
}

function main() {
  const files = readdirSync(SCRIPTS_DIR)
    .filter((name) => name.startsWith("test-") && name.endsWith(".ts"))
    .filter((name) => name !== SELF && !NOT_TESTS.has(name))
    .sort();

  console.log(`${files.length} test dosyası çalıştırılıyor...\n`);

  const results: Result[] = [];

  for (const file of files) {
    process.stdout.write(`  ${file} ... `);
    const result = runOne(file);
    results.push(result);

    if (result.crashed) {
      console.log("ÇÖKTÜ");
    } else if (result.failed > 0) {
      console.log(`BAŞARISIZ (${result.passed} geçti, ${result.failed} başarısız)`);
    } else if (result.noSummary) {
      console.log("geçti (özet satırı yok, çıkış kodu 0)");
    } else {
      console.log(`geçti (${result.passed})`);
    }
  }

  const bad = results.filter((item) => item.crashed || item.failed > 0);
  const passed = results.reduce((sum, item) => sum + item.passed, 0);
  const failed = results.reduce((sum, item) => sum + item.failed, 0);

  for (const item of bad) {
    console.log(`\n--- ${item.file} (son satırlar) ---\n${item.tail}`);
  }

  console.log(
    `\nTOPLAM: ${results.length} dosya, ${passed} test geçti, ${failed} test başarısız, ${bad.length} dosyada sorun var.`,
  );
  process.exit(bad.length === 0 ? 0 : 1);
}

main();
