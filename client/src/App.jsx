import React, { useCallback, useEffect, useRef, useState } from "react";
import Messages from "./components/Messages";
import Assignments from './components/Assignments';
import CompletionForm from './components/CompletionForm';
import TaskEvidence, {TaskSession} from './components/TaskEvidence';
import {TaskTitle,TaskAttachment} from './components/TaskControls';
import { progressGroups, progressDateLabel } from "./data/progress";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Edit3,
  Eye,
  Flag,
  KeyRound,
  LoaderCircle,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
const BASE = (
  import.meta.env.VITE_API_BASE || "http://localhost:5000/api"
).replace(/\/$/, "");
let TODAY = new Date().toISOString().slice(0, 10);
const newTaskDraft=()=>({draftId:crypto.randomUUID(),title:'',description:''});
const day = (d) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(d + "T12:00:00"));
const ini = (n) =>
  n
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);
function Login({ login, busy }) {
  const [email, setEmail] = useState("ceo@company.test"),
    [password, setPassword] = useState("");
  return (
    <main className="auth">
      <section className="auth-brand">
        <b className="logo">P</b>
        <div>
          <small>PERFORMANCE PORTAL</small>
          <h1>
            Progress,
            <br />
            made visible.
          </h1>
          <p>
            A focused daily workspace for recording meaningful work and keeping
            feedback in one place.
          </p>
        </div>
        <blockquote>
          Small progress, clearly recorded, becomes remarkable performance.
        </blockquote>
      </section>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login(email, password);
        }}
      >
        <small>SECURE WORKSPACE</small>
        <h2>Welcome back</h2>
        <p>Sign in with your unique employee credentials.</p>
        <label>
          Work email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
        </label>
        <button className="primary">
          {busy ? <LoaderCircle className="spin" /> : <KeyRound />}
          Sign in
        </button>
      </form>
    </main>
  );
}
function Layout({ user, logout, children, view, setView, unread, canViewDepartments, canAssign }) {
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <b className="logo">P</b>
          <div>
            <strong>Performance</strong>
            <span>Daily progress portal</span>
          </div>
        </div>
        <nav>
          <small>WORKSPACE</small>
          <button onClick={() => setView('progress')} aria-current={view === 'progress' ? 'page' : undefined}>
            <i /> {user.role === "CEO" ? "Team progress" : "My progress"}
          </button>
          <button onClick={() => setView('messages')} aria-current={view === 'messages' ? 'page' : undefined}>
            <MessageSquare size={16}/> Messages {unread > 0 && <b className="unread-badge">{unread}</b>}
          </button>
          {canViewDepartments && <button onClick={() => setView('departments')} aria-current={view === 'departments' ? 'page' : undefined}><Eye size={16}/> Department performance</button>}
          {canAssign&&<button onClick={()=>setView('assignments')} aria-current={view==='assignments'?'page':undefined}><Send size={16}/>Assign tasks</button>}
        </nav>
        <div className="user">
          <b>{ini(user.name)}</b>
          <div>
            <strong>{user.name}</strong>
            <span>
              {user.role === "CEO"
                ? "Chief Executive Officer"
                : user.department || "Employee"}
            </span>
          </div>
          <button onClick={logout}>
            <LogOut />
          </button>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
function Stat({ icon: I, label, value, note }) {
  return (
    <article className="stat">
      <i>
        <I />
      </i>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}
function Empty({ title, text }) {
  return (
    <div className="empty">
      <CalendarDays />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function Task({ task, edit, setPriority }) {
  const {complete}=React.useContext(TaskSession);
  const [saving,setSaving]=useState(false),[error,setError]=useState('');
  return (
    <article className={`task ${task.priority || "normal"}`}>
      <i />
      <div>
        <header>
          {task.priority && task.priority !== "normal" && (
            <em>{task.priority}</em>
          )}
        </header>
        <strong>{task.title}</strong>
        <p>{task.description}</p>
        {task.assignedBy&&<span className="task-assignment-label">Assigned by {task.assignedBy} · {task.startDate} → {task.endDate}</span>}
        <div className="task-workflow"><span className={`workflow-status ${(task.status||'Started').toLowerCase()}`}>{task.status||'Started'}</span>
        {edit&&!task.assignedBy&&task.taskDate===TODAY&&!task.completedAt&&<button className="soft" disabled={saving} onClick={async()=>{setSaving(true);setError('');try{await complete(task.id)}catch(e){setError(e.message)}finally{setSaving(false)}}}><Check size={15}/>{saving?'Saving…':'Complete'}</button>}</div>
        {error&&<p role="alert">{error}</p>}
        <TaskEvidence task={task}/>
        {task.status==='Complete'&&task.completionNote&&<div className="completion-report"><strong>Completion report</strong><p>{task.completionNote}</p><TaskEvidence task={task} completion/></div>}
        {edit&&task.assignedBy&&task.taskDate===TODAY&&!task.completionNote&&<CompletionForm task={task}/>}
        <small>
          <Clock3 />{" "}
          {new Date(task.createdAt || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </small>
      </div>
      {edit && !task.assignedBy && (
        <footer>
          <label className="task-priority">
            <Flag />
            <span>Priority</span>
            <select
              value={task.priority || "normal"}
              onChange={(event) => setPriority(task.id, event.target.value)}
              aria-label={`Priority for ${task.description}`}
            >
              <option value="normal">Normal</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <button onClick={() => edit(task)}>
            <Edit3 />
          </button>
        </footer>
      )}
    </article>
  );
}
function Modal({ task, close, save }) {
  const [t, setT] = useState(task);
  const [saving,setSaving]=useState(false),[error,setError]=useState('');
  return (
    <div className="shade">
      <form
        className="modal"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);setError('');try{await save(t);close()}catch(e){setError(e.message)}finally{setSaving(false)}
        }}
      >
        <header>
          <h2>Edit task</h2>
          <button type="button" onClick={close}>
            ×
          </button>
        </header>
        <div>
          <span>Title</span><TaskTitle value={t.title} onChange={title=>setT({...t,title})}/>
        </div>
        <label>Task description
          <textarea
            value={t.description}
            onChange={(e) => setT({ ...t, description: e.target.value })}
            required
          />
        </label>
        {error&&<p role="alert">{error}</p>}
        <button className="primary" disabled={saving}>
          <Check />
          Save changes
        </button>
      </form>
    </div>
  );
}
function Progress({ tasks, edit, setPriority, alwaysVisible = false }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("today");
  const [date, setDate] = useState(TODAY);
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const groups = progressGroups(tasks, mode, date, month, TODAY);
  return <section className="panel progress-panel">
    {!alwaysVisible && <button className="soft progress-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
      <CalendarDays /> Progress <span>{open ? "Hide" : "View tasks & history"}</span>
    </button>}
    {(alwaysVisible || open) && <div className="progress-content">
      <div className="progress-filters">
        <div className="progress-presets" aria-label="Progress period">
          {["today", "week", "month", "calendar"].map(value => <button key={value} aria-pressed={mode === value} className={mode === value ? "active" : ""} onClick={() => setMode(value)}>{value === "calendar" ? "Calendar" : value[0].toUpperCase() + value.slice(1)}</button>)}
        </div>
        {mode === "calendar" && <label>Date<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>}
        {mode === "month" && <label>Month<input type="month" value={month} onChange={event => setMonth(event.target.value)} /></label>}
        {mode === "week" && <span>This week · Monday–Sunday</span>}
      </div>
      {groups.length ? groups.map(([dateKey, dayTasks]) => <section className="progress-day" key={dateKey}>
        <header><h3>{progressDateLabel(dateKey)}</h3><span>{dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}</span></header>
        <div className="tasks">{dayTasks.map(task => <Task key={task.id} task={task} edit={edit} setPriority={setPriority} />)}</div>
      </section>) : <Empty title="No progress for this period" text="Choose another date or period to see saved tasks." />}
    </div>}
  </section>;
}

function Employee({ user, tasks, comments, act, busy }) {
  tasks = tasks.filter(task => task.employeeId === user.employeeId);
  const today = tasks.filter(
      (t) => (t.taskDate || TODAY).slice(0, 10) === TODAY,
    );
  const submittedToday=today.some(t=>!t.assignedBy&&t.createdAt?.slice(0,10)===TODAY);
  const [draftError,setDraftError]=useState(''),[submitting,setSubmitting]=useState(false);
  const [rows, setRows] = useState(()=>[newTaskDraft()]),
    [editing, setEditing] = useState(null);
  return (
    <div className="page">
      <header className="heading">
        <div>
          <small>MY DAILY WORKSPACE</small>
          <h1>Good day, {user.name.split(" ")[0]}</h1>
          <p>{day(TODAY)} · Keep today’s progress clear and useful.</p>
        </div>
      </header>
      <div className="stats employee-stats">
        <Stat
          icon={CalendarDays}
          label="Today’s tasks"
          value={today.length}
          note="Current work list"
        />
        <Stat
          icon={Check}
          label="Submitted"
          value={submittedToday ? "Yes" : "Not yet"}
          note="Daily status"
        />
      </div>
      {comments[`${user.employeeId}:${TODAY}`] && (
        <section className="note">
          <MessageSquare />
          <div>
            <small>CEO COMMENT · TODAY</small>
            <p>{comments[`${user.employeeId}:${TODAY}`]}</p>
          </div>
        </section>
      )}
      <section className="panel">
        <header>
          <div>
            <small>TODAY’S PROGRESS</small>
            <h2>Add what you’re working on</h2>
          </div>
          <em>{rows.length} entries</em>
        </header>
        {rows.map((r, i) => (
          <div className="draft" key={r.draftId}>
            <b>T{i + 1}</b>
            <div className="task-draft-fields">
            <TaskTitle label={`Title for task ${i+1}`} value={r.title} onChange={title=>setRows(a=>a.map((x,j)=>j===i?{...x,title}:x))}/>
            <textarea
              placeholder="Briefly describe the progress or outcome"
              value={r.description}
              onChange={(e) =>
                setRows((a) =>
                  a.map((x, j) =>
                    j === i ? { ...x, description: e.target.value } : x,
                  ),
                )
              }
            />
            <TaskAttachment file={r.file} onError={setDraftError} onChange={file=>setRows(a=>a.map((x,j)=>j===i?{...x,file}:x))}/>
            </div>
            <button
              onClick={() =>
                rows.length > 1 && setRows((a) => a.filter((_, j) => j !== i))
              }
            >
              <Trash2 />
            </button>
          </div>
        ))}
        <footer className="form-actions">
          <button
            className="soft"
            disabled={submitting} onClick={() => setRows([...rows, newTaskDraft()])}
          >
            <Plus />
            Add another task
          </button>
          <button
            className="primary"
            disabled={submitting}
            onClick={async () => {
              setDraftError('');
              if(rows.some(x=>!x.title||!x.description.trim())){setDraftError('Choose a title and enter a description for every task.');return}
              if(rows.reduce((n,r)=>n+(r.file?.size||0),0)>10485760){setDraftError('Attachments must total 10 MB or less.');return}
              setSubmitting(true);
              try{const v=await Promise.all(rows.map(async({file,title,description})=>({title,description,...(file?{media:{name:file.name,data:await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(Error('Unable to read attachment'));r.readAsDataURL(file)})}}:{})})));await act.add(v);setRows([newTaskDraft()])}catch(e){setDraftError(e.message)}finally{setSubmitting(false)}
            }}
          >
            <Send />
            Submit today’s progress
          </button>
        </footer>
        {draftError&&<p role="alert">{draftError}</p>}
      </section>
      <section className="panel"><header><h2>Assigned tasks</h2></header>{today.filter(t=>t.assignedBy&&t.status==='Started').length?today.filter(t=>t.assignedBy&&t.status==='Started').map(t=><Task key={t.id} task={t} edit={setEditing}/>):<p>No started assignments. Pending and completed work appears in progress below.</p>}</section>
      <Progress tasks={tasks} edit={setEditing} setPriority={(id, priority) => act.priority([id], priority)} alwaysVisible />
      {editing && (
        <Modal
          task={editing}
          close={() => setEditing(null)}
          save={(t) => act.edit(t)}
        />
      )}
    </div>
  );
}
function CEO({ employees, tasks, comments, act, readOnly = false }) {
  const [emp, setEmp] = useState(null),
    [department, setDepartment] = useState(null),
    [date, setDate] = useState(TODAY),
    [q, setQ] = useState(""),
    [comment, setComment] = useState(""),
    [editingComment, setEditingComment] = useState(false);
  const savedComment = emp ? comments[`${emp.id}:${date}`] : "";
  if (emp)
    return (
      <div className="page">
        <button className="back" onClick={() => setEmp(null)}>
          <ChevronLeft />
          {department || "All employees"}
        </button>
        <header className="profile">
          <b>{ini(emp.name)}</b>
          <div>
            <small>EMPLOYEE PROGRESS</small>
            <h1>{emp.name}</h1>
            <p>
              {emp.designation} · {emp.department}
            </p>
          </div>
        </header>
        <Progress key={emp.id} tasks={tasks.filter(task => task.employeeId === emp.id)} alwaysVisible />
        {!readOnly && <section className="filters">
          <label>
            CEO comment date
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setEditingComment(false);
                setComment(comments[`${emp.id}:${e.target.value}`] || "");
              }}
            />
          </label>
        </section>}
        {!readOnly && savedComment && (
          <section className="saved-comment">
            <MessageSquare />
            <div>
              <small>SAVED CEO COMMENT</small>
              <p>{savedComment}</p>
            </div>
            <button
              className="edit-comment"
              onClick={() => {
                setComment(savedComment);
                setEditingComment(true);
              }}
            >
              <Edit3 /> Edit
            </button>
          </section>
        )}
        {!readOnly && (!savedComment || editingComment) && (
          <section className="panel comment">
            <div>
              <small>DAY-LEVEL FEEDBACK</small>
              <h2>Comment on this day</h2>
              <p>The employee will see this comment.</p>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write concise, constructive feedback..."
            />
            <button
              className="primary"
              onClick={async () => {
                await act.comment(emp.id, date, comment);
                setEditingComment(false);
              }}
            >
              <Send />
              Save comment
            </button>
          </section>
        )}
      </div>
    );
  const todayEmployeeIds = new Set(tasks
    .filter((t) => !t.assignedBy && t.createdAt?.slice(0,10)===TODAY && t.taskDate===TODAY)
    .map((t) => t.employeeId));
  const scopedEmployees = department
    ? employees.filter((employee) => employee.department === department)
    : employees;
  const submitted = scopedEmployees.filter((employee) => todayEmployeeIds.has(employee.id)).length;
  const departmentNames = [...new Set(employees.map((employee) => employee.department))].sort();
  return (
    <div className="page">
      {department && <button className="back" onClick={() => { setDepartment(null); setQ(""); }}><ChevronLeft />All departments</button>}
      <header className="heading">
        <div>
          <small>{readOnly ? 'DEPARTMENT PERFORMANCE · VIEW ONLY' : 'EXECUTIVE OVERVIEW'}</small>
          <h1>{department || "Today’s team progress"}</h1>
          <p>{day(TODAY)} · {department ? (readOnly ? "Select an employee to view their progress." : "Select an employee to review and comment.") : "Select a department to view its team’s progress."}</p>
        </div>
      </header>
      <div className="stats">
        <Stat
          icon={UserRound}
          label="Employees"
          value={scopedEmployees.length}
          note="Active team"
        />
        <Stat
          icon={Check}
          label="Submitted today"
          value={submitted}
          note="With progress"
        />
        <Stat
          icon={Clock3}
          label="Awaiting update"
          value={scopedEmployees.length - submitted}
          note="Not submitted"
        />
      </div>
      <section className="panel">
        <header>
          <div>
            <small>{department ? "TEAM DIRECTORY" : "DEPARTMENTS"}</small>
            <h2>{department ? "Employee progress" : "Progress by department"}</h2>
          </div>
          {department && <label className="search">
            <Search />
            <input
              placeholder="Search employee"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>}
        </header>
        {!department ? <div className="employees department-grid">
          {departmentNames.map((name) => {
            const members = employees.filter((employee) => employee.department === name);
            const updated = members.filter((employee) => todayEmployeeIds.has(employee.id)).length;
            return <button key={name} className="employee-card department-card" onClick={() => { setDepartment(name); setQ(""); }}>
              <div>
                <h3>{name}</h3>
                <p>{members.length} employees</p>
                <span>{updated} submitted · {members.length - updated} awaiting update</span>
              </div>
              <Eye />
            </button>;
          })}
        </div> : <div className="employees">
          {scopedEmployees
            .filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))
            .map((e) => {
              const n = tasks.filter(
                (t) =>
                  t.employeeId === e.id &&
                  (t.taskDate || TODAY).slice(0, 10) === TODAY,
              ).length;
              return (
                <button
                  key={e.id}
                  className="employee-card"
                  onClick={() => {
                    setEmp(e);
                    setDate(TODAY);
                    setComment(comments[`${e.id}:${TODAY}`] || "");
                    setEditingComment(false);
                  }}
                >
                  <b>{ini(e.name)}</b>
                  <div>
                    <h3>{e.name}</h3>
                    <p>{e.designation || e.department}</p>
                    <span>
                      {n} tasks today · {n ? "Submitted" : "Pending"}
                    </span>
                  </div>
                  <Eye />
                </button>
              );
            })}
        </div>}
      </section>
    </div>
  );
}

