-- ============================================================
-- NERVI APP - COMPLETE DATABASE SETUP
-- Run this SQL script in your Supabase SQL Editor
-- ============================================================

-- Create helper function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. USERS TABLE (Authentication)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  state TEXT,
  work_start_time TIME,
  work_end_time TIME,
  allow_work_notifications BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. USER PROFILES TABLE (Legacy compatibility)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  username TEXT,
  email TEXT,
  state TEXT,
  work_start_time TIME,
  work_end_time TIME,
  allow_work_notifications BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. NERVI NOTES TABLE (Journal entries)
-- ============================================================

CREATE TABLE IF NOT EXISTS nervi_notes (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity TEXT,
  feeling TEXT,
  body_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nervi_notes_user_id ON nervi_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_nervi_notes_created_at ON nervi_notes(created_at DESC);

-- ============================================================
-- 4. DAILY READ SYSTEM TABLES
-- ============================================================

-- User Triggers & Buffers
CREATE TABLE IF NOT EXISTS user_triggers_buffers (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trigger', 'buffer')),
  name TEXT NOT NULL,
  confidence_score INTEGER DEFAULT 1,
  last_observed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_triggers_buffers_user_id ON user_triggers_buffers(user_id);
CREATE INDEX IF NOT EXISTS idx_triggers_buffers_type ON user_triggers_buffers(type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_triggers_buffers_unique ON user_triggers_buffers(user_id, type, name);

-- Daily Check-ins
CREATE TABLE IF NOT EXISTS daily_checkins (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  checkin_date DATE NOT NULL,
  sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'ok', 'good')),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(checkin_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, checkin_date);

-- Micro Actions
CREATE TABLE IF NOT EXISTS micro_actions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_date DATE NOT NULL,
  pact_text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_micro_actions_user_id ON micro_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_micro_actions_date ON micro_actions(action_date DESC);

-- Day of Week Patterns
CREATE TABLE IF NOT EXISTS day_of_week_patterns (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  common_theme TEXT,
  observation_count INTEGER DEFAULT 1,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dow_patterns_user_id ON day_of_week_patterns(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dow_patterns_unique ON day_of_week_patterns(user_id, day_of_week);

-- ============================================================
-- SETUP COMPLETE!
-- ============================================================

-- Verify tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'users',
    'user_profiles',
    'nervi_notes',
    'user_triggers_buffers',
    'daily_checkins',
    'micro_actions',
    'day_of_week_patterns'
  )
ORDER BY table_name;
