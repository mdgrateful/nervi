-- Create table for user-specific triggers and buffers
CREATE TABLE IF NOT EXISTS user_triggers_buffers (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trigger', 'buffer')),
  name TEXT NOT NULL,
  context TEXT[], -- e.g., ['work', 'family', 'social']
  confidence_score INT DEFAULT 1, -- increases as pattern repeats
  last_observed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_triggers_buffers_user_id ON user_triggers_buffers(user_id);
CREATE INDEX IF NOT EXISTS idx_triggers_buffers_type ON user_triggers_buffers(user_id, type);

-- Create table for daily check-ins (more structured than notes)
CREATE TABLE IF NOT EXISTS daily_checkins (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  checkin_date DATE NOT NULL,
  sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'okay', 'good')),
  energy_level TEXT CHECK (energy_level IN ('depleted', 'low', 'steady', 'high')),
  nervous_system_state TEXT CHECK (nervous_system_state IN ('shutdown', 'activated', 'mixed', 'regulated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(user_id, checkin_date DESC);

-- Create table for micro-actions
CREATE TABLE IF NOT EXISTS micro_actions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_date DATE NOT NULL,
  action_text TEXT NOT NULL,
  action_type TEXT, -- 'reset-flow', 'schedule-checkin', 'custom'
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_micro_actions_user_id ON micro_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_micro_actions_date ON micro_actions(user_id, action_date DESC);
CREATE INDEX IF NOT EXISTS idx_micro_actions_completed ON micro_actions(user_id, completed);

-- Create table for day-of-week patterns
CREATE TABLE IF NOT EXISTS day_of_week_patterns (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  common_theme TEXT,
  time_patterns TEXT[], -- e.g., ['afternoon-slump', 'morning-anxiety']
  effective_buffers TEXT[],
  common_triggers TEXT[],
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, day_of_week)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_day_patterns_user_id ON day_of_week_patterns(user_id);
