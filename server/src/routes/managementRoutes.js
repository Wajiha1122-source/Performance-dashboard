import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { pool, query } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

import { scopeDashboard } from '../services/dashboardAccess.js';

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
const titles=['Procurement','Operations','Inventory','Development','Social Media','Sales','Internal Meeting','Ledgers','Accounts&Finance'];
const batchTaskSchema = z.object({ date: z.string().date().optional(), tasks: z.array(z.object({ title: z.enum(titles), description: z.string().trim().min(1).max(10000), media:z.object({name:z.string().min(1).max(180),data:z.string().max(2796204)}).optional() })).min(1).max(30) });
function taskMedia(file){
  if(!file)return null;
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(file.data))throw Error('Invalid attachment.');
  const bytes=Buffer.from(file.data,'base64');let mime;
  if(bytes.subarray(0,3).equals(Buffer.from([255,216,255])))mime='image/jpeg';
  else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))mime='image/png';
  else if(['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString()))mime='image/gif';
  else if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')mime='image/webp';
  else if(bytes.subarray(4,8).toString()==='ftyp'&&['isom','iso2','mp41','mp42','avc1','M4V '].includes(bytes.subarray(8,12).toString()))mime='video/mp4';
  else if(bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])))mime='video/webm';
  if(!mime||!bytes.length||bytes.length>2097152)throw Error('Use JPG, PNG, GIF, WebP, MP4 or WebM up to 2 MB per task.');
  return {bytes,mime,name:file.name.replace(/[\x00-\x1f\x7f/\\]/g,'_')};
}

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

async function loadDashboardData(session) {
  await query('SELECT sync_task_days()');
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
            COALESCE(t.description, '') AS description, td.status, COALESCE(t.reason, '') AS reason, t.priority,
            TO_CHAR(td.day, 'YYYY-MM-DD') AS "taskDate", TO_CHAR(t.task_date,'YYYY-MM-DD') AS "startDate",TO_CHAR(t.due_date,'YYYY-MM-DD') AS "endDate",
            t.completed_at AS "completedAt",assigner.name AS "assignedBy",t.created_at AS "createdAt",
            EXISTS(SELECT 1 FROM task_media m WHERE m.task_id=t.id) AS "hasMedia",
            (SELECT name FROM task_media m WHERE m.task_id=t.id) AS "mediaName",
            EXISTS(SELECT 1 FROM task_edits h WHERE h.task_id=t.id) AS "hasEdits"
     FROM tasks t
     JOIN task_days td ON td.task_id=t.id
     LEFT JOIN users assigner ON assigner.id=t.assigned_by
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
  const remarks = await query(`SELECT employee_id AS "employeeId", TO_CHAR(remark_date, 'YYYY-MM-DD') AS date, remark FROM ceo_remarks ORDER BY created_at DESC`);

  return scopeDashboard({
    departments: departments.rows,
    employees: employees.rows,
    tasks: tasks.rows,
    attendance: Object.fromEntries(attendance.rows.map((row) => [row.employeeId, row.status])),
    comments: Object.fromEntries(remarks.rows.map((row) => [`${row.employeeId}:${row.date}`, row.remark]))
  }, session);
}

router.get("/bootstrap", authenticate, async (req, res, next) => {
  try {
    return res.json(await loadDashboardData(req.user));
  } catch (error) {
    return next(error);
  }
});

router.post("/tasks/batch", authenticate, authorize("EMPLOYEE"), validate(batchTaskSchema), async (req, res, next) => {
  const client = await pool.connect();
  try {
    let media;try{media=req.body.tasks.map(t=>taskMedia(t.media));if(media.reduce((n,m)=>n+(m?.bytes.length||0),0)>10485760)throw Error('Attachments must total 10 MB or less per submission.')}catch(e){return res.status(400).json({message:e.message})}
    await client.query('BEGIN');
    const employee=await client.query('SELECT id,department_id FROM employees WHERE user_id=$1 AND is_active=true',[req.user.sub]);
    if(!employee.rows[0]){await client.query('ROLLBACK');return res.status(404).json({message:'Employee profile not found.'})}
    for(const [i,task] of req.body.tasks.entries()){
      const {rows}=await client.query('INSERT INTO tasks(employee_id,department_id,title,description,task_date,added_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[employee.rows[0].id,employee.rows[0].department_id,task.title,task.description,req.body.date||today(),req.user.sub]);
      if(media[i])await client.query('INSERT INTO task_media(task_id,name,mime,bytes) VALUES($1,$2,$3,$4)',[rows[0].id,media[i].name,media[i].mime,media[i].bytes]);
    }
    await client.query('COMMIT');return res.status(201).json({data:await loadDashboardData(req.user)});
  }
  catch (error) { await client.query("ROLLBACK"); return next(error); } finally { client.release(); }
});

router.patch("/tasks/priority", authenticate, authorize("EMPLOYEE"), async (req, res, next) => {
  try { const ids=Array.isArray(req.body.taskIds)?req.body.taskIds:[]; if(!ids.length||!["normal","medium","high"].includes(req.body.priority)) return res.status(400).json({message:"Select tasks and a valid priority."}); await query("UPDATE tasks t SET priority=$1,updated_at=NOW() FROM employees e WHERE t.employee_id=e.id AND e.user_id=$2 AND t.id=ANY($3::uuid[])",[req.body.priority,req.user.sub,ids]); return res.json({data:await loadDashboardData(req.user)}); } catch(error){return next(error);}
});

router.post("/comments", authenticate, authorize("CEO"), async (req,res,next)=>{try{if(!req.body.employeeId||!req.body.date||!String(req.body.remark||"").trim())return res.status(400).json({message:"Employee, date, and comment are required."});await query("INSERT INTO ceo_remarks (employee_id,ceo_user_id,remark,remark_date) VALUES ($1,$2,$3,$4) ON CONFLICT (employee_id,remark_date) DO UPDATE SET remark=EXCLUDED.remark,ceo_user_id=EXCLUDED.ceo_user_id,created_at=NOW()",[req.body.employeeId,req.user.sub,req.body.remark.trim(),req.body.date]);return res.json({data:await loadDashboardData(req.user)});}catch(error){return next(error);}});

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
    return res.status(201).json({ employeeId: employee.rows[0].id, user: user.rows[0], data: await loadDashboardData(req.user) });
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
    return res.json({ data: await loadDashboardData(req.user) });
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
    return res.status(201).json({ data: await loadDashboardData(req.user) });
  } catch (error) {
    return next(error);
  }
});

