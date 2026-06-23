CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE role_name AS ENUM ('CEO', 'DEPARTMENT_HEAD', 'EMPLOYEE');
CREATE TYPE task_status AS ENUM ('DONE', 'IN_PROGRESS', 'NOT_DONE');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT');
CREATE TYPE report_period AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name role_name UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id),
  name VARCHAR(140) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  remember_token TEXT,
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(160) UNIQUE NOT NULL,
  code VARCHAR(24) UNIQUE NOT NULL,
  head_user_id UUID REFERENCES users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id),
  employee_code VARCHAR(40) UNIQUE NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  reporting_head_id UUID REFERENCES users(id),
  designation VARCHAR(120) NOT NULL,
  joining_date DATE NOT NULL,
  contact_number VARCHAR(40),
  email VARCHAR(180) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status attendance_status NOT NULL,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, attendance_date)
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id),
  title VARCHAR(180) NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'NOT_DONE',
  reason TEXT,
  task_date DATE NOT NULL,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE performance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id),
  record_date DATE NOT NULL,
  daily_percentage NUMERIC(5,2) NOT NULL CHECK (daily_percentage BETWEEN 0 AND 100),
  weekly_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  monthly_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  quarterly_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  yearly_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  in_progress_tasks INTEGER NOT NULL DEFAULT 0,
  not_done_tasks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, record_date)
);

CREATE TABLE ceo_remarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  ceo_user_id UUID NOT NULL REFERENCES users(id),
  remark TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'INFO',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generated_by UUID REFERENCES users(id),
  period report_period NOT NULL,
  department_id UUID REFERENCES departments(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  file_url TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_tasks_employee_date ON tasks(employee_id, task_date);
CREATE INDEX idx_performance_employee_date ON performance_records(employee_id, record_date);
CREATE INDEX idx_performance_department_date ON performance_records(department_id, record_date);
CREATE INDEX idx_audit_actor_created ON audit_logs(actor_id, created_at DESC);
