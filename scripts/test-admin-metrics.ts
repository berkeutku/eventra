import {
  barWidth,
  fillDays,
  lastDays,
  percent,
  trDayKey,
} from "../src/lib/admin-metrics-rules";

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

function pureChecks() {
  // 21:30 UTC = ertesi gün 00:30 Türkiye saati.
  check(
    "gün anahtarı Türkiye saatine göre (gece yarısı sonrası ertesi gün)",
    trDayKey(new Date("2026-11-16T21:30:00Z")) === "2026-11-17" &&
      trDayKey(new Date("2026-11-16T20:59:00Z")) === "2026-11-16",
  );

  const now = new Date("2026-11-16T12:00:00Z");
  const days = lastDays(3, now);
  check(
    "son günler eskiden yeniye sıralı ve bugün dahil",
    days.join(",") === "2026-11-14,2026-11-15,2026-11-16",
  );

  const filled = fillDays(
    [
      { day: "2026-11-15", count: 2 },
      { day: "2026-11-15", count: 1 },
      { day: "2020-01-01", count: 9 },
    ],
    3,
    now,
  );
  check(
    "boş günler 0 ile dolar, aynı gün toplanır, aralık dışı atılır",
    filled.map((item) => item.count).join(",") === "0,3,0" &&
      filled.length === 3,
  );

  check(
    "yüzde: yuvarlanır, toplam 0 ise 0, taşma 100'de kalır",
    percent(1, 3) === 33 &&
      percent(2, 3) === 67 &&
      percent(5, 0) === 0 &&
      percent(0, 10) === 0 &&
      percent(15, 10) === 100,
  );

  check(
    "çubuk: değer varsa en az 4, en büyük değer 100, sıfır 0",
    barWidth(1, 1000) === 4 &&
      barWidth(10, 10) === 100 &&
      barWidth(0, 10) === 0 &&
      barWidth(5, 0) === 0,
  );
}

async function dbChecks() {
  const env = process as unknown as { loadEnvFile?: (path?: string) => void };

  if (!process.env.DATABASE_URL) {
    try {
      env.loadEnvFile?.(".env");
    } catch {
      // .env yoksa ortam değişkeni başka yoldan verilmiş olmalı.
    }
  }

  const { getMetrics } = await import("../src/lib/admin-metrics");
  const metrics = await getMetrics();

  check(
    "ölçümler okunur ve günlük kayıt 14 gün verir",
    metrics.signupsByDay.length === 14,
  );
  check(
    "sayılar negatif değil",
    [
      metrics.users.total,
      metrics.rides.total,
      metrics.joins.total,
      metrics.funnel.verified,
      metrics.trust.openReports,
      metrics.events.demoUpcoming,
    ].every((value) => Number.isFinite(value) && value >= 0),
  );
  check(
    "tutarlılık: eşleşen <= toplam yolculuk, doğrulayan <= toplam kullanıcı",
    metrics.rides.matched <= metrics.rides.total &&
      metrics.funnel.verified <= metrics.funnel.registered,
  );
  check(
    "tutarlılık: tamamlayan <= katılan, katılan <= kullanıcı",
    metrics.funnel.completed <= metrics.funnel.participated &&
      metrics.funnel.participated <= metrics.funnel.registered,
  );
  check(
    "son 7 gün <= son 30 gün <= toplam kullanıcı",
    metrics.users.last7 <= metrics.users.last30 &&
      metrics.users.last30 <= metrics.users.total,
  );

}

async function main() {
  pureChecks();

  try {
    await dbChecks();
  } catch (error) {
    failed += 1;
    console.log(
      "  BAŞARISIZ: veritabanı testi çalışmadı:",
      error instanceof Error ? error.message : error,
    );
  }

  console.log(`\n${passed} test geçti, ${failed} test başarısız.`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