router.patch('/tasks/:id/complete',authenticate,authorize('EMPLOYEE'),async(req,res,next)=>{try{
  await query('SELECT sync_task_days()');
  const result=await query(`UPDATE tasks t SET status='DONE',updated_at=NOW() FROM employees e JOIN users u ON u.id=e.user_id
    WHERE t.employee_id=e.id AND e.user_id=$1 AND e.is_active=true AND u.is_active=true AND t.id=$2 AND t.task_date<=(NOW() AT TIME ZONE 'UTC')::date RETURNING t.id`,[req.user.sub,req.params.id]);
  if(!result.rowCount)return res.status(404).json({message:'Active task not found.'});
  return res.json({data:await loadDashboardData(req.user)});
}catch(e){next(e)}});
router.patch("/tasks/:id", authenticate, authorize("EMPLOYEE"), async (req, res, next) => {
  try {
    if(req.body.title!==undefined&&!titles.includes(req.body.title))return res.status(400).json({message:'Choose a task title from the list.'});
    if(req.body.description!==undefined&&(typeof req.body.description!=='string'||!req.body.description.trim()||req.body.description.length>10000))return res.status(400).json({message:'Enter a task description (up to 10,000 characters).'});
    const fields = [];
    const values = [];
    if(req.body.status!==undefined)return res.status(400).json({message:'Use the Complete button to finish a task. Started and Pending are automatic.'});
    if (typeof req.body.description === "string") {
      values.push(req.body.description);
      fields.push(`description = $${values.length}`);
    }
    if (typeof req.body.title === "string") { values.push(req.body.title); fields.push(`title = $${values.length}`); }
    if (typeof req.body.reason === "string") {
      values.push(req.body.reason);
      fields.push(`reason = $${values.length}`);
    }
    if (!fields.length) return res.status(400).json({ message: "No task fields provided." });
    values.push(req.params.id);
    values.push(req.user.sub);
    await query(`UPDATE tasks t SET ${fields.join(", ")}, updated_at = NOW() FROM employees e WHERE t.employee_id=e.id AND t.id = $${values.length - 1} AND e.user_id = $${values.length}`, values);
    return res.json({ data: await loadDashboardData(req.user) });
  } catch (error) {
    return next(error);
  }
});

router.delete('/tasks/:id',authenticate,(_req,res)=>res.status(403).json({message:'Submitted tasks cannot be deleted. You can edit them instead.'}));
router.get('/tasks/:id/media',authenticate,async(req,res,next)=>{try{
  const data=await loadDashboardData(req.user);
  if(!data.tasks.some(t=>t.id===req.params.id))return res.sendStatus(404);
  const {rows}=await query('SELECT name,mime,bytes FROM task_media WHERE task_id=$1',[req.params.id]);
  if(!rows[0])return res.sendStatus(404);
  res.set('Cache-Control','no-store').set('Content-Disposition','attachment').set('X-Content-Type-Options','nosniff').type(rows[0].mime).send(rows[0].bytes);
}catch(e){next(e)}});
router.get('/tasks/:id/history',authenticate,authorize('CEO'),async(req,res,next)=>{try{
  const {rows}=await query('SELECT edited_at AS "editedAt",before_data AS before,after_data AS after FROM task_edits WHERE task_id=$1 ORDER BY id',[req.params.id]);res.set('Cache-Control','no-store').json({history:rows});
}catch(e){next(e)}});

router.delete("/employees/:id", authenticate, authorize("DEPARTMENT_HEAD"), async (req, res, next) => {
  try {
    await query("UPDATE employees SET is_active = false WHERE id = $1", [req.params.id]);
    return res.json({ data: await loadDashboardData(req.user) });
  } catch (error) {
    return next(error);
  }
});

export default router;
