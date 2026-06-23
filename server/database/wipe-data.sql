TRUNCATE TABLE
  audit_logs,
  reports,
  notifications,
  ceo_remarks,
  performance_records,
  tasks,
  attendance,
  employees,
  users
RESTART IDENTITY CASCADE;

DELETE FROM roles WHERE name::text NOT IN ('CEO', 'DEPARTMENT_HEAD', 'EMPLOYEE');

INSERT INTO roles (name, description) VALUES
  ('CEO', 'Executive visibility and performance reviews'),
  ('DEPARTMENT_HEAD', 'Department employee, attendance and task management'),
  ('EMPLOYEE', 'Personal performance visibility')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO departments (name, code) VALUES
  ('IT Department', 'IT'),
  ('HR / Finance Department', 'HRF'),
  ('FJ Office Sales', 'FJ-SALES'),
  ('IC Office Sales', 'IC-SALES')
ON CONFLICT (name) DO UPDATE SET code = EXCLUDED.code;

INSERT INTO users (role_id, name, email, password_hash)
SELECT id, 'Faisal Javed', 'ceo@company.test', '$2a$10$CYGQJLrd3QB1/vsvN4fn8utp.VqaYEZu1gKTiktIgcTi4V6hRGcbq'
FROM roles WHERE name = 'CEO'
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role_id = EXCLUDED.role_id, password_hash = EXCLUDED.password_hash;

INSERT INTO users (role_id, name, email, password_hash)
SELECT id, 'Wajiha Azeem', 'ithead@company.test', '$2a$10$CYGQJLrd3QB1/vsvN4fn8utp.VqaYEZu1gKTiktIgcTi4V6hRGcbq'
FROM roles WHERE name = 'DEPARTMENT_HEAD'
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role_id = EXCLUDED.role_id, password_hash = EXCLUDED.password_hash;

INSERT INTO users (role_id, name, email, password_hash)
SELECT id, 'Finance Head', 'financehead@company.test', '$2a$10$CYGQJLrd3QB1/vsvN4fn8utp.VqaYEZu1gKTiktIgcTi4V6hRGcbq'
FROM roles WHERE name = 'DEPARTMENT_HEAD'
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role_id = EXCLUDED.role_id, password_hash = EXCLUDED.password_hash;

INSERT INTO users (role_id, name, email, password_hash)
SELECT id, 'FJ Sales Head', 'fjsaleshead@company.test', '$2a$10$CYGQJLrd3QB1/vsvN4fn8utp.VqaYEZu1gKTiktIgcTi4V6hRGcbq'
FROM roles WHERE name = 'DEPARTMENT_HEAD'
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role_id = EXCLUDED.role_id, password_hash = EXCLUDED.password_hash;

INSERT INTO users (role_id, name, email, password_hash)
SELECT id, 'IC Sales Head', 'icsaleshead@company.test', '$2a$10$CYGQJLrd3QB1/vsvN4fn8utp.VqaYEZu1gKTiktIgcTi4V6hRGcbq'
FROM roles WHERE name = 'DEPARTMENT_HEAD'
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role_id = EXCLUDED.role_id, password_hash = EXCLUDED.password_hash;

UPDATE departments
SET head_user_id = (SELECT id FROM users WHERE email = 'ithead@company.test')
WHERE name = 'IT Department';

UPDATE departments
SET head_user_id = (SELECT id FROM users WHERE email = 'financehead@company.test')
WHERE name = 'HR / Finance Department';

UPDATE departments
SET head_user_id = (SELECT id FROM users WHERE email = 'fjsaleshead@company.test')
WHERE name = 'FJ Office Sales';

UPDATE departments
SET head_user_id = (SELECT id FROM users WHERE email = 'icsaleshead@company.test')
WHERE name = 'IC Office Sales';
