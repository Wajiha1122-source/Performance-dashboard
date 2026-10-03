ALTER TABLE private_messages ADD COLUMN IF NOT EXISTS media BYTEA CHECK (octet_length(media) <= 10485760);
ALTER TABLE private_messages ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE private_messages ADD COLUMN IF NOT EXISTS media_name TEXT;
