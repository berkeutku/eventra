import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { events } from "../src/db/schema";

// "Yola çıktım" akışını canlıda denemek için yakın saatli bir test etkinliği ekler.
//   npx tsx scripts/test-event.ts            -> etkinliği ekler/yeniler (1,5 saat sonra başlar)
//   npx tsx scripts/test-event.ts --expire   -> etkinliğin tarihini geçmişe alır, listelerden kalkar
//
// Not: Yolculuk, bilet doğrulaması ve talep kayıtları etkinliğe bağlı olduğu için
// içinde yolculuk olan etkinlik silinemez. Bu yüzden temizlik "tarihi geçir" ile yapılır.

const EVENT_ID = "test-yola-ciktim";
const HOUR = 3_600_000;

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error("DATABASE_URL bulunamadı. .env dosyasını kontrol et.");
    process.exitCode = 1;
    return;
  }

  const expire = process.argv.includes("--expire");
  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool });

  try {
    if (expire) {
      const past = new Date("2020-01-01T10:00:00Z");

      await db
        .insert(events)
        .values({
          id: EVENT_ID,
          title: "[TEST] Yola Çıktım Denemesi",
          category: "other",
          city: "Tarsus",
          cityKey: "tarsus",
          venue: "Eventra Test Alanı",
          startsAt: past,
          endsAt: new Date(past.getTime() + 3 * HOUR),
          description: "Süresi dolmuş test etkinliği.",
        })
        .onConflictDoUpdate({
          target: events.id,
          set: {
            startsAt: past,
            endsAt: new Date(past.getTime() + 3 * HOUR),
          },
        });

      console.log("Test etkinliğinin tarihi geçmişe alındı, listelerden kalktı.");
      return;
    }

    const startsAt = new Date(Date.now() + 1.5 * HOUR);
    const endsAt = new Date(startsAt.getTime() + 3 * HOUR);
    const values = {
      title: "[TEST] Yola Çıktım Denemesi",
      category: "other" as const,
      city: "Tarsus",
      cityKey: "tarsus",
      venue: "Eventra Test Alanı",
      startsAt,
      endsAt,
      description:
        "Bu bir test etkinliğidir, gerçek bir etkinlik değildir. Yolculuk günü akışını (yola çıktım, vardım, paylaşım bağlantısı, puanlama) denemek için eklendi.",
    };

    await db
      .insert(events)
      .values({ id: EVENT_ID, ...values })
      .onConflictDoUpdate({ target: events.id, set: values });

    console.log("Test etkinliği hazır.");
    console.log(`Başlangıç: ${startsAt.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`);
    console.log(`Adres:     /events/${EVENT_ID}`);
    console.log("İşin bitince: npx tsx scripts/test-event.ts --expire");
  } catch (error) {
    console.error(
      "Test etkinliği yazılamadı:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
