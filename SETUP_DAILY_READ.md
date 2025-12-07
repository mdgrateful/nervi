# Nervi Daily Read Setup Instructions

This document explains how to set up the "Nervi's Read on Today" feature - a personalized daily companion card that learns from user patterns.

## What This Feature Does

The Daily Read card appears on the dashboard and provides:
- **Today's Theme**: Context-aware message based on day-of-week patterns and recent state
- **Things to Watch For**: Personalized warnings about likely triggers for today
- **Protective Moves**: Buffers/coping strategies that work for this specific user
- **Tiny Pact**: A single if-then commitment for the day
- **Micro Action**: Button to start a guided flow or schedule a check-in

The system **automatically learns** triggers and buffers from user notes over time.

## Database Setup

You need to run SQL in your Supabase Dashboard to create the required tables.

### Step 1: Create Core Tables

Go to Supabase Dashboard → SQL Editor → New Query, then run:

```sql
-- Notes table (if not already created)
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
```

### Step 2: Create Learning Tables

```sql
-- Triggers and Buffers (learned from user patterns)
CREATE TABLE IF NOT EXISTS user_triggers_buffers (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trigger', 'buffer')),
  name TEXT NOT NULL,
  context TEXT[], -- e.g., ['work', 'family', 'social']
  confidence_score INT DEFAULT 1, -- increases as pattern repeats
  last_observed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, type, name)
);

CREATE INDEX IF NOT EXISTS idx_triggers_buffers_user_id ON user_triggers_buffers(user_id);
CREATE INDEX IF NOT EXISTS idx_triggers_buffers_type ON user_triggers_buffers(user_id, type);

-- Daily Check-ins (structured tracking)
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

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(user_id, checkin_date DESC);

-- Micro Actions (tiny commitments for the day)
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

CREATE INDEX IF NOT EXISTS idx_micro_actions_user_id ON micro_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_micro_actions_date ON micro_actions(user_id, action_date DESC);
CREATE INDEX IF NOT EXISTS idx_micro_actions_completed ON micro_actions(user_id, completed);

-- Day-of-Week Patterns (learned over time)
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

CREATE INDEX IF NOT EXISTS idx_day_patterns_user_id ON day_of_week_patterns(user_id);
```

## How It Works

### 1. Automatic Learning

When a user submits a note, the system:
1. Analyzes the text for trigger keywords (criticism, being-ignored, overwhelm, etc.)
2. Analyzes the text for buffer keywords (walking, breathing, music, etc.)
3. Creates or increments confidence score for detected patterns
4. Stores them in `user_triggers_buffers` table

**Example:**
- User note: "Feeling anxious after my boss criticized my work. Took a walk to calm down."
- System detects: **Trigger**: "criticism", **Buffer**: "walking"
- Both get added/incremented in the database

### 2. Daily Read Generation

Every time the dashboard loads, `/api/nervi-daily-read` endpoint:
1. Fetches recent notes (last 2 weeks)
2. Fetches recent check-ins (last week)
3. Fetches user's top triggers and buffers (sorted by confidence)
4. Fetches day-of-week patterns
5. Generates personalized guidance based on all this data

### 3. Pattern Analysis

The system looks for:
- **Sleep patterns**: 3+ nights of poor sleep → "vulnerability hangover day"
- **Stress trends**: Multiple stressed notes this week → "running hot"
- **Day-of-week patterns**: "Mondays tend to be high-activation days for you"
- **Time-based patterns**: "Around 3-5pm you often get tired and scroll"

## Files Created

### API Routes
- `/app/api/nervi-daily-read/route.js` - Generates personalized daily read
- `/app/api/nervi-notes/route.js` - Updated with auto-learning
- `/app/api/triggers-buffers/route.js` - Manage triggers/buffers

### Components
- `/app/components/NerviDailyReadCard.js` - Daily read display card

### Utils
- `/app/utils/patternLearning.js` - Pattern detection algorithms

### Migrations
- `/supabase/migrations/create_nervi_notes_table.sql`
- `/supabase/migrations/create_daily_read_tables.sql`

## Testing the Feature

1. **Create the database tables** using the SQL above
2. **Submit some notes** on the Notes page with words like:
   - "feeling anxious after my boss criticized me" (detects "criticism" trigger)
   - "took a walk and felt better" (detects "walking" buffer)
   - "overwhelmed by too many tasks" (detects "overwhelm" trigger)
3. **Visit the dashboard** - you should see the Daily Read card
4. **Submit more notes over time** - the system gets smarter as confidence scores increase

## Intensity Settings

Users can adjust how direct/gentle the daily read is:
- **Light & Gentle**: Softer language, fewer warnings
- **Honest but Kind**: Balanced (default)
- **Full Pattern Mirror**: Most direct, all patterns shown

This setting can be stored in localStorage as `nerviReadIntensity`.

## Future Enhancements

Potential additions (not yet implemented):
- Auto-detect day-of-week patterns and save to `day_of_week_patterns` table
- Daily check-in form to populate `daily_checkins` table
- Guided reset flows for micro-actions
- Pattern visualization charts
- Export learned patterns

## Notes

- The auto-learning is non-blocking - if it fails, the note still saves
- Confidence scores increase each time a pattern is observed
- The system uses keyword matching for now (could be enhanced with ML later)
- All learning is user-specific and private
