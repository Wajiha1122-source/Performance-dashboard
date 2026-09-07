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
  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE task_priority AS ENUM ('normal', 'medium', 'high');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS priority task_priority NOT NULL DEFAULT 'normal';

    ALTER TABLE ceo_remarks
      ADD COLUMN IF NOT EXISTS remark_date DATE NOT NULL DEFAULT CURRENT_DATE;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_ceo_remark_employee_date
      ON ceo_remarks(employee_id, remark_date);
  `);

  const result = await pool.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE (table_name = 'tasks' AND column_name = 'priority')
       OR (table_name = 'ceo_remarks' AND column_name = 'remark_date')
    ORDER BY table_name
  `);
  console.log(JSON.stringify(result.rows));
} finally {
  await pool.end();
}
