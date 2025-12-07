# Life Story Map - Database Setup

## Quick Setup Instructions

### Step 1: Create Tables
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `create-life-story-tables.sql`
5. Click **Run** (or press `Ctrl+Enter`)
6. You should see a success message confirming tables were created

### Step 2: Create Indexes (Performance Optimization)
1. In the same SQL Editor, click **New Query**
2. Copy and paste the contents of `create-life-story-indexes.sql`
3. Click **Run**
4. You should see the indexes listed at the bottom

### Step 3: Verify Setup
Run this query to verify everything is set up correctly:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'nervi_life_%';

-- Check indexes exist
SELECT indexname
FROM pg_indexes
WHERE tablename LIKE 'nervi_life_%';
```

Expected output:
- 3 tables: `nervi_life_chapters`, `nervi_life_events`, `nervi_life_threads`
- 6+ indexes including `idx_chapters_user`, `idx_events_user`, etc.

## Database Schema Overview

### nervi_life_chapters
Stores life phases (e.g., "Early Childhood", "High School", "First Job")
- Defines age ranges
- Tracks dominant nervous system state for that period
- Orders chapters chronologically

### nervi_life_events
Stores specific memories/experiences within chapters
- Links to a chapter
- Records age, title, description
- Tracks nervous system state at the time
- Stores emotion tags and beliefs formed

### nervi_life_threads
Stores recurring patterns across multiple events
- Connects related events (e.g., all abandonment experiences)
- AI-discovered or manually created
- Color-coded for visualization
- Used to generate healing practices

## Troubleshooting

**Error: "relation already exists"**
- Tables are already created, skip Step 1

**Error: "permission denied"**
- Make sure you're using the correct Supabase project
- Check that you have admin access

**Indexes not improving performance?**
- Run `ANALYZE nervi_life_chapters;` (and same for other tables)
- This updates PostgreSQL query planner statistics

## What's Next?

After setup:
1. Visit http://localhost:3000/life-story
2. Click "Add Chapter" to create your first life phase
3. Add events to that chapter
4. Click "AI Analyze Chat History" to discover patterns
5. Click any event/thread to get healing practices
6. Add practices to your Master Schedule

---

**Need help?** Check the Supabase docs: https://supabase.com/docs/guides/database
