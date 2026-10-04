import {Router} from 'express';
import {z} from 'zod';
import {query} from '../config/db.js';
import {authenticate} from '../middleware/auth.js';
const router=Router();
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
router.use(authenticate);
router.use(wrap(async(req,res,next)=>{
 const {rows}=await query(`SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1 AND u.is_active=true
 AND (r.name='CEO' OR EXISTS(SELECT 1 FROM task_assigners a WHERE a.user_id=u.id))`,[req.user.sub]);
 if(!rows.length)return res.status(403).json({message:'You do not have task assignment access.'});next();
}));
router.get('/',wrap(async(req,res)=>{
 await query('SELECT sync_task_days()');
 const employees=await query(`SELECT e.id,u.name,e.designation,d.name AS department FROM employees e JOIN users u ON u.id=e.user_id JOIN departments d ON d.id=e.department_id WHERE e.is_active=true AND u.is_active=true ORDER BY u.name`);
 const tasks=await query(`SELECT t.id,t.title,t.description,u.name AS employee,d.name AS department,t.completion_note AS "completionNote",
 EXISTS(SELECT 1 FROM task_completion_media cm WHERE cm.task_id=t.id) AS "hasCompletionMedia",
 (SELECT name FROM task_completion_media cm WHERE cm.task_id=t.id) AS "completionMediaName",
 TO_CHAR(t.task_date,'YYYY-MM-DD') AS "startDate",TO_CHAR(t.due_date,'YYYY-MM-DD') AS "endDate",t.completed_at AS "completedAt",
 CASE WHEN t.completed_at IS NOT NULL THEN 'Complete' WHEN t.task_date>(NOW() AT TIME ZONE 'UTC')::date THEN 'Scheduled'
 WHEN NOW()>=GREATEST(t.created_at,t.task_date::timestamp AT TIME ZONE 'UTC')+interval '24 hours' THEN 'Pending' ELSE 'Started' END AS status
 FROM tasks t JOIN employees e ON e.id=t.employee_id JOIN users u ON u.id=e.user_id JOIN departments d ON d.id=e.department_id
 WHERE t.assigned_by=$1 ORDER BY t.created_at DESC`,[req.user.sub]);
 res.set('Cache-Control','no-store').json({employees:employees.rows,tasks:tasks.rows});
}));
const schema=z.object({employeeId:z.string().uuid(),clientId:z.string().uuid(),title:z.enum(['Procurement','Operations','Inventory','Development','Social Media','Sales','Internal Meeting','Ledgers','Accounts&Finance']),description:z.string().trim().min(1).max(10000),startDate:z.string().date(),endDate:z.string().date()});
router.post('/',wrap(async(req,res)=>{
 const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(422).json({message:'Choose an employee, title, description and valid start/end dates.'});
 const v=parsed.data,today=new Date().toISOString().slice(0,10);
 if(v.startDate<today||v.endDate<v.startDate)return res.status(422).json({message:'Start date must be today or later. End date must be on or after the start date.'});
 const {rows}=await query(`INSERT INTO tasks(employee_id,department_id,title,description,task_date,due_date,added_by,assigned_by,assignment_key,status)
 SELECT e.id,e.department_id,$2,$3,$4,$5,$6,$6,$7,'IN_PROGRESS' FROM employees e JOIN users u ON u.id=e.user_id WHERE e.id=$1 AND e.is_active=true AND u.is_active=true
 ON CONFLICT(assigned_by,assignment_key) WHERE assignment_key IS NOT NULL DO UPDATE SET assignment_key=EXCLUDED.assignment_key RETURNING id`,[v.employeeId,v.title,v.description,v.startDate,v.endDate,req.user.sub,v.clientId]);
 if(!rows.length)return res.status(404).json({message:'Active employee not found.'});
 res.status(201).json({id:rows[0].id});
}));
export default router;
