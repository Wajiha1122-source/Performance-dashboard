import dotenv from 'dotenv';
import { readFile } from 'node:fs/promises';
dotenv.config({path:new URL('../../.env',import.meta.url)});
const {pool} = await import('../src/config/db.js');
try {
  await pool.query(await readFile(new URL('../database/migrate-messages.sql',import.meta.url),'utf8'));
  console.log('Private messaging migration applied.');
} finally { await pool.end(); }
