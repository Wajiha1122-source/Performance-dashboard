import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { query } from "../config/db.js";
import { signUser } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional()
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.password_hash, r.name AS role, e.id AS employee_id, d.name AS department
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN employees e ON e.user_id = u.id
       LEFT JOIN departments d ON d.id = e.department_id OR d.head_user_id = u.id
       WHERE lower(u.email) = lower($1) AND u.is_active = true
       LIMIT 1`,
      [req.body.email]
    );

    const user = result.rows[0];
    const validPassword = user && await bcrypt.compare(req.body.password, user.password_hash);
    if (!user || !validPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    await query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      label: user.role === "DEPARTMENT_HEAD" ? "Department Head" : user.role === "EMPLOYEE" ? "Employee" : "CEO",
      department: user.department,
      employeeId: user.employee_id
    };

    return res.json({
      token: signUser(safeUser),
      user: safeUser,
      expiresIn: req.body.rememberMe ? "30d" : process.env.JWT_EXPIRES_IN || "8h"
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/password-reset/request", (req, res) => {
  return res.json({ message: "Password reset token structure ready. Connect email provider for delivery.", email: req.body.email });
});

export default router;
