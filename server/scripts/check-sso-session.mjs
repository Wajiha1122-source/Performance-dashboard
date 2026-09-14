import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
const { default: app } = await import("../src/index.js");
const { pool, query } = await import("../src/config/db.js");
const { signUser } = await import("../src/middleware/auth.js");
const server = app.listen(0, "127.0.0.1");
await new Promise(resolve => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  const { rows } = await query("SELECT u.id, u.name, u.email, r.name AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='CEO' AND u.is_active=true LIMIT 1");
  if (!rows[0]) throw new Error("No active CEO available for verification");
  const token = signUser(rows[0]);
  const session = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  const payload = await session.json();
  if (session.status !== 200 || payload.user?.id !== rows[0].id || payload.user?.role !== "CEO") throw new Error("CEO session resolution failed");
  const bootstrap = await fetch(`${base}/api/manage/bootstrap`, { headers: { Authorization: `Bearer ${token}` } });
  if (bootstrap.status !== 200) throw new Error("Dashboard bootstrap failed");
  const invalid = await fetch(`${base}/api/auth/me`, { headers: { Authorization: "Bearer invalid-token" } });
  if (invalid.status !== 401) throw new Error("Invalid token was not rejected");
  console.log("PASS: CEO session verified, dashboard loads, invalid token rejected.");
} finally {
  await new Promise(resolve => server.close(resolve));
  await pool.end();
}
