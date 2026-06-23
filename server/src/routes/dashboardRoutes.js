import { Router } from "express";
import { attendance, departments, employees, notifications, tasks } from "../config/demoData.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { buildDepartmentAnalytics, buildEmployeeCards, buildExecutiveSummary } from "../services/performanceService.js";

const router = Router();

router.get("/summary", authenticate, (req, res) => {
  return res.json(buildExecutiveSummary(req.query.date));
});

router.get("/departments", authenticate, (req, res) => {
  return res.json(buildDepartmentAnalytics(req.query.date));
});

router.get("/employees", authenticate, (req, res) => {
  return res.json(buildEmployeeCards(req.query.date));
});

router.get("/activity", authenticate, (req, res) => {
  return res.json({
    notifications,
    auditLogs: [
      { id: "a-1", actor: "Aarav Mehta", action: "TASK_STATUS_UPDATED", entity: "tasks", createdAt: "2026-06-21T09:40:00Z" },
      { id: "a-2", actor: "Elena Brooks", action: "CEO_REMARK_CREATED", entity: "ceo_remarks", createdAt: "2026-06-21T10:15:00Z" },
      { id: "a-3", actor: "Nadia Khan", action: "ATTENDANCE_SYNCED", entity: "attendance", createdAt: "2026-06-21T10:30:00Z" }
    ]
  });
});

router.get("/reports", authenticate, authorize("CEO", "DEPARTMENT_HEAD"), (req, res) => {
  return res.json({
    company: "Employee Performance Dashboard",
    generatedAt: new Date().toISOString(),
    filters: req.query,
    departments,
    employees: buildEmployeeCards(req.query.date),
    attendance,
    tasks
  });
});

export default router;
