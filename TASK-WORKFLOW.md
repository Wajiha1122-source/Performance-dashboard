# Assignments and daily carry-forward

## User behaviour

- CEO accounts and the existing Najum ul hassan / Bilal Riaz accounts have Assign tasks access. They can choose any active employee, a category title, description, start date and end date. The end date is a deadline, not a stop date.
- Future assignments show Scheduled to their assigner and enter the employee's task list on the start date. Active tasks show Started. After 24 hours from the later of creation time and start-date midnight, an unfinished task shows Pending.
- Each unfinished task appears on subsequent days until completed. Past unfinished daily records show Pending, and completion updates the completion day's record to Complete without changing earlier Pending records. Completed tasks stop appearing on following days.
- Employees mark their own active tasks Complete; task deletion remains blocked. Reopening completed tasks is not provided.
- The assigner sees their own assignments and current status, including overdue deadlines. This does not expand department progress permissions or private chat access.
- Daily tasks are visible without opening a Progress toggle. Existing filters show dated daily records. Carried/assigned tasks are not counted as a new employee submission.

## Implementation and deployment

`server/database/migrate-task-workflow.sql` adds assignment permissions, deadline/completion metadata and task_days keyed by task and date. The configured database migration was applied. Existing unfinished tasks participate in carry-forward; existing completed tasks use their prior updated_at date as the available completion-date approximation.

Day boundaries use UTC, consistent with the existing portal's dates. Daily records are synchronized when dashboards/assignment lists are read, including days missed while nobody was logged in. Open visible dashboards refresh every 30 seconds and on returning to the window; there is no separate scheduled worker or requirement for a page to stay open overnight.

Deploy both frontend and backend to enable the interface and routes. For another database, run `node server/scripts/migrate-task-workflow.mjs` before deploying the server. Do not reset employee records or credentials.

## Verification

`node server/scripts/check-task-workflow.mjs` uses disposable accounts/tasks and removes them afterward. It tests assignment permission checks, scheduled tasks, duplicate submission protection, invalid date ranges, owner-only completion, 23/25-hour thresholds, repeated carry-forward beyond the deadline, historical Pending preservation, completion visibility for the assigner, and completed tasks disappearing from later days. The client production build is checked separately. Browser visual testing and live deployment are not part of these API checks.
