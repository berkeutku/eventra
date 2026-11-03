import "dotenv/config";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../src/db";
import { userReports, users } from "../src/db/schema";

// Kullanım: npx tsx scripts/list-reports.ts
// Son 50 şikâyeti listeler. Şu an şikâyetleri incelemek için başka bir yer yok.

async function main() {
  const reporter = alias(users, "reporter");
  const reported = alias(users, "reported");

  const rows = await db
    .select({
      at: userReports.createdAt,
      status: userReports.status,
      reason: userReports.reason,
      details: userReports.details,
      reporter: reporter.name,
      reported: reported.name,
      rideId: userReports.rideId,
    })
    .from(userReports)
    .innerJoin(reporter, eq(userReports.reporterId, reporter.id))
    .innerJoin(reported, eq(userReports.reportedId, reported.id))
    .orderBy(desc(userReports.createdAt))
    .limit(50);

  if (rows.length === 0) {
    console.log("Kayıtlı şikâyet yok.");
    return;
  }

  for (const row of rows) {
    console.log(
      `${row.at.toISOString().slice(0, 16).replace("T", " ")} | ${row.status} | ${row.reason} | ${row.reporter} -> ${row.reported}` +
        (row.details ? ` | ${row.details}` : "") +
        (row.rideId ? ` | yolculuk ${row.rideId}` : ""),
    );
  }
}

main()
  .catch(() => {
    console.log("Şikâyetler okunamadı.");
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));