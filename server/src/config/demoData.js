export const roles = ["CEO", "DEPARTMENT_HEAD", "EMPLOYEE"];

export const departments = [
  { id: "dept-it", name: "IT Department", code: "IT", head: "Wajiha Azeem", active: true },
  { id: "dept-hr", name: "HR / Finance Department", code: "HRF", head: "Finance Head", active: true },
  { id: "dept-fj", name: "FJ Office Sales", code: "FJ-SALES", head: "FJ Sales Head", active: true },
  { id: "dept-ic", name: "IC Office Sales", code: "IC-SALES", head: "IC Sales Head", active: true }
];

export const users = [
  { id: "u-ceo", name: "Faisal Javed", email: "ceo@company.test", role: "CEO" },
  { id: "u-head-it", name: "Wajiha Azeem", email: "ithead@company.test", role: "DEPARTMENT_HEAD" },
  { id: "u-head-finance", name: "Finance Head", email: "financehead@company.test", role: "DEPARTMENT_HEAD" },
  { id: "u-head-fj", name: "FJ Sales Head", email: "fjsaleshead@company.test", role: "DEPARTMENT_HEAD" },
  { id: "u-head-ic", name: "IC Sales Head", email: "icsaleshead@company.test", role: "DEPARTMENT_HEAD" }
];

export const employees = [];
export const attendance = [];
export const tasks = [];

export const performanceTrend = [
  { label: "Jan", company: 0, IT: 0, HRF: 0, FJ: 0, IC: 0 },
  { label: "Feb", company: 0, IT: 0, HRF: 0, FJ: 0, IC: 0 },
  { label: "Mar", company: 0, IT: 0, HRF: 0, FJ: 0, IC: 0 },
  { label: "Apr", company: 0, IT: 0, HRF: 0, FJ: 0, IC: 0 },
  { label: "May", company: 0, IT: 0, HRF: 0, FJ: 0, IC: 0 },
  { label: "Jun", company: 0, IT: 0, HRF: 0, FJ: 0, IC: 0 }
];

export const notifications = [];