function PremiumLoader({ label }) {
  return (
    <div className="premium-loader" role="status" aria-live="polite">
      <div className="loader-card">
        <div className="loader-emblem">
          <span>P</span>
          <i />
        </div>
        <strong>{label}</strong>
        <small>Please wait a moment</small>
        <div className="loader-line"><i /></div>
      </div>
    </div>
  );
}

export default function App() {
  const ssoStarted = useRef(false);
  const [view,setView] = useState('progress');
  const [contacts,setContacts] = useState([]);
  const [viewDepartments,setViewDepartments] = useState([]);
  const [canAssign,setCanAssign]=useState(false);
  const [chatError,setChatError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true),
    [user, setUser] = useState(null),
    [token, setToken] = useState(""),
    [employees, setEmployees] = useState([]),
    [tasks, setTasks] = useState([]),
    [comments, setComments] = useState({}),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false);
  const refreshContacts = useCallback(async () => {
    if(!user || !token) return;
    try {
      const response=await fetch(`${BASE}/messages/contacts`, {headers:{Authorization:`Bearer ${token}`}});
      if(!response.ok) throw new Error('Messages are unavailable. Please try again shortly.');
      const data=await response.json();setContacts(data.contacts);setChatError('');
    }catch(error){setChatError(error.message)}
  },[user,token]);
  useEffect(() => {
    refreshContacts();
    const interval=setInterval(()=>{if(!document.hidden)refreshContacts()},5000);
    const onFocus=()=>{if(!document.hidden)refreshContacts()};
    window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onFocus);
    return ()=>{clearInterval(interval);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onFocus)};
  },[refreshContacts]);
  useEffect(() => {
    const timer = window.setTimeout(() => setInitialLoading(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);
  const keepLoaderVisible = async (startedAt) => {
    const remaining = 850 - (Date.now() - startedAt);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  };
  const req = async (path, o = {}, tok = token) => {
      const r = await fetch(BASE + path, {
          ...o,
          headers: {
            "Content-Type": "application/json",
            ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
          },
        }),
        d = await r.json().catch(() => ({}));
      if (!r.ok) throw Error(d.message || "Request failed");
      return d;
    },
    apply = (d) => {
      TODAY=new Date().toISOString().slice(0,10);
      setCanAssign(!!d.canAssign);
      setViewDepartments(d.viewDepartments || []);
      setEmployees(d.employees || []);
      setTasks(d.tasks || []);
      setComments(d.comments || {});
    },
    note = (x) => {
      setToast(x);
      setTimeout(() => setToast(""), 3000);
    },
    login = async (e, p) => {
      const startedAt = Date.now();
      setBusy(true);
      try {
        const a = await req(
          "/auth/login",
          { method: "POST", body: JSON.stringify({ email: e, password: p }) },
          "",
        );
        setUser(a.user);
        setToken(a.token);
        apply(await req("/manage/bootstrap", {}, a.token));
      } catch (x) {
        note(x.message);
      }
      await keepLoaderVisible(startedAt);
      setBusy(false);
    },
    mut = async (path, o, msg, propagate = false) => {
      const startedAt = Date.now();
      let failure;
      try {
        setBusy(true);
        apply((await req(path, o)).data);
        note(msg);
      } catch (x) {
        note(x.message);
        failure=x;
      }
      await keepLoaderVisible(startedAt);
      setBusy(false);
      if(failure&&propagate)throw failure;
    };
  useEffect(()=>{
    if(!token||busy)return;
    let active=true,pending=false;
    const refresh=async()=>{if(pending||document.hidden)return;pending=true;try{const d=await req('/manage/bootstrap');if(active)apply(d)}catch{/* Keep existing data; retry on the next refresh. */}finally{pending=false}};
    refresh();const interval=setInterval(refresh,30000);
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    return()=>{active=false;clearInterval(interval);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)};
  },[token,busy]);
  useEffect(() => {
    // React StrictMode replays mount effects; consume the handoff only once.
    if (ssoStarted.current) return;
    ssoStarted.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (!params.has("ssoToken") && !params.has("ssoUser")) return;
    const ssoToken = params.get("ssoToken");
    params.delete("ssoToken");
    params.delete("ssoUser");
    const remainingHash = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}${remainingHash ? `#${remainingHash}` : ""}`,
    );
    setBusy(true);
    const completeSso = async () => {
      try {
        if (!ssoToken) throw new Error("SSO login link is incomplete. Please open this app again from the Master Dashboard.");
        // Resolve identity from the validated session, not editable URL user data.
        const { user: ssoUser } = await req("/auth/me", {}, ssoToken);
        if (ssoUser?.role !== "CEO") throw new Error("This SSO link does not grant CEO access.");
        const data = await req("/manage/bootstrap", {}, ssoToken);
        apply(data);
        setToken(ssoToken);
        setUser(ssoUser);
      } catch (error) {
        setUser(null);
        setToken("");
        setToast(error.message || "SSO login failed. Please sign in again.");
      } finally {
        setBusy(false);
      }
    };
    completeSso();
  }, []);
  const act = {
    complete:(id,report={})=>mut('/manage/tasks/'+id+'/complete',{method:'PATCH',body:JSON.stringify(report)},'Task completed',true),
    add: (v) =>
      mut(
        "/manage/tasks/batch",
        { method: "POST", body: JSON.stringify({ tasks: v, date: TODAY }) },
        "Progress saved",
        true,
      ),
    edit: (t) =>
      mut(
        "/manage/tasks/" + t.id,
        { method: "PATCH", body: JSON.stringify({title:t.title,description:t.description}) },
        "Task updated",
        true,
      ),
    priority: (ids, priority) =>
      mut(
        "/manage/tasks/priority",
        { method: "PATCH", body: JSON.stringify({ taskIds: ids, priority }) },
        "Priority updated",
      ),
    comment: (employeeId, date, remark) =>
      mut(
        "/manage/comments",
        { method: "POST", body: JSON.stringify({ employeeId, date, remark }) },
        "Comment saved",
      ),
  };
  if (initialLoading) {
    return <PremiumLoader label="Opening Performance…" />;
  }
  if (!user)
    return (
      <>
        <Login
          login={login}
          busy={busy}
        />
        {busy && <PremiumLoader label="Preparing your workspace…" />}
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  return (
    <>
      <TaskSession.Provider value={{base:BASE,token,role:user.role,complete:act.complete}}><Layout
        user={user}
        view={view}
        setView={setView}
        unread={contacts.reduce((sum,contact)=>sum+contact.unread,0)}
        canViewDepartments={user.role !== 'CEO' && viewDepartments.length > 0}
        canAssign={canAssign}
        logout={() => {
          setUser(null);
          setToken("");
          setContacts([]);
          setViewDepartments([]);
          setCanAssign(false);
          setView('progress');
        }}
      >
        {view==='assignments'&&canAssign?<Assignments base={BASE} token={token}/>:view === 'messages' ? <Messages base={BASE} token={token} user={user} contacts={contacts} onRead={refreshContacts} error={chatError}/> : view === 'departments' && viewDepartments.length > 0 ? <CEO key="viewer" employees={employees.filter(e=>viewDepartments.includes(e.department))} tasks={tasks} comments={{}} act={act} readOnly/> : user.role === "CEO" ? (
          <CEO employees={employees} tasks={tasks} comments={comments} act={act} />
        ) : (
          <Employee user={user} tasks={tasks} comments={comments} act={act} busy={busy} />
        )}
        {toast && <div className="toast">{toast}</div>}
      </Layout></TaskSession.Provider>
      {busy && <PremiumLoader label="Saving your changes…" />}
    </>
  );
}
