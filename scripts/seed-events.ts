import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { events as eventsTable } from "../src/db/schema";
import { events } from "../src/data/events";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error("DATABASE_URL bulunamadı. .env dosyasını kontrol et.");
    process.exitCode = 1;
    return;
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool });

  try {
    for (const event of events) {
      const values = {
        title: event.title,
        category: event.category,
        city: event.city,
        venue: event.venue,
        startsAt: new Date(event.startsAt),
        description: event.description,
      };

      await db
        .insert(eventsTable)
        .values({ id: event.id, ...values })
        .onConflictDoUpdate({ target: eventsTable.id, set: values });
    }

    console.log(`${events.length} etkinlik veritabanına yazıldı.`);
  } catch (error) {
    console.error(
      "Etkinlikler yazılamadı:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();