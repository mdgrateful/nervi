-- Create nervi_notes table for tracking nervous system states
CREATE TABLE IF NOT EXISTS nervi_notes (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity TEXT,
  feeling TEXT,
  body_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_nervi_notes_user_id ON nervi_notes(user_id);

-- Create index on created_at for sorting and date-based queries
CREATE INDEX IF NOT EXISTS idx_nervi_notes_created_at ON nervi_notes(created_at DESC);

-- Add Row Level Security (RLS) policies if needed
-- ALTER TABLE nervi_notes ENABLE ROW LEVEL SECURITY;
