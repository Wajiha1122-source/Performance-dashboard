import { attendance, departments, employees, performanceTrend, tasks } from "../config/demoData.js";

const scoreByStatus = {
  DONE: 100,
  IN_PROGRESS: 50,
  NOT_DONE: 0
};

export function calculateDailyPerformance(employeeId, date = "2026-06-21") {
  const dayAttendance = attendance.find((item) => item.employeeId === employeeId && item.date === date);
  if (!dayAttendance || dayAttendance.status === "ABSENT") {
    return {
      attendance: dayAttendance?.status ?? "ABSENT",
      daily: 0,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      notDoneTasks: 0
    };
  }

  const dayTasks = tasks.filter((task) => task.employeeId === employeeId && task.date === date);
  if (dayTasks.length === 0) {
    return {
      attendance: "PRESENT",
      daily: 0,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      notDoneTasks: 0
    };
  }

  const total = dayTasks.reduce((sum, task) => sum + scoreByStatus[task.status], 0);
  return {
    attendance: "PRESENT",
    daily: Math.round(total / dayTasks.length),
    totalTasks: dayTasks.length,
    completedTasks: dayTasks.filter((task) => task.status === "DONE").length,
    inProgressTasks: dayTasks.filter((task) => task.status === "IN_PROGRESS").length,
    notDoneTasks: dayTasks.filter((task) => task.status === "NOT_DONE").length
  };
}

export function buildEmployeeCards(date = "2026-06-21") {
  return employees.map((employee) => {
    const stats = calculateDailyPerformance(employee.id, date);
    const weekly = Math.max(0, Math.min(100, stats.daily + employee.employeeCode.length));
    const monthly = Math.max(0, Math.min(100, Math.round((weekly + stats.daily + 74) / 3)));
    return {
      ...employee,
      ...stats,
      weekly,
      monthly,
      trend: performanceTrend.map((point, index) => ({
        label: point.label,
        value: Math.max(22, Math.min(98, monthly + ((index % 3) - 1) * 7))
      })),
      ceoRemark: stats.daily >= 80 ? "Ready for stretch goals." : stats.daily === 0 ? "Review attendance and blockers." : "Needs a focused weekly recovery plan."
    };
  }).sort((a, b) => b.monthly - a.monthly);
}

export function buildDepartmentAnalytics(date = "2026-06-21") {
  const cards = buildEmployeeCards(date);
  return departments.map((department) => {
    const deptEmployees = cards.filter((employee) => employee.department === department.name);
    const present = deptEmployees.filter((employee) => employee.attendance === "PRESENT").length;
    const taskCount = deptEmployees.reduce((sum, employee) => sum + employee.totalTasks, 0);
    const completed = deptEmployees.reduce((sum, employee) => sum + employee.completedTasks, 0);
    const performance = deptEmployees.length
      ? Math.round(deptEmployees.reduce((sum, employee) => sum + employee.daily, 0) / deptEmployees.length)
      : 0;

    return {
      ...department,
      totalEmployees: deptEmployees.length,
      presentEmployees: present,
      absentEmployees: deptEmployees.length - present,
      performance,
      taskCompletion: taskCount ? Math.round((completed / taskCount) * 100) : 0,
      rankings: deptEmployees,
      recentActivities: [
        `${department.head} reviewed today's attendance`,
        `${completed} completed tasks recorded`,
        `${deptEmployees.length - present} absence exceptions logged`
      ]
    };
  }).sort((a, b) => b.performance - a.performance);
}

export function buildExecutiveSummary(date = "2026-06-21") {
  const employeeCards = buildEmployeeCards(date);
  const departmentAnalytics = buildDepartmentAnalytics(date);
  const activeEmployees = employeeCards.filter((employee) => employee.active);
  const companyPerformance = Math.round(
    activeEmployees.reduce((sum, employee) => sum + employee.daily, 0) / Math.max(activeEmployees.length, 1)
  );

  return {
    companyPerformance,
    totalEmployees: activeEmployees.length,
    presentEmployees: activeEmployees.filter((employee) => employee.attendance === "PRESENT").length,
    absentEmployees: activeEmployees.filter((employee) => employee.attendance === "ABSENT").length,
    topEmployees: employeeCards.slice(0, 3),
    lowestEmployees: [...employeeCards].reverse().slice(0, 3),
    topDepartments: departmentAnalytics.slice(0, 2),
    weakDepartments: [...departmentAnalytics].reverse().slice(0, 2),
    departmentAnalytics,
    employeeCards,
    performanceTrend,
    productivityIndex: Math.round((companyPerformance * 0.55) + (departmentAnalytics[0]?.taskCompletion ?? 0) * 0.25 + 18),
    heatmap: departmentAnalytics.flatMap((department) =>
      ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => ({
        department: department.code,
        day,
        value: Math.max(10, Math.min(100, department.performance + (index - 2) * 5))
      }))
    )
  };
}
