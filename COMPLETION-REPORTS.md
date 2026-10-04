# Assignment completion reports and historical cleanup

## Historical correction

The one-off repair used a fixed cutoff of 4 October 2026 UTC. It marked 49 tasks with both task date and creation time before that cutoff complete on their original task day. It removed 115 generated later-day carry-forward rows, not original task records. Today's new tasks were untouched. Original task values and generated day records are retained in `legacy_task_repair_backup` for recovery. Do not change the cutoff or rerun this script as routine deployment.

## Completion workflow

Started assignments appear in a separate Assigned tasks container, not the progress list. Pending assignments appear in progress with their completion form; completed assignments appear in progress with the employee's report. Required completion notes describe the outcome separately from the assigner's instructions. Optional media proof uses the existing format restrictions and 2 MB limit. Completed assignments without a report can receive their missing report without changing the completion timestamp.

Notes, completion status and proof are saved atomically. A row lock makes retries safe; already submitted reports are not overwritten. The original assigner can read the report and open/download proof even when the recipient's department is outside their general viewing permissions. Unrelated accounts remain blocked. The CEO and otherwise authorized task viewers can also read proof.

## Deployment and verification

The configured database has the new completion_note column and task_completion_media table. For a different environment apply only `server/database/migrate-completion-proof.sql`; historical cleanup is a separate explicitly authorized operation. Deploy frontend and backend together. The build and expanded `server/scripts/check-task-workflow.mjs` verify the workflow, including required notes and proof access for the employee, assigner and CEO.
