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
  const tasks = await pool.query(`
    SELECT t.id, t.description, t.task_date, t.priority
    FROM tasks t
    JOIN employees e ON e.id = t.employee_id
    JOIN users u ON u.id = e.user_id
    WHERE lower(u.email) = 'wajiha@company.test'
    ORDER BY t.task_date DESC, t.created_at DESC
  `);
  const remarks = await pool.query(`
    SELECT cr.id, cr.remark, cr.remark_date, e.id AS employee_id, u.email
    FROM ceo_remarks cr
    JOIN employees e ON e.id = cr.employee_id
    JOIN users u ON u.id = e.user_id
    WHERE lower(u.email) = 'wajiha@company.test'
    ORDER BY cr.remark_date DESC
  `);
  console.log(JSON.stringify({ tasks: tasks.rows, remarks: remarks.rows }, null, 2));
} finally {
  await pool.end();
}
