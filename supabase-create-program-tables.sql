-- ============================================================================
-- NERVI 2-WEEK PROGRAM SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- Run this in Supabase SQL Editor to create program tables
-- ============================================================================

-- Table: nervi_programs
-- Stores 2-week nervous system programs generated for users
CREATE TABLE IF NOT EXISTS public.nervi_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  phase TEXT NOT NULL CHECK (phase IN ('A', 'B', 'C', 'stabilization', 'awareness', 'repatterning')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  summary TEXT NOT NULL, -- Program summary paragraph
  focus_points JSONB, -- Array of 3 focus points for display
  previous_program_summary TEXT, -- Summary of last program for LLM context
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: program_tasks
-- Stores individual tasks/practices within a 2-week program
CREATE TABLE IF NOT EXISTS public.program_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.nervi_programs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,

  -- Task identification
  task_date DATE NOT NULL,
  task_order INTEGER NOT NULL DEFAULT 0, -- Order within the day

  -- Task details
  title TEXT NOT NULL,
  task_type TEXT NOT NULL, -- e.g. 'grounding', 'breathing', 'journaling', 'movement'
  time_block TEXT, -- 'morning', 'midday', 'evening', 'night'
  scheduled_time TIME, -- Optional specific time
  duration_minutes INTEGER, -- Optional estimated duration

  -- Personalization
  why_text TEXT NOT NULL, -- 1-2 sentences explaining why this practice
  instructions TEXT, -- Optional detailed instructions

  -- Tracking
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT false,
  user_note TEXT, -- User's reflection after completing

  -- Metadata
  phase TEXT, -- Copy of program phase for easy filtering
  plan_version INTEGER, -- Copy of program version
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_programs_user_active
  ON public.nervi_programs(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_programs_user_dates
  ON public.nervi_programs(user_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_program_tasks_program
  ON public.program_tasks(program_id);

CREATE INDEX IF NOT EXISTS idx_program_tasks_user_date
  ON public.program_tasks(user_id, task_date);

CREATE INDEX IF NOT EXISTS idx_program_tasks_scheduled
  ON public.program_tasks(task_date, scheduled_time)
  WHERE NOT completed AND NOT skipped;

-- Enable RLS
ALTER TABLE public.nervi_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own programs and tasks

-- nervi_programs policies
DROP POLICY IF EXISTS "Users can view own programs" ON public.nervi_programs;
CREATE POLICY "Users can view own programs" ON public.nervi_programs
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own programs" ON public.nervi_programs;
CREATE POLICY "Users can insert own programs" ON public.nervi_programs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own programs" ON public.nervi_programs;
CREATE POLICY "Users can update own programs" ON public.nervi_programs
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own programs" ON public.nervi_programs;
CREATE POLICY "Users can delete own programs" ON public.nervi_programs
  FOR DELETE USING (auth.uid()::text = user_id);

-- program_tasks policies
DROP POLICY IF EXISTS "Users can view own program tasks" ON public.program_tasks;
CREATE POLICY "Users can view own program tasks" ON public.program_tasks
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own program tasks" ON public.program_tasks;
CREATE POLICY "Users can insert own program tasks" ON public.program_tasks
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own program tasks" ON public.program_tasks;
CREATE POLICY "Users can update own program tasks" ON public.program_tasks
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own program tasks" ON public.program_tasks;
CREATE POLICY "Users can delete own program tasks" ON public.program_tasks
  FOR DELETE USING (auth.uid()::text = user_id);

-- Function to automatically deactivate old programs when a new one is created
CREATE OR REPLACE FUNCTION deactivate_old_programs()
RETURNS TRIGGER AS $$
BEGIN
  -- Deactivate all other programs for this user
  UPDATE public.nervi_programs
  SET is_active = false, updated_at = NOW()
  WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to deactivate old programs
DROP TRIGGER IF EXISTS trigger_deactivate_old_programs ON public.nervi_programs;
CREATE TRIGGER trigger_deactivate_old_programs
  AFTER INSERT ON public.nervi_programs
  FOR EACH ROW
  EXECUTE FUNCTION deactivate_old_programs();

-- ============================================================================
-- DONE! Program tables created with RLS enabled
-- ============================================================================
-- Tables created:
-- - nervi_programs: Stores 2-week programs (version tracking, phase, dates, summary)
-- - program_tasks: Stores individual tasks with why_text, time_block, completion tracking
-- ============================================================================
