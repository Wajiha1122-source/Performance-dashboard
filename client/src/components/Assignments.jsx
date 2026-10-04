import React,{useEffect,useRef,useState} from 'react';
import {Send} from 'lucide-react';
import {TaskTitle} from './TaskControls';
import './assignments.css';
export default function Assignments({base,token}){
 const today=()=>new Date().toISOString().slice(0,10);
 const empty=()=>({employeeId:'',title:'',description:'',startDate:today(),endDate:today()});
 const [form,setForm]=useState(empty),[employees,setEmployees]=useState([]),[tasks,setTasks]=useState([]),[error,setError]=useState(''),[notice,setNotice]=useState(''),[saving,setSaving]=useState(false),[loading,setLoading]=useState(true);
 const requestId=useRef(null);
 async function refresh(){const r=await fetch(`${base}/assignments`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.message||'Could not load assignments.');setEmployees(d.employees);setTasks(d.tasks);setLoading(false)}
 useEffect(()=>{let active=true;const update=()=>{if(active&&!document.hidden)refresh().catch(e=>{if(active){setError(e.message);setLoading(false)}})};update();const timer=setInterval(update,30000);window.addEventListener('focus',update);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',update)}},[token]);
 const change=(key,value)=>{setForm(f=>({...f,[key]:value}));requestId.current=null};
 async function submit(e){e.preventDefault();if(saving)return;setSaving(true);setError('');setNotice('');try{
  if(!form.title)throw Error('Choose a task title.');requestId.current ||= crypto.randomUUID();
  const r=await fetch(`${base}/assignments`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({...form,clientId:requestId.current})});const d=await r.json();if(!r.ok)throw Error(d.message||'Assignment failed.');
  setForm(empty());requestId.current=null;setNotice('Task assigned. It will appear from its start date.');await refresh();
 }catch(e){setError(e.message)}finally{setSaving(false)}}
 return <div className="page"><header className="heading"><div><small>TASK ASSIGNMENTS</small><h1>Assign & track</h1><p>Assign a task to any employee and follow its progress.</p></div></header>
 <form className="panel assignment-form" onSubmit={submit}><fieldset disabled={saving}>
 <label>Employee<select required value={form.employeeId} onChange={e=>change('employeeId',e.target.value)}><option value="">Choose employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name} · {e.department}</option>)}</select></label>
 <TaskTitle value={form.title} onChange={v=>change('title',v)}/>
 <textarea required maxLength={10000} aria-label="Task description" placeholder="Describe the task and expected outcome…" value={form.description} onChange={e=>change('description',e.target.value)}/>
 <div className="assignment-dates"><label>Start date<input required type="date" min={today()} value={form.startDate} onChange={e=>change('startDate',e.target.value)}/></label><label>End date<input required type="date" min={form.startDate||today()} value={form.endDate} onChange={e=>change('endDate',e.target.value)}/></label><button className="primary"><Send size={16}/>{saving?'Assigning…':'Assign task'}</button></div>
 </fieldset></form>
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 <section className="panel"><header><h2>Tasks I assigned</h2><small>Updates every 30 seconds</small></header>{loading?<p>Loading…</p>:!tasks.length?<p>No assigned tasks yet.</p>:tasks.map(t=><article className="assignment-item" key={t.id}><div><strong>{t.title} · {t.employee}</strong><p>{t.description}</p><small>{t.startDate} → {t.endDate}{t.status!=='Complete'&&t.endDate<today()?' · Overdue':''}</small></div><span className={`workflow-status ${t.status.toLowerCase()}`}>{t.status}</span></article>)}</section></div>;
}
