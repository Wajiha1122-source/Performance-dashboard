DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('normal', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS priority task_priority NOT NULL DEFAULT 'normal';

ALTER TABLE ceo_remarks
  ADD COLUMN IF NOT EXISTS remark_date DATE NOT NULL DEFAULT CURRENT_DATE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ceo_remark_employee_date
  ON ceo_remarks(employee_id, remark_date);
