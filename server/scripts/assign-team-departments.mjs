import dotenv from "dotenv";
import pg from "pg";
dotenv.config({ path: "../.env" });
const groups = [
  ["SALES", "TEAM-SALES", ["najum.ul.hassan", "bilal.riaz"]],
  ["FINANCE & INVENTORY", "TEAM-FINANCE", ["kashif.abbas", "kashmala", "eman", "kainat", "mahnoor", "yaseen"]],
  ["DESIGN & ARCHITECTURE", "TEAM-DESIGN", ["waqas"]],
  ["IT", "TEAM-IT", ["wajiha.azeem", "basil.imran", "tahir.ali"]],
];
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const result = [];
  for (const [name, code, handles] of groups) {
    const department = (await client.query(`INSERT INTO departments(name,code) VALUES($1,$2)
      ON CONFLICT(name) DO UPDATE SET is_active=true RETURNING id`, [name, code])).rows[0];
    for (const handle of handles) {
      const updated = await client.query(`UPDATE employees e SET department_id=$1, updated_at=NOW()
        FROM users u JOIN roles r ON r.id=u.role_id
        WHERE e.user_id=u.id AND lower(u.email)=$2 AND e.is_active=true AND r.name='EMPLOYEE'
        RETURNING u.name, e.designation`, [department.id, `${handle}@fjgroup.pk`]);
      if (updated.rowCount !== 1) throw new Error(`Expected one employee for ${handle}; rolling back all assignments.`);
      result.push({ ...updated.rows[0], department: name });
    }
  }
  await client.query("COMMIT");
  console.log(JSON.stringify(result, null, 2));
} catch(error) {
  await client.query("ROLLBACK");
  throw error;
} finally { client.release(); await pool.end(); }
