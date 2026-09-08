import React, { useMemo, useState } from "react";
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
const TODAY = new Date().toISOString().slice(0, 10);
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
function Login({ login, reset, busy }) {
  const [email, setEmail] = useState("ceo@company.test"),
    [password, setPassword] = useState(""),
    [forgot, setForgot] = useState(false);
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
          forgot ? reset(email) : login(email, password);
        }}
      >
        <small>SECURE WORKSPACE</small>
        <h2>{forgot ? "Recover password" : "Welcome back"}</h2>
        <p>
          {forgot
            ? "We’ll send recovery instructions to your work email."
            : "Sign in with your unique employee credentials."}
        </p>
        <label>
          Work email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {!forgot && (
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
        )}
        <button className="primary">
          {busy ? <LoaderCircle className="spin" /> : <KeyRound />}
          {forgot ? "Send recovery link" : "Sign in"}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => setForgot(!forgot)}
        >
          {forgot ? "Back to sign in" : "Forgot password?"}
        </button>
      </form>
    </main>
  );
}
function Layout({ user, logout, children }) {
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
          <button>
            <i /> {user.role === "CEO" ? "Team progress" : "My progress"}
          </button>
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
function Task({ task, edit, del, setPriority }) {
  return (
    <article className={`task ${task.priority || "normal"}`}>
      <i />
      <div>
        <header>
          {task.priority && task.priority !== "normal" && (
            <em>{task.priority}</em>
          )}
        </header>
        <p>{task.description}</p>
        <small>
          <Clock3 />{" "}
          {new Date(task.createdAt || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </small>
      </div>
      {edit && (
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
          <button onClick={() => del(task.id)}>
            <Trash2 />
          </button>
        </footer>
      )}
    </article>
  );
}
function Modal({ task, close, save }) {
  const [t, setT] = useState(task);
  return (
    <div className="shade">
      <form
        className="modal"
        onSubmit={(e) => {
          e.preventDefault();
          save(t);
          close();
        }}
      >
        <header>
          <h2>Edit task</h2>
          <button type="button" onClick={close}>
            ×
          </button>
        </header>
        <label>
          Task description
          <textarea
            value={t.description}
            onChange={(e) => setT({ ...t, description: e.target.value })}
            required
          />
        </label>
        <button className="primary">
          <Check />
          Save changes
        </button>
      </form>
    </div>
  );
}
function Employee({ user, tasks, comments, act, busy }) {
  const today = tasks.filter(
      (t) => (t.taskDate || TODAY).slice(0, 10) === TODAY,
    ),
    history = tasks.filter((t) => (t.taskDate || TODAY).slice(0, 10) !== TODAY);
  const [rows, setRows] = useState([{ description: "" }]),
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
          value={today.length ? "Yes" : "Not yet"}
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
          <div className="draft">
            <b>T{i + 1}</b>
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
            onClick={() => setRows([...rows, { description: "" }])}
          >
            <Plus />
            Add another task
          </button>
          <button
            className="primary"
            onClick={async () => {
              const v = rows.filter((x) => x.description.trim());
              if (v.length) {
                await act.add(
                  v.map((task, index) => ({
                    ...task,
                    title: `Task ${index + 1}`,
                  })),
                );
                setRows([{ description: "" }]);
              }
            }}
          >
            <Send />
            Submit today’s progress
          </button>
        </footer>
      </section>
      <section className="panel">
        <header>
          <div>
            <small>SAVED TODAY</small>
            <h2>Your task list</h2>
          </div>
        </header>
        {today.length ? (
          <div className="tasks">
            {today.map((t) => (
              <Task
                task={t}
                edit={setEditing}
                del={act.del}
                setPriority={(id, priority) => act.priority([id], priority)}
              />
            ))}
          </div>
        ) : (
          <Empty
            title="Nothing submitted yet"
            text="Add your first task above."
          />
        )}
      </section>
      <section className="panel">
        <header>
          <div>
            <small>EARLIER WORK</small>
            <h2>Progress history</h2>
          </div>
          <input type="month" onChange={(e) => act.month(e.target.value)} />
        </header>
        {history.length ? (
          <div className="tasks">
            {history.map((t) => (
              <Task task={t} />
            ))}
          </div>
        ) : (
          <Empty
            title="No earlier entries"
            text="Previous days appear here automatically."
          />
        )}
      </section>
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
function CEO({ employees, tasks, comments, act }) {
  const [emp, setEmp] = useState(null),
    [date, setDate] = useState(TODAY),
    [month, setMonth] = useState(""),
    [q, setQ] = useState(""),
    [comment, setComment] = useState(""),
    [editingComment, setEditingComment] = useState(false);
  const filtered = emp
    ? tasks.filter(
        (t) =>
          t.employeeId === emp.id &&
          (month
            ? (t.taskDate || "").slice(0, 7) === month
            : (t.taskDate || TODAY).slice(0, 10) === date),
      )
    : [];
  const savedComment = emp ? comments[`${emp.id}:${date}`] : "";
  if (emp)
    return (
      <div className="page">
        <button className="back" onClick={() => setEmp(null)}>
          <ChevronLeft />
          All employees
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
        <section className="filters">
          <label>
            Specific day
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setMonth("");
                setComment(comments[`${emp.id}:${e.target.value}`] || "");
              }}
            />
          </label>
          <span>or</span>
          <label>
            Whole month
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
        </section>
        <section className="panel">
          <header>
            <h2>{month || day(date)}</h2>
            <em>{filtered.length} tasks</em>
          </header>
          {filtered.length ? (
            <div className="tasks">
              {filtered.map((t) => (
                <Task task={t} />
              ))}
            </div>
          ) : (
            <Empty
              title="No progress submitted"
              text="No tasks for this period."
            />
          )}
        </section>
        {!month && savedComment && (
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
        {!month && (!savedComment || editingComment) && (
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
  const submitted = new Set(
    tasks
      .filter((t) => (t.taskDate || TODAY).slice(0, 10) === TODAY)
      .map((t) => t.employeeId),
  ).size;
  return (
    <div className="page">
      <header className="heading">
        <div>
          <small>EXECUTIVE OVERVIEW</small>
          <h1>Today’s team progress</h1>
          <p>{day(TODAY)} · Select an employee to review and comment.</p>
        </div>
      </header>
      <div className="stats">
        <Stat
          icon={UserRound}
          label="Employees"
          value={employees.length}
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
          value={employees.length - submitted}
          note="Not submitted"
        />
      </div>
      <section className="panel">
        <header>
          <div>
            <small>TEAM DIRECTORY</small>
            <h2>Employee progress</h2>
          </div>
          <label className="search">
            <Search />
            <input
              placeholder="Search employee"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        </header>
        <div className="employees">
          {employees
            .filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))
            .map((e) => {
              const n = tasks.filter(
                (t) =>
                  t.employeeId === e.id &&
                  (t.taskDate || TODAY).slice(0, 10) === TODAY,
              ).length;
              return (
                <button
                  className="employee-card"
                  onClick={() => {
                    setEmp(e);
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
        </div>
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
  const [user, setUser] = useState(null),
    [token, setToken] = useState(""),
    [employees, setEmployees] = useState([]),
    [tasks, setTasks] = useState([]),
    [comments, setComments] = useState({}),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [month, setMonth] = useState("");
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
    mut = async (path, o, msg) => {
      const startedAt = Date.now();
      try {
        setBusy(true);
        apply((await req(path, o)).data);
        note(msg);
      } catch (x) {
        note(x.message);
      }
      await keepLoaderVisible(startedAt);
      setBusy(false);
    };
  const act = {
    month: setMonth,
    add: (v) =>
      mut(
        "/manage/tasks/batch",
        { method: "POST", body: JSON.stringify({ tasks: v, date: TODAY }) },
        "Progress saved",
      ),
    edit: (t) =>
      mut(
        "/manage/tasks/" + t.id,
        { method: "PATCH", body: JSON.stringify(t) },
        "Task updated",
      ),
    del: (id) =>
      confirm("Delete this task?") &&
      mut("/manage/tasks/" + id, { method: "DELETE" }, "Task deleted"),
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
  const visible = useMemo(
    () =>
      month
        ? tasks.filter((t) => (t.taskDate || "").slice(0, 7) === month)
        : tasks,
    [tasks, month],
  );
  if (!user)
    return (
      <>
        <Login
          login={login}
          reset={(e) =>
            mut(
              "/auth/password-reset/request",
              { method: "POST", body: JSON.stringify({ email: e }) },
              "Recovery instructions sent",
            )
          }
          busy={busy}
        />
        {busy && <PremiumLoader label="Preparing your workspace…" />}
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  return (
    <>
      <Layout
        user={user}
        logout={() => {
          setUser(null);
          setToken("");
        }}
      >
        {user.role === "CEO" ? (
          <CEO employees={employees} tasks={tasks} comments={comments} act={act} />
        ) : (
          <Employee user={user} tasks={visible} comments={comments} act={act} busy={busy} />
        )}
        {toast && <div className="toast">{toast}</div>}
      </Layout>
      {busy && <PremiumLoader label="Saving your changes…" />}
    </>
  );
}
