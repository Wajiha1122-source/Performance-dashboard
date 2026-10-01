import dotenv from 'dotenv';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
dotenv.config({path:new URL('../../.env',import.meta.url)});
const {pool}=await import('../src/config/db.js');
const {default:app}=await import('../src/index.js');
const {signUser}=await import('../src/middleware/auth.js');
const ids=[];
const server=app.listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const url=process.env.MESSAGE_TEST_BASE || `http://127.0.0.1:${server.address().port}/api/messages`;
try{
  const dept=(await pool.query('SELECT id FROM departments LIMIT 1')).rows[0].id;
  for(const role of ['CEO','EMPLOYEE','EMPLOYEE']){
    const uid=randomUUID();ids.push(uid);
    await pool.query(`INSERT INTO users(id,role_id,name,email,password_hash) SELECT $1,id,'Messaging verification',$2,'disabled-test-login' FROM roles WHERE name=$3`,[uid,`${uid}@test.invalid`,role]);
    if(role==='EMPLOYEE')await pool.query(`INSERT INTO employees(user_id,employee_code,department_id,designation,joining_date,email) VALUES($1,$2,$3,'Verification',CURRENT_DATE,$4)`,[uid,`TEST-${uid.slice(0,8)}`,dept,`${uid}@test.invalid`]);
  }
  const tokens=ids.map((id,i)=>signUser({id,name:'Verification',email:`${id}@test.invalid`,role:i===0?'CEO':'EMPLOYEE'}));
  async function call(index,path,method='GET',body){
    const response=await fetch(url+path,{method,headers:{Authorization:`Bearer ${tokens[index]}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    return {status:response.status,data:await response.json().catch(()=>({}))};
  }
  const clientId=randomUUID();
  const sent=await call(1,`/${ids[0]}`,'POST',{clientId,body:'Private test'});assert.equal(sent.status,201);assert.ok(sent.data.message.id);
  assert.equal((await call(1,`/${ids[0]}`,'POST',{clientId,body:'Private test'})).status,201);
  const messages=await call(0,`/${ids[1]}`);assert.equal(messages.data.messages.length,1);
  assert.equal((await call(2,`/${ids[1]}`)).status,403);
  assert.equal((await call(2,`/${ids[0]}`)).data.messages.length,0);
  const reply=await call(0,`/${ids[1]}`,'POST',{clientId:randomUUID(),body:'CEO reply'});
  assert.equal(reply.status,201);
  const received=await call(1,`/${ids[0]}?after=${sent.data.message.id}`);
  assert.equal(received.data.messages.length,1);
  assert.equal(received.data.messages[0].body,'CEO reply');
  assert.equal(received.data.messages[0].recipientId,ids[1]);
  assert.equal((await call(1,`/${ids[2]}`,'POST',{clientId:randomUUID(),body:'Forbidden'})).status,403);
  let contacts=await call(0,'/contacts');assert.equal(contacts.data.contacts.find(c=>c.id===ids[1]).unread,1);
  assert.equal((await call(0,`/${ids[1]}/read`,'POST',{ids:[sent.data.message.id]})).status,200);
  contacts=await call(0,'/contacts');assert.equal(contacts.data.contacts.find(c=>c.id===ids[1]).unread,0);
  assert.equal((await call(1,`/${ids[0]}`,'POST',{clientId:randomUUID(),body:''})).status,400);
  assert.equal((await call(1,`/${ids[0]}`,'POST',{clientId:randomUUID(),audio:'aGVsbG8=',audioType:'audio/webm',duration:5})).status,400);
  const bytes=Buffer.from([0x1a,0x45,0xdf,0xa3,0x80]);
  const voice=await call(1,`/${ids[0]}`,'POST',{clientId:randomUUID(),audio:bytes.toString('base64'),audioType:'audio/webm',duration:1});assert.equal(voice.status,201);
  const audio=await fetch(`${url}/${ids[1]}/audio/${voice.data.message.id}`,{headers:{Authorization:`Bearer ${tokens[0]}`}});assert.equal(audio.status,200);assert.deepEqual(Buffer.from(await audio.arrayBuffer()),bytes);
  assert.equal((await fetch(`${url}/${ids[0]}/audio/${voice.data.message.id}`,{headers:{Authorization:`Bearer ${tokens[2]}`}})).status,404);
  await pool.query('UPDATE users SET is_active=false WHERE id=$1',[ids[1]]);
  assert.equal((await call(1,'/contacts')).status,403);
  console.log('PASS: two-way text delivery, new-message cursors, duplicate protection, unread counts, read receipts, voice byte storage/access, invalid payloads, inactive-account rejection.');
}finally{
  await pool.query('DELETE FROM employees WHERE user_id=ANY($1::uuid[])',[ids]);
  await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[ids]);
  await new Promise(resolve=>server.close(resolve));
  await pool.end();
}
