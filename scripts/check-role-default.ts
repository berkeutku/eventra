import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const result = await pool.query(
    "select column_default from information_schema.columns where table_name = 'users' and column_name = 'role'",
  );
  console.log("users.role varsayılanı:", result.rows[0]?.column_default);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});