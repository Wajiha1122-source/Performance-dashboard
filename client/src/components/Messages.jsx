import React, {useEffect,useRef,useState} from 'react';
import '../media.css';
import {MessageSquare,Mic,Square,Send,Trash2,ImagePlus,Download} from 'lucide-react';

async function request(base,token,path,options={}) {
  const response=await fetch(`${base}/messages${path}`,{...options,cache:'no-store',signal:AbortSignal.timeout(30000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw Object.assign(new Error(data.message||'Could not connect. Please try again.'),{status:response.status});
  return data;
}
function Voice({base,token,peer,id}) {
  const [url,setUrl]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const source=useRef('');
  useEffect(()=>()=>URL.revokeObjectURL(source.current),[]);
  async function load(){
    setLoading(true);setError('');
    try {
      const res=await fetch(`${base}/messages/${peer}/audio/${id}`,{headers:{Authorization:`Bearer ${token}`}});
      if(!res.ok) throw Error('Could not load voice note. Try again.');
      source.current=URL.createObjectURL(await res.blob());setUrl(source.current);
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  return <div>{url?<audio controls src={url}/>:<button className="soft" disabled={loading} onClick={load}>{loading?'Loading…':'Listen to voice note'}</button>}{error&&<p role="alert">{error}</p>}</div>;
}
function Media({base,token,peer,message}) {
  const [url,setUrl]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const source=useRef(''),alive=useRef(true);
  useEffect(()=>{alive.current=true;return ()=>{alive.current=false;URL.revokeObjectURL(source.current);source.current=''}},[]);
  async function load(download=false){
    setLoading(true);setError('');
    try{
      let current=source.current;
      if(!current){
        const response=await fetch(`${base}/messages/${peer}/media/${message.id}`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(60000)});
        if(!response.ok)throw Error('Could not load media. Please try again.');
        const blob=await response.blob();if(!alive.current)return;
        current=URL.createObjectURL(blob);source.current=current;setUrl(current);
      }
      if(download){const link=document.createElement('a');link.href=current;link.download=message.mediaName||'attachment';document.body.appendChild(link);link.click();link.remove()}
    }catch(e){if(alive.current)setError(e.message)}finally{if(alive.current)setLoading(false)}
  }
  return <div className="chat-media">
    <strong>{message.mediaName}</strong>
    {url&&(message.mediaType.startsWith('image/')?<img src={url} alt={message.mediaName}/>:<video controls preload="metadata" src={url}/>)}
    <div>{!url&&<button type="button" className="soft" disabled={loading} onClick={()=>load()}>Preview</button>} <button type="button" className="soft" disabled={loading} onClick={()=>load(true)}><Download size={16}/>{loading?'Loading…':'Download'}</button></div>
    {error&&<p role="alert">{error}</p>}
  </div>;
}
function Conversation({base,token,user,peer,onRead}) {
  const [media,setMedia]=useState(null);
  const [connectionError,setConnectionError]=useState('');
  const gallery=useRef(null),mediaId=useRef(null);
  const [messages,setMessages]=useState([]),[text,setText]=useState(''),[error,setError]=useState(''),[sending,setSending]=useState(false),[loading,setLoading]=useState(true),[older,setOlder]=useState(false),[status,setStatus]=useState('Connecting…'),[sentNotice,setSentNotice]=useState('');
  const [recording,setRecording]=useState(false),[acquiring,setAcquiring]=useState(false),[seconds,setSeconds]=useState(0),[voice,setVoice]=useState(null);
  const last=useRef(''),alive=useRef(true),recorder=useRef(null),stream=useRef(null),timer=useRef(null),draftId=useRef(null),preview=useRef(''),requesting=useRef(false),bottom=useRef(null),refreshNow=useRef(()=>{});
  const merge=incoming=>setMessages(old=>[...new Map([...old,...incoming].map(m=>[m.id,m])).values()].sort((a,b)=>BigInt(a.id)<BigInt(b.id)?-1:1));
  const call=(path,options)=>request(base,token,`/${peer.id}${path}`,options);
  const clearVoice=()=>{URL.revokeObjectURL(preview.current);preview.current='';setVoice(null);draftId.current=null};
  function stop(){if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());clearInterval(timer.current);setRecording(false)}
  useEffect(()=>{
    alive.current=true;
    async function refresh(){
      if(requesting.current || document.hidden)return;
      requesting.current=true;
      try{
        const data=await call(last.current?`?after=${last.current}`:'');
        if(!alive.current)return;
        if(!last.current)setOlder(data.hasMore);
        if(data.messages.length){
          last.current=data.messages.at(-1).id;
          merge(data.messages);
          setTimeout(()=>bottom.current?.scrollIntoView({block:'nearest'}),50);
        }
        setStatus('Connected · Updates every 2 seconds');
        setConnectionError('');
        const unread=data.messages.filter(m=>m.recipientId===user.id&&!m.readAt).map(m=>m.id);
        if(unread.length){try{await call('/read',{method:'POST',body:JSON.stringify({ids:unread})});onRead()}catch{/* Displayed messages remain visible even if read receipts fail. */}}
      }catch(e){if(alive.current){setStatus('Unable to load conversation · Retrying automatically');setConnectionError(e.status===401?'Your session has expired. Please sign in again.':e.status>=500?'The chat server could not load messages. Please try again shortly.':e.message)}}finally{requesting.current=false;if(alive.current)setLoading(false)}
    }
    refreshNow.current=refresh;
    refresh();const interval=setInterval(refresh,2000);
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    return ()=>{alive.current=false;clearInterval(interval);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);clearInterval(timer.current);if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());URL.revokeObjectURL(preview.current)};
  },[peer.id,token]);
  async function loadOlder(){
    try{const data=await call(`?before=${messages[0].id}`);if(!alive.current)return;setMessages(old=>[...new Map([...data.messages,...old].map(m=>[m.id,m])).values()]);setOlder(data.hasMore);const ids=data.messages.filter(m=>m.recipientId===user.id&&!m.readAt).map(m=>m.id);if(ids.length){await call('/read',{method:'POST',body:JSON.stringify({ids})});onRead()}}catch(e){if(alive.current)setError(e.message)}
  }
  async function record(){
    setError('');
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){setError('Voice recording needs a supported browser and HTTPS. You can still send text.');return}
    if(acquiring)return;
    setAcquiring(true);
    try{
      stream.current=await navigator.mediaDevices.getUserMedia({audio:true});
      if(!alive.current){stream.current.getTracks().forEach(t=>t.stop());return}
      const type=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
      if(!type)throw Error('This browser does not support voice recording.');
      const rec=new MediaRecorder(stream.current,{mimeType:type,audioBitsPerSecond:64000});recorder.current=rec;
      const chunks=[];let bytes=0;const started=Date.now();
      rec.ondataavailable=e=>{chunks.push(e.data);bytes+=e.data.size;if(bytes>2097152)stop()};
      rec.onstop=()=>{
        clearInterval(timer.current);stream.current?.getTracks().forEach(t=>t.stop());
        if(!alive.current)return;
        setRecording(false);
        const blob=new Blob(chunks,{type});
        if(blob.size>2097152){setError('Recording exceeds 2 MB. Please record a shorter note.');return}
        preview.current=URL.createObjectURL(blob);
        setVoice({blob,url:preview.current,type:type.split(';')[0],duration:Math.min(120,Math.max(1,Math.round((Date.now()-started)/1000)))});
      };
      rec.onerror=()=>{stop();setError('Recording failed. Please try again.')};
      setSeconds(0);setRecording(true);rec.start(1000);
      timer.current=setInterval(()=>{const elapsed=Math.floor((Date.now()-started)/1000);setSeconds(elapsed);if(elapsed>=120)stop()},250);
    }catch(e){stream.current?.getTracks().forEach(t=>t.stop());if(alive.current)setError(e.name==='NotAllowedError'?'Allow microphone access in your browser to record a voice note.':e.message)}finally{if(alive.current)setAcquiring(false)}
  }
  async function sendMedia(){
    if(!media||sending)return;
    setSending(true);setError('');setSentNotice('');
    try{
      mediaId.current ||= crypto.randomUUID();
      const response=await fetch(`${base}/messages/${peer.id}/media`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(media.name),'X-Client-Id':mediaId.current},body:media,signal:AbortSignal.timeout(60000)});
      const result=await response.json();if(!response.ok)throw Error(result.message||'Media could not be sent. Please try again.');
      if(!alive.current)return;
      merge([result.message]);setMedia(null);mediaId.current=null;setSentNotice(`Media sent to ${peer.name}`);refreshNow.current();onRead();
      setTimeout(()=>bottom.current?.scrollIntoView({block:'nearest'}),50);
    }catch(e){if(alive.current)setError(e.message)}finally{if(alive.current)setSending(false)}
  }
  async function send(event){
    event.preventDefault();if(sending||recording||(!text.trim()&&!voice))return;
    setSending(true);setError('');setSentNotice('');
    try{
      draftId.current ||= crypto.randomUUID();
      const payload={clientId:draftId.current,body:text.trim()};
      if(voice){payload.audio=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(voice.blob)});payload.audioType=voice.type;payload.duration=voice.duration}
      const result=await call('',{method:'POST',body:JSON.stringify(payload)});
      if(!alive.current)return;
      if(result.message)merge([result.message]);
      setSentNotice(`Sent to ${peer.name}`);
      setText('');clearVoice();
      refreshNow.current();onRead();
      setTimeout(()=>bottom.current?.scrollIntoView({block:'nearest'}),50);
    }catch(e){if(alive.current)setError(e.message)}finally{if(alive.current)setSending(false)}
  }
  return <section className="chat-conversation">
    <header><strong>Chat with {peer.name}</strong><span>{peer.department||'CEO'} · Private conversation</span><span role="status">{status}</span><button type="button" className="link" onClick={()=>refreshNow.current()}>Refresh conversation</button></header>
    <div className="chat-history" aria-label="Conversation">
      {older&&<button className="soft" onClick={loadOlder}>Load earlier messages</button>}
      {connectionError&&<p className="chat-error" role="alert">{connectionError}</p>}
      {loading?<p>Loading conversation…</p>:!messages.length&&!connectionError?<p className="chat-empty">Start your conversation with {peer.name}.</p>:null}
      {messages.map(m=><article key={m.id} className={`chat-message ${m.senderId===user.id?'mine':''}`}>
        {m.body&&!m.hasMedia&&<p>{m.body}</p>}{m.hasAudio&&<Voice base={base} token={token} peer={peer.id} id={m.id}/>}
        {m.hasMedia&&<Media base={base} token={token} peer={peer.id} message={m}/>}
        <time>{new Date(m.createdAt).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}{m.hasAudio?` · ${m.duration}s voice note`:''}</time>
      </article>)}<div ref={bottom}/>
    </div>
    <form className="chat-compose" onSubmit={send}>
      {error&&<p className="chat-error" role="alert">{error}</p>}
      {sentNotice&&<p className="chat-sent" role="status">{sentNotice}</p>}
      <input ref={gallery} type="file" hidden accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!file.size||file.size>10485760){setError('Choose a photo or video up to 10 MB.');return}setError('');setMedia(file);mediaId.current=null}}/>
      {media&&<div className="media-draft"><span>{media.name} · {(media.size/1048576).toFixed(1)} MB</span><button type="button" className="primary" disabled={sending} onClick={sendMedia}>{sending?'Sending…':'Send media'}</button><button type="button" disabled={sending} aria-label="Remove attachment" onClick={()=>{setMedia(null);mediaId.current=null}}><Trash2 size={17}/></button></div>}
      {voice&&<div className="voice-preview"><audio controls src={voice.url}/><button type="button" disabled={sending} onClick={clearVoice} aria-label="Discard voice note"><Trash2 size={18}/></button></div>}
      {recording&&<div className="voice-recording">Recording · {seconds}s / 120s <button type="button" onClick={stop}><Square size={15}/>Stop recording</button></div>}
      <div className="chat-compose-row">
        <button type="button" className="chat-icon" aria-label="Attach photo or video" title="Attach photo or video (up to 10 MB)" disabled={sending||recording||acquiring} onClick={()=>gallery.current?.click()}><ImagePlus size={20}/></button>
        <textarea rows={1} aria-label="Message" placeholder="Write a message…" maxLength={4000} value={text} disabled={sending} onChange={e=>{setText(e.target.value);draftId.current=null}}/>
        <button className="chat-icon" type="button" onClick={recording?stop:record} aria-label={recording?'Stop recording':'Record voice note'} title={recording?'Stop recording':acquiring?'Waiting for microphone…':'Record voice note'} disabled={sending||acquiring||!!voice}>{recording?<Square size={20}/>:<Mic size={20}/>}</button>
        <button className="primary chat-icon" aria-label={sending?'Sending message':voice?'Send voice note':'Send message'} title={sending?'Sending…':`Send to ${peer.name}`} disabled={sending||recording||acquiring||(!text.trim()&&!voice)}><Send size={20}/></button>
      </div>
    </form>
  </section>;
}
export default function Messages({base,token,user,contacts,onRead,error}) {
  const [selected,setSelected]=useState('');
  const peer=contacts.find(c=>c.id===selected)||(user.role==='EMPLOYEE'?contacts[0]:null);
  return <div className="page"><header className="heading"><div><small>PRIVATE MESSAGES</small><h1>{user.role==='CEO'?'Team conversations':'Chat with the CEO'}</h1><p>Messages, voice notes, photos and videos in one place. New messages update automatically.</p></div></header>
    {error&&<p className="chat-error" role="alert">{error}</p>}
    <div className="chat-layout"><div className="chat-contacts">{contacts.map(c=><button key={c.id} className={peer?.id===c.id?'active':''} onClick={()=>setSelected(c.id)}><strong>{c.name}</strong><span>{c.department||'CEO'}</span>{c.unread>0&&<b>{c.unread}</b>}</button>)}</div>
      {peer?<Conversation key={peer.id} base={base} token={token} user={user} peer={peer} onRead={onRead}/>:<div className="chat-empty"><MessageSquare/><p>{contacts.length?'Select an employee to open your conversation.':'No contacts available.'}</p></div>}
    </div></div>;
}
