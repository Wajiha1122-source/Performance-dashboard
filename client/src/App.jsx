import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Building2,
  CalendarDays,
  Download,
  FileBarChart,
  Gauge,
  Plus,
  Save,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserX,
  Users
} from "lucide-react";
import Layout from "./components/Layout";
import MetricCard from "./components/MetricCard";
import ProgressCircle from "./components/ProgressCircle";
import { departments as defaultDepartments, trendData } from "./data/mockData";

const COMPANY_NAME = "Irshad & Company";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const navByRole = {
  CEO: [
    { id: "ceo", label: "CEO Dashboard", icon: Gauge },
    { id: "departments", label: "Department Analysis", icon: Building2 },
    { id: "employees", label: "Employee Reviews", icon: Award },
    { id: "reports", label: "Reports", icon: FileBarChart },
    { id: "analytics", label: "Analytics", icon: BarChart3 }
  ],
  DEPARTMENT_HEAD: [
    { id: "head", label: "Head Panel", icon: Gauge },
    { id: "employees", label: "My Employees", icon: Users },
    { id: "attendance", label: "Attendance", icon: UserCheck },
    { id: "tasks", label: "Tasks", icon: CalendarDays },
    { id: "reports", label: "Dept Reports", icon: FileBarChart }
  ],
  EMPLOYEE: [
    { id: "employee", label: "My Performance", icon: Gauge },
    { id: "tasks", label: "My Tasks", icon: CalendarDays },
    { id: "reports", label: "My Reports", icon: FileBarChart }
  ]
};

const firstViewByRole = {
  CEO: "ceo",
  DEPARTMENT_HEAD: "head",
  EMPLOYEE: "employee"
};

const scoreMap = { Done: 100, "In Progress": 50, "Not Done": 0 };

function calculateEmployees(employees, tasks, attendance) {
  return employees.map((employee) => {
    const todayAttendance = attendance[employee.id] || employee.attendance || "PRESENT";
    const employeeTasks = tasks.filter((task) => task.employeeId === employee.id);
    const completedTasks = employeeTasks.filter((task) => task.status === "Done").length;
    const inProgressTasks = employeeTasks.filter((task) => task.status === "In Progress").length;
    const notDoneTasks = employeeTasks.filter((task) => task.status === "Not Done").length;
    const daily = todayAttendance === "ABSENT" || employeeTasks.length === 0
      ? 0
      : Math.round(employeeTasks.reduce((sum, task) => sum + scoreMap[task.status], 0) / employeeTasks.length);

    return {
      ...employee,
      attendance: todayAttendance,
      daily,
      weekly: Math.round((daily + (employee.weekly || 0)) / 2),
      monthly: Math.round((daily + (employee.weekly || 0) + (employee.monthly || 0)) / 3),
      totalTasks: employeeTasks.length,
      completedTasks,
      inProgressTasks,
      notDoneTasks
    };
  }).sort((a, b) => b.monthly - a.monthly).map((employee, index) => ({ ...employee, rank: index + 1 }));
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("ceo@company.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const user = await onLogin(email, password);
    if (!user) setError("Invalid email or password.");
  };

  return (
    <main className="launcher-screen">
      <motion.form className="launcher-panel login-form" onSubmit={submit} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
        <span className="eyebrow">{COMPANY_NAME}</span>
        <h1>Employee Performance Management</h1>
        <p>Secure role-based login for CEO, Department Head, and Employee dashboards.</p>
        <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter email" /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" /></label>
        <div className="form-row">
          <label className="check-row"><input type="checkbox" /> Remember me</label>
          <button type="button" className="link-button" onClick={() => setError("Password reset module is ready for email provider integration.")}>Forgot password?</button>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <button className="primary-button login-button" type="submit">Login</button>
      </motion.form>
    </main>
  );
}

