import dotenv from 'dotenv';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
dotenv.config({path:new URL('../../.env',import.meta.url)});
const {pool}=await import('../src/config/db.js');
const {default:app}=await import('../src/index.js');
const {signUser}=await import('../src/middleware/auth.js');
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const users=[],employees=[];const base=`http://127.0.0.1:${server.address().port}/api`;
try{
 const dept=(await pool.query('SELECT id FROM departments LIMIT 1')).rows[0].id;
 for(const role of ['CEO','EMPLOYEE','EMPLOYEE','EMPLOYEE']){
  const id=randomUUID();users.push({id,role});
  await pool.query(`INSERT INTO users(id,role_id,name,email,password_hash) SELECT $1,id,'Workflow test',$2,'disabled-test-login' FROM roles WHERE name=$3`,[id,`${id}@test.invalid`,role]);
  if(role==='EMPLOYEE')employees.push((await pool.query(`INSERT INTO employees(user_id,employee_code,department_id,designation,joining_date,email) VALUES($1,$2,$3,'Test',CURRENT_DATE,$4) RETURNING id`,[id,`WF-${id.slice(0,8)}`,dept,`${id}@test.invalid`])).rows[0].id);
 }
 await pool.query('INSERT INTO task_assigners(user_id) VALUES($1)',[users[1].id]);
 const tokens=users.map(signUser);
 async function call(actor,path,method='GET',body){const r=await fetch(base+path,{method,headers:{Authorization:`Bearer ${tokens[actor]}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
 const today=new Date().toISOString().slice(0,10),tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
 const form={employeeId:employees[1],clientId:randomUUID(),title:'Operations',description:'Assigned test',startDate:today,endDate:tomorrow};
 assert.equal((await call(2,'/assignments')).status,403);
 assert.equal((await call(2,'/assignments','POST',form)).status,403);
 assert.equal((await call(1,'/assignments')).status,200);
 assert.equal((await call(0,'/assignments')).status,200);
 assert.equal((await call(1,'/assignments','POST',{...form,endDate:'2000-01-01'})).status,422);
 const assigned=await call(1,'/assignments','POST',form);assert.equal(assigned.status,201);
 const id=assigned.data.id;
 assert.equal((await call(1,'/assignments','POST',form)).data.id,id);
 let dashboard=await call(2,'/manage/bootstrap');assert.equal(dashboard.data.tasks.find(t=>t.id===id).status,'Started');
 assert.ok(!(await call(3,'/manage/bootstrap')).data.tasks.some(t=>t.id===id));
 const scheduled=await call(0,'/assignments','POST',{...form,clientId:randomUUID(),startDate:tomorrow});assert.equal(scheduled.status,201);
 assert.ok(!(await call(2,'/manage/bootstrap')).data.tasks.some(t=>t.id===scheduled.data.id));
 assert.equal((await call(2,`/manage/tasks/${scheduled.data.id}/complete`,'PATCH')).status,404);
 assert.equal((await call(3,`/manage/tasks/${id}/complete`,'PATCH')).status,404);
 // Move only the disposable test task into the past to verify repeated carry-forward.
 await pool.query(`UPDATE tasks SET task_date=((NOW() AT TIME ZONE 'UTC')::date-3),due_date=((NOW() AT TIME ZONE 'UTC')::date-1),created_at=NOW()-interval '73 hours' WHERE id=$1`,[id]);
 dashboard=await call(2,'/manage/bootstrap');let days=dashboard.data.tasks.filter(t=>t.id===id);assert.equal(days.length,4);assert.ok(days.every(t=>t.status==='Pending'));
 assert.equal((await call(1,'/assignments')).data.tasks.find(t=>t.id===id).status,'Pending');
 assert.equal((await call(2,`/manage/tasks/${id}/complete`,'PATCH')).status,422);
 const proof=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 assert.equal((await call(2,`/manage/tasks/${id}/complete`,'PATCH',{note:'Completed the work and verified the outcome.',media:{name:'proof.png',data:proof.toString('base64')}})).status,200);
 const report=(await call(1,'/assignments')).data.tasks.find(t=>t.id===id);assert.equal(report.completionNote,'Completed the work and verified the outcome.');assert.equal(report.hasCompletionMedia,true);
 for(const actor of [0,1,2]){const r=await fetch(`${base}/manage/tasks/${id}/completion-media`,{headers:{Authorization:`Bearer ${tokens[actor]}`}});assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),proof)}
 assert.equal((await fetch(`${base}/manage/tasks/${id}/completion-media`,{headers:{Authorization:`Bearer ${tokens[3]}`}})).status,404);
 dashboard=await call(2,'/manage/bootstrap');days=dashboard.data.tasks.filter(t=>t.id===id);
 assert.equal(days.find(t=>t.taskDate===today).status,'Complete');assert.ok(days.filter(t=>t.taskDate!==today).every(t=>t.status==='Pending'));
 assert.equal((await call(1,'/assignments')).data.tasks.find(t=>t.id===id).status,'Complete');
 assert.equal((await call(2,`/manage/tasks/${id}/complete`,'PATCH')).status,200);
 assert.equal((await pool.query('SELECT count(*)::int AS n FROM task_days WHERE task_id=$1',[id])).rows[0].n,4);
 const own=await call(2,'/manage/tasks/batch','POST',{tasks:[{title:'Development',description:'Self task'}]});assert.equal(own.status,201);const ownTask=own.data.data.tasks.find(t=>t.description==='Self task');assert.equal(ownTask.status,'Started');
 await pool.query(`UPDATE tasks SET created_at=NOW()-interval '23 hours',task_date=((NOW()-interval '23 hours') AT TIME ZONE 'UTC')::date WHERE id=$1`,[ownTask.id]);
 assert.equal((await call(2,'/manage/bootstrap')).data.tasks.find(t=>t.id===ownTask.id&&t.taskDate===today).status,'Started');
 await pool.query(`UPDATE tasks SET created_at=NOW()-interval '25 hours',task_date=((NOW()-interval '25 hours') AT TIME ZONE 'UTC')::date WHERE id=$1`,[ownTask.id]);
 assert.equal((await call(2,'/manage/bootstrap')).data.tasks.find(t=>t.id===ownTask.id&&t.taskDate===today).status,'Pending');
 const finished=(await pool.query(`INSERT INTO tasks(employee_id,department_id,title,description,task_date,status,completed_at) VALUES($1,$2,'Operations','Finished yesterday',(NOW() AT TIME ZONE 'UTC')::date-3,'DONE',NOW()-interval '24 hours') RETURNING id`,[employees[1],dept])).rows[0].id;
 const afterCompletion=(await call(2,'/manage/bootstrap')).data.tasks.filter(t=>t.id===finished);
 assert.ok(afterCompletion.length>0);assert.ok(afterCompletion.every(t=>t.taskDate<today));assert.ok(afterCompletion.some(t=>t.status==='Complete'));
 const grants=(await pool.query(`SELECT u.email FROM task_assigners a JOIN users u ON u.id=a.user_id WHERE u.email IN ('najum.ul.hassan@fjgroup.pk','bilal.riaz@fjgroup.pk')`)).rows;assert.equal(grants.length,2);
 console.log('PASS: assignment permissions, all-employee selection, retries, future scheduling, owner-only completion, 23/25-hour threshold, daily carry-forward, historical Pending preserved, assigner status tracking and no duplicate daily records.');
}finally{
 await pool.query('DELETE FROM employees WHERE user_id=ANY($1::uuid[])',[users.map(u=>u.id)]);
 await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[users.map(u=>u.id)]);
 await new Promise(r=>server.close(r));await pool.end();
}
