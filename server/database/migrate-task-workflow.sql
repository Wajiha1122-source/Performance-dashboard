BEGIN;
CREATE TABLE IF NOT EXISTS task_assigners(user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE);
INSERT INTO task_assigners(user_id) SELECT id FROM users WHERE lower(email) IN ('najum.ul.hassan@fjgroup.pk','bilal.riaz@fjgroup.pk') ON CONFLICT DO NOTHING;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignment_key UUID;
CREATE UNIQUE INDEX IF NOT EXISTS task_assignment_retry ON tasks(assigned_by,assignment_key) WHERE assignment_key IS NOT NULL;
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'IN_PROGRESS';
UPDATE tasks SET completed_at=GREATEST(updated_at,task_date::timestamp AT TIME ZONE 'UTC') WHERE status='DONE' AND completed_at IS NULL;
CREATE TABLE IF NOT EXISTS task_days(
 task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
 day DATE NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('Started','Pending','Complete')),
 PRIMARY KEY(task_id,day)
);
CREATE OR REPLACE FUNCTION sync_task_days(at_time TIMESTAMPTZ DEFAULT NOW()) RETURNS void LANGUAGE sql AS $$
 INSERT INTO task_days(task_id,day,status)
 SELECT t.id, d::date,
 CASE WHEN t.completed_at IS NOT NULL AND d::date >= (t.completed_at AT TIME ZONE 'UTC')::date THEN 'Complete'
      WHEN d::date < (at_time AT TIME ZONE 'UTC')::date THEN 'Pending'
      WHEN at_time >= GREATEST(t.created_at,t.task_date::timestamp AT TIME ZONE 'UTC') + interval '24 hours' THEN 'Pending'
      ELSE 'Started' END
 FROM tasks t CROSS JOIN LATERAL generate_series(t.task_date::timestamp,
 LEAST(COALESCE((t.completed_at AT TIME ZONE 'UTC')::date,(at_time AT TIME ZONE 'UTC')::date),(at_time AT TIME ZONE 'UTC')::date)::timestamp,interval '1 day') d
 ON CONFLICT(task_id,day) DO UPDATE SET status=EXCLUDED.status WHERE task_days.status IS DISTINCT FROM EXCLUDED.status;
$$;
CREATE OR REPLACE FUNCTION set_task_completion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status='DONE' AND NEW.completed_at IS NULL THEN NEW.completed_at=NOW(); END IF;
 IF TG_OP='UPDATE' AND OLD.completed_at IS NOT NULL AND (NEW.status<>'DONE' OR NEW.completed_at IS DISTINCT FROM OLD.completed_at) THEN
  RAISE EXCEPTION 'Completed tasks cannot be reopened';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS task_completion ON tasks;
CREATE TRIGGER task_completion BEFORE INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_task_completion();
SELECT sync_task_days();
COMMIT;
