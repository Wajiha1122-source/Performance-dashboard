import dotenv from 'dotenv';
import {readFile} from 'node:fs/promises';
dotenv.config({path:new URL('../../.env',import.meta.url)});
const {pool}=await import('../src/config/db.js');
try {await pool.query(await readFile(new URL('../database/migrate-task-evidence.sql',import.meta.url),'utf8'));console.log('Task attachments and future edit history enabled. Existing tasks preserved.')}finally{await pool.end()}
