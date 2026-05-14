CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_config (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  church_name TEXT NOT NULL DEFAULT 'Shekinah Sons Global',
  tagline TEXT,
  city TEXT,
  country TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  address TEXT,
  youtube_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  whatsapp_url TEXT,
  live_stream_id TEXT,
  live_stream_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  hero_headline TEXT,
  hero_subheadline TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS verse_of_day (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  text TEXT,
  reference TEXT,
  theme TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO verse_of_day (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS sermons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  speaker TEXT NOT NULL,
  summary TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  duration_label TEXT,
  audio_url TEXT,
  video_url TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('audio', 'video', 'hybrid')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  artwork_url TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  reference TEXT NOT NULL,
  scripture_text TEXT NOT NULL,
  body TEXT NOT NULL,
  prayer TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS short_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  registration_url TEXT,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  leader TEXT NOT NULL,
  description TEXT NOT NULL,
  meeting_time_label TEXT NOT NULL,
  location TEXT NOT NULL,
  contact_phone TEXT,
  category TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bible_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  reference TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  request TEXT NOT NULL,
  urgency TEXT NOT NULL,
  pray_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prayer_request_prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, device_id)
);

CREATE TABLE IF NOT EXISTS prayer_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  testimony TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  completed JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  completed_devotions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL,
  frequency TEXT NOT NULL,
  status TEXT NOT NULL,
  phone TEXT NOT NULL,
  checkout_request_id TEXT,
  receipt_number TEXT,
  failure_reason TEXT,
  provider_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sermon_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id UUID NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sermons_published_at ON sermons (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_devotions_published_at ON devotions (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_short_clips_published_at ON short_clips (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events (starts_at ASC);
CREATE INDEX IF NOT EXISTS idx_bible_plan_day ON bible_plan (day ASC);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_request_created ON prayer_comments (request_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_donations_owner_created ON donations (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sermon_notes_user_sermon_created ON sermon_notes (user_id, sermon_id, created_at DESC);
