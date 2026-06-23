# Employee Performance Dashboard

Enterprise-grade Employee Performance Dashboard / Task Performance Management System.

The project contains a premium React + Vite frontend, an Express API, a PostgreSQL schema, JWT authentication structure, role-based access control, analytics, reports, seed data, and installation guidance.

## Stack

- React + Vite
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React
- Node.js + Express
- PostgreSQL
- JWT Authentication
- Zod validation

## Demo Login

Use any seeded demo user with:

```txt
Email: ceo@company.test
Password: Password123!
```

Other starter user:

```txt
head@company.test
```

## Quick Start

```bash
cp .env.example .env
npm install
npm run install:all
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`

## Database Setup

Create the database:

```sql
CREATE DATABASE employee_performance;
```

Run schema and seed files:

```bash
psql "$DATABASE_URL" -f server/database/schema.sql
psql "$DATABASE_URL" -f server/database/seed.sql
```

## What Is Included

- Role model for CEO, Department Head, and Employee
- Secure login structure with bcrypt password hashing and JWT signing
- Protected API routes and RBAC middleware
- Department management routes
- Employee profile route with timeline
- Task create, update, delete, status, and delay reason routes
- Attendance rules where absence automatically produces 0% daily performance
- Performance engine using `Done = 100`, `In Progress = 50`, `Not Done = 0`
- Daily, weekly, monthly, quarterly, yearly, and custom reporting structure
- PostgreSQL schema for users, roles, departments, employees, attendance, tasks, performance records, CEO remarks, notifications, reports, and audit logs
- Premium SaaS interface with sidebar, topbar, filters, cards, tables, charts, progress rings, rankings, reports, notifications, audit timeline, and responsive states

## API Overview

```txt
POST /api/auth/login
POST /api/auth/password-reset/request
GET  /api/dashboard/summary
GET  /api/dashboard/departments
GET  /api/dashboard/employees
GET  /api/dashboard/activity
GET  /api/dashboard/reports
POST /api/manage/departments
PATCH /api/manage/departments/:id
GET  /api/manage/employees/:id
POST /api/manage/tasks
PATCH /api/manage/tasks/:id
DELETE /api/manage/tasks/:id
```

## Performance Rule

If an employee is absent:

```txt
Daily Performance = 0%
No task creation required
```

If present:

```txt
Daily Performance = Total Task Percentage / Number Of Tasks
```

Example:

```txt
100 + 50 + 0 = 150
150 / 3 = 50%
```

## Production Notes

The code is structured for production integration. Before deployment:

- Replace demo in-memory data with PostgreSQL repositories using `pg`
- Store bcrypt password hashes in the `users` table
- Use a long random `JWT_SECRET`
- Connect email delivery for password reset
- Add object storage for exported PDF and Excel files
- Add server-side pagination to large employee/task/report tables
- Add PDF and Excel generation jobs for long-running reports
- Add CI for linting, tests, build, and database migrations

## Project Structure

```txt
client/
  src/
    components/
    data/
    App.jsx
    main.jsx
    styles.css
server/
  database/
    schema.sql
    seed.sql
  src/
    config/
    middleware/
    routes/
    services/
    index.js
```
