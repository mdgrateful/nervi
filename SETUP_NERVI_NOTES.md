# Nervi Notes Database Setup

To complete the Nervi Notes feature, you need to create the database table in Supabase.

## Steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the SQL below
6. Click "Run" or press Ctrl+Enter

## SQL to Run:

```sql
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

## What This Creates:

- **nervi_notes table** with columns:
  - `id` - Unique identifier for each note
  - `user_id` - User who created the note
  - `activity` - What the user was doing
  - `feeling` - How they were feeling
  - `body_location` - Where they felt it in their body
  - `created_at` - Timestamp of when the note was created

- **Indexes** for better query performance:
  - Index on `user_id` for fast user-specific queries
  - Index on `created_at` for sorting and date-based queries

## After Running:

Once the table is created, the Nervi Notes page will be fully functional at http://localhost:3010/notes

You'll be able to:
- Submit new notes about your nervous system states
- View all your past notes
- See pattern analysis based on your entries
- Delete notes you no longer want