function CEODashboard({ currentUser, employees, departments, onRemark, onExport }) {
  const companyPerformance = employees.length ? Math.round(employees.reduce((sum, employee) => sum + employee.daily, 0) / employees.length) : 0;
  const present = employees.filter((employee) => employee.attendance === "PRESENT").length;

  return (
    <div className="view-grid">
      <section className="hero-band">
        <div>
          <span className="eyebrow">{COMPANY_NAME} / CEO Dashboard</span>
          <h2>{currentUser?.name || "Faisal Javed"}</h2>
          <p>Company performance, department comparison, best employees, weak areas, reviews, and PDF reports.</p>
        </div>
        <ProgressCircle value={companyPerformance} size={132} label="Company" />
      </section>
      <div className="metric-grid">
        <MetricCard icon={TrendingUp} label="Company performance" value={`${companyPerformance}%`} change="From attendance and tasks" />
        <MetricCard icon={Users} label="Employees" value={employees.length} change="Added by department heads" tone="emerald" />
        <MetricCard icon={UserCheck} label="Present today" value={present} change="Attendance overview" tone="green" />
        <MetricCard icon={UserX} label="Absent today" value={employees.length - present} change="Absent = 0%" tone="rose" />
      </div>
      <PerformanceChart />
      <section className="panel">
        <div className="panel-heading"><div><span className="eyebrow">Best Employees</span><h3>Top performers</h3></div><Award size={20} /></div>
        <RankingList employees={employees.slice(0, 5)} />
      </section>
      <section className="panel">
        <div className="panel-heading"><div><span className="eyebrow">Weak Departments</span><h3>Needs attention</h3></div><AlertTriangle size={20} /></div>
        <DepartmentBars departments={departments} />
      </section>
      <section className="panel wide">
        <div className="panel-heading"><div><span className="eyebrow">CEO Reviews</span><h3>Employee remarks</h3></div><button className="primary-button" onClick={() => onExport("Company Report")}><Download size={16} /> PDF Report</button></div>
        <EmployeeGrid employees={employees} onRemark={onRemark} />
      </section>
    </div>
  );
}

function HeadDashboard({ currentUser, employees, tasks, attendance, onOpenEmployee, onOpenTask, actions }) {
  const myEmployees = employees.filter((employee) => employee.department === currentUser.department);
  const present = myEmployees.filter((employee) => employee.attendance === "PRESENT").length;
  const deptPerformance = myEmployees.length ? Math.round(myEmployees.reduce((sum, employee) => sum + employee.daily, 0) / myEmployees.length) : 0;
  const assignableEmployees = myEmployees.filter((employee) => employee.attendance !== "ABSENT");

  return (
    <div className="view-grid">
      <section className="hero-band">
        <div>
          <span className="eyebrow">Department Head Panel</span>
          <h2>{currentUser.department}</h2>
          <p>Create employee accounts, mark attendance, assign tasks only to present employees, and update task details.</p>
        </div>
        <ProgressCircle value={deptPerformance} size={132} label="Dept" />
      </section>
      <div className="metric-grid">
        <MetricCard icon={Users} label="My employees" value={myEmployees.length} change="Department scope only" />
        <MetricCard icon={UserCheck} label="Present" value={present} change="Eligible for task assignment" tone="green" />
        <MetricCard icon={UserX} label="Absent" value={myEmployees.length - present} change="0% today and hidden from tasks" tone="rose" />
        <MetricCard icon={CalendarDays} label="Assignable" value={assignableEmployees.length} change="Present employees" tone="emerald" />
      </div>
      <section className="panel wide">
        <div className="panel-heading"><div><span className="eyebrow">My Employees</span><h3>Employee control and credentials</h3></div><button className="primary-button" onClick={onOpenEmployee}><UserPlus size={16} /> Employee</button></div>
        <EmployeeGrid employees={myEmployees} canDelete onDelete={actions.deleteEmployee} />
      </section>
      <section className="panel">
        <div className="panel-heading"><div><span className="eyebrow">Attendance</span><h3>Today</h3></div></div>
        <AttendanceEditor employees={myEmployees} attendance={attendance} onAttendance={actions.setAttendance} />
      </section>
      <section className="panel">
        <div className="panel-heading"><div><span className="eyebrow">Tasks</span><h3>Assign and edit</h3></div><button className="primary-button" onClick={onOpenTask}><Plus size={16} /> Task</button></div>
        <TaskList tasks={tasks.filter((task) => myEmployees.some((employee) => employee.id === task.employeeId))} onStatus={actions.updateTaskStatus} onDescription={actions.updateTaskDescription} />
      </section>
    </div>
  );
}

function EmployeeDashboard({ currentUser, employees, tasks }) {
  const employee = employees.find((item) => item.id === currentUser.employeeId);
  if (!employee) return <EmptyState title="No employee profile" text="Your employee account is not connected to an active profile." />;
  const myTasks = tasks.filter((task) => task.employeeId === employee.id);

  return (
    <div className="view-grid">
      <section className="hero-band">
        <div>
          <span className="eyebrow">Employee Panel</span>
          <h2>{employee.name}</h2>
          <p>{employee.designation} / {employee.department}. Assigned tasks, attendance, and performance are shown here.</p>
        </div>
        <ProgressCircle value={employee.daily} size={132} label="Daily" />
      </section>
      <div className="metric-grid">
        <MetricCard icon={UserCheck} label="Attendance" value={employee.attendance} change="Today" />
        <MetricCard icon={TrendingUp} label="Weekly" value={`${employee.weekly}%`} change="Performance average" tone="emerald" />
        <MetricCard icon={CalendarDays} label="Tasks" value={myTasks.length} change="Assigned to you" tone="green" />
        <MetricCard icon={Award} label="Rank" value={`#${employee.rank}`} change="Company ranking" tone="rose" />
      </div>
      <section className="panel"><div className="panel-heading"><div><span className="eyebrow">My Tasks</span><h3>Task descriptions and status</h3></div></div><TaskList tasks={myTasks} readOnly /></section>
      <section className="panel"><div className="panel-heading"><div><span className="eyebrow">Performance Trend</span><h3>Monthly view</h3></div></div><MiniEmployeeChart employee={employee} /></section>
    </div>
  );
}

