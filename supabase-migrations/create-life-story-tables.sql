-- =====================================================
-- Life Story Map - Database Tables
-- =====================================================
-- Run this in Supabase SQL Editor to create all required tables

-- Table 1: Life Chapters (timeline segments)
CREATE TABLE IF NOT EXISTS nervi_life_chapters (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    age_range_start INTEGER,
    age_range_end INTEGER,
    dominant_state TEXT, -- 'hypervigilant', 'hyper', 'shutdown', 'hypo', 'numb', 'regulated', etc.
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Life Events (specific memories/experiences)
CREATE TABLE IF NOT EXISTS nervi_life_events (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    chapter_id INTEGER REFERENCES nervi_life_chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    age INTEGER,
    description TEXT,
    nervous_system_state TEXT, -- 'hypervigilant', 'hyper', 'shutdown', 'hypo', 'numb', 'regulated', etc.
    emotion_tags JSONB DEFAULT '[]'::jsonb, -- Array of emotion strings: ["fear", "shame", "anger"]
    key_beliefs JSONB DEFAULT '[]'::jsonb, -- Array of belief strings: ["I'm not safe", "I must be perfect"]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 3: Life Threads (recurring patterns across events)
CREATE TABLE IF NOT EXISTS nervi_life_threads (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL, -- e.g., "Mother Wound", "Abandonment Pattern"
    description TEXT,
    color TEXT DEFAULT '#8b5cf6', -- Hex color for visualization
    event_ids JSONB DEFAULT '[]'::jsonb, -- Array of event IDs connected to this thread
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nervi_life_chapters_updated_at
    BEFORE UPDATE ON nervi_life_chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nervi_life_events_updated_at
    BEFORE UPDATE ON nervi_life_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nervi_life_threads_updated_at
    BEFORE UPDATE ON nervi_life_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Confirm tables were created
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('nervi_life_chapters', 'nervi_life_events', 'nervi_life_threads')
ORDER BY table_name, ordinal_position;
