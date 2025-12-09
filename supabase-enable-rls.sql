-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) FOR ALL NERVI TABLES
-- ============================================================================
-- Run this in Supabase SQL Editor to secure your database
-- This ensures users can only access their own data
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nervi_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nervi_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_triggers_buffers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nervi_master_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nervi_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nervi_life_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_of_week_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nervi_life_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nervi_life_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nervi_embeddings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: Users can only access their own data
-- ============================================================================

-- Users table: Users can read and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Nervi Notes: Users can manage their own notes
DROP POLICY IF EXISTS "Users can view own notes" ON public.nervi_notes;
CREATE POLICY "Users can view own notes" ON public.nervi_notes
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own notes" ON public.nervi_notes;
CREATE POLICY "Users can insert own notes" ON public.nervi_notes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON public.nervi_notes;
CREATE POLICY "Users can update own notes" ON public.nervi_notes
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON public.nervi_notes;
CREATE POLICY "Users can delete own notes" ON public.nervi_notes
  FOR DELETE USING (auth.uid()::text = user_id);

-- Nervi Memories: Users can manage their own memories
DROP POLICY IF EXISTS "Users can view own memories" ON public.nervi_memories;
CREATE POLICY "Users can view own memories" ON public.nervi_memories
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own memories" ON public.nervi_memories;
CREATE POLICY "Users can insert own memories" ON public.nervi_memories
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own memories" ON public.nervi_memories;
CREATE POLICY "Users can update own memories" ON public.nervi_memories
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own memories" ON public.nervi_memories;
CREATE POLICY "Users can delete own memories" ON public.nervi_memories
  FOR DELETE USING (auth.uid()::text = user_id);

-- User Triggers/Buffers: Users can manage their own data
DROP POLICY IF EXISTS "Users can view own triggers_buffers" ON public.user_triggers_buffers;
CREATE POLICY "Users can view own triggers_buffers" ON public.user_triggers_buffers
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own triggers_buffers" ON public.user_triggers_buffers;
CREATE POLICY "Users can insert own triggers_buffers" ON public.user_triggers_buffers
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own triggers_buffers" ON public.user_triggers_buffers;
CREATE POLICY "Users can update own triggers_buffers" ON public.user_triggers_buffers
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own triggers_buffers" ON public.user_triggers_buffers;
CREATE POLICY "Users can delete own triggers_buffers" ON public.user_triggers_buffers
  FOR DELETE USING (auth.uid()::text = user_id);

-- Daily Check-ins: Users can manage their own check-ins
DROP POLICY IF EXISTS "Users can view own checkins" ON public.daily_checkins;
CREATE POLICY "Users can view own checkins" ON public.daily_checkins
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own checkins" ON public.daily_checkins;
CREATE POLICY "Users can insert own checkins" ON public.daily_checkins
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own checkins" ON public.daily_checkins;
CREATE POLICY "Users can update own checkins" ON public.daily_checkins
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own checkins" ON public.daily_checkins;
CREATE POLICY "Users can delete own checkins" ON public.daily_checkins
  FOR DELETE USING (auth.uid()::text = user_id);

-- Master Schedules: Users can manage their own schedules
DROP POLICY IF EXISTS "Users can view own schedules" ON public.nervi_master_schedules;
CREATE POLICY "Users can view own schedules" ON public.nervi_master_schedules
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own schedules" ON public.nervi_master_schedules;
CREATE POLICY "Users can insert own schedules" ON public.nervi_master_schedules
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own schedules" ON public.nervi_master_schedules;
CREATE POLICY "Users can update own schedules" ON public.nervi_master_schedules
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own schedules" ON public.nervi_master_schedules;
CREATE POLICY "Users can delete own schedules" ON public.nervi_master_schedules
  FOR DELETE USING (auth.uid()::text = user_id);

