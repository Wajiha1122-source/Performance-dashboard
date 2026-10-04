import dotenv from 'dotenv';import {readFile} from 'node:fs/promises';
dotenv.config({path:new URL('../../.env',import.meta.url)});
const {pool}=await import('../src/config/db.js');const c=await pool.connect();
try{
 await c.query('BEGIN');await c.query(await readFile(new URL('../database/migrate-completion-proof.sql',import.meta.url),'utf8'));
 await c.query(`CREATE TABLE IF NOT EXISTS legacy_task_repair_backup(task_id UUID PRIMARY KEY,task_before JSONB NOT NULL,days_before JSONB NOT NULL,backed_up_at TIMESTAMPTZ DEFAULT NOW())`);
 const targets=(await c.query(`SELECT id FROM tasks WHERE task_date<'2026-10-04' AND created_at<'2026-10-04T00:00:00Z' AND id NOT IN (SELECT task_id FROM legacy_task_repair_backup) FOR UPDATE`)).rows.map(t=>t.id);
 await c.query(`INSERT INTO legacy_task_repair_backup(task_id,task_before,days_before) SELECT t.id,to_jsonb(t),COALESCE((SELECT jsonb_agg(to_jsonb(d)) FROM task_days d WHERE d.task_id=t.id),'[]') FROM tasks t WHERE t.id=ANY($1::uuid[])`,[targets]);
 await c.query('ALTER TABLE tasks DISABLE TRIGGER task_completion');
 await c.query(`UPDATE tasks SET status='DONE',completed_at=(task_date::timestamp AT TIME ZONE 'UTC')+interval '23 hours 59 minutes 59 seconds' WHERE id=ANY($1::uuid[])`,[targets]);
 await c.query('ALTER TABLE tasks ENABLE TRIGGER task_completion');
 const removed=await c.query('DELETE FROM task_days d USING tasks t WHERE d.task_id=t.id AND t.id=ANY($1::uuid[]) AND d.day>t.task_date',[targets]);
 await c.query('SELECT sync_task_days()');await c.query('COMMIT');
 console.log(JSON.stringify({historicalTasksCompleted:targets.length,generatedCarryForwardRowsRemoved:removed.rowCount,cutoff:'2026-10-04',backup:'legacy_task_repair_backup',todayTasksPreserved:true}));
}catch(e){await c.query('ROLLBACK');throw e}finally{c.release();await pool.end()}
