import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { pool, query } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const employeeSchema = z.object({
  name: z.string().min(2),
  employeeCode: z.string().min(2),
  department: z.string().min(2).optional(),
  designation: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  contactNumber: z.string().optional().default(""),
  joiningDate: z.string().optional()
});

const attendanceSchema = z.object({
  employeeId: z.string().uuid(),
  status: z.enum(["PRESENT", "ABSENT"]),
  date: z.string().date().optional()
});

const taskSchema = z.object({
  employeeId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().min(1),
  status: z.enum(["Done", "In Progress", "Not Done"]),
  reason: z.string().optional().default(""),
  date: z.string().date().optional()
});

const taskStatusMap = {
  Done: "DONE",
  "In Progress": "IN_PROGRESS",
  "Not Done": "NOT_DONE"
};

const reverseTaskStatusMap = {
  DONE: "Done",
  IN_PROGRESS: "In Progress",
  NOT_DONE: "Not Done"
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function loadDashboardData() {
  const departments = await query(
    `SELECT d.id, d.name, d.code, COALESCE(u.name, 'Department Head') AS head
     FROM departments d
     LEFT JOIN users u ON u.id = d.head_user_id
     ORDER BY d.name`
  );

  const employees = await query(
    `SELECT e.id, e.employee_code AS "employeeCode", u.name, d.name AS department, e.designation,
            e.email, COALESCE(a.status::text, 'PRESENT') AS attendance,
            COALESCE(cr.remark, 'No CEO remark yet.') AS "ceoRemark"
     FROM employees e
     JOIN users u ON u.id = e.user_id
     JOIN departments d ON d.id = e.department_id
     LEFT JOIN attendance a ON a.employee_id = e.id AND a.attendance_date = CURRENT_DATE
     LEFT JOIN LATERAL (
       SELECT remark FROM ceo_remarks WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1
     ) cr ON true
     WHERE e.is_active = true
     ORDER BY u.name`
  );

  const tasks = await query(
    `SELECT t.id, t.employee_id AS "employeeId", u.name AS owner, d.name AS department, t.title,
            COALESCE(t.description, '') AS description, t.status, COALESCE(t.reason, '') AS reason,
            t.task_date AS "taskDate", t.created_at AS "createdAt"
     FROM tasks t
     JOIN employees e ON e.id = t.employee_id
     JOIN users u ON u.id = e.user_id
     JOIN departments d ON d.id = t.department_id
     ORDER BY t.created_at DESC`
  );

  const attendance = await query(
    `SELECT employee_id AS "employeeId", status::text
     FROM attendance
     WHERE attendance_date = CURRENT_DATE`
  );

  return {
    departments: departments.rows,
    employees: employees.rows,
    tasks: tasks.rows.map((task) => ({ ...task, status: reverseTaskStatusMap[task.status] })),
    attendance: Object.fromEntries(attendance.rows.map((row) => [row.employeeId, row.status]))
  };
}

router.get("/bootstrap", authenticate, async (_req, res, next) => {
  try {
    return res.json(await loadDashboardData());
  } catch (error) {
    return next(error);
  }
});

router.post("/employees", authenticate, authorize("DEPARTMENT_HEAD"), validate(employeeSchema), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const role = await client.query("SELECT id FROM roles WHERE name = 'EMPLOYEE'");
    const department = await client.query(
      `SELECT id, name
       FROM departments
       WHERE head_user_id = $1 OR ($2::text IS NOT NULL AND name = $2)
       ORDER BY CASE WHEN head_user_id = $1 THEN 0 ELSE 1 END
       LIMIT 1`,
      [req.user.sub, req.body.department || null]
    );
    if (!department.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(422).json({ message: "This department head is not assigned to a department yet." });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await client.query(
      `INSERT INTO users (role_id, name, email, password_hash)
       VALUES ($1, $2, lower($3), $4)
       RETURNING id, name, email`,
      [role.rows[0].id, req.body.name, req.body.email, passwordHash]
    );

    const employee = await client.query(
      `INSERT INTO employees (user_id, employee_code, department_id, reporting_head_id, designation, joining_date, contact_number, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, lower($8))
       RETURNING id`,
      [
        user.rows[0].id,
        req.body.employeeCode,
        department.rows[0].id,
        req.user.sub,
        req.body.designation,
        req.body.joiningDate || today(),
        req.body.contactNumber,
        req.body.email
      ]
    );

    await client.query("COMMIT");
    return res.status(201).json({ employeeId: employee.rows[0].id, user: user.rows[0], data: await loadDashboardData() });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ message: "Employee ID or email already exists." });
    }
    return next(error);
  } finally {
    client.release();
  }
});

router.post("/attendance", authenticate, authorize("DEPARTMENT_HEAD"), validate(attendanceSchema), async (req, res, next) => {
  try {
    const attendanceDate = req.body.date || today();
    await query(
      `INSERT INTO attendance (employee_id, attendance_date, status, added_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (employee_id, attendance_date)
       DO UPDATE SET status = EXCLUDED.status, added_by = EXCLUDED.added_by`,
      [req.body.employeeId, attendanceDate, req.body.status, req.user.sub]
    );
    return res.json({ data: await loadDashboardData() });
  } catch (error) {
    return next(error);
  }
});

router.post("/tasks", authenticate, authorize("DEPARTMENT_HEAD"), validate(taskSchema), async (req, res, next) => {
  try {
    const attendanceDate = req.body.date || today();
    const employee = await query(
      `SELECT e.id, e.department_id, COALESCE(a.status::text, 'PRESENT') AS attendance
       FROM employees e
       LEFT JOIN attendance a ON a.employee_id = e.id AND a.attendance_date = $2
       WHERE e.id = $1`,
      [req.body.employeeId, attendanceDate]
    );
    if (!employee.rows[0]) return res.status(404).json({ message: "Employee not found." });
    if (employee.rows[0].attendance === "ABSENT") return res.status(422).json({ message: "Absent employees cannot receive tasks today." });

    await query(
      `INSERT INTO tasks (employee_id, department_id, title, description, status, reason, task_date, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [req.body.employeeId, employee.rows[0].department_id, req.body.title, req.body.description, taskStatusMap[req.body.status], req.body.reason, attendanceDate, req.user.sub]
    );
    return res.status(201).json({ data: await loadDashboardData() });
  } catch (error) {
    return next(error);
  }
});

router.patch("/tasks/:id", authenticate, authorize("DEPARTMENT_HEAD"), async (req, res, next) => {
  try {
    const fields = [];
    const values = [];
    if (req.body.status) {
      values.push(taskStatusMap[req.body.status] || req.body.status);
      fields.push(`status = $${values.length}`);
    }
    if (typeof req.body.description === "string") {
      values.push(req.body.description);
      fields.push(`description = $${values.length}`);
    }
    if (typeof req.body.reason === "string") {
      values.push(req.body.reason);
      fields.push(`reason = $${values.length}`);
    }
    if (!fields.length) return res.status(400).json({ message: "No task fields provided." });
    values.push(req.params.id);
    await query(`UPDATE tasks SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${values.length}`, values);
    return res.json({ data: await loadDashboardData() });
  } catch (error) {
    return next(error);
  }
});

router.delete("/employees/:id", authenticate, authorize("DEPARTMENT_HEAD"), async (req, res, next) => {
  try {
    await query("UPDATE employees SET is_active = false WHERE id = $1", [req.params.id]);
    return res.json({ data: await loadDashboardData() });
  } catch (error) {
    return next(error);
  }
});

export default router;
