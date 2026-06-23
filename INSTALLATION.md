# Installation Guide

## 1. Environment

Install:

- Node.js 22+
- PostgreSQL 15+
- npm

Create `.env` from `.env.example` and set:

```txt
DATABASE_URL=postgres://postgres:postgres@localhost:5432/employee_performance
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
```

## 2. Install Dependencies

```bash
npm install
npm run install:all
```

## 3. Prepare PostgreSQL

```sql
CREATE DATABASE employee_performance;
```

```bash
psql "$DATABASE_URL" -f server/database/schema.sql
psql "$DATABASE_URL" -f server/database/seed.sql
```

## 4. Run Development Servers

```bash
npm run dev
```

Open:

```txt
http://localhost:5173
```

## 5. Build Frontend

```bash
npm run build
```

## 6. Run API Only

```bash
npm start
```

## 7. Deployment Checklist

- Set production `JWT_SECRET`
- Configure managed PostgreSQL
- Run schema through a migration system
- Restrict CORS to production frontend origin
- Add HTTPS
- Connect report export workers
- Add backup and retention policies
- Add observability for API latency, report generation, and failed logins
