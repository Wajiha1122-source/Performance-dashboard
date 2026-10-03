import { query } from '../config/db.js';

export async function scopeDashboard(data, session) {
  const { rows } = await query(`SELECT u.id,r.name AS role,e.id AS employee_id,
    ARRAY(SELECT d.name FROM department_view_permissions p JOIN departments d ON d.id=p.department_id WHERE p.user_id=u.id) AS view_departments
    FROM users u JOIN roles r ON r.id=u.role_id LEFT JOIN employees e ON e.user_id=u.id AND e.is_active=true
    WHERE u.id=$1 AND u.is_active=true`,[session.sub]);
  const account=rows[0];
  if(!account) throw Object.assign(new Error('Account inactive.'),{status:401});
  if(account.role==='CEO') return {...data,viewDepartments:[]};
  const allowed=new Set(account.view_departments);
  if(account.role==='DEPARTMENT_HEAD') {
    const heads=await query('SELECT name FROM departments WHERE head_user_id=$1',[account.id]);
    heads.rows.forEach(d=>allowed.add(d.name));
  }
  const employees=data.employees.filter(e=>e.id===account.employee_id || allowed.has(e.department));
  const ids=new Set(employees.map(e=>e.id));
  const names=new Set(employees.map(e=>e.department));
  return {
    ...data,
    viewDepartments:[...allowed],
    departments:data.departments.filter(d=>names.has(d.name)),
    employees:employees.map(e=>e.id===account.employee_id?e:{...e,ceoRemark:''}),
    tasks:data.tasks.filter(t=>ids.has(t.employeeId)),
    attendance:Object.fromEntries(Object.entries(data.attendance).filter(([id])=>ids.has(id))),
    comments:Object.fromEntries(Object.entries(data.comments).filter(([key])=>key.startsWith(`${account.employee_id}:`))),
  };
}
