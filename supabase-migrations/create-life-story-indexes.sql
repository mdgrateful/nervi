-- =====================================================
-- Life Story Map - Performance Indexes
-- =====================================================
-- Run this in Supabase SQL Editor after creating the tables
-- This will speed up queries for life story data

-- Index for fast chapter lookups by user
CREATE INDEX IF NOT EXISTS idx_chapters_user
ON nervi_life_chapters(user_id);

-- Index for fast event lookups by user
CREATE INDEX IF NOT EXISTS idx_events_user
ON nervi_life_events(user_id);

-- Index for fast event lookups by chapter (for timeline rendering)
CREATE INDEX IF NOT EXISTS idx_events_chapter
ON nervi_life_events(chapter_id);

-- Index for fast thread lookups by user
CREATE INDEX IF NOT EXISTS idx_threads_user
ON nervi_life_threads(user_id);

-- Optional: Composite index for events by user AND chapter (even faster)
CREATE INDEX IF NOT EXISTS idx_events_user_chapter
ON nervi_life_events(user_id, chapter_id);

-- Optional: Index for sorting events by age within chapters
CREATE INDEX IF NOT EXISTS idx_events_age
ON nervi_life_events(chapter_id, age);

-- Confirm indexes were created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('nervi_life_chapters', 'nervi_life_events', 'nervi_life_threads')
ORDER BY tablename, indexname;
