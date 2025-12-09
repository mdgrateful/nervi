# Nervi 2-Week Program System - Implementation Summary

## Overview

I've implemented the core backend infrastructure for Nervi's 2-week nervous system program feature as specified in `nervi-2-week-program-spec.txt`. This transforms Nervi from reactive conversations into a proactive, personalized 14-day program.

---

## What Was Implemented ✅

### 1. Database Schema (`supabase-create-program-tables.sql`)

**Two new tables created:**

- **`nervi_programs`**: Stores 2-week programs
  - Tracks version, phase (A/B/C), dates, summary, focus points
  - Auto-deactivates old programs when new one is created
  - RLS enabled (users can only access their own programs)

- **`program_tasks`**: Stores individual practices/tasks
  - task_date, time_block, scheduled_time
  - **why_text** - The key personalization field (ties practice to user's patterns)
  - Completion tracking (completed, skipped, user_note)
  - RLS enabled (users can only access their own tasks)

**Key Features:**
- Automatic trigger to deactivate old programs
- Full RLS policies for data security
- Optimized indexes for performance

### 2. LLM Intelligence Layer (`lib/programGenerator.js`)

**Two sophisticated LLM functions:**

#### `extractUserProfile(userId, forcePhase?)`
- Analyzes last 30 days of memories, notes, life story
- Extracts: phase, main_states, top_triggers, body_signals, narrative_summary
- **Uses GPT-4 with trauma-informed prompting**
- Phase determination logic (A/B/C based on data maturity)

#### `generate14DayProgram(userId, profile, previousProgram?)`
- Creates 14-day personalized program
- Generates tasks with time_block, why_text, instructions
- **Anti-repetition logic** (uses previous program to vary practices)
- **Anti-botty prompting** (uses user's exact phrases, ties to specific patterns)

**Key Prompting Principles Implemented:**
- Use user's exact language ("stomach like a rock" if they said that)
- Tie practices to specific patterns (NOT generic wellness advice)
- Phase-appropriate recommendations
- Collaborative tone ("we're testing" not "you must do")
- Variation while keeping anchor practices

### 3. API Endpoints

#### **POST /api/program/generate**
Generates a new 2-week program:
1. Extracts user's nervous system profile via LLM
2. Generates 14-day personalized program via LLM
3. Creates `nervi_programs` row (version tracking)
4. Creates `program_tasks` for all 14 days
5. Deactivates previous programs (via trigger)
6. Logs to audit_logs
7. Returns formatted program with days grouped

**Optional body:**
```json
{
  "forcePhase": "A" | "B" | "C"  // For debugging
}
```

#### **GET /api/program/current**
Retrieves the active 2-week program:
- Returns program metadata + all tasks grouped by day
- Returns null if no active program
- Format:
  ```json
  {
    "program": { ...program data... },
    "days": [
      {
        "date": "2025-01-15",
        "dayNumber": 1,
        "tasks": [ ...tasks for this day... ]
      }
    ]
  }
  ```

#### **GET /api/program/status**
Checks if user has enough data to generate a program:
- Counts memories, notes, checkins (last 30 days)
- Minimum 5 data points required
- Returns recommended phase
- Helpful reasoning message
- Format:
  ```json
  {
    "hasActiveProgram": false,
    "hasEnoughData": true,
    "recommendedPhase": "A",
    "reasoning": "You have 12 conversations. Ready to build...",
    "dataPoints": { "memories": 8, "notes": 3, "checkins": 1, "total": 12 }
  }
  ```

---

## What Still Needs To Be Done 🚧

### 1. Frontend - `/program` Page

**Needs to be created:** `app/program/page.js`

Should include:
- Summary card with program.summary and focus_points
- 14-day calendar/list view showing all days and tasks
- Each task shows: time_block, title, **why_text** (the personalization)
- "Update my 2-week plan" button → calls POST /api/program/generate
- Metadata: "Version 3 — last updated May 5" using created_at
- Loading states while generating program

**Design Notes:**
- Mobile-first (most users will view on phone)
- Should feel calming, not overwhelming
- why_text should be prominent (this is what makes it personal)
- Consider expandable tasks for instructions
- Maybe highlight today's tasks

### 2. Task Completion Tracking

**Needs endpoint:** `POST /api/program/tasks/[taskId]/complete`

Update program_tasks:
- Set completed = true, completed_at = NOW()
- Optional: save user's reflection in user_note field

**Frontend:** Checkboxes on tasks, expand for reflection input

### 3. Push Notification Integration

**Needs:** Scheduler to send push notifications for upcoming tasks

Existing push system (`nervi_push_subscriptions`) should:
- Query program_tasks for today's/upcoming tasks
- Send push with:
  - title: task.title
  - body: Snippet from task.why_text (personalized reminder!)
  - scheduled at task.scheduled_time

**File to modify:** Check existing push scheduler logic

### 4. Navigation

**Add link to `/program` page:**
- `app/components/BottomNav.js` - Add program icon/link
- `app/components/SharedNav.js` - Desktop navigation

Suggested icon: 📅 or 🗓️ or 📋

### 5. Suggested UI Enhancements

**Dashboard Widget:**
- Show "Your program for today" card on `/dashboard`
- Quick view of today's 2-3 practices
- Link to full `/program` page

**Chat Integration:**
- When generating program, Nervi could mention: "I've built your 2-week plan. Check it out!"
- Link to `/program` in chat

**Empty State (No Program):**
- If GET /api/program/current returns null:
  - Check /api/program/status
  - If hasEnoughData: Show "Generate your first program" button
  - If NOT enough data: "Keep chatting with me for a few more days"

---

## How To Use (Setup Instructions)

### Step 1: Run Database Migration

In Supabase SQL Editor, run:
```sql
-- File: supabase-create-program-tables.sql
```

This creates `nervi_programs` and `program_tasks` tables with RLS.

### Step 2: Test API Endpoints

**Check status:**
```bash
GET /api/program/status
# Returns whether user has enough data to generate
```

**Generate first program:**
```bash
POST /api/program/generate
# Body: { "forcePhase": "A" }  # Optional, for testing

# This will:
# 1. Analyze last 30 days of conversations
# 2. Extract nervous system profile via GPT-4
# 3. Generate 14-day personalized program
# 4. Save to database
# Takes 10-30 seconds (2 LLM calls)
```

**Fetch current program:**
```bash
GET /api/program/current
# Returns program + 14 days of tasks
```

### Step 3: Build Frontend (Next Steps)

Create `/app/program/page.js` using the GET /current endpoint.

See "What Still Needs To Be Done" section above for details.

---

## Key Implementation Details

### Phase Logic

- **Phase A (Stabilization):** < 10 data points, focus on 2-3 reliable regulation tools
- **Phase B (Pattern Awareness):** 10-20 data points, mapping triggers and patterns
- **Phase C (Repatterning):** 20+ data points + clear patterns, behavior shifts

Phases auto-detected by LLM analyzing conversation maturity.

### Version Tracking

Each time user clicks "Update my 2-week plan":
- Version increments (version 1 → 2 → 3...)
- Old program set to `is_active = false`
- New program created with `is_active = true`
- Previous program used for anti-repetition

### Personalization Strategy

The "GPT-5.1 intelligence" comes from:
1. **Profile extraction** uses exact user phrases
2. **why_text** ties every practice to user's specific patterns
3. **Narrative summary** sounds like someone who knows their story
4. **Variation logic** keeps anchor practices, rotates others

Example why_text:
- ❌ Generic: "This breathing exercise will help you relax"
- ✅ Personalized: "This helps when your chest gets tight before meetings, like you mentioned on Tuesday"

### Anti-Repetition

- LLM receives previous program summary
- Explicitly instructed to:
  - Keep 1-2 anchor practices that worked
  - Rotate other items
  - Explain in why_text if repeating: "This worked for you last week when..."

---

## Files Created

1. **`supabase-create-program-tables.sql`** - Database schema
2. **`lib/programGenerator.js`** - LLM functions for profile + program generation
3. **`app/api/program/generate/route.js`** - POST endpoint to generate program
4. **`app/api/program/current/route.js`** - GET endpoint to fetch current program
5. **`app/api/program/status/route.js`** - GET endpoint to check readiness

---

## Next Steps for You

1. **Run the database migration** (supabase-create-program-tables.sql in Supabase)
2. **Test the API endpoints** via Postman/curl or just try generating a program
3. **Build the `/program` page frontend** (or ask me to do it!)
4. **Add navigation links** to BottomNav and SharedNav
5. **Integrate with push notifications** (scheduler for daily reminders)

---

## Testing Tips

**Force a specific phase:**
```bash
POST /api/program/generate
Body: { "forcePhase": "A" }  # Or "B" or "C"
```

**Check what data exists:**
```bash
GET /api/program/status
# Shows memory count, note count, etc.
```

**Regenerate program:**
Just call POST /api/program/generate again (version will increment)

---

## Questions?

This is a complex feature! Feel free to ask:
- How to build the frontend
- How to integrate with push notifications
- How to customize the LLM prompts
- How to add more task types
- Anything else!

---

**Status:** Backend complete ✅ | Frontend pending 🚧 | Push integration pending 🚧
