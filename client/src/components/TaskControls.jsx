import React,{useEffect,useRef,useId} from 'react';
import {Tag,Check,Paperclip,X,FileImage} from 'lucide-react';
import {TASK_TITLES} from './TaskEvidence';
import './task-controls.css';

export function TaskTitle({value,onChange,label='Task title'}){
 const root=useRef(null),id=useId();
 useEffect(()=>{
  const close=e=>{if(!root.current?.contains(e.target))root.current?.removeAttribute('open')};
  document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);
 },[]);
 function key(e){
  if(e.key==='Escape'){root.current.open=false;root.current.querySelector('summary').focus();e.preventDefault()}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   e.preventDefault();root.current.open=true;
   const options=[...root.current.querySelectorAll('.task-title-option')];
   const index=options.indexOf(document.activeElement);
   const next=e.key==='Home'?0:e.key==='End'?options.length-1:e.key==='ArrowDown'?(index+1)%options.length:index<=0?options.length-1:index-1;
   options[next]?.focus();
  }
 }
 return <details className="task-title-menu" ref={root} onKeyDown={key} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))e.currentTarget.open=false}}>
  <summary title={value?`Selected: ${value}`:'Choose task title'} aria-label={`${label}: ${value||'Choose task title'}`} aria-controls={id}><Tag size={16}/><span>Title</span></summary>
  <div id={id} className="task-title-options" role="group" aria-label={label}>{TASK_TITLES.map(title=><button type="button" className="task-title-option" aria-pressed={value===title} key={title} onClick={()=>{onChange(title);root.current.open=false;root.current.querySelector('summary').focus()}}><span>{title}</span>{value===title&&<Check size={15}/>}</button>)}</div>
 </details>;
}

export function TaskAttachment({file,onChange,onError}){
 const input=useRef(null);
 return <div className="task-attachment-control">
  <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm" onChange={e=>{const selected=e.target.files?.[0];e.target.value='';if(!selected)return;if(selected.size>2097152){onError('Please choose a file up to 2 MB.');return}onError('');onChange(selected)}}/>
  <button type="button" className="task-attach-icon" aria-label="Attach photo or video, up to 2 MB" title="Attach photo / video · Up to 2 MB" onClick={()=>input.current.click()}><Paperclip size={18}/></button>
  {file&&<span className="task-file-chip"><FileImage size={14}/><span title={file.name}>{file.name}</span><button type="button" aria-label="Remove attachment" title="Remove attachment" onClick={()=>onChange(undefined)}><X size={14}/></button></span>}
 </div>;
}
