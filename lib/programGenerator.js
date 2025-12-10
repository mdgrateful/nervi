import OpenAI from "openai";
import { supabase } from "./supabase";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extract nervous system profile from user's conversation history
 * Uses GPT-4 to analyze patterns, states, triggers from memories/notes
 *
 * @param {string} userId - The user's ID
 * @param {string} forcePhase - Optional phase override for debugging ('A', 'B', or 'C')
 * @returns {Promise<Object>} Profile with phase, states, triggers, body signals, narrative
 */
export async function extractUserProfile(userId, forcePhase = null) {
  try {
    if (!supabase) {
      throw new Error("Supabase client not configured");
    }

    // Gather recent conversation data
    const [memories, notes, lifeStory, profile] = await Promise.all([
      getRecentMemories(userId, 30), // Last 30 days
      getRecentNotes(userId, 30),
      getLifeStorySnippets(userId),
      getUserProfile(userId),
    ]);

    // Build context for LLM
    const context = buildProfileContext(memories, notes, lifeStory, profile);

    // Call OpenAI to extract profile
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use latest GPT-4 for best intelligence
      messages: [
        {
          role: "system",
          content: PROFILE_EXTRACTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: context,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const profileData = JSON.parse(completion.choices[0].message.content);

    // Apply force phase if specified (for debugging)
    if (forcePhase && ['A', 'B', 'C'].includes(forcePhase)) {
      profileData.phase = forcePhase;
    }

    return profileData;
  } catch (error) {
    console.error("Error extracting user profile:", error);
    throw new Error("Failed to generate nervous system profile");
  }
}

/**
 * Generate a 14-day program based on user profile
 * Creates personalized practices tied to user's specific patterns
 *
 * @param {string} userId - The user's ID
 * @param {Object} profile - User's nervous system profile from extractUserProfile
 * @param {Object} previousProgram - Optional summary of last program
 * @returns {Promise<Object>} 14-day program with tasks
 */
export async function generate14DayProgram(userId, profile, previousProgram = null) {
  try {
    if (!supabase) {
      throw new Error("Supabase client not configured");
    }

    // Get user's schedule preferences
    const userProfile = await getUserProfile(userId);
    const timezone = userProfile.timezone || 'America/New_York';
    const wakeTime = userProfile.wake_time || '7:00 AM';
    const workHours = userProfile.work_hours || '9-5';

    // Build program generation context
    const context = buildProgramContext(profile, userProfile, previousProgram);

    // Call OpenAI to generate program
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: PROGRAM_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: context,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8, // Slightly higher for creative variation
    });

    const programData = JSON.parse(completion.choices[0].message.content);

    // Validate and enrich the program
    const enrichedProgram = enrichProgramData(programData, profile, userProfile);

    return enrichedProgram;
  } catch (error) {
    console.error("Error generating 14-day program:", error);
    throw new Error("Failed to generate 14-day program");
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getRecentMemories(userId, days = 30) {
  const { data, error } = await supabase
    .from("nervi_memories")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

async function getRecentNotes(userId, days = 30) {
  const { data, error } = await supabase
    .from("nervi_notes")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data || [];
}

async function getLifeStorySnippets(userId) {
  const { data: chapters } = await supabase
    .from("nervi_life_chapters")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false })
    .limit(5);

  const { data: events } = await supabase
    .from("nervi_life_events")
    .select("*")
    .eq("user_id", userId)
    .order("event_date", { ascending: false })
    .limit(10);

  return { chapters: chapters || [], events: events || [] };
}

async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

function buildProfileContext(memories, notes, lifeStory, userProfile) {
  const conversationHistory = memories
    .map((m) => `[${new Date(m.created_at).toLocaleDateString()}] ${m.memory_text}`)
    .join("\n\n");

  const userNotes = notes
    .map((n) => `[${new Date(n.created_at).toLocaleDateString()}] ${n.note_text}`)
    .join("\n\n");

  const lifeContext = [
    ...lifeStory.chapters.map((c) => `Chapter: ${c.title} (${c.description})`),
    ...lifeStory.events.map((e) => `Event: ${e.title} - ${e.description}`),
  ].join("\n");

  return `User Profile Context:

Timezone: ${userProfile.timezone || 'Not specified'}
Location/State: ${userProfile.state || 'Not specified'}
Work Hours: ${userProfile.work_hours || 'Not specified'}

Recent Conversation History (last 30 days):
${conversationHistory}

User's Personal Notes:
${userNotes}

Life Story Context:
${lifeContext}

Based on this information, extract the user's nervous system profile.`;
}

function buildProgramContext(profile, userProfile, previousProgram) {
  let context = `Nervous System Profile:
Phase: ${profile.phase}
Main States: ${profile.main_states?.join(", ") || "Unknown"}
Top Triggers: ${profile.top_triggers?.join(", ") || "Unknown"}
Body Signals: ${profile.body_signals?.join(", ") || "Unknown"}

Narrative Summary:
${profile.narrative_summary}

User Schedule:
- Timezone: ${userProfile.timezone || 'America/New_York'}
- Wake Time: ${userProfile.wake_time || '7:00 AM'}
- Work Hours: ${userProfile.work_hours || '9-5'}
- State/Location: ${userProfile.state || 'Not specified'}
`;

  if (previousProgram) {
    context += `\n\nPrevious Program (for reference - don't repeat exactly):
${previousProgram.summary}
Key Practices: ${previousProgram.key_practices?.join(", ") || "None"}
`;
  }

  context += `\n\nGenerate a 14-day nervous system regulation program for this user.`;

  return context;
}

function enrichProgramData(programData, profile, userProfile) {
  // Ensure each task has required fields
  const enrichedDays = programData.days.map((day, index) => {
    const taskDate = new Date();
    taskDate.setDate(taskDate.getDate() + index);

    return {
      date: taskDate.toISOString().split('T')[0],
      tasks: day.tasks.map((task, taskIndex) => ({
        ...task,
        task_order: taskIndex,
        phase: profile.phase,
        scheduled_time: task.time_block === 'morning' ? '08:00:00'
          : task.time_block === 'midday' ? '12:00:00'
          : task.time_block === 'evening' ? '18:00:00'
          : task.time_block === 'night' ? '21:00:00'
          : task.scheduled_time || null,
      })),
    };
  });

  return {
    program_summary: programData.program_summary,
    focus_points: programData.focus_points || [],
    days: enrichedDays,
    phase: profile.phase,
  };
}

// ============================================================================
// LLM System Prompts (The "GPT-5.1 Intelligence")
// ============================================================================

const PROFILE_EXTRACTION_SYSTEM_PROMPT = `You are a trauma-informed nervous system specialist analyzing a person's conversation history with their AI companion.

Your task is to extract a nervous system profile in JSON format with these fields:

{
  "phase": "A" | "B" | "C",
  "main_states": ["anxious", "numb", "wired", etc.],
  "top_triggers": ["mornings before work", "late-night scrolling", "conflict with partner", etc.],
  "body_signals": ["chest tight", "stomach knots", "jaw clenched", etc.],
  "narrative_summary": "2-3 sentence summary using the person's own words and phrases"
}

PHASE DETERMINATION:
- Phase A (Stabilization): User needs basic regulation tools. Limited data, high distress, or just starting.
- Phase B (Pattern Awareness): User has some regulation capacity and enough data to identify recurring patterns.
- Phase C (Repatterning): User understands their patterns and is ready for behavior/identity shifts.

CRITICAL INSTRUCTIONS:
1. Use the person's EXACT phrases when possible (e.g., "stomach like a rock" if they said that)
2. Be specific - not "work stress" but "anxiety before Monday morning meetings"
3. The narrative should sound like someone who KNOWS this person's story, not generic wellness advice
4. If there's limited data (< 5 conversation entries), default to Phase A
5. Look for patterns in timing, situations, relationships, and physical sensations

Return ONLY valid JSON.`;

const PROGRAM_GENERATION_SYSTEM_PROMPT = `You are a trauma-informed nervous system specialist creating a personalized 14-day regulation program.

Your task is to generate a program in JSON format:

{
  "program_summary": "2-3 sentence paragraph describing the focus for these 2 weeks",
  "focus_points": ["Focus area 1", "Focus area 2", "Focus area 3"],
  "days": [
    {
      "tasks": [
        {
          "title": "Practice name",
          "task_type": "grounding" | "breathing" | "journaling" | "movement" | "rest" | "connection",
          "time_block": "morning" | "midday" | "evening" | "night",
          "instructions": "Short, optional instructions",
          "why_text": "1-2 sentences tying this practice to the user's specific patterns using their own language",
          "duration_minutes": 5
        }
      ]
    }
  ]
}

CRITICAL INSTRUCTIONS FOR ANTI-BOTTY, PERSONALIZED PROGRAMS:

1. USE THE USER'S LANGUAGE:
   - If they said "stomach like a rock" → use that exact phrase in why_text
   - If they mentioned "Sunday scaries" → reference that specifically
   - Never use generic "reduce stress" language

2. TIE EVERYTHING TO SPECIFIC PATTERNS:
   - NOT: "This breathing exercise will help you relax"
   - YES: "This helps when your chest gets tight before meetings, like you mentioned on Tuesday"

3. PHASE-APPROPRIATE PRACTICES:
   - Phase A: 2-3 simple, reliable regulation tools (grounding, basic breathing)
   - Phase B: Pattern mapping exercises (journaling about triggers, body scans to notice signals)
   - Phase C: Small behavior shifts based on their patterns

4. COLLABORATIVE TONE:
   - Use "we're testing", "this gives your system", "we're building"
   - NOT commands: "You must do X"

5. VARIATION & REPETITION:
   - Keep 1-2 "anchor" practices that work
   - Rotate other items to avoid repetition
   - Explain in why_text if repeating: "This worked for you last week when..."

6. REALISTIC SCHEDULE:
   - Don't overload - 2-4 practices per day maximum
   - Consider their work hours
   - Morning practices before work, evening for wind-down

7. AVOID GENERIC WELLNESS:
   - NOT: "Practice gratitude to improve mood"
   - YES: "Write down 1 thing that felt safe today - you mentioned safety is hard to feel lately"

Return ONLY valid JSON with exactly 14 days.`;
