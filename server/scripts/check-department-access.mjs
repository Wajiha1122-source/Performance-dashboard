import dotenv from 'dotenv';
import assert from 'node:assert/strict';
dotenv.config({path:new URL('../../.env',import.meta.url)});
const {pool}=await import('../src/config/db.js');
const {default:app}=await import('../src/index.js');
const {signUser}=await import('../src/middleware/auth.js');
const server=app.listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
try {
 const {rows}=await pool.query(`SELECT u.id,u.email,u.name,r.name AS role,e.id AS employee_id FROM users u JOIN roles r ON r.id=u.role_id LEFT JOIN employees e ON e.user_id=u.id WHERE u.is_active=true`);
 for(const email of ['najum.ul.hassan@fjgroup.pk','bilal.riaz@fjgroup.pk','bilal.ejaz@fjgroup.pk','wajiha.azeem@fjgroup.pk','ceo@company.test']) {
  const user=rows.find(u=>u.email===email); assert.ok(user);
  const headers={Authorization:`Bearer ${signUser(user)}`};
  const base=`http://127.0.0.1:${server.address().port}/api/manage`;
  const response=await fetch(`${base}/bootstrap`,{headers}); assert.equal(response.status,200);
  const data=await response.json();
  const viewer=['najum.ul.hassan@fjgroup.pk','bilal.riaz@fjgroup.pk'].includes(email);
  if(viewer) {
   assert.deepEqual(data.viewDepartments.sort(),['DESIGN & ARCHITECTURE','FINANCE & INVENTORY','SALES']);
   assert.ok(data.employees.every(e=>data.viewDepartments.includes(e.department)));
   assert.ok(data.tasks.every(t=>data.employees.some(e=>e.id===t.employeeId)));
   assert.ok(Object.keys(data.comments).every(k=>k.startsWith(`${user.employee_id}:`)));
   assert.equal((await fetch(`${base}/comments`,{method:'POST',headers})).status,403);
  } else if(user.role==='CEO') assert.equal(data.employees.length,18);
  else {assert.deepEqual(data.viewDepartments,[]);assert.equal(data.employees.length,1);assert.equal(data.employees[0].id,user.employee_id);assert.ok(data.tasks.every(t=>t.employeeId===user.employee_id));}
  console.log(`PASS ${email}: ${data.employees.length} accessible employee profiles`);
 }
} finally {server.close();await pool.end();}
