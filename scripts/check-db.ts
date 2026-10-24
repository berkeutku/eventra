import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error("DATABASE_URL bulunamadı. .env dosyasını kontrol et.");
    process.exitCode = 1;
    return;
  }

  const pool = new Pool({ connectionString: url });

  try {
    const result = await pool.query(
      "select now() as simdi, current_database() as veritabani",
    );
    console.log("Bağlantı başarılı:", result.rows[0]);
  } catch (error) {
    console.error(
      "Bağlantı başarısız:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();