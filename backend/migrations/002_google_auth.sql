ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_sub TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'local';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_auth_provider_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_auth_provider_check
      CHECK (auth_provider IN ('local', 'google', 'hybrid'));
  END IF;
END $$;

UPDATE users
SET auth_provider = CASE
  WHEN google_sub IS NOT NULL AND password_hash IS NOT NULL THEN 'hybrid'
  WHEN google_sub IS NOT NULL THEN 'google'
  ELSE 'local'
END
WHERE auth_provider NOT IN ('local', 'google', 'hybrid');

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub
  ON users (google_sub)
  WHERE google_sub IS NOT NULL;
