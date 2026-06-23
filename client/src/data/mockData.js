export const trendData = [
  { label: "Jan", company: 72, IT: 78, HRF: 68, FJ: 71, IC: 70 },
  { label: "Feb", company: 76, IT: 82, HRF: 70, FJ: 73, IC: 76 },
  { label: "Mar", company: 74, IT: 79, HRF: 73, FJ: 70, IC: 74 },
  { label: "Apr", company: 81, IT: 86, HRF: 76, FJ: 82, IC: 79 },
  { label: "May", company: 84, IT: 88, HRF: 80, FJ: 83, IC: 85 },
  { label: "Jun", company: 79, IT: 83, HRF: 66, FJ: 64, IC: 75 }
];

export const departments = [
  { id: "dept-it", name: "IT Department", code: "IT", head: "Aarav Mehta", totalEmployees: 2, presentEmployees: 2, absentEmployees: 0, performance: 88, taskCompletion: 80 },
  { id: "dept-hr", name: "HR / Finance Department", code: "HRF", head: "Nadia Khan", totalEmployees: 1, presentEmployees: 0, absentEmployees: 1, performance: 66, taskCompletion: 74 },
  { id: "dept-ic", name: "IC Office Sales", code: "IC", head: "Omar Idris", totalEmployees: 1, presentEmployees: 1, absentEmployees: 0, performance: 75, taskCompletion: 50 },
  { id: "dept-fj", name: "FJ Office Sales", code: "FJ", head: "Mira Costa", totalEmployees: 2, presentEmployees: 1, absentEmployees: 1, performance: 64, taskCompletion: 28 }
];

export const employees = [
  { id: "emp-001", name: "Priya Shah", employeeCode: "EPD-001", department: "IT Department", designation: "Senior Frontend Engineer", attendance: "PRESENT", daily: 75, weekly: 82, monthly: 85, totalTasks: 2, completedTasks: 1, inProgressTasks: 1, notDoneTasks: 0, ceoRemark: "Ready for stretch goals.", rank: 1 },
  { id: "emp-002", name: "Lewis Carter", employeeCode: "EPD-002", department: "IT Department", designation: "Data Platform Engineer", attendance: "PRESENT", daily: 100, weekly: 90, monthly: 82, totalTasks: 2, completedTasks: 2, inProgressTasks: 0, notDoneTasks: 0, ceoRemark: "Excellent delivery consistency.", rank: 2 },
  { id: "emp-005", name: "Safiya Ali", employeeCode: "EPD-005", department: "IC Office Sales", designation: "Enterprise Account Executive", attendance: "PRESENT", daily: 75, weekly: 76, monthly: 75, totalTasks: 2, completedTasks: 1, inProgressTasks: 1, notDoneTasks: 0, ceoRemark: "Maintain momentum on renewals.", rank: 3 },
  { id: "emp-004", name: "Marco Silva", employeeCode: "EPD-004", department: "FJ Office Sales", designation: "Regional Sales Manager", attendance: "PRESENT", daily: 0, weekly: 52, monthly: 62, totalTasks: 1, completedTasks: 0, inProgressTasks: 0, notDoneTasks: 1, ceoRemark: "Needs a focused recovery plan.", rank: 4 },
  { id: "emp-003", name: "Hana Ito", employeeCode: "EPD-003", department: "HR / Finance Department", designation: "Payroll Lead", attendance: "ABSENT", daily: 0, weekly: 44, monthly: 61, totalTasks: 0, completedTasks: 0, inProgressTasks: 0, notDoneTasks: 0, ceoRemark: "Review attendance and blockers.", rank: 5 },
  { id: "emp-006", name: "Daniel Moore", employeeCode: "EPD-006", department: "FJ Office Sales", designation: "Sales Development Lead", attendance: "ABSENT", daily: 0, weekly: 39, monthly: 58, totalTasks: 0, completedTasks: 0, inProgressTasks: 0, notDoneTasks: 0, ceoRemark: "Inactive profile retained for history.", rank: 6 }
];

export const tasks = [
  { title: "Ship executive analytics widgets", owner: "Priya Shah", department: "IT Department", status: "Done", reason: "" },
  { title: "Optimize report query", owner: "Priya Shah", department: "IT Department", status: "In Progress", reason: "Waiting on production index metrics." },
  { title: "Close Q2 follow-ups", owner: "Marco Silva", department: "FJ Office Sales", status: "Not Done", reason: "Client decision postponed." },
  { title: "Prepare enterprise renewal deck", owner: "Safiya Ali", department: "IC Office Sales", status: "In Progress", reason: "Legal approval pending." }
];

export const notifications = [
  { title: "Low performance alert", message: "FJ Office Sales dropped below 70% for the current cycle.", type: "warning" },
  { title: "Report ready", message: "Monthly company performance report is ready for export.", type: "success" },
  { title: "CEO remark added", message: "Elena Brooks added a new review note for Priya Shah.", type: "info" }
];

export const auditLogs = [
  { actor: "Aarav Mehta", action: "Task status updated", time: "09:40" },
  { actor: "Elena Brooks", action: "CEO remark created", time: "10:15" },
  { actor: "Nadia Khan", action: "Attendance synced", time: "10:30" }
];
