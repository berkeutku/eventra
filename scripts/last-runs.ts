if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env");
  } catch {
    // .env yoksa ortam değişkeni başka yoldan verilmiş olmalı.
  }
}

async function main() {
  const { db } = await import("../src/db");
  const { syncRuns } = await import("../src/db/schema");
  const { desc } = await import("drizzle-orm");

  const rows = await db
    .select({
      startedAt: syncRuns.startedAt,
      status: syncRuns.status,
      errorCode: syncRuns.errorCode,
      fetched: syncRuns.fetchedCount,
    })
    .from(syncRuns)
    .orderBy(desc(syncRuns.startedAt))
    .limit(10);

  for (const row of rows) {
    console.log(
      row.startedAt.toISOString(),
      row.status,
      row.errorCode ?? "-",
      row.fetched ?? 0,
    );
  }

  process.exit(0);
}

void main();