import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL tanımlı değil. .env dosyasını kontrol et.");
}

const globalForDb = globalThis as unknown as { eventraPool?: Pool };

function createPool(): Pool {
  const pool = new Pool({ connectionString, max: 5 });
  pool.on("error", (error) => {
    console.error("Veritabanı bağlantı hatası:", error.message);
  });
  return pool;
}

const pool = globalForDb.eventraPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.eventraPool = pool;
}

export const db = drizzle({ client: pool, schema });