-- Push Subscriptions: Users can manage their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.nervi_push_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.nervi_push_subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.nervi_push_subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.nervi_push_subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.nervi_push_subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.nervi_push_subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.nervi_push_subscriptions;
CREATE POLICY "Users can delete own subscriptions" ON public.nervi_push_subscriptions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Micro Actions: Users can manage their own micro actions
DROP POLICY IF EXISTS "Users can view own micro_actions" ON public.micro_actions;
CREATE POLICY "Users can view own micro_actions" ON public.micro_actions
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own micro_actions" ON public.micro_actions;
CREATE POLICY "Users can insert own micro_actions" ON public.micro_actions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own micro_actions" ON public.micro_actions;
CREATE POLICY "Users can update own micro_actions" ON public.micro_actions
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own micro_actions" ON public.micro_actions;
CREATE POLICY "Users can delete own micro_actions" ON public.micro_actions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Life Chapters: Users can manage their own life chapters
DROP POLICY IF EXISTS "Users can view own chapters" ON public.nervi_life_chapters;
CREATE POLICY "Users can view own chapters" ON public.nervi_life_chapters
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own chapters" ON public.nervi_life_chapters;
CREATE POLICY "Users can insert own chapters" ON public.nervi_life_chapters
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own chapters" ON public.nervi_life_chapters;
CREATE POLICY "Users can update own chapters" ON public.nervi_life_chapters
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own chapters" ON public.nervi_life_chapters;
CREATE POLICY "Users can delete own chapters" ON public.nervi_life_chapters
  FOR DELETE USING (auth.uid()::text = user_id);

-- Day of Week Patterns: Users can manage their own patterns
DROP POLICY IF EXISTS "Users can view own patterns" ON public.day_of_week_patterns;
CREATE POLICY "Users can view own patterns" ON public.day_of_week_patterns
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own patterns" ON public.day_of_week_patterns;
CREATE POLICY "Users can insert own patterns" ON public.day_of_week_patterns
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own patterns" ON public.day_of_week_patterns;
CREATE POLICY "Users can update own patterns" ON public.day_of_week_patterns
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own patterns" ON public.day_of_week_patterns;
CREATE POLICY "Users can delete own patterns" ON public.day_of_week_patterns
  FOR DELETE USING (auth.uid()::text = user_id);

-- Password Reset Tokens: Users can only view their own tokens
DROP POLICY IF EXISTS "Users can view own reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Users can view own reset tokens" ON public.password_reset_tokens
  FOR SELECT USING (auth.uid()::text = user_id);

-- Audit Logs: Users can view their own audit logs (read-only)
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid()::text = user_id);

-- User Profiles: Users can manage their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
CREATE POLICY "Users can delete own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid()::text = user_id);

-- Life Threads: Users can manage their own life threads
DROP POLICY IF EXISTS "Users can view own threads" ON public.nervi_life_threads;
CREATE POLICY "Users can view own threads" ON public.nervi_life_threads
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own threads" ON public.nervi_life_threads;
CREATE POLICY "Users can insert own threads" ON public.nervi_life_threads
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own threads" ON public.nervi_life_threads;
CREATE POLICY "Users can update own threads" ON public.nervi_life_threads
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own threads" ON public.nervi_life_threads;
CREATE POLICY "Users can delete own threads" ON public.nervi_life_threads
  FOR DELETE USING (auth.uid()::text = user_id);

-- Life Events: Users can manage their own life events
DROP POLICY IF EXISTS "Users can view own events" ON public.nervi_life_events;
CREATE POLICY "Users can view own events" ON public.nervi_life_events
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own events" ON public.nervi_life_events;
CREATE POLICY "Users can insert own events" ON public.nervi_life_events
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own events" ON public.nervi_life_events;
CREATE POLICY "Users can update own events" ON public.nervi_life_events
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own events" ON public.nervi_life_events;
CREATE POLICY "Users can delete own events" ON public.nervi_life_events
  FOR DELETE USING (auth.uid()::text = user_id);

-- Embeddings: Users can manage their own embeddings
DROP POLICY IF EXISTS "Users can view own embeddings" ON public.nervi_embeddings;
CREATE POLICY "Users can view own embeddings" ON public.nervi_embeddings
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own embeddings" ON public.nervi_embeddings;
CREATE POLICY "Users can insert own embeddings" ON public.nervi_embeddings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own embeddings" ON public.nervi_embeddings;
CREATE POLICY "Users can update own embeddings" ON public.nervi_embeddings
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own embeddings" ON public.nervi_embeddings;
CREATE POLICY "Users can delete own embeddings" ON public.nervi_embeddings
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- DONE! Your database is now secured with RLS
-- ============================================================================
-- All tables now have Row Level Security enabled
-- Users can only access their own data
-- Your API routes using service role key will still work normally
-- ============================================================================