function DepartmentsView({ departments }) {
  return (
    <div className="view-grid">
      <section className="panel wide">
        <div className="panel-heading"><div><span className="eyebrow">Department Dashboard</span><h3>Comparison and attendance</h3></div></div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={departments}>
            <CartesianGrid stroke="rgba(244,230,207,.08)" vertical={false} />
            <XAxis dataKey="code" stroke="#a79780" />
            <YAxis stroke="#a79780" />
            <Tooltip contentStyle={{ background: "#14110f", border: "1px solid rgba(216,197,165,.2)", borderRadius: 12 }} />
            <Bar dataKey="performance" fill="#c99a4d" radius={[8, 8, 0, 0]} />
            <Bar dataKey="taskCompletion" fill="#5dd6a5" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      {departments.map((department) => <DepartmentCard key={department.id} department={department} />)}
    </div>
  );
}

function EmployeesView({ employees, currentUser, onOpenEmployee, onDeleteEmployee, onRemark }) {
  const scopedEmployees = currentUser.role === "DEPARTMENT_HEAD" ? employees.filter((employee) => employee.department === currentUser.department) : employees;
  const canDelete = currentUser.role === "DEPARTMENT_HEAD";
  return (
    <section className="panel wide">
      <div className="panel-heading">
        <div><span className="eyebrow">Employee Management</span><h3>Profiles, credentials, rankings, and remarks</h3></div>
        {canDelete && <button className="primary-button" onClick={onOpenEmployee}><UserPlus size={16} /> Employee</button>}
      </div>
      <EmployeeGrid employees={scopedEmployees} canDelete={canDelete} onDelete={onDeleteEmployee} onRemark={currentUser.role === "CEO" ? onRemark : undefined} />
    </section>
  );
}

function TasksView({ currentUser, employees, tasks, onOpenTask, onStatus, onDescription }) {
  const visibleTasks = currentUser.role === "EMPLOYEE"
    ? tasks.filter((task) => task.employeeId === currentUser.employeeId)
    : currentUser.role === "DEPARTMENT_HEAD"
      ? tasks.filter((task) => employees.filter((employee) => employee.department === currentUser.department).some((employee) => employee.id === task.employeeId))
      : tasks;

  return (
    <section className="panel wide">
      <div className="panel-heading"><div><span className="eyebrow">Task Management</span><h3>Status, descriptions, reasons, and scoring</h3></div>{currentUser.role === "DEPARTMENT_HEAD" && <button className="primary-button" onClick={onOpenTask}><Plus size={16} /> Add task</button>}</div>
      <TaskList tasks={visibleTasks} onStatus={onStatus} onDescription={onDescription} readOnly={currentUser.role === "EMPLOYEE"} />
    </section>
  );
}

function AttendanceView({ currentUser, employees, attendance, onAttendance }) {
  const scopedEmployees = employees.filter((employee) => employee.department === currentUser.department);
  return <section className="panel wide"><div className="panel-heading"><div><span className="eyebrow">Attendance System</span><h3>Present / Absent</h3></div></div><AttendanceEditor employees={scopedEmployees} attendance={attendance} onAttendance={onAttendance} /></section>;
}

