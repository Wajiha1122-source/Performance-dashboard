# Department performance viewers

Najum ul hassan and Bilal Riaz retain their employee role and their existing credentials. Database grants permit read-only performance access to SALES, FINANCE & INVENTORY, and DESIGN & ARCHITECTURE. IT is excluded. Other employees receive only their own dashboard data. CEO access is unchanged.

The Department performance sidebar entry uses the existing department, employee, and date-grouped progress views without comment editing or task mutation controls. Server responses enforce the scope, including responses after mutations. Existing ownership checks still restrict employee task changes to their own tasks.

## Deployment

Deploy both the server and client changes. The migration in `server/database/migrate-department-viewers.sql` has already been applied to the configured database, together with the two viewers' grants and six new Sales employees. For a different database, apply the migration before starting the updated server. Never recreate or reset existing accounts during deployment.

## Verification

`node server/scripts/check-department-access.mjs` tests authenticated local API responses against the configured database without modifying employee data. It checks the two viewers, two ordinary employees, CEO visibility, and denied CEO comment writes. The client production build also passed.

Credentials were delivered privately in the task response and are not stored in source files. The completed one-off account creation script was removed to prevent accidental reuse.
