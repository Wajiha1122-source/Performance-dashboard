BEGIN;
CREATE TABLE IF NOT EXISTS task_media (
 task_id UUID PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
 name TEXT NOT NULL, mime TEXT NOT NULL, bytes BYTEA NOT NULL CHECK(octet_length(bytes)<=2097152)
);
CREATE TABLE IF NOT EXISTS task_edits (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
 edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 before_data JSONB NOT NULL, after_data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS task_edits_task ON task_edits(task_id,id);
CREATE OR REPLACE FUNCTION record_task_edit() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b JSONB; a JSONB;
BEGIN
 b=jsonb_build_object('title',OLD.title,'description',OLD.description,'priority',OLD.priority,'status',OLD.status,'reason',OLD.reason);
 a=jsonb_build_object('title',NEW.title,'description',NEW.description,'priority',NEW.priority,'status',NEW.status,'reason',NEW.reason);
 IF b IS DISTINCT FROM a THEN INSERT INTO task_edits(task_id,before_data,after_data) VALUES(NEW.id,b,a); END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS task_edit_audit ON tasks;
CREATE TRIGGER task_edit_audit AFTER UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION record_task_edit();
COMMIT;