function ReportsView({ currentUser, onExport }) {
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [showCustomRange, setShowCustomRange] = useState(false);
  const reportTypes = currentUser.role === "EMPLOYEE"
    ? [
      { type: "daily", title: "Daily Report", hint: "Today" },
      { type: "weekly", title: "Weekly Report", hint: "Last 7 days" },
      { type: "monthly", title: "Monthly Report", hint: "This month" },
      { type: "employee", title: "My Performance", hint: "Personal record" }
    ]
    : [
      { type: "daily", title: "Daily Report", hint: "Today" },
      { type: "weekly", title: "Weekly Report", hint: "Last 7 days" },
      { type: "monthly", title: "Monthly Report", hint: "This month" },
      { type: "quarterly", title: "Quarterly Report", hint: "This quarter" },
      { type: "yearly", title: "Yearly Report", hint: "This year" },
      { type: "custom", title: "Custom Range", hint: "Choose dates" },
      { type: "department", title: "Department Report", hint: currentUser.department || "All departments" },
      { type: "company", title: "Company Report", hint: "Full company" }
    ];

  const generate = (report) => {
    if (report.type === "custom" && (!customRange.start || !customRange.end)) {
      setShowCustomRange(true);
      return;
    }
    onExport(report, customRange);
  };

  return (
    <section className="panel wide">
      <div className="panel-heading"><div><span className="eyebrow">PDF Reporting System</span><h3>{COMPANY_NAME} reports</h3></div></div>
      <div className="report-grid">
        {reportTypes.map((report) => (
          <motion.article className={`report-card ${report.type === "custom" ? "custom-range-card" : ""}`} key={report.type} whileHover={{ y: -4 }}>
            <div className="file-icon"><Download size={20} /></div>
            <h3>{report.title}</h3>
            <span className="report-meta">{report.hint}</span>
            {report.type === "custom" && showCustomRange && (
              <div className="range-fields">
                <label>From<input type="date" value={customRange.start} onChange={(event) => setCustomRange((value) => ({ ...value, start: event.target.value }))} /></label>
                <label>To<input type="date" value={customRange.end} onChange={(event) => setCustomRange((value) => ({ ...value, end: event.target.value }))} /></label>
              </div>
            )}
            <button onClick={() => generate(report)}>{report.type === "custom" && !showCustomRange ? "Select Range" : "Download PDF"}</button>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function AnalyticsView({ employees }) {
  return (
    <div className="view-grid">
      <section className="panel wide">
        <div className="panel-heading"><div><span className="eyebrow">Advanced Analytics</span><h3>Productivity index and distribution</h3></div></div>
        <div className="metric-grid compact">
          <MetricCard icon={TrendingUp} label="Productivity index" value={employees.length ? `${Math.round(employees.reduce((sum, employee) => sum + employee.daily, 0) / employees.length)}%` : "0%"} change="Average daily performance" />
          <MetricCard icon={Activity} label="Employees" value={employees.length} change="Current records" tone="emerald" />
          <MetricCard icon={CalendarDays} label="Completed tasks" value={employees.reduce((sum, employee) => sum + employee.completedTasks, 0)} change="Completion volume" tone="rose" />
        </div>
        <ResponsiveContainer width="100%" height={310}>
          <BarChart data={employees}><CartesianGrid stroke="rgba(244,230,207,.08)" vertical={false} /><XAxis dataKey="employeeCode" stroke="#a79780" /><YAxis stroke="#a79780" /><Tooltip contentStyle={{ background: "#14110f", border: "1px solid rgba(216,197,165,.2)", borderRadius: 12 }} /><Bar dataKey="monthly" fill="#c99a4d" radius={[8, 8, 0, 0]} /><Bar dataKey="weekly" fill="#5dd6a5" radius={[8, 8, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

function PerformanceChart() {
  return (
    <section className="panel wide">
      <div className="panel-heading"><div><span className="eyebrow">Trend Analytics</span><h3>Performance trajectory</h3></div></div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={trendData}><defs><linearGradient id="companyGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c99a4d" stopOpacity={0.65} /><stop offset="95%" stopColor="#c99a4d" stopOpacity={0.04} /></linearGradient></defs><CartesianGrid stroke="rgba(244,230,207,.08)" vertical={false} /><XAxis dataKey="label" stroke="#a79780" /><YAxis stroke="#a79780" /><Tooltip contentStyle={{ background: "#14110f", border: "1px solid rgba(216,197,165,.2)", borderRadius: 12 }} /><Area type="monotone" dataKey="company" stroke="#c99a4d" fill="url(#companyGlow)" strokeWidth={3} /></AreaChart>
      </ResponsiveContainer>
    </section>
  );
}

function DepartmentCard({ department }) {
  return (
    <motion.article className="department-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="card-topline"><span>{department.code}</span><b>{department.performance}%</b></div>
      <h3>{department.name}</h3>
      <p>Head: {department.head}</p>
      <div className="split-stats"><span><strong>{department.totalEmployees}</strong>Employees</span><span><strong>{department.presentEmployees}</strong>Present</span><span><strong>{department.absentEmployees}</strong>Absent</span></div>
      <div className="bar-meter"><motion.i initial={{ width: 0 }} animate={{ width: `${department.taskCompletion}%` }} /></div>
      <small>{department.taskCompletion}% task completion</small>
    </motion.article>
  );
}

function EmployeeGrid({ employees, canDelete, onDelete, onRemark }) {
  if (!employees.length) return <EmptyState title="No employees found" text="Department heads can create employees with login credentials." />;
  return <div className="employee-grid">{employees.map((employee, index) => <EmployeeCard key={employee.id} employee={employee} index={index} canDelete={canDelete} onDelete={onDelete} onRemark={onRemark} />)}</div>;
}

function EmployeeCard({ employee, index, canDelete, onDelete, onRemark }) {
  const sparkline = useMemo(() => trendData.map((point, i) => ({ label: point.label, value: Math.max(0, Math.min(100, employee.monthly + (i - 2) * 3)) })), [employee.monthly]);
  return (
    <motion.article className="employee-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} whileHover={{ y: -5 }}>
      <div className="employee-head"><div className="avatar">{employee.name.split(" ").map((part) => part[0]).join("")}</div><div><h3>{employee.name}</h3><span>{employee.employeeCode} / {employee.department}</span></div><b className="rank-badge">#{employee.rank}</b></div>
      <div className="employee-body"><ProgressCircle value={employee.daily} size={92} label="Daily" /><div className="mini-chart"><ResponsiveContainer width="100%" height={86}><LineChart data={sparkline}><Line type="monotone" dataKey="value" stroke="#5dd6a5" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div></div>
      <div className="split-stats"><span><strong>{employee.attendance}</strong>Attendance</span><span><strong>{employee.monthly}%</strong>Monthly</span><span><strong>{employee.totalTasks}</strong>Tasks</span></div>
      <p className="remark">{employee.ceoRemark}</p>
      <div className="card-actions">{onRemark && <button onClick={() => onRemark(employee.id)}>CEO remark</button>}{canDelete && <button className="danger-button" onClick={() => onDelete(employee.id)}><Trash2 size={16} /> Delete</button>}</div>
    </motion.article>
  );
}

function TaskList({ tasks, onStatus, onDescription, readOnly }) {
  if (!tasks.length) return <EmptyState title="No tasks found" text="Tasks appear here after assignment to a present employee." />;
  return (
    <div className="table-shell"><table><thead><tr><th>Task</th><th>Description</th><th>Owner</th><th>Status</th><th>Reason</th><th>Action</th></tr></thead><tbody>{tasks.map((task) => <tr key={task.id}><td>{task.title}</td><td>{readOnly ? task.description : <textarea value={task.description} onChange={(event) => onDescription(task.id, event.target.value)} />}</td><td>{task.owner}</td><td><span className={`status ${task.status.toLowerCase().replace(" ", "-")}`}>{task.status}</span></td><td>{task.reason || "No delay reason"}</td><td>{readOnly ? "View only" : <select value={task.status} onChange={(event) => onStatus(task.id, event.target.value)}><option>Done</option><option>In Progress</option><option>Not Done</option></select>}</td></tr>)}</tbody></table></div>
  );
}

function AttendanceEditor({ employees, attendance, onAttendance }) {
  if (!employees.length) return <EmptyState title="No employees" text="No attendance records available." />;
  return <div className="action-list">{employees.map((employee) => <div className="attendance-row" key={employee.id}><strong>{employee.name}</strong><span>{attendance[employee.id] || employee.attendance}</span><button onClick={() => onAttendance(employee.id, "PRESENT")}>Present</button><button onClick={() => onAttendance(employee.id, "ABSENT")}>Absent</button></div>)}</div>;
}

function Modal({ title, children, onClose }) {
  return <div className="modal-backdrop"><motion.div className="modal-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><div className="panel-heading"><h3>{title}</h3><button className="link-button" onClick={onClose}>Close</button></div>{children}</motion.div></div>;
}

function EmptyState({ title, text }) {
  return <div className="empty-state"><Users size={34} /><h3>{title}</h3><p>{text}</p></div>;
}

function RankingList({ employees }) {
  if (!employees.length) return <EmptyState title="No rankings yet" text="Rankings will appear after employees and tasks are added." />;
  return <div className="ranking-list">{employees.map((employee) => <div key={employee.id}><span>#{employee.rank}</span><strong>{employee.name}</strong><b>{employee.monthly}%</b></div>)}</div>;
}

function DepartmentBars({ departments }) {
  return <div className="department-bars">{departments.slice().sort((a, b) => a.performance - b.performance).map((department) => <div key={department.id}><span>{department.name}</span><div><i style={{ width: `${department.performance}%` }} /></div><b>{department.performance}%</b></div>)}</div>;
}

function MiniEmployeeChart({ employee }) {
  const data = trendData.map((point, index) => ({ label: point.label, value: Math.max(0, Math.min(100, employee.monthly + index * 2 - 5)) }));
  return <ResponsiveContainer width="100%" height={260}><LineChart data={data}><CartesianGrid stroke="rgba(244,230,207,.08)" vertical={false} /><XAxis dataKey="label" stroke="#a79780" /><YAxis stroke="#a79780" /><Tooltip contentStyle={{ background: "#14110f", border: "1px solid rgba(216,197,165,.2)", borderRadius: 12 }} /><Line type="monotone" dataKey="value" stroke="#c99a4d" strokeWidth={3} /></LineChart></ResponsiveContainer>;
}

function toDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function getReportRange(type, customRange) {
  const now = new Date();
  const todayValue = toDateInput(now);
  const start = new Date(now);
  if (type === "daily") return { from: todayValue, to: todayValue, label: todayValue };
  if (type === "weekly") {
    start.setDate(now.getDate() - 6);
    return { from: toDateInput(start), to: todayValue, label: `${toDateInput(start)} to ${todayValue}` };
  }
  if (type === "monthly") {
    start.setDate(1);
    return { from: toDateInput(start), to: todayValue, label: `${toDateInput(start)} to ${todayValue}` };
  }
  if (type === "quarterly") {
    start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
    return { from: toDateInput(start), to: todayValue, label: `${toDateInput(start)} to ${todayValue}` };
  }
  if (type === "yearly") {
    start.setMonth(0, 1);
    return { from: toDateInput(start), to: todayValue, label: `${toDateInput(start)} to ${todayValue}` };
  }
  if (type === "custom") return { from: customRange.start, to: customRange.end, label: `${customRange.start} to ${customRange.end}` };
  return { from: "", to: "", label: "All available records" };
}

function taskInRange(task, range) {
  if (!range.from || !range.to) return true;
  const value = String(task.taskDate || task.createdAt || toDateInput(new Date())).slice(0, 10);
  return value >= range.from && value <= range.to;
}

function escapePdfText(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\r?\n/g, " ");
}

function wrapPdfLine(value, limit = 88) {
  const words = String(value ?? "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    if (`${line} ${word}`.trim().length > limit) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function downloadPdfReport({ title, range, scope, generatedBy, employees, tasks }) {
  const average = employees.length ? Math.round(employees.reduce((sum, employee) => sum + employee.daily, 0) / employees.length) : 0;
  const lines = [
    COMPANY_NAME,
    title,
    `Scope: ${scope}`,
    `Date Range: ${range.label}`,
    `Generated: ${new Date().toLocaleString()}`,
    `Generated By: ${generatedBy}`,
    "",
    `Summary: ${employees.length} employee(s), ${tasks.length} task(s), ${average}% average daily performance`,
    "",
    "Employee Performance",
    "Name | ID | Department | Attendance | Daily | Weekly | Monthly"
  ];

  employees.forEach((employee) => {
    lines.push(`${employee.name} | ${employee.employeeCode} | ${employee.department} | ${employee.attendance} | ${employee.daily}% | ${employee.weekly}% | ${employee.monthly}%`);
    if (employee.ceoRemark) lines.push(`CEO Remark: ${employee.ceoRemark}`);
  });

  lines.push("", "Task History", "Task | Owner | Department | Status | Date | Reason");
  tasks.forEach((task) => {
    lines.push(`${task.title} | ${task.owner} | ${task.department} | ${task.status} | ${String(task.taskDate || "").slice(0, 10) || "Current"} | ${task.reason || "No delay reason"}`);
    wrapPdfLine(`Description: ${task.description || "No description"}`, 92).forEach((line) => lines.push(line));
  });
  if (!tasks.length) lines.push("No task records for this report.");

  const pdfLines = lines.flatMap((line) => wrapPdfLine(line));
  const pages = [];
  for (let i = 0; i < pdfLines.length; i += 42) pages.push(pdfLines.slice(i, i + 42));

  const objects = ["", "<< /Type /Catalog /Pages 2 0 R >>"];
  const pageIds = pages.map((_, index) => 3 + index * 2);
  objects.push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`);

  pages.forEach((pageLines, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    const content = [
      "BT",
      "/F1 11 Tf",
      "50 790 Td",
      "14 TL",
      ...pageLines.map((line, lineIndex) => `${lineIndex ? "T*" : ""} (${escapePdfText(line)}) Tj`),
      "ET"
    ].join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.slice(1).forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState("");
  const [activeView, setActiveView] = useState("ceo");
  const [baseEmployees, setBaseEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [departments, setDepartments] = useState(defaultDepartments);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);

  const allEmployees = useMemo(() => calculateEmployees(baseEmployees, tasks, attendance), [baseEmployees, tasks, attendance]);
  const employees = useMemo(() => {
    if (!searchTerm.trim()) return allEmployees;
    const needle = searchTerm.toLowerCase();
    return allEmployees.filter((employee) => [employee.name, employee.employeeCode, employee.department, employee.designation, employee.email].some((value) => value.toLowerCase().includes(needle)));
  }, [allEmployees, searchTerm]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const applyServerData = (data) => {
    if (!data) return;
    setDepartments(data.departments?.length ? data.departments : defaultDepartments);
    setBaseEmployees(data.employees || []);
    setTasks(data.tasks || []);
    setAttendance(data.attendance || {});
  };

  const request = async (path, options = {}, authToken = token) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "Request failed");
    return payload;
  };

  const completeLogin = async (payload, toastMessage) => {
    setToken(payload.token);
    setCurrentUser(payload.user);
    setActiveView(firstViewByRole[payload.user.role]);
    const data = await request("/manage/bootstrap", {}, payload.token);
    applyServerData(data);
    setToast(toastMessage || `${payload.user.label} signed in`);
    return payload.user;
  };

  const login = async (email, password) => {
    try {
      const payload = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      }, "");
      return await completeLogin(payload);
    } catch (error) {
      setToast(error.message);
      return null;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const ssoToken = params.get("ssoToken");
    const ssoUser = params.get("ssoUser");
    if (!ssoToken || !ssoUser) return;
    const paddedUser = ssoUser.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(ssoUser.length / 4) * 4, "=");

    window.history.replaceState({}, document.title, window.location.pathname);
    completeLogin({
      token: ssoToken,
      user: JSON.parse(atob(paddedUser))
    }, "CEO signed in with SSO").catch((error) => {
      setCurrentUser(null);
      setToken("");
      setToast(error.message || "SSO login failed");
    });
  }, []);

  const addEmployee = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));
    try {
      const payload = await request("/manage/employees", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          employeeCode: form.get("employeeCode"),
          designation: form.get("designation"),
          email,
          password
        })
      });
      applyServerData(payload.data);
      setModal(null);
      setToast(`Employee saved in DB. Login email: ${email}`);
    } catch (error) {
      setToast(error.message);
    }
  };

  const deleteEmployee = async (employeeId) => {
    const employee = baseEmployees.find((item) => item.id === employeeId);
    if (!employee || !window.confirm(`Delete ${employee.name}?`)) return;
    try {
      const payload = await request(`/manage/employees/${employeeId}`, { method: "DELETE" });
      applyServerData(payload.data);
      setToast("Employee deleted in DB");
    } catch (error) {
      setToast(error.message);
    }
  };

  const addTask = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const employee = allEmployees.find((item) => item.id === form.get("employeeId"));
    if (!employee || employee.attendance === "ABSENT") {
      setToast("Absent employees cannot receive tasks today");
      return;
    }
    try {
      const payload = await request("/manage/tasks", {
        method: "POST",
        body: JSON.stringify({
          employeeId: employee.id,
          title: form.get("title"),
          description: form.get("description"),
          status: form.get("status"),
          reason: form.get("reason")
        })
      });
      applyServerData(payload.data);
      setModal(null);
      setToast("Task saved in DB");
    } catch (error) {
      setToast(error.message);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const payload = await request(`/manage/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      applyServerData(payload.data);
      setToast("Task status saved in DB");
    } catch (error) {
      setToast(error.message);
    }
  };

  const updateTaskDescription = async (taskId, description) => {
    setTasks((items) => items.map((task) => task.id === taskId ? { ...task, description } : task));
    try {
      const payload = await request(`/manage/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ description })
      });
      applyServerData(payload.data);
    } catch (error) {
      setToast(error.message);
    }
  };

  const updateAttendance = async (employeeId, status) => {
    try {
      const payload = await request("/manage/attendance", {
        method: "POST",
        body: JSON.stringify({ employeeId, status })
      });
      applyServerData(payload.data);
      setToast(status === "ABSENT" ? "Absent saved in DB. Performance is 0% and employee is hidden from task assignment." : "Present saved in DB. Employee can receive tasks.");
    } catch (error) {
      setToast(error.message);
    }
  };

  const addRemark = (employeeId) => {
    const remark = window.prompt("Enter CEO remark");
    if (!remark) return;
    setBaseEmployees((items) => items.map((employee) => employee.id === employeeId ? { ...employee, ceoRemark: remark } : employee));
    setToast("CEO remark saved");
  };

  const exportReport = (report, customRange = {}) => {
    const range = getReportRange(report.type, customRange);
    const scopedEmployees = currentUser.role === "EMPLOYEE"
      ? employees.filter((employee) => employee.id === currentUser.employeeId)
      : currentUser.role === "DEPARTMENT_HEAD" || report.type === "department"
        ? employees.filter((employee) => employee.department === currentUser.department)
        : employees;
    const scopedTasks = tasks
      .filter((task) => scopedEmployees.some((employee) => employee.id === task.employeeId))
      .filter((task) => taskInRange(task, range));
    const scope = currentUser.role === "EMPLOYEE"
      ? currentUser.name
      : currentUser.role === "DEPARTMENT_HEAD" || report.type === "department"
        ? currentUser.department
        : "Company";

    downloadPdfReport({
      title: `${report.title} - ${scope}`,
      range,
      scope,
      generatedBy: currentUser.name || currentUser.email,
      employees: scopedEmployees,
      tasks: scopedTasks
    });
    setToast(`${report.title} downloaded`);
  };

  if (!currentUser) return <LoginScreen onLogin={login} />;

  const visibleDepartments = departments.map((department) => {
    const deptEmployees = allEmployees.filter((employee) => employee.department === department.name);
    const deptTasks = tasks.filter((task) => task.department === department.name);
    const present = deptEmployees.filter((employee) => employee.attendance === "PRESENT").length;
    return {
      ...department,
      totalEmployees: deptEmployees.length,
      presentEmployees: present,
      absentEmployees: deptEmployees.length - present,
      performance: deptEmployees.length ? Math.round(deptEmployees.reduce((sum, employee) => sum + employee.daily, 0) / deptEmployees.length) : 0,
      taskCompletion: deptTasks.length ? Math.round((deptTasks.filter((task) => task.status === "Done").length / deptTasks.length) * 100) : 0
    };
  });

  const assignableEmployees = allEmployees.filter((employee) => employee.department === currentUser.department && employee.attendance !== "ABSENT");

  const actions = {
    setAttendance: updateAttendance,
    updateTaskStatus,
    updateTaskDescription,
    deleteEmployee
  };

  const views = {
    ceo: <CEODashboard currentUser={currentUser} employees={employees} departments={visibleDepartments} onRemark={addRemark} onExport={() => exportReport({ type: "company", title: "Company Report" })} />,
    head: <HeadDashboard currentUser={currentUser} employees={employees} tasks={tasks} attendance={attendance} onOpenEmployee={() => setModal("employee")} onOpenTask={() => setModal("task")} actions={actions} />,
    employee: <EmployeeDashboard currentUser={currentUser} employees={employees} tasks={tasks} />,
    departments: <DepartmentsView departments={visibleDepartments} />,
    employees: <EmployeesView employees={employees} currentUser={currentUser} onOpenEmployee={() => setModal("employee")} onDeleteEmployee={deleteEmployee} onRemark={addRemark} />,
    attendance: <AttendanceView currentUser={currentUser} employees={employees} attendance={attendance} onAttendance={updateAttendance} />,
    tasks: <TasksView currentUser={currentUser} employees={employees} tasks={tasks} onOpenTask={() => setModal("task")} onStatus={updateTaskStatus} onDescription={updateTaskDescription} />,
    reports: <ReportsView currentUser={currentUser} onExport={exportReport} />,
    analytics: <AnalyticsView employees={employees} />
  };

  return (
    <>
      <Layout
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={currentUser}
        onLogout={() => { setCurrentUser(null); setToken(""); setToast("Signed out"); }}
        navItems={navByRole[currentUser.role]}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        unreadCount={0}
        onNotifications={() => setToast("No unread notifications")}
      >
        {views[activeView]}
      </Layout>
      {toast && <button className="toast" onClick={() => setToast("")}>{toast}</button>}
      {modal === "employee" && <Modal title="Create Employee + Login Credentials" onClose={() => setModal(null)}><form className="stack-form" onSubmit={addEmployee}><input name="name" required placeholder="Employee Name" /><input name="employeeCode" required placeholder="Employee ID" /><input name="designation" required placeholder="Designation" /><input name="email" type="email" required placeholder="Employee login email" /><input name="password" type="password" required minLength="6" placeholder="Employee login password" /><button className="primary-button"><Save size={16} /> Save Employee</button></form></Modal>}
      {modal === "task" && <Modal title="Assign Task to Present Employee" onClose={() => setModal(null)}>{assignableEmployees.length ? <form className="stack-form" onSubmit={addTask}><select name="employeeId">{assignableEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select><input name="title" required placeholder="Task Title" /><textarea name="description" required placeholder="Task Description" /><select name="status"><option>Done</option><option>In Progress</option><option>Not Done</option></select><input name="reason" placeholder="Reason / Delay note" /><button className="primary-button"><Save size={16} /> Save Task</button></form> : <EmptyState title="No present employees" text="Mark an employee present before assigning tasks." />}</Modal>}
    </>
  );
}
