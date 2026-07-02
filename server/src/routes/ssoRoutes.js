import jwt from "jsonwebtoken";
import { Router } from "express";
import { query } from "../config/db.js";
import { signUser } from "../middleware/auth.js";

const router = Router();

const EXPECTED_MASTER_USER = "chmfj@live.com";
const EXPECTED_MASTER_ROLE = "ceo";
const DEFAULT_CLIENT_ORIGIN = "http://localhost:5173";

function safeSsoError(res, status, detail) {
  return res.status(status).type("text/plain").send(`SSO login failed: ${detail}.`);
}

function buildRedirectUrl(appToken) {
  const clientOrigin = process.env.CLIENT_ORIGIN || process.env.CLIENT_URL || DEFAULT_CLIENT_ORIGIN;
  // Change SSO_REDIRECT_PATH in the environment to send CEO/admin users to another frontend path.
  const redirectPath = process.env.SSO_REDIRECT_PATH || "/sso-complete";
  const normalizedPath = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;

  return `${clientOrigin}${normalizedPath}#ssoToken=${encodeURIComponent(appToken)}`;
}

function toBase64Url(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function buildSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    label: user.role === "DEPARTMENT_HEAD" ? "Department Head" : user.role === "EMPLOYEE" ? "Employee" : "CEO",
    department: user.department,
    employeeId: user.employee_id
  };
}

router.get("/sso-login", async (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token || typeof token !== "string") {
      return safeSsoError(res, 400, "token is required");
    }

    // Change SSO_SECRET in the environment to rotate the shared Master Dashboard secret.
    const ssoSecret = process.env.SSO_SECRET;
    if (!ssoSecret) {
      return safeSsoError(res, 500, "missing SSO_SECRET");
    }

    let payload;
    try {
      payload = jwt.verify(token, ssoSecret);
    } catch {
      return safeSsoError(res, 401, "invalid or expired token");
    }

    if (!payload?.exp) {
      return safeSsoError(res, 401, "invalid or expired token");
    }

    if (payload.masterUser !== EXPECTED_MASTER_USER) {
      return safeSsoError(res, 403, "user mismatch");
    }

    if (payload.role !== EXPECTED_MASTER_ROLE) {
      return safeSsoError(res, 403, "role mismatch");
    }

    // Change SSO_APP_NAME in the environment to match the Master Dashboard "app" claim exactly.
    const appName = process.env.SSO_APP_NAME;
    if (!appName || payload.app !== appName) {
      return safeSsoError(res, 403, "app mismatch");
    }

    // Change SSO_LOCAL_CEO_USERNAME in the environment to map the Master Dashboard user to another local CEO/admin account.
    const localCeoUsername = process.env.SSO_LOCAL_CEO_USERNAME;
    if (!localCeoUsername) {
      return safeSsoError(res, 500, "missing mapped local user");
    }

    const result = await query(
      `SELECT u.id, u.name, u.email, r.name AS role, e.id AS employee_id, d.name AS department
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN employees e ON e.user_id = u.id
       LEFT JOIN departments d ON d.id = e.department_id OR d.head_user_id = u.id
       WHERE lower(u.email) = lower($1) AND u.is_active = true AND r.name = 'CEO'
       LIMIT 1`,
      [localCeoUsername]
    );

    const user = result.rows[0];
    if (!user) {
      return safeSsoError(res, 403, "mapped local user not found or inactive");
    }

    await query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);
    const safeUser = buildSafeUser(user);
    const appToken = signUser(safeUser);
    const redirectUrl = `${buildRedirectUrl(appToken)}&ssoUser=${toBase64Url(safeUser)}`;

    return res.redirect(302, redirectUrl);
  } catch (error) {
    return next(error);
  }
});

export default router;
