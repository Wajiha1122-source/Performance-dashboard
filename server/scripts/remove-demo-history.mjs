import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: "../.env" });
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

try {
  const result = await pool.query(
    "DELETE FROM tasks WHERE lower(trim(description)) = lower($1) RETURNING id",
    ["1 video per day"],
  );
  console.log(`Removed ${result.rowCount} matching demo task(s).`);
} finally {
  await pool.end();
}
