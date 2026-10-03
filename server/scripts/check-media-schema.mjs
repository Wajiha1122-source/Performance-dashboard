import dotenv from 'dotenv';
dotenv.config({path:new URL('../../.env',import.meta.url)});
const {pool}=await import('../src/config/db.js');
try {
 const {rows}=await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='private_messages' AND column_name LIKE 'media%'");
 console.log('Media columns:',rows.map(r=>r.column_name));
}finally{await pool.end()}
