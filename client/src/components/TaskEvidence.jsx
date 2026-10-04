import React,{createContext,useContext,useEffect,useState} from 'react';
export const TaskSession=createContext({});
export const TASK_TITLES=['Procurement','Operations','Inventory','Development','Social Media','Sales','Internal Meeting','Ledgers','Accounts&Finance'];
export default function TaskEvidence({task,completion=false}){
 const {base,token,role}=useContext(TaskSession);
 const [url,setUrl]=useState(''),[mime,setMime]=useState(''),[history,setHistory]=useState(null),[open,setOpen]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>()=>{if(url)URL.revokeObjectURL(url)},[url]);
 async function load(kind){setBusy(true);setError('');try{
  const r=await fetch(`${base}/manage/tasks/${task.id}/${kind}`,{headers:{Authorization:`Bearer ${token}`}});
  if(!r.ok)throw Error('Could not load this task’s '+kind+'. Please try again.');
  if(kind==='media'||kind==='completion-media'){const b=await r.blob();setMime(b.type);setUrl(URL.createObjectURL(b))}
  else {setHistory((await r.json()).history);setOpen(true)}
 }catch(e){setError(e.message)}finally{setBusy(false)}}
 return <div className="task-evidence">
  {(completion?task.hasCompletionMedia:task.hasMedia)&&<button className="soft" disabled={busy} onClick={()=>url?setUrl(''):load(completion?'completion-media':'media')}>{url?'Close media':completion?'Open completion proof':'Open media'}</button>}
  {!completion&&role==='CEO'&&task.hasEdits&&<button className="soft" disabled={busy} onClick={()=>open?setOpen(false):load('history')}>{open?'Hide edit history':'Edit history'}</button>}
  {url&&<div>{mime.startsWith('image/')?<img src={url} alt={completion?task.completionMediaName:task.mediaName}/>:<video controls src={url}/>}<a href={url} download={completion?task.completionMediaName:task.mediaName}>Download attachment</a></div>}
  {open&&history&&<div className="task-history">{history.map((h,i)=><section key={i}><strong>{new Date(h.editedAt).toLocaleString()}</strong>{Object.keys(h.after).filter(k=>h.before[k]!==h.after[k]).map(k=><div key={k}><b>{k}</b><p>Before: {h.before[k]||'—'}</p><p>After: {h.after[k]||'—'}</p></div>)}</section>)}</div>}
  {error&&<p role="alert">{error}</p>}
 </div>;
}
