import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/db";

// Yalnızca sayı yazdırır, kimlik ya da ad yazdırmaz.
async function count(query: ReturnType<typeof sql>): Promise<number> {
  const result = await db.execute(query);
  return (result.rows[0] as { n: number }).n;
}

async function main() {
  const drivers = await count(sql`
    select count(*)::int as n from rides r join events e on e.id = r.event_id
    where e.source = 'demo' and not exists (
      select 1 from ticket_verifications t where t.user_id = r.driver_id and t.event_id = r.event_id)`);

  const passengers = await count(sql`
    select count(*)::int as n from ride_passengers p
    join rides r on r.id = p.ride_id join events e on e.id = r.event_id
    where e.source = 'demo' and not exists (
      select 1 from ticket_verifications t where t.user_id = p.user_id and t.event_id = r.event_id)`);

  const realRides = await count(sql`
    select count(*)::int as n from rides r join events e on e.id = r.event_id
    where e.source = 'biletimgo'`);

  console.log(`Bileti doğrulanmamış sürücülü yolculuk : ${drivers}`);
  console.log(`Bileti doğrulanmamış yolcu katılımı    : ${passengers}`);
  console.log(`Gerçek etkinliklerdeki yolculuk        : ${realRides}`);
}

main()
  .catch(() => {
    console.log("Sayılar okunamadı.");
    process.exitCode = 1;
  })
  .finally(() => process.exit(process.exitCode ?? 0));