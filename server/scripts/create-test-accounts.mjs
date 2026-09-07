import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcryptjs";

dotenv.config({ path: "../.env" });
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined
});
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const role = (await client.query("SELECT id FROM roles WHERE name = 'EMPLOYEE'")).rows[0];
  const department = (await client.query("SELECT id FROM departments WHERE name = 'IT Department'")).rows[0];
  if (!role || !department) throw new Error("EMPLOYEE role or IT Department is missing.");
  let user = (await client.query("SELECT id FROM users WHERE lower(email) IN ('wajiha@company.test', 'ithead@company.test') LIMIT 1")).rows[0];
  if (user) {
    await client.query("UPDATE users SET role_id=$1, name='Wajiha Azeem', email='wajiha@company.test', password_hash=$2, is_active=true, updated_at=NOW() WHERE id=$3", [role.id, passwordHash, user.id]);
  } else {
    user = (await client.query("INSERT INTO users (role_id,name,email,password_hash) VALUES ($1,'Wajiha Azeem','wajiha@company.test',$2) RETURNING id", [role.id, passwordHash])).rows[0];
  }
  const employee = (await client.query("SELECT id FROM employees WHERE user_id=$1", [user.id])).rows[0];
  if (employee) {
    await client.query("UPDATE employees SET employee_code='EMP-IT-001', department_id=$1, designation='HOD-IT', email='wajiha@company.test', is_active=true, updated_at=NOW() WHERE id=$2", [department.id, employee.id]);
  } else {
    await client.query("INSERT INTO employees (user_id,employee_code,department_id,designation,joining_date,email) VALUES ($1,'EMP-IT-001',$2,'HOD-IT',CURRENT_DATE,'wajiha@company.test')", [user.id, department.id]);
  }
  await client.query("COMMIT");
  const result = await client.query("SELECT u.email, r.name AS role, e.designation, e.employee_code FROM users u JOIN roles r ON r.id=u.role_id LEFT JOIN employees e ON e.user_id=u.id WHERE u.email IN ('ceo@company.test','wajiha@company.test') ORDER BY u.email");
  console.log(JSON.stringify(result.rows));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
