import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = Router();
const uuid = z.string().uuid();
const id = z.string().regex(/^\d+$/);
const metadata = `id::text, sender_id AS "senderId", recipient_id AS "recipientId", body,
 audio IS NOT NULL AS "hasAudio", media IS NOT NULL AS "hasMedia", media_type AS "mediaType", media_name AS "mediaName", duration_seconds AS duration, created_at AS "createdAt", read_at AS "readAt"`;
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
router.use(rateLimit({windowMs:60000,limit:2000}));
router.use(authenticate);
router.use(rateLimit({windowMs:60000,limit:180,keyGenerator:req=>req.user.sub,
  message:{message:'Too many chat requests. Please wait a moment.'}}));
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next()});
router.use(wrap(async(req,res,next) => {
  const {rows} = await query(`SELECT u.id,r.name AS role FROM users u JOIN roles r ON r.id=u.role_id
    WHERE u.id=$1 AND u.is_active=true AND (r.name='CEO' OR (r.name='EMPLOYEE' AND EXISTS
    (SELECT 1 FROM employees e WHERE e.user_id=u.id AND e.is_active=true)))`,[req.user.sub]);
  if (!rows[0]) return res.status(403).json({message:'Messaging access is unavailable for this account.'});
  req.chatUser=rows[0]; next();
}));
router.get('/contacts',wrap(async(req,res) => {
  const {rows} = await query(`SELECT u.id,u.name,e.designation,d.name AS department,
    (SELECT count(*)::int FROM private_messages m WHERE m.sender_id=u.id AND m.recipient_id=$1 AND m.read_at IS NULL) AS unread
    FROM users u JOIN roles r ON r.id=u.role_id LEFT JOIN employees e ON e.user_id=u.id
    LEFT JOIN departments d ON d.id=e.department_id WHERE u.is_active=true AND
    u.id<>$1 AND (r.name='CEO' OR (r.name='EMPLOYEE' AND e.is_active=true))
    ORDER BY d.name NULLS FIRST,u.name`,[req.chatUser.id]);
  res.json({contacts:rows});
}));
router.param('peer', (req,res,next,peer) => {
  if (!uuid.safeParse(peer).success) return res.status(400).json({message:'Invalid conversation.'});
  next();
});
router.use('/:peer',wrap(async(req,res,next) => {
  const {rows} = await query(`SELECT u.id,r.name AS role FROM users u JOIN roles r ON r.id=u.role_id
    WHERE u.id=$1 AND u.is_active=true AND (r.name='CEO' OR (r.name='EMPLOYEE' AND EXISTS
    (SELECT 1 FROM employees e WHERE e.user_id=u.id AND e.is_active=true)))`,[req.params.peer]);
  if (!rows[0] || rows[0].id === req.chatUser.id || !['CEO','EMPLOYEE'].includes(rows[0].role))
    return res.status(403).json({message:'This conversation is not available.'});
  next();
}));
router.get('/:peer',wrap(async(req,res) => {
  const before=req.query.before, after=req.query.after;
  if ((before && !id.safeParse(before).success) || (after && !id.safeParse(after).success)) return res.status(400).json({message:'Invalid message cursor.'});
  const {rows}=await query(`SELECT ${metadata} FROM private_messages WHERE
    ((sender_id=$1 AND recipient_id=$2) OR (sender_id=$2 AND recipient_id=$1))
    AND ($3::bigint IS NULL OR id<$3) AND ($4::bigint IS NULL OR id>$4)
    ORDER BY id ${after?'ASC':'DESC'} LIMIT 50`,[req.chatUser.id,req.params.peer,before||null,after||null]);
  res.json({messages:after?rows:rows.reverse(),hasMore:rows.length===50});
}));
router.post('/:peer/read',express.json(),wrap(async(req,res) => {
  const parsed=z.object({ids:z.array(id).max(100)}).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({message:'Invalid read receipt.'});
  await query('UPDATE private_messages SET read_at=NOW() WHERE sender_id=$1 AND recipient_id=$2 AND id=ANY($3::bigint[]) AND read_at IS NULL',[req.params.peer,req.chatUser.id,parsed.data.ids]);
  res.json({ok:true});
}));
router.post('/:peer',rateLimit({windowMs:60000,limit:20,keyGenerator:req=>req.user.sub}),express.json({limit:'3mb'}),wrap(async(req,res) => {
  const parsed=z.object({clientId:uuid,body:z.string().trim().max(4000).default(''),audio:z.string().max(2796204).optional(),audioType:z.enum(['audio/webm','audio/ogg','audio/mp4']).optional(),duration:z.number().int().min(1).max(120).optional()}).safeParse(req.body);
  if(!parsed.success) return res.status(400).json({message:'Check your message or voice-note size.'});
  const data=parsed.data;
  let bytes=null;
  if(data.audio){
    if(!data.audioType || !data.duration || !/^[A-Za-z0-9+/]+={0,2}$/.test(data.audio)) return res.status(400).json({message:'Invalid voice note.'});
    bytes=Buffer.from(data.audio,'base64');
    if(!bytes.length || bytes.length>2097152) return res.status(400).json({message:'Voice notes must be under 2 MB.'});
    const valid=data.audioType==='audio/webm'?bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])):data.audioType==='audio/ogg'?bytes.subarray(0,4).toString()==='OggS':bytes.subarray(4,8).toString()==='ftyp';
    if(!valid) return res.status(400).json({message:'Unsupported audio file.'});
  }
  if(!data.body && !bytes) return res.status(400).json({message:'Enter a message or record a voice note.'});
  const {rows}=await query(`INSERT INTO private_messages(sender_id,recipient_id,client_id,body,audio,audio_type,duration_seconds)
    VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(sender_id,client_id) DO NOTHING RETURNING ${metadata}`,
    [req.chatUser.id,req.params.peer,data.clientId,data.body,bytes,bytes?data.audioType:null,bytes?data.duration:null]);
  res.status(201).json({message:rows[0]||null});
}));
router.post('/:peer/media',rateLimit({windowMs:60000,limit:10,keyGenerator:req=>req.user.sub}),express.raw({type:()=>true,limit:'10mb'}),wrap(async(req,res)=>{
  const clientId=req.get('X-Client-Id');
  let name;try{name=decodeURIComponent(req.get('X-File-Name')||'')}catch{return res.status(400).json({message:'Invalid filename.'})}
  name=name.replace(/[\x00-\x1f\x7f/\\]/g,'_').slice(0,180).trim();
  const bytes=req.body;
  if(!uuid.safeParse(clientId).success||!name||!Buffer.isBuffer(bytes)||!bytes.length)return res.status(400).json({message:'Choose a photo or video to send.'});
  let type;
  if(bytes.subarray(0,3).equals(Buffer.from([255,216,255])))type='image/jpeg';
  else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))type='image/png';
  else if(['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString()))type='image/gif';
  else if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')type='image/webp';
  else if(bytes.subarray(4,8).toString()==='ftyp'&&['isom','iso2','mp41','mp42','avc1','M4V '].includes(bytes.subarray(8,12).toString()))type='video/mp4';
  else if(bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])))type='video/webm';
  if(!type)return res.status(400).json({message:'Supported media: JPG, PNG, GIF, WebP, MP4 and WebM (up to 10 MB).'});
  const {rows}=await query(`INSERT INTO private_messages(sender_id,recipient_id,client_id,body,media,media_type,media_name)
    VALUES($1,$2,$3,$4,$5,$6,$4) ON CONFLICT(sender_id,client_id) DO UPDATE SET client_id=EXCLUDED.client_id RETURNING ${metadata}`,[req.chatUser.id,req.params.peer,clientId,name,bytes,type]);
  res.status(201).json({message:rows[0]});
}));
router.get('/:peer/media/:id',wrap(async(req,res)=>{
  if(!id.safeParse(req.params.id).success)return res.sendStatus(400);
  const {rows}=await query(`SELECT media,media_type FROM private_messages WHERE id=$1 AND ((sender_id=$2 AND recipient_id=$3) OR (sender_id=$3 AND recipient_id=$2))`,[req.params.id,req.chatUser.id,req.params.peer]);
  if(!rows[0]?.media)return res.sendStatus(404);
  res.set('Content-Disposition','attachment').set('X-Content-Type-Options','nosniff').type(rows[0].media_type).send(rows[0].media);
}));
router.get('/:peer/audio/:id',wrap(async(req,res) => {
  if(!id.safeParse(req.params.id).success) return res.sendStatus(400);
  const {rows}=await query(`SELECT audio,audio_type FROM private_messages WHERE id=$1 AND
    ((sender_id=$2 AND recipient_id=$3) OR (sender_id=$3 AND recipient_id=$2))`,[req.params.id,req.chatUser.id,req.params.peer]);
  if(!rows[0]?.audio) return res.sendStatus(404);
  res.set('Cache-Control','no-store').type(rows[0].audio_type).send(rows[0].audio);
}));
router.use((error,req,res,next) => {
  if(error.type==='entity.too.large') return res.status(413).json({message:'Attachment too large. Gallery media supports up to 10 MB; voice notes up to 2 MB.'});
  if(error.type==='entity.parse.failed') return res.status(400).json({message:'Invalid message payload.'});
  next(error);
});
export default router;
