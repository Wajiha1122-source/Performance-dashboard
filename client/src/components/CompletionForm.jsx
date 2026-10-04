import React,{useContext,useState} from 'react';
import {TaskSession} from './TaskEvidence';
import {TaskAttachment} from './TaskControls';
export default function CompletionForm({task}){
 const {complete}=useContext(TaskSession);const [note,setNote]=useState(''),[file,setFile]=useState(null),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 async function submit(e){e.preventDefault();setSaving(true);setError('');try{
  const media=file?{name:file.name,data:await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(Error('Could not read attachment.'));r.readAsDataURL(file)})}:undefined;
  await complete(task.id,{note,media});setNote('');setFile(null);
 }catch(e){setError(e.message)}finally{setSaving(false)}}
 return <form className="completion-form" onSubmit={submit}><fieldset disabled={saving}><textarea required maxLength={10000} value={note} onChange={e=>setNote(e.target.value)} aria-label="Completion description" placeholder="Describe what you completed and the outcome…"/><div className="completion-actions"><TaskAttachment file={file} onChange={setFile} onError={setError}/><button className="soft" disabled={saving}>{saving?'Submitting…':task.completedAt?'Submit completion details':'Submit & complete'}</button></div></fieldset>{error&&<p role="alert">{error}</p>}</form>;
}
