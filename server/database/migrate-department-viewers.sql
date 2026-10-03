CREATE TABLE IF NOT EXISTS department_view_permissions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id,department_id)
);
