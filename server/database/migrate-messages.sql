CREATE TABLE IF NOT EXISTS private_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  audio BYTEA,
  audio_type TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  UNIQUE(sender_id, client_id),
  CHECK(sender_id <> recipient_id),
  CHECK(length(body) <= 4000),
  CHECK(length(trim(body)) > 0 OR audio IS NOT NULL),
  CHECK(audio IS NULL OR octet_length(audio) <= 2097152)
);
CREATE INDEX IF NOT EXISTS idx_private_messages_pair ON private_messages(sender_id,recipient_id,id);
CREATE INDEX IF NOT EXISTS idx_private_messages_unread ON private_messages(recipient_id) WHERE read_at IS NULL;
